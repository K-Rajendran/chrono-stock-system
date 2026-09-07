package com.soulxtime.store.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WhatsAppMessageResponse {
    private String message;
    private String whatsappLink;
    private String mode;
    private String recipientNumber;
    private boolean sent;
}
