package com.soulxtime.store.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Product entity.
 *
 * IMPORTANT PRICE SECURITY:
 * - purchaseCost is NEVER included in customer-facing DTOs (ProductPublicResponse).
 * - Only admin DTOs (ProductAdminResponse) may include purchaseCost.
 * - discountedPrice() is calculated server-side; never trust browser-submitted prices.
 */
@Entity
@Table(name = "products")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 100)
    private String brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(columnDefinition = "TEXT")
    private String description;

    // === Watch Specifications ===
    @Column(length = 100)
    private String movement;

    @Column(name = "case_material", length = 100)
    private String caseMaterial;

    @Column(name = "strap_material", length = 100)
    private String strapMaterial;

    @Column(name = "case_diameter_mm", precision = 5, scale = 1)
    private BigDecimal caseDiameterMm;

    @Column(name = "dial_color", length = 100)
    private String dialColor;

    @Column(name = "water_resistance", length = 50)
    private String waterResistance;

    @Column(name = "glass_type", length = 100)
    private String glassType;

    @Column(name = "gender_style", length = 50)
    private String genderStyle;

    @Column(name = "warranty_months")
    private Integer warrantyMonths;

    // === Pricing ===
    /**
     * Purchase cost — ADMIN ONLY. NEVER expose in customer APIs.
     * Used exclusively for profit calculations.
     */
    @Column(name = "purchase_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal purchaseCost = BigDecimal.ZERO;

    @Column(name = "selling_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal sellingPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", columnDefinition = "discount_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private DiscountType discountType = DiscountType.PERCENTAGE;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue = BigDecimal.ZERO;

    // === Inventory ===
    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    private int lowStockThreshold = 5;

    @Enumerated(EnumType.STRING)
    @Column(name = "stock_status", nullable = false, columnDefinition = "stock_status")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private StockStatus stockStatus = StockStatus.OUT_OF_STOCK;

    // === Media ===
    @Column(name = "primary_image_url", length = 500)
    private String primaryImageUrl;

    @Column(name = "model_3d_url", length = 500)
    private String model3dUrl;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    // === Status ===
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Optimistic locking — prevents simultaneous stock deductions from overselling.
     */
    @Version
    private Long version;

    // === Business Logic ===

    /**
     * Calculates the final customer price after discount.
     * All price calculations happen server-side.
     */
    public BigDecimal getEffectivePrice() {
        if (discountValue == null || discountValue.compareTo(BigDecimal.ZERO) == 0) {
            return sellingPrice;
        }
        if (DiscountType.PERCENTAGE.equals(discountType)) {
            BigDecimal factor = BigDecimal.ONE.subtract(
                discountValue.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
            );
            return sellingPrice.multiply(factor).setScale(2, RoundingMode.HALF_UP);
        } else { // FIXED_AMOUNT
            BigDecimal discounted = sellingPrice.subtract(discountValue);
            return discounted.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }
    }

    /**
     * Calculates the discount amount (not percentage) for display.
     */
    public BigDecimal getDiscountAmount() {
        return sellingPrice.subtract(getEffectivePrice()).setScale(2, RoundingMode.HALF_UP);
    }

    public void updateStockStatus() {
        if (stockQuantity == 0) {
            stockStatus = StockStatus.OUT_OF_STOCK;
        } else if (stockQuantity <= lowStockThreshold) {
            stockStatus = StockStatus.LOW_STOCK;
        } else {
            stockStatus = StockStatus.IN_STOCK;
        }
    }

    // === Helper Methods for Gallery Images ===

    /**
     * Add gallery image with auto-incremented sort order.
     */
    public void addGalleryImage(String imageUrl, String altText) {
        int nextOrder = images.isEmpty() ? 0 : images.stream()
                .mapToInt(ProductImage::getSortOrder)
                .max()
                .orElse(-1) + 1;

        ProductImage image = ProductImage.builder()
                .product(this)
                .imageUrl(imageUrl)
                .altText(altText)
                .sortOrder(nextOrder)
                .build();

        images.add(image);
    }

    /**
     * Remove gallery image by URL.
     */
    public void removeGalleryImage(String imageUrl) {
        images.removeIf(img -> img.getImageUrl().equals(imageUrl));
    }

    /**
     * Clear all gallery images.
     */
    public void clearGalleryImages() {
        images.clear();
    }

    public enum StockStatus { IN_STOCK, LOW_STOCK, OUT_OF_STOCK }
    public enum DiscountType { PERCENTAGE, FIXED_AMOUNT }
}
