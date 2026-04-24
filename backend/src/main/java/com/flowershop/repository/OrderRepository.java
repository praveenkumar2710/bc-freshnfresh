package com.flowershop.repository;

import com.flowershop.model.Order;
import com.flowershop.model.Order.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByStatusOrderByCreatedAtDesc(Status status);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByStatus(Status status);

    @Query("SELECT o FROM Order o WHERE o.createdAt >= :start ORDER BY o.createdAt DESC")
    List<Order> findTodayOrders(LocalDateTime start);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start")
    long countTodayOrders(LocalDateTime start);
}
