package com.soulxtime.store.controller.customer;

import com.soulxtime.store.dto.response.PurchaseRequestResponse;
import com.soulxtime.store.dto.response.WhatsAppMessageResponse;
import com.soulxtime.store.repository.UserRepository;
import com.soulxtime.store.service.PurchaseRequestService;
import com.soulxtime.store.service.whatsapp.WhatsAppService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-requests")
@RequiredArgsConstructor
public class PurchaseRequestController {

    private final PurchaseRequestService purchaseRequestService;
    private final WhatsAppService whatsAppService;
    private final UserRepository userRepository;

    @PostMapping("/from-cart")
    public ResponseEntity<PurchaseRequestResponse> createFromCart(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        PurchaseRequestResponse pr = purchaseRequestService.createFromCart(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(pr);
    }

    @GetMapping
    public ResponseEntity<Page<PurchaseRequestResponse>> getMyRequests(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                purchaseRequestService.getCustomerRequests(getUserId(userDetails), PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseRequestResponse> getRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                purchaseRequestService.getRequest(id, getUserId(userDetails), false));
    }

    /**
     * Generates a WhatsApp message link for the customer to send their purchase request
     * to the store owner. The customer clicks the link to open WhatsApp with a pre-filled message.
     */
    @PostMapping("/{id}/send-whatsapp")
    public ResponseEntity<WhatsAppMessageResponse> sendToOwner(@PathVariable Long id) {
        return ResponseEntity.ok(whatsAppService.generatePurchaseRequestMessage(id));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow().getId();
    }
}
