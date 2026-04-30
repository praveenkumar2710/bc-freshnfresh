package com.flowershop.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * CloudinaryService — uploads product images to Cloudinary.
 * Images are stored permanently in the cloud, not on Render's disk.
 *
 * Required environment variables on Render:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}")    String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {

        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key",    apiKey,
                "api_secret", apiSecret,
                "secure",     true
        ));
    }

    /**
     * Uploads a product image to Cloudinary.
     * @param file      the image file from the admin form
     * @param productId used to create a stable public_id so re-uploads replace the old image
     * @return the permanent HTTPS URL of the uploaded image
     */
    public String uploadProductImage(MultipartFile file, Long productId) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder",    "bcfreshnfresh/products",
                        "public_id", "product_" + productId,
                        "overwrite", true
                )
        );
        return result.get("secure_url").toString();
    }

    /**
     * Deletes a product image from Cloudinary (called when product is deleted).
     * @param productId the product whose image should be removed
     */
    public void deleteProductImage(Long productId) {
        try {
            cloudinary.uploader().destroy(
                    "bcfreshnfresh/products/product_" + productId,
                    ObjectUtils.emptyMap()
            );
        } catch (Exception e) {
            // Log but don't throw — deletion failure shouldn't block product deletion
            System.err.println("Cloudinary delete failed for product " + productId + ": " + e.getMessage());
        }
    }
}