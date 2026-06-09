package com.flowershop.controller;

import com.flowershop.model.AppRating;
import com.flowershop.model.User;
import com.flowershop.repository.AppRatingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ratings")
public class AppRatingController {

    @Autowired
    private AppRatingRepository ratingRepo;

    /* ── GET overall app rating (public) ─────────────────── */
    @GetMapping
    public ResponseEntity<?> getOverallRating() {
        Double avg   = ratingRepo.findAverageRating();
        long   total = ratingRepo.count();

        // Rating breakdown (how many 1★, 2★ etc.)
        List<AppRating> all = ratingRepo.findAllByOrderByCreatedAtDesc();
        Map<Integer, Long> breakdown = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) {
            int star = i;
            breakdown.put(star, all.stream().filter(r -> r.getRating() == star).count());
        }

        // Recent comments (last 5)
        List<Map<String, Object>> recent = all.stream().limit(5).map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name",      r.getUser() != null ? r.getUser().getName() : "Customer");
            m.put("rating",    r.getRating());
            m.put("comment",   r.getComment());
            m.put("createdAt", r.getCreatedAt());
            return m;
        }).toList();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        res.put("totalRatings",  total);
        res.put("breakdown",     breakdown);
        res.put("recentReviews", recent);

        return ResponseEntity.ok(res);
    }

    /* ── SUBMIT rating (logged in users) ─────────────────── */
    @PostMapping
    public ResponseEntity<?> submitRating(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Object principal) {

        if (!(principal instanceof User user))
            return ResponseEntity.status(401).body(Map.of("error", "Please login to rate"));

        int rating;
        try {
            rating = Integer.parseInt(body.get("rating").toString());
            if (rating < 1 || rating > 5)
                return ResponseEntity.badRequest().body(Map.of("error", "Rating must be 1 to 5"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid rating"));
        }

        // Update existing or create new
        AppRating r = ratingRepo.findByUserId(user.getId()).orElse(new AppRating());
        r.setUser(user);
        r.setRating(rating);
        r.setComment(body.get("comment") != null ? body.get("comment").toString() : "");

        ratingRepo.save(r);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Thank you for your feedback! 🌸"
        ));
    }

    /* ── GET my rating ────────────────────────────────────── */
    @GetMapping("/my")
    public ResponseEntity<?> getMyRating(@AuthenticationPrincipal Object principal) {
        if (!(principal instanceof User user))
            return ResponseEntity.ok(Map.of("hasRating", false));

        return ratingRepo.findByUserId(user.getId())
                .map(r -> ResponseEntity.ok((Object) Map.of(
                        "hasRating", true,
                        "rating",    r.getRating(),
                        "comment",   r.getComment() != null ? r.getComment() : ""
                )))
                .orElse(ResponseEntity.ok(Map.of("hasRating", false)));
    }
}