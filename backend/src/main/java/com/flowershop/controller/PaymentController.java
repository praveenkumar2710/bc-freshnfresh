package com.flowershop.controller;

import com.flowershop.model.Order;
import com.flowershop.service.OrderService;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * 💳 Razorpay Payment Controller
 *
 * POST /api/payment/create-order   → Create Razorpay order (returns order_id for frontend)
 * POST /api/payment/verify         → Verify payment signature after success
 */
@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired private OrderService orderService;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    /**
     * Step 1: Create a Razorpay order for the given shop order ID
     * Called by frontend just before showing the Razorpay payment dialog
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody Map<String, Object> body) {
        try {
            Long orderId = Long.parseLong(body.get("orderId").toString());
            Order order  = orderService.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

            // Amount in paise (1 INR = 100 paise)
            int amountPaise = order.getTotalAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .intValue();

            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject options = new JSONObject();
            options.put("amount",   amountPaise);
            options.put("currency", "INR");
            options.put("receipt",  order.getOrderNumber());
            options.put("notes",    new JSONObject()
                    .put("shopOrderId",  orderId.toString())
                    .put("orderNumber",  order.getOrderNumber())
            );

            com.razorpay.Order rzpOrder = client.orders.create(options);

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("razorpayOrderId", rzpOrder.get("id"));
            res.put("amount",          amountPaise);
            res.put("currency",        "INR");
            res.put("keyId",           razorpayKeyId);
            res.put("orderNumber",     order.getOrderNumber());
            res.put("shopOrderId",     orderId);
            return ResponseEntity.ok(res);

        } catch (RazorpayException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Razorpay error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Step 2: Verify Razorpay payment signature after user pays
     * This is the CRITICAL security step — never skip this
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> body) {
        try {
            String razorpayOrderId   = body.get("razorpayOrderId");
            String razorpayPaymentId = body.get("razorpayPaymentId");
            String razorpaySignature = body.get("razorpaySignature");
            Long   shopOrderId       = Long.parseLong(body.get("shopOrderId"));

            // HMAC-SHA256 signature verification
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            String computed = hmacSHA256(payload, razorpayKeySecret);

            if (!computed.equals(razorpaySignature)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Payment verification failed — invalid signature"));
            }

            // Mark order as CONFIRMED with payment ID
            Order order = orderService.confirmPayment(shopOrderId, razorpayPaymentId);

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("success",     true);
            res.put("orderId",     order.getId());
            res.put("orderNumber", order.getOrderNumber());
            res.put("status",      order.getStatus());
            res.put("message",     "Payment successful! Order confirmed.");
            return ResponseEntity.ok(res);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Verification error: " + e.getMessage()));
        }
    }

    private String hmacSHA256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(key);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
