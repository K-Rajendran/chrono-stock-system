package com.soulxtime.store.dto.response;

import com.soulxtime.store.entity.Product;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

/** Admin product response — includes purchaseCost. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductAdminResponse {
    private Long id;
    private String sku;
    private String name;
    private String brand;
    private Long categoryId;
    private String categoryName;
    private String description;
    private String movement;
    private String caseMaterial;
    private String strapMaterial;
    private BigDecimal caseDiameterMm;
    private String dialColor;
    private String waterResistance;
    private String glassType;
    private String genderStyle;
    private Integer warrantyMonths;
    private BigDecimal purchaseCost;   // ADMIN ONLY
    private BigDecimal sellingPrice;
    private Product.DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal effectivePrice;
    private BigDecimal discountAmount;
    private int stockQuantity;
    private int lowStockThreshold;
    private Product.StockStatus stockStatus;
    private String primaryImageUrl;
    private String model3dUrl;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
