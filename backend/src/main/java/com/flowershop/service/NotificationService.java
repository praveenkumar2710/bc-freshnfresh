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

    // ─── 1. New Order → Email Customer (confirmation) + Email Admin (alert) ──

    @Async
    public void sendOrderConfirmationEmail(Order order) {
        String customerEmail = order.getUser().getEmail();
        String customerName  = order.getUser().getName();

        // Email to customer
        sendHtmlEmail(
            customerEmail,
            "✅ Order Confirmed — Thank you, " + customerName + "!",
            buildCustomerConfirmationHtml(order)
        );

        // Email to admin
        sendHtmlEmail(
            adminEmail,
            "🛒 New Order Received — " + order.getOrderNumber(),
            buildAdminNewOrderHtml(order)
        );
    }

    // ─── 2. Order Delivered → Email Customer (thank you + details) ───────────

    @Async
    public void sendDeliveryNotificationEmail(Order order) {
        sendHtmlEmail(
            order.getUser().getEmail(),
            "🌸 Your Order Has Been Delivered! Thank you, " + order.getUser().getName() + "!",
            buildCustomerDeliveryHtml(order)
        );
    }

    // ─── 3. Order Status Changed → Email Customer ────────────────────────────

    @Async
    public void sendStatusUpdateEmail(Order order) {
        String statusLabel = switch (order.getStatus()) {
            case CONFIRMED  -> "✅ Confirmed";
            case PREPARING  -> "👨‍🍳 Being Prepared";
            case OUT_FOR_DELIVERY -> "🚚 Out for Delivery";
            case DELIVERED  -> "📦 Delivered";
            case CANCELLED  -> "❌ Cancelled";
            default         -> order.getStatus().name();
        };

        sendHtmlEmail(
            order.getUser().getEmail(),
            "📦 Order Update: " + statusLabel + " — " + order.getOrderNumber(),
            buildStatusUpdateHtml(order, statusLabel)
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
        } catch (MessagingException e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    // ─── HTML: Customer Order Confirmation ────────────────────────────────────

    private String buildCustomerConfirmationHtml(Order order) {
        String itemsHtml = buildItemsTable(order);
        return """
            <html><body style="font-family:sans-serif;background:#f4f9f4;padding:30px;margin:0;">
              <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;
                          box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

                <!-- Header -->
                <div style="background:linear-gradient(135deg,#1a8c4e,#2ecc71);padding:32px;text-align:center;">
                  <div style="font-size:40px;">🌸</div>
                  <h1 style="color:#fff;margin:8px 0 0;font-size:22px;">Order Confirmed!</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">
                    %s
                  </p>
                </div>

                <!-- Body -->
                <div style="padding:28px 32px;">
                  <p style="color:#333;font-size:16px;">Hi <strong>%s</strong> 👋</p>
                  <p style="color:#555;">Thank you for your order! We've received it and it's being prepared.</p>

                  <!-- Order Info -->
                  <div style="background:#f8fdf8;border:1px solid #d4edda;border-radius:10px;padding:16px;margin:20px 0;">
                    <table style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td style="color:#555;padding:4px 0;font-size:14px;">Order Number</td>
                        <td style="color:#1a8c4e;font-weight:700;text-align:right;font-size:14px;">#%s</td>
                      </tr>
                      <tr>
                        <td style="color:#555;padding:4px 0;font-size:14px;">Payment</td>
                        <td style="text-align:right;font-size:14px;">%s</td>
                      </tr>
                      <tr>
                        <td style="color:#555;padding:4px 0;font-size:14px;">Delivery Address</td>
                        <td style="text-align:right;font-size:13px;color:#333;">%s</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Items -->
                  <h3 style="color:#1a8c4e;font-size:15px;margin:20px 0 10px;">🛒 Your Items</h3>
                  %s

                  <!-- Total -->
                  <div style="background:#1a8c4e;border-radius:8px;padding:14px 16px;margin-top:16px;display:flex;justify-content:space-between;">
                    <span style="color:#fff;font-size:16px;font-weight:600;">Total Amount</span>
                    <span style="color:#fff;font-size:18px;font-weight:700;">₹%s</span>
                  </div>

                  <p style="color:#555;margin-top:20px;font-size:14px;">
                    🕐 We deliver <strong>same day within 12 km</strong>. You'll get another email once your order is delivered.
                  </p>
                </div>

                <!-- Footer -->
                <div style="background:#f4f9f4;padding:18px 32px;text-align:center;border-top:1px solid #eee;">
                  <p style="color:#aaa;font-size:12px;margin:0;">%s · Hyderabad · UPI &amp; Cash on Delivery accepted</p>
                </div>
              </div>
            </body></html>
            """.formatted(
                appName,
                order.getUser().getName(),
                order.getOrderNumber(),
                order.getPaymentMethod() != null ? order.getPaymentMethod() : "COD",
                order.getDeliveryAddress(),
                itemsHtml,
                order.getTotalAmount(),
                appName
            );
    }

    // ─── HTML: Admin New Order Alert ──────────────────────────────────────────

    private String buildAdminNewOrderHtml(Order order) {
        String itemsHtml = buildItemsTable(order);
        return """
            <html><body style="font-family:sans-serif;background:#f0f0f0;padding:30px;margin:0;">
              <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;
                          box-shadow:0 4px 24px rgba(0,0,0,0.1);overflow:hidden;">

                <!-- Header -->
                <div style="background:linear-gradient(135deg,#e67e22,#f39c12);padding:28px;text-align:center;">
                  <div style="font-size:36px;">🛒</div>
                  <h1 style="color:#fff;margin:8px 0 0;font-size:20px;">New Order Received!</h1>
                  <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:14px;">Action required — prepare order</p>
                </div>

                <div style="padding:28px 32px;">

                  <!-- Customer Info -->
                  <div style="background:#fff8f0;border:1px solid #fde8c8;border-radius:10px;padding:16px;margin-bottom:20px;">
                    <h3 style="color:#e67e22;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">
                      👤 Customer Details
                    </h3>
                    <table style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td style="color:#555;padding:3px 0;font-size:14px;width:40%%;">Name</td>
                        <td style="font-weight:700;font-size:14px;">%s</td>
                      </tr>
                      <tr>
                        <td style="color:#555;padding:3px 0;font-size:14px;">Phone</td>
                        <td style="font-weight:700;font-size:14px;">%s</td>
                      </tr>
                      <tr>
                        <td style="color:#555;padding:3px 0;font-size:14px;">Email</td>
                        <td style="font-size:14px;">%s</td>
                      </tr>
                      <tr>
                        <td style="color:#555;padding:3px 0;font-size:14px;">Address</td>
                        <td style="font-size:13px;">%s</td>
                      </tr>
                      <tr>
                        <td style="color:#555;padding:3px 0;font-size:14px;">Distance</td>
                        <td style="font-size:14px;">%.1f km</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Order Info -->
                  <div style="background:#f8fdf8;border:1px solid #d4edda;border-radius:10px;padding:16px;margin-bottom:20px;">
                    <h3 style="color:#1a8c4e;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">
                      📋 Order Details
                    </h3>
                    <table style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td style="color:#555;padding:3px 0;font-size:14px;width:40%%;">Order Number</td>
                        <td style="font-weight:700;color:#1a8c4e;font-size:15px;">#%s</td>
                      </tr>
                      <tr>
                        <td style="color:#555;padding:3px 0;font-size:14px;">Payment</td>
                        <td style="font-size:14px;">%s</td>
                      </tr>
                      <tr>
                        <td style="color:#555;padding:3px 0;font-size:14px;">Subtotal</td>
                        <td style="font-size:14px;">₹%s</td>
                      </tr>
                      <tr>
                        <td style="color:#555;padding:3px 0;font-size:14px;">Delivery Charge</td>
                        <td style="font-size:14px;">₹%s</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Items -->
                  <h3 style="color:#333;font-size:15px;margin:0 0 10px;">🌸 Items Ordered</h3>
                  %s

                  <!-- Total -->
                  <div style="background:#e67e22;border-radius:8px;padding:14px 16px;margin-top:16px;">
                    <table style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td style="color:#fff;font-size:16px;font-weight:600;">💰 Total to Collect</td>
                        <td style="color:#fff;font-size:20px;font-weight:700;text-align:right;">₹%s</td>
                      </tr>
                    </table>
                  </div>
                </div>

                <div style="background:#fef9f0;padding:14px 32px;text-align:center;border-top:1px solid #eee;">
                  <p style="color:#aaa;font-size:12px;margin:0;">Login to admin panel to update order status</p>
                </div>
              </div>
            </body></html>
            """.formatted(
                order.getUser().getName(),
                order.getUser().getPhone() != null ? order.getUser().getPhone() : "—",
                order.getUser().getEmail(),
                order.getDeliveryAddress(),
                order.getDeliveryDistanceKm() != null ? order.getDeliveryDistanceKm().doubleValue() : 0.0,
                order.getOrderNumber(),
                order.getPaymentMethod() != null ? order.getPaymentMethod() : "COD",
                order.getSubtotal(),
                order.getDeliveryCharge(),
                itemsHtml,
                order.getTotalAmount()
            );
    }

    // ─── HTML: Customer Delivery Confirmation ─────────────────────────────────

    private String buildCustomerDeliveryHtml(Order order) {
        String itemsHtml = buildItemsTable(order);
        return """
            <html><body style="font-family:sans-serif;background:#f4f9f4;padding:30px;margin:0;">
              <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;
                          box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

                <!-- Header -->
                <div style="background:linear-gradient(135deg,#1a8c4e,#27ae60);padding:32px;text-align:center;">
                  <div style="font-size:48px;">🌸</div>
                  <h1 style="color:#fff;margin:8px 0 0;font-size:24px;">Delivered!</h1>
                  <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;">Your fresh flowers have arrived 🎉</p>
                </div>

                <div style="padding:28px 32px;">
                  <p style="color:#333;font-size:16px;">Hi <strong>%s</strong> 🙏</p>
                  <p style="color:#555;line-height:1.6;">
                    Your order <strong>#%s</strong> has been successfully delivered.
                    We hope you love your fresh flowers!
                  </p>

                  <!-- Order Summary -->
                  <div style="background:#f8fdf8;border:1px solid #d4edda;border-radius:10px;padding:16px;margin:20px 0;">
                    <h3 style="color:#1a8c4e;margin:0 0 12px;font-size:14px;">📋 Order Summary</h3>
                    %s
                    <div style="border-top:1px solid #eee;margin-top:12px;padding-top:12px;">
                      <table style="width:100%%;border-collapse:collapse;">
                        <tr>
                          <td style="color:#555;font-size:14px;">Subtotal</td>
                          <td style="text-align:right;font-size:14px;">₹%s</td>
                        </tr>
                        <tr>
                          <td style="color:#555;font-size:14px;">Delivery</td>
                          <td style="text-align:right;font-size:14px;">₹%s</td>
                        </tr>
                        <tr>
                          <td style="font-weight:700;font-size:15px;padding-top:6px;">Total Paid</td>
                          <td style="text-align:right;font-weight:700;font-size:16px;color:#1a8c4e;padding-top:6px;">₹%s</td>
                        </tr>
                      </table>
                    </div>
                  </div>

                  <!-- Thank you message -->
                  <div style="background:linear-gradient(135deg,#fff8f0,#fef3e2);border-radius:10px;
                              padding:20px;text-align:center;margin:20px 0;">
                    <div style="font-size:32px;">🙏</div>
                    <h3 style="color:#e67e22;margin:8px 0 4px;">Thank You for Choosing Us!</h3>
                    <p style="color:#777;font-size:13px;margin:0;">
                      Your support means the world to us.<br>
                      We'd love to serve you again soon!
                    </p>
                  </div>

                  <p style="color:#555;font-size:14px;text-align:center;">
                    🌸 Order fresh flowers anytime at <strong>%s</strong>
                  </p>
                </div>

                <div style="background:#f4f9f4;padding:18px 32px;text-align:center;border-top:1px solid #eee;">
                  <p style="color:#aaa;font-size:12px;margin:0;">%s · Same-day delivery within 12 km · Hyderabad</p>
                </div>
              </div>
            </body></html>
            """.formatted(
                order.getUser().getName(),
                order.getOrderNumber(),
                itemsHtml,
                order.getSubtotal(),
                order.getDeliveryCharge(),
                order.getTotalAmount(),
                appName,
                appName
            );
    }

    // ─── HTML: Status Update Email ────────────────────────────────────────────

    private String buildStatusUpdateHtml(Order order, String statusLabel) {
        String emoji = switch (order.getStatus()) {
            case CONFIRMED       -> "✅";
            case PREPARING       -> "👨‍🍳";
            case OUT_FOR_DELIVERY -> "🚚";
            case DELIVERED       -> "📦";
            case CANCELLED       -> "❌";
            default              -> "📋";
        };
        String color = switch (order.getStatus()) {
            case CONFIRMED       -> "#1a8c4e";
            case PREPARING       -> "#e67e22";
            case OUT_FOR_DELIVERY -> "#2980b9";
            case DELIVERED       -> "#27ae60";
            case CANCELLED       -> "#e74c3c";
            default              -> "#555";
        };
        return """
            <html><body style="font-family:sans-serif;background:#f4f4f4;padding:30px;margin:0;">
              <div style="max-width:520px;margin:auto;background:#fff;border-radius:16px;
                          box-shadow:0 4px 20px rgba(0,0,0,0.08);overflow:hidden;">
                <div style="background:%s;padding:28px;text-align:center;">
                  <div style="font-size:40px;">%s</div>
                  <h1 style="color:#fff;margin:8px 0 0;font-size:20px;">Order %s</h1>
                </div>
                <div style="padding:28px 32px;">
                  <p style="color:#333;font-size:16px;">Hi <strong>%s</strong>,</p>
                  <p style="color:#555;">Your order <strong>#%s</strong> status has been updated to <strong>%s</strong>.</p>
                  %s
                  <p style="color:#aaa;font-size:12px;margin-top:24px;">%s · Hyderabad</p>
                </div>
              </div>
            </body></html>
            """.formatted(
                color, emoji, statusLabel,
                order.getUser().getName(),
                order.getOrderNumber(),
                statusLabel,
                order.getAdminNotes() != null && !order.getAdminNotes().isBlank()
                    ? "<div style='background:#f8f8f8;border-radius:8px;padding:12px;margin-top:16px;'>" +
                      "<p style='color:#555;font-size:13px;margin:0;'><strong>Note from us:</strong> " +
                      order.getAdminNotes() + "</p></div>"
                    : "",
                appName
            );
    }

    // ─── Helper: Build Items Table ────────────────────────────────────────────

    private String buildItemsTable(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        sb.append("<table style='width:100%;border-collapse:collapse;font-size:14px;'>");
        sb.append("<tr style='background:#f0f0f0;'>");
        sb.append("<th style='text-align:left;padding:8px 10px;color:#555;font-weight:600;'>Item</th>");
        sb.append("<th style='text-align:center;padding:8px 10px;color:#555;font-weight:600;'>Qty</th>");
        sb.append("<th style='text-align:right;padding:8px 10px;color:#555;font-weight:600;'>Price</th>");
        sb.append("</tr>");

        for (OrderItem item : order.getItems()) {
            String productName = item.getProduct() != null ? item.getProduct().getName() : "Item";
            String unit        = item.getProduct() != null && item.getProduct().getUnit() != null
                                 ? item.getProduct().getUnit() : "";
            sb.append("<tr style='border-bottom:1px solid #f0f0f0;'>");
            sb.append("<td style='padding:8px 10px;color:#333;'>🌸 ").append(productName).append("</td>");
            sb.append("<td style='padding:8px 10px;text-align:center;color:#555;'>")
              .append(item.getQuantity()).append(" ").append(unit).append("</td>");
            sb.append("<td style='padding:8px 10px;text-align:right;color:#1a8c4e;font-weight:600;'>₹")
              .append(item.getLineTotal()).append("</td>");
            sb.append("</tr>");
        }
        sb.append("</table>");
        return sb.toString();
    }
}