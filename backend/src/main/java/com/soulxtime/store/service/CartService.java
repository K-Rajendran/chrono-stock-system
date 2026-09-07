package com.soulxtime.store.service;

import com.soulxtime.store.dto.request.CartItemRequest;
import com.soulxtime.store.dto.response.CartResponse;
import com.soulxtime.store.entity.Cart;
import com.soulxtime.store.entity.CartItem;
import com.soulxtime.store.entity.Product;
import com.soulxtime.store.entity.User;
import com.soulxtime.store.exception.BusinessException;
import com.soulxtime.store.exception.ResourceNotFoundException;
import com.soulxtime.store.repository.CartRepository;
import com.soulxtime.store.repository.ProductRepository;
import com.soulxtime.store.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public CartResponse getOrCreateCart(Long userId) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", userId));
                    Cart newCart = Cart.builder().user(user).items(new ArrayList<>()).build();
                    return cartRepository.save(newCart);
                });
        return toResponse(cart);
    }

    @Transactional
    public CartResponse addItem(Long userId, CartItemRequest req) {
        if (req.getQuantity() <= 0) {
            throw new BusinessException("INVALID_QTY", "Quantity must be at least 1");
        }

        Product product = productRepository.findById(req.getProductId())
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product", req.getProductId()));

        if (product.getStockQuantity() <= 0) {
            throw new BusinessException("OUT_OF_STOCK", "'" + product.getName() + "' is currently out of stock");
        }

        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", userId));
                    return cartRepository.save(Cart.builder().user(user).items(new ArrayList<>()).build());
                });

        Optional<CartItem> existing = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(req.getProductId()))
                .findFirst();

        if (existing.isPresent()) {
            int newQty = existing.get().getQuantity() + req.getQuantity();
            if (newQty > product.getStockQuantity()) {
                throw new BusinessException("INSUFFICIENT_STOCK",
                        "Only " + product.getStockQuantity() + " units available for '" + product.getName() + "'");
            }
            existing.get().setQuantity(newQty);
        } else {
            if (req.getQuantity() > product.getStockQuantity()) {
                throw new BusinessException("INSUFFICIENT_STOCK",
                        "Only " + product.getStockQuantity() + " units available for '" + product.getName() + "'");
            }
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(req.getQuantity())
                    .build();
            cart.getItems().add(item);
        }

        cart = cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse updateItemQuantity(Long userId, Long productId, int quantity) {
        if (quantity < 0) {
            throw new BusinessException("INVALID_QTY", "Quantity cannot be negative");
        }

        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new BusinessException("CART_NOT_FOUND", "Cart not found"));

        if (quantity == 0) {
            cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        } else {
            Product product = productRepository.findById(productId)
                    .filter(Product::isActive)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

            if (quantity > product.getStockQuantity()) {
                throw new BusinessException("INSUFFICIENT_STOCK",
                        "Only " + product.getStockQuantity() + " units available");
            }

            cart.getItems().stream()
                    .filter(i -> i.getProduct().getId().equals(productId))
                    .findFirst()
                    .ifPresent(i -> i.setQuantity(quantity));
        }

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long productId) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new BusinessException("CART_NOT_FOUND", "Cart not found"));
        cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse clearCart(Long userId) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new BusinessException("CART_NOT_FOUND", "Cart not found"));
        cart.getItems().clear();
        return toResponse(cartRepository.save(cart));
    }

    // ─────────────────────────────────────────────────────────
    // Mapping
    // ─────────────────────────────────────────────────────────

    private CartResponse toResponse(Cart cart) {
        List<CartResponse.CartItemResponse> items = cart.getItems().stream()
                .map(ci -> {
                    Product p = ci.getProduct();
                    BigDecimal effectivePrice = p.getEffectivePrice();
                    BigDecimal lineTotal = effectivePrice.multiply(BigDecimal.valueOf(ci.getQuantity()))
                            .setScale(2, RoundingMode.HALF_UP);
                    BigDecimal lineDiscount = p.getDiscountAmount().multiply(BigDecimal.valueOf(ci.getQuantity()))
                            .setScale(2, RoundingMode.HALF_UP);

                    return CartResponse.CartItemResponse.builder()
                            .productId(p.getId())
                            .productName(p.getName())
                            .brand(p.getBrand())
                            .sku(p.getSku())
                            .primaryImageUrl(p.getPrimaryImageUrl())
                            .sellingPrice(p.getSellingPrice())
                            .effectivePrice(effectivePrice)
                            .discountAmount(p.getDiscountAmount())
                            .discountType(p.getDiscountType())
                            .discountValue(p.getDiscountValue())
                            .quantity(ci.getQuantity())
                            .stockQuantity(p.getStockQuantity())
                            .stockStatus(p.getStockStatus())
                            .lineTotal(lineTotal)
                            .lineDiscount(lineDiscount)
                            .build();
                })
                .toList();

        BigDecimal subtotal = items.stream()
                .map(i -> i.getEffectivePrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalDiscount = items.stream()
                .map(CartResponse.CartItemResponse::getLineDiscount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return CartResponse.builder()
                .cartId(cart.getId())
                .items(items)
                .subtotal(subtotal)
                .totalDiscount(totalDiscount)
                .finalAmount(subtotal)
                .itemCount(items.stream().mapToInt(CartResponse.CartItemResponse::getQuantity).sum())
                .build();
    }
}
