package com.soulxtime.store.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "purchase_request_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseRequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private PurchaseRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // Snapshots at time of request
    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, columnDefinition = "discount_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private Product.DiscountType discountType = Product.DiscountType.PERCENTAGE;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;
}
