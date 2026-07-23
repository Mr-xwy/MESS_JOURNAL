package com.example.blog.repository;

import com.example.blog.entity.LikeRecord;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LikeRepository extends JpaRepository<LikeRecord, Long> {
    Optional<LikeRecord> findByUserIdAndArticleId(Long userId, Long articleId);

    void deleteByUserIdAndArticleId(Long userId, Long articleId);
}
