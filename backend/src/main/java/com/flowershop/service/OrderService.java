package com.flowershop.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowershop.dto.PlaceOrderRequest;
import com.flowershop.model.Order;
import com.flowershop.model.Order.Status;
import com.flowershop.model.OrderItem;
import com.flowershop.model.Product;
import com.flowershop.model.User;
import com.flowershop.repository.OrderRepository;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepo;
    @Autowired private ProductService productService;
    @Autowired private DeliveryService deliveryService;
    @Autowired private NotificationService notificationService;

    // ─────────────────────────────────────────────────────────────
    // PLACE ORDER (MAIN BUSINESS LOGIC)
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public Order placeOrder(User user, PlaceOrderRequest req) {

        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // 1. Calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;

        for (var ci : req.getItems()) {
            Product p = productService.findById(ci.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + ci.getProductId()));

            if (!p.isInStock()) {
                throw new RuntimeException(p.getName() + " is out of stock");
            }

            subtotal = subtotal.add(
                    p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity()))
            );
        }

        // 2. Delivery calculation
        DeliveryService.DeliveryInfo delivery =
                deliveryService.calculate(req.getCustomerLat(), req.getCustomerLon());

        if (!delivery.canDeliver()) {
            throw new RuntimeException(delivery.message());
        }

        if (!deliveryService.meetsMinOrder(delivery, subtotal)) {
            throw new RuntimeException(
                    "Minimum order ₹" + delivery.minOrder() +
                    " required. Your total: ₹" + subtotal
            );
        }

        // 3. Create order
        Order order = new Order();
        order.setUser(user);
        order.setDeliveryAddress(req.getAddress());
        order.setDeliveryDistanceKm(delivery.distanceKm());
        order.setDeliveryCharge(delivery.charge());
        order.setSubtotal(subtotal);
        order.setTotalAmount(subtotal.add(delivery.charge()));
        order.setOrderNumber(generateNumber());
        order.setStatus(Status.PENDING);

        if (req.getPaymentMethod() != null) {
            order.setPaymentMethod(req.getPaymentMethod());
        }

        // Save to get ID
        order = orderRepo.save(order);

        // 4. Add items & reduce stock
        for (var ci : req.getItems()) {
            Product p = productService.findById(ci.getProductId()).get();

            OrderItem item = new OrderItem(order, p, ci.getQuantity());
            order.getItems().add(item);

            productService.reduceStock(p.getId(), ci.getQuantity());
        }

        Order savedOrder = orderRepo.save(order);

        // 5. Send confirmation email
        notificationService.sendOrderConfirmationEmail(
                user.getEmail(),
                user.getName(),
                savedOrder.getOrderNumber()
        );

        return savedOrder;
    }

    // ─────────────────────────────────────────────────────────────
    // PAYMENT CONFIRMATION (RAZORPAY)
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public Order confirmPayment(Long orderId, String razorpayPaymentId) {

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        order.setStatus(Status.CONFIRMED);
        order.setRazorpayPaymentId(razorpayPaymentId);
        order.setAdminNotes("Paid via Razorpay. Payment ID: " + razorpayPaymentId);

        return orderRepo.save(order);
    }

    // ─────────────────────────────────────────────────────────────
    // MARK AS DELIVERED
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public Order markDelivered(Long orderId) {

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        order.setStatus(Status.DELIVERED);

        Order updated = orderRepo.save(order);

        // Send delivery email
        notificationService.sendDeliveryNotificationEmail(
                order.getUser().getEmail(),
                order.getUser().getName(),
                order.getOrderNumber()
        );

        return updated;
    }

    // ─────────────────────────────────────────────────────────────
    // FETCH METHODS
    // ─────────────────────────────────────────────────────────────
    public List<Order> getAll() {
        return orderRepo.findAllByOrderByCreatedAtDesc();
    }

    public List<Order> getByStatus(Status status) {
        return orderRepo.findByStatusOrderByCreatedAtDesc(status);
    }

    public Optional<Order> findById(Long id) {
        return orderRepo.findById(id);
    }

    public Optional<Order> findByNumber(String number) {
        return orderRepo.findByOrderNumber(number);
    }

    public List<Order> getByUserId(Long userId) {
        return orderRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countPending() {
        return orderRepo.countByStatus(Status.PENDING);
    }

    public List<Order> getToday() {
        return orderRepo.findTodayOrders(LocalDate.now().atStartOfDay());
    }

    public long countAll() {
        return orderRepo.count();
    }

    // ─────────────────────────────────────────────────────────────
    // UPDATE STATUS (ADMIN)
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public Order updateStatus(Long id, Status status, String notes) {

        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));

        order.setStatus(status);

        if (notes != null && !notes.isBlank()) {
            order.setAdminNotes(notes);
        }

        return orderRepo.save(order);
    }

    // ─────────────────────────────────────────────────────────────
    // ORDER NUMBER GENERATION
    // ─────────────────────────────────────────────────────────────
    private String generateNumber() {

        String date = LocalDate.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        long count = orderRepo.countTodayOrders(
                LocalDate.now().atStartOfDay()
        ) + 1;

        return String.format("ORD-%s-%03d", date, count);
    }
}