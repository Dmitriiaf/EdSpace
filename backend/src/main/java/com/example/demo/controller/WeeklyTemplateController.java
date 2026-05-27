// ========== backend/src/main/java/com/example/demo/controller/WeeklyTemplateController.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.controller;

import com.example.demo.entity.WeeklyTemplate;
import com.example.demo.entity.Tutor;
import com.example.demo.service.WeeklyTemplateService;
import com.example.demo.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import com.example.demo.repository.LessonRepository;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/weekly-template")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class WeeklyTemplateController {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private WeeklyTemplateService templateService;

    @Autowired
    private TutorRepository tutorRepository;

    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTemplates(@PathVariable Long tutorId,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<WeeklyTemplate> templates = templateService.getTemplatesByTutor(tutorId);
            return ResponseEntity.ok(templates);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createTemplate(@RequestBody Map<String, Object> request,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Long tutorId = Long.parseLong(request.get("tutorId").toString());

            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            // Получаем часовой пояс репетитора
            Tutor tutor = tutorRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Репетитор не найден"));
            String tutorTimezone = tutor.getTimezone() != null ? tutor.getTimezone() : "Asia/Krasnoyarsk";

            // Обработка 24:00 → 00:00
            String startTimeStr = request.get("startTime").toString();
            String endTimeStr = request.get("endTime").toString();

            if ("24:00:00".equals(startTimeStr) || "24:00".equals(startTimeStr)) startTimeStr = "00:00:00";
            if ("24:00:00".equals(endTimeStr) || "24:00".equals(endTimeStr)) endTimeStr = "00:00:00";

            LocalTime localStartTime = LocalTime.parse(startTimeStr);
            LocalTime localEndTime = LocalTime.parse(endTimeStr);
            int dayOfWeek = Integer.parseInt(request.get("dayOfWeek").toString());

            // Если время между 00:00 и 04:00 — это ночное время, сдвигаем день недели
            if (localStartTime.isAfter(LocalTime.of(0, 0).minusNanos(1))
                    && localStartTime.isBefore(LocalTime.of(4, 0))) {
                dayOfWeek = dayOfWeek % 7 + 1;
            }

            // Конвертируем локальное время в UTC и определяем реальный день недели в UTC
            LocalDate monday = LocalDate.now().with(java.time.DayOfWeek.MONDAY);
            LocalDate localDate = monday.plusDays(dayOfWeek - 1);

            ZonedDateTime tutorZonedStart = ZonedDateTime.of(localDate, localStartTime, ZoneId.of(tutorTimezone));
            ZonedDateTime utcZonedStart = tutorZonedStart.withZoneSameInstant(ZoneId.of("UTC"));
            ZonedDateTime utcZonedEnd = utcZonedStart.plusMinutes(
                    java.time.Duration.between(localStartTime, localEndTime).toMinutes()
            );

            int utcDayOfWeek = dayOfWeek;
            LocalTime utcStartTime = utcZonedStart.toLocalTime();
            LocalTime utcEndTime = utcZonedEnd.toLocalTime();

            WeeklyTemplate template = templateService.createTemplate(
                    tutorId,
                    Long.parseLong(request.get("studentId").toString()),
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    utcDayOfWeek,
                    utcStartTime,
                    utcEndTime
            );
            return ResponseEntity.ok(template);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateTemplate(@PathVariable Long id,
                                            @RequestBody Map<String, Object> request,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            WeeklyTemplate template = templateService.getTemplateById(id);

            if (!template.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Tutor tutor = tutorRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("Репетитор не найден"));
            String tutorTimezone = tutor.getTimezone() != null ? tutor.getTimezone() : "Asia/Krasnoyarsk";

            String startTimeStr = request.get("startTime").toString();
            String endTimeStr = request.get("endTime").toString();

            if ("24:00:00".equals(startTimeStr) || "24:00".equals(startTimeStr)) startTimeStr = "00:00:00";
            if ("24:00:00".equals(endTimeStr) || "24:00".equals(endTimeStr)) endTimeStr = "00:00:00";

            LocalTime localStartTime = LocalTime.parse(startTimeStr);
            LocalTime localEndTime = LocalTime.parse(endTimeStr);
            int dayOfWeek = Integer.parseInt(request.get("dayOfWeek").toString());

            if (localStartTime.isAfter(LocalTime.of(0, 0).minusNanos(1))
                    && localStartTime.isBefore(LocalTime.of(4, 0))) {
                dayOfWeek = dayOfWeek % 7 + 1;
            }

            LocalDate monday = LocalDate.now().with(java.time.DayOfWeek.MONDAY);
            LocalDate localDate = monday.plusDays(dayOfWeek - 1);

            ZonedDateTime tutorZonedStart = ZonedDateTime.of(localDate, localStartTime, ZoneId.of(tutorTimezone));
            ZonedDateTime utcZonedStart = tutorZonedStart.withZoneSameInstant(ZoneId.of("UTC"));
            ZonedDateTime utcZonedEnd = utcZonedStart.plusMinutes(
                    java.time.Duration.between(localStartTime, localEndTime).toMinutes()
            );

            int utcDayOfWeek = dayOfWeek;
            LocalTime utcStartTime = utcZonedStart.toLocalTime();
            LocalTime utcEndTime = utcZonedEnd.toLocalTime();

            WeeklyTemplate updatedTemplate = templateService.updateTemplate(
                    id,
                    Long.parseLong(request.get("studentId").toString()),
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    utcDayOfWeek,
                    utcStartTime,
                    utcEndTime
            );
            return ResponseEntity.ok(updatedTemplate);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> request,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            WeeklyTemplate template = templateService.getTemplateById(id);

            if (!template.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            WeeklyTemplate updatedTemplate = templateService.updateStatus(id, request.get("status"));
            return ResponseEntity.ok(updatedTemplate);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteTemplate(@PathVariable Long id,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            WeeklyTemplate template = templateService.getTemplateById(id);

            if (!template.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            LocalDate today = LocalDate.now();
            int deletedLessons = lessonRepository.deleteFutureLessonsByTemplateId(id, today);

            templateService.deleteTemplate(id);

            String message = deletedLessons > 0
                    ? "Шаблон и " + deletedLessons + " будущих занятий удалены"
                    : "Шаблон удалён (будущих занятий не было)";

            return ResponseEntity.ok(Map.of(
                    "message", message,
                    "deletedLessons", deletedLessons
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}