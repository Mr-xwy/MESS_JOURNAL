package com.example.blog.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "t_product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * 商品图片（base64 dataURL）。已抽离到 t_file（owner_type=PRODUCT_IMAGE），
     * 本字段仅作 JSON 序列化出口，由 ShopService 从 t_file 装配。
     */
    @Transient
    private String image; // 商品图片：base64（data:image/...;base64,...）；为空表示无图

    @Column(length = 30)
    private String category; // 分类：瓷器 / 书画 / 玉器 / 钱币 / 杂项

    @Column(name = "item_condition", length = 20)
    private String itemCondition; // 成色：全新 / 九五新 / 八成新 / 有瑕疵

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProductStatus status = ProductStatus.AVAILABLE;

    @Column(nullable = false)
    private Long sellerId;

    private String sellerName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = ProductStatus.AVAILABLE;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
