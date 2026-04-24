package com.flowershop.service;

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

    // ─── Order Confirmation Email ────────────────────────────────────────────

    @Async
    public void sendOrderConfirmationEmail(String toEmail, String customerName, String orderId) {
        String subject = "✅ Order Confirmed — Thank you, " + customerName + "!";
        String body = buildOrderConfirmationHtml(customerName, orderId);
        sendHtmlEmail(toEmail, subject, body);
    }

    // ─── Delivery Notification Email ─────────────────────────────────────────

    @Async
    public void sendDeliveryNotificationEmail(String toEmail, String customerName, String orderId) {
        String subject = "🚚 Your Order Has Been Delivered!";
        String body = buildDeliveryHtml(customerName, orderId);
        sendHtmlEmail(toEmail, subject, body);
    }

    // ─── Generic HTML Email Sender ───────────────────────────────────────────

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML
            mailSender.send(message);
        } catch (MessagingException e) {
            // Log and swallow so async failure doesn't crash main thread
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    // ─── HTML Templates ──────────────────────────────────────────────────────

    private String buildOrderConfirmationHtml(String name, String orderId) {
        return """
            <html><body style="font-family:sans-serif;background:#f4f4f4;padding:40px;">
              <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;
                          padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <h2 style="color:#1a1a2e;">Thank you, %s! 🎉</h2>
                <p style="color:#555;">Your order <strong>#%s</strong> has been confirmed
                   and is being prepared.</p>
                <p style="color:#555;">We'll notify you once it's on its way.</p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                <p style="font-size:12px;color:#aaa;">You received this because you placed
                   an order on our platform.</p>
              </div>
            </body></html>
            """.formatted(name, orderId);
    }

    private String buildDeliveryHtml(String name, String orderId) {
        return """
            <html><body style="font-family:sans-serif;background:#f4f4f4;padding:40px;">
              <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;
                          padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <h2 style="color:#1a1a2e;">Delivered! 📦</h2>
                <p style="color:#555;">Hi <strong>%s</strong>, your order
                   <strong>#%s</strong> has been delivered.</p>
                <p style="color:#555;">We hope you enjoy it. Order again anytime!</p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                <p style="font-size:12px;color:#aaa;">You received this because you placed
                   an order on our platform.</p>
              </div>
            </body></html>
            """.formatted(name, orderId);
    }
}
