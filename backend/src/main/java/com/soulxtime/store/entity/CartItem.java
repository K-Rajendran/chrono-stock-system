package com.soulxtime.store.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "cart_items", uniqueConstraints = @UniqueConstraint(columnNames = {"cart_id", "product_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @CreationTimestamp
    @Builder.Default
    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt = Instant.now();

    @UpdateTimestamp
    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    /*@PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }*/
}
