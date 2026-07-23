package com.example.blog.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "t_relic")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Relic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String dynasty; // 年代，如「商代晚期」
    private String material; // 材质，如「青铜」
    private String origin; // 出土地
    private String location; // 收藏地（博物馆）

    @Column(columnDefinition = "TEXT")
    private String description; // 文物介绍

    /**
     * 文物图片（base64 dataURL）。已抽离到 t_file（owner_type=RELIC_IMAGE），
     * 本字段仅作 JSON 序列化出口，由 RelicService 从 t_file 装配。
     */
    @Transient
    private String image; // 文物图片：base64（data:image/...;base64,...）；为空表示无图

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RelicStatus status;

    @Column(nullable = false)
    private Long authorId;

    private String authorName;

    @Column(columnDefinition = "TEXT")
    private String submitterNote; // 提交者留言（普通用户提交时填写）

    @Column(columnDefinition = "TEXT")
    private String reviewNote; // 审核意见（驳回时填写）

    private String reviewedBy; // 审核人

    @Builder.Default private Integer likeCount = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
    private LocalDateTime reviewedAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.likeCount == null) this.likeCount = 0;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
