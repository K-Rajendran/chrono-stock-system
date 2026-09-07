package com.soulxtime.store.dto.response;

import com.soulxtime.store.entity.Product;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CartResponse {
    private Long cartId;
    private List<CartItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal totalDiscount;
    private BigDecimal finalAmount;
    private int itemCount;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CartItemResponse {
        private Long productId;
        private String productName;
        private String brand;
        private String sku;
        private String primaryImageUrl;
        private BigDecimal sellingPrice;
        private BigDecimal effectivePrice;
        private BigDecimal discountAmount;
        private Product.DiscountType discountType;
        private BigDecimal discountValue;
        private int quantity;
        private int stockQuantity;
        private Product.StockStatus stockStatus;
        private BigDecimal lineTotal;
        private BigDecimal lineDiscount;
    }
}
