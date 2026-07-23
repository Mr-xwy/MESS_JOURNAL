package com.example.blog.repository;

import com.example.blog.entity.OrderSnapshot;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderSnapshotRepository extends JpaRepository<OrderSnapshot, Long> {

    Optional<OrderSnapshot> findByOrderId(Long orderId);

    List<OrderSnapshot> findByOrderIdIn(List<Long> orderIds);
}
