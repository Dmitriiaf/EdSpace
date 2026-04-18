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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lessons")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru"
}, allowCredentials = "true")
public class LessonController {

    @Autowired
    private LessonService lessonService;

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
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        if (!tutorId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        try {
            List<Lesson> lessons = lessonService.getAllLessons(tutorId);
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
                List<Lesson> lessons = lessonService.getLessonsByStudent(id);
                allLessons.addAll(lessons);
            }

            List<Lesson> uniqueLessons = allLessons.stream()
                    .collect(Collectors.toMap(Lesson::getId, lesson -> lesson, (existing, replacement) -> existing))
                    .values()
                    .stream()
                    .collect(Collectors.toList());

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
            Lesson lesson = lessonService.createLesson(
                    tutorId,
                    Long.parseLong(request.get("studentId").toString()),
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    LocalDate.parse(request.get("lessonDate").toString()),
                    LocalTime.parse(request.get("startTime").toString()),
                    LocalTime.parse(request.get("endTime").toString())
            );
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

            Lesson completedLesson = lessonService.completeLesson(id, notes, nextLessonPlan);

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
            return ResponseEntity.ok(Map.of(
                    "message", "Оплата подтверждена",
                    "lesson", paidLesson
            ));
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

            // Проверки прав доступа (без изменений)
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
                boolean isChildLesson = parent.getChildren().stream()
                        .anyMatch(child -> child.getId().equals(lesson.getStudent().getId()));
                if (!isChildLesson) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            String reason = request != null ? request.get("reason") : null;

            // ✅ НОВАЯ ЛОГИКА: Если урок уже IN_PROGRESS и его отменяет репетитор — ученик не пришёл
            if (Lesson.STATUS_IN_PROGRESS.equals(lesson.getStatus()) && "ROLE_TUTOR".equals(userRole)) {
                lesson.setStatus(Lesson.STATUS_CANCELLED);
                if (reason != null && !reason.isEmpty()) {
                    lesson.setNotes("❌ Ученик не пришёл: " + reason);
                } else {
                    lesson.setNotes("❌ Ученик не пришёл");
                }

                // Создаём долг, но НЕ списываем занятие из абонемента
                if ("subscription".equals(lesson.getStudent().getPaymentType())) {
                    List<Subscription> activeSubs = subscriptionRepository.findActiveByStudentId(lesson.getStudent().getId());
                    if (!activeSubs.isEmpty()) {
                        Subscription sub = activeSubs.get(0);
                        sub.setDebtLessons(sub.getDebtLessons() != null ? sub.getDebtLessons() + 1 : 1);
                        subscriptionRepository.save(sub);
                    }
                }

                Lesson savedLesson = lessonService.saveLesson(lesson);
                return ResponseEntity.ok(savedLesson);
            }

            // Для всех остальных случаев — стандартная отмена
            Lesson cancelledLesson = lessonService.cancelLesson(id, reason);

            // Если урок был SCHEDULED и у ученика абонемент — создаём долг
            if (Lesson.STATUS_SCHEDULED.equals(lesson.getStatus()) && "subscription".equals(cancelledLesson.getStudent().getPaymentType())) {
                List<Subscription> activeSubs = subscriptionRepository.findActiveByStudentId(cancelledLesson.getStudent().getId());
                if (!activeSubs.isEmpty()) {
                    Subscription sub = activeSubs.get(0);
                    sub.setDebtLessons(sub.getDebtLessons() != null ? sub.getDebtLessons() + 1 : 1);
                    subscriptionRepository.save(sub);
                }
            }

            return ResponseEntity.ok(cancelledLesson);
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

            Lesson updatedLesson = lessonService.addNotes(
                    id,
                    request.get("notes"),
                    request.get("nextLessonPlan")
            );
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
            return ResponseEntity.ok(Map.of(
                    "message", "Занятие успешно перенесено",
                    "lesson", rescheduledLesson
            ));
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
            return ResponseEntity.ok(Map.of(
                    "message", "Занятия созданы на месяц вперёд (только новые, существующие не изменены)",
                    "period", Map.of("start", today, "end", endDate)
            ));
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
            Long originalLessonId = null;
            if (request.get("originalLessonId") != null) {
                originalLessonId = Long.parseLong(request.get("originalLessonId").toString());
            }

            Long studentId = null;
            if (request.get("studentId") != null) {
                studentId = Long.parseLong(request.get("studentId").toString());
            }

            LocalDate newDate = LocalDate.parse(request.get("newDate").toString());
            LocalTime newStartTime = LocalTime.parse(request.get("newStartTime").toString());
            LocalTime newEndTime = LocalTime.parse(request.get("newEndTime").toString());

            if (originalLessonId != null) {
                Lesson originalLesson = lessonService.getLessonById(originalLessonId);

                boolean hasTutor = originalLesson.getStudent().getTutors().stream()
                        .anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }

                Lesson newLesson = lessonService.createLesson(
                        currentUserId,
                        originalLesson.getStudent().getId(),
                        originalLesson.getCourse() != null ? originalLesson.getCourse().getId() : null,
                        newDate,
                        newStartTime,
                        newEndTime
                );

                if ("subscription".equals(originalLesson.getStudent().getPaymentType())) {
                    List<Subscription> activeSubs = subscriptionRepository.findActiveByStudentId(originalLesson.getStudent().getId());
                    if (!activeSubs.isEmpty()) {
                        Subscription sub = activeSubs.get(0);
                        if (sub.getDebtLessons() != null && sub.getDebtLessons() > 0) {
                            sub.setDebtLessons(sub.getDebtLessons() - 1);
                            subscriptionRepository.save(sub);
                        }
                    }
                }

                return ResponseEntity.ok(Map.of(
                        "message", "Пропущенное занятие успешно отработано",
                        "lesson", newLesson
                ));
            }

            if (studentId != null) {
                Student student = studentService.getStudentById(studentId);

                boolean hasTutor = student.getTutors().stream()
                        .anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }

                Lesson newLesson = lessonService.createLesson(
                        currentUserId,
                        studentId,
                        null,
                        newDate,
                        newStartTime,
                        newEndTime
                );

                if ("subscription".equals(student.getPaymentType())) {
                    List<Subscription> activeSubs = subscriptionRepository.findActiveByStudentId(studentId);
                    if (!activeSubs.isEmpty()) {
                        Subscription sub = activeSubs.get(0);
                        if (sub.getDebtLessons() != null && sub.getDebtLessons() > 0) {
                            sub.setDebtLessons(sub.getDebtLessons() - 1);
                            subscriptionRepository.save(sub);
                        }
                    }
                }

                return ResponseEntity.ok(Map.of(
                        "message", "Пропущенное занятие успешно отработано",
                        "lesson", newLesson
                ));
            }

            return ResponseEntity.badRequest().body(Map.of("error", "Не указан originalLessonId или studentId"));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Отметка начала звонка (переводит урок в IN_PROGRESS)
    @PostMapping("/{id}/call-started")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> markCallStarted(@PathVariable Long id,
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
            }

            if (Lesson.STATUS_SCHEDULED.equals(lesson.getStatus())) {
                lesson.setStatus(Lesson.STATUS_IN_PROGRESS);
                lesson.setCallStartedAt(LocalDateTime.now());
                lessonService.saveLesson(lesson);
            }

            return ResponseEntity.ok(Map.of(
                    "callStartedAt", lesson.getCallStartedAt(),
                    "status", lesson.getStatus()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Авто-завершение урока (только если он IN_PROGRESS)
    @PostMapping("/{id}/auto-complete")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> autoCompleteLesson(@PathVariable Long id,
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
                String message = String.format(
                        "✅ Урок по %s с %s (%s %s) завершён автоматически.",
                        lesson.getCourse() != null ? lesson.getCourse().getName() : "занятию",
                        lesson.getStudent().getFullName(),
                        lesson.getLessonDate().toString(),
                        lesson.getStartTime().toString().substring(0, 5)
                );
                notificationService.createNotification(
                        lesson.getStudent().getParent().getId(),
                        lesson.getId(),
                        message
                );
            }

            return ResponseEntity.ok(Map.of(
                    "message", isSubscription ? "Урок завершён автоматически и оплачен из абонемента" : "Урок завершён автоматически",
                    "lesson", savedLesson
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteLesson(@PathVariable Long id,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Lesson lesson = lessonService.getLessonById(id);
            boolean hasTutor = lesson.getStudent().getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            lessonService.deleteLesson(id);
            return ResponseEntity.ok(Map.of("message", "Занятие удалено"));
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

            // IDOR FIX: Проверяем, что урок принадлежит репетитору
            boolean hasTutor = lesson.getStudent().getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            // Проверяем, что урок ещё не начат и не завершён
            if (!Lesson.STATUS_SCHEDULED.equals(lesson.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Урок уже начат или завершён"));
            }

            lesson.setStatus(Lesson.STATUS_IN_PROGRESS);
            lesson.setCallStartedAt(LocalDateTime.now());
            Lesson savedLesson = lessonService.saveLesson(lesson);

            return ResponseEntity.ok(Map.of(
                    "message", "Урок начат",
                    "lesson", savedLesson
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}