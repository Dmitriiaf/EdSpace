package com.example.demo.controller;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.demo.entity.Tutor;
import com.example.demo.entity.Student;
import com.example.demo.entity.Parent;
import com.example.demo.service.TutorService;
import com.example.demo.service.EmailService;
import com.example.demo.config.JwtUtils;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.ParentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class AuthController {

    @Autowired
    private TutorService tutorService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ParentRepository parentRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            Tutor tutor = tutorService.registerTutor(
                    request.get("email"),
                    request.get("password"),
                    request.get("fullName"),
                    request.get("phone"),
                    request.getOrDefault("timezone", "Asia/Krasnoyarsk")
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

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email не указан"));
        }

        try {
            String resetToken = UUID.randomUUID().toString();
            String userName = email;
            boolean found = false;

            // 1. Ищем репетитора
            Tutor tutor = tutorService.findByEmail(email);
            if (tutor != null) {
                tutorService.saveResetToken(email, resetToken);
                userName = tutor.getFullName();
                found = true;
                log.info("✅ Найден репетитор: {}", email);
            }

            // 2. Ищем ученика
            if (!found) {
                Optional<Student> studentOpt = studentRepository.findByEmail(email)
                        .stream().findFirst();
                if (studentOpt.isPresent()) {
                    Student student = studentOpt.get();
                    student.setResetToken(resetToken);
                    student.setResetTokenExpiry(java.time.LocalDateTime.now().plusHours(24));
                    studentRepository.save(student);
                    userName = student.getFullName();
                    found = true;
                    log.info("✅ Найден ученик: {}", email);
                }
            }

            // 3. Ищем родителя
            if (!found) {
                Optional<Parent> parentOpt = parentRepository.findByEmail(email);
                if (parentOpt.isPresent()) {
                    Parent parent = parentOpt.get();
                    parent.setResetToken(resetToken);
                    parent.setResetTokenExpiry(java.time.LocalDateTime.now().plusHours(24));
                    parentRepository.save(parent);
                    userName = parent.getFullName();
                    found = true;
                    log.info("✅ Найден родитель: {}", email);
                }
            }

            if (found) {
                emailService.sendPasswordResetEmail(email, userName, resetToken);
                log.info("📧 Письмо восстановления отправлено: {}", email);
            } else {
                log.warn("⚠️ Email не найден ни в одной таблице: {}", email);
            }

            return ResponseEntity.ok(Map.of("message", "Если email зарегистрирован, инструкция отправлена на почту"));

        } catch (Exception e) {
            log.error("Ошибка отправки письма для восстановления пароля: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Не удалось отправить письмо. Попробуйте позже."));
        }
    }

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
            boolean success = false;

            // 1. Пробуем сбросить для репетитора
            success = tutorService.resetPassword(token, newPassword);

            // 2. Пробуем для ученика
            if (!success) {
                Optional<Student> studentOpt = studentRepository.findByResetToken(token);
                if (studentOpt.isPresent()) {
                    Student student = studentOpt.get();
                    if (student.getResetTokenExpiry() != null &&
                            student.getResetTokenExpiry().isAfter(java.time.LocalDateTime.now())) {
                        student.setPasswordHash(passwordEncoder.encode(newPassword));
                        student.setResetToken(null);
                        student.setResetTokenExpiry(null);
                        studentRepository.save(student);
                        success = true;
                    }
                }
            }

            // 3. Пробуем для родителя
            if (!success) {
                Optional<Parent> parentOpt = parentRepository.findByResetToken(token);
                if (parentOpt.isPresent()) {
                    Parent parent = parentOpt.get();
                    if (parent.getResetTokenExpiry() != null &&
                            parent.getResetTokenExpiry().isAfter(java.time.LocalDateTime.now())) {
                        parent.setPasswordHash(passwordEncoder.encode(newPassword));
                        parent.setResetToken(null);
                        parent.setResetTokenExpiry(null);
                        parentRepository.save(parent);
                        success = true;
                    }
                }
            }

            if (success) {
                return ResponseEntity.ok(Map.of("message", "Пароль успешно изменён"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Недействительный или истёкший токен"));
            }
        } catch (Exception e) {
            log.error("Ошибка при смене пароля: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Ошибка при смене пароля"));
        }
    }

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