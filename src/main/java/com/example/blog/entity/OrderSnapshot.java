package com.example.blog.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

/**
 * 订单快照表：把 t_order 中“下单时点”的商品/买家/卖家展示数据冻结到这里。
 *
 * <p>目的：订单头 t_order 只保留 productId / buyerId / sellerId 等引用，
 * 不再冗余商品标题/图片/单价/姓名。历史订单的展示数据从这里读取，
 * 即使商品后来改价、改名、下架，历史订单也始终准确，不会被实时 JOIN 污染。
 */
@Entity
@Table(
        name = "t_order_snapshot",
        uniqueConstraints = @UniqueConstraint(columnNames = "order_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "product_title", length = 100)
    private String productTitle;

    /** 下单时点的商品图片快照（base64），@Lob → LONGTEXT */
    @Lob
    @Column(name = "product_image", columnDefinition = "TEXT")
    private String productImage;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "seller_name", length = 50)
    private String sellerName;

    @Column(name = "buyer_name", length = 50)
    private String buyerName;
}
