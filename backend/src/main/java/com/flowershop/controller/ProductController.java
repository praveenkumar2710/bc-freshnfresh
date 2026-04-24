package com.flowershop.controller;

import com.flowershop.model.Product;
import com.flowershop.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired private ProductService productService;

    @GetMapping
    public List<Product> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        if (search != null && !search.isBlank())
            return productService.search(search);
        if (category != null && !category.isBlank())
            return productService.getByCategory(category);
        return productService.getAvailable();
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        return productService.getCategories();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getOne(@PathVariable Long id) {
        return productService.findById(id)
                .filter(Product::isAvailable)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
