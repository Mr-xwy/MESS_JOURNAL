package com.example.blog.service;

import com.example.blog.common.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
  * AI 助手服务：优先直连 OpenRouter；无 key 时回退本地 Python ai-assistant 代理。
  *
  * <p>优化点（v2）： 1) 异步非阻塞：改用 JDK 内置 HttpClient（自带虚拟线程池），Controller 以 CompletableFuture 返回，调用大模型期间不占用
  * Tomcat 请求线程 —— 并发高时不再把线程池占满。 2) 流式输出：新增 streamAsync，开启 OpenRouter stream:true，逐 token 回调（供 SSE
  * 端点使用）。 3) 会话历史防泄漏：按用户隔离的会话增加 TTL（默认 30 分钟）与容量上限（默认 5000）， 由守护线程定时回收，避免长驻服务内存被无限撑大。
  */
@Service
public class AiService {

    @Value("${openrouter.api-key:}")
    private String openrouterApiKey;

    @Value("${openrouter.model:deepseek/deepseek-chat:free}")
    private String openrouterModel;

    @Value("${openrouter.base-url:https://openrouter.ai/api/v1/chat/completions}")
    private String openrouterBaseUrl;

    @Value("${ai.python-url:http://localhost:8000/api/ai/chat}")
    private String pythonUrl;

    /** 单个用户会话历史的最大保留条数（轮次 * 2）。 */
    @Value("${ai.session.max-sessions:5000}")
    private long maxSessions;

    /** 会话空闲多久后视为过期（分钟）。 */
    @Value("${ai.session.ttl-minutes:30}")
    private long sessionTtlMinutes;

    private static final int MAX_HISTORY_ROUNDS = 10;

    private static final String SYSTEM_PROMPT =
            "你是 M.E.S.S Journal（Method / Experiment / Survey / Summary）站内 AI 助手，"
                    + "一位擅长学术期刊与知识整理的学者。回答请简洁、准确、有逻辑，必要时使用中文。";

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** 共享异步 HTTP 客户端：自带虚拟线程执行器，调用期间不占用 Tomcat 线程。 */
    private final HttpClient httpClient =
            HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .executor(Executors.newVirtualThreadPerTaskExecutor())
                    .build();

    /** 按 username 隔离的对话历史，带 TTL 与容量上限，防止内存泄漏。 */
    private final ConcurrentHashMap<String, SessionEntry> sessionHistories =
            new ConcurrentHashMap<>();

    /** 守护线程定时回收过期/超额会话。 */
    private final ScheduledExecutorService reaper =
            Executors.newSingleThreadScheduledExecutor(
                    r -> {
                        Thread t = new Thread(r, "ai-session-reaper");
                        t.setDaemon(true);
                        return t;
                    });

    public AiService() {
        reaper.scheduleAtFixedRate(this::reapSessions, 5, 5, TimeUnit.MINUTES);
    }

    // ===================== 对外 API =====================

    /** 异步提问（非阻塞）：返回 CompletableFuture，调用方（Controller）据此释放 Tomcat 线程。 */
    public CompletableFuture<String> askAsync(String question, String username) {
        if (question == null || question.isBlank()) {
            return CompletableFuture.failedFuture(new BusinessException("问题不能为空"));
        }
        if (openrouterApiKey != null && !openrouterApiKey.isBlank()) {
            return callOpenRouterAsync(question, username);
        }
        return callPythonProxyAsync(question, username);
    }

    /** 流式提问（非阻塞）：逐 token 回调 onToken；SSE 端点使用。 无 OpenRouter key 时退化为一次性返回完整答案。 */
    public CompletableFuture<Void> streamAsync(
            String question, String username, Consumer<String> onToken) {
        if (question == null || question.isBlank()) {
            return CompletableFuture.failedFuture(new BusinessException("问题不能为空"));
        }
        if (openrouterApiKey != null && !openrouterApiKey.isBlank()) {
            return streamOpenRouterAsync(question, username, onToken);
        }
        return callPythonProxyAsync(question, username).thenAccept(onToken);
    }

    // ===================== OpenRouter（缓冲） =====================

    private CompletableFuture<String> callOpenRouterAsync(String question, String username) {
        String sessionId = sessionIdOf(username);
        List<Map<String, String>> messages = buildMessages(sessionId, question);

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", openrouterModel);
        ArrayNode messagesNode = body.putArray("messages");
        for (Map<String, String> msg : messages) {
            ObjectNode msgNode = messagesNode.addObject();
            msgNode.put("role", msg.get("role"));
            msgNode.put("content", msg.get("content"));
        }

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            return CompletableFuture.failedFuture(new BusinessException("构造请求失败：" + e.getMessage()));
        }

        HttpRequest request = buildRequest(jsonBody);

        return httpClient
                .sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(
                        resp -> {
                            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                                throw new BusinessException("AI 服务返回 HTTP " + resp.statusCode());
                            }
                            String rawBody = resp.body();
                            if (rawBody == null || rawBody.isBlank()) {
                                throw new BusinessException("AI 服务返回了空响应");
                            }
                            try {
                                JsonNode root = objectMapper.readTree(rawBody);
                                JsonNode choices = root.path("choices");
                                if (!choices.isArray() || choices.isEmpty()) {
                                    throw new BusinessException("AI 返回格式异常，缺少 choices");
                                }
                                String answer = choices.get(0).path("message").path("content").asText();
                                if (answer == null || answer.isBlank()) {
                                    throw new BusinessException("AI 返回内容为空");
                                }
                                recordTurn(sessionId, question, answer);
                                return answer;
                            } catch (BusinessException e) {
                                throw e;
                            } catch (Exception e) {
                                throw new BusinessException("解析 AI 响应失败：" + e.getMessage());
                            }
                        });
    }

    // ===================== OpenRouter（流式 SSE） =====================

    private CompletableFuture<Void> streamOpenRouterAsync(
            String question, String username, Consumer<String> onToken) {
        String sessionId = sessionIdOf(username);
        List<Map<String, String>> messages = buildMessages(sessionId, question);

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", openrouterModel);
        body.put("stream", true);
        ArrayNode messagesNode = body.putArray("messages");
        for (Map<String, String> msg : messages) {
            ObjectNode msgNode = messagesNode.addObject();
            msgNode.put("role", msg.get("role"));
            msgNode.put("content", msg.get("content"));
        }

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            return CompletableFuture.failedFuture(new BusinessException("构造请求失败：" + e.getMessage()));
        }

        HttpRequest request = buildRequest(jsonBody);

        return httpClient
                .sendAsync(request, HttpResponse.BodyHandlers.ofInputStream())
                .thenAccept(
                        resp -> {
                            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                                throw new BusinessException("AI 服务返回 HTTP " + resp.statusCode());
                            }
                            StringBuilder full = new StringBuilder();
                            try (BufferedReader reader =
                                    new BufferedReader(new InputStreamReader(resp.body(), StandardCharsets.UTF_8))) {
                                String line;
                                while ((line = reader.readLine()) != null) {
                                    if (!line.startsWith("data:")) continue;
                                    String data = line.substring(5).trim();
                                    if (data.isEmpty() || "[DONE]".equals(data)) continue;
                                    try {
                                        JsonNode node = objectMapper.readTree(data);
                                        JsonNode choices = node.path("choices");
                                        if (choices.isArray() && !choices.isEmpty()) {
                                            String delta = choices.get(0).path("delta").path("content").asText("");
                                            if (!delta.isEmpty()) {
                                                full.append(delta);
                                                onToken.accept(delta);
                                            }
                                        }
                                    } catch (Exception ignored) {
                                        // 跳过不完整/心跳帧，避免中断整个流
                                    }
                                }
                            } catch (IOException e) {
                                throw new BusinessException("读取 AI 流失败：" + e.getMessage());
                            }
                            if (full.length() == 0) {
                                throw new BusinessException("AI 返回内容为空");
                            }
                            recordTurn(sessionId, question, full.toString());
                        });
    }

    // ===================== Python 代理（回退） =====================

    private CompletableFuture<String> callPythonProxyAsync(String question, String username) {
        String sessionId = sessionIdOf(username);
        String jsonBody;
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("question", question);
            body.put("session_id", sessionId);
            jsonBody = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            return CompletableFuture.failedFuture(new BusinessException("构造请求失败：" + e.getMessage()));
        }

        HttpRequest request =
                HttpRequest.newBuilder()
                        .uri(URI.create(pythonUrl))
                        .timeout(Duration.ofSeconds(120))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

        return httpClient
                .sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(
                        resp -> {
                            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                                throw new BusinessException("AI 服务返回 HTTP " + resp.statusCode());
                            }
                            String rawBody = resp.body();
                            if (rawBody == null || rawBody.isBlank()) {
                                throw new BusinessException("AI 服务返回了空响应");
                            }
                            try {
                                JsonNode root = objectMapper.readTree(rawBody);
                                String answer = root.path("answer").asText();
                                if (answer == null || answer.isBlank()) {
                                    throw new BusinessException("AI 返回内容为空");
                                }
                                return answer;
                            } catch (BusinessException e) {
                                throw e;
                            } catch (Exception e) {
                                throw new BusinessException("解析 AI 响应失败：" + e.getMessage());
                            }
                        });
    }

    // ===================== 内部工具 =====================

    private HttpRequest buildRequest(String jsonBody) {
        return HttpRequest.newBuilder()
                .uri(URI.create(openrouterBaseUrl))
                .timeout(Duration.ofSeconds(120))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + openrouterApiKey)
                .header("HTTP-Referer", "http://localhost:8080")
                .header("X-Title", "M.E.S.S Journal")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
    }

    private static String sessionIdOf(String username) {
        return (username == null || username.isBlank()) ? "default" : username;
    }

    /** 构造 OpenRouter 消息列表：system prompt + 历史 + 当前问题。 */
    private List<Map<String, String>> buildMessages(String sessionId, String question) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

        SessionEntry entry = sessionHistories.get(sessionId);
        if (entry != null) {
            synchronized (entry.history) {
                entry.lastAccess = System.currentTimeMillis();
                messages.addAll(entry.history);
            }
        }
        messages.add(Map.of("role", "user", "content", question));
        return messages;
    }

    /** 记录一轮问答到对应会话历史，控制历史长度，并刷新访问时间。 */
    private void recordTurn(String sessionId, String question, String answer) {
        SessionEntry entry = getOrCreateEntry(sessionId);
        synchronized (entry.history) {
            entry.history.add(Map.of("role", "user", "content", question));
            entry.history.add(Map.of("role", "assistant", "content", answer));
            while (entry.history.size() > MAX_HISTORY_ROUNDS * 2) {
                entry.history.remove(0);
                entry.history.remove(0);
            }
            entry.lastAccess = System.currentTimeMillis();
        }
    }

    private SessionEntry getOrCreateEntry(String sessionId) {
        SessionEntry entry = sessionHistories.get(sessionId);
        if (entry != null) return entry;
        if (sessionHistories.size() >= maxSessions) {
            reapSessions();
        }
        SessionEntry created = new SessionEntry();
        SessionEntry prev = sessionHistories.putIfAbsent(sessionId, created);
        return prev != null ? prev : created;
    }

    /** 回收过期/超额会话，防止内存泄漏。 */
    private void reapSessions() {
        try {
            long now = System.currentTimeMillis();
            long ttl = sessionTtlMinutes * 60_000L;
            sessionHistories.entrySet().removeIf(e -> now - e.getValue().lastAccess > ttl);
            if (sessionHistories.size() > maxSessions) {
                sessionHistories.entrySet().stream()
                        .sorted(Comparator.comparingLong(e -> e.getValue().lastAccess))
                        .limit(sessionHistories.size() - maxSessions)
                        .map(java.util.Map.Entry::getKey)
                        .toList()
                        .forEach(sessionHistories::remove);
            }
        } catch (Exception ignored) {
            // 回收失败不应影响主流程
        }
    }

    /** 单用户会话：历史列表 + 最近访问时间（用于 TTL）。 */
    private static final class SessionEntry {
        final List<Map<String, String>> history = new ArrayList<>();
        volatile long lastAccess = System.currentTimeMillis();
    }
}
