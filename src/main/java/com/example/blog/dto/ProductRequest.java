package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ProductRequest {

    @NotBlank(message = "标题不能为空")
    private String title;

    private String description;

    @NotNull(message = "价格不能为空")
    private BigDecimal price;

    private String image; // base64 图片

    private String category; // 分类：瓷器 / 书画 / 玉器 / 钱币 / 杂项

    private String itemCondition; // 成色：全新 / 九五新 / 八成新 / 有瑕疵
}
