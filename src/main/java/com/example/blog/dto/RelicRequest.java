package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RelicRequest {

    @NotBlank(message = "文物名称不能为空")
    private String title;

    private String dynasty;
    private String material;
    private String origin;
    private String location;
    private String description;
    private String image;
    private String submitterNote;
}
