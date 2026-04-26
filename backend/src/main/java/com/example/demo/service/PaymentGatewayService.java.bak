package com.example.demo.service;

import com.example.demo.entity.Lesson;
import com.example.demo.entity.Payment;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.PaymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class PaymentGatewayService {

    @Value("${yookassa.shop-id}")
    private String shopId;

    @Value("${yookassa.secret-key}")
    private String secretKey;

    @Value("${yookassa.return-url}")
    private String returnUrl;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private LessonRepository lessonRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments";

    @Transactional
    public String createPayment(Lesson lesson, BigDecimal amount, String customerEmail) {
        try {
            // Создаём запись о платеже в БД
            Payment payment = new Payment();
            payment.setTutor(lesson.getTutor());
            payment.setStudent(lesson.getStudent());
            payment.setAmount(amount.doubleValue());
            payment.setLesson(lesson);
            payment.setLessonDate(lesson.getLessonDate());
            payment.setStatus("pending");
            payment.setPaymentType("card");
            payment.setPaymentDate(LocalDateTime.now());


            if (lesson.getCourse() != null) {
                payment.setCourseName(lesson.getCourse().getName());
            } else {
                payment.setCourseName("Занятие");
            }

            payment.setTutorName(lesson.getTutor().getFullName());

            String idempotencyKey = UUID.randomUUID().toString();
            payment.setIdempotencyKey(idempotencyKey);

            Payment savedPayment = paymentRepository.save(payment);

            // Формируем тело запроса
            Map<String, Object> requestBody = new HashMap<>();

            // Сумма
            Map<String, Object> amountMap = new HashMap<>();
            amountMap.put("value", amount.toString());
            amountMap.put("currency", "RUB");
            requestBody.put("amount", amountMap);

            // Описание
            String description = "Оплата занятия: " +
                    (lesson.getCourse() != null ? lesson.getCourse().getName() : "Занятие");
            requestBody.put("description", description);

            // Настройка возврата
            Map<String, Object> confirmationMap = new HashMap<>();
            confirmationMap.put("type", "redirect");
            confirmationMap.put("return_url", returnUrl + "?paymentId=" + savedPayment.getId());
            requestBody.put("confirmation", confirmationMap);

            // Флаг capture
            requestBody.put("capture", true);

            // Чек для 54-ФЗ
//            Map<String, Object> receiptMap = new HashMap<>();
//            Map<String, Object> customerMap = new HashMap<>();
//            customerMap.put("email", customerEmail != null ? customerEmail : "client@example.com");
//            receiptMap.put("customer", customerMap);
//
//            List<Map<String, Object>> items = new ArrayList<>();
//            Map<String, Object> itemMap = new HashMap<>();
//            itemMap.put("description", "Услуги репетитора: " +
//                    (lesson.getCourse() != null ? lesson.getCourse().getName() : "Занятие"));
//            itemMap.put("quantity", "1.00");
//            itemMap.put("amount", amountMap);
//            itemMap.put("vat_code", 1);
//            items.add(itemMap);
//            receiptMap.put("items", items);
//            requestBody.put("receipt", receiptMap);

            // HTTP заголовки
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String auth = shopId + ":" + secretKey;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
            headers.set("Authorization", "Basic " + encodedAuth);
            headers.set("Idempotence-Key", idempotencyKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("📤 Отправка запроса в ЮKassa...");
            ResponseEntity<Map> response = restTemplate.postForEntity(YOOKASSA_API_URL, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String paymentId = (String) responseBody.get("id");
                Map<String, Object> confirmation = (Map<String, Object>) responseBody.get("confirmation");
                String paymentUrl = (String) confirmation.get("confirmation_url");

                // Обновляем платёж в БД
                savedPayment.setExternalPaymentId(paymentId);
                savedPayment.setPaymentUrl(paymentUrl);
                paymentRepository.save(savedPayment);

                log.info("✅ Платёж создан: id={}, url={}", paymentId, paymentUrl);
                return paymentUrl;
            } else {
                throw new BusinessException("Ошибка ответа от ЮKassa");
            }

        } catch (Exception e) {
            log.error("❌ Ошибка создания платежа: {}", e.getMessage(), e);
            throw new BusinessException("Ошибка создания платежа: " + e.getMessage());
        }
    }

    @Transactional
    public void confirmPayment(String externalPaymentId) {
        Payment payment = paymentRepository.findByExternalPaymentId(externalPaymentId)
                .orElseThrow(() -> new BusinessException("Платёж не найден: " + externalPaymentId));

        payment.setStatus("paid");
        payment.setConfirmedByParent(true);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        if (payment.getLesson() != null) {
            Lesson lesson = payment.getLesson();
            lesson.setStatus("PAID");
            lesson.setPaidAt(LocalDateTime.now());
            lessonRepository.save(lesson);
        }

        log.info("✅ Платёж подтверждён: externalId={}, lessonId={}",
                externalPaymentId, payment.getLesson() != null ? payment.getLesson().getId() : "N/A");
    }
}