package com.example.demo.service;

import com.example.demo.entity.Lesson;
import com.example.demo.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationScheduler {

    private final LessonRepository lessonRepository;
    private final EmailService emailService;

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
                    log.error("Ошибка отправки напоминания для урока {}: {}", lesson.getId(), e.getMessage(), e);
                }
            }
        }
    }

    private void sendReminder(Lesson lesson) {
        String studentName = lesson.getStudent().getFullName();
        String courseName = lesson.getCourse() != null ? lesson.getCourse().getName() : "Не указан";

        String tutorTimezone = lesson.getTutor().getTimezone() != null ? lesson.getTutor().getTimezone() : "Asia/Krasnoyarsk";
        ZonedDateTime utcTime = ZonedDateTime.of(lesson.getLessonDate(), lesson.getStartTime(), ZoneId.of("UTC"));
        ZonedDateTime tutorTime = utcTime.withZoneSameInstant(ZoneId.of(tutorTimezone));
        String timeForTutor = tutorTime.toLocalTime().toString().substring(0, 5);

        String subject = "⏰ Урок через 1 час — " + courseName;

        String htmlBody = String.format("""
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>⏰ Напоминание о занятии!</h2>
                    <p><strong>📅 Дата:</strong> %s</p>
                    <p><strong>🕐 Время:</strong> %s</p>
                    <p><strong>📚 Предмет:</strong> %s</p>
                    <p><strong>👨‍🎓 Ученик:</strong> %s</p>
                    <br>
                    <a href="https://ed-space.ru/dashboard" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">🔗 Перейти к уроку</a>
                    <br><br>
                    <p style="color: #9CA3AF; font-size: 12px;">© 2026 EdSpace. Письмо отправлено автоматически.</p>
                </body>
                </html>
                """,
                lesson.getLessonDate(), timeForTutor, courseName, studentName
        );

        // Репетитору
        emailService.sendHtmlEmail(lesson.getTutor().getEmail(), subject, htmlBody);
        log.info("📧 Напоминание репетитору: {}", lesson.getTutor().getEmail());

        // Ученику
        if (lesson.getStudent().getEmail() != null && !lesson.getStudent().getEmail().isEmpty()) {
            emailService.sendHtmlEmail(lesson.getStudent().getEmail(), subject, htmlBody);
            log.info("📧 Напоминание ученику: {}", lesson.getStudent().getEmail());
        }

        // Родителю
        if (lesson.getStudent().getParent() != null && lesson.getStudent().getParent().getEmail() != null) {
            emailService.sendHtmlEmail(lesson.getStudent().getParent().getEmail(), subject, htmlBody);
            log.info("📧 Напоминание родителю: {}", lesson.getStudent().getParent().getEmail());
        }
    }
}