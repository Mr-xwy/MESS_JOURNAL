package com.example.blog.entity;

/** 文物状态： PUBLISHED —— 已上线（所有人可见） PENDING —— 待审核（普通用户提交，等待管理员/审核员处理） REJECTED —— 已驳回（审核未通过） */
public enum RelicStatus {
    PUBLISHED,
    PENDING,
    REJECTED
}
