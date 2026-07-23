package com.example.blog.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String nickname;
    private String email;
    private String avatar;

    /** 修改密码时必填：原密码 */
    private String oldPassword;

    /** 修改密码时必填：新密码 */
    private String newPassword;
}
