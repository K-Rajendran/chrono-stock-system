package com.soulxtime.store.dto.response;

import com.soulxtime.store.entity.Bill;
import com.soulxtime.store.entity.Product;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BillResponse {
    private Long id;
    private String billNumber;
    private Long userId;
    private String customerName;
    private String customerPhone;
    private BigDecimal subtotal;
    private BigDecimal totalDiscount;
    private BigDecimal finalTotal;
    private Bill.PaymentMethod paymentMethod;
    private Bill.PaymentStatus paymentStatus;
    private String transactionRef;
    private Bill.BillStatus billStatus;
    private Long purchaseRequestId;
    private String notes;
    private LocalDateTime whatsappSentAt;
    private List<BillItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BillItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private BigDecimal sellingPrice;
        private BigDecimal purchaseCost;  // null in customer view, set in admin view
        private BigDecimal discountValue;
        private Product.DiscountType discountType;
        private int quantity;
        private BigDecimal lineDiscountAmount;
        private BigDecimal totalPrice;
    }
}
