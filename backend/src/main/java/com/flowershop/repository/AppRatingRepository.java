package com.flowershop.repository;

import com.flowershop.model.AppRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface AppRatingRepository extends JpaRepository<AppRating, Long> {

    Optional<AppRating> findByUserId(Long userId);

    @Query("SELECT AVG(r.rating) FROM AppRating r")
    Double findAverageRating();

    long count();

    List<AppRating> findAllByOrderByCreatedAtDesc();
}
