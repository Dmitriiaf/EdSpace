package com.example.demo.service;

import com.example.demo.repository.InvitationTokenRepository;
import com.example.demo.entity.InvitationToken;
import com.example.demo.service.EmailService;
import com.example.demo.entity.*;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
public class StudentService {

    @Autowired
    private InvitationTokenRepository invitationTokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private WeeklyTemplateRepository weeklyTemplateRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String generateTempPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public List<Student> getArchivedStudentsByTutor(Long tutorId) {
        return studentRepository.findArchivedByTutorIdWithRates(tutorId);
    }

    @Transactional
    public Student addStudent(String name, String email,
                              BigDecimal ratePerLesson, String paymentType,
                              Long tutorId, String parentEmail) {

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", tutorId));

        List<Student> existingStudents = studentRepository.findByEmail(email);

        Student student;
        boolean isNew = false;

        if (!existingStudents.isEmpty()) {
            student = existingStudents.get(0);

            boolean alreadyHasTutor = student.getTutors().stream()
                    .anyMatch(t -> t.getId().equals(tutorId));

            if (!alreadyHasTutor) {
                student.getTutors().add(tutor);
            }
        } else {
            student = new Student();
            student.setFullName(name);
            student.setEmail(email);
            student.setRole("ROLE_STUDENT");
            student.setRegistrationCompleted(false);
            student.addTutor(tutor);
            isNew = true;
        }

        if (ratePerLesson != null) {
            student.setRateForTutor(tutor, ratePerLesson, paymentType);
        }

        Student savedStudent = studentRepository.save(student);

        // Отправляем приглашение ТОЛЬКО если ученик ещё не зарегистрирован
        if (savedStudent.getPasswordHash() == null) {
            InvitationToken studentToken = new InvitationToken();
            studentToken.setEmail(email);
            studentToken.setUserType("STUDENT");
            studentToken.setStudentId(savedStudent.getId());
            studentToken.setStudentName(name);
            studentToken.setTutorId(tutorId);
            studentToken.setRatePerLesson(ratePerLesson);
            studentToken.setPaymentType(paymentType);
            invitationTokenRepository.save(studentToken);

            try {
                emailService.sendStudentInvitation(studentToken, name, tutor.getFullName());
                log.info("📧 Приглашение отправлено ученику {}", email);
            } catch (Exception e) {
                log.error("Не удалось отправить email ученику: {}", e.getMessage());
            }
        } else {
            log.info("✅ Ученик {} уже зарегистрирован — приглашение не отправляется", email);
        }

        // Если указан email родителя
        if (parentEmail != null && !parentEmail.isEmpty()) {
            Parent parent = parentRepository.findByEmail(parentEmail)
                    .orElseGet(() -> {
                        Parent newParent = new Parent();
                        newParent.setEmail(parentEmail);
                        newParent.setFullName("Родитель " + name);
                        newParent.setRole("ROLE_PARENT");
                        newParent.setRegistrationCompleted(false);
                        return parentRepository.save(newParent);
                    });

            savedStudent.setParent(parent);
            studentRepository.save(savedStudent);

            // Отправляем приглашение ТОЛЬКО если родитель ещё не зарегистрирован
            if (parent.getPasswordHash() == null) {
                InvitationToken parentToken = new InvitationToken();
                parentToken.setEmail(parentEmail);
                parentToken.setUserType("PARENT");
                parentToken.setStudentId(savedStudent.getId());
                parentToken.setStudentName(name);
                parentToken.setTutorId(tutorId);
                invitationTokenRepository.save(parentToken);

                try {
                    emailService.sendParentInvitation(parentToken, name, tutor.getFullName());
                    log.info("📧 Приглашение отправлено родителю {}", parentEmail);
                } catch (Exception e) {
                    log.error("Не удалось отправить email родителю: {}", e.getMessage());
                }
            } else {
                log.info("✅ Родитель {} уже зарегистрирован — приглашение не отправляется", parentEmail);
            }
        }

        return savedStudent;
    }

    public List<Student> getStudentsByTutor(Long tutorId) {
        return studentRepository.findByTutorIdWithRates(tutorId);
    }

    public List<Student> getStudentsByParent(Long parentId) {
        return studentRepository.findByParentIdWithRates(parentId);
    }

    public Student getStudentById(Long id) {
        return studentRepository.findByIdWithRates(id)
                .orElseThrow(() -> new NotFoundException("Ученик", "id", id));
    }

    @Transactional
    public Student updateStudent(Long id, String fullName, String email,
                                 String phone, String parentName, String parentPhone,
                                 String paymentType, BigDecimal ratePerLesson,
                                 String parentEmail, java.time.LocalDate birthday) {
        Student student = getStudentById(id);

        if (fullName != null) student.setFullName(fullName);
        if (email != null) student.setEmail(email);
        if (phone != null) student.setPhone(phone);
        if (parentName != null) student.setParentName(parentName);
        if (parentPhone != null) student.setParentPhone(parentPhone);
        if (birthday != null) student.setBirthday(birthday);

        if (parentEmail != null && !parentEmail.isEmpty()) {
            Parent parent = parentRepository.findByEmail(parentEmail)
                    .orElseGet(() -> {
                        Parent newParent = new Parent(parentName, parentEmail, parentPhone);
                        String parentTempPassword = generateTempPassword();
                        newParent.setPasswordHash(passwordEncoder.encode(parentTempPassword));
                        log.info("🔐 Пароль для родителя {} сгенерирован", parentEmail);
                        return parentRepository.save(newParent);
                    });

            if (parent.getPasswordHash() == null) {
                String parentTempPassword = generateTempPassword();
                parent.setPasswordHash(passwordEncoder.encode(parentTempPassword));
                parentRepository.save(parent);
                log.info("🔐 Пароль для родителя {} установлен", parentEmail);
            }

            student.setParent(parent);
        }

        return studentRepository.save(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = getStudentById(id);

        // 1. Очистить связи с курсами
        student.getCourses().clear();
        studentRepository.save(student);

        // 2. Удалить ставки
        if (student.getRates() != null) {
            student.getRates().clear();
            studentRepository.save(student);
        }

        // 3. Удалить заметки (student_board)
        studentRepository.deleteBoardNotesByStudentId(id);

        // 4. Удалить шаблоны
        List<WeeklyTemplate> templates = weeklyTemplateRepository.findByStudentId(id);
        if (!templates.isEmpty()) {
            weeklyTemplateRepository.deleteAll(templates);
        }

        // 5. Удалить уроки
        List<Lesson> lessons = lessonRepository.findByStudentIdOrderByLessonDateAscStartTimeAsc(id);
        if (!lessons.isEmpty()) {
            lessonRepository.deleteAll(lessons);
        }

        // 6. Удалить платежи
        List<Payment> payments = paymentRepository.findByStudentId(id);
        if (!payments.isEmpty()) {
            paymentRepository.deleteAll(payments);
        }

        // 7. Удалить абонементы
        List<Subscription> subscriptions = subscriptionRepository.findByStudentId(id);
        if (!subscriptions.isEmpty()) {
            subscriptionRepository.deleteAll(subscriptions);
        }

        // 8. Удалить приглашения
        invitationTokenRepository.deleteByStudentId(id);

        // 9. Отвязать родителя
        if (student.getParent() != null) {
            student.setParent(null);
            studentRepository.save(student);
        }

        // 10. Удалить ученика
        studentRepository.delete(student);
    }

    public Parent findOrCreateParent(String email, String studentFullName) {
        Parent parent = parentRepository.findByEmail(email).orElse(null);

        if (parent == null) {
            parent = new Parent();
            parent.setEmail(email);
            parent.setFullName(studentFullName);
            parent.setRole("ROLE_PARENT");
            parent.setCreatedAt(LocalDateTime.now());
            parent = parentRepository.save(parent);
        }

        return parent;
    }

    @Transactional
    public void removeTutorFromStudent(Long studentId, Long tutorId) {
        Student student = getStudentById(studentId);
        student.getTutors().removeIf(t -> t.getId().equals(tutorId));

        if (student.getRates() != null) {
            student.getRates().removeIf(r -> r.getTutor().getId().equals(tutorId));
        }

        studentRepository.save(student);
    }

    public Tutor getTutorById(Long tutorId) {
        return tutorRepository.findById(tutorId)
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", tutorId));
    }

    public List<Student> searchStudentsByName(String name) {
        return studentRepository.findByFullNameContainingIgnoreCase(name);
    }

    public long getStudentsCount() {
        return studentRepository.count();
    }

    public long getStudentsCountByTutor(Long tutorId) {
        return studentRepository.countByTutorId(tutorId);
    }
}