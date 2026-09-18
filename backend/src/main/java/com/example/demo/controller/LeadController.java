package com.example.demo.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.internet.MimeMessage;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
public class LeadController {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mailFrom;

    @Value("${app.admin-email:d.atrochhenko@mail.ru}")
    private String adminEmail;

    @PostMapping("/student")
    public ResponseEntity<?> submitStudentLead(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String phone = body.get("phone");
        String subject = body.get("subject");
        String className = body.get("className");
        String tariff = body.get("tariff");

        String emailContent = String.format("""
            📚 НОВАЯ ЗАЯВКА НА ОБУЧЕНИЕ
            
            👤 Имя: %s
            📞 Телефон: %s
            📖 Предмет: %s
            🏫 Класс: %s
            💰 Тариф: %s
            
            Отправлено с лендинга EdSpace
            """, name, phone, subject, className, tariff);

        sendEmail(adminEmail, "📚 Новая заявка на обучение", emailContent);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Заявка отправлена"));
    }

    @PostMapping("/tutor")
    public ResponseEntity<?> submitTutorLead(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String phone = body.get("phone");
        String subject = body.get("subject");
        String experience = body.get("experience");

        String emailContent = String.format("""
            👨‍🏫 НОВАЯ ЗАЯВКА ОТ РЕПЕТИТОРА
            
            👤 Имя: %s
            📞 Телефон: %s
            📖 Предмет: %s
            💼 Опыт: %s
            
            Отправлено с лендинга EdSpace
            """, name, phone, subject, experience);

        sendEmail(adminEmail, "👨‍🏫 Новая заявка от репетитора", emailContent);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Заявка отправлена"));
    }

    private void sendEmail(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content);
            mailSender.send(message);
            log.info("✅ Заявка отправлена на {}", to);
        } catch (Exception e) {
            log.error("❌ Ошибка отправки заявки: {}", e.getMessage());
        }
    }
}