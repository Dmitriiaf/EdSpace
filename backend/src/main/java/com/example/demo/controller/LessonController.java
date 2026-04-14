package com.example.demo.controller;

import com.example.demo.entity.Lesson;
import com.example.demo.entity.Parent;
import com.example.demo.entity.Student;
import com.example.demo.service.LessonService;
import com.example.demo.service.LessonGeneratorService;
import com.example.demo.service.SubscriptionService;
import com.example.demo.service.NotificationService;
import com.example.demo.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lessons")
@CrossOrigin(origins = "http://localhost:3000")
public class LessonController {

    @Autowired
    private LessonService lessonService;

    @Autowired
    private LessonGeneratorService lessonGeneratorService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private StudentRepository studentRepository;

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
                // ✅ УСИЛЕННАЯ ПРОВЕРКА: урок должен принадлежать ребёнку ЭТОГО родителя
                Parent parent = lesson.getStudent().getParent();
                if (parent == null) {
                    return ResponseEntity.status(403).body(Map.of("error", "У ученика нет привязанного родителя"));
                }

                if (!parent.getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён — это не ваш ребёнок"));
                }

                // ✅ Дополнительная проверка: урок именно этого ученика
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

            if ("ROLE_TUTOR".equals(userRole)) {
                boolean hasTutor = lesson.getStudent().getTutors().stream()
                        .anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_STUDENT".equals(userRole)) {
                // ✅ Ученик может отменить только СВОЙ урок
                if (!lesson.getStudent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_PARENT".equals(userRole)) {
                // ✅ Родитель может отменить только урок СВОЕГО ребёнка
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
            Lesson cancelledLesson = lessonService.cancelLesson(id, reason);
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
}