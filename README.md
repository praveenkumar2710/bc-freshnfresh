# 🌸 BCFreshNFresh — Fullstack Flower Shop

Spring Boot (Java) backend + React frontend for a fresh flower delivery shop in Hyderabad.

---

## 🚀 Quick Start

### Backend
1. Make sure MySQL is running
2. Update `application.properties` if your MySQL password differs from `Root`
3. Run the Spring Boot app — database and tables are auto-created
4. Default admin is seeded: **admin@gmail.com / admin123**

### Frontend
```bash
cd frontend
npm install
npm start
```

Runs on `http://localhost:3000`

---

## 🔐 Admin Login

| Field    | Value             |
|----------|-------------------|
| Email    | admin@gmail.com   |
| Password | admin123          |
| URL      | /admin            |

> ⚠️ If you registered a new account and want it to be admin, run this SQL:
> ```sql
> UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
> ```
> Then log out and log back in.

---

## 🛠️ Fixes Applied (v2)

### Frontend
- **`AdminOrders.js`** — Fixed silent `.catch(() => {})` that swallowed all errors and caused infinite spinner. Now shows proper error messages (401 = session expired, 403 = not admin, 500 = server error) with a Retry button.
- **`AdminDashboard.js`** — Added error state with clear message instead of blank screen on API failure.
- **`api.js`** — Added global Axios 401 interceptor that auto-clears expired tokens and redirects to `/login`. Removed broken `status` param from `getOrders()` (filtering is done client-side).
- **`AuthContext.js`** — Role is now always read from JWT token itself (source of truth), not just from server response. Prevents stale CUSTOMER role after admin promotion.

### Backend
- **`SecurityConfig.java`** — Added `HttpStatusEntryPoint(401)` so unauthenticated requests return proper JSON `401` instead of HTML redirect to `/login`. Added `ExposedHeaders` for Authorization. CORS now supports comma-separated origins.
- **`AdminController.java`** — All endpoints now return proper `ResponseEntity` with JSON error messages instead of bare exceptions. Added null/validation checks on request bodies.
- **`application.properties`** — CORS now allows both `localhost:3000` and `localhost:3001`.

---

## 📁 Project Structure

```
combined/
├── frontend/          React app
│   └── src/
│       ├── pages/admin/   AdminOrders, AdminDashboard, AdminProducts
│       ├── services/api.js
│       └── context/AuthContext.js
└── backend/           Spring Boot app
    └── src/main/java/com/flowershop/
        ├── controller/    AdminController, OrderController, AuthController
        ├── service/       OrderService, ProductService
        ├── model/         Order, User, Product
        ├── security/      JwtFilter, JwtUtil
        └── config/        SecurityConfig, DataSeeder
```

---

## ⚙️ Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.password=Root          # your MySQL password
app.cors.allowed-origins=http://localhost:3000
app.admin.email=admin@gmail.com
app.admin.password=admin123
```
