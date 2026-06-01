// ========== InvitationController.java (ПОЛНАЯ ЗАМЕНА) ==========
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
                        .map(t -> t.getFullName()).orElse("Репетитор");
            }
            String studentName = invitation.getStudentName() != null ? invitation.getStudentName() : "Ученик";
            return ResponseEntity.ok(Map.of(
                    "email", invitation.getEmail() != null ? invitation.getEmail() : "",
                    "userType", invitation.getUserType() != null ? invitation.getUserType() : "STUDENT",
                    "studentName", studentName, "tutorName", tutorName
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Недействительный токен"));
        }
    }

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
     * Шаг 1: Отправить код подтверждения на email ученика
     */
    @PostMapping("/send-verification-code")
    public ResponseEntity<?> sendVerificationCode(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String email = request.get("email");
        String fullName = request.get("fullName");

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email обязателен"));
        }
        if (fullName == null || fullName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Имя обязательно"));
        }

        InvitationToken invitation = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Токен не найден"));

        if (Boolean.TRUE.equals(invitation.getUsed())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Приглашение уже использовано"));
        }
        if (invitation.isExpired()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Срок действия приглашения истёк"));
        }

        // Проверяем, не занят ли email
        if (studentRepository.findByEmail(email).stream().findFirst().isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Этот email уже зарегистрирован как ученик"));
        }
        if (parentRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Этот email уже зарегистрирован как родитель"));
        }
        if (tutorRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Этот email уже зарегистрирован как репетитор"));
        }

        // Генерируем код
        String code = String.format("%06d", (int)(Math.random() * 1000000));
        invitation.setEmail(email);
        invitation.setStudentName(fullName);
        invitation.setVerificationCode(code);
        invitation.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
        tokenRepository.save(invitation);

        emailService.sendVerificationCode(email, fullName, code);
        log.info("📧 Код подтверждения отправлен ученику {}", email);

        return ResponseEntity.ok(Map.of(
                "message", "Код подтверждения отправлен на email",
                "email", email, "requiresVerification", true
        ));
    }

    /**
     * Шаг 2: Подтвердить код и завершить регистрацию
     */
    @PostMapping("/verify-and-complete")
    public ResponseEntity<?> verifyAndComplete(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String code = request.get("code");
        String phone = request.get("phone");
        String birthday = request.get("birthday");
        String password = request.get("password");

        if (password == null || password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Пароль должен быть не менее 6 символов"));
        }

        InvitationToken invitation = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Токен не найден"));

        if (Boolean.TRUE.equals(invitation.getUsed())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Приглашение уже использовано"));
        }
        if (invitation.isExpired()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Срок действия приглашения истёк"));
        }
        if (invitation.getVerificationCode() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Код не был запрошен"));
        }
        if (invitation.getVerificationCodeExpiry() != null &&
                invitation.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Код истёк. Запросите новый."));
        }
        if (!code.equals(invitation.getVerificationCode())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Неверный код"));
        }

        String email = invitation.getEmail();
        String fullName = invitation.getStudentName();

        Student student = new Student();
        student.setEmail(email);
        student.setFullName(fullName);
        student.setRole("ROLE_STUDENT");
        if (phone != null && !phone.isEmpty()) student.setPhone(phone);
        if (birthday != null && !birthday.isEmpty()) student.setBirthday(LocalDate.parse(birthday));
        student.setPasswordHash(passwordEncoder.encode(password));
        student.setRegistrationCompleted(true);
        studentRepository.save(student);

        if (invitation.getTutorId() != null) {
            if (!studentRepository.existsStudentTutor(student.getId(), invitation.getTutorId())) {
                studentRepository.linkStudentToTutor(student.getId(), invitation.getTutorId());
                log.info("✅ Ученик {} привязан к репетитору {}", student.getEmail(), invitation.getTutorId());
            }
        }

        try {
            notificationService.createTutorNotification(
                    invitation.getTutorId(),
                    "🎉 Ученик " + student.getFullName() + " зарегистрировался по вашей ссылке"
            );
        } catch (Exception e) {
            log.warn("Не удалось создать уведомление: {}", e.getMessage());
        }

        invitation.setStudentId(student.getId());
        invitation.setUsed(true);
        invitation.setVerificationCode(null);
        invitation.setVerificationCodeExpiry(null);
        tokenRepository.save(invitation);

        log.info("✅ Ученик {} завершил регистрацию с подтверждением email", student.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "Регистрация успешно завершена!",
                "email", student.getEmail()
        ));
    }

    @PostMapping("/complete-student")
    public ResponseEntity<?> completeStudentRegistration(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String phone = request.get("phone");
        String birthday = request.get("birthday");
        String password = request.get("password");
        if (password == null || password.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("error", "Пароль должен быть не менее 6 символов"));
        InvitationToken invitation = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Токен не найден"));
        if (invitation.getUsed()) return ResponseEntity.badRequest().body(Map.of("error", "Приглашение уже использовано"));
        if (invitation.isExpired()) return ResponseEntity.badRequest().body(Map.of("error", "Срок действия приглашения истёк"));
        String email = request.get("email");
        String fullName = request.get("fullName");
        if (email == null || email.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Email обязателен"));
        if (fullName == null || fullName.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Имя обязательно"));
        final String se = email;
        Student student = studentRepository.findByEmail(se).stream().findFirst().orElseGet(() -> {
            Student ns = new Student(); ns.setEmail(se); ns.setFullName(fullName); ns.setRole("ROLE_STUDENT"); return ns;
        });
        student.setFullName(fullName);
        if (phone != null && !phone.isEmpty()) student.setPhone(phone);
        if (birthday != null && !birthday.isEmpty()) student.setBirthday(LocalDate.parse(birthday));
        student.setPasswordHash(passwordEncoder.encode(password));
        student.setRegistrationCompleted(true);
        studentRepository.save(student);
        try { notificationService.createTutorNotification(invitation.getTutorId(), "🎉 Ученик " + student.getFullName() + " зарегистрировался по вашей ссылке"); } catch (Exception e) {}
        if (invitation.getTutorId() != null && !studentRepository.existsStudentTutor(student.getId(), invitation.getTutorId()))
            studentRepository.linkStudentToTutor(student.getId(), invitation.getTutorId());
        invitation.setEmail(email); invitation.setStudentName(fullName); invitation.setStudentId(student.getId()); invitation.setUsed(true);
        tokenRepository.save(invitation);
        return ResponseEntity.ok(Map.of("message", "Регистрация успешно завершена!", "email", student.getEmail()));
    }

    @PostMapping("/complete-parent")
    public ResponseEntity<?> completeParentRegistration(@RequestBody Map<String, String> request) {
        String token = request.get("token"); String fullName = request.get("fullName"); String phone = request.get("phone"); String password = request.get("password");
        if (fullName == null || fullName.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "ФИО обязательно"));
        if (password == null || password.length() < 6) return ResponseEntity.badRequest().body(Map.of("error", "Пароль должен быть не менее 6 символов"));
        InvitationToken invitation = tokenRepository.findByToken(token).orElseThrow(() -> new RuntimeException("Токен не найден"));
        if (invitation.getUsed()) return ResponseEntity.badRequest().body(Map.of("error", "Приглашение уже использовано"));
        if (invitation.isExpired()) return ResponseEntity.badRequest().body(Map.of("error", "Срок действия приглашения истёк"));
        Parent parent = parentRepository.findByEmail(invitation.getEmail()).orElseGet(() -> { Parent np = new Parent(); np.setEmail(invitation.getEmail()); np.setRole("ROLE_PARENT"); return np; });
        parent.setFullName(fullName); if (phone != null && !phone.isEmpty()) parent.setPhone(phone);
        parent.setPasswordHash(passwordEncoder.encode(password)); parent.setRegistrationCompleted(true);
        Parent sp = parentRepository.save(parent);
        if (invitation.getStudentId() != null) studentRepository.findById(invitation.getStudentId()).ifPresent(s -> { s.setParent(sp); studentRepository.save(s); });
        invitation.setUsed(true); tokenRepository.save(invitation);
        return ResponseEntity.ok(Map.of("message", "Регистрация успешно завершена!", "email", sp.getEmail()));
    }

    @PostMapping("/resend")
    public ResponseEntity<?> resendInvitation(@RequestBody Map<String, String> request) {
        String email = request.get("email"); String userType = request.get("userType");
        InvitationToken et = tokenRepository.findByEmailAndUserTypeAndUsedFalse(email, userType).orElse(null);
        if (et != null && !et.isExpired()) {
            String tn = tutorRepository.findById(et.getTutorId()).map(t -> t.getFullName()).orElse("Репетитор");
            if ("STUDENT".equals(userType)) emailService.sendStudentInvitation(et, et.getStudentName(), tn);
            else emailService.sendParentInvitation(et, et.getStudentName(), tn);
            return ResponseEntity.ok(Map.of("message", "Приглашение отправлено повторно"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Не удалось отправить приглашение"));
    }
}