package com.soulxtime.store.controller.admin;

import com.soulxtime.store.entity.Product;
import com.soulxtime.store.entity.ProductImage;
import com.soulxtime.store.repository.ProductImageRepository;
import com.soulxtime.store.repository.ProductRepository;
import com.soulxtime.store.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/upload")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class ImageUploadController {

    private final CloudinaryService cloudinaryService;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;

    /**
     * Upload single product image (for primary image).
     * POST /api/admin/upload/image
     */
    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            log.info("📤 Uploading image: {} ({})",
                    file.getOriginalFilename(),
                    formatFileSize(file.getSize()));

            String imageUrl = cloudinaryService.uploadProductImage(file);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "imageUrl", imageUrl,
                    "message", "Image uploaded successfully"
            ));

        } catch (Exception e) {
            log.error("❌ Image upload failed", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Upload multiple gallery images for a product.
     * POST /api/admin/upload/gallery/{productId}
     *
     * @param productId Product ID to attach images to
     * @param files Array of image files (max 5)
     */
    @PostMapping("/gallery/{productId}")
    public ResponseEntity<?> uploadGalleryImages(
            @PathVariable Long productId,
            @RequestParam("files") MultipartFile[] files
    ) {
        try {
            // Validate product exists
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));

            // Validate file count
            if (files.length == 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No files provided"));
            }

            // Check total image count (max 5 per product)
            int currentCount = product.getImages().size();
            if (currentCount + files.length > 5) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", String.format(
                                "Maximum 5 gallery images allowed. Current: %d, Trying to add: %d",
                                currentCount, files.length
                        )));
            }

            log.info("📤 Uploading {} gallery images for product {}", files.length, productId);

            // Upload all images to Cloudinary
            String[] imageUrls = cloudinaryService.uploadMultipleImages(files);

            // Save to database
            int startOrder = currentCount;
            for (int i = 0; i < imageUrls.length; i++) {
                ProductImage productImage = ProductImage.builder()
                        .product(product)
                        .imageUrl(imageUrls[i])
                        .altText(product.getName() + " - Image " + (startOrder + i + 1))
                        .sortOrder(startOrder + i)
                        .build();

                productImageRepository.save(productImage);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "imageUrls", imageUrls,
                    "count", imageUrls.length,
                    "message", imageUrls.length + " gallery images uploaded successfully"
            ));

        } catch (Exception e) {
            log.error("❌ Gallery upload failed", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all gallery images for a product.
     * GET /api/admin/upload/gallery/{productId}
     */
    @GetMapping("/gallery/{productId}")
    public ResponseEntity<?> getGalleryImages(@PathVariable Long productId) {
        try {
            List<ProductImage> images = productImageRepository
                    .findByProductIdOrderBySortOrderAsc(productId);

            List<Map<String, Object>> imageData = images.stream()
                    .map(img -> Map.of(
                            "id", (Object) img.getId(),
                            "imageUrl", img.getImageUrl(),
                            "altText", img.getAltText() != null ? img.getAltText() : "",
                            "sortOrder", img.getSortOrder()
                    ))
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "images", imageData,
                    "count", imageData.size()
            ));

        } catch (Exception e) {
            log.error("❌ Failed to fetch gallery images", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete gallery image.
     * DELETE /api/admin/upload/gallery/{imageId}
     */
    @DeleteMapping("/gallery/{imageId}")
    public ResponseEntity<?> deleteGalleryImage(@PathVariable Long imageId) {
        try {
            ProductImage productImage = productImageRepository.findById(imageId)
                    .orElseThrow(() -> new IllegalArgumentException("Image not found"));

            String imageUrl = productImage.getImageUrl();

            // Delete from database first
            productImageRepository.delete(productImage);

            // Then delete from Cloudinary (don't fail if this fails)
            try {
                cloudinaryService.deleteImage(imageUrl);
            } catch (Exception e) {
                log.warn("⚠️ Failed to delete image from Cloudinary (already deleted from DB): {}", imageUrl);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Gallery image deleted successfully"
            ));

        } catch (Exception e) {
            log.error("❌ Failed to delete gallery image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete image from Cloudinary (for primary image).
     * DELETE /api/admin/upload/image?url=...
     */
    @DeleteMapping("/image")
    public ResponseEntity<?> deleteImage(@RequestParam("url") String imageUrl) {
        try {
            cloudinaryService.deleteImage(imageUrl);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Image deleted successfully"
            ));

        } catch (Exception e) {
            log.error("❌ Image deletion failed: {}", imageUrl, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
}