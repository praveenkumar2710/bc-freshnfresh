package com.flowershop.service;

import com.flowershop.model.Order;
import com.flowershop.model.OrderItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class NotificationService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.name:BC Fresh n Fresh}")
    private String appName;

    // ─── 1. New Order → Customer + Admin ─────────────────────────────────────
    @Async
    public void sendOrderConfirmationEmail(Order order) {
        System.out.println("📧 Sending order confirmation to: " + order.getUser().getEmail());

        // Email to customer
        sendHtmlEmail(
            order.getUser().getEmail(),
            "✅ Order Confirmed - Thank you " + order.getUser().getName() + "!",
            buildCustomerConfirmationHtml(order)
        );

        // Email to admin
        sendHtmlEmail(
            adminEmail,
            "🛒 New Order Received - " + order.getOrderNumber(),
            buildAdminNewOrderHtml(order)
        );
    }

    // ─── 2. Delivery email ────────────────────────────────────────────────────
    @Async
    public void sendDeliveryNotificationEmail(Order order) {
        System.out.println("📧 Sending delivery notification to: " + order.getUser().getEmail());
        sendHtmlEmail(
            order.getUser().getEmail(),
            "🌸 Your Order Has Been Delivered! Thank you " + order.getUser().getName() + "!",
            buildCustomerDeliveryHtml(order)
        );
    }

    // ─── Generic HTML Email Sender ────────────────────────────────────────────
    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            System.out.println("✅ Email sent successfully to: " + to);
        } catch (MessagingException e) {
            System.err.println("❌ Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    // ─── HTML: Customer Order Confirmation ────────────────────────────────────
    private String buildCustomerConfirmationHtml(Order order) {
        String itemsHtml = buildItemsTable(order);
        return "<html><body style='font-family:sans-serif;background:#f4f9f4;padding:20px;'>"
            + "<div style='max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;'>"
            + "<div style='background:#1a8c4e;padding:28px;text-align:center;'>"
            + "<h1 style='color:#fff;margin:0;font-size:22px;'>🌸 Order Confirmed!</h1>"
            + "<p style='color:rgba(255,255,255,0.85);margin:6px 0 0;'>" + appName + "</p>"
            + "</div>"
            + "<div style='padding:24px;'>"
            + "<p style='font-size:16px;'>Hi <strong>" + order.getUser().getName() + "</strong> 👋</p>"
            + "<p>Thank you for your order! We have received it and it is being prepared.</p>"
            + "<div style='background:#f8fdf8;border:1px solid #d4edda;border-radius:8px;padding:14px;margin:16px 0;'>"
            + "<p><strong>Order Number:</strong> #" + order.getOrderNumber() + "</p>"
            + "<p><strong>Payment:</strong> " + (order.getPaymentMethod() != null ? order.getPaymentMethod() : "COD") + "</p>"
            + "<p><strong>Delivery Address:</strong> " + order.getDeliveryAddress() + "</p>"
            + "</div>"
            + "<h3 style='color:#1a8c4e;'>Items Ordered</h3>"
            + itemsHtml
            + "<div style='background:#1a8c4e;border-radius:8px;padding:14px;margin-top:16px;'>"
            + "<p style='color:#fff;font-size:16px;margin:0;'><strong>Total Amount: Rs." + order.getTotalAmount() + "</strong></p>"
            + "</div>"
            + "<p style='margin-top:16px;'>We deliver same day within 12 km. You will get another email once your order is delivered.</p>"
            + "</div>"
            + "<div style='background:#f4f9f4;padding:14px;text-align:center;'>"
            + "<p style='color:#aaa;font-size:12px;margin:0;'>" + appName + " - Hyderabad</p>"
            + "</div>"
            + "</div></body></html>";
    }

    // ─── HTML: Admin New Order Alert ──────────────────────────────────────────
    private String buildAdminNewOrderHtml(Order order) {
        String itemsHtml = buildItemsTable(order);
        return "<html><body style='font-family:sans-serif;background:#f0f0f0;padding:20px;'>"
            + "<div style='max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;'>"
            + "<div style='background:#e67e22;padding:28px;text-align:center;'>"
            + "<h1 style='color:#fff;margin:0;font-size:20px;'>🛒 New Order Received!</h1>"
            + "<p style='color:rgba(255,255,255,0.9);margin:6px 0 0;'>Action required - prepare order</p>"
            + "</div>"
            + "<div style='padding:24px;'>"
            + "<div style='background:#fff8f0;border:1px solid #fde8c8;border-radius:8px;padding:14px;margin-bottom:16px;'>"
            + "<h3 style='color:#e67e22;margin:0 0 10px;'>👤 Customer Details</h3>"
            + "<p><strong>Name:</strong> " + order.getUser().getName() + "</p>"
            + "<p><strong>Phone:</strong> " + (order.getUser().getPhone() != null ? order.getUser().getPhone() : "-") + "</p>"
            + "<p><strong>Email:</strong> " + order.getUser().getEmail() + "</p>"
            + "<p><strong>Address:</strong> " + order.getDeliveryAddress() + "</p>"
            + "</div>"
            + "<div style='background:#f8fdf8;border:1px solid #d4edda;border-radius:8px;padding:14px;margin-bottom:16px;'>"
            + "<h3 style='color:#1a8c4e;margin:0 0 10px;'>📋 Order Details</h3>"
            + "<p><strong>Order Number:</strong> #" + order.getOrderNumber() + "</p>"
            + "<p><strong>Payment:</strong> " + (order.getPaymentMethod() != null ? order.getPaymentMethod() : "COD") + "</p>"
            + "<p><strong>Subtotal:</strong> Rs." + order.getSubtotal() + "</p>"
            + "<p><strong>Delivery Charge:</strong> Rs." + order.getDeliveryCharge() + "</p>"
            + "</div>"
            + "<h3>🌸 Items Ordered</h3>"
            + itemsHtml
            + "<div style='background:#e67e22;border-radius:8px;padding:14px;margin-top:16px;'>"
            + "<p style='color:#fff;font-size:18px;margin:0;'><strong>💰 Total to Collect: Rs." + order.getTotalAmount() + "</strong></p>"
            + "</div>"
            + "</div>"
            + "<div style='background:#fef9f0;padding:14px;text-align:center;'>"
            + "<p style='color:#aaa;font-size:12px;margin:0;'>Login to admin panel to update order status</p>"
            + "</div>"
            + "</div></body></html>";
    }

    // ─── HTML: Customer Delivery Confirmation ─────────────────────────────────
    private String buildCustomerDeliveryHtml(Order order) {
        String itemsHtml = buildItemsTable(order);
        return "<html><body style='font-family:sans-serif;background:#f4f9f4;padding:20px;'>"
            + "<div style='max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;'>"
            + "<div style='background:#1a8c4e;padding:32px;text-align:center;'>"
            + "<h1 style='color:#fff;margin:0;font-size:24px;'>🌸 Order Delivered!</h1>"
            + "<p style='color:rgba(255,255,255,0.9);margin:6px 0 0;'>Your fresh flowers have arrived!</p>"
            + "</div>"
            + "<div style='padding:24px;'>"
            + "<p style='font-size:16px;'>Hi <strong>" + order.getUser().getName() + "</strong> 🙏</p>"
            + "<p>Your order <strong>#" + order.getOrderNumber() + "</strong> has been successfully delivered.</p>"
            + "<div style='background:#f8fdf8;border:1px solid #d4edda;border-radius:8px;padding:14px;margin:16px 0;'>"
            + itemsHtml
            + "<hr style='margin:12px 0;border:none;border-top:1px solid #eee;'/>"
            + "<p><strong>Subtotal:</strong> Rs." + order.getSubtotal() + "</p>"
            + "<p><strong>Delivery:</strong> Rs." + order.getDeliveryCharge() + "</p>"
            + "<p style='font-size:16px;color:#1a8c4e;'><strong>Total Paid: Rs." + order.getTotalAmount() + "</strong></p>"
            + "</div>"
            + "<div style='background:#fff8f0;border-radius:10px;padding:20px;text-align:center;'>"
            + "<h3 style='color:#e67e22;margin:0 0 8px;'>🙏 Thank You for Choosing Us!</h3>"
            + "<p style='color:#777;font-size:13px;margin:0;'>Your support means the world to us. We would love to serve you again soon!</p>"
            + "</div>"
            + "</div>"
            + "<div style='background:#f4f9f4;padding:14px;text-align:center;'>"
            + "<p style='color:#aaa;font-size:12px;margin:0;'>" + appName + " - Same-day delivery within 12 km - Hyderabad</p>"
            + "</div>"
            + "</div></body></html>";
    }

    // ─── Helper: Items Table ──────────────────────────────────────────────────
    private String buildItemsTable(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        sb.append("<table style='width:100%;border-collapse:collapse;font-size:14px;'>");
        sb.append("<tr style='background:#f0f0f0;'><th style='padding:8px 10px;text-align:left;'>Item</th><th style='padding:8px 10px;text-align:center;'>Qty</th><th style='padding:8px 10px;text-align:right;'>Price</th></tr>");
        for (OrderItem item : order.getItems()) {
            String name = item.getProduct() != null ? item.getProduct().getName() : "Item";
            sb.append("<tr style='border-bottom:1px solid #f0f0f0;'>")
              .append("<td style='padding:8px 10px;'>").append(name).append("</td>")
              .append("<td style='padding:8px 10px;text-align:center;'>").append(item.getQuantity()).append("</td>")
              .append("<td style='padding:8px 10px;text-align:right;color:#1a8c4e;font-weight:600;'>Rs.").append(item.getLineTotal()).append("</td>")
              .append("</tr>");
        }
        sb.append("</table>");
        return sb.toString();
    }
}