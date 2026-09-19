package com.soulxtime.store.repository;

import com.soulxtime.store.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    /**
     * Find all images for a product, ordered by sort_order.
     */
    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);

    /**
     * Delete all images for a product.
     */
    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);

    /**
     * Delete specific image by URL.
     */
    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.imageUrl = :imageUrl")
    void deleteByImageUrl(@Param("imageUrl") String imageUrl);
}