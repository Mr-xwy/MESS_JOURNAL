package com.example.blog.controller;

import com.example.blog.common.Result;
import com.example.blog.dto.UpdateUserRequest;
import com.example.blog.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** 获取当前登录用户信息（需登录） */
    @GetMapping("/info")
    public Result<?> info(@RequestAttribute("userId") Long userId) {
        return Result.success(userService.toVo(userService.info(userId)));
    }

    /** 修改昵称/邮箱/头像/密码（需登录） */
    @PutMapping("/info")
    public Result<?> update(
            @RequestAttribute("userId") Long userId, @Valid @RequestBody UpdateUserRequest req) {
        return Result.success(userService.toVo(userService.updateInfo(userId, req)));
    }

    /** 注销 / 删除用户（本人可注销，管理员可删除任意用户） */
    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id, HttpServletRequest request) {
        Long operatorId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        userService.deleteUser(id, operatorId, role);
        return Result.success("删除成功");
    }
}
