package com.example.blog.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScoreUpdateRequest {
    /** 完成用时（秒） */
    @NotNull(message = "用时不能为空")
    private Integer seconds;
}
