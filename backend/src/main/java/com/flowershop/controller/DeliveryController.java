package com.flowershop.controller;

import com.flowershop.service.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.LinkedHashMap;

/**
 * 🚚 Delivery Controller  (PUBLIC)
 *
 *  GET /api/delivery/check?lat=17.xx&lon=78.xx   → delivery info for a location
 *  GET /api/delivery/zones                        → show all delivery zones
 *  GET /api/delivery/shop-location               → shop GPS coords
 */
@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {

    @Autowired private DeliveryService deliveryService;

    @GetMapping("/check")
    public Map<String, Object> check(
            @RequestParam double lat,
            @RequestParam double lon) {

        DeliveryService.DeliveryInfo info = deliveryService.calculate(lat, lon);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("canDeliver",   info.canDeliver());
        m.put("distanceKm",   info.distanceKm());
        m.put("zone",         info.zone());
        m.put("charge",       info.charge());
        m.put("minOrder",     info.minOrder());
        m.put("message",      info.message());
        return m;
    }

    @GetMapping("/zones")
    public Object zones() {
        return Map.of(
            "shopCity", "Hyderabad",
            "shopLat",  deliveryService.getShopLat(),
            "shopLon",  deliveryService.getShopLon(),
            "maxDeliveryKm", deliveryService.getMaxKm(),
            "zones", new Object[]{
                Map.of("zone","ZONE1","range","0–3 km",  "charge","₹0",  "minOrder","none"),
                Map.of("zone","ZONE2","range","3–6 km",  "charge","₹40", "minOrder","none"),
                Map.of("zone","ZONE3","range","6–10 km", "charge","₹70", "minOrder","₹200"),
                Map.of("zone","ZONE4","range","10–12 km","charge","₹100", "minOrder","₹200")
            }
        );
    }

    @GetMapping("/shop-location")
    public Map<String, Object> shopLocation() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("city",   "Hyderabad");
        m.put("lat",    deliveryService.getShopLat());
        m.put("lon",    deliveryService.getShopLon());
        m.put("maxKm",  deliveryService.getMaxKm());
        return m;
    }
}
