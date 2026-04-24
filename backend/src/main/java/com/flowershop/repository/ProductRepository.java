package com.flowershop.repository;

import com.flowershop.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByAvailableTrueOrderByName();

    List<Product> findAllByOrderByName();

    @Query("SELECT p FROM Product p WHERE p.available = true AND LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Product> searchAvailable(String q);

    @Query("SELECT p FROM Product p WHERE p.available = true AND p.category = :category ORDER BY p.name")
    List<Product> findByCategory(String category);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.available = true ORDER BY p.category")
    List<String> findDistinctCategories();

    @Query("SELECT p FROM Product p WHERE p.stock <= :threshold ORDER BY p.stock ASC")
    List<Product> findLowStock(int threshold);
}
