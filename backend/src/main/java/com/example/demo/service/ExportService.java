// ========== backend/src/main/java/com/example/demo/service/ExportService.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ExportService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ProgressRecordRepository progressRecordRepository;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private final DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    /**
     * Формирование данных для отчёта по успеваемости ученика (CSV/JSON формат)
     */
    public Map<String, Object> generateStudentProgressReport(Long studentId, LocalDateTime startDate, LocalDateTime endDate) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        String tutorName = "";
        if (!student.getTutors().isEmpty()) {
            tutorName = student.getTutors().get(0).getFullName();
        }

        List<Lesson> lessons = lessonRepository.findByStudentIdOrderByLessonDateAscStartTimeAsc(studentId);
        List<Homework> homework = homeworkRepository.findByStudentId(studentId);
        List<Payment> payments = paymentRepository.findByStudentId(studentId);
        List<ProgressRecord> progress = progressRecordRepository.findByStudentIdAndDateRange(studentId, startDate, endDate);

        if (startDate != null && endDate != null) {
            lessons = lessons.stream()
                    .filter(l -> l.getLessonDate().atStartOfDay().isAfter(startDate) &&
                            l.getLessonDate().atStartOfDay().isBefore(endDate))
                    .toList();
            homework = homework.stream()
                    .filter(h -> h.getCreatedAt().isAfter(startDate) && h.getCreatedAt().isBefore(endDate))
                    .toList();
            payments = payments.stream()
                    .filter(p -> p.getPaymentDate().isAfter(startDate) && p.getPaymentDate().isBefore(endDate))
                    .toList();
        }

        int totalLessons = lessons.size();
        int completedLessons = (int) lessons.stream().filter(l -> "PAID".equals(l.getStatus()) || "COMPLETED".equals(l.getStatus())).count();
        int cancelledLessons = (int) lessons.stream().filter(l -> "CANCELLED".equals(l.getStatus())).count();

        int totalHomework = homework.size();
        int completedHomework = (int) homework.stream().filter(h -> "checked".equals(h.getStatus())).count();
        int submittedHomework = (int) homework.stream().filter(h -> "submitted".equals(h.getStatus())).count();

        double averageGrade = homework.stream()
                .filter(h -> h.getGrade() != null)
                .mapToInt(Homework::getGrade)
                .average()
                .orElse(0);

        double totalPayments = payments.stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        List<Map<String, Object>> progressTimeline = progress.stream()
                .map(p -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("date", p.getRecordDate().format(dateFormatter));
                    point.put("score", p.getScore() != null ? p.getScore() : 0);
                    point.put("grade", p.getGrade() != null ? p.getGrade() : 0);
                    point.put("topic", p.getTopic());
                    return point;
                })
                .toList();

        List<Map<String, Object>> lessonDetails = lessons.stream()
                .map(l -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("date", l.getLessonDate().format(dateFormatter));
                    detail.put("time", l.getStartTime().toString() + " - " + l.getEndTime().toString());
                    detail.put("course", l.getCourse() != null ? l.getCourse().getName() : "Занятие");
                    detail.put("status", getStatusText(l.getStatus()));
                    detail.put("notes", l.getNotes() != null ? l.getNotes() : "");
                    return detail;
                })
                .toList();

        List<Map<String, Object>> homeworkDetails = homework.stream()
                .map(h -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("task", h.getTask().length() > 200 ? h.getTask().substring(0, 200) + "..." : h.getTask());
                    detail.put("dueDate", h.getDueDate() != null ? h.getDueDate().format(dateFormatter) : "");
                    detail.put("submittedAt", h.getSubmittedAt() != null ? h.getSubmittedAt().format(dateFormatter) : "");
                    detail.put("grade", h.getGrade() != null ? h.getGrade() : "");
                    detail.put("score", h.getScore() != null ? h.getScore() : "");
                    detail.put("maxScore", h.getMaxScore() != null ? h.getMaxScore() : "");
                    detail.put("percentage", h.getPercentage() != null ? Math.round(h.getPercentage()) : "");
                    detail.put("status", getHomeworkStatusText(h.getStatus()));
                    return detail;
                })
                .toList();

        Map<String, Object> report = new HashMap<>();
        report.put("studentName", student.getFullName());
        report.put("studentEmail", student.getEmail() != null ? student.getEmail() : "");
        report.put("tutorName", tutorName);
        report.put("periodStart", startDate != null ? startDate.format(dateFormatter) : "все время");
        report.put("periodEnd", endDate != null ? endDate.format(dateFormatter) : "все время");
        report.put("generatedAt", LocalDateTime.now().format(dateTimeFormatter));

        report.put("totalLessons", totalLessons);
        report.put("completedLessons", completedLessons);
        report.put("cancelledLessons", cancelledLessons);
        report.put("totalHomework", totalHomework);
        report.put("completedHomework", completedHomework);
        report.put("submittedHomework", submittedHomework);
        report.put("averageGrade", Math.round(averageGrade * 10) / 10.0);
        report.put("totalPayments", totalPayments);

        report.put("progressTimeline", progressTimeline);
        report.put("lessonDetails", lessonDetails);
        report.put("homeworkDetails", homeworkDetails);

        return report;
    }

    /**
     * Формирование финансового отчёта
     */
    public Map<String, Object> generateFinancialReport(Long tutorId, LocalDateTime startDate, LocalDateTime endDate) {
        List<Payment> payments = paymentRepository.findByTutorIdAndPaymentDateBetween(tutorId, startDate, endDate);

        double totalIncome = payments.stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        double subscriptionIncome = payments.stream()
                .filter(p -> "PAID".equals(p.getStatus()) &&
                        ("subscription".equals(p.getPaymentType()) ||
                                (p.getCourseName() != null && p.getCourseName().contains("Абонемент"))))
                .mapToDouble(Payment::getAmount)
                .sum();

        double singleIncome = totalIncome - subscriptionIncome;

        Map<String, Double> monthlyIncome = new LinkedHashMap<>();
        LocalDateTime current = startDate;
        while (current.isBefore(endDate)) {
            String monthKey = current.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
            final LocalDateTime monthStart = current;
            final LocalDateTime monthEnd = current.plusMonths(1);

            double monthTotal = payments.stream()
                    .filter(p -> "PAID".equals(p.getStatus()))
                    .filter(p -> p.getPaymentDate().isAfter(monthStart) && p.getPaymentDate().isBefore(monthEnd))
                    .mapToDouble(Payment::getAmount)
                    .sum();

            monthlyIncome.put(monthKey, monthTotal);
            current = current.plusMonths(1);
        }

        List<Map<String, Object>> studentIncome = new ArrayList<>();
        Map<Long, Double> studentTotal = new HashMap<>();

        for (Payment payment : payments) {
            if ("PAID".equals(payment.getStatus()) && payment.getStudent() != null) {
                Long studentId = payment.getStudent().getId();
                studentTotal.put(studentId, studentTotal.getOrDefault(studentId, 0.0) + payment.getAmount());
            }
        }

        for (Map.Entry<Long, Double> entry : studentTotal.entrySet()) {
            Student student = studentRepository.findById(entry.getKey()).orElse(null);
            if (student != null) {
                Map<String, Object> studentStat = new HashMap<>();
                studentStat.put("studentId", student.getId());
                studentStat.put("studentName", student.getFullName());
                studentStat.put("totalIncome", entry.getValue());
                studentIncome.add(studentStat);
            }
        }

        studentIncome.sort((a, b) -> Double.compare((Double) b.get("totalIncome"), (Double) a.get("totalIncome")));

        Map<String, Object> report = new HashMap<>();
        report.put("periodStart", startDate.format(dateFormatter));
        report.put("periodEnd", endDate.format(dateFormatter));
        report.put("generatedAt", LocalDateTime.now().format(dateTimeFormatter));
        report.put("totalIncome", totalIncome);
        report.put("subscriptionIncome", subscriptionIncome);
        report.put("singleIncome", singleIncome);
        report.put("monthlyIncome", monthlyIncome);
        report.put("studentIncome", studentIncome);
        report.put("totalPayments", payments.size());

        return report;
    }

    /**
     * Формирование отчёта по группе/курсу
     */
    public Map<String, Object> generateCourseReport(Long tutorId, Long courseId, LocalDateTime startDate, LocalDateTime endDate) {
        List<Student> allStudents = studentRepository.findAll();
        List<Student> students = allStudents.stream()
                .filter(s -> s.getTutors().stream().anyMatch(t -> t.getId().equals(tutorId)))
                .toList();

        if (courseId != null) {
            students = students.stream()
                    .filter(s -> {
                        List<Lesson> studentLessons = lessonRepository.findByStudentIdOrderByLessonDateAscStartTimeAsc(s.getId());
                        return studentLessons.stream().anyMatch(l -> l.getCourse() != null && l.getCourse().getId().equals(courseId));
                    })
                    .toList();
        }

        List<Map<String, Object>> studentReports = new ArrayList<>();

        for (Student student : students) {
            Map<String, Object> studentReport = generateStudentProgressReport(student.getId(), startDate, endDate);
            studentReports.add(studentReport);
        }

        double classAverageGrade = studentReports.stream()
                .mapToDouble(r -> (Double) r.getOrDefault("averageGrade", 0.0))
                .average()
                .orElse(0);

        int totalLessonsAll = studentReports.stream()
                .mapToInt(r -> (Integer) r.getOrDefault("totalLessons", 0))
                .sum();

        int totalHomeworkAll = studentReports.stream()
                .mapToInt(r -> (Integer) r.getOrDefault("totalHomework", 0))
                .sum();

        Map<String, Object> report = new HashMap<>();
        report.put("periodStart", startDate.format(dateFormatter));
        report.put("periodEnd", endDate.format(dateFormatter));
        report.put("generatedAt", LocalDateTime.now().format(dateTimeFormatter));
        report.put("totalStudents", students.size());
        report.put("classAverageGrade", Math.round(classAverageGrade * 10) / 10.0);
        report.put("totalLessonsAll", totalLessonsAll);
        report.put("totalHomeworkAll", totalHomeworkAll);
        report.put("students", studentReports);

        return report;
    }

    private String getStatusText(String status) {
        switch (status) {
            case "PAID": return "Оплачено";
            case "COMPLETED": return "Проведено";
            case "CANCELLED": return "Отменено";
            case "RESCHEDULED": return "Перенесено";
            case "SCHEDULED": return "Запланировано";
            default: return status;
        }
    }

    private String getHomeworkStatusText(String status) {
        switch (status) {
            case "assigned": return "Назначено";
            case "submitted": return "Сдано на проверку";
            case "checked": return "Проверено";
            case "revision": return "На доработку";
            default: return status;
        }
    }
}