package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ArticleRequest {
    @NotBlank(message = "标题不能为空")
    private String title;

    private String content;
    private String summary;
    private String category;

    /** true=存为草稿；false/空=直接发布 */
    private Boolean draft;
}
