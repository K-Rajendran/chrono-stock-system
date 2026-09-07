package com.soulxtime.store.dto.request;

import com.soulxtime.store.entity.Bill;
import com.soulxtime.store.entity.Product;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BillUpdateRequest {
    private String customerName;
    private String customerPhone;
    private List<BillCreateRequest.BillItemRequest> items;
    private Bill.PaymentMethod paymentMethod;
    private Bill.PaymentStatus paymentStatus;
    private String transactionRef;
    private Bill.BillStatus billStatus;
    private String notes;
}
