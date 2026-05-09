// ========== InvitationController.java ==========
package com.example.demo.controller;

import com.example.demo.entity.InvitationToken;
import com.example.demo.entity.Student;
import com.example.demo.entity.Parent;
import com.example.demo.repository.InvitationTokenRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.ParentRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.time.LocalDateTime;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final NotificationService notificationService;


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

            String tutorName = "Репетитор";
            if (invitation.getTutorId() != null) {
                tutorName = tutorRepository.findById(invitation.getTutorId())
                        .map(t -> t.getFullName())
                        .orElse("Репетитор");
            }

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
     * Сгенерировать пригласительную ссылку (без email)
     */
    @PostMapping("/generate")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> generateInviteLink(@RequestAttribute("userId") Long tutorId) {
        InvitationToken token = new InvitationToken();
        token.setToken(UUID.randomUUID().toString());
        token.setTutorId(tutorId);
        token.setUserType("STUDENT");
        token.setEmail("pending");
        token.setCreatedAt(LocalDateTime.now());
        token.setExpiresAt(LocalDateTime.now().plusDays(7));

        tokenRepository.save(token);

        String link = "https://ed-space.ru/complete-registration?token=" + token.getToken();
        return ResponseEntity.ok(Map.of("link", link));
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

        String email = request.get("email");
        String fullName = request.get("fullName");

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email обязателен"));
        }
        if (fullName == null || fullName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Имя обязательно"));
        }

        // Ищем или создаём ученика
        final String studentEmail = email;
        Student student = studentRepository.findByEmail(studentEmail)
                .stream().findFirst()
                .orElseGet(() -> {
                    Student newStudent = new Student();
                    newStudent.setEmail(studentEmail);
                    newStudent.setFullName(fullName);
                    newStudent.setRole("ROLE_STUDENT");
                    return newStudent;
                });

        // Обновляем данные
        if (fullName != null && !fullName.isEmpty()) {
            student.setFullName(fullName);
        }
        if (phone != null && !phone.isEmpty()) {
            student.setPhone(phone);
        }
        if (birthday != null && !birthday.isEmpty()) {
            student.setBirthday(LocalDate.parse(birthday));
        }
        student.setPasswordHash(passwordEncoder.encode(password));
        student.setRegistrationCompleted(true);

        studentRepository.save(student);

        // Уведомление репетитору о регистрации
        try {
            notificationService.createTutorNotification(
                    invitation.getTutorId(),
                    "🎉 Ученик " + student.getFullName() + " зарегистрировался по вашей ссылке"
            );
        } catch (Exception e) {
            log.warn("Не удалось создать уведомление о регистрации: {}", e.getMessage());
        }

        // Привязываем ученика к репетитору
        if (invitation.getTutorId() != null) {
            if (!studentRepository.existsStudentTutor(student.getId(), invitation.getTutorId())) {
                studentRepository.linkStudentToTutor(student.getId(), invitation.getTutorId());
                log.info("✅ Ученик {} привязан к репетитору {}", student.getEmail(), invitation.getTutorId());
            }
        }

        // Обновляем приглашение
        invitation.setEmail(email);
        invitation.setStudentName(fullName);
        invitation.setStudentId(student.getId());
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

        if (invitation.getStudentId() != null) {
            studentRepository.findById(invitation.getStudentId()).ifPresent(student -> {
                student.setParent(savedParent);
                studentRepository.save(student);
                log.info("✅ Родитель {} привязан к ученику {}", savedParent.getEmail(), student.getFullName());
            });
        }

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