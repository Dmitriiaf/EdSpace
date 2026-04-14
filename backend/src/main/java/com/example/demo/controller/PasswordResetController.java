package com.example.demo.controller;

import com.example.demo.entity.PasswordResetToken;
import com.example.demo.entity.Tutor;
import com.example.demo.entity.Student;
import com.example.demo.entity.Parent;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.ParentRepository;
import com.example.demo.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetTokenRepository tokenRepository;
    private final TutorRepository tutorRepository;
    private final StudentRepository studentRepository;
    private final ParentRepository parentRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/request")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String userType = null;
        String userName = null;

        if (tutorRepository.findByEmail(email).isPresent()) {
            userType = "TUTOR";
            userName = tutorRepository.findByEmail(email).get().getFullName();
        } else if (!studentRepository.findByEmail(email).isEmpty()) {
            userType = "STUDENT";
            userName = studentRepository.findByEmail(email).get(0).getFullName();
        } else if (parentRepository.findByEmail(email).isPresent()) {
            userType = "PARENT";
            userName = parentRepository.findByEmail(email).get().getFullName();
        }

        if (userType == null) {
            return ResponseEntity.ok(Map.of("message", "Если email зарегистрирован, инструкция отправлена"));
        }

        tokenRepository.findByEmailAndUsedFalse(email).ifPresent(tokenRepository::delete);

        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        token.setUserType(userType);
        tokenRepository.save(token);

        try {
            emailService.sendPasswordResetEmail(token, userName);
            log.info("📧 Письмо для сброса пароля отправлено на {}", email);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Не удалось отправить письмо"));
        }

        return ResponseEntity.ok(Map.of("message", "Инструкция по сбросу пароля отправлена на email"));
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Токен не найден"));
        if (resetToken.getUsed()) return ResponseEntity.badRequest().body(Map.of("error", "Токен уже использован"));
        if (resetToken.isExpired()) return ResponseEntity.badRequest().body(Map.of("error", "Срок действия токена истёк"));
        return ResponseEntity.ok(Map.of("email", resetToken.getEmail(), "userType", resetToken.getUserType()));
    }

    @PostMapping("/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.length() < 6) return ResponseEntity.badRequest().body(Map.of("error", "Пароль должен быть не менее 6 символов"));

        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Токен не найден"));
        if (resetToken.getUsed()) return ResponseEntity.badRequest().body(Map.of("error", "Токен уже использован"));
        if (resetToken.isExpired()) return ResponseEntity.badRequest().body(Map.of("error", "Срок действия токена истёк"));

        String encodedPassword = passwordEncoder.encode(newPassword);
        String email = resetToken.getEmail();

        switch (resetToken.getUserType()) {
            case "TUTOR" -> tutorRepository.findByEmail(email).ifPresent(t -> { t.setPasswordHash(encodedPassword); tutorRepository.save(t); });
            case "STUDENT" -> { Student s = studentRepository.findByEmail(email).get(0); s.setPasswordHash(encodedPassword); studentRepository.save(s); }
            case "PARENT" -> parentRepository.findByEmail(email).ifPresent(p -> { p.setPasswordHash(encodedPassword); parentRepository.save(p); });
        }

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        log.info("✅ Пароль изменён для {}", email);
        return ResponseEntity.ok(Map.of("message", "Пароль успешно изменён!"));
    }
}