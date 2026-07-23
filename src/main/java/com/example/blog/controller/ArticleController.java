package com.example.blog.controller;

import com.example.blog.common.PageResult;
import com.example.blog.common.Result;
import com.example.blog.dto.ArticleRequest;
import com.example.blog.dto.StatusRequest;
import com.example.blog.entity.Article;
import com.example.blog.entity.ArticleStatus;
import com.example.blog.service.ArticleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    /** 列表（公开只读）：支持分类/关键词/分页；mine=true 仅看自己的（含草稿） */
    @GetMapping
    public Result<?> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(defaultValue = "false") boolean mine,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Long authorId = null;
        if (mine) {
            if (userId == null) return Result.error(401, "请先登录");
            authorId = userId;
        }
        Page<Article> p = articleService.list(category, keyword, authorId, page, size);
        return Result.success(PageResult.of(p));
    }

    /** 详情（公开只读，已下线/草稿受权限限制） */
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        return Result.success(articleService.detail(id, userId, role));
    }

    /** 发布 / 存草稿（需登录） */
    @PostMapping
    public Result<?> create(@Valid @RequestBody ArticleRequest req, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String username = (String) request.getAttribute("username");
        return Result.success(articleService.create(req, userId, username));
    }

    /** 修改（作者本人或 ADMIN） */
    @PutMapping("/{id}")
    public Result<?> update(
            @PathVariable Long id, @Valid @RequestBody ArticleRequest req, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        return Result.success(articleService.update(id, req, userId, role));
    }

    /** 删除（作者本人或 ADMIN） */
    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        articleService.delete(id, userId, role);
        return Result.success("删除成功");
    }

    /** 下线 / 恢复（MODERATOR 或 ADMIN） */
    @PatchMapping("/{id}/status")
    public Result<?> status(
            @PathVariable Long id, @Valid @RequestBody StatusRequest req, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        ArticleStatus status = ArticleStatus.valueOf(req.getStatus());
        return Result.success(articleService.changeStatus(id, status, userId, role));
    }

    /** 点赞 / 取消点赞（需登录） */
    @PostMapping("/{id}/like")
    public Result<?> like(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.success(articleService.toggleLike(id, userId));
    }

    /** 收藏 / 取消收藏（需登录） */
    @PostMapping("/{id}/favorite")
    public Result<?> favorite(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(articleService.toggleFavorite(id, userId));
    }

    /** 我的收藏（需登录）：返回收藏的文章列表，按收藏时间倒序 */
    @GetMapping("/favorites/mine")
    public Result<?> myFavorites(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(articleService.listFavorites(userId));
    }
}
