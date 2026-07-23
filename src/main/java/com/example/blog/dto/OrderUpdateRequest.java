package com.example.blog.dto;

import lombok.Data;

@Data
public class OrderUpdateRequest {
    /** 目标状态：PAID（标记付款）/ CANCELLED（取消） */
    private String status;
}
