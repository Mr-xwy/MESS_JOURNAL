package com.example.blog.entity;

/**
  * 文章状态： DRAFT —— 草稿（仅在“我的草稿箱”可见） PUBLISHED —— 已发布（所有人可见、可点赞、可上榜） OFFLINE ——
  * 已下线（被审核员/管理员处理，仅作者与审核人员可见）
  */
public enum ArticleStatus {
    DRAFT,
    PUBLISHED,
    OFFLINE
}
