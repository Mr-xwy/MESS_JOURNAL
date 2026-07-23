package com.example.blog.entity;

import com.example.blog.common.Role;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "t_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    /** 存储 MD5(rawPassword + salt) */
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String salt;

    private String nickname;
    private String email;

    /**
     * 用户头像（base64 dataURL）。
     * 已抽离到 t_file（owner_type=AVATAR），本字段仅作 JSON 序列化出口，
     * 由 UserService 从 t_file 装配；业务表 t_user 不再持有大字段。
     */
    @Transient
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

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
