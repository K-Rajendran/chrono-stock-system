package com.soulxtime.store.dto.response;

import com.soulxtime.store.entity.PurchaseRequest;
import com.soulxtime.store.entity.Product;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseRequestResponse {
    private Long id;
    private String referenceId;
    private Long userId;
    private String customerName;
    private String customerPhone;
    private PurchaseRequest.PurchaseRequestStatus status;
    private BigDecimal subtotal;
    private BigDecimal totalDiscount;
    private BigDecimal totalAmount;
    private String notes;
    private Long billId;
    private LocalDateTime whatsappSentAt;
    private List<PRItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PRItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private BigDecimal unitPrice;
        private BigDecimal discountValue;
        private Product.DiscountType discountType;
        private int quantity;
        private BigDecimal lineTotal;
    }
}
