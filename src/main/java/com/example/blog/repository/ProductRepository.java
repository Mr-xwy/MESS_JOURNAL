package com.example.blog.repository;

import com.example.blog.entity.Product;
import com.example.blog.entity.ProductStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    Page<Product> findByStatusAndTitleContaining(
            ProductStatus status, String keyword, Pageable pageable);

    Page<Product> findByStatusAndCategory(ProductStatus status, String category, Pageable pageable);

    List<Product> findBySellerId(Long sellerId);

    List<Product> findBySellerIdAndStatus(Long sellerId, ProductStatus status);
}
