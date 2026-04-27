package com.flowershop.config;

import com.flowershop.security.JwtFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            // ✅ CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ✅ Disable CSRF (API project)
            .csrf(csrf -> csrf.disable())

            // ✅ Stateless (JWT)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // ✅ Return 401 instead of redirect
            .exceptionHandling(e ->
                e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )

            // ❗ Disable default login forms
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())

            // ✅ Authorization rules
            .authorizeHttpRequests(auth -> auth

                // Error + preflight
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public APIs
                .requestMatchers(
                    "/api/auth/**",
                    "/api/products/**",
                    "/api/delivery/**",
                    "/api/orders/track/**",
                    "/uploads/**"
                ).permitAll()

                // Admin
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Logged-in users
                .requestMatchers("/api/orders/**").hasAnyRole("CUSTOMER", "ADMIN")
                .requestMatchers("/api/payment/**").hasAnyRole("CUSTOMER", "ADMIN")
                .requestMatchers("/api/user/**").hasAnyRole("CUSTOMER", "ADMIN")

                .anyRequest().authenticated()
            )

            // ✅ JWT filter
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ✅ Password encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ✅ FINAL CORS CONFIG (FIXES YOUR ISSUE)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "https://bucolic-kitten-6d2114.netlify.app"
        ));

        config.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}