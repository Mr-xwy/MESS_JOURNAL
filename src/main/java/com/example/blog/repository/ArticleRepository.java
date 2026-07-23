package com.example.blog.repository;

import com.example.blog.entity.Article;
import com.example.blog.entity.ArticleStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ArticleRepository
        extends JpaRepository<Article, Long>, JpaSpecificationExecutor<Article> {

    List<Article> findByStatus(ArticleStatus status);

    long countByStatus(ArticleStatus status);

    List<Article> findByIdIn(List<Long> ids);
}
