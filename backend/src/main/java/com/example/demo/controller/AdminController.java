package com.example.demo.controller;

import com.example.demo.entity.Tutor;
import com.example.demo.entity.Student;
import com.example.demo.entity.Lesson;
import com.example.demo.entity.Course;
import java.math.BigDecimal;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.internet.MimeMessage;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final TutorRepository tutorRepository;
    private final StudentRepository studentRepository;
    private final LessonRepository lessonRepository;
    private final NotificationRepository notificationRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mailFrom;

    // ========== СТАТИСТИКА ==========
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long tutorsCount = tutorRepository.count();
        long studentsCount = studentRepository.count();
        long lessonsCount = lessonRepository.count();
        return ResponseEntity.ok(Map.of(
                "tutors", tutorsCount,
                "students", studentsCount,
                "lessons", lessonsCount
        ));
    }

    // ========== УВЕДОМЛЕНИЯ ==========
    @GetMapping("/notifications")
    public ResponseEntity<?> getAdminNotifications() {
        Tutor admin = tutorRepository.findAll().stream()
                .filter(t -> "ROLE_SCHOOL_ADMIN".equals(t.getRole()))
                .findFirst()
                .orElse(null);

        if (admin == null) {
            return ResponseEntity.ok(java.util.List.of());
        }

        List<com.example.demo.entity.Notification> notifications = notificationRepository.findAllByTutorId(admin.getId());

        return ResponseEntity.ok(notifications.stream().map(n -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", n.getId());
            map.put("message", n.getMessage());
            map.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : "");
            map.put("read", n.isRead());
            return map;
        }).toList());
    }


    @PostMapping("/students/{studentId}/assign-tutor")
    public ResponseEntity<?> assignTutorToStudent(@PathVariable Long studentId, @RequestBody Map<String, Long> body) {
        Long tutorId = body.get("tutorId");
        Student student = studentRepository.findById(studentId).orElseThrow();
        Tutor tutor = tutorRepository.findById(tutorId).orElseThrow();

        // Удаляем все старые связи
        student.getTutors().clear();
        studentRepository.save(student);

        // Добавляем нового репетитора
        student.addTutor(tutor);
        studentRepository.save(student);

        return ResponseEntity.ok(Map.of("status", "success", "message", "Репетитор назначен"));
    }

    // ========== ОБНОВИТЬ СТАВКУ УЧЕНИКА ==========
    @PutMapping("/students/{studentId}/rate")
    public ResponseEntity<?> updateStudentRate(@PathVariable Long studentId,
                                               @RequestBody Map<String, Object> body) {
        try {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Ученик не найден"));

            Long tutorId = body.get("tutorId") != null
                    ? Long.parseLong(body.get("tutorId").toString())
                    : (student.getTutors() != null && !student.getTutors().isEmpty()
                       ? student.getTutors().get(0).getId()
                       : null);

            if (tutorId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "У ученика не назначен репетитор"));
            }

            Tutor tutor = tutorRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

            BigDecimal newRate = null;
            if (body.get("ratePerLesson") != null && !body.get("ratePerLesson").toString().isEmpty()) {
                newRate = new BigDecimal(body.get("ratePerLesson").toString());
            }

            String paymentType = student.getPaymentTypeForTutor(tutorId);
            if (body.get("paymentType") != null) {
                paymentType = body.get("paymentType").toString();
            }

            student.setRateForTutor(tutor, newRate, paymentType);
            studentRepository.save(student);

            log.info("✅ Ставка ученика {} обновлена: {} ₽ (tutorId={})",
                    student.getFullName(), newRate, tutorId);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Ставка обновлена",
                    "ratePerLesson", newRate,
                    "paymentType", paymentType
            ));
        } catch (Exception e) {
            log.error("Ошибка обновления ставки: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ОБНОВИТЬ ТИП ОПЛАТЫ УЧЕНИКА ==========
    @PutMapping("/students/{studentId}/payment-type")
    public ResponseEntity<?> updateStudentPaymentType(@PathVariable Long studentId,
                                                      @RequestBody Map<String, Object> body) {
        try {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Ученик не найден"));

            Long tutorId = body.get("tutorId") != null
                    ? Long.parseLong(body.get("tutorId").toString())
                    : (student.getTutors() != null && !student.getTutors().isEmpty()
                       ? student.getTutors().get(0).getId()
                       : null);

            if (tutorId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "У ученика не назначен репетитор"));
            }

            String paymentType = body.get("paymentType") != null
                    ? body.get("paymentType").toString()
                    : "single";

            if (!List.of("single", "subscription").contains(paymentType)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Недопустимый тип оплаты"));
            }

            Tutor tutor = tutorRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

            student.setPaymentType(paymentType);
            BigDecimal currentRate = student.getRateForTutor(tutorId);
            student.setRateForTutor(tutor,
                    currentRate != null ? currentRate : BigDecimal.ZERO,
                    paymentType);
            studentRepository.save(student);

            log.info("✅ Тип оплаты ученика {} изменён на {} (tutorId={})",
                    student.getFullName(), paymentType, tutorId);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "paymentType", paymentType
            ));
        } catch (Exception e) {
            log.error("Ошибка обновления типа оплаты: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/lessons/bulk")
    public ResponseEntity<?> createBulkLessons(@RequestBody Map<String, Object> body) {
        try {
            Long tutorId = Long.parseLong(body.get("tutorId").toString());
            String startTime = body.get("startTime").toString();
            Integer duration = body.get("duration") != null ? Integer.parseInt(body.get("duration").toString()) : 60;
            Integer weeks = body.get("weeks") != null ? Integer.parseInt(body.get("weeks").toString()) : 4;

            List<Integer> daysOfWeek = (List<Integer>) body.get("daysOfWeek");
            if (daysOfWeek == null || daysOfWeek.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Не указаны дни недели"));
            }

            // Поддерживаем оба формата: одиночный studentId или массив studentIds
            List<Long> studentIds = new ArrayList<>();
            if (body.get("studentIds") != null && body.get("studentIds") instanceof List) {
                List<?> raw = (List<?>) body.get("studentIds");
                for (Object o : raw) studentIds.add(Long.parseLong(o.toString()));
            } else if (body.get("studentId") != null) {
                studentIds.add(Long.parseLong(body.get("studentId").toString()));
            }

            if (studentIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Не указан ни один ученик"));
            }

            Tutor tutor = tutorRepository.findById(tutorId).orElseThrow();
            List<Student> students = new ArrayList<>();
            for (Long sid : studentIds) {
                students.add(studentRepository.findById(sid).orElseThrow());
            }

            LocalTime utcStart = LocalTime.parse(startTime);
            LocalTime utcEnd = utcStart.plusMinutes(duration);

            LocalDate today = LocalDate.now();
            int created = 0;
            boolean isPair = students.size() >= 2;

            for (int week = 0; week < weeks; week++) {
                for (Integer dayOfWeek : daysOfWeek) {
                    LocalDate lessonDate = today.plusWeeks(week);
                    int currentDay = lessonDate.getDayOfWeek().getValue();
                    int diff = dayOfWeek - currentDay;
                    if (diff < 0) diff += 7;
                    lessonDate = lessonDate.plusDays(diff);

                    if (lessonDate.isBefore(today)) continue;

                    Long pairGroupId = null;
                    String sharedJitsiRoom = null;
                    String sharedBoardRoom = null;
                    if (isPair) {
                        pairGroupId = System.currentTimeMillis() + created;
                        sharedJitsiRoom = "edspace-jitsi-" + UUID.randomUUID().toString().substring(0, 8);
                        sharedBoardRoom = "edspace-board-" + UUID.randomUUID().toString().substring(0, 8);
                    }

                    for (Student student : students) {
                        Lesson lesson = new Lesson();
                        lesson.setTutor(tutor);
                        lesson.setStudent(student);
                        lesson.setLessonDate(lessonDate);
                        lesson.setStartTime(utcStart);
                        lesson.setEndTime(utcEnd);
                        lesson.setDuration(duration);
                        lesson.setStatus("SCHEDULED");
                        if (isPair) {
                            lesson.setGroupId(pairGroupId);
                            lesson.setJitsiRoomName(sharedJitsiRoom);
                            lesson.setBoardRoomName(sharedBoardRoom);
                        }
                        lessonRepository.save(lesson);
                        created++;
                    }
                }
            }

            log.info("✅ Bulk-создание уроков: учеников={}, уроков={}, недель={}",
                    students.size(), created, weeks);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "created", created,
                    "studentsCount", students.size()
            ));
        } catch (Exception e) {
            log.error("Ошибка bulk-создания: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/students/{studentId}/remove-tutor/{tutorId}")
    public ResponseEntity<?> removeTutorFromStudent(@PathVariable Long studentId, @PathVariable Long tutorId) {
        Student student = studentRepository.findById(studentId).orElseThrow();
        Tutor tutor = tutorRepository.findById(tutorId).orElseThrow();
        student.removeTutor(tutor);
        studentRepository.save(student);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Репетитор отвязан"));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok(Map.of("status", "success"));
    }


    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        notificationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    // ========== РЕПЕТИТОРЫ ==========
    @GetMapping("/tutors")
    public ResponseEntity<?> getAllTutors() {
        List<Tutor> tutors = tutorRepository.findAll();
        return ResponseEntity.ok(tutors.stream().map(t -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", t.getId());
            map.put("fullName", t.getFullName());
            map.put("email", t.getEmail());
            map.put("phone", t.getPhone() != null ? t.getPhone() : "");
            map.put("subjects", t.getSubjects() != null ? t.getSubjects() : "");
            map.put("isActive", t.getIsActive() != null ? t.getIsActive() : true);
            map.put("createdAt", t.getCreatedAt());
            map.put("studentCount", studentRepository.countByTutorId(t.getId()));
            return map;
        }).toList());
    }

    @PostMapping("/tutors")
    public ResponseEntity<?> createTutor(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String fullName = body.get("fullName");
        String phone = body.get("phone");
        String subjects = body.get("subjects");
        String password = body.get("password");

        if (email == null || email.isBlank() || fullName == null || fullName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email и имя обязательны"));
        }

        if (tutorRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Репетитор с таким email уже существует"));
        }

        String generatedPassword = password != null && !password.isBlank()
                ? password
                : UUID.randomUUID().toString().substring(0, 10);

        Tutor tutor = new Tutor();
        tutor.setEmail(email.trim().toLowerCase());
        tutor.setFullName(fullName.trim());
        tutor.setPhone(phone != null ? phone.trim() : "");
        tutor.setSubjects(subjects);
        tutor.setPasswordHash(passwordEncoder.encode(generatedPassword));
        tutor.setRole("ROLE_TUTOR");
        tutor.setIsActive(true);
        tutor.setCreatedAt(LocalDateTime.now());
        tutor.setEmailVerified(true);
        tutor.setVideoRoomName("edspace-tutor-" + UUID.randomUUID().toString().substring(0, 8));
        tutor.setReferralCode(UUID.randomUUID().toString().substring(0, 8));
        tutor.setFailedLoginAttempts(0);

        tutorRepository.save(tutor);

        sendCredentialsEmail(email, fullName, generatedPassword);

        log.info("✅ Репетитор создан админом: {} ({})", fullName, email);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Репетитор создан",
                "id", tutor.getId()
        ));
    }

    @DeleteMapping("/tutors/{id}")
    public ResponseEntity<?> deleteTutor(@PathVariable Long id) {
        tutorRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Репетитор удалён"));
    }

    // ========== УЧЕНИКИ ==========
    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents() {
        List<Student> students = studentRepository.findAll();
        return ResponseEntity.ok(students.stream().map(s -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", s.getId());
            map.put("fullName", s.getFullName());
            map.put("email", s.getEmail() != null ? s.getEmail() : "");
            map.put("phone", s.getPhone() != null ? s.getPhone() : "");
            map.put("grade", s.getGrade() != null ? s.getGrade() : "");
            map.put("createdAt", s.getCreatedAt());

            Long tutorId = s.getTutors() != null && !s.getTutors().isEmpty()
                    ? s.getTutors().get(0).getId()
                    : null;
            map.put("tutorId", tutorId);
            map.put("tutorName", tutorId != null
                    ? s.getTutors().get(0).getFullName()
                    : "Не назначен");

            if (tutorId != null) {
                java.math.BigDecimal rate = s.getRateForTutor(tutorId);
                map.put("ratePerLesson", rate != null ? rate : null);
                map.put("paymentType", s.getPaymentTypeForTutor(tutorId));
            } else {
                map.put("ratePerLesson", null);
                map.put("paymentType", s.getPaymentType());
            }

            return map;
        }).toList());
    }

    @PostMapping("/students")
    public ResponseEntity<?> createStudent(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String fullName = body.get("fullName");
        String phone = body.get("phone");
        String grade = body.get("grade");

        if (fullName == null || fullName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Имя обязательно"));
        }

        Student student = new Student();
        student.setFullName(fullName.trim());
        student.setEmail(email != null ? email.trim().toLowerCase() : "");
        student.setPhone(phone != null ? phone.trim() : "");
        student.setGrade(grade);
        student.setCreatedAt(LocalDateTime.now());
        student.setIsActive(true);

        studentRepository.save(student);

        if (email != null && !email.isBlank()) {
            String generatedPassword = UUID.randomUUID().toString().substring(0, 10);
            student.setPasswordHash(passwordEncoder.encode(generatedPassword));
            studentRepository.save(student);
            sendStudentCredentialsEmail(email, fullName, generatedPassword);
        }

        log.info("✅ Ученик создан админом: {} ({})", fullName, email);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Ученик создан",
                "id", student.getId()
        ));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        studentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Ученик удалён"));
    }

    // ========== РАСПИСАНИЕ ==========
    @GetMapping("/lessons")
    public ResponseEntity<?> getAllLessons() {
        List<Lesson> lessons = lessonRepository.findAll();
        return ResponseEntity.ok(lessons.stream().map(l -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", l.getId());
            map.put("lessonDate", l.getLessonDate() != null ? l.getLessonDate().toString() : "");
            map.put("startTime", l.getStartTime() != null ? l.getStartTime().toString() : "");
            map.put("endTime", l.getEndTime() != null ? l.getEndTime().toString() : "");
            map.put("status", l.getStatus());
            map.put("studentName", l.getStudent() != null ? l.getStudent().getFullName() : "");
            map.put("tutorName", l.getTutor() != null ? l.getTutor().getFullName() : "");
            map.put("courseName", l.getCourse() != null ? l.getCourse().getName() : "");
            map.put("groupId", l.getGroupId());
            return map;
        }).toList());
    }

    @PostMapping("/lessons")
    public ResponseEntity<?> createLesson(@RequestBody Map<String, String> body) {
        try {
            Long studentId = Long.parseLong(body.get("studentId"));
            Long tutorId = Long.parseLong(body.get("tutorId"));
            String lessonDate = body.get("lessonDate");
            String startTime = body.get("startTime");
            String endTime = body.get("endTime");

            Lesson lesson = new Lesson();
            lesson.setTutor(tutorRepository.findById(tutorId).orElseThrow());
            lesson.setStudent(studentRepository.findById(studentId).orElseThrow());
            lesson.setLessonDate(LocalDate.parse(lessonDate));
            lesson.setStartTime(LocalTime.parse(startTime));
            lesson.setEndTime(LocalTime.parse(endTime));
            lesson.setStatus("SCHEDULED");
            lesson.setDuration(60);

            lessonRepository.save(lesson);
            log.info("✅ Урок создан админом: {} {}", lessonDate, startTime);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Урок создан"));
        } catch (Exception e) {
            log.error("Ошибка создания урока: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== СОЗДАТЬ ПАРНОЕ ЗАНЯТИЕ ==========
    @PostMapping("/lessons/pair")
    public ResponseEntity<?> createPairLesson(@RequestBody Map<String, Object> body) {
        try {
            Long tutorId = Long.parseLong(body.get("tutorId").toString());
            List<?> studentIdsRaw = (List<?>) body.get("studentIds");
            if (studentIdsRaw == null || studentIdsRaw.size() < 2) {
                return ResponseEntity.badRequest().body(Map.of("error", "Нужно минимум 2 ученика"));
            }
            List<Long> studentIds = studentIdsRaw.stream()
                    .map(x -> Long.parseLong(x.toString()))
                    .collect(Collectors.toList());

            Integer duration = body.get("duration") != null
                    ? Integer.parseInt(body.get("duration").toString()) : 60;

            Tutor tutor = tutorRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Репетитор не найден"));
            String tutorTimezone = tutor.getTimezone() != null ? tutor.getTimezone() : "Asia/Krasnoyarsk";

            LocalDate localLessonDate = LocalDate.parse(body.get("lessonDate").toString());
            LocalTime localStartTime = LocalTime.parse(body.get("startTime").toString());

            ZonedDateTime tutorZoned = ZonedDateTime.of(localLessonDate, localStartTime, ZoneId.of(tutorTimezone));
            ZonedDateTime utcZoned = tutorZoned.withZoneSameInstant(ZoneId.of("UTC"));
            LocalDate utcDate = utcZoned.toLocalDate();
            LocalTime utcStart = utcZoned.toLocalTime();
            LocalTime utcEnd = utcStart.plusMinutes(duration);

            Course course = null;
            if (body.get("courseId") != null && !body.get("courseId").toString().isEmpty()) {
                course = courseRepository.findById(Long.parseLong(body.get("courseId").toString())).orElse(null);
            }

            long pairGroupId = System.currentTimeMillis();
            String sharedJitsiRoom = "edspace-jitsi-" + UUID.randomUUID().toString().substring(0, 8);
            String sharedBoardRoom = "edspace-board-" + UUID.randomUUID().toString().substring(0, 8);

            List<Lesson> created = new ArrayList<>();
            for (Long sid : studentIds) {
                Student s = studentRepository.findById(sid)
                        .orElseThrow(() -> new RuntimeException("Ученик не найден: " + sid));

                Lesson lesson = new Lesson(tutor, s, course, utcDate, utcStart, utcEnd);
                lesson.setDuration(duration);
                lesson.setGroupId(pairGroupId);
                lesson.setJitsiRoomName(sharedJitsiRoom);
                lesson.setBoardRoomName(sharedBoardRoom);
                lesson.setStatus("SCHEDULED");
                lessonRepository.save(lesson);
                created.add(lesson);
            }

            log.info("✅ Парное занятие создано: pairGroupId={}, учеников={}", pairGroupId, created.size());

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Создано " + created.size() + " уроков (парное занятие)",
                    "pairGroupId", pairGroupId,
                    "count", created.size()
            ));
        } catch (Exception e) {
            log.error("Ошибка создания парного занятия: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/lessons/{id}/status")
    public ResponseEntity<?> updateLessonStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Lesson lesson = lessonRepository.findById(id).orElseThrow();
            String newStatus = body.get("status");
            if (!List.of("SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED").contains(newStatus)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Недопустимый статус"));
            }
            lesson.setStatus(newStatus);
            lessonRepository.save(lesson);
            log.info("✅ Статус урока {} изменён на {}", id, newStatus);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ ==========
    private void sendStudentCredentialsEmail(String to, String fullName, String password) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("🎓 EdSpace — Ваши данные для входа");

            String html = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;">
                <h2 style="color: #4F46E5;">Добро пожаловать в EdSpace!</h2>
                <p>Здравствуйте, <strong>%s</strong>!</p>
                <p>Вы добавлены как ученик в онлайн-школу EdSpace.</p>
                <div style="background: #F5F3FF; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Логин:</strong> %s</p>
                    <p style="margin: 5px 0;"><strong>Пароль:</strong> %s</p>
                </div>
                <p>Войдите на платформу: <a href="https://ed-space.ru/login">ed-space.ru/login</a></p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">© 2026 EdSpace</p>
            </div>
            """, fullName, to, password);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Письмо с доступами отправлено ученику на {}", to);
        } catch (Exception e) {
            log.error("❌ Ошибка отправки письма ученику: {}", e.getMessage());
        }
    }

    private void sendCredentialsEmail(String to, String fullName, String password) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("🎓 EdSpace — Ваши данные для входа");

            String html = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;">
                    <h2 style="color: #4F46E5;">Добро пожаловать в EdSpace!</h2>
                    <p>Здравствуйте, <strong>%s</strong>!</p>
                    <p>Вы добавлены как репетитор в онлайн-школу EdSpace.</p>
                    <div style="background: #F5F3FF; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Логин:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Пароль:</strong> %s</p>
                    </div>
                    <p>Войдите на платформу: <a href="https://ed-space.ru/login">ed-space.ru/login</a></p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">© 2026 EdSpace</p>
                </div>
                """, fullName, to, password);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Письмо с доступами отправлено на {}", to);
        } catch (Exception e) {
            log.error("❌ Ошибка отправки письма с доступами: {}", e.getMessage());
        }
    }
}