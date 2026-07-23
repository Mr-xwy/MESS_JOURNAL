package com.example.blog.common;

/**
  * 用户权限等级： ADMIN —— 最高权限，可删除/修改所有人的文章 MODERATOR —— 中级权限，可将他人文章下线/恢复（内容审核） USER —— 普通权限，仅可管理自己的文章、点赞等
  */
public enum Role {
    ADMIN,
    MODERATOR,
    USER
}
