package com.flowershop.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

/**
 * 🚚 Delivery Service — Hyderabad zones
 *
 *  Zone  Distance       Charge   Min Order
 *  ────  ───────────    ──────   ─────────
 *  1     0 – 3 km       FREE     none
 *  2     3 – 6 km       ₹20      none
 *  3     6 – 10 km      ₹40      ₹200
 *  4     10 – 12 km     ₹60      ₹200
 *  –     > 12 km        ✗ no service
 *
 *  Shop GPS: 17.525450, 78.368997 (Hyderabad)
 */
@Service
public class DeliveryService {

    @Value("${shop.location.lat:17.525450}") private double shopLat;
    @Value("${shop.location.lon:78.368997}") private double shopLon;
    @Value("${shop.delivery.max-km:12}")     private double maxKm;

    public record DeliveryInfo(
        boolean    canDeliver,
        double     distanceKm,
        String     zone,
        BigDecimal charge,
        BigDecimal minOrder,
        String     message
    ) {}

    public DeliveryInfo calculate(double customerLat, double customerLon) {
        double km = Math.round(haversine(shopLat, shopLon, customerLat, customerLon) * 100.0) / 100.0;

        if (km > maxKm)
            return new DeliveryInfo(false, km, "OUT_OF_RANGE",
                    BigDecimal.ZERO, BigDecimal.ZERO,
                    String.format("Sorry! We only deliver within %.0f km of Hyderabad shop. You are %.1f km away.", maxKm, km));

        if (km <= 3)
            return new DeliveryInfo(true, km, "ZONE1",
                    BigDecimal.ZERO, BigDecimal.ZERO, "Free delivery! 🎉");

        if (km <= 6)
            return new DeliveryInfo(true, km, "ZONE2",
                    new BigDecimal("20"), BigDecimal.ZERO, "Delivery charge: ₹20");

        if (km <= 10)
            return new DeliveryInfo(true, km, "ZONE3",
                    new BigDecimal("40"), new BigDecimal("200"),
                    "Delivery charge: ₹40 (min order ₹200)");

        return new DeliveryInfo(true, km, "ZONE4",
                new BigDecimal("60"), new BigDecimal("200"),
                "Delivery charge: ₹60 (min order ₹200)");
    }

    public boolean meetsMinOrder(DeliveryInfo info, BigDecimal subtotal) {
        return subtotal.compareTo(info.minOrder()) >= 0;
    }

    /** Haversine — great-circle distance in km */
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public double getShopLat() { return shopLat; }
    public double getShopLon() { return shopLon; }
    public double getMaxKm()   { return maxKm; }
}
