package com.flowershop.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;

/**
 * ✅ THIS IS THE MISSING FILE — add it to your project.
 *
 * Without this, /uploads/** returns 404 even though:
 *   - Security permits it
 *   - Files exist on disk
 *
 * Place at:
 *   flowershop-backend/src/main/java/com/flowershop/config/WebConfig.java
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/products}")
    private String uploadDir;

    // Auto-create the uploads folder on startup
    @PostConstruct
    public void init() throws Exception {
        Path path = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(path);
        System.out.println("✅ Upload folder ready: " + path);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // The uploads folder is INSIDE the project (flowershop-backend/uploads/products/)
        // We need to serve it at /uploads/**
        // We go one level up from "products" so /uploads/products/xxx.jpg works

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String resourceLocation = "file:" + uploadPath.getParent()
                .toString().replace("\\", "/") + "/";

        registry
            .addResourceHandler("/uploads/**")
            .addResourceLocations(resourceLocation)
            .setCachePeriod(3600);  // cache images for 1 hour

        System.out.println("✅ Serving /uploads/** from: " + resourceLocation);
        System.out.println("✅ Test URL: http://localhost:8080/uploads/products/<filename>");
    }
}