package com.soulxtime.store.dto.request;

import com.soulxtime.store.entity.Bill;
import com.soulxtime.store.entity.Product;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BillCreateRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer phone is required")
    private String customerPhone;

    private Long userId;
    private Long purchaseRequestId;

    @NotNull @Valid
    @Size(min = 1, message = "At least one item is required")
    private List<BillItemRequest> items;

    private Bill.PaymentMethod paymentMethod;
    private Bill.PaymentStatus paymentStatus;
    private String transactionRef;
    private String notes;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BillItemRequest {
        @NotNull
        private Long productId;

        @Min(value = 1, message = "Quantity must be at least 1")
        private int quantity;

        private BigDecimal discountValue;
        private Product.DiscountType discountType;
    }
}
