package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class HomeworkService {

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    public Homework createHomework(Long tutorId, Long studentId,
                                   String task, LocalDateTime dueDate, String status) {
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
        homework.setCreatedAt(LocalDateTime.now());
        homework.setUpdatedAt(LocalDateTime.now());

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

        if (task != null) {
            homework.setTask(task);
        }
        if (dueDate != null) {
            homework.setDueDate(dueDate);
        }

        return homeworkRepository.save(homework);
    }

    public Homework submitHomework(Long id, String attachments) {
        Homework homework = getHomeworkById(id);
        homework.setSubmittedAt(LocalDateTime.now());
        homework.setAttachments(attachments);
        homework.setStatus("submitted");
        return homeworkRepository.save(homework);
    }

    // НОВЫЙ МЕТОД: оценивание с баллами
    public Homework gradeHomeworkWithScore(Long id, Integer score, Integer maxScore, String feedback) {
        Homework homework = getHomeworkById(id);

        if (score != null) {
            homework.setScore(score);
        }
        if (maxScore != null) {
            homework.setMaxScore(maxScore);
        }
        if (feedback != null) {
            homework.setFeedback(feedback);
        }

        // Автоматическая конвертация в 5-балльную систему
        if (homework.getPercentage() != null) {
            double percent = homework.getPercentage();
            if (percent >= 90) {
                homework.setGrade(5);
            } else if (percent >= 75) {
                homework.setGrade(4);
            } else if (percent >= 60) {
                homework.setGrade(3);
            } else if (percent >= 40) {
                homework.setGrade(2);
            } else {
                homework.setGrade(1);
            }
        }

        homework.setStatus("checked");
        return homeworkRepository.save(homework);
    }

    // Старый метод для обратной совместимости
    public Homework gradeHomework(Long id, Integer grade, String feedback) {
        Homework homework = getHomeworkById(id);

        if (grade != null) {
            homework.setGrade(grade);
        }
        if (feedback != null) {
            homework.setFeedback(feedback);
        }

        homework.setStatus("checked");
        return homeworkRepository.save(homework);
    }

    public Homework requestRevision(Long id, String feedback) {
        Homework homework = getHomeworkById(id);
        homework.setFeedback(feedback);
        homework.setStatus("revision");
        return homeworkRepository.save(homework);
    }

    public void deleteHomework(Long id) {
        Homework homework = getHomeworkById(id);
        homeworkRepository.delete(homework);
    }

    public Map<String, Long> getHomeworkStatsByStudent(Long studentId) {
        List<Homework> allHomework = homeworkRepository.findByStudentId(studentId);

        long total = allHomework.size();
        long submitted = allHomework.stream()
                .filter(h -> "submitted".equals(h.getStatus()))
                .count();
        long checked = allHomework.stream()
                .filter(h -> "checked".equals(h.getStatus()))
                .count();
        long revision = allHomework.stream()
                .filter(h -> "revision".equals(h.getStatus()))
                .count();
        long overdue = allHomework.stream()
                .filter(h -> "assigned".equals(h.getStatus()) &&
                        h.getDueDate() != null &&
                        h.getDueDate().isBefore(LocalDateTime.now()))
                .count();

        Map<String, Long> stats = new HashMap<>();
        stats.put("totalHomework", total);
        stats.put("submitted", submitted);
        stats.put("checked", checked);
        stats.put("revision", revision);
        stats.put("overdue", overdue);

        return stats;
    }

    // НОВЫЙ МЕТОД: получение детальной статистики успеваемости
    public Map<String, Object> getDetailedProgressStats(Long studentId) {
        List<Homework> allHomework = homeworkRepository.findByStudentId(studentId);
        List<Homework> checkedHomework = allHomework.stream()
                .filter(h -> "checked".equals(h.getStatus()))
                .toList();

        double averageGrade = checkedHomework.stream()
                .mapToInt(h -> h.getGrade() != null ? h.getGrade() : 0)
                .average()
                .orElse(0);

        double averagePercentage = checkedHomework.stream()
                .mapToDouble(h -> h.getPercentage() != null ? h.getPercentage() : 0)
                .average()
                .orElse(0);

        // Распределение оценок
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
        return homework.getDueDate() != null &&
                homework.getDueDate().isBefore(LocalDateTime.now()) &&
                "assigned".equals(homework.getStatus());
    }
}