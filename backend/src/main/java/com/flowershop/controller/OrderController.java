package com.flowershop.controller;

import com.flowershop.dto.PlaceOrderRequest;
import com.flowershop.model.Order;
import com.flowershop.model.User;
import com.flowershop.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 📦 Order Controller  (JWT required for most endpoints)
 *
 *  POST /api/orders               → place order        [CUSTOMER]
 *  GET  /api/orders/my            → my order history   [CUSTOMER]
 *  GET  /api/orders/{id}          → single order       [CUSTOMER/ADMIN]
 *  GET  /api/orders/track/{no}    → track by number    [PUBLIC]
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired private OrderService orderService;

    /* ── PLACE ORDER ─────────────────────────────────── */
    @PostMapping
    public ResponseEntity<?> place(
            @AuthenticationPrincipal Object principal,
            @RequestBody PlaceOrderRequest req) {

        if (!(principal instanceof User user))
            return ResponseEntity.status(401).body(Map.of("error", "Please login to place an order"));

        try {
            Order order = orderService.placeOrder(user, req);
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("success",       true);
            res.put("orderId",       order.getId());
            res.put("orderNumber",   order.getOrderNumber());
            res.put("subtotal",      order.getSubtotal());
            res.put("deliveryCharge",order.getDeliveryCharge());
            res.put("totalAmount",   order.getTotalAmount());
            res.put("status",        order.getStatus());
            res.put("message",       "Order placed successfully!");
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /* ── MY ORDERS ───────────────────────────────────── */
    @GetMapping("/my")
    public ResponseEntity<?> myOrders(@AuthenticationPrincipal Object principal) {
        if (!(principal instanceof User user))
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        List<Order> orders = orderService.getByUserId(user.getId());
        return ResponseEntity.ok(orders.stream().map(this::toSummary).toList());
    }

    /* ── SINGLE ORDER ────────────────────────────────── */
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal Object principal) {

        Optional<Order> opt = orderService.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Order order = opt.get();
        // Customers can only see their own orders; admin can see all
        if (principal instanceof User user) {
            boolean isAdmin    = user.getRole() == User.Role.ADMIN;
            boolean isOwner    = order.getUser().getId().equals(user.getId());
            if (!isAdmin && !isOwner)
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(toDetail(order));
    }

    /* ── TRACK BY ORDER NUMBER (PUBLIC) ──────────────── */
    @GetMapping("/track/{orderNumber}")
    public ResponseEntity<?> track(@PathVariable String orderNumber) {
        return orderService.findByNumber(orderNumber)
                .map(o -> ResponseEntity.ok((Object) toDetail(o)))
                .orElse(ResponseEntity.notFound().build());
    }

    /* ── helpers ─────────────────────────────────────── */
    private Map<String, Object> toSummary(Order o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           o.getId());
        m.put("orderNumber",  o.getOrderNumber());
        m.put("status",       o.getStatus());
        m.put("totalAmount",  o.getTotalAmount());
        m.put("itemCount",    o.getItems().size());
        m.put("createdAt",    o.getCreatedAt());
        return m;
    }

    private Map<String, Object> toDetail(Order o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",                  o.getId());
        m.put("orderNumber",         o.getOrderNumber());
        m.put("status",              o.getStatus());
        m.put("subtotal",            o.getSubtotal());
        m.put("deliveryCharge",      o.getDeliveryCharge());
        m.put("totalAmount",         o.getTotalAmount());
        m.put("deliveryDistanceKm",  o.getDeliveryDistanceKm());
        m.put("deliveryAddress",     o.getDeliveryAddress());
        m.put("adminNotes",          o.getAdminNotes());
        m.put("paymentMethod",       o.getPaymentMethod());
        m.put("createdAt",           o.getCreatedAt());
        m.put("updatedAt",           o.getUpdatedAt());
        m.put("customerName",        o.getUser() != null ? o.getUser().getName() : "");
        m.put("customerPhone",       o.getUser() != null ? o.getUser().getPhone() : "");

        List<Map<String, Object>> items = new ArrayList<>();
        for (var item : o.getItems()) {
            Map<String, Object> i = new LinkedHashMap<>();
            i.put("productId",    item.getProduct().getId());
            i.put("productName",  item.getProduct().getName());
            i.put("emoji",        item.getProduct().getImageEmoji());
            i.put("unit",         item.getProduct().getUnit());
            i.put("quantity",     item.getQuantity());
            i.put("priceAtOrder", item.getPriceAtOrder());
            i.put("lineTotal",    item.getLineTotal());
            items.add(i);
        }
        m.put("items", items);
        return m;
    }
}
