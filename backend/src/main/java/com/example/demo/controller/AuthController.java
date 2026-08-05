// ========== backend/src/main/java/com/example/demo/controller/AuthController.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
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

import java.time.LocalDateTime;
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

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

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
            String email = request.get("email");

            // ✅ Проверяем, что email не занят ни в одной из таблиц
            if (tutorService.findByEmail(email) != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Этот email уже зарегистрирован как репетитор"));
            }
            if (studentRepository.findByEmail(email).stream().findFirst().isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Этот email уже зарегистрирован как ученик"));
            }
            if (parentRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Этот email уже зарегистрирован как родитель"));
            }

            Tutor tutor = tutorService.registerTutor(
                    email,
                    request.get("password"),
                    request.get("fullName"),
                    request.get("phone"),
                    request.getOrDefault("timezone", "Asia/Krasnoyarsk")
            );

            // Генерируем код подтверждения
            String code = String.format("%06d", (int)(Math.random() * 1000000));
            tutor.setVerificationCode(code);
            tutor.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
            tutor.setEmailVerified(false);
            tutorService.save(tutor);

            // Отправляем код на email
            emailService.sendVerificationCode(tutor.getEmail(), tutor.getFullName(), code);

            log.info("📧 Код подтверждения отправлен для {}", tutor.getEmail());

            // Обработка реферального кода
            String refCode = request.get("ref");
            if (refCode != null && !refCode.isEmpty()) {
                Tutor referrer = tutorService.findByReferralCode(refCode);
                if (referrer != null) {
                    tutor.setReferredBy(referrer.getId());
                    tutorService.save(tutor);
                }
            }

            // НЕ ВЫДАЁМ ТОКЕН — аккаунт не подтверждён
            return ResponseEntity.ok(Map.of(
                    "message", "Код подтверждения отправлен на email",
                    "email", tutor.getEmail(),
                    "requiresVerification", true
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        try {
            // Проверяем всех: tutor, student, parent
            Object[] userResult = findUserByEmail(email);
            if (userResult == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Неверный email или пароль"));
            }

            String userType = (String) userResult[0];
            Object user = userResult[1];

            // Проверка блокировки
            if (userType.equals("tutor")) {
                Tutor tutor = (Tutor) user;
                if (tutor.isLocked()) {
                    long remainingMinutes = java.time.Duration.between(LocalDateTime.now(), tutor.getLockedUntil()).toMinutes();
                    return ResponseEntity.status(423).body(Map.of(
                            "error", "Аккаунт заблокирован. Попробуйте через " + remainingMinutes + " мин.",
                            "lockedUntil", tutor.getLockedUntil().toString()
                    ));
                }
            } else if (userType.equals("student")) {
                Student student = (Student) user;
                if (student.isLocked()) {
                    long remainingMinutes = java.time.Duration.between(LocalDateTime.now(), student.getLockedUntil()).toMinutes();
                    return ResponseEntity.status(423).body(Map.of(
                            "error", "Аккаунт заблокирован. Попробуйте через " + remainingMinutes + " мин.",
                            "lockedUntil", student.getLockedUntil().toString()
                    ));
                }
            } else if (userType.equals("parent")) {
                Parent parent = (Parent) user;
                if (parent.isLocked()) {
                    long remainingMinutes = java.time.Duration.between(LocalDateTime.now(), parent.getLockedUntil()).toMinutes();
                    return ResponseEntity.status(423).body(Map.of(
                            "error", "Аккаунт заблокирован. Попробуйте через " + remainingMinutes + " мин.",
                            "lockedUntil", parent.getLockedUntil().toString()
                    ));
                }
            }

            // Проверка пароля
            boolean passwordValid = false;
            if (userType.equals("tutor")) {
                passwordValid = passwordEncoder.matches(password, ((Tutor) user).getPasswordHash());
            } else if (userType.equals("student")) {
                passwordValid = passwordEncoder.matches(password, ((Student) user).getPasswordHash());
            } else if (userType.equals("parent")) {
                passwordValid = passwordEncoder.matches(password, ((Parent) user).getPasswordHash());
            }

            if (!passwordValid) {
                // Увеличиваем счётчик неудачных попыток
                if (userType.equals("tutor")) {
                    Tutor tutor = (Tutor) user;
                    tutor.incrementFailedAttempts();
                    if (tutor.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                        tutor.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
                        log.warn("🔒 Репетитор {} заблокирован на {} минут", email, LOCK_DURATION_MINUTES);
                    }
                    tutorService.save(tutor);
                } else if (userType.equals("student")) {
                    Student student = (Student) user;
                    student.incrementFailedAttempts();
                    if (student.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                        student.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
                        log.warn("🔒 Ученик {} заблокирован на {} минут", email, LOCK_DURATION_MINUTES);
                    }
                    studentRepository.save(student);
                } else if (userType.equals("parent")) {
                    Parent parent = (Parent) user;
                    parent.incrementFailedAttempts();
                    if (parent.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                        parent.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
                        log.warn("🔒 Родитель {} заблокирован на {} минут", email, LOCK_DURATION_MINUTES);
                    }
                    parentRepository.save(parent);
                }
                return ResponseEntity.badRequest().body(Map.of("error", "Неверный email или пароль"));
            }

            // Успешный вход — сбрасываем счётчик
            if (userType.equals("tutor")) {
                Tutor tutor = (Tutor) user;
                tutor.resetFailedAttempts();
                tutorService.save(tutor);
                String token = jwtUtils.generateToken(tutor.getEmail(), tutor.getId(), "ROLE_TUTOR", tutor.getFullName());                return ResponseEntity.ok(Map.of(
                        "token", token, "id", tutor.getId(), "email", tutor.getEmail(),
                        "fullName", tutor.getFullName(), "role", "tutor",
                        "referralCode", tutor.getReferralCode()
                ));
            } else if (userType.equals("student")) {
                Student student = (Student) user;
                student.resetFailedAttempts();
                studentRepository.save(student);
                String token = jwtUtils.generateToken(student.getEmail(), student.getId(), "ROLE_STUDENT", student.getFullName());                return ResponseEntity.ok(Map.of(
                        "token", token, "id", student.getId(), "email", student.getEmail(),
                        "fullName", student.getFullName(), "role", "student"
                ));
            } else {
                Parent parent = (Parent) user;
                parent.resetFailedAttempts();
                parentRepository.save(parent);
                String token = jwtUtils.generateToken(parent.getEmail(), parent.getId(), "ROLE_PARENT", parent.getFullName());                return ResponseEntity.ok(Map.of(
                        "token", token, "id", parent.getId(), "email", parent.getEmail(),
                        "fullName", parent.getFullName(), "role", "parent"
                ));
            }

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Ищет пользователя по email во всех трёх таблицах.
     * Возвращает Object[]{тип, объект} или null.
     */
    private Object[] findUserByEmail(String email) {
        // Tutor
        Tutor tutor = tutorService.findByEmail(email);
        if (tutor != null) return new Object[]{"tutor", tutor};

        // Student
        Optional<Student> studentOpt = studentRepository.findByEmail(email).stream().findFirst();
        if (studentOpt.isPresent()) return new Object[]{"student", studentOpt.get()};

        // Parent
        Optional<Parent> parentOpt = parentRepository.findByEmail(email);
        if (parentOpt.isPresent()) return new Object[]{"parent", parentOpt.get()};

        return null;
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email и код обязательны"));
        }

        Tutor tutor = tutorService.findByEmail(email);
        if (tutor == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Пользователь не найден"));
        }

        if (tutor.getEmailVerified()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email уже подтверждён"));
        }

        if (tutor.getVerificationCodeExpiry() != null &&
                tutor.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Код истёк. Запросите новый."));
        }

        if (!code.equals(tutor.getVerificationCode())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Неверный код"));
        }

        // Подтверждаем
        tutor.setEmailVerified(true);
        tutor.setVerificationCode(null);
        tutor.setVerificationCodeExpiry(null);
        tutorService.save(tutor);

        // Выдаём токен
        String token = jwtUtils.generateToken(tutor.getEmail(), tutor.getId(), "ROLE_TUTOR", tutor.getFullName());
        return ResponseEntity.ok(Map.of(
                "message", "Email подтверждён",
                "token", token,
                "id", tutor.getId(),
                "email", tutor.getEmail(),
                "fullName", tutor.getFullName(),
                "role", "tutor",
                "referralCode", tutor.getReferralCode()
        ));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email обязателен"));
        }

        Tutor tutor = tutorService.findByEmail(email);
        if (tutor == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Пользователь не найден"));
        }

        if (tutor.getEmailVerified()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email уже подтверждён"));
        }

        // Генерируем новый код
        String code = String.format("%06d", (int)(Math.random() * 1000000));
        tutor.setVerificationCode(code);
        tutor.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
        tutorService.save(tutor);

        emailService.sendVerificationCode(tutor.getEmail(), tutor.getFullName(), code);

        return ResponseEntity.ok(Map.of("message", "Новый код отправлен"));
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

            Tutor tutor = tutorService.findByEmail(email);
            if (tutor != null) {
                tutorService.saveResetToken(email, resetToken);
                userName = tutor.getFullName();
                found = true;
                log.info("✅ Найден репетитор: {}", email);
            }

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

            success = tutorService.resetPassword(token, newPassword);

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