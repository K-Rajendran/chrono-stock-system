package com.soulxtime.store.dto.request;

import com.soulxtime.store.entity.InventoryTransaction;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockAdjustRequest {
    @NotNull
    private InventoryTransaction.TransactionType type;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    private String reason;
    private Long referenceId;
    private String referenceType;
}
