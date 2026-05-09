package com.example.demo.controller;

import com.example.demo.entity.Homework;
import com.example.demo.entity.Variant;
import com.example.demo.repository.VariantRepository;
import com.example.demo.service.HomeworkService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.nio.file.Files;

@RestController
@RequestMapping("/api/homework")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
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
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Long courseId = request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null;
            Homework homework = homeworkService.createHomework(
                    tutorId,
                    Long.parseLong(request.get("studentId").toString()),
                    (String) request.get("task"),
                    request.get("dueDate") != null ? LocalDateTime.parse(request.get("dueDate").toString()) : null,
                    (String) request.get("status"),
                    request.get("gradeType") != null ? (String) request.get("gradeType") : "GRADE_5",
                    request.get("maxScore") != null ? Integer.parseInt(request.get("maxScore").toString()) : null,
                    courseId
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
                item.put("gradeType", hw.getGradeType());
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
            if (!homework.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Homework updatedHomework = homeworkService.updateTask(
                    id, (String) request.get("task"),
                    request.get("dueDate") != null ? LocalDateTime.parse(request.get("dueDate").toString()) : null
            );
            return ResponseEntity.ok(updatedHomework);
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
            if (!homework.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Integer score = request.get("score") != null ? Integer.parseInt(request.get("score").toString()) : null;
            Integer maxScore = request.get("maxScore") != null ? Integer.parseInt(request.get("maxScore").toString()) : null;
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
            if (!homework.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Integer grade = request.get("grade") != null ? Integer.parseInt(request.get("grade").toString()) : null;
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
            if (!homework.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Homework revisedHomework = homeworkService.requestRevision(id, request.get("feedback"));
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
                                                      @RequestAttribute(name = "userRole", required = false) String userRole,
                                                      HttpServletRequest request) {
        try {
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Long courseId = null;
            if (request.getParameter("courseId") != null) {
                courseId = Long.parseLong(request.getParameter("courseId"));
            }
            Map<String, Object> stats = homeworkService.getDetailedProgressStats(studentId, courseId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitHomework(@PathVariable Long id,
                                            @RequestParam(value = "answer", required = false) String answer,
                                            @RequestParam(value = "file", required = false) MultipartFile file,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Homework homework = homeworkService.getHomeworkById(id);
            if (!homework.getStudent().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            String attachments = "";
            if (answer != null && !answer.isEmpty()) attachments = answer;
            if (file != null && !file.isEmpty()) {
                String uploadDir = "/opt/EdSpace/uploads/homework/";
                java.io.File dir = new java.io.File(uploadDir);
                if (!dir.exists()) dir.mkdirs();
                String fileName = "hw_" + id + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
                java.io.File dest = new java.io.File(uploadDir + fileName);
                file.transferTo(dest);
                String fileUrl = "/uploads/homework/" + fileName;
                attachments += (attachments.isEmpty() ? "" : "\n") + fileUrl;
            }
            if (attachments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Нужен ответ или файл"));
            }
            // ✅ Вызываем сервис, который создаст уведомление
            Homework submitted = homeworkService.submitHomework(id, attachments);
            return ResponseEntity.ok(Map.of("message", "Задание сдано", "homework", submitted));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/file/{fileName:.+}")
    public ResponseEntity<?> getHomeworkFile(@PathVariable String fileName) {
        try {
            java.io.File file = new java.io.File("/opt/EdSpace/uploads/homework/" + fileName);
            if (!file.exists()) return ResponseEntity.notFound().build();
            byte[] content = Files.readAllBytes(file.toPath());
            String contentType = Files.probeContentType(file.toPath());
            return ResponseEntity.ok()
                    .header("Content-Type", contentType != null ? contentType : "application/octet-stream")
                    .header("Content-Disposition", "inline; filename=\"" + fileName + "\"")
                    .body(content);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getHomeworkByTutor(@PathVariable Long tutorId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
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
            if ("ROLE_TUTOR".equals(userRole)) {
                if (!homework.getTutor().getId().equals(currentUserId)) return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!homework.getStudent().getId().equals(currentUserId)) return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            } else if ("ROLE_PARENT".equals(userRole)) {
                if (homework.getStudent().getParent() == null || !homework.getStudent().getParent().getId().equals(currentUserId))
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            boolean overdue = homeworkService.isOverdue(id);
            return ResponseEntity.ok(Map.of("isOverdue", overdue));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/progress/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTutorStudentsProgress(
            @PathVariable Long tutorId,
            @RequestParam(required = false) Long courseId,
            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Map<String, Object>> result = homeworkService.getTutorStudentsProgress(tutorId, courseId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/progress/student/{studentId}/timeline")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getStudentProgressTimeline(
            @PathVariable Long studentId,
            @RequestParam(required = false) Long courseId,
            @RequestAttribute(name = "userId", required = false) Long currentUserId,
            @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            List<Map<String, Object>> timeline = homeworkService.getStudentProgressTimeline(studentId, courseId);
            return ResponseEntity.ok(Map.of("timeline", timeline));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}