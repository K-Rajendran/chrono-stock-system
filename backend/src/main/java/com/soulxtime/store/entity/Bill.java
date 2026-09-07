package com.soulxtime.store.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Bill entity — the official invoice.
 *
 * Financial formulas (per spec):
 *   subtotal      = SUM of all bill_items.total_price
 *   totalDiscount = SUM of all bill_items.line_discount_amount
 *   finalTotal    = subtotal (already net of discounts)
 *
 * All financial calculations happen server-side in BillService.
 * Never trust browser-submitted totals.
 */
@Entity
@Table(name = "bills")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bill_number", nullable = false, unique = true, length = 30)
    private String billNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "customer_name", nullable = false, length = 150)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    // === Financial (backend-calculated) ===
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "total_discount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalDiscount = BigDecimal.ZERO;

    @Column(name = "final_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalTotal;

    // === Payment ===
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, columnDefinition = "payment_method")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, columnDefinition = "payment_status")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;

    // === Bill lifecycle ===
    @Enumerated(EnumType.STRING)
    @Column(name = "bill_status", nullable = false, columnDefinition = "bill_status")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private BillStatus billStatus = BillStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id")
    private PurchaseRequest purchaseRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "whatsapp_sent_at")
    private Instant whatsappSentAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BillItem> items = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum PaymentMethod { CASH, UPI, CARD, BANK_TRANSFER, OTHER }
    public enum PaymentStatus { PENDING, PAID, PARTIAL, CANCELLED }
    public enum BillStatus    { DRAFT, ISSUED, SENT, PAID, CANCELLED }
}
