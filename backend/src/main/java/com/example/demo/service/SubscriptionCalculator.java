// ========== backend/src/main/java/com/example/demo/service/SubscriptionCalculator.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j  // ✅ Добавлена аннотация Lombok для логирования
@Service
public class SubscriptionCalculator {

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private WeeklyTemplateRepository templateRepository;

    @Autowired
    private NotificationService notificationService;

    public int countLessonsInMonth(Long studentId, YearMonth month) {
        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.atEndOfMonth();

        int lessonsCount = lessonRepository.countLessonsInMonth(studentId, startDate, endDate);

        if (lessonsCount == 0) {
            lessonsCount = countTemplatesInMonth(studentId, month);
        }

        return lessonsCount;
    }

    public int countLessonsInMonthByTemplate(Long studentId, YearMonth month) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return 0;

        if (student.getTutors().isEmpty()) return 0;

        List<WeeklyTemplate> templates = templateRepository.findByTutorId(student.getTutors().get(0).getId());

        int count = 0;
        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.atEndOfMonth();
        LocalDate currentDate = startDate;
        LocalDate today = LocalDate.now();

        while (!currentDate.isAfter(endDate)) {
            int dayOfWeek = currentDate.getDayOfWeek().getValue();
            for (WeeklyTemplate template : templates) {
                if (template.getStudent().getId().equals(studentId)
                        && template.getDayOfWeek() == dayOfWeek
                        && "SCHEDULED".equals(template.getStatus())) {

                    if (!currentDate.isBefore(today)) {
                        count++;
                    }
                    break;
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        return count;
    }

    private int countTemplatesInMonth(Long studentId, YearMonth month) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return 0;

        if (student.getTutors().isEmpty()) return 0;

        List<WeeklyTemplate> templates = templateRepository.findByTutorId(student.getTutors().get(0).getId());

        int count = 0;
        LocalDate currentDate = month.atDay(1);
        LocalDate endDate = month.atEndOfMonth();
        LocalDate today = LocalDate.now();

        while (!currentDate.isAfter(endDate)) {
            int dayOfWeek = currentDate.getDayOfWeek().getValue();
            for (WeeklyTemplate template : templates) {
                if (template.getStudent().getId().equals(studentId)
                        && template.getDayOfWeek() == dayOfWeek
                        && "SCHEDULED".equals(template.getStatus())) {
                    if (!currentDate.isBefore(today)) {
                        count++;
                    }
                    break;
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        return count;
    }

    @Transactional
    public Subscription calculateAndCreateSubscription(Long studentId, YearMonth month) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        if (!"subscription".equals(student.getPaymentType())) {
            return null;
        }

        BigDecimal rate = student.getRatePerLesson();
        if (rate == null) {
            log.warn("⚠️ У ученика {} не указана ставка", student.getFullName());
            return null;
        }

        List<Subscription> existingSubs = subscriptionRepository
                .findByStudentId(studentId);

        for (Subscription existing : existingSubs) {
            YearMonth existingMonth = YearMonth.from(existing.getStartDate());
            if (existingMonth.equals(month)) {
                if ("active".equals(existing.getStatus())) {
                    log.info("✅ Активный абонемент на {} уже существует", month);
                    return existing;
                }
                if ("pending".equals(existing.getStatus())) {
                    log.info("⏳ Абонемент на {} ожидает оплаты", month);
                    return existing;
                }
            }
        }

        int lessonsCount = countLessonsInMonthByTemplate(studentId, month);
        if (lessonsCount == 0) {
            log.info("Нет занятий для ученика {} в месяце {}", studentId, month);
            return null;
        }

        BigDecimal totalPrice = rate.multiply(BigDecimal.valueOf(lessonsCount));

        if (student.getTutors().isEmpty()) {
            throw new RuntimeException("У ученика нет репетитора");
        }

        Subscription subscription = new Subscription(
                student.getTutors().get(0),
                student,
                lessonsCount,
                totalPrice,
                month.atDay(1),
                month.atEndOfMonth()
        );
        subscription.setStatus("pending");

        Subscription saved = subscriptionRepository.save(subscription);

        log.info("✅ Создан абонемент для ученика {} на {} занятий на сумму {} ₽ (ожидает оплаты)",
                student.getFullName(), lessonsCount, totalPrice);

        return saved;
    }

    @Transactional
    public void createSubscriptionsForAllStudents(YearMonth month) {
        List<Student> subscriptionStudents = studentRepository.findAll().stream()
                .filter(s -> "subscription".equals(s.getPaymentType()))
                .collect(Collectors.toList());

        log.info("🔄 Создание абонементов для {} учеников на месяц {}", subscriptionStudents.size(), month);

        for (Student student : subscriptionStudents) {
            try {
                List<Subscription> existing = subscriptionRepository
                        .findByStudentId(student.getId());

                boolean hasActive = existing.stream()
                        .anyMatch(s -> YearMonth.from(s.getStartDate()).equals(month)
                                && "active".equals(s.getStatus()));

                if (hasActive) {
                    log.info("⏭️ У ученика {} уже есть активный абонемент на {}", student.getFullName(), month);
                    continue;
                }

                calculateAndCreateSubscription(student.getId(), month);
            } catch (Exception e) {
                log.error("Ошибка для ученика {}: {}", student.getId(), e.getMessage(), e);
            }
        }
    }
}