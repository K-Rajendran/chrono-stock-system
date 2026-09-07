package com.soulxtime.store.service;

import com.soulxtime.store.dto.request.BillCreateRequest;
import com.soulxtime.store.dto.response.BillResponse;
import com.soulxtime.store.entity.*;
import com.soulxtime.store.exception.InsufficientStockException;
import com.soulxtime.store.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for BillService.
 * Tests critical business logic: stock deduction, bill editing, cancellation.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BillServiceIntegrationTest {

    @Autowired BillService billService;
    @Autowired ProductRepository productRepository;
    @Autowired UserRepository userRepository;
    @Autowired BillRepository billRepository;
    @Autowired InventoryTransactionRepository inventoryRepository;
    @Autowired CategoryRepository categoryRepository;

    private User adminUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.save(User.builder()
                .fullName("Test Admin")
                .email("testadmin" + System.nanoTime() + "@test.com")
                .passwordHash("$2a$12$dummy")
                .role(User.UserRole.ADMIN)
                .active(true)
                .build());

        testProduct = productRepository.save(Product.builder()
                .sku("TEST-" + System.nanoTime())
                .name("Test Watch")
                .sellingPrice(new BigDecimal("10000.00"))
                .purchaseCost(new BigDecimal("5000.00"))
                .discountValue(BigDecimal.ZERO)
                .discountType(Product.DiscountType.PERCENTAGE)
                .stockQuantity(20)
                .lowStockThreshold(5)
                .active(true)
                .build());
        testProduct.updateStockStatus();
        testProduct = productRepository.save(testProduct);
    }

    @Test
    @DisplayName("Creating a bill deducts stock correctly")
    void createBill_shouldDeductStock() {
        int initialStock = testProduct.getStockQuantity();

        BillCreateRequest req = buildBillRequest(testProduct.getId(), 3);
        BillResponse bill = billService.createBill(req, adminUser.getId());

        assertThat(bill).isNotNull();
        assertThat(bill.getBillNumber()).startsWith("ST-");

        Product updated = productRepository.findById(testProduct.getId()).orElseThrow();
        assertThat(updated.getStockQuantity()).isEqualTo(initialStock - 3);
    }

    @Test
    @DisplayName("Bill total is server-calculated (never trust browser price)")
    void createBill_shouldCalculateTotalsServerSide() {
        BillCreateRequest req = buildBillRequest(testProduct.getId(), 2);
        BillResponse bill = billService.createBill(req, adminUser.getId());

        // sellingPrice=10000, qty=2, no discount → total=20000
        assertThat(bill.getFinalTotal()).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(bill.getItems()).hasSize(1);
        assertThat(bill.getItems().get(0).getQuantity()).isEqualTo(2);
        assertThat(bill.getItems().get(0).getTotalPrice()).isEqualByComparingTo(new BigDecimal("20000.00"));
    }

    @Test
    @DisplayName("Insufficient stock throws exception and leaves stock unchanged")
    void createBill_insufficientStock_shouldThrow() {
        int initialStock = testProduct.getStockQuantity();

        BillCreateRequest req = buildBillRequest(testProduct.getId(), 999);

        assertThatThrownBy(() -> billService.createBill(req, adminUser.getId()))
                .isInstanceOf(InsufficientStockException.class);

        // Stock must remain unchanged
        Product unchanged = productRepository.findById(testProduct.getId()).orElseThrow();
        assertThat(unchanged.getStockQuantity()).isEqualTo(initialStock);
    }

    @Test
    @DisplayName("Editing bill to lower quantity returns excess stock")
    void updateBill_reducedQty_shouldReturnStock() {
        // Create bill with qty=5
        BillCreateRequest create = buildBillRequest(testProduct.getId(), 5);
        BillResponse bill = billService.createBill(create, adminUser.getId());

        int stockAfterCreate = productRepository.findById(testProduct.getId()).orElseThrow().getStockQuantity();

        // Edit to qty=3 — should return 2 units
        com.soulxtime.store.dto.request.BillUpdateRequest update =
                com.soulxtime.store.dto.request.BillUpdateRequest.builder()
                        .items(List.of(BillCreateRequest.BillItemRequest.builder()
                                .productId(testProduct.getId())
                                .quantity(3)
                                .build()))
                        .build();

        billService.updateBill(bill.getId(), update, adminUser.getId());

        int stockAfterEdit = productRepository.findById(testProduct.getId()).orElseThrow().getStockQuantity();
        assertThat(stockAfterEdit).isEqualTo(stockAfterCreate + 2);
    }

    @Test
    @DisplayName("Cancelling a bill returns all stock atomically")
    void cancelBill_shouldReturnAllStock() {
        int initialStock = testProduct.getStockQuantity();

        BillCreateRequest create = buildBillRequest(testProduct.getId(), 4);
        BillResponse bill = billService.createBill(create, adminUser.getId());

        assertThat(productRepository.findById(testProduct.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(initialStock - 4);

        billService.cancelBill(bill.getId(), adminUser.getId());

        assertThat(productRepository.findById(testProduct.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(initialStock);
    }

    @Test
    @DisplayName("Cancelled bill cannot be edited")
    void updateBill_cancelledBill_shouldThrow() {
        BillCreateRequest create = buildBillRequest(testProduct.getId(), 1);
        BillResponse bill = billService.createBill(create, adminUser.getId());
        billService.cancelBill(bill.getId(), adminUser.getId());

        com.soulxtime.store.dto.request.BillUpdateRequest update =
                com.soulxtime.store.dto.request.BillUpdateRequest.builder().build();

        assertThatThrownBy(() -> billService.updateBill(bill.getId(), update, adminUser.getId()))
                .isInstanceOf(com.soulxtime.store.exception.BusinessException.class)
                .hasMessageContaining("cancelled");
    }

    @Test
    @DisplayName("Bill number is sequential, unique, and human-readable")
    void createBill_shouldGenerateUniqueBillNumbers() {
        BillResponse b1 = billService.createBill(buildBillRequest(testProduct.getId(), 1), adminUser.getId());
        BillResponse b2 = billService.createBill(buildBillRequest(testProduct.getId(), 1), adminUser.getId());

        assertThat(b1.getBillNumber()).isNotEqualTo(b2.getBillNumber());
        assertThat(b1.getBillNumber()).matches("ST-\\d{4}-\\d{6}");
        assertThat(b2.getBillNumber()).matches("ST-\\d{4}-\\d{6}");
    }

    @Test
    @DisplayName("Price snapshots captured at bill creation time")
    void createBill_shouldCapturePriceSnapshots() {
        BillResponse bill = billService.createBill(buildBillRequest(testProduct.getId(), 1), adminUser.getId());

        // Admin view includes purchaseCost
        BillResponse adminBill = billService.getBillById(bill.getId(), null, true);
        assertThat(adminBill.getItems().get(0).getPurchaseCost())
                .isEqualByComparingTo(testProduct.getPurchaseCost());
        assertThat(adminBill.getItems().get(0).getSellingPrice())
                .isEqualByComparingTo(testProduct.getSellingPrice());

        // Customer view: purchaseCost should be null
        BillResponse customerBill = billService.getBillById(bill.getId(), null, false);
        assertThat(customerBill.getItems().get(0).getPurchaseCost()).isNull();
    }

    @Test
    @DisplayName("Inventory transaction record is created for each stock operation")
    void createBill_shouldRecordInventoryTransaction() {
        long txCountBefore = inventoryRepository.count();

        billService.createBill(buildBillRequest(testProduct.getId(), 2), adminUser.getId());

        long txCountAfter = inventoryRepository.count();
        assertThat(txCountAfter).isGreaterThan(txCountBefore);
    }

    // ─────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────

    private BillCreateRequest buildBillRequest(Long productId, int quantity) {
        return BillCreateRequest.builder()
                .customerName("Test Customer")
                .customerPhone("+91 99999 00001")
                .paymentMethod(Bill.PaymentMethod.CASH)
                .paymentStatus(Bill.PaymentStatus.PENDING)
                .items(List.of(
                        BillCreateRequest.BillItemRequest.builder()
                                .productId(productId)
                                .quantity(quantity)
                                .build()
                ))
                .build();
    }
}
