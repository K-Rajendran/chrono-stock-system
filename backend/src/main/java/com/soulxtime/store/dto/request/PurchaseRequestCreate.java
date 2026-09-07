package com.soulxtime.store.dto.request;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseRequestCreate {
    // Created from cart — no additional fields needed at request time.
    // All product/price data sourced from backend cart state.
    private String notes;
}
