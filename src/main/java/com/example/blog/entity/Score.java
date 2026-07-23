package com.example.blog.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "t_puzzle_score")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String username;

    /** 谜题日期 yyyy-MM-dd（按本地日） */
    @Column(nullable = false, length = 10)
    private String date;

    /** 词方标识，如 SOLVE / HEART */
    @Column(nullable = false, length = 16)
    private String puzzleKey;

    /** 完成用时（秒），越小越好 */
    @Column(nullable = false)
    private Integer seconds;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
