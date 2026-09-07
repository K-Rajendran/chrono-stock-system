package com.soulxtime.store.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "inventory_transactions")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, columnDefinition = "inventory_transaction_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private TransactionType transactionType;

    /** Positive = stock added, Negative = stock removed. */
    @Column(name = "quantity_change", nullable = false)
    private int quantityChange;

    @Column(name = "quantity_before", nullable = false)
    private int quantityBefore;

    @Column(name = "quantity_after", nullable = false)
    private int quantityAfter;

    @Column(length = 500)
    private String reason;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public enum TransactionType { PURCHASE, SALE, RETURN, ADJUSTMENT, CANCELLATION }
}
