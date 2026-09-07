package com.soulxtime.store.service.whatsapp;

import com.soulxtime.store.dto.response.BillResponse;
import com.soulxtime.store.dto.response.PurchaseRequestResponse;
import com.soulxtime.store.dto.response.WhatsAppMessageResponse;
import com.soulxtime.store.entity.Bill;
import com.soulxtime.store.entity.PurchaseRequest;
import com.soulxtime.store.exception.ResourceNotFoundException;
import com.soulxtime.store.repository.BillRepository;
import com.soulxtime.store.repository.PurchaseRequestRepository;
import com.soulxtime.store.service.BillService;
import com.soulxtime.store.service.PurchaseRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * WhatsApp Service Abstraction.
 *
 * Supports two modes (configured via WHATSAPP_MODE env var):
 *   LINK — Generates a wa.me link with prefilled message (no API key needed).
 *           Customer/admin opens the link to send manually.
 *           Safe for development and small businesses.
 *
 *   API  — Calls WhatsApp Business API to send messages programmatically.
 *           Requires WHATSAPP_API_TOKEN and WHATSAPP_API_URL.
 *           Use in production with a verified WhatsApp Business account.
 *
 * The application remains functional in LINK mode without any API credentials.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppService {

    private final BillRepository billRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;

    @Value("${app.whatsapp.mode:LINK}")
    private String whatsAppMode;

    @Value("${app.whatsapp.owner-number:}")
    private String ownerNumber;

    @Value("${app.whatsapp.api-url:}")
    private String apiUrl;

    @Value("${app.whatsapp.api-token:}")
    private String apiToken;

    @Value("${app.admin.owner-name:Soul x Time}")
    private String ownerName;

    private static final DateTimeFormatter BILL_DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm").withZone(ZoneOffset.UTC);

    // ─────────────────────────────────────────────────────────
    // Purchase Request → Owner
    // ─────────────────────────────────────────────────────────

    @Transactional
    public WhatsAppMessageResponse generatePurchaseRequestMessage(Long requestId) {
        PurchaseRequest pr = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request", requestId));

        String message = buildPurchaseRequestMessage(pr);
        String link = buildWhatsAppLink(ownerNumber, message);

        pr.setWhatsappSentAt(Instant.now());
        purchaseRequestRepository.save(pr);

        return WhatsAppMessageResponse.builder()
                .message(message)
                .whatsappLink(link)
                .mode(whatsAppMode)
                .recipientNumber(ownerNumber)
                .sent(false) // LINK mode = manual send
                .build();
    }

    // ─────────────────────────────────────────────────────────
    // Bill → Customer
    // ─────────────────────────────────────────────────────────

    @Transactional
    public WhatsAppMessageResponse generateBillMessage(Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", billId));

        String message = buildBillMessage(bill);
        String customerNumber = sanitizePhone(bill.getCustomerPhone());
        String link = buildWhatsAppLink(customerNumber, message);

        if ("API".equalsIgnoreCase(whatsAppMode) && hasApiCredentials()) {
            // API mode: attempt server-side delivery
            boolean sent = sendViaApi(customerNumber, message);
            if (sent) {
                bill.setWhatsappSentAt(Instant.now());
                billRepository.save(bill);
                return WhatsAppMessageResponse.builder()
                        .message(message)
                        .whatsappLink(link)
                        .mode("API")
                        .recipientNumber(customerNumber)
                        .sent(true)
                        .build();
            }
        }

        // LINK mode fallback
        bill.setWhatsappSentAt(Instant.now());
        billRepository.save(bill);

        return WhatsAppMessageResponse.builder()
                .message(message)
                .whatsappLink(link)
                .mode("LINK")
                .recipientNumber(customerNumber)
                .sent(false)
                .build();
    }

    // ─────────────────────────────────────────────────────────
    // Message builders
    // ─────────────────────────────────────────────────────────

    private String buildPurchaseRequestMessage(PurchaseRequest pr) {
        StringBuilder sb = new StringBuilder();
        sb.append("🕐 *SOUL x TIME — New Purchase Request*\n\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("📋 *Reference:* ").append(pr.getReferenceId()).append("\n");
        sb.append("👤 *Customer:* ").append(pr.getCustomerName()).append("\n");
        sb.append("📞 *Phone:* ").append(pr.getCustomerPhone()).append("\n");
        sb.append("🗓 *Date:* ").append(BILL_DATE_FORMAT.format(pr.getCreatedAt())).append(" UTC\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━\n\n");
        sb.append("*Items:*\n");

        for (var item : pr.getItems()) {
            sb.append("• ").append(item.getProductName())
                    .append(" × ").append(item.getQuantity())
                    .append(" = ₹").append(item.getLineTotal()).append("\n");
        }

        sb.append("\n━━━━━━━━━━━━━━━━━━━━━━━━\n");
        if (pr.getTotalDiscount() != null && pr.getTotalDiscount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            sb.append("💰 *Discount:* -₹").append(pr.getTotalDiscount()).append("\n");
        }
        sb.append("💎 *Total:* ₹").append(pr.getTotalAmount()).append("\n\n");
        sb.append("_Where Time Finds Its Soul_");
        return sb.toString();
    }

    private String buildBillMessage(Bill bill) {
        StringBuilder sb = new StringBuilder();
        sb.append("🕐 *SOUL x TIME — Your Invoice*\n\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append("🧾 *Bill No:* ").append(bill.getBillNumber()).append("\n");
        sb.append("👤 *Name:* ").append(bill.getCustomerName()).append("\n");
        sb.append("🗓 *Date:* ").append(BILL_DATE_FORMAT.format(bill.getCreatedAt())).append(" UTC\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━\n\n");
        sb.append("*Items:*\n");

        for (var item : bill.getItems()) {
            sb.append("• ").append(item.getProductNameSnapshot())
                    .append(" × ").append(item.getQuantity())
                    .append(" = ₹").append(item.getTotalPrice()).append("\n");
        }

        sb.append("\n━━━━━━━━━━━━━━━━━━━━━━━━\n");
        if (bill.getTotalDiscount() != null && bill.getTotalDiscount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            sb.append("💰 *Discount:* -₹").append(bill.getTotalDiscount()).append("\n");
        }
        sb.append("💎 *Total:* ₹").append(bill.getFinalTotal()).append("\n");
        sb.append("💳 *Payment:* ").append(bill.getPaymentMethod().name()).append("\n");
        sb.append("✅ *Status:* ").append(bill.getPaymentStatus().name()).append("\n\n");
        sb.append("Thank you for choosing Soul x Time.\n");
        sb.append("_Where Time Finds Its Soul_");
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────
    // Link generation
    // ─────────────────────────────────────────────────────────

    private String buildWhatsAppLink(String phone, String message) {
        if (phone == null || phone.isBlank()) {
            return "https://wa.me/?text=" + urlEncode(message);
        }
        return "https://wa.me/" + sanitizePhone(phone) + "?text=" + urlEncode(message);
    }

    private String sanitizePhone(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[^0-9]", "");
    }

    private String urlEncode(String text) {
        return URLEncoder.encode(text, StandardCharsets.UTF_8);
    }

    // ─────────────────────────────────────────────────────────
    // API mode (stub — implement with actual WhatsApp Business API)
    // ─────────────────────────────────────────────────────────

    private boolean hasApiCredentials() {
        return apiToken != null && !apiToken.isBlank()
                && apiUrl != null && !apiUrl.isBlank();
    }

    /**
     * Send via WhatsApp Business API.
     * This is a stub. Replace body with actual HTTP call to your
     * WhatsApp Business API provider (Meta, Twilio, Gupshup, etc.)
     * using the configured WHATSAPP_API_URL and WHATSAPP_API_TOKEN.
     */
    private boolean sendViaApi(String phone, String message) {
        log.warn("WhatsApp API mode configured but not fully implemented. " +
                "Implement sendViaApi() with your provider's SDK. Falling back to LINK mode.");
        return false;
    }
}
