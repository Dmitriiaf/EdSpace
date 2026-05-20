// ========== backend/src/main/java/com/example/demo/service/WeeklyTemplateService.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

@Slf4j
@Service
public class WeeklyTemplateService {

    @Autowired
    private WeeklyTemplateRepository templateRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LessonConflictChecker conflictChecker;

    @Autowired
    private SubscriptionCalculator subscriptionCalculator;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private NotificationService notificationService;

    private static final int WEEKS_TO_CHECK = 4;

    private String checkConflictsForWeeks(Long tutorId, String studentEmail, int dayOfWeek,
                                          LocalTime startTime, LocalTime endTime) {
        LocalDate checkDate = getNextDateWithDayOfWeek(dayOfWeek);
        log.info("🔍 ПРОВЕРКА КОНФЛИКТОВ: стартовая дата = {}, день недели = {}", checkDate, dayOfWeek);
        int weeksChecked = 0;

        while (weeksChecked < WEEKS_TO_CHECK) {
            while (checkDate.getDayOfWeek().getValue() != dayOfWeek) {
                checkDate = checkDate.plusDays(1);
            }

            String conflict = conflictChecker.checkConflicts(
                    tutorId, studentEmail, checkDate, startTime, endTime);

            if (conflict != null) {
                log.warn("Конфликт найден на дату {}: {}", checkDate, conflict);
                return String.format("%s (на дату %s)", conflict, checkDate);
            }

            checkDate = checkDate.plusDays(1);
            weeksChecked++;
        }

        return null;
    }

    private String checkConflictsForWeeksExcludingTemplate(Long tutorId, String studentEmail,
                                                           int dayOfWeek, LocalTime startTime,
                                                           LocalTime endTime, Long excludeTemplateId) {
        LocalDate checkDate = getNextDateWithDayOfWeek(dayOfWeek);
        int weeksChecked = 0;

        while (weeksChecked < WEEKS_TO_CHECK) {
            while (checkDate.getDayOfWeek().getValue() != dayOfWeek) {
                checkDate = checkDate.plusDays(1);
            }

            String conflict = conflictChecker.checkConflicts(
                    tutorId, studentEmail, checkDate, startTime, endTime);

            if (conflict != null) {
                log.warn("Конфликт найден на дату {}: {}", checkDate, conflict);
                return String.format("%s (на дату %s)", conflict, checkDate);
            }

            checkDate = checkDate.plusDays(1);
            weeksChecked++;
        }

        return null;
    }

    private LocalDate getNextDateWithDayOfWeek(int dayOfWeek) {
        LocalDate today = LocalDate.now();
        int currentDayOfWeek = today.getDayOfWeek().getValue();

        int daysToAdd = dayOfWeek - currentDayOfWeek;
        if (daysToAdd < 0) {
            daysToAdd += 7;
        } else if (daysToAdd == 0) {
            daysToAdd = 7; // Сегодня — пропускаем, берём через неделю
        }

        return today.plusDays(daysToAdd);
    }

    @Transactional
    public WeeklyTemplate createTemplate(Long tutorId, Long studentId, Long courseId,
                                         Integer dayOfWeek, LocalTime startTime, LocalTime endTime) {

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        Course course = courseId != null ? courseRepository.findById(courseId).orElse(null) : null;

        if (course != null) {
            boolean alreadyEnrolled = course.getEnrolledStudents().stream()
                    .anyMatch(s -> s.getId().equals(studentId));
            if (!alreadyEnrolled) {
                course.getEnrolledStudents().add(student);
                courseRepository.save(course);
                log.info("✅ Ученик {} автоматически записан на курс {}", student.getFullName(), course.getName());
            }
        }

        boolean exists = templateRepository.existsByTutorIdAndDayOfWeekAndStartTime(
                tutorId, dayOfWeek, startTime);

        if (exists) {
            throw new RuntimeException("На это время уже есть шаблон занятия");
        }

        String conflict = checkConflictsForWeeks(
                tutorId,
                student.getEmail(),
                dayOfWeek,
                startTime,
                endTime
        );

        if (conflict != null) {
            throw new RuntimeException("Нельзя создать шаблон: " + conflict);
        }

        WeeklyTemplate template = new WeeklyTemplate(tutor, student, course, dayOfWeek, startTime, endTime);
        template.setStatus("SCHEDULED");

        WeeklyTemplate savedTemplate = templateRepository.save(template);

        recalculateSubscriptionsForStudent(studentId);

        log.info("✅ Шаблон создан: ученик={}, день={}, время={}-{}",
                student.getFullName(), dayOfWeek, startTime, endTime);
        return savedTemplate;
    }

    public List<WeeklyTemplate> getTemplatesByTutor(Long tutorId) {
        return templateRepository.findByTutorId(tutorId);
    }

    public WeeklyTemplate getTemplateById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Шаблон не найден"));
    }

    @Transactional
    public WeeklyTemplate updateTemplate(Long id, Long studentId, Long courseId,
                                         Integer dayOfWeek, LocalTime startTime, LocalTime endTime) {
        WeeklyTemplate template = getTemplateById(id);

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        Course course = courseId != null ? courseRepository.findById(courseId).orElse(null) : null;

        if (course != null) {
            boolean alreadyEnrolled = course.getEnrolledStudents().stream()
                    .anyMatch(s -> s.getId().equals(studentId));
            if (!alreadyEnrolled) {
                course.getEnrolledStudents().add(student);
                courseRepository.save(course);
                log.info("✅ Ученик {} автоматически записан на курс {}", student.getFullName(), course.getName());
            }
        }

        boolean exists = templateRepository.existsByTutorIdAndDayOfWeekAndStartTime(
                template.getTutor().getId(), dayOfWeek, startTime);

        if (exists && (template.getDayOfWeek() != dayOfWeek || !template.getStartTime().equals(startTime))) {
            throw new RuntimeException("На это время уже есть шаблон занятия");
        }

        String conflict = checkConflictsForWeeksExcludingTemplate(
                template.getTutor().getId(),
                student.getEmail(),
                dayOfWeek,
                startTime,
                endTime,
                id
        );

        if (conflict != null) {
            throw new RuntimeException("Нельзя обновить шаблон: " + conflict);
        }

        template.setStudent(student);
        template.setCourse(course);
        template.setDayOfWeek(dayOfWeek);
        template.setStartTime(startTime);
        template.setEndTime(endTime);

        WeeklyTemplate updatedTemplate = templateRepository.save(template);

        recalculateSubscriptionsForStudent(studentId);

        log.info("✅ Шаблон обновлён: ID={}, ученик={}, день={}, время={}-{}",
                id, student.getFullName(), dayOfWeek, startTime, endTime);
        return updatedTemplate;
    }

    @Transactional
    public void deleteTemplate(Long id) {
        WeeklyTemplate template = getTemplateById(id);
        Long studentId = template.getStudent().getId();
        templateRepository.delete(template);

        recalculateSubscriptionsForStudent(studentId);

        log.info("🗑️ Шаблон удалён, ID: {}", id);
    }

    @Transactional
    public WeeklyTemplate updateStatus(Long id, String status) {
        WeeklyTemplate template = getTemplateById(id);
        template.setStatus(status);
        return templateRepository.save(template);
    }

    private void recalculateSubscriptionsForStudent(Long studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null || !"subscription".equals(student.getPaymentType())) {
            log.debug("  → Ученик не на абонементе, пересчёт не требуется");
            return;
        }

        log.info("🔄 Пересчёт абонементов для ученика: {}", student.getFullName());

        YearMonth currentMonth = YearMonth.now();

        recalculateSubscriptionForMonth(studentId, currentMonth);
    }

    private void recalculateSubscriptionForMonth(Long studentId, YearMonth month) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return;

        if (!"subscription".equals(student.getPaymentType())) {
            return;
        }

        if (student.getTutors().isEmpty()) {
            log.debug("  → У ученика нет репетитора, пропускаем");
            return;
        }

        int lessonsCount = subscriptionCalculator.countLessonsInMonthByTemplate(studentId, month);
        if (lessonsCount == 0) return;

        BigDecimal rate = student.getRatePerLesson();
        if (rate == null) return;

        BigDecimal newTotalPrice = rate.multiply(BigDecimal.valueOf(lessonsCount));

        List<Subscription> existingSubs = subscriptionRepository.findByStudentId(studentId);

        Subscription activeSubscription = null;
        Subscription pendingSubscription = null;

        for (Subscription sub : existingSubs) {
            YearMonth subMonth = YearMonth.from(sub.getStartDate());
            if (subMonth.equals(month)) {
                if ("ACTIVE".equals(sub.getStatus())) {
                    activeSubscription = sub;
                } else if ("PENDING".equals(sub.getStatus())) {
                    pendingSubscription = sub;
                }
            }
        }

        if (activeSubscription != null) {
            log.info("  ✅ Найден АКТИВНЫЙ абонемент на {}", month);

            if (lessonsCount > activeSubscription.getLessonsCount()) {
                int additionalLessons = lessonsCount - activeSubscription.getLessonsCount();
                BigDecimal additionalPrice = rate.multiply(BigDecimal.valueOf(additionalLessons));
                BigDecimal oldPrice = activeSubscription.getPrice();
                BigDecimal newPrice = oldPrice.add(additionalPrice);

                log.info("  → Обновляем АКТИВНЫЙ абонемент: {} → {} занятий",
                        activeSubscription.getLessonsCount(), lessonsCount);

                activeSubscription.setLessonsCount(lessonsCount);
                activeSubscription.setPrice(newPrice);
                subscriptionRepository.save(activeSubscription);

                for (Subscription sub : existingSubs) {
                    YearMonth subMonth = YearMonth.from(sub.getStartDate());
                    if (subMonth.equals(month) && "PENDING".equals(sub.getStatus())) {
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
                                    "💰 Доплата: %s ₽",
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
        newSubscription.setStatus("PENDING");
        subscriptionRepository.save(newSubscription);

        if (student.getParent() != null) {
            String message = String.format(
                    "📢 Сформирован абонемент для %s на %s.\n" +
                            "%d занятий на сумму %s ₽.",
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