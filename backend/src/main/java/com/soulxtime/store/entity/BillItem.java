package com.soulxtime.store.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * BillItem — historical price snapshots.
 *
 * CRITICAL: All *_snapshot fields capture the values AT THE MOMENT OF BILLING.
 * Subsequent product price changes or cost changes DO NOT affect these fields.
 * This ensures financial reports remain historically accurate.
 *
 * purchaseCostSnapshot is used ONLY for admin profit calculations.
 * It must NEVER appear in customer-facing APIs.
 */
@Entity
@Table(name = "bill_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BillItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // === Historical Snapshots ===
    @Column(name = "product_name_snapshot", nullable = false, length = 200)
    private String productNameSnapshot;

    @Column(name = "selling_price_snapshot", nullable = false, precision = 12, scale = 2)
    private BigDecimal sellingPriceSnapshot;

    /**
     * ADMIN-ONLY: Never expose in customer APIs.
     * Required for Gross Profit = Net Revenue - Goods Cost calculation.
     */
    @Column(name = "purchase_cost_snapshot", nullable = false, precision = 12, scale = 2)
    private BigDecimal purchaseCostSnapshot;

    @Column(name = "discount_value_snapshot", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValueSnapshot = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type_snapshot", nullable = false, columnDefinition = "discount_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private Product.DiscountType discountTypeSnapshot = Product.DiscountType.PERCENTAGE;

    @Column(nullable = false)
    private int quantity;

    /** Pre-calculated discount amount (in currency, not percent). */
    @Column(name = "line_discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineDiscountAmount = BigDecimal.ZERO;

    /** Final line total after discount. = (sellingPriceSnapshot - lineDiscountAmount/qty) × qty */
    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;
}
