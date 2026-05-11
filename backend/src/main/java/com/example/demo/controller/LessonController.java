// ========== LessonController.java (исправленный) ==========
package com.example.demo.controller;

import com.example.demo.entity.Lesson;
import com.example.demo.entity.Parent;
import com.example.demo.entity.Student;
import com.example.demo.entity.Subscription;
import com.example.demo.entity.Tutor;
import com.example.demo.service.LessonService;
import com.example.demo.service.LessonGeneratorService;
import com.example.demo.service.SubscriptionService;
import com.example.demo.service.NotificationService;
import com.example.demo.service.StudentService;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.SubscriptionRepository;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.TutorRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.PatchMapping;
@Slf4j
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

    @GetMapping("/tutor/{tutorId}/date/{date}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getLessonsByTutorAndDate(
            @PathVariable Long tutorId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            List<Lesson> lessons = lessonService.getLessonsByTutorAndDate(tutorId, date);
            return ResponseEntity.ok(lessons);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    @GetMapping("/tutor/{tutorId}/range")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getLessonsByTutorAndDateRange(
            @PathVariable Long tutorId,
            @RequestParam String start,
            @RequestParam String end) {
        try {
            LocalDate startDate = LocalDate.parse(start);
            LocalDate endDate = LocalDate.parse(end);
            List<Lesson> lessons = lessonService.getLessonsByTutorAndDateRange(tutorId, startDate, endDate);
            return ResponseEntity.ok(lessons);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Заменить отменённый урок на отработку долга
     */
    @PostMapping("/{id}/replace-with-resurrect")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> replaceCancelledWithResurrect(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request,
            @RequestAttribute(name = "userId", required = false) Long currentUserId) {

        try {
            Long debtorStudentId = request.get("debtorStudentId");

            if (debtorStudentId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Не указан ID должника"));
            }

            Lesson cancelledLesson = lessonService.getLessonById(id);

            boolean hasTutor = cancelledLesson.getStudent().getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            if (!"CANCELLED".equals(cancelledLesson.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Можно заменить только отменённый урок"));
            }

            Student debtor = studentService.getStudentById(debtorStudentId);

            boolean debtorHasTutor = debtor.getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!debtorHasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ к должнику запрещён"));
            }

            boolean hasDebt = false;
            if ("subscription".equals(debtor.getPaymentTypeForTutor(currentUserId))) {
                Optional<Subscription> activeSubOpt = subscriptionRepository
                        .findByStudentIdAndTutorIdAndStatus(debtorStudentId, currentUserId, "ACTIVE");
                if (activeSubOpt.isPresent()) {
                    Subscription sub = activeSubOpt.get();
                    hasDebt = sub.getDebtLessons() != null && sub.getDebtLessons() > 0;
                }
            } else {
                hasDebt = debtor.getMissedLessons() != null && debtor.getMissedLessons() > 0;
            }

            if (!hasDebt) {
                return ResponseEntity.badRequest().body(Map.of("error", "У ученика нет долгов"));
            }

            // Время из cancelledLesson уже в UTC, используем как есть
            Lesson newLesson = lessonService.createLesson(
                    currentUserId,
                    debtorStudentId,
                    cancelledLesson.getCourse() != null ? cancelledLesson.getCourse().getId() : null,
                    cancelledLesson.getLessonDate(),
                    cancelledLesson.getStartTime(),
                    cancelledLesson.getEndTime()
            );

            newLesson.setDuration(cancelledLesson.getDuration());
            newLesson.setOriginalLesson(cancelledLesson);
            newLesson.setStatus("SCHEDULED");
            lessonService.saveLesson(newLesson);

            boolean debtReduced = false;
            if ("subscription".equals(debtor.getPaymentTypeForTutor(currentUserId))) {
                Optional<Subscription> activeSubOpt = subscriptionRepository
                        .findByStudentIdAndTutorIdAndStatus(debtorStudentId, currentUserId, "ACTIVE");
                if (activeSubOpt.isPresent()) {
                    Subscription sub = activeSubOpt.get();
                    if (sub.getDebtLessons() != null && sub.getDebtLessons() > 0) {
                        sub.setDebtLessons(sub.getDebtLessons() - 1);
                        subscriptionRepository.save(sub);
                        debtReduced = true;
                    }
                }
            } else {
                if (debtor.getMissedLessons() != null && debtor.getMissedLessons() > 0) {
                    debtor.setMissedLessons(debtor.getMissedLessons() - 1);
                    studentRepository.save(debtor);
                    debtReduced = true;
                }
            }

            cancelledLesson.setStatus("RESCHEDULED");
            cancelledLesson.setUpdatedAt(LocalDateTime.now());
            lessonService.saveLesson(cancelledLesson);

            if (debtor.getParent() != null) {
                String message = String.format(
                        "🔄 Отработка пропущенного занятия!\nУченик %s посетит занятие %s в %s вместо отменённого урока.",
                        debtor.getFullName(),
                        cancelledLesson.getLessonDate().toString(),
                        cancelledLesson.getStartTime().toString().substring(0, 5)
                );
                notificationService.createNotification(
                        debtor.getParent().getId(),
                        newLesson.getId(),
                        message
                );
            }

            log.debug("Отменённый урок id={} заменён на отработку долга ученика id={}", id, debtorStudentId);

            return ResponseEntity.ok(Map.of(
                    "message", debtReduced ? "✅ Долг списан, урок создан" : "✅ Урок создан",
                    "lesson", newLesson,
                    "debtReduced", debtReduced
            ));

        } catch (RuntimeException e) {
            log.error("Ошибка при замене урока на отработку долга: {}", e.getMessage());
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

            Tutor tutor = tutorRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Репетитор не найден"));
            String tutorTimezone = tutor.getTimezone() != null ? tutor.getTimezone() : "Asia/Krasnoyarsk";

            LocalDate localLessonDate = LocalDate.parse(request.get("lessonDate").toString());

            String startTimeStr = request.get("startTime").toString();
            boolean isMidnight = "24:00:00".equals(startTimeStr) || "24:00".equals(startTimeStr);
            if (isMidnight) {
                startTimeStr = "00:00:00";
            }
            LocalTime localStartTime = LocalTime.parse(startTimeStr);

            if (isMidnight) {
                localLessonDate = localLessonDate.plusDays(1);
            }

            ZonedDateTime tutorZonedDateTime = ZonedDateTime.of(localLessonDate, localStartTime, ZoneId.of(tutorTimezone));
            ZonedDateTime utcZonedDateTime = tutorZonedDateTime.withZoneSameInstant(ZoneId.of("UTC"));

            LocalDate utcLessonDate = utcZonedDateTime.toLocalDate();
            LocalTime utcStartTime = utcZonedDateTime.toLocalTime();
            LocalTime utcEndTime = utcStartTime.plusMinutes(duration);

            Lesson lesson = lessonService.createLesson(
                    tutorId,
                    Long.parseLong(request.get("studentId").toString()),
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    utcLessonDate,
                    utcStartTime,
                    utcEndTime
            );

            lesson.setDuration(duration);
            if (lesson.getBoardRoomName() == null || lesson.getBoardRoomName().isEmpty()) {
                lesson.setBoardRoomName("edspace-board-" + java.util.UUID.randomUUID().toString().substring(0, 8));
            }
            if (lesson.getJitsiRoomName() == null || lesson.getJitsiRoomName().isEmpty()) {
                lesson.setJitsiRoomName("edspace-jitsi-" + java.util.UUID.randomUUID().toString().substring(0, 8));
            }
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

            if (lesson.getOriginalLesson() != null && "RESCHEDULED".equals(lesson.getStatus())) {
                completedLesson = lessonService.completeRescheduledLesson(id, notes, nextLessonPlan);
            } else {
                completedLesson = lessonService.completeLesson(id, notes, nextLessonPlan);
            }

            boolean isSubscription = "subscription".equals(
                    completedLesson.getStudent().getPaymentTypeForTutor(completedLesson.getTutor().getId())
            );

            if (!isSubscription) {
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
            boolean isNoShow = "ROLE_TUTOR".equals(userRole);

            lesson.setStatus("CANCELLED");

            if (isNoShow) {
                lesson.setNotes("❌ Ученик не пришёл");
            } else {
                lesson.setNotes(reason != null && !reason.isEmpty() ? "❌ Отменено: " + reason : "❌ Отменено");
            }

            Student student = lesson.getStudent();

            if (isNoShow) {
                log.debug("isNoShow=true, student={}, paymentType={}", student.getFullName(), student.getPaymentType());

                if ("subscription".equals(student.getPaymentTypeForTutor(currentUserId))) {
                    log.debug("Ищем ACTIVE абонемент для studentId={}, tutorId={}", student.getId(), currentUserId);

                    Optional<Subscription> activeSubOpt = subscriptionRepository
                            .findByStudentIdAndTutorIdAndStatus(student.getId(), currentUserId, "ACTIVE");

                    if (activeSubOpt.isPresent()) {
                        Subscription sub = activeSubOpt.get();
                        int newDebt = (sub.getDebtLessons() != null ? sub.getDebtLessons() : 0) + 1;
                        sub.setDebtLessons(newDebt);
                        subscriptionRepository.save(sub);
                        log.debug("Долг обновлён! id={}, debt_lessons={}", sub.getId(), newDebt);
                    } else {
                        log.debug("ACTIVE абонемент НЕ НАЙДЕН!");
                    }
                } else {
                    int newMissed = (student.getMissedLessons() != null ? student.getMissedLessons() : 0) + 1;
                    student.setMissedLessons(newMissed);
                    studentRepository.save(student);
                    log.debug("Пропуск обновлён! missed_lessons={}", newMissed);
                }
            }

            Lesson savedLesson = lessonService.saveLesson(lesson);

            if (student.getParent() != null) {
                String message = isNoShow ?
                        String.format("❌ Ученик %s не пришёл на занятие %s %s.",
                                student.getFullName(), lesson.getLessonDate(), lesson.getStartTime().toString().substring(0, 5)) :
                        String.format("❌ Урок отменён.");
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

            Tutor tutor = tutorRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("Репетитор не найден"));
            String tutorTimezone = tutor.getTimezone() != null ? tutor.getTimezone() : "Asia/Krasnoyarsk";

            LocalDate localNewDate = LocalDate.parse(request.get("newDate").toString());

            String newStartTimeStr = request.get("newStartTime").toString();
            boolean isMidnightStart = "24:00:00".equals(newStartTimeStr) || "24:00".equals(newStartTimeStr);
            if (isMidnightStart) {
                newStartTimeStr = "00:00:00";
            }
            LocalTime localNewStartTime = LocalTime.parse(newStartTimeStr);

            String newEndTimeStr = request.get("newEndTime").toString();
            boolean isMidnightEnd = "24:00:00".equals(newEndTimeStr) || "24:00".equals(newEndTimeStr);
            if (isMidnightEnd) {
                newEndTimeStr = "00:00:00";
            }
            LocalTime localNewEndTime = LocalTime.parse(newEndTimeStr);

            if (isMidnightStart) {
                localNewDate = localNewDate.plusDays(1);
            }

            ZonedDateTime tutorZonedStart = ZonedDateTime.of(localNewDate, localNewStartTime, ZoneId.of(tutorTimezone));
            ZonedDateTime tutorZonedEnd = ZonedDateTime.of(localNewDate, localNewEndTime, ZoneId.of(tutorTimezone));
            ZonedDateTime utcZonedStart = tutorZonedStart.withZoneSameInstant(ZoneId.of("UTC"));
            ZonedDateTime utcZonedEnd = tutorZonedEnd.withZoneSameInstant(ZoneId.of("UTC"));

            Lesson rescheduledLesson = lessonService.rescheduleLesson(
                    id,
                    utcZonedStart.toLocalDate(),
                    utcZonedStart.toLocalTime(),
                    utcZonedEnd.toLocalTime()
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

            if (studentId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Не указан studentId"));
            }

            Tutor tutor = tutorRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("Репетитор не найден"));
            String tutorTimezone = tutor.getTimezone() != null ? tutor.getTimezone() : "Asia/Krasnoyarsk";

            LocalDate localNewDate = LocalDate.parse(request.get("newDate").toString());

            String newStartTimeStr = request.get("newStartTime").toString();
            boolean isMidnight = "24:00:00".equals(newStartTimeStr) || "24:00".equals(newStartTimeStr);
            if (isMidnight) {
                newStartTimeStr = "00:00:00";
                localNewDate = localNewDate.plusDays(1);
            }
            LocalTime newStartTime = LocalTime.parse(newStartTimeStr);

            String newEndTimeStr = request.get("newEndTime").toString();
            boolean isMidnightEnd = "24:00:00".equals(newEndTimeStr) || "24:00".equals(newEndTimeStr);
            if (isMidnightEnd) {
                newEndTimeStr = "00:00:00";
            }
            LocalTime newEndTime = LocalTime.parse(newEndTimeStr);

            ZonedDateTime tutorZonedStart = ZonedDateTime.of(localNewDate, newStartTime, ZoneId.of(tutorTimezone));
            ZonedDateTime utcZonedStart = tutorZonedStart.withZoneSameInstant(ZoneId.of("UTC"));
            ZonedDateTime utcZonedEnd = utcZonedStart.plusMinutes(
                    java.time.Duration.between(newStartTime, newEndTime).toMinutes()
            ).withZoneSameInstant(ZoneId.of("UTC"));

            log.debug("[RESURRECT] studentId={}, tutorId={}", studentId, currentUserId);

            Student student = studentService.getStudentById(studentId);
            log.debug("[RESURRECT] student: {}, paymentType={}", student.getFullName(), student.getPaymentType());

            boolean hasTutor = student.getTutors().stream().anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));

            Lesson newLesson = lessonService.createLesson(
                    currentUserId, studentId, null,
                    utcZonedStart.toLocalDate(),
                    utcZonedStart.toLocalTime(),
                    utcZonedEnd.toLocalTime()
            );

            boolean debtReduced = false;

            if ("subscription".equals(student.getPaymentTypeForTutor(currentUserId))) {
                log.debug("[RESURRECT] Looking for active subscription: studentId={}, tutorId={}", studentId, currentUserId);

                Optional<Subscription> activeSubOpt = subscriptionRepository
                        .findByStudentIdAndTutorIdAndStatus(studentId, currentUserId, "ACTIVE");

                if (activeSubOpt.isPresent()) {
                    Subscription sub = activeSubOpt.get();
                    log.debug("[RESURRECT] Found subscription id={}, debt_lessons={}", sub.getId(), sub.getDebtLessons());

                    if (sub.getDebtLessons() != null && sub.getDebtLessons() > 0) {
                        sub.setDebtLessons(sub.getDebtLessons() - 1);
                        subscriptionRepository.save(sub);
                        debtReduced = true;
                        log.debug("[RESURRECT] Debt reduced to {}", sub.getDebtLessons());
                    } else {
                        log.debug("[RESURRECT] Debt lessons is null or 0");
                    }
                } else {
                    log.debug("[RESURRECT] Active subscription NOT FOUND for studentId={}, tutorId={}", studentId, currentUserId);
                }
            } else {
                log.debug("[RESURRECT] Payment type is NOT subscription, it's: {}", student.getPaymentType());
            }

            String message = debtReduced ? "✅ Долг списан" : "✅ Занятие создано";
            log.debug("[RESURRECT] Final message: {}", message);

            return ResponseEntity.ok(Map.of("message", message, "lesson", newLesson));

        } catch (RuntimeException e) {
            log.error("Ошибка в resurrectLesson: {}", e.getMessage(), e);
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
            boolean isSubscription = "subscription".equals(
                    lesson.getStudent().getPaymentTypeForTutor(lesson.getTutor().getId())
            );
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

            boolean hasTutor = lesson.getStudent().getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            int deletedCount = 1;

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
                    if (!futureLesson.getId().equals(id)) {
                        lessonRepository.delete(futureLesson);
                        deletedCount++;
                    }
                }
            }

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

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateLessonStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Статус не указан"));
        }

        // Разрешённые статусы для ручного изменения
        if (!List.of("PAID", "COMPLETED", "CANCELLED").contains(newStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Недопустимый статус"));
        }

        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Занятие не найдено"));

        // Можно менять статус только у COMPLETED → PAID
        if ("PAID".equals(newStatus) && !"COMPLETED".equals(lesson.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Оплатить можно только проведённое занятие"));
        }

        lesson.setStatus(newStatus);
        lessonRepository.save(lesson);

        return ResponseEntity.ok(Map.of("message", "Статус обновлён", "status", newStatus));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> startLesson(@PathVariable Long id,
                                         @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Lesson lesson = lessonService.getLessonById(id);
            boolean hasTutor = lesson.getStudent().getTutors().stream().anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            if (!Lesson.STATUS_SCHEDULED.equals(lesson.getStatus()) && !"RESCHEDULED".equals(lesson.getStatus())) {
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