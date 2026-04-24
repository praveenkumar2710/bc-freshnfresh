package com.flowershop.service;

import com.flowershop.model.Product;
import com.flowershop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired private ProductRepository repo;

    public List<Product> getAvailable()              { return repo.findByAvailableTrueOrderByName(); }
    public List<Product> getAll()                    { return repo.findAllByOrderByName(); }
    public Optional<Product> findById(Long id)       { return repo.findById(id); }
    public Product save(Product p)                   { return repo.save(p); }
    public void delete(Long id)                      { repo.deleteById(id); }
    public List<Product> search(String q)            { return repo.searchAvailable(q); }
    public List<Product> getLowStock()               { return repo.findLowStock(5); }
    public long countAvailable()                     { return repo.findByAvailableTrueOrderByName().size(); }
    public List<Product> getByCategory(String cat)   { return repo.findByCategory(cat); }
    public List<String> getCategories()              { return repo.findDistinctCategories(); }

    public Product updatePrice(Long id, BigDecimal price) {
        Product p = repo.findById(id).orElseThrow(() -> new RuntimeException("Product not found: " + id));
        p.setPrice(price);
        return repo.save(p);
    }

    public Product toggleAvailability(Long id) {
        Product p = repo.findById(id).orElseThrow(() -> new RuntimeException("Product not found: " + id));
        p.setAvailable(!p.isAvailable());
        return repo.save(p);
    }

    public void reduceStock(Long id, int qty) {
        Product p = repo.findById(id).orElseThrow(() -> new RuntimeException("Product not found: " + id));
        int newStock = p.getStock() - qty;
        if (newStock < 0) throw new RuntimeException("Insufficient stock: " + p.getName());
        p.setStock(newStock);
        if (newStock == 0) p.setAvailable(false);
        repo.save(p);
    }
}
