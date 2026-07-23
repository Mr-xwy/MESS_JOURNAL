package com.example.blog.controller;

import com.example.blog.common.Result;
import com.example.blog.dto.AnnouncementRequest;
import com.example.blog.service.AnnouncementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    /** 公告列表（公开，含当前用户已读标记） */
    @GetMapping
    public Result<?> list(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.success(announcementService.list(userId));
    }

    /** 公告详情（公开） */
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Long id) {
        return Result.success(announcementService.get(id));
    }

    /** 标记已读（需登录） */
    @PostMapping("/{id}/read")
    public Result<?> markRead(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        announcementService.markRead(id, userId);
        return Result.success("已读");
    }

    /** 发布公告（管理员） */
    @PostMapping
    public Result<?> create(@Valid @RequestBody AnnouncementRequest req, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String username = (String) request.getAttribute("username");
        String role = (String) request.getAttribute("role");
        return Result.success(announcementService.create(req, userId, username, role));
    }

    /** 修改公告（管理员） */
    @PutMapping("/{id}")
    public Result<?> update(
            @PathVariable Long id,
            @Valid @RequestBody AnnouncementRequest req,
            HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        return Result.success(announcementService.update(id, req, role));
    }

    /** 删除公告（管理员） */
    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id, HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        announcementService.delete(id, role);
        return Result.success("已删除");
    }
}
