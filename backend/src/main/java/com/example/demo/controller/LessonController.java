package com.example.demo.controller;

import com.example.demo.entity.Lesson;
import com.example.demo.entity.Parent;
import com.example.demo.entity.Student;
import com.example.demo.entity.Subscription;
import com.example.demo.service.LessonService;
import com.example.demo.service.LessonGeneratorService;
import com.example.demo.service.SubscriptionService;
import com.example.demo.service.NotificationService;
import com.example.demo.service.StudentService;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.SubscriptionRepository;
import com.example.demo.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import com.example.demo.entity.Tutor;
import com.example.demo.repository.TutorRepository;

@RestController
@RequestMapping("/api/lessons")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class LessonController {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonService lessonService;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private LessonGeneratorService lessonGeneratorService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StudentService studentService;

    @GetMapping("/today")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTodayLessons(@RequestParam Long tutorId,
                                             @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        if (!tutorId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        try {
            List<Lesson> lessons = lessonService.getTodayLessons(tutorId);
            return ResponseEntity.ok(lessons);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel-reschedule")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> cancelReschedule(@PathVariable Long id,
                                              @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Lesson original = lessonService.getLessonById(id);

            boolean hasTutor = original.getStudent().getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            if (!"RESCHEDULED".equals(original.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Занятие не было перенесено"));
            }

            Lesson newLesson = lessonRepository.findByOriginalLessonId(id)
                    .orElseThrow(() -> new RuntimeException("Не найдено перенесённое занятие"));

            original.setStatus("SCHEDULED");
            original.setUpdatedAt(LocalDateTime.now());
            lessonRepository.save(original);

            lessonRepository.delete(newLesson);

            return ResponseEntity.ok(Map.of("message", "Перенос отменён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getUpcomingLessons(@RequestParam Long tutorId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        if (!tutorId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        try {
            List<Lesson> lessons = lessonService.getUpcomingLessons(tutorId);
            return ResponseEntity.ok(lessons);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getAllLessons(@RequestParam Long tutorId,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                           @RequestAttribute(name = "userRole", required = false) String userRole) {
        if (!tutorId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        try {
            List<Lesson> lessons = lessonService.getAllLessons(tutorId);

            // Получаем часовой пояс репетитора
            Tutor tutor = tutorRepository.findById(currentUserId).orElse(null);
            String userTimeZone = (tutor != null && tutor.getTimezone() != null)
                    ? tutor.getTimezone()
                    : "Europe/Moscow";

            ZoneId userZone = ZoneId.of(userTimeZone);

            // Конвертируем время каждого урока
            for (Lesson lesson : lessons) {
                // Конвертируем startTime
                ZonedDateTime utcStart = ZonedDateTime.of(
                        lesson.getLessonDate(),
                        lesson.getStartTime(),
                        ZoneId.of("UTC")
                );
                ZonedDateTime userStart = utcStart.withZoneSameInstant(userZone);

                // ✅ Вычисляем endTime на основе duration
                int duration = lesson.getDuration() != null ? lesson.getDuration() : 60;
                ZonedDateTime userEnd = userStart.plusMinutes(duration);

                lesson.setLessonDate(userStart.toLocalDate());
                lesson.setStartTime(userStart.toLocalTime());
                lesson.setEndTime(userEnd.toLocalTime());
            }

            return ResponseEntity.ok(lessons);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/archived")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getArchivedLessons(@RequestParam Long tutorId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        if (!tutorId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        try {
            List<Lesson> lessons = lessonService.getArchivedLessons(tutorId);
            return ResponseEntity.ok(lessons);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getLessonsByStudent(@PathVariable Long studentId,
                                                 @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                 @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Student student = lessonService.getStudentById(studentId);

            if ("ROLE_TUTOR".equals(userRole)) {
                boolean hasTutor = student.getTutors().stream()
                        .anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!studentId.equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_PARENT".equals(userRole)) {
                if (student.getParent() == null || !student.getParent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            List<Long> allStudentIds = studentRepository.findStudentIdsByEmail(student.getEmail());
            List<Lesson> allLessons = new ArrayList<>();

            for (Long id : allStudentIds) {
                allLessons.addAll(lessonService.getLessonsByStudent(id));
            }

            List<Lesson> uniqueLessons = allLessons.stream()
                    .collect(Collectors.toMap(Lesson::getId, lesson -> lesson, (existing, replacement) -> existing))
                    .values().stream().collect(Collectors.toList());

            uniqueLessons.sort((a, b) -> {
                int dateCompare = a.getLessonDate().compareTo(b.getLessonDate());
                if (dateCompare != 0) return dateCompare;
                return a.getStartTime().compareTo(b.getStartTime());
            });

            return ResponseEntity.ok(uniqueLessons);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getLessonById(@PathVariable Long id,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                           @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Lesson lesson = lessonService.getLessonById(id);

            if ("ROLE_TUTOR".equals(userRole)) {
                boolean hasTutor = lesson.getStudent().getTutors().stream()
                        .anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!lesson.getStudent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_PARENT".equals(userRole)) {
                if (lesson.getStudent().getParent() == null ||
                        !lesson.getStudent().getParent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            return ResponseEntity.ok(lesson);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createLesson(@RequestBody Map<String, Object> request,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        Long tutorId = Long.parseLong(request.get("tutorId").toString());
        if (!tutorId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        try {
            Integer duration = request.get("duration") != null ?
                    Integer.parseInt(request.get("duration").toString()) : 60;

            // Получаем часовой пояс репетитора
            Tutor tutor = tutorRepository.findById(tutorId).orElseThrow();
            ZoneId tutorZone = ZoneId.of(tutor.getTimezone() != null ? tutor.getTimezone() : "Europe/Moscow");

            // Парсим дату и время
            LocalDate lessonDate = LocalDate.parse(request.get("lessonDate").toString());
            LocalTime startTime = LocalTime.parse(request.get("startTime").toString());

            // Конвертируем из часового пояса репетитора в UTC
            ZonedDateTime zonedStart = ZonedDateTime.of(lessonDate, startTime, tutorZone);
            ZonedDateTime utcStart = zonedStart.withZoneSameInstant(ZoneId.of("UTC"));

            LocalDate utcDate = utcStart.toLocalDate();
            LocalTime utcTime = utcStart.toLocalTime();
            LocalTime utcEndTime = utcTime.plusMinutes(duration);

            Lesson lesson = lessonService.createLesson(
                    tutorId,
                    Long.parseLong(request.get("studentId").toString()),
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    utcDate,
                    utcTime,
                    utcEndTime
            );

            lesson.setDuration(duration);
            lessonService.saveLesson(lesson);

            return ResponseEntity.ok(lesson);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> completeLesson(@PathVariable Long id,
                                            @RequestBody Map<String, String> request,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Lesson lesson = lessonService.getLessonById(id);
            boolean hasTutor = lesson.getStudent().getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            String notes = request.get("notes");
            String nextLessonPlan = request.get("nextLessonPlan");

            Lesson completedLesson;

            // ✅ Если это перенесённый урок — используем специальный метод
            if (lesson.getOriginalLesson() != null && "RESCHEDULED".equals(lesson.getStatus())) {
                completedLesson = lessonService.completeRescheduledLesson(id, notes, nextLessonPlan);
            } else {
                completedLesson = lessonService.completeLesson(id, notes, nextLessonPlan);
            }

            boolean isSubscription = "subscription".equals(completedLesson.getStudent().getPaymentType());

            if (isSubscription) {
                subscriptionService.useLessonForStudent(completedLesson.getStudent().getId());
            } else {
                if (completedLesson.getStudent().getParent() != null) {
                    String message = String.format(
                            "✅ Урок по %s с %s (%s %s) завершён. Пожалуйста, подтвердите оплату.",
                            completedLesson.getCourse() != null ? completedLesson.getCourse().getName() : "занятию",
                            completedLesson.getStudent().getFullName(),
                            completedLesson.getLessonDate().toString(),
                            completedLesson.getStartTime().toString().substring(0, 5)
                    );
                    notificationService.createNotification(
                            completedLesson.getStudent().getParent().getId(),
                            completedLesson.getId(),
                            message
                    );
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", isSubscription ? "Урок завершён и оплачен из абонемента" : "Урок завершён, родитель получит уведомление",
                    "lesson", completedLesson
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('TUTOR', 'PARENT')")
    public ResponseEntity<?> confirmPayment(@PathVariable Long id,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                            @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Lesson lesson = lessonService.getLessonById(id);

            if ("ROLE_TUTOR".equals(userRole)) {
                boolean hasTutor = lesson.getStudent().getTutors().stream()
                        .anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_PARENT".equals(userRole)) {
                Parent parent = lesson.getStudent().getParent();
                if (parent == null) {
                    return ResponseEntity.status(403).body(Map.of("error", "У ученика нет привязанного родителя"));
                }
                if (!parent.getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён — это не ваш ребёнок"));
                }
                boolean isChildLesson = parent.getChildren().stream()
                        .anyMatch(child -> child.getId().equals(lesson.getStudent().getId()));
                if (!isChildLesson) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён — урок не принадлежит вашему ребёнку"));
                }
            }

            Lesson paidLesson = lessonService.confirmPayment(id);
            return ResponseEntity.ok(Map.of("message", "Оплата подтверждена", "lesson", paidLesson));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> cancelLesson(@PathVariable Long id,
                                          @RequestBody(required = false) Map<String, String> request,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                          @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Lesson lesson = lessonService.getLessonById(id);

            // Проверки прав доступа
            if ("ROLE_TUTOR".equals(userRole)) {
                boolean hasTutor = lesson.getStudent().getTutors().stream()
                        .anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!lesson.getStudent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_PARENT".equals(userRole)) {
                Parent parent = lesson.getStudent().getParent();
                if (parent == null || !parent.getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            String reason = request != null ? request.get("reason") : null;
            String originalStatus = lesson.getStatus();

            // ✅ НЕЯВКА = урок был IN_PROGRESS и его отменяет репетитор
            boolean isNoShow = Lesson.STATUS_IN_PROGRESS.equals(originalStatus) && "ROLE_TUTOR".equals(userRole);

            lesson.setStatus(Lesson.STATUS_CANCELLED);

            if (isNoShow) {
                lesson.setNotes("❌ Ученик не пришёл" + (reason != null && !reason.isEmpty() ? ": " + reason : ""));
            } else {
                lesson.setNotes(reason != null && !reason.isEmpty() ? "❌ Отменено: " + reason : "❌ Отменено");
            }

            // ========== ОБРАБОТКА ДОЛГОВ И ПРОПУСКОВ ==========
            Student student = lesson.getStudent();
            String paymentType = student.getPaymentType();

            boolean shouldCreateDebt = Lesson.STATUS_SCHEDULED.equals(originalStatus) || isNoShow;

            if (shouldCreateDebt) {
                if ("subscription".equals(paymentType)) {
                    Optional<Subscription> activeSubOpt = subscriptionRepository.findActiveByStudentId(student.getId());
                    if (activeSubOpt.isPresent()) {
                        Subscription sub = activeSubOpt.get();
                        sub.setDebtLessons(sub.getDebtLessons() != null ? sub.getDebtLessons() + 1 : 1);
                        subscriptionRepository.save(sub);
                    }
                } else {
                    student.setMissedLessons(student.getMissedLessons() != null ? student.getMissedLessons() + 1 : 1);
                    studentRepository.save(student);
                }
            }

            Lesson savedLesson = lessonService.saveLesson(lesson);

            // Уведомление родителю
            if (student.getParent() != null) {
                String message = isNoShow ?
                        String.format("❌ Ученик %s не пришёл на занятие %s %s.",
                                student.getFullName(), lesson.getLessonDate(), lesson.getStartTime().toString().substring(0, 5)) :
                        String.format("❌ Урок по %s с %s (%s %s) отменён.",
                                lesson.getCourse() != null ? lesson.getCourse().getName() : "занятию",
                                student.getFullName(), lesson.getLessonDate(), lesson.getStartTime().toString().substring(0, 5));
                notificationService.createNotification(student.getParent().getId(), lesson.getId(), message);
            }

            return ResponseEntity.ok(savedLesson);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/notes")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> addNotes(@PathVariable Long id,
                                      @RequestBody Map<String, String> request,
                                      @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Lesson lesson = lessonService.getLessonById(id);
            boolean hasTutor = lesson.getStudent().getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Lesson updatedLesson = lessonService.addNotes(id, request.get("notes"), request.get("nextLessonPlan"));
            return ResponseEntity.ok(updatedLesson);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reschedule")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> rescheduleLesson(@PathVariable Long id,
                                              @RequestBody Map<String, Object> request,
                                              @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Lesson lesson = lessonService.getLessonById(id);
            boolean hasTutor = lesson.getStudent().getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Lesson rescheduledLesson = lessonService.rescheduleLesson(
                    id,
                    LocalDate.parse(request.get("newDate").toString()),
                    LocalTime.parse(request.get("newStartTime").toString()),
                    LocalTime.parse(request.get("newEndTime").toString())
            );
            return ResponseEntity.ok(Map.of("message", "Занятие успешно перенесено", "lesson", rescheduledLesson));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> generateLessons(@RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            LocalDate today = LocalDate.now();
            LocalDate endDate = today.plusMonths(1);
            lessonGeneratorService.generateLessons(today, endDate);
            return ResponseEntity.ok(Map.of("message", "Занятия созданы на месяц вперёд", "period", Map.of("start", today, "end", endDate)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/use-subscription")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> useSubscriptionForLesson(@PathVariable Long id) {
        try {
            Lesson lesson = lessonService.getLessonById(id);
            subscriptionService.useLessonForStudent(lesson.getStudent().getId());
            return ResponseEntity.ok(Map.of("message", "Занятие отмечено в абонементе"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/resurrect")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> resurrectLesson(@RequestBody Map<String, Object> request,
                                             @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Long studentId = request.get("studentId") != null ? Long.parseLong(request.get("studentId").toString()) : null;
            LocalDate newDate = LocalDate.parse(request.get("newDate").toString());
            LocalTime newStartTime = LocalTime.parse(request.get("newStartTime").toString());
            LocalTime newEndTime = LocalTime.parse(request.get("newEndTime").toString());

            System.out.println("🔍 [RESURRECT] studentId=" + studentId + ", tutorId=" + currentUserId);

            if (studentId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Не указан studentId"));
            }

            Student student = studentService.getStudentById(studentId);
            System.out.println("🔍 [RESURRECT] student: " + student.getFullName() + ", paymentType=" + student.getPaymentType());

            boolean hasTutor = student.getTutors().stream().anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));

            Lesson newLesson = lessonService.createLesson(currentUserId, studentId, null, newDate, newStartTime, newEndTime);

            boolean debtReduced = false;

            if ("subscription".equals(student.getPaymentType())) {
                System.out.println("🔍 [RESURRECT] Looking for active subscription: studentId=" + studentId + ", tutorId=" + currentUserId);

                Optional<Subscription> activeSubOpt = subscriptionRepository
                        .findByStudentIdAndTutorIdAndStatus(studentId, currentUserId, "ACTIVE");

                if (activeSubOpt.isPresent()) {
                    Subscription sub = activeSubOpt.get();
                    System.out.println("🔍 [RESURRECT] Found subscription id=" + sub.getId() + ", debt_lessons=" + sub.getDebtLessons());

                    if (sub.getDebtLessons() != null && sub.getDebtLessons() > 0) {
                        sub.setDebtLessons(sub.getDebtLessons() - 1);
                        subscriptionRepository.save(sub);
                        debtReduced = true;
                        System.out.println("✅ [RESURRECT] Debt reduced to " + sub.getDebtLessons());
                    } else {
                        System.out.println("⚠️ [RESURRECT] Debt lessons is null or 0");
                    }
                } else {
                    System.out.println("❌ [RESURRECT] Active subscription NOT FOUND for studentId=" + studentId + ", tutorId=" + currentUserId);
                }
            } else {
                System.out.println("🔍 [RESURRECT] Payment type is NOT subscription, it's: " + student.getPaymentType());
            }

            String message = debtReduced ? "✅ Долг списан" : "✅ Занятие создано";
            System.out.println("🔍 [RESURRECT] Final message: " + message);

            return ResponseEntity.ok(Map.of("message", message, "lesson", newLesson));

        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/call-started")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> markCallStarted(@PathVariable Long id,
                                             @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                             @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Lesson lesson = lessonService.getLessonById(id);
            if ("ROLE_TUTOR".equals(userRole)) {
                boolean hasTutor = lesson.getStudent().getTutors().stream().anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!lesson.getStudent().getId().equals(currentUserId)) return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            if (Lesson.STATUS_SCHEDULED.equals(lesson.getStatus())) {
                lesson.setStatus(Lesson.STATUS_IN_PROGRESS);
                lesson.setCallStartedAt(LocalDateTime.now());
                lessonService.saveLesson(lesson);
            }
            return ResponseEntity.ok(Map.of("callStartedAt", lesson.getCallStartedAt(), "status", lesson.getStatus()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/auto-complete")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> autoCompleteLesson(@PathVariable Long id,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Lesson lesson = lessonService.getLessonById(id);
            if ("ROLE_TUTOR".equals(userRole)) {
                boolean hasTutor = lesson.getStudent().getTutors().stream().anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!lesson.getStudent().getId().equals(currentUserId)) return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            if (!Lesson.STATUS_IN_PROGRESS.equals(lesson.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Урок не в процессе"));
            }
            boolean isSubscription = "subscription".equals(lesson.getStudent().getPaymentType());
            if (isSubscription) {
                lesson.setStatus(Lesson.STATUS_PAID);
                lesson.setPaidAt(LocalDateTime.now());
                subscriptionService.useLessonForStudent(lesson.getStudent().getId());
            } else {
                lesson.setStatus(Lesson.STATUS_COMPLETED);
            }
            lesson.setCompletedAt(LocalDateTime.now());
            lesson.setAutoCompleted(true);
            lesson.setNotes(lesson.getNotes() != null ? lesson.getNotes() + " (автозавершение)" : "(автозавершение)");
            Lesson savedLesson = lessonService.saveLesson(lesson);
            if (!isSubscription && lesson.getStudent().getParent() != null) {
                String message = String.format("✅ Урок по %s с %s (%s %s) завершён автоматически.",
                        lesson.getCourse() != null ? lesson.getCourse().getName() : "занятию",
                        lesson.getStudent().getFullName(), lesson.getLessonDate().toString(), lesson.getStartTime().toString().substring(0, 5));
                notificationService.createNotification(lesson.getStudent().getParent().getId(), lesson.getId(), message);
            }
            return ResponseEntity.ok(Map.of("message", isSubscription ? "Урок завершён автоматически и оплачен из абонемента" : "Урок завершён автоматически", "lesson", savedLesson));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteLesson(@PathVariable Long id,
                                          @RequestParam(required = false, defaultValue = "false") boolean deleteFromTemplate,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Lesson lesson = lessonService.getLessonById(id);

            // IDOR: проверяем, что урок принадлежит репетитору
            boolean hasTutor = lesson.getStudent().getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            int deletedCount = 1; // текущий урок

            // ✅ Если нужно удалить из шаблона — удаляем все будущие уроки с теми же параметрами
            if (deleteFromTemplate) {
                List<Lesson> futureTemplateLessons = lessonRepository.findFutureTemplateLessons(
                        lesson.getTutor().getId(),
                        lesson.getStudent().getId(),
                        lesson.getCourse() != null ? lesson.getCourse().getId() : null,
                        lesson.getLessonDate(),
                        lesson.getStartTime(),
                        lesson.getEndTime()
                );

                for (Lesson futureLesson : futureTemplateLessons) {
                    if (!futureLesson.getId().equals(id)) { // не удаляем текущий урок дважды
                        lessonRepository.delete(futureLesson);
                        deletedCount++;
                    }
                }
            }

            // Удаляем текущий урок
            lessonService.deleteLesson(id);

            String message = deleteFromTemplate
                    ? String.format("Удалён урок и %d будущих занятий по шаблону", deletedCount - 1)
                    : "Занятие удалено";

            return ResponseEntity.ok(Map.of(
                    "message", message,
                    "deletedCount", deletedCount
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }



    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> startLesson(@PathVariable Long id,
                                         @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Lesson lesson = lessonService.getLessonById(id);
            boolean hasTutor = lesson.getStudent().getTutors().stream().anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            if (!Lesson.STATUS_SCHEDULED.equals(lesson.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Урок уже начат или завершён"));
            }
            lesson.setStatus(Lesson.STATUS_IN_PROGRESS);
            lesson.setCallStartedAt(LocalDateTime.now());
            Lesson savedLesson = lessonService.saveLesson(lesson);
            return ResponseEntity.ok(Map.of("message", "Урок начат", "lesson", savedLesson));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}