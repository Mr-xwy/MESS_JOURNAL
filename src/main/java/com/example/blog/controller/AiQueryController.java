package com.example.blog.controller;

import com.example.blog.common.Result;
import com.example.blog.entity.Article;
import com.example.blog.entity.ArticleStatus;
import com.example.blog.repository.ArticleRepository;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

/**
  * AI 助手内部查询接口（无需 JWT）。 仅限本机 Python ai-assistant 服务调用，返回结构化博客数据供 AI 检索。
  *
  * <p>支持的 query_type： - hot_articles : 点赞量最高的文章排行 - recent_articles : 最新发布的文章 - categories :
  * 所有分类及各分类文章数 - article_search : 按关键词搜索文章 - site_stats : 网站总览统计
  */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiQueryController {

    private final ArticleRepository articleRepository;

    @GetMapping("/query")
    public Result<?> query(
            @RequestParam String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "10") int limit) {

        return switch (type) {
            case "hot_articles" -> hotArticles(limit);
            case "recent_articles" -> recentArticles(limit);
            case "categories" -> categories();
            case "article_search" -> articleSearch(keyword, limit);
            case "site_stats" -> siteStats();
            default ->
                    Result.error(
                            400,
                            "不支持的查询类型: "
                                    + type
                                    + "。可选值: hot_articles, recent_categories, categories, article_search,"
                                    + " site_stats");
        };
    }

    /** 点赞量最高的文章（已发布） */
    private Result<?> hotArticles(int limit) {
        var list =
                articleRepository
                        .findAll(
                                (root, q, cb) -> cb.equal(root.get("status"), ArticleStatus.PUBLISHED),
                                PageRequest.of(
                                        0,
                                        Math.min(limit, 50),
                                        Sort.by(Sort.Direction.DESC, "likeCount")
                                                .and(Sort.by(Sort.Direction.DESC, "publishedAt"))))
                        .getContent();
        return Result.success(formatArticles(list, "按点赞量降序"));
    }

    /** 最新发布的文章 */
    private Result<?> recentArticles(int limit) {
        var list =
                articleRepository
                        .findAll(
                                (root, q, cb) -> cb.equal(root.get("status"), ArticleStatus.PUBLISHED),
                                PageRequest.of(0, Math.min(limit, 50), Sort.by(Sort.Direction.DESC, "publishedAt")))
                        .getContent();
        return Result.success(formatArticles(list, "按发布时间降序"));
    }

    /** 所有分类及各分类文章数量 */
    private Result<?> categories() {
        var all = articleRepository.findByStatus(ArticleStatus.PUBLISHED);
        Map<String, Long> categoryCount =
                all.stream()
                        .filter(a -> a.getCategory() != null && !a.getCategory().isBlank())
                        .collect(Collectors.groupingBy(Article::getCategory, Collectors.counting()));
        long total = all.size();
        long uncategorized =
                all.stream().filter(a -> a.getCategory() == null || a.getCategory().isBlank()).count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalPublished", total);
        result.put("uncategorized", uncategorized);
        result.put("categories", categoryCount);
        result.put("_说明", "网站共有 " + total + " 篇已发布文章，分布在 " + categoryCount.size() + " 个分类中");
        return Result.success(result);
    }

    /** 按关键词搜索文章标题/摘要 */
    private Result<?> articleSearch(String keyword, int limit) {
        if (keyword == null || keyword.isBlank()) {
            return Result.error(400, "搜索关键词不能为空");
        }
        String kw = "%" + keyword.trim() + "%";
        var list =
                articleRepository
                        .findAll(
                                (root, q, cb) ->
                                        cb.and(
                                                cb.equal(root.get("status"), ArticleStatus.PUBLISHED),
                                                cb.or(cb.like(root.get("title"), kw), cb.like(root.get("summary"), kw))),
                                PageRequest.of(0, Math.min(limit, 20)))
                        .getContent();
        if (list.isEmpty()) {
            return Result.success(
                    Map.of(
                            "found", 0, "keyword", keyword.trim(), "_说明", "未找到与「" + keyword.trim() + "」相关的文章"));
        }
        return Result.success(formatArticles(list, "搜索关键词: " + keyword.trim()));
    }

    /** 网站总体统计 */
    private Result<?> siteStats() {
        long total = articleRepository.count();
        long published = articleRepository.countByStatus(ArticleStatus.PUBLISHED);
        long draft = articleRepository.countByStatus(ArticleStatus.DRAFT);
        long offline = articleRepository.countByStatus(ArticleStatus.OFFLINE);

        // 点赞总量
        long totalLikes =
                articleRepository.findAll().stream()
                        .mapToLong(a -> a.getLikeCount() != null ? a.getLikeCount() : 0L)
                        .sum();

        // 最受欢迎的文章
        var topArticle =
                articleRepository
                        .findAll(
                                (root, q, cb) -> cb.equal(root.get("status"), ArticleStatus.PUBLISHED),
                                PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "likeCount")))
                        .stream()
                        .findFirst()
                        .orElse(null);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("总文章数", total);
        stats.put("已发布", published);
        stats.put("草稿", draft);
        stats.put("已下线", offline);
        stats.put("总点赞数", totalLikes);
        if (topArticle != null) {
            stats.put("最受欢迎文章", topArticle.getTitle() + "（点赞:" + topArticle.getLikeCount() + "）");
            stats.put("最受欢迎作者", topArticle.getAuthorName());
        }
        return Result.success(stats);
    }

    /** 将文章列表格式化为 AI 友好的结构化文本 */
    private Map<String, Object> formatArticles(List<Article> articles, String orderBy) {
        List<Map<String, Object>> items = new ArrayList<>();
        int rank = 1;
        for (Article a : articles) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("排名", rank++);
            item.put("标题", a.getTitle());
            item.put("作者", a.getAuthorName());
            item.put("分类", a.getCategory() != null ? a.getCategory() : "未分类");
            item.put("点赞数", a.getLikeCount());
            item.put(
                    "发布时间",
                    a.getPublishedAt() != null ? a.getPublishedAt().toString().replace("T", " ") : "");
            item.put("摘要", truncate(a.getSummary(), 120));
            items.add(item);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("count", items.size());
        result.put("orderBy", orderBy);
        result.put("articles", items);
        return result;
    }

    private static String truncate(String s, int maxLen) {
        if (s == null) return "";
        if (s.length() <= maxLen) return s;
        return s.substring(0, maxLen) + "...";
    }
}
