package com.soulxtime.store.dto.request;

import com.soulxtime.store.entity.Product;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductUpdateRequest {
    private String name;
    private String brand;
    private Long categoryId;
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
    private BigDecimal purchaseCost;
    private BigDecimal sellingPrice;
    private Product.DiscountType discountType;
    private BigDecimal discountValue;
    private Integer lowStockThreshold;
    private String primaryImageUrl;
    private String model3dUrl;
    private Boolean active;
}
