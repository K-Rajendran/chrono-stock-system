package com.soulxtime.store.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing product images in Cloudinary.
 * Handles upload, deletion, and URL generation with optimizations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${app.cloudinary.folder:afino/products}")
    private String folder;

    /**
     * Upload image to Cloudinary with automatic optimization.
     *
     * @param file Image file from multipart request
     * @return Secure HTTPS URL of uploaded image
     * @throws IOException if upload fails
     */
    public String uploadProductImage(MultipartFile file) throws IOException {
        // Validate file
        validateImageFile(file);

        // Generate unique public ID
        String publicId = folder + "/" + UUID.randomUUID().toString();

        log.info("Uploading image to Cloudinary: {} (size: {} bytes)",
                file.getOriginalFilename(), file.getSize());

        try {
            // Upload with optimizations
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "resource_type", "image",
                    "transformation", new Transformation<>()
                            .width(1200)              // Max width for product images
                            .height(1200)             // Max height
                            .crop("limit")            // Don't upscale, only limit
                            .quality("auto:good")     // Automatic quality optimization
                            .fetchFormat("auto")      // Auto format (WebP for modern browsers)
            ));

            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("✅ Image uploaded successfully: {}", secureUrl);

            return secureUrl;

        } catch (IOException e) {
            log.error("❌ Failed to upload image to Cloudinary: {}", e.getMessage());
            throw new IOException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    /**
     * Upload multiple images (for product gallery).
     *
     * @param files Array of image files
     * @return Array of Cloudinary URLs
     */
    public String[] uploadMultipleImages(MultipartFile[] files) throws IOException {
        String[] urls = new String[files.length];

        for (int i = 0; i < files.length; i++) {
            urls[i] = uploadProductImage(files[i]);
        }

        return urls;
    }

    /**
     * Delete image from Cloudinary.
     * Extracts public_id from Cloudinary URL and deletes the resource.
     *
     * @param imageUrl Full Cloudinary URL
     */
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return;
        }

        try {
            String publicId = extractPublicId(imageUrl);

            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            String status = (String) result.get("result");

            if ("ok".equals(status)) {
                log.info("✅ Image deleted from Cloudinary: {}", publicId);
            } else {
                log.warn("⚠️ Cloudinary deletion returned status: {} for {}", status, publicId);
            }

        } catch (Exception e) {
            log.error("❌ Failed to delete image from Cloudinary: {}", imageUrl, e);
            // Don't throw exception - deletion failure shouldn't block product updates
        }
    }

    /**
     * Delete multiple images.
     */
    public void deleteMultipleImages(String[] imageUrls) {
        if (imageUrls == null) return;

        for (String url : imageUrls) {
            deleteImage(url);
        }
    }

    /**
     * Generate optimized thumbnail URL from existing Cloudinary image.
     * No new upload - just generates transformation URL.
     *
     * @param originalUrl Original Cloudinary URL
     * @param width Thumbnail width
     * @param height Thumbnail height
     * @return Transformed URL
     */
    public String getThumbnailUrl(String originalUrl, int width, int height) {
        try {
            String publicId = extractPublicId(originalUrl);

            return cloudinary.url()
                    .transformation(new Transformation<>()
                            .width(width)
                            .height(height)
                            .crop("fill")
                            .gravity("auto")
                            .quality("auto:good")
                            .fetchFormat("auto"))
                    .generate(publicId);

        } catch (Exception e) {
            log.warn("Failed to generate thumbnail URL for: {}", originalUrl);
            return originalUrl; // Return original if transformation fails
        }
    }

    /**
     * Extract Cloudinary public_id from full URL.
     * Example URL: https://res.cloudinary.com/demo/image/upload/v1234567/soulxtime/products/abc-123.jpg
     * Extracts: soulxtime/products/abc-123
     */
    private String extractPublicId(String imageUrl) {
        try {
            // Split by "upload/"
            String[] parts = imageUrl.split("/upload/");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Invalid Cloudinary URL format");
            }

            // Get everything after version number (v1234567/)
            String afterUpload = parts[1];
            String[] segments = afterUpload.split("/");

            // Skip version (v1234567) if present
            int startIndex = segments[0].startsWith("v") ? 1 : 0;

            // Reconstruct public_id (folder/filename without extension)
            StringBuilder publicId = new StringBuilder();
            for (int i = startIndex; i < segments.length; i++) {
                if (i > startIndex) publicId.append("/");
                publicId.append(segments[i]);
            }

            // Remove file extension
            String result = publicId.toString();
            int lastDot = result.lastIndexOf('.');
            if (lastDot > 0) {
                result = result.substring(0, lastDot);
            }

            return result;

        } catch (Exception e) {
            log.error("Failed to extract public_id from URL: {}", imageUrl);
            throw new IllegalArgumentException("Invalid Cloudinary URL: " + imageUrl);
        }
    }

    /**
     * Validate image file before upload.
     */
    private void validateImageFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("File must be an image (JPG, PNG, WebP, etc.)");
        }

        // Check file size (10MB limit)
        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new IOException("Image size must be less than 10MB");
        }

        log.debug("✅ Image validation passed: {} ({} bytes, type: {})",
                file.getOriginalFilename(), file.getSize(), contentType);
    }
}