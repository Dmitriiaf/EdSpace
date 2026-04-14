package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProgressService {

    @Autowired
    private ProgressRecordRepository progressRecordRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Transactional
    public ProgressRecord createProgressRecord(Long studentId, Long courseId, String topic,
                                               Integer score, Integer grade, String notes) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        Course course = courseId != null ? courseRepository.findById(courseId).orElse(null) : null;

        ProgressRecord record = new ProgressRecord(student, course, topic, score, grade);
        record.setNotes(notes);

        return progressRecordRepository.save(record);
    }

    @Transactional
    public ProgressRecord createFromHomework(Long homeworkId) {
        Homework homework = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new RuntimeException("Домашнее задание не найдено"));

        // Получаем курс (первый попавшийся у репетитора)
        Course course = null;
        if (!homework.getStudent().getTutors().isEmpty()) {
            Long tutorId = homework.getStudent().getTutors().get(0).getId();
            course = courseRepository.findByTutorId(tutorId).stream().findFirst().orElse(null);
        }

        ProgressRecord record = new ProgressRecord(
                homework.getStudent(),
                course,
                homework.getTask().length() > 100 ?
                        homework.getTask().substring(0, 100) : homework.getTask(),
                homework.getScore(),
                homework.getGrade()
        );
        record.setHomework(homework);
        record.setNotes(homework.getFeedback());

        return progressRecordRepository.save(record);
    }

    public List<ProgressRecord> getStudentProgress(Long studentId) {
        return progressRecordRepository.findByStudentIdOrderByRecordDateAsc(studentId);
    }

    public List<ProgressRecord> getStudentProgressByCourse(Long studentId, Long courseId) {
        return progressRecordRepository.findByStudentIdAndCourseIdOrderByRecordDateAsc(studentId, courseId);
    }

    public Map<String, Object> getStudentProgressStats(Long studentId) {
        List<ProgressRecord> allRecords = progressRecordRepository.findByStudentIdOrderByRecordDateAsc(studentId);

        if (allRecords.isEmpty()) {
            return Map.of(
                    "totalRecords", 0,
                    "averageScore", 0,
                    "averageGrade", 0,
                    "trend", "neutral",
                    "timeline", List.of(),
                    "courseStats", List.of()
            );
        }

        double averageScore = allRecords.stream()
                .mapToInt(r -> r.getScore() != null ? r.getScore() : 0)
                .average()
                .orElse(0);

        double averageGrade = allRecords.stream()
                .mapToInt(r -> r.getGrade() != null ? r.getGrade() : 0)
                .average()
                .orElse(0);

        // Определение тренда (последние 5 записей)
        List<ProgressRecord> last5 = allRecords.stream()
                .skip(Math.max(0, allRecords.size() - 5))
                .toList();

        String trend = "neutral";
        if (last5.size() >= 3) {
            double firstAvg = last5.get(0).getScore() != null ? last5.get(0).getScore() : 0;
            double lastAvg = last5.get(last5.size() - 1).getScore() != null ?
                    last5.get(last5.size() - 1).getScore() : 0;
            if (lastAvg > firstAvg + 5) trend = "up";
            else if (lastAvg < firstAvg - 5) trend = "down";
        }

        // Таймлайн для графика
        List<Map<String, Object>> timeline = allRecords.stream()
                .map(r -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("date", r.getRecordDate().toString());
                    point.put("score", r.getScore() != null ? r.getScore() : 0);
                    point.put("grade", r.getGrade() != null ? r.getGrade() : 0);
                    point.put("topic", r.getTopic());
                    return point;
                })
                .collect(Collectors.toList());

        // Статистика по курсам
        List<Map<String, Object>> courseStats = new ArrayList<>();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRecords", allRecords.size());
        stats.put("averageScore", Math.round(averageScore * 10) / 10.0);
        stats.put("averageGrade", Math.round(averageGrade * 10) / 10.0);
        stats.put("trend", trend);
        stats.put("timeline", timeline);
        stats.put("courseStats", courseStats);

        return stats;
    }

    public Map<String, Object> getComparisonStats(Long tutorId) {
        List<Student> students = studentRepository.findAll().stream()
                .filter(s -> s.getTutors().stream().anyMatch(t -> t.getId().equals(tutorId)))
                .toList();

        List<Map<String, Object>> studentStats = new ArrayList<>();

        for (Student student : students) {
            List<ProgressRecord> records = progressRecordRepository.findByStudentIdOrderByRecordDateAsc(student.getId());

            double averageScore = records.stream()
                    .mapToInt(r -> r.getScore() != null ? r.getScore() : 0)
                    .average()
                    .orElse(0);

            Map<String, Object> stat = new HashMap<>();
            stat.put("studentId", student.getId());
            stat.put("studentName", student.getFullName());
            stat.put("averageScore", Math.round(averageScore * 10) / 10.0);
            stat.put("totalRecords", records.size());

            if (!records.isEmpty()) {
                ProgressRecord lastRecord = records.get(records.size() - 1);
                stat.put("lastScore", lastRecord.getScore() != null ? lastRecord.getScore() : 0);
                stat.put("lastTopic", lastRecord.getTopic());
            }

            studentStats.add(stat);
        }

        // Сортировка по успеваемости
        studentStats.sort((a, b) -> Double.compare(
                (Double) b.get("averageScore"),
                (Double) a.get("averageScore")
        ));

        Map<String, Object> result = new HashMap<>();
        result.put("students", studentStats);
        result.put("totalStudents", students.size());
        result.put("averageClassScore", studentStats.stream()
                .mapToDouble(s -> (Double) s.get("averageScore"))
                .average()
                .orElse(0));

        return result;
    }
}