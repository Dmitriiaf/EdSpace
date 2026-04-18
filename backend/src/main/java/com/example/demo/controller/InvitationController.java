package com.example.demo.controller;

import com.example.demo.entity.InvitationToken;
import com.example.demo.entity.Student;
import com.example.demo.entity.Parent;
import com.example.demo.repository.InvitationTokenRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.ParentRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationTokenRepository tokenRepository;
    private final StudentRepository studentRepository;
    private final ParentRepository parentRepository;
    private final TutorRepository tutorRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /**
     * Проверить токен приглашения
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        try {
            InvitationToken invitation = tokenRepository.findByToken(token)
                    .orElseThrow(() -> new RuntimeException("Токен не найден"));

            if (Boolean.TRUE.equals(invitation.getUsed())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Приглашение уже использовано"));
            }

            if (invitation.isExpired()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Срок действия приглашения истёк"));
            }

            // ✅ Безопасное получение имени репетитора
            String tutorName = "Репетитор";
            if (invitation.getTutorId() != null) {
                tutorName = tutorRepository.findById(invitation.getTutorId())
                        .map(t -> t.getFullName())
                        .orElse("Репетитор");
            }

            // ✅ Безопасное получение имени ученика
            String studentName = invitation.getStudentName();
            if (studentName == null) {
                studentName = "Ученик";
            }

            return ResponseEntity.ok(Map.of(
                    "email", invitation.getEmail() != null ? invitation.getEmail() : "",
                    "userType", invitation.getUserType() != null ? invitation.getUserType() : "STUDENT",
                    "studentName", studentName,
                    "tutorName", tutorName
            ));
        } catch (Exception e) {
            log.error("Ошибка валидации токена: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", "Недействительный токен"));
        }
    }

    /**
     * Завершить регистрацию ученика
     */
    @PostMapping("/complete-student")
    public ResponseEntity<?> completeStudentRegistration(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String phone = request.get("phone");
        String birthday = request.get("birthday");
        String password = request.get("password");

        if (password == null || password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Пароль должен быть не менее 6 символов"));
        }

        InvitationToken invitation = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Токен не найден"));

        if (invitation.getUsed()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Приглашение уже использовано"));
        }

        if (invitation.isExpired()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Срок действия приглашения истёк"));
        }

        // Находим ученика по email
        Student student = studentRepository.findByEmail(invitation.getEmail())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        // Обновляем данные ученика
        if (phone != null && !phone.isEmpty()) {
            student.setPhone(phone);
        }
        if (birthday != null && !birthday.isEmpty()) {
            student.setBirthday(LocalDate.parse(birthday));
        }
        student.setPasswordHash(passwordEncoder.encode(password));
        student.setRegistrationCompleted(true);

        studentRepository.save(student);

        // Отмечаем токен как использованный
        invitation.setUsed(true);
        tokenRepository.save(invitation);

        log.info("✅ Ученик {} завершил регистрацию", student.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "Регистрация успешно завершена! Теперь вы можете войти в систему.",
                "email", student.getEmail()
        ));
    }

    /**
     * Завершить регистрацию родителя
     */
    @PostMapping("/complete-parent")
    public ResponseEntity<?> completeParentRegistration(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String fullName = request.get("fullName");
        String phone = request.get("phone");
        String password = request.get("password");

        if (fullName == null || fullName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ФИО обязательно"));
        }

        if (password == null || password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Пароль должен быть не менее 6 символов"));
        }

        InvitationToken invitation = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Токен не найден"));

        if (invitation.getUsed()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Приглашение уже использовано"));
        }

        if (invitation.isExpired()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Срок действия приглашения истёк"));
        }

        // Находим или создаём родителя
        Parent parent = parentRepository.findByEmail(invitation.getEmail())
                .orElseGet(() -> {
                    Parent newParent = new Parent();
                    newParent.setEmail(invitation.getEmail());
                    newParent.setRole("ROLE_PARENT");
                    return newParent;
                });

        parent.setFullName(fullName);
        if (phone != null && !phone.isEmpty()) {
            parent.setPhone(phone);
        }
        parent.setPasswordHash(passwordEncoder.encode(password));
        parent.setRegistrationCompleted(true);

        Parent savedParent = parentRepository.save(parent);

        // Привязываем родителя к ученику
        if (invitation.getStudentId() != null) {
            studentRepository.findById(invitation.getStudentId()).ifPresent(student -> {
                student.setParent(savedParent);
                studentRepository.save(student);
                log.info("✅ Родитель {} привязан к ученику {}", savedParent.getEmail(), student.getFullName());
            });
        }

        // Отмечаем токен как использованный
        invitation.setUsed(true);
        tokenRepository.save(invitation);

        log.info("✅ Родитель {} завершил регистрацию", savedParent.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "Регистрация успешно завершена! Теперь вы можете войти в систему.",
                "email", savedParent.getEmail()
        ));
    }

    /**
     * Повторно отправить приглашение
     */
    @PostMapping("/resend")
    public ResponseEntity<?> resendInvitation(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String userType = request.get("userType");

        InvitationToken existingToken = tokenRepository
                .findByEmailAndUserTypeAndUsedFalse(email, userType)
                .orElse(null);

        if (existingToken != null && !existingToken.isExpired()) {
            if ("STUDENT".equals(userType)) {
                String tutorName = tutorRepository.findById(existingToken.getTutorId())
                        .map(t -> t.getFullName())
                        .orElse("Репетитор");
                emailService.sendStudentInvitation(existingToken, existingToken.getStudentName(), tutorName);
            } else if ("PARENT".equals(userType)) {
                String tutorName = tutorRepository.findById(existingToken.getTutorId())
                        .map(t -> t.getFullName())
                        .orElse("Репетитор");
                emailService.sendParentInvitation(existingToken, existingToken.getStudentName(), tutorName);
            }
            return ResponseEntity.ok(Map.of("message", "Приглашение отправлено повторно"));
        }

        return ResponseEntity.badRequest().body(Map.of("error", "Не удалось отправить приглашение"));
    }
}