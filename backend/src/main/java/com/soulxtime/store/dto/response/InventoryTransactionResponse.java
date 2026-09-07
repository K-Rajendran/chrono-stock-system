package com.soulxtime.store.dto.response;

import com.soulxtime.store.entity.InventoryTransaction;
import lombok.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryTransactionResponse {
    private Long id;
    private Long productId;
    private String productName;
    private InventoryTransaction.TransactionType transactionType;
    private int quantityChange;
    private int quantityBefore;
    private int quantityAfter;
    private String reason;
    private Long referenceId;
    private String referenceType;
    private String performedByName;
    private Instant createdAt;
}
