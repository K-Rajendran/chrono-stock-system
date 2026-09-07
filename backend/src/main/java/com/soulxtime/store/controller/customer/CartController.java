package com.soulxtime.store.controller.customer;

import com.soulxtime.store.dto.request.CartItemRequest;
import com.soulxtime.store.dto.response.CartResponse;
import com.soulxtime.store.repository.UserRepository;
import com.soulxtime.store.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(cartService.getOrCreateCart(getUserId(userDetails)));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CartItemRequest req) {
        return ResponseEntity.ok(cartService.addItem(getUserId(userDetails), req));
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<CartResponse> updateItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId,
            @RequestBody Map<String, Integer> body) {
        int qty = body.getOrDefault("quantity", 0);
        return ResponseEntity.ok(cartService.updateItemQuantity(getUserId(userDetails), productId, qty));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<CartResponse> removeItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId) {
        return ResponseEntity.ok(cartService.removeItem(getUserId(userDetails), productId));
    }

    @DeleteMapping
    public ResponseEntity<CartResponse> clearCart(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(cartService.clearCart(getUserId(userDetails)));
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow().getId();
    }
}
