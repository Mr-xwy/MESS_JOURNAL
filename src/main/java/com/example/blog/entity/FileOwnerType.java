package com.example.blog.entity;

/**
 * 文件归属类型：标识 t_file 中某行数据属于哪个业务对象的图片。
 * 一个 (ownerType, ownerId) 唯一对应一条文件记录。
 */
public enum FileOwnerType {
    AVATAR,        // 用户头像
    RELIC_IMAGE,   // 文物图片
    PRODUCT_IMAGE  // 商品图片
}
