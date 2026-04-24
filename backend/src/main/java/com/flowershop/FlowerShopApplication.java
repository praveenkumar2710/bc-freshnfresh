package com.flowershop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FlowerShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(FlowerShopApplication.class, args);
        System.out.println("""

🌸 ═══════════════════════════════════════════════
   FLOWER SHOP API  — RUNNING
   Backend : http://localhost:8080
   React   : http://localhost:3000  (npm start)
   ─────────────────────────────────────────────
   PUBLIC  ENDPOINTS:
     POST /api/auth/register      ← customer signup
     POST /api/auth/login         ← customer / admin login
     GET  /api/products           ← browse flowers
     POST /api/orders             ← place order  (JWT)
     GET  /api/orders/my          ← my orders    (JWT)
     GET  /api/orders/track/{no}  ← track order
     GET  /api/delivery/check     ← delivery charge
   ADMIN ENDPOINTS:
     GET  /api/admin/dashboard
     POST /api/admin/products
     PUT  /api/admin/products/{id}
     PATCH /api/admin/products/{id}/price
     GET  /api/admin/orders
     PATCH /api/admin/orders/{id}/status
   ─────────────────────────────────────────────
   Admin login → admin / admin123
🌸 ═══════════════════════════════════════════════
""");
    }
}
