package com.flowershop.model;


import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_ratings",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id"}))
public class AppRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int rating; // 1 to 5

    @Column(length = 500)
    private String comment;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Long getId()                        { return id; }
    public void setId(Long id)                 { this.id = id; }
    public User getUser()                      { return user; }
    public void setUser(User user)             { this.user = user; }
    public int getRating()                     { return rating; }
    public void setRating(int rating)          { this.rating = rating; }
    public String getComment()                 { return comment; }
    public void setComment(String comment)     { this.comment = comment; }
    public LocalDateTime getCreatedAt()        { return createdAt; }
    public void setCreatedAt(LocalDateTime t)  { this.createdAt = t; }
}
