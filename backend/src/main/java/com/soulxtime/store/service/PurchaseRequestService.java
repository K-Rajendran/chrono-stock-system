package com.soulxtime.store.service;

import com.soulxtime.store.dto.request.PurchaseRequestCreate;
import com.soulxtime.store.dto.response.PurchaseRequestResponse;
import com.soulxtime.store.entity.*;
import com.soulxtime.store.exception.BusinessException;
import com.soulxtime.store.exception.ResourceNotFoundException;
import com.soulxtime.store.repository.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseRequestService {

    private final PurchaseRequestRepository requestRepository;
    private final PurchaseRequestSequenceRepository seqRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;

    /**
     * Creates a purchase request from the customer's cart.
     * All prices calculated server-side from current product data.
     * Cart is cleared after successful request creation.
     */
    @Transactional
    public PurchaseRequestResponse createFromCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new BusinessException("EMPTY_CART", "Your cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new BusinessException("EMPTY_CART", "Your cart is empty");
        }

        List<PurchaseRequestItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            if (!product.isActive()) {
                throw new BusinessException("PRODUCT_INACTIVE",
                        "'" + product.getName() + "' is no longer available. Please update your cart.");
            }
            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new BusinessException("INSUFFICIENT_STOCK",
                        "Only " + product.getStockQuantity() + " units available for '" + product.getName() + "'");
            }

            BigDecimal effectivePrice = product.getEffectivePrice();
            BigDecimal discountAmt = product.getDiscountAmount().multiply(BigDecimal.valueOf(cartItem.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = effectivePrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            PurchaseRequestItem item = PurchaseRequestItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .unitPrice(effectivePrice)
                    .discountValue(product.getDiscountValue())
                    .discountType(product.getDiscountType())
                    .quantity(cartItem.getQuantity())
                    .lineTotal(lineTotal)
                    .build();

            items.add(item);
            subtotal = subtotal.add(lineTotal);
            totalDiscount = totalDiscount.add(discountAmt);
        }

        String referenceId = generateReferenceId();

        PurchaseRequest pr = PurchaseRequest.builder()
                .referenceId(referenceId)
                .user(user)
                .customerName(user.getFullName())
                .customerPhone(user.getPhone() != null ? user.getPhone() : "")
                .status(PurchaseRequest.PurchaseRequestStatus.REQUESTED)
                .subtotal(subtotal)
                .totalDiscount(totalDiscount)
                .totalAmount(subtotal)
                .items(new ArrayList<>())
                .build();

        pr = requestRepository.save(pr);

        for (PurchaseRequestItem item : items) {
            item.setRequest(pr);
        }
        pr.getItems().addAll(items);
        pr = requestRepository.save(pr);

        // Clear cart
        cart.getItems().clear();
        cartRepository.save(cart);

        log.info("Purchase request created: {} for user {}", referenceId, userId);
        return toResponse(pr);
    }

    @Transactional(readOnly = true)
    public Page<PurchaseRequestResponse> getCustomerRequests(Long userId, Pageable pageable) {
        return requestRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PurchaseRequestResponse getRequest(Long id, Long requestingUserId, boolean isAdmin) {
        PurchaseRequest pr = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request", id));

        if (!isAdmin && !pr.getUser().getId().equals(requestingUserId)) {
            throw new BusinessException("FORBIDDEN", "You do not have access to this request");
        }

        return toResponse(pr);
    }

    @Transactional(readOnly = true)
    public Page<PurchaseRequestResponse> searchRequestsAdmin(
            String search, PurchaseRequest.PurchaseRequestStatus status, Pageable pageable) {
        return requestRepository
                .findAll(adminSearch(search, status), pageable)
                .map(this::toResponse);
    }

    public static Specification<PurchaseRequest> adminSearch(
            String search, PurchaseRequest.PurchaseRequestStatus status) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("customerName")), pattern),
                        cb.like(cb.lower(root.get("referenceId")), pattern)
                ));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Transactional
    public PurchaseRequestResponse updateStatus(Long id, PurchaseRequest.PurchaseRequestStatus newStatus, Long adminId) {
        PurchaseRequest pr = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request", id));

        if (pr.getStatus() == PurchaseRequest.PurchaseRequestStatus.CANCELLED) {
            throw new BusinessException("ALREADY_CANCELLED", "Cannot update a cancelled request");
        }

        pr.setStatus(newStatus);
        pr = requestRepository.save(pr);
        return toResponse(pr);
    }

    private String generateReferenceId() {
        int year = LocalDate.now(ZoneOffset.UTC).getYear();

        PurchaseRequestSequence seq = seqRepository.findByYearKeyForUpdate(year)
                .orElseGet(() -> {
                    PurchaseRequestSequence s = new PurchaseRequestSequence(year, 0L);
                    return seqRepository.save(s);
                });

        long next = seq.getLastSeq() + 1;
        seq.setLastSeq(next);
        seqRepository.save(seq);

        return String.format("PR-%d-%06d", year, next);
    }

    private PurchaseRequestResponse toResponse(PurchaseRequest pr) {
        List<PurchaseRequestResponse.PRItemResponse> items = pr.getItems().stream()
                .map(i -> PurchaseRequestResponse.PRItemResponse.builder()
                        .id(i.getId())
                        .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                        .productName(i.getProductName())
                        .unitPrice(i.getUnitPrice())
                        .discountValue(i.getDiscountValue())
                        .discountType(i.getDiscountType())
                        .quantity(i.getQuantity())
                        .lineTotal(i.getLineTotal())
                        .build())
                .toList();

        return PurchaseRequestResponse.builder()
                .id(pr.getId())
                .referenceId(pr.getReferenceId())
                .userId(pr.getUser().getId())
                .customerName(pr.getCustomerName())
                .customerPhone(pr.getCustomerPhone())
                .status(pr.getStatus())
                .subtotal(pr.getSubtotal())
                .totalDiscount(pr.getTotalDiscount())
                .totalAmount(pr.getTotalAmount())
                .notes(pr.getNotes())
                .billId(pr.getBillId())
                .whatsappSentAt(pr.getWhatsappSentAt())
                .items(items)
                .createdAt(pr.getCreatedAt())
                .updatedAt(pr.getUpdatedAt())
                .build();
    }
}
