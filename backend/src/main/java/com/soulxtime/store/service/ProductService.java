package com.soulxtime.store.service;

import com.soulxtime.store.dto.request.ProductCreateRequest;
import com.soulxtime.store.dto.request.ProductUpdateRequest;
import com.soulxtime.store.dto.response.ProductAdminResponse;
import com.soulxtime.store.dto.response.ProductPublicResponse;
import com.soulxtime.store.entity.Category;
import com.soulxtime.store.entity.Product;
import com.soulxtime.store.exception.BusinessException;
import com.soulxtime.store.exception.ResourceNotFoundException;
import com.soulxtime.store.repository.CategoryRepository;
import com.soulxtime.store.repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    // ─────────────────────────────────────────────────────────
    // Public (Customer) APIs — purchase_cost NEVER included
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ProductPublicResponse> searchProducts(
            String search,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Product.StockStatus stockStatus,
            Pageable pageable) {

        Specification<Product> specification = buildProductSearchSpecification(
                search,
                categoryId,
                minPrice,
                maxPrice,
                stockStatus
        );

        return productRepository.findAll(specification, pageable)
                .map(this::toPublicResponse);
    }

    @Transactional(readOnly = true)
    public ProductPublicResponse getProductPublic(Long id) {
        Product product = productRepository.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        return toPublicResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductPublicResponse> getFeaturedProducts() {
        return productRepository.findTop8ByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::toPublicResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductPublicResponse> getRelatedProducts(
            Long productId,
            Long categoryId) {

        return productRepository.findRelatedProducts(
                        categoryId,
                        productId,
                        org.springframework.data.domain.PageRequest.of(0, 4)
                )
                .stream()
                .map(this::toPublicResponse)
                .toList();
    }

    // ─────────────────────────────────────────────────────────
    // Product Search Specification
    // ─────────────────────────────────────────────────────────

    private Specification<Product> buildProductSearchSpecification(
            String search,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Product.StockStatus stockStatus) {

        return (root, query, criteriaBuilder) -> {

            List<Predicate> predicates = new ArrayList<>();

            // Always return active products
            predicates.add(
                    criteriaBuilder.isTrue(root.get("active"))
            );

            // Search by product name or brand
            if (search != null && !search.trim().isEmpty()) {

                String searchPattern =
                        "%" + search.trim().toLowerCase() + "%";

                Predicate nameMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("name")),
                        searchPattern
                );

                Predicate brandMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("brand")),
                        searchPattern
                );

                predicates.add(
                        criteriaBuilder.or(nameMatch, brandMatch)
                );
            }

            // Category filter
            if (categoryId != null) {

                predicates.add(
                        criteriaBuilder.equal(
                                root.get("category").get("id"),
                                categoryId
                        )
                );
            }

            // Minimum price
            if (minPrice != null) {

                predicates.add(
                        criteriaBuilder.greaterThanOrEqualTo(
                                root.get("sellingPrice"),
                                minPrice
                        )
                );
            }

            // Maximum price
            if (maxPrice != null) {

                predicates.add(
                        criteriaBuilder.lessThanOrEqualTo(
                                root.get("sellingPrice"),
                                maxPrice
                        )
                );
            }

            // Stock status
            if (stockStatus != null) {

                predicates.add(
                        criteriaBuilder.equal(
                                root.get("stockStatus"),
                                stockStatus
                        )
                );
            }

            return criteriaBuilder.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }

    // ─────────────────────────────────────────────────────────
    // Admin APIs — full data including purchase_cost
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ProductAdminResponse> searchProductsAdmin(
            String search,
            Long categoryId,
            Product.StockStatus stockStatus,
            Pageable pageable) {

        Specification<Product> specification =
                buildProductSearchSpecification(
                        search,
                        categoryId,
                        null,
                        null,
                        stockStatus
                );

        return productRepository.findAll(specification, pageable)
                .map(this::toAdminResponse);
    }

    @Transactional(readOnly = true)
    public ProductAdminResponse getProductAdmin(Long id) {
        return toAdminResponse(
                productRepository.findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Product",
                                        id
                                )
                        )
        );
    }

    @Transactional
    public ProductAdminResponse createProduct(ProductCreateRequest req) {

        if (productRepository.findBySkuAndActiveTrue(req.getSku()).isPresent()) {
            throw new BusinessException(
                    "SKU_TAKEN",
                    "A product with this SKU already exists: " + req.getSku()
            );
        }

        Category category = req.getCategoryId() != null
                ? categoryRepository.findById(req.getCategoryId())
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Category",
                                req.getCategoryId()
                        )
                )
                : null;

        Product product = Product.builder()
                .sku(req.getSku().toUpperCase().trim())
                .name(req.getName())
                .brand(req.getBrand())
                .category(category)
                .description(req.getDescription())
                .movement(req.getMovement())
                .caseMaterial(req.getCaseMaterial())
                .strapMaterial(req.getStrapMaterial())
                .caseDiameterMm(req.getCaseDiameterMm())
                .dialColor(req.getDialColor())
                .waterResistance(req.getWaterResistance())
                .glassType(req.getGlassType())
                .genderStyle(req.getGenderStyle())
                .warrantyMonths(req.getWarrantyMonths())
                .purchaseCost(req.getPurchaseCost())
                .sellingPrice(req.getSellingPrice())
                .discountType(
                        req.getDiscountType() != null
                                ? req.getDiscountType()
                                : Product.DiscountType.PERCENTAGE
                )
                .discountValue(
                        req.getDiscountValue() != null
                                ? req.getDiscountValue()
                                : BigDecimal.ZERO
                )
                .stockQuantity(
                        req.getStockQuantity() != null
                                ? req.getStockQuantity()
                                : 0
                )
                .lowStockThreshold(
                        req.getLowStockThreshold() != null
                                ? req.getLowStockThreshold()
                                : 5
                )
                .primaryImageUrl(req.getPrimaryImageUrl())
                .model3dUrl(req.getModel3dUrl())
                .active(true)
                .build();

        product.updateStockStatus();

        product = productRepository.save(product);

        log.info(
                "Product created: {} ({})",
                product.getName(),
                product.getSku()
        );

        return toAdminResponse(product);
    }

    @Transactional
    public ProductAdminResponse updateProduct(
            Long id,
            ProductUpdateRequest req) {

        Product product = productRepository.findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Product",
                                id
                        )
                );

        if (req.getName() != null) {
            product.setName(req.getName());
        }

        if (req.getBrand() != null) {
            product.setBrand(req.getBrand());
        }

        if (req.getDescription() != null) {
            product.setDescription(req.getDescription());
        }

        if (req.getCategoryId() != null) {
            product.setCategory(
                    categoryRepository.findById(req.getCategoryId())
                            .orElseThrow(
                                    () -> new ResourceNotFoundException(
                                            "Category",
                                            req.getCategoryId()
                                    )
                            )
            );
        }

        if (req.getMovement() != null) {
            product.setMovement(req.getMovement());
        }

        if (req.getCaseMaterial() != null) {
            product.setCaseMaterial(req.getCaseMaterial());
        }

        if (req.getStrapMaterial() != null) {
            product.setStrapMaterial(req.getStrapMaterial());
        }

        if (req.getCaseDiameterMm() != null) {
            product.setCaseDiameterMm(req.getCaseDiameterMm());
        }

        if (req.getDialColor() != null) {
            product.setDialColor(req.getDialColor());
        }

        if (req.getWaterResistance() != null) {
            product.setWaterResistance(req.getWaterResistance());
        }

        if (req.getGlassType() != null) {
            product.setGlassType(req.getGlassType());
        }

        if (req.getGenderStyle() != null) {
            product.setGenderStyle(req.getGenderStyle());
        }

        if (req.getWarrantyMonths() != null) {
            product.setWarrantyMonths(req.getWarrantyMonths());
        }

        if (req.getPurchaseCost() != null) {
            product.setPurchaseCost(req.getPurchaseCost());
        }

        if (req.getSellingPrice() != null) {
            product.setSellingPrice(req.getSellingPrice());
        }

        if (req.getDiscountType() != null) {
            product.setDiscountType(req.getDiscountType());
        }

        if (req.getDiscountValue() != null) {
            product.setDiscountValue(req.getDiscountValue());
        }

        if (req.getLowStockThreshold() != null) {
            product.setLowStockThreshold(req.getLowStockThreshold());
        }

        if (req.getPrimaryImageUrl() != null) {
            product.setPrimaryImageUrl(req.getPrimaryImageUrl());
        }

        if (req.getModel3dUrl() != null) {
            product.setModel3dUrl(req.getModel3dUrl());
        }

        if (req.getActive() != null) {
            product.setActive(req.getActive());
        }

        product.updateStockStatus();

        product = productRepository.save(product);

        log.info(
                "Product updated: {} ({})",
                product.getName(),
                product.getSku()
        );

        return toAdminResponse(product);
    }

    @Transactional
    public void deactivateProduct(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Product",
                                id
                        )
                );

        product.setActive(false);

        productRepository.save(product);

        log.info("Product deactivated: {}", id);
    }

    // ─────────────────────────────────────────────────────────
    // Mapping — purchaseCost excluded from Public response
    // ─────────────────────────────────────────────────────────

    private ProductPublicResponse toPublicResponse(Product p) {

        return ProductPublicResponse.builder()
                .id(p.getId())
                .sku(p.getSku())
                .name(p.getName())
                .brand(p.getBrand())
                .categoryId(
                        p.getCategory() != null
                                ? p.getCategory().getId()
                                : null
                )
                .categoryName(
                        p.getCategory() != null
                                ? p.getCategory().getName()
                                : null
                )
                .description(p.getDescription())
                .movement(p.getMovement())
                .caseMaterial(p.getCaseMaterial())
                .strapMaterial(p.getStrapMaterial())
                .caseDiameterMm(p.getCaseDiameterMm())
                .dialColor(p.getDialColor())
                .waterResistance(p.getWaterResistance())
                .glassType(p.getGlassType())
                .genderStyle(p.getGenderStyle())
                .warrantyMonths(p.getWarrantyMonths())
                .sellingPrice(p.getSellingPrice())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .effectivePrice(p.getEffectivePrice())
                .discountAmount(p.getDiscountAmount())
                .stockStatus(p.getStockStatus())
                .stockAvailable(p.getStockQuantity() > 0)
                .primaryImageUrl(p.getPrimaryImageUrl())
                .model3dUrl(p.getModel3dUrl())
                .imageUrls(
                        p.getImages()
                                .stream()
                                .sorted(
                                        java.util.Comparator.comparingInt(
                                                pi -> pi.getSortOrder()
                                        )
                                )
                                .map(pi -> pi.getImageUrl())
                                .toList()
                )
                .build();
    }

    public ProductAdminResponse toAdminResponse(Product p) {

        return ProductAdminResponse.builder()
                .id(p.getId())
                .sku(p.getSku())
                .name(p.getName())
                .brand(p.getBrand())
                .categoryId(
                        p.getCategory() != null
                                ? p.getCategory().getId()
                                : null
                )
                .categoryName(
                        p.getCategory() != null
                                ? p.getCategory().getName()
                                : null
                )
                .description(p.getDescription())
                .movement(p.getMovement())
                .caseMaterial(p.getCaseMaterial())
                .strapMaterial(p.getStrapMaterial())
                .caseDiameterMm(p.getCaseDiameterMm())
                .dialColor(p.getDialColor())
                .waterResistance(p.getWaterResistance())
                .glassType(p.getGlassType())
                .genderStyle(p.getGenderStyle())
                .warrantyMonths(p.getWarrantyMonths())
                .purchaseCost(p.getPurchaseCost())
                .sellingPrice(p.getSellingPrice())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .effectivePrice(p.getEffectivePrice())
                .discountAmount(p.getDiscountAmount())
                .stockQuantity(p.getStockQuantity())
                .lowStockThreshold(p.getLowStockThreshold())
                .stockStatus(p.getStockStatus())
                .primaryImageUrl(p.getPrimaryImageUrl())
                .model3dUrl(p.getModel3dUrl())
                .active(p.isActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}