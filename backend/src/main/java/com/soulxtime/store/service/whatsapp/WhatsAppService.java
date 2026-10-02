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

    // Global Environment-Proof Emoji Constants
    public static final String EMOJI_CLOCK = new String(Character.toChars(0x1F550));      // 🕒
    public static final String EMOJI_CLIPBOARD = new String(Character.toChars(0x1F4CB));  // 📋
    public static final String EMOJI_SILHOUETTE = new String(Character.toChars(0x1F464)); // 👤
    public static final String EMOJI_CALENDAR = new String(Character.toChars(0x1F5D3));   // 🗓️
    public static final String EMOJI_MONEYBAG = new String(Character.toChars(0x1F4B0));   // 💰
    public static final String EMOJI_DIAMOND = new String(Character.toChars(0x1F48E));    // 💎
    public static final String EMOJI_CARD = new String(Character.toChars(0x1F4B3));       // 💳
    public static final String EMOJI_REFRESH = new String(Character.toChars(0x1F501));    // 🔄
    public static final String EMOJI_PHONE = new String(Character.toChars(0x1F4DE));      // 📞

    private final BillRepository billRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;

    @Value("${app.whatsapp.mode:LINK}")
    private String whatsAppMode;

    @Value("${app.whatsapp.owner-number:9787307883}")
    private String ownerNumber;

    @Value("${app.whatsapp.api-url:}")
    private String apiUrl;

    @Value("${app.whatsapp.api-token:}")
    private String apiToken;

    @Value("${app.admin.owner-name:AFINO}")
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
        sb.append(EMOJI_CLOCK).append(" *AFINO — New Purchase Request*\n\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append(EMOJI_CLIPBOARD).append(" *Reference:* ").append(pr.getReferenceId()).append("\n");
        sb.append(EMOJI_SILHOUETTE).append(" *Customer:* ").append(pr.getCustomerName()).append("\n");
        sb.append(EMOJI_PHONE).append(" *Phone:* ").append(pr.getCustomerPhone()).append("\n");
        sb.append(EMOJI_CALENDAR).append(" *Date:* ").append(BILL_DATE_FORMAT.format(pr.getCreatedAt())).append(" UTC\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━\n\n");
        sb.append("*Items:*\n");

        for (var item : pr.getItems()) {
            sb.append("• ").append(item.getProductName())
                    .append(" × ").append(item.getQuantity())
                    .append(" = ₹").append(item.getLineTotal()).append("\n");
        }

        sb.append("\n━━━━━━━━━━━━━━━━━━━━━━━━\n");
        if (pr.getTotalDiscount() != null && pr.getTotalDiscount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            sb.append(EMOJI_MONEYBAG).append(" *Discount:* -₹").append(pr.getTotalDiscount()).append("\n");
        }
        sb.append(EMOJI_DIAMOND).append(" *Total:* ₹").append(pr.getTotalAmount()).append("\n\n");
        sb.append("_Where Time Finds Its Soul_");
        return sb.toString();
    }

    private String buildBillMessage(Bill bill) {
        StringBuilder sb = new StringBuilder();
        sb.append(EMOJI_CLOCK).append(" *AFINO — Your Invoice*\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━\n");
        sb.append(EMOJI_CLIPBOARD).append(" *Bill No:* ").append(bill.getBillNumber()).append("\n");
        sb.append(EMOJI_SILHOUETTE).append(" *Name:* ").append(bill.getCustomerName()).append("\n");
        sb.append(EMOJI_CALENDAR).append(" *Date:* ").append(BILL_DATE_FORMAT.format(bill.getCreatedAt())).append(" UTC\n");
        sb.append("━━━━━━━━━━━━━━━━━━━━━━━━\n\n");
        sb.append("*Items:*\n");

        for (var item : bill.getItems()) {
            sb.append("• ").append(item.getProductNameSnapshot())
                    .append(" × ").append(item.getQuantity())
                    .append(" = ₹").append(item.getTotalPrice()).append("\n");
        }

        sb.append("\n━━━━━━━━━━━━━━━━━━━━━━━━\n");
        if (bill.getTotalDiscount() != null && bill.getTotalDiscount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            sb.append(EMOJI_MONEYBAG).append(" *Discount:* -₹").append(bill.getTotalDiscount()).append("\n");
        }
        sb.append(EMOJI_DIAMOND).append(" *Total:* ₹").append(bill.getFinalTotal()).append("\n");
        sb.append(EMOJI_CARD).append(" *Payment:* ").append(bill.getPaymentMethod().name()).append("\n");
        sb.append(EMOJI_REFRESH).append(" *Status:* ").append(bill.getPaymentStatus().name()).append("\n\n");
        sb.append("Thank you for choosing AFINO.\n");
        sb.append("_Where Time Finds Its Soul_");
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────
    // Link generation
    // ─────────────────────────────────────────────────────────

    private String buildWhatsAppLink(String phone, String message) {
        if (phone == null || phone.isBlank()) {
            return "https://whatsapp.com" + urlEncode(message);
        }
        return "https://api.whatsapp.com/send?phone=" + sanitizePhone(phone) + "&text=" + urlEncode(message);
    }

    private String sanitizePhone(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[^0-9]", "");
    }

    private String urlEncode(String text) {
        if (text == null) return "";
        // URLEncoder encodes spaces as '+' which breaks emoji parsing in WhatsApp links.
        // Replacing '+' with '%20' forces standard URL percent-encoding.
        return URLEncoder.encode(text, StandardCharsets.UTF_8).replace("+", "%20");
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
