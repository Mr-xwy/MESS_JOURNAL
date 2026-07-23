package com.example.blog.dto;

import lombok.Data;

@Data
public class StatusRequest {
    /** PUBLISHED（恢复）/ OFFLINE（下线） */
    private String status;
}
