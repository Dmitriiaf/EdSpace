// ========== backend/src/main/java/com/example/demo/controller/SubscriptionController.java (ИСПРАВЛЕННАЯ ВЕРСИЯ — ЕДИНЫЙ РЕГИСТР) ==========
package com.example.demo.controller;

import com.example.demo.entity.Lesson;
import com.example.demo.entity.Payment;
import com.example.demo.entity.Subscription;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.SubscriptionRepository;
import com.example.demo.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private LessonRepository lessonRepository;

    // ========== GET /tutor/{tutorId} ==========
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

    // ========== GET /student/{studentId} ==========
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

    // ========== PUT /{id} ==========
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateSubscription(@PathVariable Long id,
                                                @RequestBody Map<String, Object> request,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Subscription sub = subscriptionService.getSubscriptionById(id);

            if (!sub.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            if (!"PENDING".equalsIgnoreCase(sub.getStatus())
                    && !"ACTIVE".equalsIgnoreCase(sub.getStatus())
                    && !"PAID".equalsIgnoreCase(sub.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Нельзя редактировать завершённый абонемент"));
            }

            if (request.containsKey("lessonsCount")) {
                sub.setLessonsCount(Integer.parseInt(request.get("lessonsCount").toString()));
            }
            if (request.containsKey("price")) {
                sub.setPrice(new BigDecimal(request.get("price").toString()));
            }
            if (request.containsKey("debtLessons")) {
                sub.setDebtLessons(Integer.parseInt(request.get("debtLessons").toString()));
            }

            subscriptionService.saveSubscription(sub);
            return ResponseEntity.ok(sub);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== GET /student/{studentId}/pending ==========
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

    // ========== GET /student/{studentId}/active ==========
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

    @PostMapping("/{id}/recalculate")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> recalculateSubscription(@PathVariable Long id) {
        try {
            Subscription subscription = subscriptionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Абонемент не найден"));

            LocalDate startDate = subscription.getStartDate() != null
                    ? subscription.getStartDate()
                    : LocalDate.now().minusMonths(1);
            LocalDate endDate = subscription.getEndDate() != null
                    ? subscription.getEndDate()
                    : LocalDate.now();

            List<Lesson> lessons = lessonRepository
                    .findByStudentIdAndLessonDateBetween(
                            subscription.getStudent().getId(), startDate, endDate);

            long usedLessons = lessons.stream()
                    .filter(l -> "COMPLETED".equals(l.getStatus()) || "PAID".equals(l.getStatus()))
                    .count();

            subscription.setLessonsUsed((int) usedLessons);
            subscriptionRepository.save(subscription);

            return ResponseEntity.ok(Map.of(
                    "message", "Абонемент пересчитан",
                    "lessonsUsed", usedLessons,
                    "lessonsCount", subscription.getLessonsCount()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== POST / ==========
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

    // ========== POST /{id}/pay ==========
    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    public ResponseEntity<?> paySubscription(@PathVariable Long id,
                                             @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                             @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Subscription subscription = subscriptionService.getSubscriptionById(id);

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

    // ========== POST /{id}/additional-pay ==========
    @PostMapping("/{id}/additional-pay")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    public ResponseEntity<?> makeAdditionalPayment(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> request,
                                                   @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                   @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Subscription subscription = subscriptionService.getSubscriptionById(id);

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

    // ========== POST /{id}/use ==========
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

    // ========== POST /renew ==========
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

    // ========== DELETE /{id} ==========
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