package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewRequest {

    /** APPROVE=通过上线；REJECT=驳回退回 */
    @NotBlank(message = "审核动作不能为空")
    private String action;

    /** 驳回时填写的审核意见 */
    private String note;
}
