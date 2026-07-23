package com.example.blog.controller;

import com.example.blog.common.Result;
import com.example.blog.entity.Article;
import com.example.blog.service.ArticleService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hot")
@RequiredArgsConstructor
public class HotController {

    private final ArticleService articleService;

    /** 热点榜：已发布文章按点赞量倒序，limit 控制条数 */
    @GetMapping
    public Result<?> hot(@RequestParam(defaultValue = "10") int limit) {
        List<Article> list = articleService.hot(limit);
        return Result.success(list);
    }
}
