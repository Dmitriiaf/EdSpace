package com.example.demo.controller;

import com.example.demo.service.PaymentGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments/webhook")
public class PaymentWebhookController {

    @Autowired
    private PaymentGatewayService paymentGatewayService;

    @PostMapping("/yookassa")
    public ResponseEntity<?> handleYooKassaWebhook(@RequestBody Map<String, Object> payload) {
        log.info("📨 Получен webhook от ЮKassa: {}", payload);

        try {
            String event = (String) payload.get("event");

            if ("payment.succeeded".equals(event)) {
                Map<String, Object> paymentObject = (Map<String, Object>) payload.get("object");
                String paymentId = (String) paymentObject.get("id");

                paymentGatewayService.confirmPayment(paymentId);

                log.info("✅ Платёж {} успешно обработан", paymentId);
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("❌ Ошибка обработки webhook: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}