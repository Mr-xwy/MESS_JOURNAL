package com.example.blog.entity;

/** 闲置商品状态 */
public enum ProductStatus {
    AVAILABLE, // 在售
    SOLD, // 已售出（已下单锁定）
    REMOVED // 已下架
}
