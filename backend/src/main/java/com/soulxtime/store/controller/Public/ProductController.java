package com.soulxtime.store.controller.Public;

import com.soulxtime.store.dto.response.ProductPublicResponse;
import com.soulxtime.store.entity.Category;
import com.soulxtime.store.entity.Product;
import com.soulxtime.store.repository.CategoryRepository;
import com.soulxtime.store.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final CategoryRepository categoryRepository;

    @GetMapping("/products")
    public ResponseEntity<Page<ProductPublicResponse>> listProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String stockStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50), sort);

        Product.StockStatus status = null;
        if (stockStatus != null && !stockStatus.isBlank()) {
            try { status = Product.StockStatus.valueOf(stockStatus.toUpperCase()); } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(productService.searchProducts(search, categoryId, minPrice, maxPrice, status, pageable));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductPublicResponse> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductPublic(id));
    }

    @GetMapping("/products/{id}/related")
    public ResponseEntity<List<ProductPublicResponse>> getRelated(
            @PathVariable Long id,
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(productService.getRelatedProducts(id, categoryId));
    }

    @GetMapping("/products/featured")
    public ResponseEntity<List<ProductPublicResponse>> getFeatured() {
        return ResponseEntity.ok(productService.getFeaturedProducts());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findByActiveTrueOrderBySortOrderAsc());
    }
}
