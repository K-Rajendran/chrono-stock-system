package com.soulxtime.store.service;

import com.soulxtime.store.dto.request.BillCreateRequest;
import com.soulxtime.store.dto.request.BillUpdateRequest;
import com.soulxtime.store.dto.response.BillResponse;
import com.soulxtime.store.dto.response.DashboardResponse;
import com.soulxtime.store.entity.*;
import com.soulxtime.store.exception.BusinessException;
import com.soulxtime.store.exception.InsufficientStockException;
import com.soulxtime.store.exception.ResourceNotFoundException;
import com.soulxtime.store.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillService {

    private final BillRepository billRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final BillNumberSequenceRepository sequenceRepository;
    private final InventoryService inventoryService;

    @Value("${app.billing.number-prefix:AF}")
    private String billPrefix;

    // ─────────────────────────────────────────────────────────
    // Bill Creation
    // ─────────────────────────────────────────────────────────

    /**
     * Creates a bill and atomically deducts inventory.
     * All price calculations happen here — never trust browser-submitted totals.
     *
     * Financial formulas:
     *   linePriceAfterDiscount = sellingPrice × (1 - discountPct/100)   [for PERCENTAGE]
     *   linePriceAfterDiscount = sellingPrice - discountFixed            [for FIXED_AMOUNT]
     *   lineTotal              = linePriceAfterDiscount × quantity
     *   subtotal               = SUM(sellingPriceSnapshot × quantity)
     *   totalDiscount          = SUM(lineDiscountAmount)
     *   finalTotal             = SUM(totalPrice)
     */
    @Transactional
    public BillResponse createBill(BillCreateRequest req, Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminId));

        // CUSTOMER / PURCHASE REQUEST RESOLUTION
        PurchaseRequest purchaseRequest = null;
        User customer = null;

        // ONLINE / PURCHASE-REQUEST BILL
        if (req.getPurchaseRequestId() != null) {

            purchaseRequest = purchaseRequestRepository
                    .findById(req.getPurchaseRequestId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "PurchaseRequest",
                            req.getPurchaseRequestId()
                    ));

            customer = purchaseRequest.getUser();

            if (customer == null) {
                throw new BusinessException(
                        "CUSTOMER_NOT_FOUND",
                        "Purchase request is not associated with a registered user"
                );
            }

            log.debug(
                    "Creating bill from purchase request: purchaseRequestId={}, customerId={}",
                    purchaseRequest.getId(),
                    customer.getId()
            );

            // OFFLINE BILL
        } else {
            log.debug(
                    "Creating offline bill: customerName={}, customerPhone={}",
                    req.getCustomerName(),
                    req.getCustomerPhone()
            );
        }

        // Build items with server-side price calculation
        List<BillItem> billItems = new ArrayList<>();
        Map<Product, Integer> stockDeductions = new LinkedHashMap<>();

        for (BillCreateRequest.BillItemRequest itemReq : req.getItems()) {
            if (itemReq.getQuantity() <= 0) {
                throw new BusinessException("INVALID_QTY", "Quantity must be at least 1");
            }

            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.getProductId()));

            if (!product.isActive()) {
                throw new BusinessException("PRODUCT_INACTIVE",
                        "Product '" + product.getName() + "' is no longer available");
            }

            // Use current product discount unless admin overrides
            Product.DiscountType discType = itemReq.getDiscountType() != null
                    ? itemReq.getDiscountType() : product.getDiscountType();
            BigDecimal discValue = itemReq.getDiscountValue() != null
                    ? itemReq.getDiscountValue() : product.getDiscountValue();

            // Calculate effective unit price server-side
            BigDecimal unitPriceAfterDiscount = computeEffectivePrice(product.getSellingPrice(), discType, discValue);
            BigDecimal lineDiscountAmt = product.getSellingPrice().subtract(unitPriceAfterDiscount)
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = unitPriceAfterDiscount
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            BillItem billItem = BillItem.builder()
                    .product(product)
                    .productNameSnapshot(product.getName())
                    .sellingPriceSnapshot(product.getSellingPrice())
                    .purchaseCostSnapshot(product.getPurchaseCost())   // for profit calc
                    .discountValueSnapshot(discValue)
                    .discountTypeSnapshot(discType)
                    .quantity(itemReq.getQuantity())
                    .lineDiscountAmount(lineDiscountAmt)
                    .totalPrice(lineTotal)
                    .build();

            billItems.add(billItem);
            stockDeductions.merge(product, itemReq.getQuantity(), Integer::sum);
        }

        // Validate all stock before deducting anything (all-or-nothing)
        for (Map.Entry<Product, Integer> entry : stockDeductions.entrySet()) {
            if (entry.getKey().getStockQuantity() < entry.getValue()) {
                throw new InsufficientStockException(
                        entry.getKey().getName(), entry.getValue(), entry.getKey().getStockQuantity());
            }
        }

        // Original subtotal: selling price × quantity, BEFORE discounts
        BigDecimal subtotal = billItems.stream()
                .map(item -> item.getSellingPriceSnapshot()
                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        // Total discount across all bill items
        BigDecimal totalDiscount = billItems.stream()
                .map(BillItem::getLineDiscountAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        // Final amount payable AFTER discounts
        BigDecimal finalTotal = billItems.stream()
                .map(BillItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal expectedFinalTotal = subtotal
                .subtract(totalDiscount)
                .setScale(2, RoundingMode.HALF_UP);

        if (finalTotal.compareTo(expectedFinalTotal) != 0) {
            log.error(
                    "Bill calculation mismatch: subtotal={}, discount={}, " +
                            "finalTotal={}, expectedFinalTotal={}",
                    subtotal,
                    totalDiscount,
                    finalTotal,
                    expectedFinalTotal
            );

            throw new BusinessException(
                    "BILL_CALCULATION_ERROR",
                    "Bill total calculation is inconsistent"
            );
        }


        String billNumber = generateBillNumber();

        Bill bill = Bill.builder()
                .billNumber(billNumber)
                .user(customer)
                .customerName(req.getCustomerName())
                .customerPhone(req.getCustomerPhone())
                .subtotal(subtotal)
                .totalDiscount(totalDiscount)
                .finalTotal(finalTotal)
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : Bill.PaymentMethod.CASH)
                .paymentStatus(req.getPaymentStatus() != null ? req.getPaymentStatus() : Bill.PaymentStatus.PENDING)
                .transactionRef(req.getTransactionRef())
                .billStatus(Bill.BillStatus.ISSUED)
                .purchaseRequest(purchaseRequest)
                .createdBy(admin)
                .notes(req.getNotes())
                .items(new ArrayList<>())
                .build();

        bill = billRepository.save(bill);

        // Link items to bill
        for (BillItem item : billItems) {
            item.setBill(bill);
        }
        bill.getItems().addAll(billItems);
        bill = billRepository.save(bill);

        // Deduct stock atomically for each product
        for (Map.Entry<Product, Integer> entry : stockDeductions.entrySet()) {
            inventoryService.deductStockForBill(entry.getKey(), entry.getValue(), bill.getId(), admin);
        }

        // Update purchase request status
        if (purchaseRequest != null) {
            purchaseRequest.setStatus(PurchaseRequest.PurchaseRequestStatus.BILL_GENERATED);
            purchaseRequest.setBillId(bill.getId());
            purchaseRequestRepository.save(purchaseRequest);
        }

        log.info("Bill created: {} for customer {} (total: {})", billNumber, req.getCustomerName(), subtotal);
        return toResponse(bill, true);
    }

    /**
     * Edit a bill.
     * CRITICAL inventory consistency:
     * - If quantity reduced: return excess stock to inventory
     * - If quantity increased: deduct additional stock (check availability first)
     * - If item removed: return all stock
     * - If item added: deduct stock
     * All in one transaction.
     */
    @Transactional
    public BillResponse updateBill(Long billId, BillUpdateRequest req, Long adminId) {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Bill", billId));

        if (bill.getBillStatus() == Bill.BillStatus.CANCELLED) {
            throw new BusinessException(
                    "BILL_CANCELLED",
                    "Cannot edit a cancelled bill"
            );
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", adminId));

        /*
         * ============================================================
         * UPDATE ITEMS + INVENTORY
         * ============================================================
         */

        if (req.getItems() != null) {

            /*
             * Existing bill quantities
             *
             * productId -> old quantity
             */
            Map<Long, Integer> currentQuantities = new LinkedHashMap<>();

            for (BillItem item : bill.getItems()) {

                if (item.getProduct() == null) {
                    continue;
                }

                Long productId = item.getProduct().getId();

                currentQuantities.merge(
                        productId,
                        item.getQuantity(),
                        Integer::sum
                );
            }

            /*
             * New requested quantities
             *
             * productId -> new item request
             */
            Map<Long, BillCreateRequest.BillItemRequest> requestedItems =
                    new LinkedHashMap<>();

            for (BillCreateRequest.BillItemRequest itemReq : req.getItems()) {

                if (itemReq.getProductId() == null) {
                    throw new BusinessException(
                            "INVALID_PRODUCT",
                            "Product ID is required"
                    );
                }

                if ((itemReq.getQuantity() <= 0)) {

                    throw new BusinessException(
                            "INVALID_QTY",
                            "Quantity must be at least 1"
                    );
                }

                /*
                 * Prevent the same product from being submitted twice.
                 */
                if (requestedItems.containsKey(itemReq.getProductId())) {
                    throw new BusinessException(
                            "DUPLICATE_PRODUCT",
                            "Product cannot appear more than once in a bill"
                    );
                }

                requestedItems.put(
                        itemReq.getProductId(),
                        itemReq
                );
            }

            /*
             * ========================================================
             * 1. REMOVED PRODUCTS
             *
             * Old quantity exists, new quantity doesn't.
             * Return the complete old quantity to inventory.
             * ========================================================
             */

            for (Map.Entry<Long, Integer> entry :
                    currentQuantities.entrySet()) {

                Long productId = entry.getKey();
                int oldQty = entry.getValue();

                if (!requestedItems.containsKey(productId)) {

                    Product product = productRepository.findById(productId)
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(
                                            "Product",
                                            productId
                                    ));

                    inventoryService.returnStockForBill(
                            product,
                            oldQty,
                            billId,
                            admin,
                            "Bill edit - item removed from Bill #"
                                    + bill.getBillNumber()
                    );
                }
            }

            /*
             * ========================================================
             * 2. ADDED / REMAINING PRODUCTS
             *
             * Compare old quantity with new quantity.
             *
             * new > old:
             *      deduct difference
             *
             * new < old:
             *      return difference
             *
             * new == old:
             *      no inventory movement
             * ========================================================
             */

            List<BillItem> newBillItems = new ArrayList<>();

            for (Map.Entry<Long, BillCreateRequest.BillItemRequest> entry :
                    requestedItems.entrySet()) {

                Long productId = entry.getKey();
                BillCreateRequest.BillItemRequest itemReq = entry.getValue();

                Product product = productRepository.findById(productId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Product",
                                        productId
                                ));

                int oldQty = currentQuantities.getOrDefault(
                        productId,
                        0
                );

                int newQty = itemReq.getQuantity();

                int quantityDifference = newQty - oldQty;

                /*
                 * ----------------------------------------------------
                 * Quantity increased
                 * ----------------------------------------------------
                 */
                if (quantityDifference > 0) {

                    inventoryService.deductStockForBill(
                            product,
                            quantityDifference,
                            billId,
                            admin
                    );
                }

                /*
                 * ----------------------------------------------------
                 * Quantity decreased
                 * ----------------------------------------------------
                 */
                else if (quantityDifference < 0) {

                    inventoryService.returnStockForBill(
                            product,
                            Math.abs(quantityDifference),
                            billId,
                            admin,
                            "Bill edit - quantity reduced on Bill #"
                                    + bill.getBillNumber()
                    );
                }

                /*
                 * ----------------------------------------------------
                 * Discount
                 * ----------------------------------------------------
                 */

                Product.DiscountType discountType =
                        itemReq.getDiscountType() != null
                                ? itemReq.getDiscountType()
                                : product.getDiscountType();

                BigDecimal discountValue =
                        itemReq.getDiscountValue() != null
                                ? itemReq.getDiscountValue()
                                : product.getDiscountValue();

                /*
                 * Defensive defaults.
                 */
                if (discountType == null) {
                    discountType = Product.DiscountType.PERCENTAGE;
                }

                if (discountValue == null) {
                    discountValue = BigDecimal.ZERO;
                }

                /*
                 * Prevent invalid negative discounts.
                 */
                discountValue = discountValue.max(BigDecimal.ZERO);

                /*
                 * Compute discounted unit price.
                 */
                BigDecimal unitPriceAfterDiscount =
                        computeEffectivePrice(
                                product.getSellingPrice(),
                                discountType,
                                discountValue
                        );

                /*
                 * Discount cannot make price negative.
                 */
                unitPriceAfterDiscount =
                        unitPriceAfterDiscount.max(BigDecimal.ZERO);

                /*
                 * Line discount.
                 */
                BigDecimal lineDiscountAmount =
                        product.getSellingPrice()
                                .subtract(unitPriceAfterDiscount)
                                .multiply(BigDecimal.valueOf(newQty))
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                );

                /*
                 * Line total.
                 */
                BigDecimal lineTotal =
                        unitPriceAfterDiscount
                                .multiply(BigDecimal.valueOf(newQty))
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                );

                /*
                 * Build replacement BillItem.
                 */
                BillItem newItem = BillItem.builder()
                        .bill(bill)
                        .product(product)
                        .productNameSnapshot(product.getName())
                        .sellingPriceSnapshot(product.getSellingPrice())
                        .purchaseCostSnapshot(product.getPurchaseCost())
                        .discountValueSnapshot(discountValue)
                        .discountTypeSnapshot(discountType)
                        .quantity(newQty)
                        .lineDiscountAmount(lineDiscountAmount)
                        .totalPrice(lineTotal)
                        .build();

                newBillItems.add(newItem);
            }

            /*
             * Replace old bill items.
             *
             * This assumes your Bill.items mapping has:
             *
             * orphanRemoval = true
             *
             * and cascade = CascadeType.ALL
             */
            bill.getItems().clear();
            bill.getItems().addAll(newBillItems);

            /*
             * ========================================================
             * RECALCULATE BILL TOTALS
             * ========================================================
             */

            BigDecimal subtotal = newBillItems.stream()
                    .map(item ->
                            item.getSellingPriceSnapshot()
                                    .multiply(
                                            BigDecimal.valueOf(
                                                    item.getQuantity()
                                            )
                                    )
                    )
                    .reduce(
                            BigDecimal.ZERO,
                            BigDecimal::add
                    )
                    .setScale(
                            2,
                            RoundingMode.HALF_UP
                    );

            BigDecimal totalDiscount = newBillItems.stream()
                    .map(BillItem::getLineDiscountAmount)
                    .reduce(
                            BigDecimal.ZERO,
                            BigDecimal::add
                    )
                    .setScale(
                            2,
                            RoundingMode.HALF_UP
                    );

            BigDecimal finalTotal = newBillItems.stream()
                    .map(BillItem::getTotalPrice)
                    .reduce(
                            BigDecimal.ZERO,
                            BigDecimal::add
                    )
                    .setScale(
                            2,
                            RoundingMode.HALF_UP
                    );

            bill.setSubtotal(subtotal);
            bill.setTotalDiscount(totalDiscount);
            bill.setFinalTotal(finalTotal);
        }

        /*
         * ============================================================
         * UPDATE OTHER BILL FIELDS
         * ============================================================
         */

        if (req.getCustomerName() != null) {
            bill.setCustomerName(req.getCustomerName());
        }

        if (req.getCustomerPhone() != null) {
            bill.setCustomerPhone(req.getCustomerPhone());
        }

        if (req.getPaymentMethod() != null) {
            bill.setPaymentMethod(req.getPaymentMethod());
        }

        if (req.getPaymentStatus() != null) {
            bill.setPaymentStatus(req.getPaymentStatus());
        }

        if (req.getTransactionRef() != null) {
            bill.setTransactionRef(req.getTransactionRef());
        }

        if (req.getBillStatus() != null) {
            bill.setBillStatus(req.getBillStatus());
        }

        if (req.getNotes() != null) {
            bill.setNotes(req.getNotes());
        }

        /*
         * Save.
         */
        bill = billRepository.save(bill);

        log.info(
                "Bill updated: billId={}, billNumber={}",
                bill.getId(),
                bill.getBillNumber()
        );

        return toResponse(bill, true);
    }

    /**
     * Cancel a bill — returns ALL stock.
     */
    @Transactional
    public BillResponse cancelBill(Long billId, Long adminId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", billId));

        if (bill.getBillStatus() == Bill.BillStatus.CANCELLED) {
            throw new BusinessException("ALREADY_CANCELLED", "Bill is already cancelled");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminId));

        // Return all stock
        for (BillItem item : bill.getItems()) {
            if (item.getProduct() != null) {
                inventoryService.returnStockForBill(
                        item.getProduct(), item.getQuantity(), billId, admin,
                        "Cancellation - Bill #" + bill.getBillNumber()
                );
            }
        }

        bill.setBillStatus(Bill.BillStatus.CANCELLED);
        bill.setPaymentStatus(Bill.PaymentStatus.CANCELLED);
        bill = billRepository.save(bill);

        if (bill.getPurchaseRequest() != null) {
            bill.getPurchaseRequest().setStatus(PurchaseRequest.PurchaseRequestStatus.CANCELLED);
            purchaseRequestRepository.save(bill.getPurchaseRequest());
        }

        log.info("Bill cancelled: {}", bill.getBillNumber());
        return toResponse(bill, true);
    }

    // ─────────────────────────────────────────────────────────
    // Read
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public BillResponse getBillById(Long billId, Long requestingUserId, boolean isAdmin) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", billId));

        log.debug("Requesting user id: {}", requestingUserId);
        // Security: customers can only see their own bills
        if (!isAdmin && (bill.getUser() == null || !bill.getUser().getId().equals(requestingUserId))) {
            throw new BusinessException("FORBIDDEN", "You do not have access to this bill");
        }

        return toResponse(bill, isAdmin);
    }

    @Transactional(readOnly = true)
    public Page<BillResponse> getCustomerBills(Long userId, Pageable pageable) {
        return billRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(b -> toResponse(b, false));
    }

    @Transactional(readOnly = true)
    public Page<BillResponse> searchBillsAdmin(
            String search,
            Bill.PaymentStatus paymentStatus,
            Bill.BillStatus billStatus,
            Pageable pageable) {

        Specification<Bill> specification = Specification.where(null);

        if (search != null && !search.isBlank()) {
            String value = search.trim().toLowerCase();

            specification = specification.and((root, query, cb) ->
                    cb.or(
                            cb.like(
                                    cb.lower(root.get("customerName")),
                                    "%" + value + "%"
                            ),
                            cb.like(
                                    cb.lower(root.get("billNumber")),
                                    "%" + value + "%"
                            )
                    )
            );
        }

        if (paymentStatus != null) {
            specification = specification.and((root, query, cb) ->
                    cb.equal(root.get("paymentStatus"), paymentStatus)
            );
        }

        if (billStatus != null) {
            specification = specification.and((root, query, cb) ->
                    cb.equal(root.get("billStatus"), billStatus)
            );
        }

        return billRepository.findAll(specification, pageable)
                .map(b -> toResponse(b, true));
    }

    // ─────────────────────────────────────────────────────────
    // Dashboard
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String period) {
        Instant[] range = parsePeriodRange(period);
        Instant from = range[0], to = range[1];

        BigDecimal netRevenue = billRepository.sumNetRevenueBetween(from, to);
        BigDecimal goodsCost = billRepository.sumGoodsCostBetween(from, to);
        BigDecimal grossProfit = netRevenue.subtract(goodsCost).setScale(2, RoundingMode.HALF_UP);

        // Today
        Instant todayStart = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant todayEnd = todayStart.plus(1, ChronoUnit.DAYS);
        BigDecimal todayRevenue = billRepository.sumNetRevenueBetween(todayStart, todayEnd);
        long todayBills = billRepository.countBillsBetween(todayStart, todayEnd);

        long periodBills = billRepository.countBillsBetween(from, to);
        long totalBills = billRepository.countAllNonCancelledBills();

        List<BillResponse> recentBills = billRepository.findRecentBills(PageRequest.of(0, 10))
                .stream().map(b -> toResponse(b, true)).toList();

        List<BillResponse> pendingBills = billRepository.findPendingPaymentBills(PageRequest.of(0, 5))
                .stream().map(b -> toResponse(b, true)).toList();

        return DashboardResponse.builder()
                .netRevenuePeriod(netRevenue)
                .goodsCostPeriod(goodsCost)
                .grossProfitPeriod(grossProfit)
                .todayRevenue(todayRevenue)
                .todayBillCount(todayBills)
                .periodBillCount(periodBills)
                .totalBillCount(totalBills)
                .recentBills(recentBills)
                .pendingBills(pendingBills)
                .build();
    }

    // ─────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────

    private BigDecimal computeEffectivePrice(BigDecimal price, Product.DiscountType type, BigDecimal discValue) {
        if (discValue == null || discValue.compareTo(BigDecimal.ZERO) == 0) return price;
        if (Product.DiscountType.PERCENTAGE.equals(type)) {
            if (discValue.compareTo(BigDecimal.ZERO) < 0 || discValue.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BusinessException(
                        "INVALID_DISCOUNT",
                        "Percentage discount must be between 0 and 100"
                );
            }
            return price.multiply(BigDecimal.ONE.subtract(
                    discValue.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
            )).setScale(2, RoundingMode.HALF_UP);
        } else {
            if (discValue.compareTo(BigDecimal.ZERO) < 0 ||
                    discValue.compareTo(price) > 0) {
                throw new BusinessException(
                        "INVALID_DISCOUNT",
                        "Fixed discount cannot exceed the selling price"
                );
            }
            return price.subtract(discValue).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }
    }

    /**
     * Generates a unique, collision-safe bill number using DB row lock.
     * Pattern: {PREFIX}-{YEAR}-{SEQUENCE padded to 6 digits}
     * e.g. ST-2026-000001
     */
    @Transactional
    public String generateBillNumber() {
        int year = LocalDate.now(ZoneOffset.UTC).getYear();

        BillNumberSequence seq = sequenceRepository.findByYearKeyForUpdate(year)
                .orElseGet(() -> {
                    BillNumberSequence s = new BillNumberSequence(year, 0L);
                    return sequenceRepository.save(s);
                });

        long next = seq.getLastSeq() + 1;
        seq.setLastSeq(next);
        sequenceRepository.save(seq);

        return String.format("%s-%d-%06d", billPrefix, year, next);
    }

    private Instant[] parsePeriodRange(String period) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return switch (period != null ? period : "this_month") {
            case "today"      -> range(today, today);
            case "yesterday"  -> range(today.minusDays(1), today.minusDays(1));
            case "last_7"     -> range(today.minusDays(6), today);
            case "last_30"    -> range(today.minusDays(29), today);
            case "this_month" -> range(today.withDayOfMonth(1), today);
            case "all_time"   -> new Instant[]{ Instant.EPOCH, Instant.now().plus(1, ChronoUnit.DAYS) };
            default           -> range(today.withDayOfMonth(1), today);
        };
    }

    private Instant[] range(LocalDate from, LocalDate to) {
        return new Instant[]{
                from.atStartOfDay().toInstant(ZoneOffset.UTC),
                to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        };
    }

    private BillResponse toResponse(Bill bill, boolean includeAdminData) {
        List<BillResponse.BillItemResponse> items = bill.getItems().stream()
                .map(i -> BillResponse.BillItemResponse.builder()
                        .id(i.getId())
                        .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                        .productName(i.getProductNameSnapshot())
                        .sellingPrice(i.getSellingPriceSnapshot())
                        .purchaseCost(includeAdminData ? i.getPurchaseCostSnapshot() : null)
                        .discountValue(i.getDiscountValueSnapshot())
                        .discountType(i.getDiscountTypeSnapshot())
                        .quantity(i.getQuantity())
                        .lineDiscountAmount(i.getLineDiscountAmount())
                        .totalPrice(i.getTotalPrice())
                        .build())
                .toList();

        ZoneId indiaZone = ZoneId.of("Asia/Kolkata");

        LocalDateTime whatsappSentAt = bill.getWhatsappSentAt() != null
                ? bill.getWhatsappSentAt().atZone(indiaZone).toLocalDateTime()
                : null;
        LocalDateTime createdAt =
                bill.getCreatedAt().atZone(indiaZone).toLocalDateTime();
        LocalDateTime updatedAt =
                bill.getUpdatedAt().atZone(indiaZone).toLocalDateTime();

        return BillResponse.builder()
                .id(bill.getId())
                .billNumber(bill.getBillNumber())
                .userId(bill.getUser() != null ? bill.getUser().getId() : null)
                .customerName(bill.getCustomerName())
                .customerPhone(bill.getCustomerPhone())
                .subtotal(bill.getSubtotal())
                .totalDiscount(bill.getTotalDiscount())
                .finalTotal(bill.getFinalTotal())
                .paymentMethod(bill.getPaymentMethod())
                .paymentStatus(bill.getPaymentStatus())
                .transactionRef(bill.getTransactionRef())
                .billStatus(bill.getBillStatus())
                .purchaseRequestId(bill.getPurchaseRequest() != null ? bill.getPurchaseRequest().getId() : null)
                .notes(bill.getNotes())
                .whatsappSentAt(whatsappSentAt)
                .items(items)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }
}
