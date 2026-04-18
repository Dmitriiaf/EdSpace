package com.example.demo.controller;

import com.example.demo.entity.TaskBank;
import com.example.demo.entity.Tutor;
import com.example.demo.repository.TaskBankRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.service.AIGenerationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru"
}, allowCredentials = "true")
public class AIGenerationController {

    @Autowired
    private AIGenerationService aiService;

    @Autowired
    private TaskBankRepository taskBankRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @PostMapping("/generate")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> generateTask(@RequestBody Map<String, String> request,
                                          @RequestAttribute("userId") Long tutorId) {
        try {
            String prompt = request.get("prompt");
            String subject = request.get("subject");
            String examType = request.get("examType");
            String taskType = request.getOrDefault("taskType", "");

            // 1. Генерируем задание (пока без привязки)
            TaskBank task = aiService.generateTaskWithRAG(prompt, subject, examType, taskType);

            // 2. ✅ СРАЗУ ЖЕСТКО ПРИВЯЗЫВАЕМ К РЕПЕТИТОРУ
            Tutor tutor = tutorRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Репетитор не найден"));
            task.setTutor(tutor);
            task.setIsPublic(false);
            // 3. ✅ ДОПОЛНИТЕЛЬНАЯ СТРАХОВКА: Принудительно ставим isPublic = false (если нужно)
            // task.setIsPublic(false); // Раскомментируй, если хочешь, чтобы все ИИ-задания были приватными по умолчанию

            log.info("✅ Задание сгенерировано и привязано к репетитору: {} (ID: {})", tutor.getFullName(), tutor.getId());

            return ResponseEntity.ok(task);
        } catch (Exception e) {
            log.error("❌ Ошибка генерации задания: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/save")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> saveGeneratedTask(@RequestBody TaskBank task,
                                               @RequestAttribute("userId") Long currentUserId) {
        try {
            // ✅ На всякий случай перепроверяем при сохранении
            if (task.getTutor() == null || !task.getTutor().getId().equals(currentUserId)) {
                Tutor tutor = tutorRepository.findById(currentUserId)
                        .orElseThrow(() -> new RuntimeException("Репетитор не найден"));
                task.setTutor(tutor);
                log.warn("⚠️ Задание при сохранении было без репетитора, привязали принудительно.");
            }

            TaskBank saved = taskBankRepository.save(task);
            log.info("💾 Задание сохранено репетитором: {} (ID: {})", saved.getTutor().getFullName(), saved.getTutor().getId());

            return ResponseEntity.ok(Map.of(
                    "message", "Задание сохранено",
                    "task", saved
            ));
        } catch (Exception e) {
            log.error("❌ Ошибка сохранения задания: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rate/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> rateTask(@PathVariable Long id,
                                      @RequestBody Map<String, Integer> request,
                                      @RequestAttribute("userId") Long tutorId) {
        try {
            Integer rating = request.get("rating");
            if (rating == null || rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body(Map.of("error", "Оценка должна быть от 1 до 5"));
            }

            TaskBank task = taskBankRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Задание не найдено"));

            // ✅ IDOR FIX: Проверяем, что задание принадлежит репетитору или публичное
            if (task.getTutor() != null &&
                    !task.getTutor().getId().equals(tutorId) &&
                    !Boolean.TRUE.equals(task.getIsPublic())) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            task.setRating(task.getRating() == null ? rating : (task.getRating() + rating) / 2);
            task.setRatingCount(task.getRatingCount() == null ? 1 : task.getRatingCount() + 1);

            taskBankRepository.save(task);

            return ResponseEntity.ok(Map.of(
                    "message", "Оценка сохранена",
                    "rating", task.getRating(),
                    "ratingCount", task.getRatingCount()
            ));
        } catch (Exception e) {
            log.error("❌ Ошибка оценки задания: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}