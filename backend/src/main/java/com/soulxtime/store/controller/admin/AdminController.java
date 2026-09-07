package com.soulxtime.store.controller.admin;

import com.soulxtime.store.dto.request.*;
import com.soulxtime.store.dto.response.*;
import com.soulxtime.store.entity.Bill;
import com.soulxtime.store.entity.PurchaseRequest;
import com.soulxtime.store.repository.ProductRepository;
import com.soulxtime.store.repository.UserRepository;
import com.soulxtime.store.service.*;
import com.soulxtime.store.service.whatsapp.WhatsAppService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final ProductService productService;
    private final BillService billService;
    private final PurchaseRequestService purchaseRequestService;
    private final InventoryService inventoryService;
    private final WhatsAppService whatsAppService;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────
    // Dashboard
    // ─────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(
            @RequestParam(defaultValue = "this_month") String period) {
        DashboardResponse dashboard = billService.getDashboard(period);

        // Enrich with inventory metrics from product repo
        dashboard.setTotalActiveProducts(productRepository.countActiveProducts());
        dashboard.setTotalStockUnits(productRepository.sumTotalStock() != null ? productRepository.sumTotalStock() : 0L);
        dashboard.setLowStockCount(productRepository.countLowStock());
        dashboard.setOutOfStockCount(productRepository.countOutOfStock());

        return ResponseEntity.ok(dashboard);
    }

    // ─────────────────────────────────────────────────────────
    // Products
    // ─────────────────────────────────────────────────────────

    @GetMapping("/products")
    public ResponseEntity<Page<ProductAdminResponse>> listProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String stockStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        com.soulxtime.store.entity.Product.StockStatus status = null;
        if (stockStatus != null && !stockStatus.isBlank()) {
            try { status = com.soulxtime.store.entity.Product.StockStatus.valueOf(stockStatus.toUpperCase()); }
            catch (Exception ignored) {}
        }

        return ResponseEntity.ok(productService.searchProductsAdmin(search, categoryId, status,
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductAdminResponse> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductAdmin(id));
    }

    @PostMapping("/products")
    public ResponseEntity<ProductAdminResponse> createProduct(@Valid @RequestBody ProductCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(req));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ProductAdminResponse> updateProduct(
            @PathVariable Long id, @RequestBody ProductUpdateRequest req) {
        return ResponseEntity.ok(productService.updateProduct(id, req));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deactivateProduct(@PathVariable Long id) {
        productService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────
    // Inventory
    // ─────────────────────────────────────────────────────────

    @PostMapping("/inventory/{productId}/adjust")
    public ResponseEntity<InventoryTransactionResponse> adjustStock(
            @PathVariable Long productId,
            @Valid @RequestBody StockAdjustRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow().getId();
        return ResponseEntity.ok(inventoryService.adjustStock(productId, req, adminId));
    }

    @GetMapping("/inventory/{productId}/history")
    public ResponseEntity<Page<InventoryTransactionResponse>> getInventoryHistory(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(inventoryService.getHistory(productId, PageRequest.of(page, size)));
    }

    @GetMapping("/inventory/low-stock")
    public ResponseEntity<List<ProductAdminResponse>> getLowStock() {
        List<ProductAdminResponse> products = productRepository.findLowStockProducts()
                .stream()
                .map(productService::toAdminResponse)
                .toList();

        return ResponseEntity.ok(products);
    }

    @GetMapping("/inventory/out-of-stock")
    public ResponseEntity<?> getOutOfStock() {
        return ResponseEntity.ok(productRepository.findOutOfStockProducts());
    }

    // ─────────────────────────────────────────────────────────
    // Bills
    // ─────────────────────────────────────────────────────────

    @GetMapping("/bills")
    public ResponseEntity<Page<BillResponse>> listBills(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String billStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Bill.PaymentStatus ps = null;
        Bill.BillStatus bs = null;
        try { if (paymentStatus != null) ps = Bill.PaymentStatus.valueOf(paymentStatus.toUpperCase()); } catch (Exception ignored) {}
        try { if (billStatus != null) bs = Bill.BillStatus.valueOf(billStatus.toUpperCase()); } catch (Exception ignored) {}

        return ResponseEntity.ok(billService.searchBillsAdmin(search, ps, bs, PageRequest.of(page, size)));
    }

    @GetMapping("/bills/{id}")
    public ResponseEntity<BillResponse> getBill(@PathVariable Long id) {
        return ResponseEntity.ok(billService.getBillById(id, null, true));
    }

    @PostMapping("/bills")
    public ResponseEntity<BillResponse> createBill(
            @Valid @RequestBody BillCreateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow().getId();
        return ResponseEntity.status(HttpStatus.CREATED).body(billService.createBill(req, adminId));
    }

    @PutMapping("/bills/{id}")
    public ResponseEntity<BillResponse> updateBill(
            @PathVariable Long id,
            @RequestBody BillUpdateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow().getId();
        return ResponseEntity.ok(billService.updateBill(id, req, adminId));
    }

    @PostMapping("/bills/{id}/cancel")
    public ResponseEntity<BillResponse> cancelBill(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow().getId();
        return ResponseEntity.ok(billService.cancelBill(id, adminId));
    }

    @PostMapping("/bills/{id}/send-whatsapp")
    public ResponseEntity<WhatsAppMessageResponse> sendBillViaWhatsApp(@PathVariable Long id) {
        return ResponseEntity.ok(whatsAppService.generateBillMessage(id));
    }

    // ─────────────────────────────────────────────────────────
    // Purchase Requests
    // ─────────────────────────────────────────────────────────

    @GetMapping("/purchase-requests")
    public ResponseEntity<Page<PurchaseRequestResponse>> listRequests(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PurchaseRequest.PurchaseRequestStatus s = null;
        try { if (status != null) s = PurchaseRequest.PurchaseRequestStatus.valueOf(status.toUpperCase()); }
        catch (Exception ignored) {}

        return ResponseEntity.ok(purchaseRequestService.searchRequestsAdmin(search, s, PageRequest.of(page, size)));
    }

    @GetMapping("/purchase-requests/{id}")
    public ResponseEntity<PurchaseRequestResponse> getRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow().getId();
        return ResponseEntity.ok(purchaseRequestService.getRequest(id, adminId, true));
    }

    @PutMapping("/purchase-requests/{id}/status")
    public ResponseEntity<PurchaseRequestResponse> updateRequestStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow().getId();
        PurchaseRequest.PurchaseRequestStatus newStatus =
                PurchaseRequest.PurchaseRequestStatus.valueOf(body.get("status").toUpperCase());
        return ResponseEntity.ok(purchaseRequestService.updateStatus(id, newStatus, adminId));
    }
}
