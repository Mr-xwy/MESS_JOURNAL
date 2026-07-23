package com.example.blog.controller;

import com.example.blog.common.BusinessException;
import com.example.blog.common.Result;
import com.example.blog.dto.AiChatRequest;
import com.example.blog.service.AiService;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
  * AI 助手接口。
  *
  * <p>受 JwtInterceptor 保护（/api/** 除登录与公开读接口外均要求合法令牌），未登录返回 401。
  *
  * <p>真正的 AI 能力由 OpenRouter（已配 key 时直连）或独立的 Python + LangChain 微服务（ai-assistant）提供。
  */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    /** 缓冲式问答：Controller 以 CompletableFuture 返回，调用大模型期间释放 Tomcat 线程。 */
    @PostMapping("/chat")
    public CompletableFuture<Result<String>> chat(
            @RequestBody AiChatRequest req, @RequestAttribute("username") String username) {
        return aiService
                .askAsync(req.getQuestion(), username)
                .thenApply(Result::success)
                .exceptionally(
                        ex -> {
                            Throwable cause = (ex.getCause() != null) ? ex.getCause() : ex;
                            String msg =
                                    (cause instanceof BusinessException)
                                            ? cause.getMessage()
                                            : "调用 AI 失败：" + cause.getMessage();
                            return Result.error(500, msg);
                        });
    }

    /** 流式问答（SSE）：逐 token 推送给前端，长回答也有即时反馈。 */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(
            @RequestBody AiChatRequest req, @RequestAttribute("username") String username) {
        SseEmitter emitter = new SseEmitter(120_000L);
        aiService
                .streamAsync(
                        req.getQuestion(),
                        username,
                        token -> {
                            try {
                                emitter.send(SseEmitter.event().data(token));
                            } catch (IOException e) {
                                emitter.completeWithError(e);
                            }
                        })
                .whenComplete(
                        (v, ex) -> {
                            if (ex != null) {
                                Throwable cause = (ex.getCause() != null) ? ex.getCause() : ex;
                                try {
                                    emitter.send(SseEmitter.event().data("[ERROR] " + cause.getMessage()));
                                } catch (IOException ignored) {
                                }
                                emitter.completeWithError(cause);
                            } else {
                                emitter.complete();
                            }
                        });
        return emitter;
    }
}
