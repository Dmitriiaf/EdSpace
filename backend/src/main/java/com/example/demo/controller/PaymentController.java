package com.example.demo.controller;

import com.example.demo.entity.Lesson;
import com.example.demo.entity.Payment;
import com.example.demo.service.LessonService;
import com.example.demo.service.PaymentGatewayService;
import com.example.demo.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentGatewayService paymentGatewayService;

    @Autowired
    private LessonService lessonService;

    // ========== НОВЫЙ МЕТОД: СОЗДАНИЕ ПЛАТЕЖА ЧЕРЕЗ ЮKASSA ==========
    @PostMapping("/create-for-lesson/{lessonId}")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    public ResponseEntity<?> createPaymentForLesson(@PathVariable Long lessonId,
                                                    @RequestAttribute("userId") Long userId,
                                                    @RequestAttribute("userRole") String userRole) {
        try {
            Lesson lesson = lessonService.getLessonById(lessonId);

            // Проверка прав доступа
            if ("ROLE_PARENT".equals(userRole)) {
                if (lesson.getStudent().getParent() == null ||
                        !lesson.getStudent().getParent().getId().equals(userId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_TUTOR".equals(userRole)) {
                if (!lesson.getTutor().getId().equals(userId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            // Проверяем, не оплачен ли уже урок
            if ("PAID".equals(lesson.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Занятие уже оплачено"));
            }

            // Получаем ставку для этого репетитора
            BigDecimal amount = lesson.getStudent().getRateForTutor(lesson.getTutor().getId());
            if (amount == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Не указана ставка за занятие"));
            }

            // Определяем email для чека
            String customerEmail = lesson.getStudent().getParent() != null ?
                    lesson.getStudent().getParent().getEmail() :
                    lesson.getStudent().getEmail();

            if (customerEmail == null || customerEmail.isEmpty()) {
                customerEmail = lesson.getStudent().getTutors().get(0).getEmail();
            }

            // Вызываем сервис и получаем URL для оплаты
            String paymentUrl = paymentGatewayService.createPayment(lesson, amount, customerEmail);

            return ResponseEntity.ok(Map.of(
                    "paymentUrl", paymentUrl,
                    "amount", amount,
                    "message", "Ссылка на оплату создана"
            ));
        } catch (Exception e) {
            log.error("Ошибка создания платежа: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== СОЗДАТЬ ПЛАТЁЖ ЗА ЗАНЯТИЕ (СТАРЫЙ МЕТОД) ==========
    @PostMapping("/lesson")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createPaymentForLessonOld(@RequestBody Map<String, Object> request) {
        try {
            Payment payment = paymentService.createPaymentForLesson(
                    Long.parseLong(request.get("tutorId").toString()),
                    Long.parseLong(request.get("studentId").toString()),
                    Double.parseDouble(request.get("amount").toString()),
                    (String) request.get("paymentType")
            );
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== СОЗДАТЬ ПЛАТЁЖ ==========
    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> request) {
        try {
            Payment payment = paymentService.createPayment(
                    Long.parseLong(request.get("tutorId").toString()),
                    Long.parseLong(request.get("studentId").toString()),
                    Double.parseDouble(request.get("amount").toString()),
                    (String) request.get("paymentType"),
                    (String) request.get("status")
            );
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ПОЛУЧИТЬ ВСЕ ПЛАТЕЖИ РЕПЕТИТОРА ==========
    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getPaymentsByTutor(@PathVariable Long tutorId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Payment> payments = paymentService.getPaymentsByTutor(tutorId);
            return ResponseEntity.ok(payments);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ПОЛУЧИТЬ ПЛАТЕЖИ УЧЕНИКА ==========
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'PARENT')")
    public ResponseEntity<?> getPaymentsByStudent(@PathVariable Long studentId) {
        try {
            List<Payment> payments = paymentService.getPaymentsByStudent(studentId);
            return ResponseEntity.ok(payments);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ПОЛУЧИТЬ ПЛАТЕЖИ ЗА ПЕРИОД ==========
    @GetMapping("/period/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getPaymentsByPeriod(
            @PathVariable Long tutorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Payment> payments = paymentService.getPaymentsByPeriod(tutorId, start, end);
            return ResponseEntity.ok(payments);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ПОЛУЧИТЬ НЕОПЛАЧЕННЫЕ ПЛАТЕЖИ ==========
    @GetMapping("/pending/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getPendingPayments(@PathVariable Long tutorId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Payment> payments = paymentService.getPendingPayments(tutorId);
            return ResponseEntity.ok(payments);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ПОЛУЧИТЬ ПЛАТЁЖ ПО ID ==========
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TUTOR', 'PARENT')")
    public ResponseEntity<?> getPaymentById(@PathVariable Long id) {
        try {
            Payment payment = paymentService.getPaymentById(id);
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ========== ОБНОВИТЬ СТАТУС ПЛАТЕЖА ==========
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updatePaymentStatus(@PathVariable Long id,
                                                 @RequestBody Map<String, String> request,
                                                 @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Payment payment = paymentService.getPaymentById(id);

            if (!payment.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Payment updatedPayment = paymentService.updatePaymentStatus(id, request.get("status"));
            return ResponseEntity.ok(updatedPayment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== РОДИТЕЛЬ ПОДТВЕРЖДАЕТ ОПЛАТУ (СТАРЫЙ МЕТОД) ==========
    @PostMapping("/{id}/parent-confirm")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    public ResponseEntity<?> parentConfirmPayment(@PathVariable Long id) {
        try {
            Payment payment = paymentService.parentConfirmPayment(id);

            Map<String, Object> response = new HashMap<>();
            response.put("id", payment.getId());
            response.put("status", payment.getStatus());
            response.put("confirmedByParent", payment.isConfirmedByParent());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ДОБАВИТЬ КОММЕНТАРИЙ К ПЛАТЕЖУ ==========
    @PatchMapping("/{id}/notes")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> addNotes(@PathVariable Long id,
                                      @RequestBody Map<String, String> request,
                                      @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Payment payment = paymentService.getPaymentById(id);

            if (!payment.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Payment updatedPayment = paymentService.addNotes(id, request.get("notes"));
            return ResponseEntity.ok(updatedPayment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== УДАЛИТЬ ПЛАТЁЖ ==========
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deletePayment(@PathVariable Long id,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Payment payment = paymentService.getPaymentById(id);

            if (!payment.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            paymentService.deletePayment(id);
            return ResponseEntity.ok(Map.of("message", "Платёж успешно удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ПОЛУЧИТЬ ОБЩИЙ ДОХОД ЗА ПЕРИОД ==========
    @GetMapping("/income/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTotalIncome(
            @PathVariable Long tutorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Double income = paymentService.getTotalIncome(tutorId, start, end);
            return ResponseEntity.ok(Map.of("totalIncome", income));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ПОЛУЧИТЬ СТАТИСТИКУ ПО ПЛАТЕЖАМ ==========
    @GetMapping("/stats/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getPaymentStats(@PathVariable Long tutorId,
                                             @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Object stats = paymentService.getPaymentStats(tutorId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}