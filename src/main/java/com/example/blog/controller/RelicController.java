package com.example.blog.controller;

import com.example.blog.common.PageResult;
import com.example.blog.common.Result;
import com.example.blog.dto.RelicRequest;
import com.example.blog.dto.ReviewRequest;
import com.example.blog.entity.Relic;
import com.example.blog.service.RelicService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/relics")
@RequiredArgsConstructor
public class RelicController {

    private final RelicService relicService;

    /** 公开列表（已上线文物） */
    @GetMapping
    public Result<?> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
        Page<Relic> p = relicService.listPublished(page, size);
        return Result.success(PageResult.of(p));
    }

    /** 我的提交（需登录） */
    @GetMapping("/mine")
    public Result<?> mine(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(relicService.listMine(userId));
    }

    /** 详情（已上线公开；待审 / 驳回有权限限制） */
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        return Result.success(relicService.detail(id, userId, role));
    }

    /** 提交 / 发布：管理员直接上线，普通用户进入待审 */
    @PostMapping
    public Result<?> create(@Valid @RequestBody RelicRequest req, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String username = (String) request.getAttribute("username");
        String role = (String) request.getAttribute("role");
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(relicService.create(req, userId, username, role));
    }

    /** 编辑文物（作者本人或管理员） */
    @PutMapping("/{id}")
    public Result<?> update(
            @PathVariable Long id, @Valid @RequestBody RelicRequest req, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        return Result.success(relicService.update(id, req, userId, role));
    }

    /** 审核信息箱（仅管理员 / 审核员） */
    @GetMapping("/inbox")
    public Result<?> inbox(HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        return Result.success(relicService.inbox(role));
    }

    /** 审核通过 / 驳回（仅管理员 / 审核员） */
    @PostMapping("/{id}/review")
    public Result<?> review(
            @PathVariable Long id, @Valid @RequestBody ReviewRequest req, HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        String role = (String) request.getAttribute("role");
        return Result.success(relicService.review(id, req, username, role));
    }

    /** 删除（作者本人或管理员） */
    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        relicService.delete(id, userId, role);
        return Result.success("删除成功");
    }
}
