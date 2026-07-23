package com.example.blog.controller;

import com.example.blog.common.Result;
import com.example.blog.dto.PuzzleScoreRequest;
import com.example.blog.dto.ScoreUpdateRequest;
import com.example.blog.entity.Puzzle;
import com.example.blog.entity.Score;
import com.example.blog.service.PuzzleService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/puzzles")
@RequiredArgsConstructor
public class PuzzleController {

    private final PuzzleService puzzleService;

    /** 今日词方（公开） */
    @GetMapping("/today")
    public Result<?> today() {
        Puzzle p = puzzleService.getTodayPuzzle();
        return Result.success(p);
    }

    /** 榜单（公开） */
    @GetMapping("/leaderboard")
    public Result<?> leaderboard(
            @RequestParam(required = false) String date, @RequestParam(required = false) String key) {
        List<Score> list = puzzleService.leaderboard(date, key);
        return Result.success(list);
    }

    /** 提交成绩（需登录） */
    @PostMapping("/scores")
    public Result<?> submit(@RequestBody PuzzleScoreRequest req, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String username = (String) request.getAttribute("username");
        if (userId == null) return Result.error(401, "请先登录");
        Map<String, Object> r =
                puzzleService.submit(userId, username, req.getDate(), req.getKey(), req.getSeconds());
        return Result.success(r);
    }

    /** 我的成绩（需登录） */
    @GetMapping("/scores/mine")
    public Result<?> mine(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String key,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(puzzleService.myScore(userId, date, key));
    }

    /** 修改成绩（本人或管理员） */
    @PutMapping("/scores/{id}")
    public Result<?> updateScore(
            @PathVariable Long id,
            @Valid @RequestBody ScoreUpdateRequest req,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        return Result.success(puzzleService.updateScore(id, req.getSeconds(), userId, role));
    }

    /** 删除成绩（本人或管理员） */
    @DeleteMapping("/scores/{id}")
    public Result<?> deleteScore(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        puzzleService.deleteScore(id, userId, role);
        return Result.success("删除成功");
    }
}
