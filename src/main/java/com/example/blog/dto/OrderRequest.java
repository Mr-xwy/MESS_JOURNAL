package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderRequest {

    @NotNull(message = "商品ID不能为空")
    private Long productId;

    @NotBlank(message = "收货人不能为空")
    private String contactName;

    private String contactPhone;

    @NotBlank(message = "收货地址不能为空")
    private String contactAddress;

    private String note; // 买家留言
}
