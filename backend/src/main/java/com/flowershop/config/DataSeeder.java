package com.flowershop.config;

import com.flowershop.model.Product;
import com.flowershop.model.User;
import com.flowershop.repository.ProductRepository;
import com.flowershop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private UserRepository    userRepo;
    @Autowired private ProductRepository productRepo;
    @Autowired private PasswordEncoder   encoder;

    @Value("${app.admin.email:admin@gmail.com}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPass;

    @Override
    public void run(String... args) {

        if (!userRepo.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setName("Shop Admin");
            admin.setEmail(adminEmail);
            admin.setPassword(encoder.encode(adminPass));
            admin.setRole(User.Role.ADMIN);
            userRepo.save(admin);
            System.out.println("✅ Admin created → " + adminEmail);
        }

        if (productRepo.count() == 0) {

            // NOTE: imageUrl is null for all seeded products.
            // Admin can upload real photos via the Admin → Products → Edit panel.
            // emoji is kept only as a visual fallback until a photo is uploaded.

            // ── GARLANDS ─────────────────────────────────────────────
            seed("Rose Garland – 2ft",               "85",   50,  "piece",   "🌹", "Fresh red rose garland, 2ft length",             "Garlands");
            seed("Jasmine Garland (Mogra) – 1ft",    "60",   80,  "piece",   "🤍", "Pure white jasmine garland, fragrant",           "Garlands");
            seed("Marigold Garland – 2ft",            "45",  100,  "piece",   "🟡", "Bright marigold garland for puja & decor",       "Garlands");
            seed("Chrysanthemum Garland – 2ft",       "70",   60,  "piece",   "🌼", "White chrysanthemum garland",                    "Garlands");
            seed("Mixed Flower Garland – 2ft",        "90",   40,  "piece",   "💐", "Assorted fresh flower garland",                  "Garlands");
            seed("Crossandra String – 25cm",          "35",  120,  "piece",   "🧡", "Crossandra (Kanakambaram) string",               "Garlands");
            seed("Aster Lavender String – 120cm",    "274",   30,  "piece",   "💜", "Long lavender aster flower string",              "Garlands");
            seed("Durva Grass Garland with Roses",   "145",   40,  "piece",   "🌿", "Sacred durva grass garland with roses",          "Garlands");
            seed("Crown Flower Garland",             "120",   25,  "piece",   "👑", "White crown flower (Madar) garland",             "Garlands");
            seed("Pink Lotus & Red Rose Garland",    "160",   20,  "piece",   "🪷", "Premium lotus and rose combination garland",     "Garlands");
            seed("Mango Leaves String – 3ft",         "50",   60,  "piece",   "🍃", "Mango leaf toran/string for door",               "Garlands");
            seed("Turmeric Sticks Garland",           "95",   40,  "piece",   "🟡", "Turmeric stick garland for puja",                "Garlands");

            // ── BOUQUETS ──────────────────────────────────────────────
            seed("Red Rose Bouquet – 10 Stems",      "249",   15,  "piece",   "🌹", "10 fresh red roses, wrapped in premium paper",  "Bouquets");
            seed("Mixed Flower Bouquet – Small",     "199",   20,  "piece",   "💐", "Vibrant mix of seasonal flowers, small size",   "Bouquets");
            seed("Mixed Flower Bouquet – Medium",    "349",   15,  "piece",   "💐", "Premium mixed bouquet with 20+ stems",          "Bouquets");
            seed("Sunflower Bouquet – 5 Stems",      "299",   10,  "piece",   "🌻", "Bright yellow sunflowers, cheerful gift",       "Bouquets");
            seed("Carnation Bouquet – 10 Stems",     "229",   12,  "piece",   "🌸", "Fresh carnations in assorted colors",           "Bouquets");
            seed("White Lily Bouquet – 5 Stems",     "349",    8,  "piece",   "🤍", "Elegant white lilies, fragrant",                "Bouquets");
            seed("Jasmine Gajra – Bridal",           "120",   30,  "piece",   "⚪", "Bridal jasmine gajra for hair adornment",       "Bouquets");
            seed("Flower Bookay – Classic",          "299",   10,  "piece",   "🎀", "Classic flower bookay with mixed blooms",       "Bouquets");
            seed("Flower Bookay – Premium",          "499",    8,  "piece",   "💎", "Premium flower bookay with roses and lilies",   "Bouquets");

            // ── POOJA FLOWERS (sold in 250gm packets where applicable) ──
            seed("Assorted Pooja Loose Flowers",      "58",  150,  "250gm",   "🌸", "Mixed loose flowers for daily puja",            "Pooja Flowers");
            seed("Rose Petals",                        "45",  100,  "250gm",   "🌹", "Fresh rose petals for puja",                    "Pooja Flowers");
            seed("Chrysanthemum White",                "40",   90,  "250gm",   "🌼", "White chrysanthemum loose flowers",             "Pooja Flowers");
            seed("Marigold (Chendupoo)",               "30",  200,  "250gm",   "🟡", "Fresh marigold flowers",                        "Pooja Flowers");
            seed("Lotus Pink – Pair",                 "120",   30,  "pair",    "🪷", "Fresh pink lotus, auspicious offering",         "Pooja Flowers");
            seed("Lotus White – Pair",                "130",   25,  "pair",    "🤍", "Pure white lotus",                              "Pooja Flowers");
            seed("Hibiscus (Gudhal)",                  "25",  150,  "bunch",   "🌺", "Red hibiscus, sacred for puja",                 "Pooja Flowers");
            seed("Jasmine Loose (Mogra)",              "80",   60,  "50gm",    "⚪", "Fragrant loose jasmine flowers",                "Pooja Flowers");
            seed("Paneer Rose",                        "55",   70,  "bunch",   "🌸", "Paneer rose flowers",                           "Pooja Flowers");
            seed("Kakada Flower",                      "65",   50,  "bunch",   "🌻", "Kakada (Jasmine subspecies) flowers",           "Pooja Flowers");
            seed("Chrysanthemum White – 2 Bunches",   "55",   80,  "set",     "🌼", "Two bunches of white chrysanthemum",            "Pooja Flowers");
            seed("Coconut Flower (Cocos)",            "180",   20,  "piece",   "🌴", "Coconut tree flower, auspicious",               "Pooja Flowers");
            seed("Gypsum Flower (Muggu Jade)",        "110",   35,  "piece",   "🤍", "Decorative gypsum flower string",               "Pooja Flowers");

            // ── SACRED LEAVES ─────────────────────────────────────────
            seed("Betel Leaves",                       "17",  200,  "dozen",   "🍃", "12 fresh betel leaves for puja",                "Sacred Leaves");
            seed("Bilva Leaves (Bel Patra)",          "175",   80,  "250gm",   "🌿", "Sacred bel leaves for Shiva puja",              "Sacred Leaves");
            seed("Tulsi Leaves",                       "20",  200,  "bunch",   "🌿", "Holy basil, fresh daily",                       "Sacred Leaves");
            seed("Tulsi String – 1ft",                 "30",  100,  "piece",   "🌱", "Tulsi string for offering",                     "Sacred Leaves");
            seed("Banana Leaves",                      "45",   80,  "dozen",   "🍌", "12 fresh banana leaves, pure puja use",         "Sacred Leaves");
            seed("Mango Leaves",                       "30",  100,  "dozen",   "🍃", "12 fresh mango leaves, auspicious",             "Sacred Leaves");
            seed("Neem Leaves",                        "15",  150,  "bunch",   "🌿", "Fresh neem leaves",                             "Sacred Leaves");
            seed("Davanam Leaf",                       "25",  120,  "bunch",   "🌿", "Fragrant davanam leaves",                       "Sacred Leaves");

            // ── POOJA ESSENTIALS ──────────────────────────────────────
            seed("Coconut (Puja)",                     "30",  200,  "piece",   "🥥", "Fresh coconut for puja rituals",                "Pooja Essentials");
            seed("Coconut Leaf Thoranam – 10 pcs",     "60",   50,  "set",     "🌴", "Coconut leaf decorative string",                "Pooja Essentials");
            seed("Bilva Fruit",                        "50",   40,  "piece",   "🫒", "Sacred bilva fruit",                            "Pooja Essentials");
            seed("Dhatura Fruit",                      "35",   30,  "piece",   "🌿", "Dhatura fruit for Shiva offering",              "Pooja Essentials");
            seed("Areca Catechu Flower (Pakku)",      "137",   10,  "bunch",   "🌼", "Areca palm flower, auspicious",                 "Pooja Essentials");
            seed("Agarbatti – Packet",                 "10",  300,  "packet",  "🪔", "Incense sticks pack",                           "Pooja Essentials");
            seed("Dhurva Grass",                       "20",  150,  "bunch",   "🌱", "Three-bladed sacred durva grass",               "Pooja Essentials");

            System.out.println("✅ Catalogue seeded — " + productRepo.count() + " products.");
            System.out.println("ℹ️  Upload real product photos via Admin → Products → Edit.");
        }
    }

    private void seed(String name, String price, int stock,
                      String unit, String emoji, String desc, String category) {
        Product p = new Product();
        p.setName(name);
        p.setPrice(new BigDecimal(price));
        p.setStock(stock);
        p.setUnit(unit);
        p.setImageEmoji(emoji);   // shown as fallback until admin uploads a photo
        p.setImageUrl(null);      // no image until admin uploads one
        p.setDescription(desc);
        p.setCategory(category);
        productRepo.save(p);
    }
}
