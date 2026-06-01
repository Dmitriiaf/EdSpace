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
import java.util.ArrayList;
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

    @Autowired
    private LessonRepository lessonRepository;

    private static final int WEEKS_TO_CHECK = 4;

    /**
     * Проверяет конфликты на 4 недели вперёд ТОЛЬКО для указанного дня недели.
     * Блокирует только если ЗАНЯТЫ ВСЕ 4 недели.
     */
    private String checkConflictsForWeeks(Long tutorId, String studentEmail, int dayOfWeek,
                                          LocalTime startTime, LocalTime endTime) {
        LocalDate checkDate = getNextDateWithDayOfWeek(dayOfWeek);
        log.info("🔍 ПРОВЕРКА КОНФЛИКТОВ: стартовая дата = {}, день недели = {}", checkDate, dayOfWeek);

        int conflictsFound = 0;
        List<String> conflictDetails = new ArrayList<>();

        for (int week = 0; week < WEEKS_TO_CHECK; week++) {
            log.info("  Проверяем дату: {} (день недели: {})", checkDate, checkDate.getDayOfWeek());

            String conflict = conflictChecker.checkConflicts(
                    tutorId, studentEmail, checkDate, startTime, endTime);

            if (conflict != null) {
                conflictsFound++;
                conflictDetails.add(String.format("%s: %s", checkDate, conflict));
                log.warn("  ⚠️ Конфликт на дату {}: {}", checkDate, conflict);
            } else {
                log.info("  ✅ Дата {} свободна", checkDate);
            }

            checkDate = checkDate.plusWeeks(1);
        }

        if (conflictsFound == WEEKS_TO_CHECK) {
            log.error("❌ ВСЕ 4 недели заняты! Шаблон создать нельзя.");
            return String.format("Все 4 недели заняты. Конфликты: %s", String.join("; ", conflictDetails));
        }

        log.info("✅ Найдено {} конфликтов из {} — шаблон разрешён (свободных слотов: {})",
                conflictsFound, WEEKS_TO_CHECK, WEEKS_TO_CHECK - conflictsFound);
        return null;
    }

    /**
     * Проверяет конфликты при обновлении шаблона
     */
    private String checkConflictsForWeeksExcludingTemplate(Long tutorId, String studentEmail,
                                                           int dayOfWeek, LocalTime startTime,
                                                           LocalTime endTime, Long excludeTemplateId) {
        LocalDate checkDate = getNextDateWithDayOfWeek(dayOfWeek);

        int conflictsFound = 0;
        List<String> conflictDetails = new ArrayList<>();

        for (int week = 0; week < WEEKS_TO_CHECK; week++) {
            String conflict = conflictChecker.checkConflicts(
                    tutorId, studentEmail, checkDate, startTime, endTime);

            if (conflict != null) {
                conflictsFound++;
                conflictDetails.add(String.format("%s: %s", checkDate, conflict));
            }

            checkDate = checkDate.plusWeeks(1);
        }

        if (conflictsFound == WEEKS_TO_CHECK) {
            return String.format("Все 4 недели заняты. Конфликты: %s", String.join("; ", conflictDetails));
        }

        return null;
    }

    /**
     * Возвращает дату следующего вхождения указанного дня недели.
     */
    private LocalDate getNextDateWithDayOfWeek(int dayOfWeek) {
        LocalDate today = LocalDate.now();
        int currentDayOfWeek = today.getDayOfWeek().getValue();

        int daysToAdd = dayOfWeek - currentDayOfWeek;
        if (daysToAdd < 0) {
            daysToAdd += 7;
        } else if (daysToAdd == 0) {
            daysToAdd = 7;
        }

        return today.plusDays(daysToAdd);
    }

    /**
     * Удаляет разовые занятия (без шаблона) ТОЛЬКО для ученика шаблона,
     * которые пересекаются с новым шаблоном
     */
    private void deleteConflictingSingleLessons(Long tutorId, int dayOfWeek,
                                                LocalTime startTime, LocalTime endTime, Long studentId) {
        LocalDate checkDate = getNextDateWithDayOfWeek(dayOfWeek);
        int deleted = 0;

        for (int week = 0; week < WEEKS_TO_CHECK; week++) {
            List<Lesson> lessons = lessonRepository.findByTutorIdAndLessonDate(tutorId, checkDate);

            for (Lesson lesson : lessons) {
                boolean overlaps = lesson.getStartTime().isBefore(endTime)
                        && lesson.getEndTime().isAfter(startTime);

                // ✅ Удаляем только разовые занятия ТОГО ЖЕ ученика
                if (overlaps
                        && lesson.getWeeklyTemplateId() == null
                        && lesson.getStudent().getId().equals(studentId)
                        && !"CANCELLED".equals(lesson.getStatus())
                        && !"PAID".equals(lesson.getStatus())) {
                    lessonRepository.delete(lesson);
                    deleted++;
                    log.info("  🗑️ Удалено разовое занятие ID={} на дату {} ({} {}-{})",
                            lesson.getId(), checkDate,
                            lesson.getStudent().getFullName(),
                            lesson.getStartTime(), lesson.getEndTime());
                }
            }
            checkDate = checkDate.plusWeeks(1);
        }

        if (deleted > 0) {
            log.info("🧹 Удалено {} разовых занятий, заменённых шаблоном", deleted);
        }
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

        // Удаляем разовые занятия на 4 недели вперёд
        deleteConflictingSingleLessons(tutorId, dayOfWeek, startTime, endTime, studentId);

        // ✅ МГНОВЕННАЯ ГЕНЕРАЦИЯ УРОКОВ на 4 недели вперёд
        generateLessonsForTemplate(savedTemplate);

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

        // Сохраняем старые значения для сравнения
        boolean timeChanged = !template.getStartTime().equals(startTime) || !template.getEndTime().equals(endTime);
        boolean studentChanged = !template.getStudent().getId().equals(studentId);

        template.setStudent(student);
        template.setCourse(course);
        template.setDayOfWeek(dayOfWeek);
        template.setStartTime(startTime);
        template.setEndTime(endTime);

        WeeklyTemplate updatedTemplate = templateRepository.save(template);

        // ✅ ОБНОВЛЯЕМ БУДУЩИЕ УРОКИ, если изменилось время или ученик
        if (timeChanged || studentChanged) {
            updateFutureLessonsFromTemplate(updatedTemplate, timeChanged, studentChanged);
        }

        recalculateSubscriptionsForStudent(studentId);

        log.info("✅ Шаблон обновлён: ID={}, ученик={}, день={}, время={}-{}",
                id, student.getFullName(), dayOfWeek, startTime, endTime);
        return updatedTemplate;
    }

    /**
     * Обновляет все будущие SCHEDULED уроки этого шаблона.
     */
    private void updateFutureLessonsFromTemplate(WeeklyTemplate template, boolean timeChanged, boolean studentChanged) {
        LocalDate today = LocalDate.now();
        List<Lesson> futureLessons = lessonRepository.findByTemplateIdAndLessonDateAfterAndStatus(
                template.getId(), today, Lesson.STATUS_SCHEDULED);

        if (futureLessons.isEmpty()) {
            log.info("  → Нет будущих уроков для обновления");
            return;
        }

        for (Lesson lesson : futureLessons) {
            if (timeChanged) {
                lesson.setStartTime(template.getStartTime());
                lesson.setEndTime(template.getEndTime());
                lesson.setDuration((int) java.time.Duration.between(template.getStartTime(), template.getEndTime()).toMinutes());
            }
            if (studentChanged) {
                lesson.setStudent(template.getStudent());
            }
            if (template.getCourse() != null) {
                lesson.setCourse(template.getCourse());
            }
        }

        lessonRepository.saveAll(futureLessons);
        log.info("  ✅ Обновлено {} будущих уроков", futureLessons.size());
    }

    /**
     * Генерирует уроки по шаблону на 4 недели вперёд.
     */
    private void generateLessonsForTemplate(WeeklyTemplate template) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusWeeks(4);
        int generated = 0;

        LocalDate current = today;
        while (!current.isAfter(endDate)) {
            if (current.getDayOfWeek().getValue() == template.getDayOfWeek()) {
                // Проверяем, нет ли уже урока на эту дату
                if (!lessonRepository.existsByTemplateIdAndLessonDate(template.getId(), current)) {
                    // Проверяем конфликт
                    String conflict = conflictChecker.checkConflicts(
                            template.getTutor().getId(),
                            template.getStudent().getEmail(),
                            current,
                            template.getStartTime(),
                            template.getEndTime()
                    );

                    if (conflict == null) {
                        Lesson lesson = new Lesson(
                                template.getTutor(),
                                template.getStudent(),
                                template.getCourse(),
                                current,
                                template.getStartTime(),
                                template.getEndTime()
                        );
                        lesson.setWeeklyTemplateId(template.getId());
                        lesson.setDuration((int) java.time.Duration.between(template.getStartTime(), template.getEndTime()).toMinutes());
                        lessonRepository.save(lesson);
                        generated++;
                    } else {
                        log.warn("  ⚠️ Пропущена дата {} из-за конфликта: {}", current, conflict);
                    }
                }
            }
            current = current.plusDays(1);
        }

        log.info("📅 Сгенерировано {} уроков по шаблону ID={} ({} - {})",
                generated, template.getId(), today, endDate);
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