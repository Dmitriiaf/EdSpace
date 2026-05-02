package com.example.demo.controller;

import com.example.demo.entity.Homework;
import com.example.demo.entity.Variant;
import com.example.demo.repository.HomeworkRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.service.VariantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/variants")
@CrossOrigin(origins = "http://localhost:3000")
public class VariantController {

    @Autowired
    private VariantService variantService;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createVariant(@RequestBody Map<String, Object> request,
                                           @RequestAttribute("userId") Long tutorId) {
        try {
            String title = (String) request.get("title");
            String url = (String) request.get("url");
            String description = (String) request.get("description");
            String subject = (String) request.get("subject");
            String examType = (String) request.get("examType");
            Long courseId = request.get("courseId") != null ?
                    Long.parseLong(request.get("courseId").toString()) : null;

            Variant variant = variantService.createVariant(
                    tutorId, title, url, description, subject, examType, courseId);

            return ResponseEntity.ok(variant);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getVariants(@RequestAttribute("userId") Long tutorId,
                                         @RequestParam(required = false) String search) {
        try {
            List<Variant> variants;
            if (search != null && !search.isEmpty()) {
                variants = variantService.searchVariants(tutorId, search);
            } else {
                variants = variantService.getVariantsByTutor(tutorId);
            }
            return ResponseEntity.ok(variants);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getVariantById(@PathVariable Long id) {
        try {
            Variant variant = variantService.getVariantById(id);
            return ResponseEntity.ok(variant);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateVariant(@PathVariable Long id,
                                           @RequestBody Map<String, Object> request) {
        try {
            String title = (String) request.get("title");
            String url = (String) request.get("url");
            String description = (String) request.get("description");
            String subject = (String) request.get("subject");
            String examType = (String) request.get("examType");
            Long courseId = request.get("courseId") != null ?
                    Long.parseLong(request.get("courseId").toString()) : null;

            Variant variant = variantService.updateVariant(
                    id, title, url, description, subject, examType, courseId);

            return ResponseEntity.ok(variant);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteVariant(@PathVariable Long id) {
        try {
            variantService.deleteVariant(id);
            return ResponseEntity.ok(Map.of("message", "Вариант удалён"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> assignVariant(@PathVariable Long id,
                                           @RequestBody Map<String, Object> request,
                                           @RequestAttribute("userId") Long tutorId) {
        try {
            Long studentId = Long.parseLong(request.get("studentId").toString());
            LocalDateTime dueDate = null;
            if (request.get("dueDate") != null) {
                dueDate = LocalDateTime.parse(request.get("dueDate").toString());
            }

            log.debug("НАЗНАЧЕНИЕ ВАРИАНТА: variantId={}, studentId={}, tutorId={}, dueDate={}", id, studentId, tutorId, dueDate);

            Variant variant = variantService.getVariantById(id);
            log.debug("variant URL: {}", variant.getUrl());

            Homework homework = new Homework();
            homework.setTutor(tutorRepository.findById(tutorId).orElse(null));
            homework.setStudent(studentRepository.findById(studentId).orElse(null));
            homework.setTask(variant.getUrl());
            homework.setDueDate(dueDate);
            homework.setStatus("assigned");
            homework.setCreatedAt(LocalDateTime.now());
            homework.setUpdatedAt(LocalDateTime.now());

            Homework saved = homeworkRepository.save(homework);
            log.debug("Homework saved with ID: {}", saved.getId());

            return ResponseEntity.ok(Map.of(
                    "message", "Вариант назначен ученику",
                    "homework", saved
            ));
        } catch (Exception e) {
            log.error("Ошибка назначения варианта: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}