package com.example.demo.controller;

import com.example.demo.entity.Homework;
import com.example.demo.entity.Variant;
import com.example.demo.repository.VariantRepository;
import com.example.demo.service.HomeworkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/homework")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class HomeworkController {

    @Autowired
    private HomeworkService homeworkService;

    @Autowired
    private VariantRepository variantRepository;

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createHomework(@RequestBody Map<String, Object> request,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Long tutorId = Long.parseLong(request.get("tutorId").toString());

            // ✅ IDOR FIX: Проверяем, что репетитор создаёт ДЗ от своего имени
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Homework homework = homeworkService.createHomework(
                    tutorId,
                    Long.parseLong(request.get("studentId").toString()),
                    (String) request.get("task"),
                    request.get("dueDate") != null ?
                            LocalDateTime.parse(request.get("dueDate").toString()) : null,
                    (String) request.get("status")
            );
            return ResponseEntity.ok(homework);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getHomeworkByStudent(@PathVariable Long studentId,
                                                  @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                  @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            // ✅ IDOR FIX: Проверяем права доступа
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Homework> homework = homeworkService.getHomeworkByStudent(studentId);
            return ResponseEntity.ok(homework);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/all")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getAllHomeworkForStudent(@PathVariable Long studentId,
                                                      @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                      @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            // ✅ IDOR FIX: Проверяем права доступа
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Homework> homework = homeworkService.getHomeworkByStudent(studentId);

            List<Map<String, Object>> enrichedHomework = new ArrayList<>();
            for (Homework hw : homework) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", hw.getId());
                item.put("task", hw.getTask());
                item.put("dueDate", hw.getDueDate());
                item.put("status", hw.getStatus());
                item.put("grade", hw.getGrade());
                item.put("score", hw.getScore());
                item.put("maxScore", hw.getMaxScore());
                item.put("percentage", hw.getPercentage());
                item.put("feedback", hw.getFeedback());
                item.put("createdAt", hw.getCreatedAt());
                item.put("submittedAt", hw.getSubmittedAt());

                if (hw.getTask() != null && hw.getTask().startsWith("http")) {
                    item.put("type", "variant");
                    item.put("url", hw.getTask());

                    Optional<Variant> variantOpt = variantRepository.findByUrl(hw.getTask());
                    if (variantOpt.isPresent()) {
                        Variant variant = variantOpt.get();
                        item.put("variantTitle", variant.getTitle());
                        item.put("variantSubject", variant.getSubject());
                    } else {
                        item.put("variantTitle", "Вариант");
                    }
                } else {
                    item.put("type", "homework");
                }

                enrichedHomework.add(item);
            }

            return ResponseEntity.ok(enrichedHomework);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/status/{status}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getHomeworkByStudentAndStatus(@PathVariable Long studentId,
                                                           @PathVariable String status,
                                                           @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                           @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            // ✅ IDOR FIX: Проверяем права доступа
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Homework> homework = homeworkService.getHomeworkByStudentAndStatus(studentId, status);
            return ResponseEntity.ok(homework);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getHomeworkById(@PathVariable Long id,
                                             @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                             @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Homework homework = homeworkService.getHomeworkById(id);

            // ✅ IDOR FIX: Проверяем права доступа в зависимости от роли
            if ("ROLE_TUTOR".equals(userRole)) {
                if (!homework.getTutor().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!homework.getStudent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_PARENT".equals(userRole)) {
                if (homework.getStudent().getParent() == null ||
                        !homework.getStudent().getParent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            return ResponseEntity.ok(homework);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateTask(@PathVariable Long id,
                                        @RequestBody Map<String, Object> request,
                                        @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Homework homework = homeworkService.getHomeworkById(id);

            // ✅ IDOR FIX: Проверяем, что ДЗ принадлежит текущему репетитору
            if (!homework.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Homework updatedHomework = homeworkService.updateTask(
                    id,
                    (String) request.get("task"),
                    request.get("dueDate") != null ?
                            LocalDateTime.parse(request.get("dueDate").toString()) : null
            );
            return ResponseEntity.ok(updatedHomework);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitHomework(@PathVariable Long id,
                                            @RequestBody Map<String, String> request,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Homework homework = homeworkService.getHomeworkById(id);

            // ✅ IDOR FIX: Проверяем, что ученик сдаёт СВОЁ ДЗ
            if (!homework.getStudent().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Homework submittedHomework = homeworkService.submitHomework(
                    id,
                    request.get("attachments")
            );
            return ResponseEntity.ok(submittedHomework);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/grade-with-score")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> gradeHomeworkWithScore(@PathVariable Long id,
                                                    @RequestBody Map<String, Object> request,
                                                    @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Homework homework = homeworkService.getHomeworkById(id);

            // ✅ IDOR FIX: Проверяем, что ДЗ принадлежит текущему репетитору
            if (!homework.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Integer score = request.get("score") != null ?
                    Integer.parseInt(request.get("score").toString()) : null;
            Integer maxScore = request.get("maxScore") != null ?
                    Integer.parseInt(request.get("maxScore").toString()) : null;
            String feedback = (String) request.get("feedback");

            Homework gradedHomework = homeworkService.gradeHomeworkWithScore(id, score, maxScore, feedback);
            return ResponseEntity.ok(gradedHomework);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/grade")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> gradeHomework(@PathVariable Long id,
                                           @RequestBody Map<String, Object> request,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Homework homework = homeworkService.getHomeworkById(id);

            // ✅ IDOR FIX: Проверяем, что ДЗ принадлежит текущему репетитору
            if (!homework.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Integer grade = request.get("grade") != null ?
                    Integer.parseInt(request.get("grade").toString()) : null;
            String feedback = (String) request.get("feedback");

            Homework gradedHomework = homeworkService.gradeHomework(id, grade, feedback);
            return ResponseEntity.ok(gradedHomework);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/revision")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> requestRevision(@PathVariable Long id,
                                             @RequestBody Map<String, String> request,
                                             @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Homework homework = homeworkService.getHomeworkById(id);

            // ✅ IDOR FIX: Проверяем, что ДЗ принадлежит текущему репетитору
            if (!homework.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Homework revisedHomework = homeworkService.requestRevision(
                    id,
                    request.get("feedback")
            );
            return ResponseEntity.ok(revisedHomework);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteHomework(@PathVariable Long id,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Homework homework = homeworkService.getHomeworkById(id);

            // ✅ IDOR FIX: Проверяем, что ДЗ принадлежит текущему репетитору
            if (!homework.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            homeworkService.deleteHomework(id);
            return ResponseEntity.ok(Map.of("message", "Домашнее задание успешно удалено"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats/student/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getHomeworkStatsByStudent(@PathVariable Long studentId,
                                                       @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                       @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            // ✅ IDOR FIX: Проверяем права доступа
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Map<String, Long> stats = homeworkService.getHomeworkStatsByStudent(studentId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/progress/student/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getDetailedProgressStats(@PathVariable Long studentId,
                                                      @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                      @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            // ✅ IDOR FIX: Проверяем права доступа
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Map<String, Object> stats = homeworkService.getDetailedProgressStats(studentId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getHomeworkByTutor(@PathVariable Long tutorId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            // ✅ IDOR FIX: Проверяем, что репетитор запрашивает СВОИ ДЗ
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Homework> homework = homeworkService.getHomeworkByTutor(tutorId);
            return ResponseEntity.ok(homework);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/is-overdue")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> isOverdue(@PathVariable Long id,
                                       @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                       @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Homework homework = homeworkService.getHomeworkById(id);

            // ✅ IDOR FIX: Проверяем права доступа
            if ("ROLE_TUTOR".equals(userRole)) {
                if (!homework.getTutor().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!homework.getStudent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_PARENT".equals(userRole)) {
                if (homework.getStudent().getParent() == null ||
                        !homework.getStudent().getParent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            boolean overdue = homeworkService.isOverdue(id);
            return ResponseEntity.ok(Map.of("isOverdue", overdue));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}