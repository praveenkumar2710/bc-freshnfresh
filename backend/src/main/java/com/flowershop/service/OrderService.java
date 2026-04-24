package com.flowershop.service;

import com.flowershop.dto.PlaceOrderRequest;
import com.flowershop.model.*;
import com.flowershop.model.Order.Status;
import com.flowershop.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired private OrderRepository  orderRepo;
    @Autowired private ProductService   productService;
    @Autowired private DeliveryService  deliveryService;

    @Transactional
    public Order placeOrder(User user, PlaceOrderRequest req) {

        if (req.getItems() == null || req.getItems().isEmpty())
            throw new RuntimeException("Cart is empty");

        // 1. Compute subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        for (var ci : req.getItems()) {
            Product p = productService.findById(ci.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + ci.getProductId()));
            if (!p.isInStock())
                throw new RuntimeException(p.getName() + " is out of stock");
            subtotal = subtotal.add(p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
        }

        // 2. Delivery calculation
        DeliveryService.DeliveryInfo delivery =
                deliveryService.calculate(req.getCustomerLat(), req.getCustomerLon());

        if (!delivery.canDeliver())
            throw new RuntimeException(delivery.message());

        if (!deliveryService.meetsMinOrder(delivery, subtotal))
            throw new RuntimeException("Minimum order ₹" + delivery.minOrder()
                    + " required for your zone. Your total: ₹" + subtotal);

        // 3. Build order
        Order order = new Order();
        order.setUser(user);
        order.setDeliveryAddress(req.getAddress());
        order.setDeliveryDistanceKm(delivery.distanceKm());
        order.setDeliveryCharge(delivery.charge());
        order.setSubtotal(subtotal);
        order.setTotalAmount(subtotal.add(delivery.charge()));
        order.setOrderNumber(generateNumber());
        if (req.getPaymentMethod() != null) order.setPaymentMethod(req.getPaymentMethod());
        order = orderRepo.save(order);  // get ID first

        // 4. Add items, reduce stock
        for (var ci : req.getItems()) {
            Product p = productService.findById(ci.getProductId()).get();
            OrderItem item = new OrderItem(order, p, ci.getQuantity());
            order.getItems().add(item);
            productService.reduceStock(p.getId(), ci.getQuantity());
        }
        return orderRepo.save(order);
    }

    public List<Order> getAll()                          { return orderRepo.findAllByOrderByCreatedAtDesc(); }
    public List<Order> getByStatus(Status s)             { return orderRepo.findByStatusOrderByCreatedAtDesc(s); }
    public Optional<Order> findById(Long id)             { return orderRepo.findById(id); }
    public Optional<Order> findByNumber(String n)        { return orderRepo.findByOrderNumber(n); }
    public List<Order> getByUserId(Long uid)             { return orderRepo.findByUserIdOrderByCreatedAtDesc(uid); }
    public long countPending()                           { return orderRepo.countByStatus(Status.PENDING); }
    public List<Order> getToday()                        { return orderRepo.findTodayOrders(LocalDate.now().atStartOfDay()); }
    public long countAll()                               { return orderRepo.count(); }

    @Transactional
    public Order updateStatus(Long id, Status status, String notes) {
        Order o = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        o.setStatus(status);
        if (notes != null && !notes.isBlank()) o.setAdminNotes(notes);
        return orderRepo.save(o);
    }

    /** Called after successful Razorpay payment verification */
    @Transactional
    public Order confirmPayment(Long orderId, String razorpayPaymentId) {
        Order o = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        o.setStatus(Status.CONFIRMED);
        o.setRazorpayPaymentId(razorpayPaymentId);
        o.setAdminNotes("Paid via Razorpay. Payment ID: " + razorpayPaymentId);
        return orderRepo.save(o);
    }

    private String generateNumber() {
        String date  = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long   count = orderRepo.countTodayOrders(LocalDate.now().atStartOfDay()) + 1;
        return String.format("ORD-%s-%03d", date, count);
    }
}
