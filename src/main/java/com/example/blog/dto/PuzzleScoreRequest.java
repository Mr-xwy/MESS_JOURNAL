package com.example.blog.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PuzzleScoreRequest {

    /** 谜题日期 yyyy-MM-dd（不传则用今天） */
    private String date;

    /** 词方标识（不传则用今日词方） */
    private String key;

    /** 完成用时（秒） */
    @NotNull(message = "用时不能为空")
    private Integer seconds;
}
