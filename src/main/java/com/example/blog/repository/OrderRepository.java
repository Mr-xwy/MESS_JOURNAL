package com.example.blog.repository;

import com.example.blog.entity.Order;
import com.example.blog.entity.OrderStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    List<Order> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    boolean existsByProductIdAndStatus(Long productId, OrderStatus status);

    Optional<Order> findByOrderNo(String orderNo);
}
