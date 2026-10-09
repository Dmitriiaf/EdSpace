package com.example.demo.controller;

import com.example.demo.entity.EgeSolution;
import com.example.demo.entity.EgeSolutionImage;
import com.example.demo.service.EgeSolutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ege-solutions")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
@RequiredArgsConstructor
public class EgeSolutionController {

    private final EgeSolutionService solutionService;

    /**
     * Все разборы. Опционально фильтр по номеру задания.
     * Доступно всем авторизованным.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT', 'SCHOOL_ADMIN')")
    public ResponseEntity<?> getAll(@RequestParam(required = false) Integer taskNumber) {
        try {
            return ResponseEntity.ok(solutionService.getAllSolutions(taskNumber));
        } catch (Exception e) {
            log.error("Ошибка получения разборов: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Один разбор.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT', 'SCHOOL_ADMIN')")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(solutionService.getSolutionById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Статистика: сколько разборов по каждому номеру задания.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT', 'SCHOOL_ADMIN')")
    public ResponseEntity<?> getStats() {
        try {
            return ResponseEntity.ok(solutionService.getStats());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Создать разбор (multipart с картинками).
     */
    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> create(
            @RequestParam Integer taskNumber,
            @RequestParam String title,
            @RequestParam(required = false) String explanation,
            @RequestParam(required = false) String code,
            @RequestParam(required = false, defaultValue = "python") String codeLanguage,
            @RequestParam(required = false) String videoUrl,
            @RequestParam(required = false) String sourceUrl,
            @RequestParam(required = false) List<MultipartFile> images) {
        try {
            EgeSolution s = solutionService.createSolution(
                    taskNumber, title, explanation, code, codeLanguage, videoUrl, sourceUrl, images);
            return ResponseEntity.ok(Map.of("id", s.getId(), "message", "Разбор создан"));
        } catch (Exception e) {
            log.error("Ошибка создания разбора: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Создать разбор (JSON без картинок — быстро).
     */
    @PostMapping(consumes = {"application/json"})
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createJson(@RequestBody Map<String, Object> body) {
        try {
            Integer taskNumber = Integer.parseInt(body.get("taskNumber").toString());
            String title = (String) body.get("title");
            String explanation = (String) body.get("explanation");
            String code = (String) body.get("code");
            String codeLanguage = (String) body.getOrDefault("codeLanguage", "python");
            String videoUrl = (String) body.get("videoUrl");
            String sourceUrl = (String) body.get("sourceUrl");

            EgeSolution s = solutionService.createSolution(
                    taskNumber, title, explanation, code, codeLanguage, videoUrl, sourceUrl, null);
            return ResponseEntity.ok(Map.of("id", s.getId(), "message", "Разбор создан"));
        } catch (Exception e) {
            log.error("Ошибка создания разбора (JSON): ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Обновить разбор (JSON).
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            EgeSolution updated = solutionService.updateSolution(id, body);
            return ResponseEntity.ok(Map.of("id", updated.getId(), "message", "Обновлено"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Добавить картинки к разбору.
     */
    @PostMapping(path = "/{id}/images", consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> addImages(@PathVariable Long id,
                                       @RequestParam("files") List<MultipartFile> files,
                                       @RequestParam(value = "imageType", defaultValue = "SOLUTION") String imageType) {
        try {
            List<EgeSolutionImage> images = solutionService.addImages(id, files, imageType);
            return ResponseEntity.ok(Map.of("message", "Добавлено картинок: " + images.size()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Удалить картинку.
     */
    @DeleteMapping("/image/{imageId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteImage(@PathVariable Long imageId) {
        try {
            solutionService.deleteImage(imageId);
            return ResponseEntity.ok(Map.of("message", "Картинка удалена"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Удалить разбор.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            solutionService.deleteSolution(id);
            return ResponseEntity.ok(Map.of("message", "Разбор удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}