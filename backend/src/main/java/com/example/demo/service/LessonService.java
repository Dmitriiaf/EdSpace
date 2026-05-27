// ========== backend/src/main/java/com/example/demo/service/LessonService.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.service;

import java.util.stream.Collectors;
import com.example.demo.entity.*;
import com.example.demo.exception.BusinessException;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
public class LessonService {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private LessonConflictChecker conflictChecker;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    public List<Lesson> getLessonsByTutorAndDate(Long tutorId, LocalDate date) {
        return lessonRepository.findByTutorIdAndLessonDate(tutorId, date);
    }

    public Student getStudentById(Long studentId) {
        return studentRepository.findByIdWithRates(studentId)
                .orElseThrow(() -> new NotFoundException("Ученик", "id", studentId));
    }

    @Transactional
    public Lesson createLesson(Long tutorId, Long studentId, Long courseId,
                               LocalDate lessonDate, LocalTime startTime, LocalTime endTime) {
        log.info("Создание занятия: tutorId={}, studentId={}, date={}, time={}-{}",
                tutorId, studentId, lessonDate, startTime, endTime);

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", tutorId));
        Student student = studentRepository.findByIdWithRates(studentId)
                .orElseThrow(() -> new NotFoundException("Ученик", "id", studentId));

        Course course = null;
        if (courseId != null) {
            course = courseRepository.findByIdWithStudents(courseId).orElse(null);
            if (course != null) {
                boolean alreadyEnrolled = course.getEnrolledStudents().stream()
                        .anyMatch(s -> s.getId().equals(studentId));
                if (!alreadyEnrolled) {
                    course.getEnrolledStudents().add(student);
                    courseRepository.save(course);
                    log.info("✅ Ученик {} автоматически записан на курс {}", student.getFullName(), course.getName());
                }
            }
        }

        String conflict = conflictChecker.checkConflicts(
                tutorId, student.getEmail(), lessonDate, startTime, endTime);

        if (conflict != null) {
            log.warn("Конфликт при создании занятия: {}", conflict);
            throw new BusinessException(conflict);
        }

        Lesson lesson = new Lesson(tutor, student, course, lessonDate, startTime, endTime);
        Lesson savedLesson = lessonRepository.save(lesson);

        log.info("Занятие успешно создано: id={}", savedLesson.getId());
        return savedLesson;
    }

    public Lesson saveLesson(Lesson lesson) {
        return lessonRepository.save(lesson);
    }

    public List<Lesson> getCompletedLessons(Long studentId, Long tutorId, Long courseId, int limit) {
        List<Lesson> lessons = lessonRepository.findCompletedLessonsByStudentAndCourse(studentId, tutorId, courseId);
        return lessons.stream().limit(limit).collect(Collectors.toList());
    }

    public List<Lesson> getTodayLessons(Long tutorId) {
        log.debug("Загрузка занятий на сегодня для репетитора: {}", tutorId);
        return lessonRepository.findByTutorIdAndLessonDateOrderByStartTimeAsc(tutorId, LocalDate.now());
    }

    public List<Lesson> getUpcomingLessons(Long tutorId) {
        log.debug("Загрузка предстоящих занятий для репетитора: {}", tutorId);
        return lessonRepository.findUpcomingLessons(tutorId, LocalDate.now());
    }

    public List<Lesson> getActiveLessons(Long tutorId) {
        return lessonRepository.findActiveLessonsSince(tutorId, LocalDate.now().minusDays(7));
    }


    public List<Lesson> getAllLessons(Long tutorId) {
        log.error(">>> NEW METHOD CALLED with since={}", LocalDate.now().minusDays(14));
        List<Lesson> lessons = lessonRepository.findAllByTutorIdSince(tutorId, LocalDate.now().minusDays(14));
        log.error(">>> NEW METHOD RETURNED {} lessons", lessons.size());
        return lessons;
    }

    private boolean hasTimeConflict(List<Lesson> existingLessons, LocalTime newStart, int duration) {
        LocalTime newEnd = newStart.plusMinutes(duration);

        return existingLessons.stream()
                .filter(l -> !"CANCELLED".equals(l.getStatus()))
                .anyMatch(l -> {
                    LocalTime existStart = l.getStartTime();
                    int existDuration = l.getDuration() != null ? l.getDuration() : 60;
                    LocalTime existEnd = existStart.plusMinutes(existDuration);

                    return newEnd.isAfter(existStart) && newStart.isBefore(existEnd);
                });
    }

    public List<Lesson> getArchivedLessons(Long tutorId) {
        log.debug("Загрузка архивных занятий для репетитора: {}", tutorId);
        return lessonRepository.findArchivedLessons(tutorId);
    }

    public List<Lesson> getLessonsByStudent(Long studentId) {
        log.debug("Загрузка занятий для ученика: {}", studentId);
        return lessonRepository.findByStudentIdOrderByLessonDateAscStartTimeAsc(studentId);
    }

    public Lesson getLessonById(Long id) {
        return lessonRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new NotFoundException("Занятие", "id", id));
    }

    @Transactional
    public Lesson completeLesson(Long lessonId, String notes, String nextLessonPlan) {
        log.info("Завершение занятия: id={}", lessonId);

        Lesson lesson = getLessonById(lessonId);
        boolean isSubscription = "subscription".equals(
                lesson.getStudent().getPaymentTypeForTutor(lesson.getTutor().getId())
        );

        if (lesson.getOriginalLesson() != null) {
            return completeRescheduledLesson(lessonId, notes, nextLessonPlan);
        }

        if (!"SCHEDULED".equals(lesson.getStatus()) && !"IN_PROGRESS".equals(lesson.getStatus())) {
            log.warn("Попытка завершить неподходящее занятие. Статус: {}", lesson.getStatus());
            throw new BusinessException("Можно завершить только запланированное или начатое занятие");
        }

        // ✅ Пробное занятие с ценой 0 — сразу PAID (проверяем ДО абонемента)
        if (lesson.getIsTrial() != null && lesson.getIsTrial() &&
                (lesson.getTrialPrice() == null || lesson.getTrialPrice().compareTo(BigDecimal.ZERO) == 0)) {
            lesson.setStatus("PAID");
            lesson.setPaidAt(LocalDateTime.now());
            log.info("Пробное занятие (бесплатное) автоматически оплачено");
        } else if (isSubscription) {
            lesson.setStatus("PAID");
            lesson.setPaidAt(LocalDateTime.now());
            log.info("Занятие по абонементу автоматически оплачено");

            // АВТОСПИСАНИЕ ИЗ АБОНЕМЕНТА
            subscriptionRepository
                    .findByStudentIdAndTutorIdAndStatus(
                            lesson.getStudent().getId(),
                            lesson.getTutor().getId(),
                            "ACTIVE"
                    )
                    .ifPresent(sub -> {
                        int used = sub.getLessonsUsed() != null ? sub.getLessonsUsed() + 1 : 1;
                        sub.setLessonsUsed(used);
                        boolean justExpired = false;
                        if (sub.getLessonsUsed() >= sub.getLessonsCount() && !"EXPIRED".equals(sub.getStatus())) {
                            sub.setStatus("EXPIRED");
                            justExpired = true;
                        }
                        subscriptionRepository.save(sub);
                        log.info("✅ Списано занятие из абонемента {}: использовано {}/{}",
                                sub.getId(), used, sub.getLessonsCount());

                        // Уведомление при исчерпании абонемента
                        if (justExpired) {
                            String expireMsg = String.format(
                                    "⚠️ У ученика %s закончился абонемент. Использовано %d/%d занятий.",
                                    lesson.getStudent().getFullName(),
                                    used,
                                    sub.getLessonsCount()
                            );
                            notificationService.createTutorNotification(
                                    lesson.getTutor().getId(),
                                    expireMsg
                            );
                            log.info("📢 Уведомление об исчерпании абонемента {} отправлено репетитору", sub.getId());
                        }
                    });
        } else {
            lesson.setStatus("COMPLETED");
            log.info("Занятие завершено, ожидает оплаты");
        }

        // ✅ Если урок создан через «Отработать» — списываем долг
        if (lesson.getOriginalLesson() != null && "CANCELLED".equals(lesson.getOriginalLesson().getStatus())) {
            Student student = lesson.getStudent();
            if ("subscription".equals(student.getPaymentTypeForTutor(lesson.getTutor().getId()))) {
                subscriptionRepository
                        .findByStudentIdAndTutorIdAndStatus(student.getId(), lesson.getTutor().getId(), "ACTIVE")
                        .ifPresent(sub -> {
                            if (sub.getDebtLessons() != null && sub.getDebtLessons() > 0) {
                                sub.setDebtLessons(sub.getDebtLessons() - 1);
                                subscriptionRepository.save(sub);
                                log.info("✅ Долг списан при завершении отработанного урока: абонемент={}, долгов={}", sub.getId(), sub.getDebtLessons());
                            }
                        });
            } else {
                if (student.getMissedLessons() != null && student.getMissedLessons() > 0) {
                    student.setMissedLessons(student.getMissedLessons() - 1);
                    studentRepository.save(student);
                    log.info("✅ Долг списан при завершении отработанного урока: ученик={}, пропусков={}", student.getId(), student.getMissedLessons());
                }
            }
        }

        lesson.setCompletedAt(LocalDateTime.now());

        if (notes != null && !notes.isEmpty()) {
            lesson.setNotes(notes);
        }
        if (nextLessonPlan != null && !nextLessonPlan.isEmpty()) {
            lesson.setNextLessonPlan(nextLessonPlan);
        }

        Lesson savedLesson = lessonRepository.save(lesson);

        if (!isSubscription && lesson.getStudent().getParent() != null) {
            BigDecimal correctRate = lesson.getStudent().getRateForTutor(lesson.getTutor().getId());
            String message = String.format(
                    "✅ Урок по %s с %s (%s %s) завершён. Пожалуйста, подтвердите оплату.\nСумма к оплате: %s ₽",
                    lesson.getCourse() != null ? lesson.getCourse().getName() : "занятию",
                    lesson.getStudent().getFullName(),
                    lesson.getLessonDate().toString(),
                    lesson.getStartTime().toString().substring(0, 5),
                    correctRate != null ? correctRate.toString() : "не указана"
            );
            notificationService.createNotification(
                    lesson.getStudent().getParent().getId(),
                    lesson.getId(),
                    message
            );
        }

        log.info("Занятие успешно завершено: id={}, статус={}", lessonId, savedLesson.getStatus());
        return savedLesson;
    }

    @Transactional
    public Lesson completeRescheduledLesson(Long lessonId, String notes, String nextLessonPlan) {
        log.info("Завершение перенесённого занятия: id={}", lessonId);

        Lesson rescheduledLesson = getLessonById(lessonId);

        Lesson originalLesson = rescheduledLesson.getOriginalLesson();
        if (originalLesson == null) {
            throw new BusinessException("Не найдено исходное занятие");
        }

        boolean isSubscription = "subscription".equals(
                originalLesson.getStudent().getPaymentTypeForTutor(originalLesson.getTutor().getId())
        );

        if (notes != null && !notes.isEmpty()) {
            originalLesson.setNotes(notes);
        }
        if (nextLessonPlan != null && !nextLessonPlan.isEmpty()) {
            originalLesson.setNextLessonPlan(nextLessonPlan);
        }

        if (isSubscription) {
            originalLesson.setStatus("PAID");
            originalLesson.setPaidAt(LocalDateTime.now());

            // АВТОСПИСАНИЕ ИЗ АБОНЕМЕНТА
            subscriptionRepository
                    .findByStudentIdAndTutorIdAndStatus(
                            originalLesson.getStudent().getId(),
                            originalLesson.getTutor().getId(),
                            "ACTIVE"
                    )
                    .ifPresent(sub -> {
                        int used = sub.getLessonsUsed() != null ? sub.getLessonsUsed() + 1 : 1;
                        sub.setLessonsUsed(used);
                        boolean justExpired = false;
                        if (sub.getLessonsUsed() >= sub.getLessonsCount() && !"EXPIRED".equals(sub.getStatus())) {
                            sub.setStatus("EXPIRED");
                            justExpired = true;
                        }
                        subscriptionRepository.save(sub);
                        log.info("✅ Списано занятие из абонемента {}: использовано {}/{}",
                                sub.getId(), used, sub.getLessonsCount());

                        if (justExpired) {
                            String expireMsg = String.format(
                                    "⚠️ У ученика %s закончился абонемент. Использовано %d/%d занятий.",
                                    originalLesson.getStudent().getFullName(),
                                    used,
                                    sub.getLessonsCount()
                            );
                            notificationService.createTutorNotification(
                                    originalLesson.getTutor().getId(),
                                    expireMsg
                            );
                            log.info("📢 Уведомление об исчерпании абонемента {} отправлено репетитору", sub.getId());
                        }
                    });
        } else {
            originalLesson.setStatus("COMPLETED");

            // ✅ Если пробное занятие и цена 0 — сразу PAID
            if (originalLesson.getIsTrial() != null && originalLesson.getIsTrial() &&
                    (originalLesson.getTrialPrice() == null || originalLesson.getTrialPrice().compareTo(BigDecimal.ZERO) == 0)) {
                originalLesson.setStatus("PAID");
                originalLesson.setPaidAt(LocalDateTime.now());
                log.info("Пробное занятие (бесплатное) автоматически оплачено");
            }
        }

        originalLesson.setCompletedAt(LocalDateTime.now());

        lessonRepository.delete(rescheduledLesson);

        Lesson savedOriginal = lessonRepository.save(originalLesson);

        log.info("Перенесённое занятие завершено и удалено: исходное id={}", savedOriginal.getId());

        return savedOriginal;
    }

    @Transactional
    public Lesson confirmPayment(Long lessonId) {
        log.info("Подтверждение оплаты занятия: id={}", lessonId);

        Lesson lesson = getLessonById(lessonId);

        if (!"COMPLETED".equals(lesson.getStatus())) {
            log.warn("Попытка оплатить неподходящее занятие. Статус: {}", lesson.getStatus());
            throw new BusinessException("Оплатить можно только проведённое занятие");
        }



        if ("PAID".equals(lesson.getStatus())) {
            throw new BusinessException("Занятие уже оплачено");
        }

        lesson.setStatus("PAID");
        lesson.setPaidAt(LocalDateTime.now());

        Lesson savedLesson = lessonRepository.save(lesson);
        log.info("Оплата подтверждена для занятия: id={}", lessonId);
        return savedLesson;
    }

    @Transactional
    public Lesson cancelLesson(Long lessonId, String reason) {
        log.info("Отмена занятия: id={}, причина={}", lessonId, reason);

        Lesson lesson = getLessonById(lessonId);

        // ✅ Если у урока есть originalLesson — это перенесённый урок (любой статус)
        if (lesson.getOriginalLesson() != null) {
            Lesson originalLesson = lesson.getOriginalLesson();

            // Отменяем оригинал
            originalLesson.setStatus("CANCELLED");
            if (reason != null && !reason.isEmpty()) {
                originalLesson.setNotes("❌ Отменено: перенесённый урок отменён. Причина: " + reason);
            } else {
                originalLesson.setNotes("❌ Отменено: перенесённый урок отменён");
            }
            originalLesson.setUpdatedAt(LocalDateTime.now());
            lessonRepository.save(originalLesson);

            // Отменяем перенесённый урок
            lesson.setStatus("CANCELLED");
            if (reason != null && !reason.isEmpty()) {
                lesson.setNotes("❌ Отменено: " + reason);
            } else {
                lesson.setNotes("❌ Отменено");
            }
            lesson.setUpdatedAt(LocalDateTime.now());

            // ✅ НЕ добавляем долг — урок был перенесён/начат, это не вина ученика

            Lesson savedLesson = lessonRepository.save(lesson);
            log.info("✅ Перенесённое занятие и оригинал отменены: новое id={}, оригинал id={}", lessonId, originalLesson.getId());

            // Уведомление родителю
            if (lesson.getStudent().getParent() != null) {
                String message = String.format(
                        "❌ Перенесённый урок %s %s отменён. Оригинальный урок также отменён.",
                        lesson.getLessonDate().toString(),
                        lesson.getStartTime().toString().substring(0, 5)
                );
                notificationService.createNotification(
                        lesson.getStudent().getParent().getId(),
                        lesson.getId(),
                        message
                );
            }

            return savedLesson;
        }

        if ("PAID".equals(lesson.getStatus())) {
            log.warn("Попытка отменить оплаченное занятие: id={}", lessonId);
            throw new BusinessException("Нельзя отменить уже оплаченное занятие");
        }

        if ("COMPLETED".equals(lesson.getStatus())) {
            log.warn("Попытка отменить проведённое занятие: id={}", lessonId);
            throw new BusinessException("Нельзя отменить уже проведённое занятие");
        }

        boolean isStudentNoShow = reason != null && reason.equals("Ученик не пришёл");

        if (isStudentNoShow) {
            Student student = lesson.getStudent();

            Optional<Subscription> activeSubscription = subscriptionRepository
                    .findByStudentIdAndTutorIdAndStatus(student.getId(), lesson.getTutor().getId(), "ACTIVE");

            if (activeSubscription.isPresent()) {
                Subscription subscription = activeSubscription.get();
                subscription.setDebtLessons(subscription.getDebtLessons() + 1);
                subscriptionRepository.save(subscription);
                log.info("Долг добавлен в абонемент id={}, долгов теперь: {}",
                        subscription.getId(), subscription.getDebtLessons());
            } else {
                student.setMissedLessons(student.getMissedLessons() != null ? student.getMissedLessons() + 1 : 1);
                studentRepository.save(student);
                log.info("Пропуск добавлен ученику id={}, пропусков теперь: {}",
                        student.getId(), student.getMissedLessons());
            }

            lesson.setStatus("CANCELLED");
            String newNotes = "❌ Ученик не пришёл";
            if (reason != null && !reason.equals("Ученик не пришёл")) {
                newNotes += ": " + reason;
            }
            lesson.setNotes(newNotes);
        } else {
            lesson.setStatus("CANCELLED");
            if (reason != null && !reason.isEmpty()) {
                String newNotes = "❌ Отменено: " + reason;
                if (lesson.getNotes() != null) {
                    lesson.setNotes(newNotes + "\n\n" + lesson.getNotes());
                } else {
                    lesson.setNotes(newNotes);
                }
            }

            // ✅ Если урок по абонементу — добавляем долг (для обычной отмены)
            if (!isStudentNoShow) {
                Student student = lesson.getStudent();
                if ("subscription".equals(student.getPaymentTypeForTutor(lesson.getTutor().getId()))) {
                    Optional<Subscription> activeSub = subscriptionRepository
                            .findByStudentIdAndTutorIdAndStatus(student.getId(), lesson.getTutor().getId(), "ACTIVE");
                    if (activeSub.isPresent()) {
                        Subscription sub = activeSub.get();
                        sub.setDebtLessons((sub.getDebtLessons() != null ? sub.getDebtLessons() : 0) + 1);
                        subscriptionRepository.save(sub);
                        log.info("Долг добавлен в абонемент id={} при отмене, долгов: {}", sub.getId(), sub.getDebtLessons());
                    }
                }
            }
        }

        if (lesson.getStudent().getParent() != null) {
            String message = isStudentNoShow ?
                    String.format("❌ Ученик %s не пришёл на занятие %s %s. Добавлен долг.",
                            lesson.getStudent().getFullName(),
                            lesson.getLessonDate().toString(),
                            lesson.getStartTime().toString().substring(0, 5)) :
                    String.format("❌ Урок по %s с %s (%s %s) отменён. Причина: %s",
                            lesson.getCourse() != null ? lesson.getCourse().getName() : "занятию",
                            lesson.getStudent().getFullName(),
                            lesson.getLessonDate().toString(),
                            lesson.getStartTime().toString().substring(0, 5),
                            reason != null ? reason : "не указана");

            notificationService.createNotification(
                    lesson.getStudent().getParent().getId(),
                    lesson.getId(),
                    message
            );
        }

        Lesson cancelledLesson = lessonRepository.save(lesson);
        log.info("Занятие отменено: id={}, неявка={}", lessonId, isStudentNoShow);

        return cancelledLesson;
    }

    @Transactional
    public Lesson addNotes(Long lessonId, String notes, String nextLessonPlan) {
        log.debug("Добавление заметок к занятию: id={}", lessonId);

        Lesson lesson = getLessonById(lessonId);

        if (notes != null) {
            lesson.setNotes(notes);
        }
        if (nextLessonPlan != null) {
            lesson.setNextLessonPlan(nextLessonPlan);
        }

        return lessonRepository.save(lesson);
    }

    public List<Lesson> getLessonsByTutorAndDateRange(Long tutorId, LocalDate start, LocalDate end) {
        return lessonRepository.findByTutorIdAndLessonDateBetween(tutorId, start, end);
    }

    @Transactional
    public Lesson rescheduleLesson(Long lessonId, LocalDate newDate, LocalTime newStartTime, LocalTime newEndTime) {
        log.info("Перенос занятия: id={}, новая дата={}, новое время={}-{}",
                lessonId, newDate, newStartTime, newEndTime);

        Lesson original = getLessonById(lessonId);

        if (original.getLessonDate().equals(newDate) &&
                original.getStartTime().equals(newStartTime) &&
                original.getEndTime().equals(newEndTime)) {
            throw new BusinessException("Нельзя перенести занятие на то же самое время");
        }

        if (original.isRescheduled()) {
            log.warn("Попытка перенести уже перенесённое занятие: id={}", lessonId);
            throw new BusinessException("Это занятие уже было перенесено. Перенесите новое занятие или создайте другое.");
        }

        if ("PAID".equals(original.getStatus())) {
            throw new BusinessException("Нельзя перенести уже оплаченное занятие");
        }

        if ("COMPLETED".equals(original.getStatus())) {
            throw new BusinessException("Нельзя перенести уже проведённое занятие. Дождитесь оплаты или создайте новое.");
        }

        if ("IN_PROGRESS".equals(original.getStatus())) {
            throw new BusinessException("Нельзя перенести занятие, которое уже началось. Завершите или отмените его.");
        }

        if ("CANCELLED".equals(original.getStatus())) {
            throw new BusinessException("Нельзя перенести отменённое занятие. Создайте новое.");
        }

        String conflict = conflictChecker.checkConflictsForReschedule(
                lessonId,
                original.getTutor().getId(),
                original.getStudent().getEmail(),
                newDate,
                newStartTime,
                newEndTime
        );

        if (conflict != null) {
            log.warn("Конфликт при переносе занятия: {}", conflict);
            throw new BusinessException(conflict);
        }

        Lesson newLesson = new Lesson(
                original.getTutor(),
                original.getStudent(),
                original.getCourse(),
                newDate,
                newStartTime,
                newEndTime
        );
        newLesson.setOriginalLesson(original);
        newLesson.setNotes(original.getNotes());
        newLesson.setNextLessonPlan(original.getNextLessonPlan());
        newLesson.setStatus("RESCHEDULED");
        newLesson.setWeeklyTemplateId(original.getWeeklyTemplateId());

        // ✅ VIDEO-1: Копируем настройки видео при переносе
        newLesson.setVideoPlatform(original.getVideoPlatform());
        newLesson.setVideoPlatformLink(original.getVideoPlatformLink());
        newLesson.setRoomSelected(original.getRoomSelected());

        original.setStatus("RESCHEDULED");
        original.setUpdatedAt(LocalDateTime.now());

        lessonRepository.save(original);
        Lesson savedNewLesson = lessonRepository.save(newLesson);

        if (original.getStudent().getParent() != null) {
            String message = String.format(
                    "🔄 Занятие по %s с %s перенесено с %s %s на %s %s",
                    original.getCourse() != null ? original.getCourse().getName() : "занятию",
                    original.getStudent().getFullName(),
                    original.getLessonDate().toString(),
                    original.getStartTime().toString().substring(0, 5),
                    newDate.toString(),
                    newStartTime.toString().substring(0, 5)
            );
            notificationService.createNotification(
                    original.getStudent().getParent().getId(),
                    savedNewLesson.getId(),
                    message
            );
        }

        log.info("Занятие успешно перенесено: исходное id={}, новое id={}", lessonId, savedNewLesson.getId());
        return savedNewLesson;
    }

    @Transactional
    public void deleteLesson(Long id) {
        log.info("Удаление занятия: id={}", id);

        Lesson lesson = getLessonById(id);

        if ("PAID".equals(lesson.getStatus())) {
            log.warn("Попытка удалить оплаченное занятие: id={}", id);
            throw new BusinessException("Нельзя удалить оплаченное занятие");
        }

        if ("COMPLETED".equals(lesson.getStatus())) {
            log.warn("Попытка удалить проведённое занятие: id={}", id);
            throw new BusinessException("Нельзя удалить проведённое занятие");
        }

        lessonRepository.delete(lesson);
        log.info("Занятие удалено: id={}", id);
    }
}