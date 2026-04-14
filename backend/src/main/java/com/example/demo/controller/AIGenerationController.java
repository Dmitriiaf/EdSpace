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
@CrossOrigin(origins = "http://localhost:3000")
public class AIGenerationController {

    @Autowired
    private AIGenerationService aiService;

    @Autowired
    private TaskBankRepository taskBankRepository;

    @Autowired
    private TutorRepository tutorRepository;  // ✅ Добавлен репозиторий

    @PostMapping("/generate")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> generateTask(@RequestBody Map<String, String> request) {
        try {
            String prompt = request.get("prompt");
            String subject = request.get("subject");
            String examType = request.get("examType");
            String taskType = request.getOrDefault("taskType", "");

            TaskBank task = aiService.generateTaskWithRAG(prompt, subject, examType, taskType);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            log.error("Ошибка генерации задания: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/save")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> saveGeneratedTask(@RequestBody TaskBank task,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {  // ✅ Получаем ID репетитора
        try {
            // ✅ Устанавливаем репетитора, создавшего задание
            if (currentUserId != null) {
                Tutor tutor = tutorRepository.findById(currentUserId)
                        .orElseThrow(() -> new RuntimeException("Репетитор не найден"));
                task.setTutor(tutor);
                log.info("Задание сохранено репетитором: {} (ID: {})", tutor.getFullName(), tutor.getId());
            } else {
                log.warn("Задание сохранено без привязки к репетитору");
            }

            TaskBank saved = taskBankRepository.save(task);
            return ResponseEntity.ok(Map.of(
                    "message", "Задание сохранено",
                    "task", saved
            ));
        } catch (Exception e) {
            log.error("Ошибка сохранения задания: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rate/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> rateTask(@PathVariable Long id, @RequestBody Map<String, Integer> request) {
        try {
            Integer rating = request.get("rating");
            if (rating == null || rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body(Map.of("error", "Оценка должна быть от 1 до 5"));
            }

            TaskBank task = taskBankRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Задание не найдено"));

            // ✅ Простая система рейтинга (можно улучшить)
            task.setRating(task.getRating() == null ? rating : (task.getRating() + rating) / 2);
            task.setRatingCount(task.getRatingCount() == null ? 1 : task.getRatingCount() + 1);

            taskBankRepository.save(task);

            return ResponseEntity.ok(Map.of(
                    "message", "Оценка сохранена",
                    "rating", task.getRating(),
                    "ratingCount", task.getRatingCount()
            ));
        } catch (Exception e) {
            log.error("Ошибка оценки задания: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}