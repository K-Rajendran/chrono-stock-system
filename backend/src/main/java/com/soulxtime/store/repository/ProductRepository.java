package com.soulxtime.store.repository;

import com.soulxtime.store.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository
        extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySkuAndActiveTrue(String sku);

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.stockStatus = 'LOW_STOCK'")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.stockStatus = 'OUT_OF_STOCK'")
    List<Product> findOutOfStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true AND p.stockStatus = 'LOW_STOCK'")
    long countLowStock();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true AND p.stockStatus = 'OUT_OF_STOCK'")
    long countOutOfStock();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true")
    long countActiveProducts();

    @Query("SELECT SUM(p.stockQuantity) FROM Product p WHERE p.active = true")
    Long sumTotalStock();

    List<Product> findTop8ByActiveTrueOrderByCreatedAtDesc();

    @Query("""
        SELECT p
        FROM Product p
        WHERE p.active = true
          AND p.category.id = :categoryId
          AND p.id != :excludeId
        ORDER BY p.createdAt DESC
        """)
    List<Product> findRelatedProducts(
            @Param("categoryId") Long categoryId,
            @Param("excludeId") Long excludeId,
            Pageable pageable
    );

    // Lock for concurrent stock operations
    @Query("SELECT p FROM Product p WHERE p.id = :id AND p.active = true")
    Optional<Product> findByIdWithLock(@Param("id") Long id);
}