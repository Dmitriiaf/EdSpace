// ========== backend/src/main/java/com/example/demo/service/LessonGeneratorService.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
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

@Slf4j  // ✅ Добавлена аннотация Lombok для логирования
@Service
public class LessonGeneratorService {

    @Autowired
    private WeeklyTemplateRepository templateRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private LessonConflictChecker conflictChecker;

    @Autowired
    private SubscriptionCalculator subscriptionCalculator;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public void generateLessons(LocalDate startDate, LocalDate endDate) {
        log.info("========================================");
        log.info("🔄 ГЕНЕРАЦИЯ ЗАНЯТИЙ");
        log.info("Период: с {} по {}", startDate, endDate);
        log.info("========================================");

        List<WeeklyTemplate> templates = templateRepository.findAll();

        if (templates.isEmpty()) {
            log.warn("⚠️ Нет шаблонов для генерации занятий");
            return;
        }

        log.info("Найдено шаблонов: {}", templates.size());

        int createdCount = 0;
        int skippedCount = 0;

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            int dayOfWeek = currentDate.getDayOfWeek().getValue();

            for (WeeklyTemplate template : templates) {
                if (template.getDayOfWeek() == dayOfWeek) {

                    boolean hasAnyLesson = lessonRepository.existsByTutorIdAndLessonDateAndStartTime(
                            template.getTutor().getId(),
                            currentDate,
                            template.getStartTime()
                    );

                    if (hasAnyLesson) {
                        skippedCount++;
                        continue;
                    }

                    String conflict = conflictChecker.checkConflicts(
                            template.getTutor().getId(),
                            template.getStudent().getEmail(),
                            currentDate,
                            template.getStartTime(),
                            template.getEndTime()
                    );

                    if (conflict == null) {
                        // ✅ КОНВЕРТАЦИЯ УБРАНА — используем время из шаблона как есть
                        int durationMinutes = (int) java.time.Duration.between(
                                template.getStartTime(),
                                template.getEndTime()
                        ).toMinutes();

                        Lesson lesson = new Lesson(
                                template.getTutor(),
                                template.getStudent(),
                                template.getCourse(),
                                currentDate,
                                template.getStartTime(),
                                template.getEndTime()
                        );
                        lesson.setWeeklyTemplateId(template.getId());
                        lesson.setDuration(durationMinutes);
                        lessonRepository.save(lesson);
                        createdCount++;
                    } else {
                        skippedCount++;
                    }
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        log.info("========================================");
        log.info("✅ СОЗДАНО ЗАНЯТИЙ: {}", createdCount);
        log.info("⏭️ ПРОПУЩЕНО: {}", skippedCount);
        log.info("========================================");

        recalculateAllSubscriptions();
    }

    @Transactional
    public void recalculateAllSubscriptions() {
        log.info("========================================");
        log.info("🔄 ПЕРЕСЧЁТ АБОНЕМЕНТОВ (только текущий месяц)");
        log.info("========================================");

        YearMonth currentMonth = YearMonth.now();

        List<Student> subscriptionStudents = studentRepository.findAll().stream()
                .filter(s -> "subscription".equals(s.getPaymentType()))
                .toList();

        log.info("Найдено учеников на абонементе: {}", subscriptionStudents.size());

        for (Student student : subscriptionStudents) {
            log.info("---");
            log.info("Обработка ученика: {} (ID: {})", student.getFullName(), student.getId());
            log.info("  Родитель: {}", student.getParent() != null ? student.getParent().getEmail() : "ОТСУТСТВУЕТ");
            log.info("  Ставка: {}", student.getRatePerLesson());

            if (student.getParent() == null) {
                log.warn("  ⚠️ У ученика нет родителя! Уведомления отправляться не будут.");
            }

            if (student.getRatePerLesson() == null) {
                log.warn("  ⚠️ У ученика не указана ставка! Абонемент не будет создан.");
            }

            try {
                recalculateSubscriptionForStudent(student.getId(), currentMonth);
            } catch (Exception e) {
                log.error("Ошибка при пересчёте абонемента для ученика {}: {}", student.getId(), e.getMessage(), e);
            }
        }

        log.info("========================================");
        log.info("✅ ПЕРЕСЧЁТ АБОНЕМЕНТОВ ЗАВЕРШЁН");
        log.info("========================================");
    }

    private void recalculateSubscriptionForStudent(Long studentId, YearMonth month) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            log.warn("  ❌ Ученик не найден: {}", studentId);
            return;
        }

        if (!"subscription".equals(student.getPaymentType())) {
            log.info("  → Ученик не на абонементе, пропускаем");
            return;
        }

        if (student.getTutors().isEmpty()) {
            log.warn("  ❌ У ученика нет репетитора");
            return;
        }

        int lessonsCount = subscriptionCalculator.countLessonsInMonthByTemplate(studentId, month);
        log.info("  Месяц {}: количество занятий по шаблонам = {}", month, lessonsCount);

        if (lessonsCount == 0) {
            log.info("  → Нет занятий, пропускаем");
            return;
        }

        BigDecimal rate = student.getRatePerLesson();
        if (rate == null) {
            log.warn("  ❌ Ставка не указана, пропускаем");
            return;
        }

        BigDecimal newTotalPrice = rate.multiply(BigDecimal.valueOf(lessonsCount));
        log.info("  Общая стоимость: {} ₽", newTotalPrice);

        List<Subscription> existingSubs = subscriptionRepository.findByStudentId(studentId);

        Subscription activeSubscription = null;
        Subscription pendingSubscription = null;

        for (Subscription sub : existingSubs) {
            YearMonth subMonth = YearMonth.from(sub.getStartDate());
            if (subMonth.equals(month)) {
                if ("active".equals(sub.getStatus())) {
                    activeSubscription = sub;
                } else if ("pending".equals(sub.getStatus())) {
                    pendingSubscription = sub;
                }
            }
        }

        if (activeSubscription != null) {
            log.info("  ✅ Найден АКТИВНЫЙ абонемент на {} (ID={}, занятий={}, сумма={} ₽)",
                    month, activeSubscription.getId(), activeSubscription.getLessonsCount(), activeSubscription.getPrice());

            if (lessonsCount > activeSubscription.getLessonsCount()) {
                int additionalLessons = lessonsCount - activeSubscription.getLessonsCount();
                BigDecimal additionalPrice = rate.multiply(BigDecimal.valueOf(additionalLessons));
                BigDecimal oldPrice = activeSubscription.getPrice();
                BigDecimal newPrice = oldPrice.add(additionalPrice);

                log.info("  → Обновляем АКТИВНЫЙ абонемент: {} → {} занятий",
                        activeSubscription.getLessonsCount(), lessonsCount);
                log.info("  → Сумма: {} → {} ₽", oldPrice, newPrice);

                activeSubscription.setLessonsCount(lessonsCount);
                activeSubscription.setPrice(newPrice);
                subscriptionRepository.save(activeSubscription);

                for (Subscription sub : existingSubs) {
                    YearMonth subMonth = YearMonth.from(sub.getStartDate());
                    if (subMonth.equals(month) && "pending".equals(sub.getStatus())) {
                        subscriptionRepository.delete(sub);
                        log.info("  → Удалён лишний pending абонемент (ID={})", sub.getId());
                    }
                }

                if (student.getParent() != null) {
                    String message = String.format(
                            "📢 В расписании %s на %s добавлены новые занятия.\n" +
                                    "Абонемент обновлён!\n\n" +
                                    "✅ Было: %d занятий (%s ₽)\n" +
                                    "✅ Стало: %d занятий (%s ₽)\n" +
                                    "💰 Доплата: %s ₽\n\n" +
                                    "Спасибо за своевременную оплату!",
                            student.getFullName(),
                            getMonthName(month),
                            activeSubscription.getLessonsCount() - additionalLessons,
                            oldPrice.toString(),
                            lessonsCount,
                            newPrice.toString(),
                            additionalPrice.toString()
                    );
                    notificationService.createSubscriptionNotification(
                            student.getParent().getId(),
                            activeSubscription.getId(),
                            message
                    );
                }
            }
            return;
        }

        if (pendingSubscription != null) {
            log.info("  → Обновляем существующий PENDING абонемент");
            pendingSubscription.setLessonsCount(lessonsCount);
            pendingSubscription.setPrice(newTotalPrice);
            subscriptionRepository.save(pendingSubscription);
            return;
        }

        log.info("  → Создаём НОВЫЙ абонемент");
        Subscription newSubscription = new Subscription(
                student.getTutors().get(0),
                student,
                lessonsCount,
                newTotalPrice,
                month.atDay(1),
                month.atEndOfMonth()
        );
        newSubscription.setStatus("pending");
        subscriptionRepository.save(newSubscription);

        if (student.getParent() != null) {
            String message = String.format(
                    "📢 Сформирован абонемент для %s на %s.\n" +
                            "%d занятий на сумму %s ₽.\n\n" +
                            "Перейдите в раздел 'Абонементы' для оплаты.",
                    student.getFullName(),
                    getMonthName(month),
                    lessonsCount,
                    newTotalPrice.toString()
            );
            notificationService.createSubscriptionNotification(
                    student.getParent().getId(),
                    newSubscription.getId(),
                    message
            );
        }
    }

    private String getMonthName(YearMonth month) {
        String[] months = {"январь", "февраль", "март", "апрель", "май", "июнь",
                "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"};
        return months[month.getMonthValue() - 1];
    }
}