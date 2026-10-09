package com.example.demo.controller;

import com.example.demo.entity.EgeChecklist;
import com.example.demo.service.EgeChecklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ege-checklist")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
@RequiredArgsConstructor
public class EgeChecklistController {

    private final EgeChecklistService checklistService;

    /**
     * Получить чек-лист ученика со статистикой.
     * По умолчанию — ЕГЭ / Информатика.
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getChecklist(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "EGE") String examType,
            @RequestParam(defaultValue = "INF") String subject,
            @RequestAttribute(name = "userId", required = false) Long currentUserId,
            @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            return ResponseEntity.ok(checklistService.getChecklistWithStats(studentId, examType, subject));
        } catch (Exception e) {
            log.error("Ошибка получения чек-листа: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Создать чек-лист ученику (только репетитор).
     */
    @PostMapping("/student/{studentId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createChecklist(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "EGE") String examType,
            @RequestParam(defaultValue = "INF") String subject) {
        try {
            EgeChecklist checklist = checklistService.createChecklist(studentId, examType, subject);
            return ResponseEntity.ok(checklist);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Обновить задание (галочка, заметка).
     */
    @PatchMapping("/item/{itemId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateItem(
            @PathVariable Long itemId,
            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(checklistService.updateItem(itemId, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Все ученики репетитора с их ЕГЭ-чек-листами и статистикой.
     */
    @GetMapping("/tutor/{tutorId}/all")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getAllStudentsWithChecklists(
            @PathVariable Long tutorId,
            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            return ResponseEntity.ok(checklistService.getAllStudentsWithChecklists(tutorId));
        } catch (Exception e) {
            log.error("Ошибка получения чек-листов: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Удалить чек-лист (только репетитор).
     */
    @DeleteMapping("/{checklistId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteChecklist(@PathVariable Long checklistId) {
        try {
            checklistService.deleteChecklist(checklistId);
            return ResponseEntity.ok(Map.of("message", "Чек-лист удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}