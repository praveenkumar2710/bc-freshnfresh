package com.flowershop.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotNull
    @DecimalMin("0.01")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer stock;

    @NotBlank
    @Column(nullable = false)
    private String unit;   // e.g. "250gm", "piece", "bunch", "pair", "dozen"

    @Column(nullable = false)
    private boolean available = true;

    @Column(length = 500)
    private String description;

    // Legacy emoji field — kept for backward compat, no longer shown if imageUrl is set
    @Column
    private String imageEmoji = "🌸";

    // New: actual image URL uploaded by admin (base64 data URI or external URL)
    @Column(length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    private String category = "Loose Flowers";

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime lastPriceUpdate;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastPriceUpdate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { lastPriceUpdate = LocalDateTime.now(); }

    public boolean isInStock() { return available && stock > 0; }

    // ── Getters & Setters ──────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageEmoji() { return imageEmoji; }
    public void setImageEmoji(String imageEmoji) { this.imageEmoji = imageEmoji; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastPriceUpdate() { return lastPriceUpdate; }
    public void setLastPriceUpdate(LocalDateTime t) { this.lastPriceUpdate = t; }
}
