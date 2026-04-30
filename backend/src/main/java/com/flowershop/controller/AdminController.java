package com.flowershop.controller;

import com.flowershop.model.Order;
import com.flowershop.model.Order.Status;
import com.flowershop.model.Product;
import com.flowershop.service.CloudinaryService;
import com.flowershop.service.OrderService;
import com.flowershop.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;

/**
 * Admin Controller — ROLE_ADMIN required
 * Images are now stored on Cloudinary (permanent) instead of Render disk (wiped on restart).
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired private ProductService    productService;
    @Autowired private OrderService      orderService;
    @Autowired private CloudinaryService cloudinaryService;

    /* ════════════════════════════════════════════
       DASHBOARD
    ════════════════════════════════════════════ */

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        try {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("totalProducts",    productService.countAvailable());
            m.put("pendingOrders",    orderService.countPending());
            m.put("totalOrders",      orderService.countAll());
            m.put("todayOrders",      orderService.getToday().size());
            m.put("lowStockProducts", productService.getLowStock().size());
            return ResponseEntity.ok(m);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Dashboard load failed: " + e.getMessage()));
        }
    }

    /* ════════════════════════════════════════════
       PRODUCTS
    ════════════════════════════════════════════ */

    @GetMapping("/products")
    public ResponseEntity<?> allProducts() {
        try { return ResponseEntity.ok(productService.getAll()); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    /**
     * Add new product with optional image (multipart/form-data).
     * Image is uploaded to Cloudinary — survives Render restarts forever.
     */
    @PostMapping(value = "/products", consumes = {"multipart/form-data"})
    public ResponseEntity<?> addProductWithImage(
            @RequestParam("name")                          String name,
            @RequestParam("price")                         BigDecimal price,
            @RequestParam("stock")                         int stock,
            @RequestParam(value = "unit",        defaultValue = "piece") String unit,
            @RequestParam(value = "category",    defaultValue = "")      String category,
            @RequestParam(value = "description", defaultValue = "")      String description,
            @RequestParam(value = "available",   defaultValue = "true")  boolean available,
            @RequestParam(value = "file",        required = false)        MultipartFile file) {
        try {
            Product p = new Product();
            p.setName(name);
            p.setPrice(price);
            p.setStock(stock);
            p.setUnit(unit);
            p.setCategory(category);
            p.setDescription(description);
            p.setAvailable(available);

            // Save first to get the database ID
            Product saved = productService.save(p);

            // Upload image to Cloudinary if provided
            if (file != null && !file.isEmpty()) {
                String imageUrl = cloudinaryService.uploadProductImage(file, saved.getId());
                saved.setImageUrl(imageUrl);
                saved.setImageEmoji("");
                saved = productService.save(saved);
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Fallback: JSON-only add (no image)
    @PostMapping(value = "/products", consumes = {"application/json"})
    public ResponseEntity<?> addProduct(@RequestBody Product p) {
        try { return ResponseEntity.ok(productService.save(p)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // JSON-only update (no image change)
    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product updated) {
        return productService.findById(id).map(p -> {
            p.setName(updated.getName());
            p.setPrice(updated.getPrice());
            p.setStock(updated.getStock());
            p.setUnit(updated.getUnit());
            p.setAvailable(updated.isAvailable());
            p.setDescription(updated.getDescription());
            if (updated.getImageUrl()   != null && !updated.getImageUrl().isBlank()) p.setImageUrl(updated.getImageUrl());
            if (updated.getImageEmoji() != null) p.setImageEmoji(updated.getImageEmoji());
            if (updated.getCategory()   != null) p.setCategory(updated.getCategory());
            return ResponseEntity.ok((Object) productService.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Edit product with image — uploads new image to Cloudinary if provided.
     */
    @PutMapping(value = "/products/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateProductWithImage(
            @PathVariable Long id,
            @RequestParam("name")                          String name,
            @RequestParam("price")                         BigDecimal price,
            @RequestParam("stock")                         int stock,
            @RequestParam(value = "unit",        defaultValue = "piece") String unit,
            @RequestParam(value = "category",    defaultValue = "")      String category,
            @RequestParam(value = "description", defaultValue = "")      String description,
            @RequestParam(value = "available",   defaultValue = "true")  boolean available,
            @RequestParam(value = "file",        required = false)        MultipartFile file) {
        return productService.findById(id).map(p -> {
            try {
                p.setName(name);
                p.setPrice(price);
                p.setStock(stock);
                p.setUnit(unit);
                p.setCategory(category);
                p.setDescription(description);
                p.setAvailable(available);

                // Upload new image to Cloudinary if a new file was provided
                if (file != null && !file.isEmpty()) {
                    String imageUrl = cloudinaryService.uploadProductImage(file, id);
                    p.setImageUrl(imageUrl);
                    p.setImageEmoji("");
                }

                return ResponseEntity.ok((Object) productService.save(p));
            } catch (Exception e) {
                return ResponseEntity.internalServerError()
                        .body((Object) Map.of("error", "Image upload failed: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Standalone image upload endpoint — uploads to Cloudinary.
     */
    @PostMapping("/products/{id}/image")
    public ResponseEntity<?> uploadImage(@PathVariable Long id,
                                         @RequestParam("file") MultipartFile file) {
        return productService.findById(id).map(p -> {
            try {
                String imageUrl = cloudinaryService.uploadProductImage(file, id);
                p.setImageUrl(imageUrl);
                p.setImageEmoji("");
                return ResponseEntity.ok((Object) productService.save(p));
            } catch (Exception e) {
                return ResponseEntity.internalServerError()
                        .body(Map.of("error", "Upload failed: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/products/{id}/price")
    public ResponseEntity<?> updatePrice(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            if (body.get("price") == null) return ResponseEntity.badRequest().body(Map.of("error", "price required"));
            return ResponseEntity.ok(productService.updatePrice(id, new BigDecimal(body.get("price").toString())));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PatchMapping("/products/{id}/stock")
    public ResponseEntity<?> updateStock(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return productService.findById(id).map(p -> {
            int stock = Integer.parseInt(body.get("stock").toString());
            p.setStock(stock);
            if (stock > 0) p.setAvailable(true);
            return ResponseEntity.ok((Object) productService.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/products/{id}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        try { return ResponseEntity.ok(productService.toggleAvailability(id)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    /**
     * Delete product — also removes image from Cloudinary.
     */
    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            cloudinaryService.deleteProductImage(id); // remove from Cloudinary
            productService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Product deleted"));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    /* ════════════════════════════════════════════
       ORDERS
    ════════════════════════════════════════════ */

    @GetMapping("/orders")
    public ResponseEntity<?> allOrders(@RequestParam(required = false) String status) {
        try {
            List<Order> orders;
            if (status != null && !status.isBlank()) {
                try { orders = orderService.getByStatus(Status.valueOf(status.toUpperCase())); }
                catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("error","Invalid status: "+status)); }
            } else {
                orders = orderService.getAll();
            }
            return ResponseEntity.ok(orders.stream().map(this::toOrderMap).toList());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to load orders: " + e.getMessage()));
        }
    }

    @GetMapping("/orders/today")
    public ResponseEntity<?> todayOrders() {
        try { return ResponseEntity.ok(orderService.getToday().stream().map(this::toOrderMap).toList()); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        return orderService.findById(id)
                .map(o -> ResponseEntity.ok((Object) toOrderMap(o)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        try {
            String statusStr = body.get("status");
            if (statusStr == null || statusStr.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
            Status status = Status.valueOf(statusStr.toUpperCase());
            String notes  = body.getOrDefault("notes", "");
            Order updated = orderService.updateStatus(id, status, notes);
            return ResponseEntity.ok(toOrderMap(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + body.get("status")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    /* ════════════════════════════════════════════
       SERIALIZER
    ════════════════════════════════════════════ */

    private Map<String, Object> toOrderMap(Order o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",                 o.getId());
        m.put("orderNumber",        o.getOrderNumber());
        m.put("status",             o.getStatus());
        m.put("subtotal",           o.getSubtotal());
        m.put("deliveryCharge",     o.getDeliveryCharge());
        m.put("totalAmount",        o.getTotalAmount());
        m.put("deliveryDistanceKm", o.getDeliveryDistanceKm());
        m.put("deliveryAddress",    o.getDeliveryAddress());
        m.put("paymentMethod",      o.getPaymentMethod());
        m.put("adminNotes",         o.getAdminNotes());
        m.put("createdAt",          o.getCreatedAt());
        m.put("updatedAt",          o.getUpdatedAt());

        if (o.getUser() != null) {
            Map<String, Object> user = new LinkedHashMap<>();
            user.put("id",    o.getUser().getId());
            user.put("name",  o.getUser().getName());
            user.put("email", o.getUser().getEmail());
            user.put("phone", o.getUser().getPhone());
            m.put("user", user);
        }

        List<Map<String, Object>> items = new ArrayList<>();
        if (o.getItems() != null) {
            for (var item : o.getItems()) {
                Map<String, Object> i = new LinkedHashMap<>();
                i.put("productId",    item.getProduct() != null ? item.getProduct().getId() : null);
                i.put("productName",  item.getProduct() != null ? item.getProduct().getName() : "");
                i.put("unit",         item.getProduct() != null ? item.getProduct().getUnit() : "");
                i.put("quantity",     item.getQuantity());
                i.put("priceAtOrder", item.getPriceAtOrder());
                i.put("lineTotal",    item.getLineTotal());
                items.add(i);
            }
        }
        m.put("items", items);
        return m;
    }
}