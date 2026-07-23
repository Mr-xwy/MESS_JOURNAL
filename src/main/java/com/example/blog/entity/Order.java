package com.example.blog.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "t_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 40)
    private String orderNo;

    @Column(nullable = false)
    private Long productId;

    /**
     * 以下字段为“下单时点”的商品/用户展示快照，已抽离到 t_order_snapshot。
     * 这里仅作 JSON 序列化出口，由 ShopService 从 t_order_snapshot 装配；
     * 历史订单的展示数据不再实时 JOIN 商品/用户表，确保对账准确。
     */
    @Transient
    private String productTitle;

    @Transient
    private String productImage;

    /**
     * price 仍落 t_order.price：旧 schema 该列 NOT NULL 且无默认，若标 @Transient 会导致
     * "Field 'price' doesn't have a default value"。快照表 t_order_snapshot 同样保存一份
     * 用于历史对账。这里走 @Column 让 Hibernate 写入；前端 JSON 读取走同一字段。
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Long buyerId;

    @Transient
    private String buyerName;

    @Column(nullable = false)
    private Long sellerId;

    @Transient
    private String sellerName;

    private String contactName;
    private String contactPhone;
    private String contactAddress;
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = OrderStatus.PENDING;
    }
}
