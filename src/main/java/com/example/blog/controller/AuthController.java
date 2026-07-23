package com.example.blog.controller;

import com.example.blog.common.Result;
import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.RegisterRequest;
import com.example.blog.service.UserService;
import com.example.blog.util.TokenBlacklist;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final TokenBlacklist blacklist;

    @PostMapping("/register")
    public Result<?> register(@Valid @RequestBody RegisterRequest req) {
        userService.register(req);
        return Result.success("注册成功");
    }

    @PostMapping("/login")
    public Result<?> login(@Valid @RequestBody LoginRequest req) {
        return Result.success(userService.login(req));
    }

    @PostMapping("/logout")
    public Result<?> logout(HttpServletRequest request) {
        String jti = (String) request.getAttribute("jti");
        if (jti != null) blacklist.add(jti);
        return Result.success("已注销");
    }
}
