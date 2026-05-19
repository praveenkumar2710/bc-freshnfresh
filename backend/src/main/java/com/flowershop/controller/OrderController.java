package com.flowershop.controller;

import com.flowershop.dto.PlaceOrderRequest;
import com.flowershop.model.Order;
import com.flowershop.model.User;
import com.flowershop.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    /* ── PLACE ORDER ─────────────────────────────────────── */
    @PostMapping
    public ResponseEntity<?> placeOrder(
            @RequestBody PlaceOrderRequest req,
            @AuthenticationPrincipal Object principal) {

        if (!(principal instanceof User user))
            return ResponseEntity.status(401).body(Map.of("error", "Please login"));

        try {
            Order order = orderService.placeOrder(user, req);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "orderId", order.getId(),
                "orderNumber", order.getOrderNumber(),
                "totalAmount", order.getTotalAmount()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /* ── MY ORDERS ───────────────────────────────────────── */
    @GetMapping("/my")
    public ResponseEntity<?> myOrders(@AuthenticationPrincipal Object principal) {

        if (!(principal instanceof User user))
            return ResponseEntity.status(401).body(Map.of("error", "Please login"));

        try {
            var orders = orderService.getByUserId(user.getId());
            var result = orders.stream().map(o -> Map.of(
                "id",           o.getId(),
                "orderNumber",  o.getOrderNumber(),
                "status",       o.getStatus(),
                "totalAmount",  o.getTotalAmount(),
                "createdAt",    o.getCreatedAt(),
                "itemCount",    o.getItems() != null ? o.getItems().size() : 0
            )).toList();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /* ── GET SINGLE ORDER ────────────────────────────────── */
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal Object principal) {

        if (!(principal instanceof User user))
            return ResponseEntity.status(401).body(Map.of("error", "Please login"));

        return orderService.findById(id)
                .filter(o -> o.getUser().getId().equals(user.getId()))
                .map(o -> ResponseEntity.ok((Object) toOrderDetail(o)))
                .orElse(ResponseEntity.notFound().build());
    }

    /* ── TRACK ORDER BY NUMBER ───────────────────────────── */
    @GetMapping("/track/{orderNumber}")
    public ResponseEntity<?> trackOrder(@PathVariable String orderNumber) {
        return orderService.findByNumber(orderNumber)
                .map(o -> ResponseEntity.ok((Object) toOrderDetail(o)))
                .orElse(ResponseEntity.notFound().build());
    }

    /* ── CANCEL ORDER (CUSTOMER) ─────────────────────────── */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal Object principal) {

        if (!(principal instanceof User user))
            return ResponseEntity.status(401).body(Map.of("error", "Please login"));

        try {
            Order order = orderService.cancelOrder(id, user.getId());
            return ResponseEntity.ok(Map.of(
                "success",      true,
                "orderNumber",  order.getOrderNumber(),
                "status",       order.getStatus(),
                "message",      "Order cancelled successfully"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /* ── helpers ─────────────────────────────────────────── */
    private Map<String, Object> toOrderDetail(Order o) {
        var items = o.getItems() != null
            ? o.getItems().stream().map(item -> Map.of(
                "productId",    item.getProduct() != null ? item.getProduct().getId()   : null,
                "productName",  item.getProduct() != null ? item.getProduct().getName() : "Item",
                "quantity",     item.getQuantity(),
                "priceAtOrder", item.getPriceAtOrder(),
                "lineTotal",    item.getLineTotal(),
                "unit",         item.getProduct() != null && item.getProduct().getUnit() != null
                                    ? item.getProduct().getUnit() : ""
              )).toList()
            : java.util.List.of();

        return Map.of(
            "id",                  o.getId(),
            "orderNumber",         o.getOrderNumber(),
            "status",              o.getStatus(),
            "subtotal",            o.getSubtotal(),
            "deliveryCharge",      o.getDeliveryCharge(),
            "totalAmount",         o.getTotalAmount(),
            "deliveryAddress",     o.getDeliveryAddress() != null ? o.getDeliveryAddress() : "",
            "paymentMethod",       o.getPaymentMethod()   != null ? o.getPaymentMethod()   : "COD",
            "createdAt",           o.getCreatedAt(),
            "items",               items
        );
    }
}