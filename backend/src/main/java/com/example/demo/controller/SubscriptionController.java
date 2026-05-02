package com.example.demo.controller;

import com.example.demo.entity.Subscription;
import com.example.demo.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.example.demo.entity.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getSubscriptionsByTutor(@PathVariable Long tutorId) {
        try {
            List<Subscription> subscriptions = subscriptionService.getSubscriptionsByTutor(tutorId);
            return ResponseEntity.ok(subscriptions);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getSubscriptionsByStudent(@PathVariable Long studentId) {
        try {
            List<Subscription> subscriptions = subscriptionService.getSubscriptionsByStudent(studentId);
            return ResponseEntity.ok(subscriptions);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateSubscription(@PathVariable Long id,
                                                @RequestBody Map<String, Object> request,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Subscription sub = subscriptionService.getSubscriptionById(id);

            // IDOR проверка
            if (!sub.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            // ✅ Разрешаем редактировать pending и active
            if (!"pending".equalsIgnoreCase(sub.getStatus()) && !"active".equalsIgnoreCase(sub.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Нельзя редактировать завершённый абонемент"));
            }

            if (request.containsKey("lessonsCount")) {
                sub.setLessonsCount(Integer.parseInt(request.get("lessonsCount").toString()));
            }
            if (request.containsKey("price")) {
                sub.setPrice(new BigDecimal(request.get("price").toString()));
            }

            subscriptionService.saveSubscription(sub);
            return ResponseEntity.ok(sub);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/pending")
    @PreAuthorize("hasAnyRole('TUTOR', 'PARENT')")
    public ResponseEntity<?> getPendingSubscriptions(@PathVariable Long studentId) {
        try {
            List<Subscription> subscriptions = subscriptionService.getPendingSubscriptionsByStudent(studentId);
            return ResponseEntity.ok(subscriptions);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/active")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getActiveSubscription(@PathVariable Long studentId) {
        try {
            Subscription subscription = subscriptionService.getActiveSubscription(studentId);
            return ResponseEntity.ok(subscription);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createSubscription(@RequestBody Map<String, Object> request) {
        try {
            Subscription subscription = subscriptionService.createSubscription(
                    Long.parseLong(request.get("tutorId").toString()),
                    Long.parseLong(request.get("studentId").toString()),
                    Integer.parseInt(request.get("lessonsCount").toString()),
                    new BigDecimal(request.get("price").toString()),
                    LocalDateTime.parse(request.get("startDate").toString() + "T00:00:00"),
                    LocalDateTime.parse(request.get("endDate").toString() + "T00:00:00")
            );
            return ResponseEntity.ok(subscription);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    public ResponseEntity<?> paySubscription(@PathVariable Long id,
                                             @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                             @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Subscription subscription = subscriptionService.getSubscriptionById(id);

            // Проверка прав
            if ("ROLE_PARENT".equals(userRole)) {
                if (subscription.getStudent().getParent() == null ||
                        !subscription.getStudent().getParent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_TUTOR".equals(userRole)) {
                if (!subscription.getTutor().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            Subscription paidSubscription = subscriptionService.paySubscription(id);
            return ResponseEntity.ok(Map.of(
                    "message", "Абонемент оплачен",
                    "subscription", paidSubscription
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/additional-pay")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    public ResponseEntity<?> makeAdditionalPayment(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> request,
                                                   @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                   @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Subscription subscription = subscriptionService.getSubscriptionById(id);

            // Проверка прав
            if ("ROLE_PARENT".equals(userRole)) {
                if (subscription.getStudent().getParent() == null ||
                        !subscription.getStudent().getParent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_TUTOR".equals(userRole)) {
                if (!subscription.getTutor().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            BigDecimal additionalAmount = new BigDecimal(request.get("amount").toString());
            Payment payment = subscriptionService.makeAdditionalPayment(id, additionalAmount);

            return ResponseEntity.ok(Map.of(
                    "message", "Доплата произведена успешно",
                    "payment", payment
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/use")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> useLesson(@PathVariable Long id) {
        try {
            Subscription subscription = subscriptionService.useLesson(id);
            return ResponseEntity.ok(Map.of(
                    "message", "Занятие отмечено в абонементе",
                    "subscription", subscription
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/renew")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> renewAllSubscriptions() {
        try {
            subscriptionService.renewAllSubscriptions();
            return ResponseEntity.ok(Map.of("message", "Абонементы обновлены"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteSubscription(@PathVariable Long id) {
        try {
            subscriptionService.deleteSubscription(id);
            return ResponseEntity.ok(Map.of("message", "Абонемент удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}