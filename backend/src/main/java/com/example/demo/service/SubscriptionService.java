// ========== backend/src/main/java/com/example/demo/service/SubscriptionService.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Slf4j  // ✅ Добавлена аннотация Lombok для логирования
@Service
public class SubscriptionService {

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private SubscriptionCalculator subscriptionCalculator;

    @Autowired
    private NotificationService notificationService;

    public List<Subscription> getSubscriptionsByTutor(Long tutorId) {
        return subscriptionRepository.findAllByTutorId(tutorId);
    }

    public List<Subscription> getSubscriptionsByStudent(Long studentId) {
        return subscriptionRepository.findByStudentId(studentId);
    }

    public List<Subscription> getPendingSubscriptionsByStudent(Long studentId) {
        return subscriptionRepository.findByStudentIdAndStatus(studentId, "pending");
    }

    public Subscription getActiveSubscription(Long studentId) {
        List<Subscription> activeSubscriptions = subscriptionRepository
                .findByStudentIdAndStatus(studentId, "active");
        if (activeSubscriptions.isEmpty()) {
            return null;
        }
        return activeSubscriptions.get(0);
    }

    public Subscription getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Абонемент не найден"));
    }

    public BigDecimal getPaidAmountForSubscription(Long subscriptionId) {
        List<Payment> payments = paymentRepository.findBySubscriptionId(subscriptionId);
        return payments.stream()
                .filter(p -> "paid".equals(p.getStatus()))
                .map(p -> BigDecimal.valueOf(p.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional
    public Payment makeAdditionalPayment(Long subscriptionId, BigDecimal additionalAmount) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Абонемент не найден"));

        if (!"active".equals(subscription.getStatus())) {
            throw new RuntimeException("Абонемент не активен");
        }

        BigDecimal paidAmount = getPaidAmountForSubscription(subscriptionId);
        BigDecimal totalAmount = subscription.getPrice();
        BigDecimal remainingAmount = totalAmount.subtract(paidAmount);

        if (additionalAmount.compareTo(remainingAmount) > 0) {
            throw new RuntimeException("Сумма доплаты превышает остаток");
        }

        Payment payment = new Payment(
                subscription.getTutor(),
                subscription.getStudent(),
                additionalAmount.doubleValue(),
                LocalDateTime.now(),
                "subscription",
                "paid"
        );
        payment.setConfirmedByParent(true);
        payment.setCourseName("Доплата за абонемент: " + subscription.getStartDate().getMonth().toString());
        payment.setTutorName(subscription.getTutor().getFullName());
        payment.setSubscriptionId(subscriptionId);

        Payment savedPayment = paymentRepository.save(payment);

        log.info("💰 Произведена доплата по абонементу #{}: {} ₽", subscriptionId, additionalAmount);

        if (subscription.getTutor() != null) {
            String message = String.format(
                    "📢 Родитель произвёл доплату по абонементу %s.\n" +
                            "Сумма доплаты: %s ₽.\n" +
                            "Общая сумма абонемента: %s ₽.",
                    subscription.getStudent().getFullName(),
                    additionalAmount.toString(),
                    subscription.getPrice().toString()
            );
            notificationService.createTutorNotification(
                    subscription.getTutor().getId(),
                    message
            );
        }

        return savedPayment;
    }

    @Transactional
    public Subscription createSubscription(Long tutorId, Long studentId,
                                           Integer lessonsCount, BigDecimal price,
                                           LocalDateTime startDate, LocalDateTime endDate) {

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        Subscription subscription = new Subscription(
                tutor, student, lessonsCount, price, startDate.toLocalDate(), endDate.toLocalDate()
        );
        subscription.setStatus("pending");

        return subscriptionRepository.save(subscription);
    }

    @Transactional
    public Subscription paySubscription(Long subscriptionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Абонемент не найден"));

        if ("active".equals(subscription.getStatus())) {
            throw new RuntimeException("Абонемент уже оплачен");
        }

        if ("completed".equals(subscription.getStatus())) {
            throw new RuntimeException("Абонемент уже завершён");
        }

        BigDecimal paidAmount = getPaidAmountForSubscription(subscriptionId);
        BigDecimal totalAmount = subscription.getPrice();

        if (paidAmount.compareTo(totalAmount) >= 0) {
            throw new RuntimeException("Абонемент уже полностью оплачен");
        }

        BigDecimal remainingAmount = totalAmount.subtract(paidAmount);

        subscription.setStatus("active");
        subscription.setPaidAt(LocalDateTime.now());

        Payment payment = new Payment(
                subscription.getTutor(),
                subscription.getStudent(),
                remainingAmount.doubleValue(),
                LocalDateTime.now(),
                "subscription",
                "paid"
        );
        payment.setConfirmedByParent(true);
        payment.setCourseName("Абонемент на " + subscription.getStartDate().getMonth().toString());
        payment.setTutorName(subscription.getTutor().getFullName());
        payment.setSubscriptionId(subscriptionId);
        paymentRepository.save(payment);

        log.info("💰 Абонемент #{} оплачен", subscriptionId);
        log.info("   Сумма оплаты: {} ₽", remainingAmount);

        return subscriptionRepository.save(subscription);
    }

    @Transactional
    public Subscription useLesson(Long subscriptionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Абонемент не найден"));

        if (!"active".equals(subscription.getStatus())) {
            throw new RuntimeException("Абонемент не активен");
        }

        if (subscription.getLessonsUsed() >= subscription.getLessonsCount()) {
            throw new RuntimeException("Все занятия по абонементу уже использованы");
        }

        subscription.setLessonsUsed(subscription.getLessonsUsed() + 1);

        if (subscription.getLessonsUsed() >= subscription.getLessonsCount()) {
            subscription.setStatus("completed");
        }

        log.info("✅ Отмечено занятие в абонементе. Использовано: {}/{}",
                subscription.getLessonsUsed(), subscription.getLessonsCount());

        return subscriptionRepository.save(subscription);
    }

    @Transactional
    public void useLessonForStudent(Long studentId) {
        Subscription activeSubscription = getActiveSubscription(studentId);

        if (activeSubscription != null) {
            useLesson(activeSubscription.getId());
        } else {
            log.warn("⚠️ Не найден активный абонемент для ученика {}", studentId);
        }
    }

    @Transactional
    public void deleteSubscription(Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Абонемент не найден"));
        subscriptionRepository.delete(subscription);
    }

    @Transactional
    public void renewAllSubscriptions() {
        subscriptionCalculator.createSubscriptionsForAllStudents(YearMonth.now());
        subscriptionCalculator.createSubscriptionsForAllStudents(YearMonth.now().plusMonths(1));
    }
}