package com.example.demo.service;

import com.example.demo.entity.Lesson;
import com.example.demo.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationScheduler {

    private final LessonRepository lessonRepository;
    private final EmailService emailService;

    /**
     * Каждые 5 минут проверяет уроки, которые начнутся через 1 час
     */
    @Scheduled(fixedRate = 300000)
    public void sendLessonReminders() {
        LocalDate today = LocalDate.now();
        LocalTime oneHourFromNow = LocalTime.now().plusHours(1);
        LocalTime oneHourFiveMin = oneHourFromNow.plusMinutes(5);

        List<Lesson> upcomingLessons = lessonRepository.findByLessonDateAndStartTimeBetween(
                today, oneHourFromNow, oneHourFiveMin);

        for (Lesson lesson : upcomingLessons) {
            if ("SCHEDULED".equals(lesson.getStatus()) || "RESCHEDULED".equals(lesson.getStatus())) {
                try {
                    sendReminder(lesson);
                } catch (Exception e) {
                    log.error("Ошибка отправки напоминания для урока {}: {}", lesson.getId(), e.getMessage());
                }
            }
        }
    }

    private void sendReminder(Lesson lesson) {
        String studentName = lesson.getStudent().getFullName();
        String courseName = lesson.getCourse() != null ? lesson.getCourse().getName() : "Не указан";
        String time = lesson.getStartTime().toString().substring(0, 5);

        String subject = "⏰ Урок через 1 час — " + courseName;
        String body = String.format(
                "Напоминание о занятии!\n\n" +
                        "📅 Дата: %s\n" +
                        "🕐 Время: %s\n" +
                        "📚 Предмет: %s\n" +
                        "👨‍🎓 Ученик: %s\n\n" +
                        "🔗 Ссылка на урок: https://ed-space.ru/dashboard",
                lesson.getLessonDate(), time, courseName, studentName
        );

        // Репетитору
        emailService.sendSimpleEmail(lesson.getTutor().getEmail(), subject, body);
        log.info("📧 Напоминание репетитору: {}", lesson.getTutor().getEmail());

        // Ученику
        if (lesson.getStudent().getEmail() != null && !lesson.getStudent().getEmail().isEmpty()) {
            emailService.sendSimpleEmail(lesson.getStudent().getEmail(), subject, body);
            log.info("📧 Напоминание ученику: {}", lesson.getStudent().getEmail());
        }

        // Родителю
        if (lesson.getStudent().getParent() != null && lesson.getStudent().getParent().getEmail() != null) {
            emailService.sendSimpleEmail(lesson.getStudent().getParent().getEmail(), subject, body);
            log.info("📧 Напоминание родителю: {}", lesson.getStudent().getParent().getEmail());
        }
    }
}