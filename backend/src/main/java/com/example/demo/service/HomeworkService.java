package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.demo.repository.CourseRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class HomeworkService {

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    public Homework saveHomework(Homework homework) {
        return homeworkRepository.save(homework);
    }

    public Homework createHomework(Long tutorId, Long studentId,
                                   String task, LocalDateTime dueDate, String status,
                                   String gradeType, Integer maxScore, Long courseId) {
        log.info("Создание ДЗ: tutorId={}, studentId={}, task={}", tutorId, studentId, task != null ? task.substring(0, Math.min(50, task.length())) : "null");
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));
        Homework homework = new Homework();
        homework.setTutor(tutor);
        homework.setStudent(student);
        homework.setTask(task);
        homework.setDueDate(dueDate);
        homework.setStatus(status);
        homework.setGradeType(gradeType != null ? gradeType : "GRADE_5");
        homework.setMaxScore(maxScore);
        homework.setCreatedAt(LocalDateTime.now());
        homework.setUpdatedAt(LocalDateTime.now());
        if (courseId != null) {
            homework.setCourse(courseRepository.findById(courseId).orElse(null));
        }
        return homeworkRepository.save(homework);
    }

    public List<Homework> getHomeworkByTutor(Long tutorId) {
        return homeworkRepository.findByTutorId(tutorId);
    }

    public List<Homework> getHomeworkByStudent(Long studentId) {
        return homeworkRepository.findByStudentId(studentId);
    }

    public List<Homework> getHomeworkByStudentAndStatus(Long studentId, String status) {
        return homeworkRepository.findByStudentIdAndStatus(studentId, status);
    }

    public Homework getHomeworkById(Long id) {
        return homeworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Домашнее задание не найдено"));
    }

    public Homework updateTask(Long id, String task, LocalDateTime dueDate) {
        Homework homework = getHomeworkById(id);
        if (task != null) homework.setTask(task);
        if (dueDate != null) homework.setDueDate(dueDate);
        return homeworkRepository.save(homework);
    }

    public Homework submitHomework(Long id, String attachments) {
        log.info("Сдача ДЗ: id={}", id);
        Homework homework = getHomeworkById(id);
        homework.setSubmittedAt(LocalDateTime.now());
        homework.setAttachments(attachments);
        homework.setStatus("submitted");
        return homeworkRepository.save(homework);
    }

    public Homework gradeHomeworkWithScore(Long id, Integer score, Integer maxScore, String feedback) {
        log.info("Проверка ДЗ (баллы): id={}, score={}, maxScore={}", id, score, maxScore);
        Homework homework = getHomeworkById(id);
        if (score != null) homework.setScore(score);
        if (maxScore != null) homework.setMaxScore(maxScore);
        if (feedback != null) homework.setFeedback(feedback);
        if (homework.getPercentage() != null) {
            double percent = homework.getPercentage();
            if (percent >= 90) homework.setGrade(5);
            else if (percent >= 75) homework.setGrade(4);
            else if (percent >= 60) homework.setGrade(3);
            else if (percent >= 40) homework.setGrade(2);
            else homework.setGrade(1);
        }
        homework.setStatus("checked");
        return homeworkRepository.save(homework);
    }

    public Homework gradeHomework(Long id, Integer grade, String feedback) {
        log.info("Проверка ДЗ: id={}, оценка={}", id, grade);
        Homework homework = getHomeworkById(id);
        if (grade != null) {
            homework.setScore(grade);
            String type = homework.getGradeType() != null ? homework.getGradeType() : "GRADE_5";
            int normalized;
            if ("GRADE_100".equals(type)) {
                if (grade >= 80) normalized = 5;
                else if (grade >= 60) normalized = 4;
                else if (grade >= 40) normalized = 3;
                else if (grade >= 20) normalized = 2;
                else normalized = 1;
            } else if ("GRADE_10".equals(type)) {
                normalized = Math.round(grade / 2.0f);
                if (normalized < 1) normalized = 1;
                if (normalized > 5) normalized = 5;
            } else {
                normalized = grade;
            }
            homework.setGrade(normalized);
        }
        if (feedback != null) homework.setFeedback(feedback);
        homework.setStatus("checked");
        return homeworkRepository.save(homework);
    }

    public Homework requestRevision(Long id, String feedback) {
        log.info("Возврат на доработку: id={}", id);
        Homework homework = getHomeworkById(id);
        homework.setFeedback(feedback);
        homework.setStatus("revision");
        return homeworkRepository.save(homework);
    }

    public void deleteHomework(Long id) {
        log.info("Удаление ДЗ: id={}", id);
        homeworkRepository.delete(getHomeworkById(id));
    }

    public Map<String, Long> getHomeworkStatsByStudent(Long studentId) {
        List<Homework> allHomework = homeworkRepository.findByStudentId(studentId);
        long total = allHomework.size();
        long submitted = allHomework.stream().filter(h -> "submitted".equals(h.getStatus())).count();
        long checked = allHomework.stream().filter(h -> "checked".equals(h.getStatus())).count();
        long revision = allHomework.stream().filter(h -> "revision".equals(h.getStatus())).count();
        long overdue = allHomework.stream()
                .filter(h -> "assigned".equals(h.getStatus()) && h.getDueDate() != null && h.getDueDate().isBefore(LocalDateTime.now()))
                .count();
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalHomework", total);
        stats.put("submitted", submitted);
        stats.put("checked", checked);
        stats.put("revision", revision);
        stats.put("overdue", overdue);
        return stats;
    }

    public Map<String, Object> getDetailedProgressStats(Long studentId) {
        return getDetailedProgressStats(studentId, null);
    }

    public Map<String, Object> getDetailedProgressStats(Long studentId, Long courseId) {
        List<Homework> allHomework = homeworkRepository.findByStudentId(studentId);

        if (courseId != null) {
            allHomework = allHomework.stream()
                    .filter(h -> h.getCourse() != null && h.getCourse().getId().equals(courseId))
                    .collect(Collectors.toList());
        }

        List<Homework> checkedHomework = allHomework.stream()
                .filter(h -> "checked".equals(h.getStatus())).toList();

        double averageGrade = checkedHomework.stream()
                .mapToInt(h -> h.getGrade() != null ? h.getGrade() : 0)
                .average().orElse(0);
        double averagePercentage = checkedHomework.stream()
                .mapToDouble(h -> h.getPercentage() != null ? h.getPercentage() : 0)
                .average().orElse(0);

        Map<String, Long> gradeDistribution = new HashMap<>();
        gradeDistribution.put("5", checkedHomework.stream().filter(h -> h.getGrade() != null && h.getGrade() == 5).count());
        gradeDistribution.put("4", checkedHomework.stream().filter(h -> h.getGrade() != null && h.getGrade() == 4).count());
        gradeDistribution.put("3", checkedHomework.stream().filter(h -> h.getGrade() != null && h.getGrade() == 3).count());
        gradeDistribution.put("2", checkedHomework.stream().filter(h -> h.getGrade() != null && h.getGrade() == 2).count());
        gradeDistribution.put("1", checkedHomework.stream().filter(h -> h.getGrade() != null && h.getGrade() == 1).count());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalHomework", allHomework.size());
        stats.put("checkedHomework", checkedHomework.size());
        stats.put("averageGrade", Math.round(averageGrade * 10) / 10.0);
        stats.put("averagePercentage", Math.round(averagePercentage));
        stats.put("gradeDistribution", gradeDistribution);
        return stats;
    }

    public boolean isOverdue(Long id) {
        Homework homework = getHomeworkById(id);
        return homework.getDueDate() != null && homework.getDueDate().isBefore(LocalDateTime.now()) && "assigned".equals(homework.getStatus());
    }
}