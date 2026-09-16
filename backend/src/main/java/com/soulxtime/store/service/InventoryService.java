package com.soulxtime.store.service;

import com.soulxtime.store.dto.request.StockAdjustRequest;
import com.soulxtime.store.dto.response.InventoryTransactionResponse;
import com.soulxtime.store.entity.InventoryTransaction;
import com.soulxtime.store.entity.Product;
import com.soulxtime.store.entity.User;
import com.soulxtime.store.exception.BusinessException;
import com.soulxtime.store.exception.InsufficientStockException;
import com.soulxtime.store.exception.ResourceNotFoundException;
import com.soulxtime.store.repository.InventoryTransactionRepository;
import com.soulxtime.store.repository.ProductRepository;
import com.soulxtime.store.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final ProductRepository productRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    /**
     * Admin-initiated stock adjustment.
     * Records full audit trail in inventory_transactions.
     */
    @Transactional
    public InventoryTransactionResponse adjustStock(Long productId, StockAdjustRequest req, Long adminUserId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminUserId));

        int before = product.getStockQuantity();
        int change = getChange(req);

        int after = before + change;
        if (after < 0) {
            throw new InsufficientStockException(product.getName(), Math.abs(change), before);
        }

        product.setStockQuantity(after);
        product.updateStockStatus();
        productRepository.save(product);

        InventoryTransaction tx = InventoryTransaction.builder()
                .product(product)
                .transactionType(req.getType())
                .quantityChange(change)
                .quantityBefore(before)
                .quantityAfter(after)
                .reason(req.getReason())
                .referenceId(req.getReferenceId())
                .referenceType(req.getReferenceType())
                .performedBy(admin)
                .build();

        tx = transactionRepository.save(tx);
        log.info("Stock adjusted for product {}: {} {} -> {}", productId, change > 0 ? "+" : "", change, after);

        return toResponse(tx);
    }

    private static int getChange(StockAdjustRequest req) {
        int change = 0;

        switch (req.getType()) {
            case PURCHASE, ADJUSTMENT -> {
                if (req.getQuantity() == 0) throw new BusinessException("INVALID_QTY", "Quantity cannot be zero");
                change = req.getQuantity();
            }
            case RETURN, CANCELLATION -> {
                if (req.getQuantity() <= 0) throw new BusinessException("INVALID_QTY", "Quantity must be positive");
                change = req.getQuantity(); // restoring stock
            }
            default -> throw new BusinessException("INVALID_TYPE", "Unknown transaction type");
        }
        return change;
    }

    /**
     * Internal — deducts stock atomically during bill creation.
     * Uses optimistic locking (@Version) to prevent race conditions.
     * If two concurrent requests try to deduct stock, one will succeed,
     * the other will receive ObjectOptimisticLockingFailureException and be retried or rejected.
     */
    @Transactional
    public void deductStockForBill(Product product, int quantity, Long billId, User performedBy) {
        int before = product.getStockQuantity();
        if (before < quantity) {
            throw new InsufficientStockException(product.getName(), quantity, before);
        }

        int after = before - quantity;
        product.setStockQuantity(after);
        product.updateStockStatus();

        try {
            productRepository.save(product); // @Version check happens here
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new BusinessException("STOCK_CONFLICT",
                    "Stock was modified concurrently. Please retry your purchase.");
        }

        InventoryTransaction tx = InventoryTransaction.builder()
                .product(product)
                .transactionType(InventoryTransaction.TransactionType.SALE)
                .quantityChange(-quantity)
                .quantityBefore(before)
                .quantityAfter(after)
                .reason("Sale - Bill #" + billId)
                .referenceId(billId)
                .referenceType("BILL")
                .performedBy(performedBy)
                .build();

        transactionRepository.save(tx);
    }

    /**
     * Internal — returns stock atomically when bill is edited (quantity reduced) or cancelled.
     */
    @Transactional
    public void returnStockForBill(Product product, int quantity, Long billId, User performedBy, String reason) {
        int before = product.getStockQuantity();
        int after = before + quantity;

        product.setStockQuantity(after);
        product.updateStockStatus();
        productRepository.save(product);

        InventoryTransaction tx = InventoryTransaction.builder()
                .product(product)
                .transactionType(InventoryTransaction.TransactionType.RETURN)
                .quantityChange(quantity)
                .quantityBefore(before)
                .quantityAfter(after)
                .reason(reason != null ? reason : "Return - Bill #" + billId)
                .referenceId(billId)
                .referenceType("BILL")
                .performedBy(performedBy)
                .build();

        transactionRepository.save(tx);
    }

    @Transactional(readOnly = true)
    public Page<InventoryTransactionResponse> getHistory(Long productId, Pageable pageable) {
        return transactionRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .map(this::toResponse);
    }

    private InventoryTransactionResponse toResponse(InventoryTransaction tx) {
        return InventoryTransactionResponse.builder()
                .id(tx.getId())
                .productId(tx.getProduct().getId())
                .productName(tx.getProduct().getName())
                .transactionType(tx.getTransactionType())
                .quantityChange(tx.getQuantityChange())
                .quantityBefore(tx.getQuantityBefore())
                .quantityAfter(tx.getQuantityAfter())
                .reason(tx.getReason())
                .referenceId(tx.getReferenceId())
                .referenceType(tx.getReferenceType())
                .performedByName(tx.getPerformedBy() != null ? tx.getPerformedBy().getFullName() : "System")
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
