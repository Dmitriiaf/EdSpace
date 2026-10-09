package com.example.demo.service;

import com.example.demo.repository.InvitationTokenRepository;
import com.example.demo.entity.InvitationToken;
import com.example.demo.entity.*;
import com.example.demo.repository.HomeworkRepository;
import com.example.demo.repository.MaterialRepository;
import com.example.demo.repository.BoardSessionRepository;
import com.example.demo.repository.StudentBoardRepository;
import com.example.demo.repository.NotificationRepository;
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
    private HomeworkRepository homeworkRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private BoardSessionRepository boardSessionRepository;

    @Autowired
    private StudentBoardRepository studentBoardRepository;


    @Autowired
    private NotificationRepository notificationRepository;

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
        // ✅ Сохраняем paymentType в Student
        if (paymentType != null) {
            student.setPaymentType(paymentType);
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

        // 1. Удалить уведомления
        notificationRepository.deleteByStudentId(id);

        // 2. Удалить домашние задания
        homeworkRepository.deleteByStudentId(id);

        // 3. Удалить материалы
        materialRepository.deleteByStudentId(id);

        // 4. Удалить сессии досок
        boardSessionRepository.deleteByStudentId(id);

        // 5. Удалить заметки (student_board)
        studentBoardRepository.deleteByStudentId(id);

        // 6. Очистить связи с курсами
        studentRepository.removeFromAllCourses(id);

        // 7. Удалить ставки
        if (student.getRates() != null) {
            student.getRates().clear();
            studentRepository.save(student);
        }

        // 8. Удалить шаблоны
        List<WeeklyTemplate> templates = weeklyTemplateRepository.findByStudentId(id);
        if (!templates.isEmpty()) {
            weeklyTemplateRepository.deleteAll(templates);
        }

        // 9. Удалить уроки
        List<Lesson> lessons = lessonRepository.findByStudentIdOrderByLessonDateAscStartTimeAsc(id);
        if (!lessons.isEmpty()) {
            lessonRepository.deleteAll(lessons);
        }

        // 10. Удалить платежи
        List<Payment> payments = paymentRepository.findByStudentId(id);
        if (!payments.isEmpty()) {
            paymentRepository.deleteAll(payments);
        }

        // 11. Удалить абонементы
        List<Subscription> subscriptions = subscriptionRepository.findByStudentId(id);
        if (!subscriptions.isEmpty()) {
            subscriptionRepository.deleteAll(subscriptions);
        }

        // 12. Удалить приглашения
        invitationTokenRepository.deleteByStudentId(id);

        // 13. Отвязать родителя
        if (student.getParent() != null) {
            student.setParent(null);
            studentRepository.save(student);
        }

        // 14. Удалить связи с репетиторами
        student.getTutors().clear();
        studentRepository.save(student);

        // 15. Удалить ученика
        studentRepository.delete(student);
        log.info("🗑️ Ученик id={} полностью удалён со всеми связанными записями", id);
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

    // ================== ЕГЭ РЕЙТИНГ ==================

    /**
     * ЕГЭ-рейтинг учеников репетитора.
     * Возвращает только тех, у кого egeRatingEnabled = true,
     * с расчётом среднего балла за пробники, количества, последнего и тренда.
     * Сортировка: по среднему баллу убыв.
     */
    public List<java.util.Map<String, Object>> getEgeRating(Long tutorId, Long currentUserId, String userRole) {
        List<Student> students = studentRepository.findByTutorId(tutorId);

        // Фильтруем: только те, у кого включён рейтинг
        List<Student> egeStudents = students.stream()
                .filter(s -> Boolean.TRUE.equals(s.getEgeRatingEnabled()))
                .filter(s -> s.getArchived() == null || !s.getArchived())
                .collect(java.util.stream.Collectors.toList());

        // Собираем статистику по каждому
        List<java.util.Map<String, Object>> rows = new java.util.ArrayList<>();

        for (Student student : egeStudents) {
            // Все пробники ученика у этого репетитора
            List<Homework> mockExams = homeworkRepository.findAll().stream()
                    .filter(h -> h.getStudent() != null && h.getStudent().getId().equals(student.getId()))
                    .filter(h -> h.getTutor() != null && h.getTutor().getId().equals(tutorId))
                    .filter(h -> "MOCK_EXAM".equalsIgnoreCase(h.getType()))
                    .filter(h -> h.getScore() != null)
                    .sorted((a, b) -> {
                        // Сортируем по дате: сначала свежие
                        java.time.LocalDateTime da = a.getExamDate() != null
                                ? a.getExamDate().atStartOfDay()
                                : (a.getCreatedAt() != null ? a.getCreatedAt() : java.time.LocalDateTime.MIN);
                        java.time.LocalDateTime db = b.getExamDate() != null
                                ? b.getExamDate().atStartOfDay()
                                : (b.getCreatedAt() != null ? b.getCreatedAt() : java.time.LocalDateTime.MIN);
                        return db.compareTo(da);
                    })
                    .collect(java.util.stream.Collectors.toList());

            java.util.Map<String, Object> row = new java.util.HashMap<>();
            row.put("studentId", student.getId());
            row.put("fullName", student.getFullName());
            row.put("avatar", student.getAvatar());
            row.put("grade", student.getGrade());

            if (mockExams.isEmpty()) {
                row.put("averageScore", null);
                row.put("mockCount", 0);
                row.put("lastScore", null);
                row.put("lastDate", null);
                row.put("trend", null);
            } else {
                // Средний балл
                double avg = mockExams.stream()
                        .mapToInt(Homework::getScore)
                        .average()
                        .orElse(0);
                row.put("averageScore", Math.round(avg * 10.0) / 10.0);

                row.put("mockCount", mockExams.size());

                // Последний результат
                Homework last = mockExams.get(0);
                row.put("lastScore", last.getScore());
                if (last.getExamDate() != null) {
                    row.put("lastDate", last.getExamDate().toString());
                } else if (last.getCreatedAt() != null) {
                    row.put("lastDate", last.getCreatedAt().toLocalDate().toString());
                } else {
                    row.put("lastDate", null);
                }

                // Тренд: разница между последним и предыдущим
                if (mockExams.size() >= 2) {
                    int lastScore = mockExams.get(0).getScore();
                    int prevScore = mockExams.get(1).getScore();
                    row.put("trend", lastScore - prevScore);
                } else {
                    row.put("trend", null);
                }
            }

            rows.add(row);
        }

        // Сортировка: сначала те, у кого есть средний балл, по убыванию
        rows.sort((a, b) -> {
            Double avgA = (Double) a.get("averageScore");
            Double avgB = (Double) b.get("averageScore");
            if (avgA == null && avgB == null) return 0;
            if (avgA == null) return 1;
            if (avgB == null) return -1;
            return Double.compare(avgB, avgA);
        });

        // Расставляем места (только тем, у кого есть средний балл)
        int place = 1;
        for (java.util.Map<String, Object> row : rows) {
            if (row.get("averageScore") != null) {
                row.put("place", place++);
            } else {
                row.put("place", null);
            }
        }

        // Помечаем «это я» для текущего ученика
        if ("ROLE_STUDENT".equals(userRole) && currentUserId != null) {
            for (java.util.Map<String, Object> row : rows) {
                row.put("isMe", currentUserId.equals(row.get("studentId")));
            }
        }

        return rows;
    }
}