package com.soulxtime.store.dto.request;

import com.soulxtime.store.entity.Product;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductCreateRequest {
    @NotBlank private String sku;
    @NotBlank private String name;
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

    @NotNull @DecimalMin("0.00")
    private BigDecimal purchaseCost;

    @NotNull @DecimalMin("0.01")
    private BigDecimal sellingPrice;

    @NotNull
    private Product.DiscountType discountType;

    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal discountValue;

    @Min(0) private Integer stockQuantity;
    @Min(1) private Integer lowStockThreshold;

    private String primaryImageUrl;
    private String model3dUrl;
}
