package com.example.demo.controller;

import com.example.demo.entity.Parent;
import com.example.demo.repository.ParentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/parents")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru"
}, allowCredentials = "true")
public class ParentController {

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // Добавил для возможного изменения пароля в будущем

    @PostMapping
    public ResponseEntity<?> createParent(@RequestBody Map<String, String> request) {
        try {
            Parent parent = new Parent(
                    request.get("fullName"),
                    request.get("email"),
                    request.get("phone")
            );

            // Если при создании передан пароль, хешируем его
            if (request.containsKey("password") && request.get("password") != null && !request.get("password").isEmpty()) {
                parent.setPasswordHash(passwordEncoder.encode(request.get("password")));
            }

            Parent savedParent = parentRepository.save(parent);
            return ResponseEntity.ok(savedParent);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')") // Родитель может смотреть себя, репетитор — для информации
    public ResponseEntity<?> getParent(@PathVariable Long id,
                                       @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                       @RequestAttribute(name = "userRole", required = false) String userRole) {
        // IDOR FIX: Проверяем права доступа
        if ("ROLE_PARENT".equals(userRole) && !id.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        // Репетитор может смотреть родителя, только если тот связан с его учеником (проверка в сервисе, здесь упрощенно)

        return parentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ НОВЫЙ МЕТОД ДЛЯ ОБНОВЛЕНИЯ ПРОФИЛЯ РОДИТЕЛЯ
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> updateParent(@PathVariable Long id,
                                          @RequestBody Map<String, Object> request,
                                          @RequestAttribute("userId") Long currentUserId) {
        try {
            // IDOR FIX: Проверяем, что родитель редактирует СВОЙ профиль
            if (!id.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Parent parent = parentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Родитель не найден"));

            // Обновляем только разрешенные поля
            if (request.get("fullName") != null) {
                parent.setFullName((String) request.get("fullName"));
            }
            if (request.get("phone") != null) {
                parent.setPhone((String) request.get("phone"));
            }
            // Email менять нельзя, это логин

            // Если передан новый пароль, хешируем и обновляем
            if (request.get("password") != null && !((String) request.get("password")).isEmpty()) {
                parent.setPasswordHash(passwordEncoder.encode((String) request.get("password")));
            }

            Parent updatedParent = parentRepository.save(parent);
            return ResponseEntity.ok(updatedParent);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}