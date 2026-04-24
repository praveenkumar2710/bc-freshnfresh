package com.flowershop.controller;

import com.flowershop.dto.LoginRequest;
import com.flowershop.dto.RegisterRequest;
import com.flowershop.model.User;
import com.flowershop.repository.UserRepository;
import com.flowershop.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 🔐 Auth Controller
 *
 *  POST /api/auth/register  → create customer account
 *  POST /api/auth/login     → returns JWT token
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtUtil jwtUtil;

    /* ── REGISTER ─────────────────────────────────────── */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {

        if (userRepo.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email already registered. Please login."));
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail().toLowerCase().trim());
        user.setPassword(encoder.encode(req.getPassword()));
        user.setPhone(req.getPhone());
        user.setAddress(req.getAddress());
        user.setRole(User.Role.CUSTOMER);
        userRepo.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(buildAuthResponse(user, token));
    }

    /* ── LOGIN ────────────────────────────────────────── */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {

        User user = userRepo.findByEmail(req.getEmail().toLowerCase().trim())
                .orElse(null);

        if (user == null || !encoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid email or password."));
        }

        if (!user.isActive()) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Account is disabled. Contact shop."));
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(buildAuthResponse(user, token));
    }

    /* ── GET PROFILE ──────────────────────────────────── */
    @GetMapping("/me")
    public ResponseEntity<?> getProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Object principal) {

        if (principal instanceof User user) {
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("id",      user.getId());
            res.put("name",    user.getName());
            res.put("email",   user.getEmail());
            res.put("phone",   user.getPhone());
            res.put("address", user.getAddress());
            res.put("role",    user.getRole());
            return ResponseEntity.ok(res);
        }
        return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }

    /* ── UPDATE PROFILE ───────────────────────────────── */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Object principal,
            @RequestBody Map<String, String> body) {

        if (!(principal instanceof User user)) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        if (body.containsKey("name")    && !body.get("name").isBlank())    user.setName(body.get("name"));
        if (body.containsKey("phone"))   user.setPhone(body.get("phone"));
        if (body.containsKey("address")) user.setAddress(body.get("address"));
        userRepo.save(user);

        return ResponseEntity.ok(Map.of("message", "Profile updated", "name", user.getName()));
    }

    /* ── helper ───────────────────────────────────────── */
    private Map<String, Object> buildAuthResponse(User user, String token) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("token",   token);
        m.put("id",      user.getId());
        m.put("name",    user.getName());
        m.put("email",   user.getEmail());
        m.put("role",    user.getRole());
        m.put("message", "Login successful");
        return m;
    }
}
