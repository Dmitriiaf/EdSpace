package com.example.demo.controller;

import com.example.demo.service.SubscriptionCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions/init")
@CrossOrigin(origins = "http://localhost:3000")
public class SubscriptionInitController {

    @Autowired
    private SubscriptionCalculator subscriptionCalculator;

    @PostMapping("/student/{studentId}")
    public ResponseEntity<?> initStudentSubscriptions(@PathVariable Long studentId) {
        try {
            // Исправленный вызов - передаём studentId и текущий месяц
            subscriptionCalculator.calculateAndCreateSubscription(studentId, YearMonth.now());
            return ResponseEntity.ok(Map.of(
                    "message", "Абонемент успешно создан для ученика",
                    "studentId", studentId
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/all")
    public ResponseEntity<?> initAllSubscriptions() {
        try {
            subscriptionCalculator.createSubscriptionsForAllStudents(YearMonth.now());
            subscriptionCalculator.createSubscriptionsForAllStudents(YearMonth.now().plusMonths(1));
            return ResponseEntity.ok(Map.of("message", "Абонементы обновлены для всех учеников"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }



}