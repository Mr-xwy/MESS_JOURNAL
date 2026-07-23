package com.example.blog.repository;

import com.example.blog.entity.Relic;
import com.example.blog.entity.RelicStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RelicRepository extends JpaRepository<Relic, Long> {

    Page<Relic> findByStatus(RelicStatus status, Pageable pageable);

    List<Relic> findByStatusOrderByCreatedAtAsc(RelicStatus status);

    List<Relic> findByAuthorId(Long authorId);
}
