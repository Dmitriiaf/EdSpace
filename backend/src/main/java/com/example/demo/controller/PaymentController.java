package com.example.demo.controller;

import com.example.demo.entity.Lesson;
import com.example.demo.entity.Payment;
import com.example.demo.service.LessonService;
import com.example.demo.service.PaymentService;
import com.example.demo.service.YandexVisionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private LessonService lessonService;

    @Autowired(required = false)
    private YandexVisionService visionService;

    // ========== СОЗДАТЬ ПЛАТЁЖ ЗА ЗАНЯТИЕ ==========
    @PostMapping("/lesson")
    @PreAuthorize("hasAnyRole('TUTOR', 'PARENT', 'STUDENT')")
    public ResponseEntity<?> createPaymentForLesson(@RequestBody Map<String, Object> request) {
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
    @PreAuthorize("hasAnyRole('TUTOR', 'PARENT')")
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

    // ========== ЗАГРУЗКА ЧЕКА РОДИТЕЛЕМ ==========
    @PostMapping("/{id}/upload-receipt")
    @PreAuthorize("hasAnyRole('PARENT', 'STUDENT')")
    public ResponseEntity<?> uploadReceipt(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestAttribute("userId") Long currentUserId,
            @RequestAttribute("userRole") String userRole) {

        try {
            Payment payment = paymentService.getPaymentById(id);

            // Проверка доступа
            if ("ROLE_PARENT".equals(userRole) || "ROLE_STUDENT".equals(userRole)) {
                if (payment.getStudent().getParent() == null ||
                        (!payment.getStudent().getParent().getId().equals(currentUserId) &&
                                !payment.getStudent().getId().equals(currentUserId))) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            // Проверка размера
            if (file.getSize() > 2 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "Файл слишком большой. Максимум 2MB"));
            }

            // Проверка типа
            String contentType = file.getContentType();
            List<String> allowedTypes = List.of(
                    "image/jpeg", "image/png", "image/gif", "image/webp",
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );

            if (contentType == null || !allowedTypes.contains(contentType)) {
                return ResponseEntity.badRequest().body(Map.of("error",
                        "Неподдерживаемый формат. Разрешены: JPG, PNG, GIF, WebP, PDF, DOC, DOCX"));
            }

            // Сохраняем файл
            String uploadDir = "/opt/EdSpace/uploads/receipts/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String originalName = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String fileName = "receipt_" + payment.getId() + "_" + System.currentTimeMillis() + extension;
            File destFile = new File(uploadDir + fileName);
            file.transferTo(destFile);

            // Обновляем платёж
            payment.setReceiptPath("/uploads/receipts/" + fileName);
            payment.setStatus("PAID");
            payment.setConfirmedByParent(true);
            paymentService.savePayment(payment);

            // Обновляем урок, если есть
            if (payment.getLesson() != null) {
                Lesson lesson = payment.getLesson();
                lesson.setStatus("PAID");
                lesson.setPaidAt(LocalDateTime.now());
                lessonService.saveLesson(lesson);
                log.info("✅ Статус урока {} изменён на PAID", lesson.getId());
            }

            // === УВЕДОМЛЕНИЕ РЕПЕТИТОРУ ===
            try {
                paymentService.notifyTutorAboutNewReceipt(payment);
            } catch (Exception e) {
                log.warn("Не удалось отправить уведомление репетитору: {}", e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Чек загружен и ожидает проверки репетитором",
                    "receiptPath", payment.getReceiptPath(),
                    "status", payment.getStatus()
            ));
        } catch (Exception e) {
            log.error("Ошибка загрузки чека: {}", e.getMessage());
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

    // ========== ПОЛУЧИТЬ НЕПОДТВЕРЖДЁННЫЕ ПЛАТЕЖИ ==========
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

    // ========== ПОДТВЕРДИТЬ / ОТКЛОНИТЬ ПЛАТЁЖ (РЕПЕТИТОР) ==========
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
            String newStatus = request.get("status");
            if (newStatus == null || newStatus.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Не указан статус"));
            }
            Payment updatedPayment = paymentService.updatePaymentStatus(id, newStatus);
            return ResponseEntity.ok(Map.of(
                    "message", "Статус платежа обновлён",
                    "payment", updatedPayment
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== РОДИТЕЛЬ ПОДТВЕРЖДАЕТ ОПЛАТУ (устаревший) ==========
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