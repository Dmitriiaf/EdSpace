package com.example.demo.controller;

import com.example.demo.service.SubscriptionCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions/renew")
@CrossOrigin(origins = "http://localhost:3000")
public class SubscriptionRenewalController {

    @Autowired
    private SubscriptionCalculator subscriptionCalculator;

    @PostMapping("/all")
    public ResponseEntity<?> renewAllSubscriptions() {
        try {
            subscriptionCalculator.createSubscriptionsForAllStudents(YearMonth.now());
            subscriptionCalculator.createSubscriptionsForAllStudents(YearMonth.now().plusMonths(1));
            return ResponseEntity.ok(Map.of("message", "Все абонементы обновлены"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}