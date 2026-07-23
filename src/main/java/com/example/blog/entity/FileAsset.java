package com.example.blog.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

/**
 * 统一的文件资产表：把原本内嵌在 t_user / t_relic / t_product 里的 base64 大字段
 * 抽离到这里，降低业务表体积与耦合，也为后续“图片改对象存储”铺路。
 *
 * <p>通过 (owner_type, owner_id) 唯一定位某个业务对象的图片，业务实体只需保留一个
 * @Transient 的序列化出口字段，读取时由 Service 从本表装配。
 */
@Entity
@Table(
        name = "t_file",
        uniqueConstraints = @UniqueConstraint(columnNames = {"owner_type", "owner_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false, length = 20)
    private FileOwnerType ownerType;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    /** base64 dataURL（与对象存储迁移前的存储形态一致）。@Lob → MySQL LONGTEXT。 */
    @Lob
    @Column(name = "data_url", columnDefinition = "TEXT")
    private String dataUrl;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
