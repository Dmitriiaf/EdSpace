package com.example.demo.controller;

import com.example.demo.entity.Tutor;
import com.example.demo.service.TutorService;
import com.example.demo.service.EmailService;
import com.example.demo.config.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru"
}, allowCredentials = "true")
public class AuthController {

    @Autowired
    private TutorService tutorService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            Tutor tutor = tutorService.registerTutor(
                    request.get("email"),
                    request.get("password"),
                    request.get("fullName"),
                    request.get("phone")
            );

            String token = jwtUtils.generateToken(tutor.getEmail(), tutor.getId(), "ROLE_TUTOR");

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "id", tutor.getId(),
                    "email", tutor.getEmail(),
                    "fullName", tutor.getFullName(),
                    "role", "tutor"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            Tutor tutor = tutorService.login(
                    request.get("email"),
                    request.get("password")
            );

            String token = jwtUtils.generateToken(tutor.getEmail(), tutor.getId(), "ROLE_TUTOR");

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "id", tutor.getId(),
                    "email", tutor.getEmail(),
                    "fullName", tutor.getFullName(),
                    "role", "tutor"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Запрос на восстановление пароля
     * Отправляет письмо со ссылкой для сброса пароля
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email не указан"));
        }

        try {
            // Проверить, существует ли пользователь
            Tutor tutor = tutorService.findByEmail(email);
            if (tutor == null) {
                // По соображениям безопасности не говорим, что пользователь не найден
                return ResponseEntity.ok(Map.of("message", "Если email зарегистрирован, инструкция отправлена на почту"));
            }

            // Сгенерировать токен для сброса пароля
            String resetToken = UUID.randomUUID().toString();
            tutorService.saveResetToken(email, resetToken);

            // ✅ Используем ПРАВИЛЬНЫЙ метод из EmailService
            emailService.sendPasswordResetEmail(email, tutor.getFullName(), resetToken);

            return ResponseEntity.ok(Map.of("message", "Инструкция отправлена на email"));

        } catch (Exception e) {
            // Логируем ошибку, но не раскрываем детали клиенту
            System.err.println("Ошибка отправки письма для восстановления пароля: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Не удалось отправить письмо. Попробуйте позже."));
        }
    }

    /**
     * Сброс пароля по токену
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");

        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Токен не указан"));
        }

        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Новый пароль не указан"));
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Пароль должен быть не менее 6 символов"));
        }

        try {
            boolean success = tutorService.resetPassword(token, newPassword);

            if (success) {
                return ResponseEntity.ok(Map.of("message", "Пароль успешно изменён"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Недействительный или истёкший токен"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Ошибка при смене пароля"));
        }
    }

    /**
     * Проверка валидности токена сброса пароля
     */
    @GetMapping("/validate-reset-token")
    public ResponseEntity<?> validateResetToken(@RequestParam String token) {
        try {
            boolean isValid = tutorService.isValidResetToken(token);
            return ResponseEntity.ok(Map.of("valid", isValid));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("valid", false));
        }
    }
}