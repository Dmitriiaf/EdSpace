package com.example.demo.controller;

import com.example.demo.entity.Tutor;
import com.example.demo.service.TutorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tutors")
@CrossOrigin(origins = "http://localhost:3000")
public class TutorController {

    @Autowired
    private TutorService tutorService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            Tutor tutor = tutorService.registerTutor(
                    request.get("email"),
                    request.get("password"),
                    request.get("fullName"),
                    request.get("phone")
            );
            return ResponseEntity.ok(tutor);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            Tutor tutor = tutorService.login(
                    request.get("email"),
                    request.get("password")
            );

            tutor.setPasswordHash(null);

            return ResponseEntity.ok(Map.of(
                    "message", "Вход выполнен успешно",
                    "tutor", tutor
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTutorById(@PathVariable Long id) {
        try {
            Tutor tutor = tutorService.getTutorById(id);
            tutor.setPasswordHash(null);
            return ResponseEntity.ok(tutor);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTutor(@PathVariable Long id,
                                         @RequestBody Map<String, String> request) {
        try {
            Tutor tutor = tutorService.updateTutor(
                    id,
                    request.get("phone"),
                    request.get("fullName"),
                    request.get("birthday"),
                    request.get("about"),
                    request.get("city"),
                    request.get("timezone")  // ✅ ДОБАВЛЕН timezone
            );
            tutor.setPasswordHash(null);
            return ResponseEntity.ok(tutor);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ ДОБАВИТЬ ЭТОТ МЕТОД - получение аватара
    @GetMapping("/{id}/avatar")
    public ResponseEntity<?> getAvatar(@PathVariable Long id) {
        try {
            Tutor tutor = tutorService.getTutorById(id);
            String avatar = tutor.getAvatar();
            System.out.println("Запрос аватара для tutor ID: " + id);
            System.out.println("Avatar в БД: " + (avatar != null ? "есть" : "нет"));
            // ✅ Исправлено: если avatar == null, возвращаем пустую строку
            return ResponseEntity.ok(Map.of("avatar", avatar != null ? avatar : ""));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<?> uploadAvatar(@PathVariable Long id,
                                          @RequestBody Map<String, String> request) {
        try {
            String avatar = request.get("avatar");
            // ✅ Добавлена проверка на null
            if (avatar == null || avatar.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Аватар не может быть пустым"));
            }
            tutorService.updateAvatar(id, avatar);
            return ResponseEntity.ok(Map.of("message", "Фото успешно загружено"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Long id,
                                            @RequestBody Map<String, String> request) {
        try {
            tutorService.changePassword(
                    id,
                    request.get("currentPassword"),
                    request.get("newPassword")
            );
            return ResponseEntity.ok(Map.of("message", "Пароль успешно изменён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Tutor>> getAllTutors() {
        List<Tutor> tutors = tutorService.getAllTutors();
        tutors.forEach(t -> t.setPasswordHash(null));
        return ResponseEntity.ok(tutors);
    }
}