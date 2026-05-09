package com.example.demo.service;
import java.util.stream.Collectors;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

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
    private NotificationService notificationService;

    @Autowired
    private StudentRepository studentRepository;

    public Homework saveHomework(Homework homework) {
        return homeworkRepository.save(homework);
    }

    public Homework createHomework(Long tutorId, Long studentId,
                                   String task, LocalDateTime dueDate, String status,
                                   String gradeType, Integer maxScore, Long courseId) {
        log.info("Создание ДЗ: tutorId={}, studentId={}, task={}", tutorId, studentId,
                task != null ? task.substring(0, Math.min(50, task.length())) : "null");
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
            log.info("ДЗ привязано к курсу: courseId={}", courseId);
        } else {
            log.warn("ДЗ создано без привязки к курсу! studentId={}", studentId);
        }
        Homework savedHomework = homeworkRepository.save(homework);

        // Уведомление ученику о новом ДЗ
        try {
            notificationService.createHomeworkNotification(
                    studentId, tutorId,
                    "📋 Новое домашнее задание: " + (task != null ? task.substring(0, Math.min(50, task.length())) + "..." : "без описания"),
                    "HOMEWORK_ASSIGNED"
            );
        } catch (Exception e) {
            log.warn("Не удалось создать уведомление: {}", e.getMessage());
        }

        return savedHomework;
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
        Homework savedHomework = homeworkRepository.save(homework);

        // Уведомление репетитору о сдаче ДЗ
        try {
            notificationService.createHomeworkNotification(
                    homework.getStudent().getId(),
                    homework.getTutor().getId(),
                    "📤 " + homework.getStudent().getFullName() + " сдал(а) домашнее задание",
                    "HOMEWORK_SUBMITTED"
            );
        } catch (Exception e) {
            log.warn("Не удалось создать уведомление: {}", e.getMessage());
        }

        return savedHomework;
    }

    public Homework gradeHomeworkWithScore(Long id, Integer score, Integer maxScore, String feedback) {
        log.info("Проверка ДЗ (баллы): id={}, score={}, maxScore={}", id, score, maxScore);
        Homework homework = getHomeworkById(id);
        if (score != null) homework.setScore(score);
        if (maxScore != null) {
            homework.setMaxScore(maxScore);
        } else if (homework.getMaxScore() == null) {
            String type = homework.getGradeType() != null ? homework.getGradeType() : "GRADE_5";
            if ("GRADE_100".equals(type)) homework.setMaxScore(100);
            else if ("GRADE_10".equals(type)) homework.setMaxScore(10);
            else homework.setMaxScore(5);
        }
        String type = homework.getGradeType() != null ? homework.getGradeType() : "GRADE_5";
        if (score != null) {
            int maxAllowed;
            if ("GRADE_100".equals(type)) maxAllowed = 100;
            else if ("GRADE_10".equals(type)) maxAllowed = 10;
            else maxAllowed = 5;
            if (score > maxAllowed) {
                throw new RuntimeException("Оценка не может превышать " + maxAllowed + " баллов для " + type);
            }
        }
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
        Homework savedHomework = homeworkRepository.save(homework);

        // Уведомление ученику о проверке ДЗ
        try {
            notificationService.createHomeworkNotification(
                    homework.getStudent().getId(),
                    homework.getTutor().getId(),
                    "✅ Домашнее задание проверено: " + (homework.getPercentage() != null ? Math.round(homework.getPercentage()) + "%" : "без оценки"),
                    "HOMEWORK_CHECKED"
            );
        } catch (Exception e) {
            log.warn("Не удалось создать уведомление: {}", e.getMessage());
        }

        return savedHomework;
    }

    public Homework gradeHomework(Long id, Integer grade, String feedback) {
        log.info("Проверка ДЗ: id={}, оценка={}", id, grade);
        Homework homework = getHomeworkById(id);
        if (grade != null) {
            String type = homework.getGradeType() != null ? homework.getGradeType() : "GRADE_5";
            int maxAllowed;
            if ("GRADE_100".equals(type)) maxAllowed = 100;
            else if ("GRADE_10".equals(type)) maxAllowed = 10;
            else maxAllowed = 5;
            if (grade > maxAllowed) {
                throw new RuntimeException("Оценка не может превышать " + maxAllowed + " баллов для шкалы " + type);
            }
            int normalized;
            if ("GRADE_100".equals(type)) {
                homework.setMaxScore(100);
                homework.setScore(grade);
                if (grade >= 80) normalized = 5;
                else if (grade >= 60) normalized = 4;
                else if (grade >= 40) normalized = 3;
                else if (grade >= 20) normalized = 2;
                else normalized = 1;
            } else if ("GRADE_10".equals(type)) {
                homework.setMaxScore(10);
                homework.setScore(grade);
                normalized = Math.round(grade / 2.0f);
                if (normalized < 1) normalized = 1;
                if (normalized > 5) normalized = 5;
            } else {
                homework.setMaxScore(5);
                homework.setScore(grade);
                normalized = grade;
            }
            homework.setGrade(normalized);
        }
        if (feedback != null) homework.setFeedback(feedback);
        homework.setStatus("checked");
        Homework savedHomework = homeworkRepository.save(homework);

        // Уведомление ученику о проверке ДЗ
        try {
            notificationService.createHomeworkNotification(
                    homework.getStudent().getId(),
                    homework.getTutor().getId(),
                    "✅ Домашнее задание проверено: оценка " + (homework.getGrade() != null ? homework.getGrade() : "—") + "/5",
                    "HOMEWORK_CHECKED"
            );
        } catch (Exception e) {
            log.warn("Не удалось создать уведомление: {}", e.getMessage());
        }

        return savedHomework;
    }

    public Homework requestRevision(Long id, String feedback) {
        log.info("Возврат на доработку: id={}", id);
        Homework homework = getHomeworkById(id);
        homework.setFeedback(feedback);
        homework.setStatus("revision");
        Homework savedHomework = homeworkRepository.save(homework);

        // Уведомление ученику о возврате на доработку
        try {
            notificationService.createHomeworkNotification(
                    homework.getStudent().getId(),
                    homework.getTutor().getId(),
                    "🔄 Домашнее задание возвращено на доработку: " + (feedback != null ? feedback.substring(0, Math.min(50, feedback.length())) : ""),
                    "HOMEWORK_RETURNED"
            );
        } catch (Exception e) {
            log.warn("Не удалось создать уведомление: {}", e.getMessage());
        }

        return savedHomework;
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

    /**
     * Получает детальную статистику успеваемости студента с фильтрацией по курсу.
     * Фильтрация выполняется на уровне БД для лучшей производительности.
     *
     * @param studentId ID студента
     * @param courseId  ID курса (null — все предметы)
     * @return Map со статистикой: totalHomework, checkedHomework, averageGrade, averagePercentage, gradeDistribution
     */
    public Map<String, Object> getDetailedProgressStats(Long studentId, Long courseId) {
        log.info("Запрос статистики: studentId={}, courseId={}", studentId, courseId);

        // Используем оптимизированный запрос с фильтрацией на уровне БД
        List<Homework> allHomework = homeworkRepository.findByStudentIdAndOptionalCourse(studentId, courseId);

        log.info("Найдено ДЗ: {} (courseId={})", allHomework.size(), courseId != null ? courseId : "все");

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

        log.info("Статистика готова: total={}, checked={}, avgGrade={}",
                allHomework.size(), checkedHomework.size(), Math.round(averageGrade * 10) / 10.0);

        return stats;
    }

    public boolean isOverdue(Long id) {
        Homework homework = getHomeworkById(id);
        return homework.getDueDate() != null && homework.getDueDate().isBefore(LocalDateTime.now()) && "assigned".equals(homework.getStatus());
    }

    /**
     * Получает статистику по всем ученикам репетитора одним запросом.
     * Оптимизированная версия для страницы "Успеваемость".
     */
    public List<Map<String, Object>> getTutorStudentsProgress(Long tutorId, Long courseId) {
        log.info("Массовая загрузка статистики: tutorId={}, courseId={}", tutorId, courseId);

        // Получаем всех учеников репетитора
        List<Student> students = studentRepository.findByTutorId(tutorId);
        log.info("Найдено учеников: {}", students.size());

        List<Map<String, Object>> result = new ArrayList<>();

        for (Student student : students) {
            try {
                // ✅ Сначала получаем ДЗ с учётом фильтра по курсу
                List<Homework> allHomework;
                if (courseId != null) {
                    // При фильтрации — только ДЗ с указанным course_id
                    allHomework = homeworkRepository.findByStudentIdAndOptionalCourse(student.getId(), courseId);
                } else {
                    // Без фильтра — все ДЗ ученика
                    allHomework = homeworkRepository.findByStudentId(student.getId());
                }

                // ✅ ПРОПУСКАЕМ ученика, если нет ДЗ по выбранному курсу
                if (courseId != null && allHomework.isEmpty()) {
                    continue;
                }

                List<Homework> checkedHomework = allHomework.stream()
                        .filter(h -> "checked".equals(h.getStatus()))
                        .collect(Collectors.toList());

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

                Map<String, Object> studentProgress = new HashMap<>();
                studentProgress.put("studentId", student.getId());
                studentProgress.put("studentName", student.getFullName());
                studentProgress.put("totalHomework", allHomework.size());
                studentProgress.put("checkedHomework", checkedHomework.size());
                studentProgress.put("averageGrade", Math.round(averageGrade * 10) / 10.0);
                studentProgress.put("averagePercentage", Math.round(averagePercentage));
                studentProgress.put("gradeDistribution", gradeDistribution);

                result.add(studentProgress);
            } catch (Exception e) {
                log.error("Ошибка загрузки статистики для ученика {}: {}", student.getId(), e.getMessage());
            }
        }

        log.info("Статистика готова: {} учеников (courseId={})", result.size(), courseId);
        return result;
    }

    /**
     * Получает историю оценок студента для графика динамики.
     * Возвращает список точек: дата, баллы, оценка, тип шкалы.
     */
    public List<Map<String, Object>> getStudentProgressTimeline(Long studentId, Long courseId) {
        log.info("Запрос истории оценок: studentId={}, courseId={}", studentId, courseId);

        // Получаем проверенные ДЗ
        List<Homework> checkedHomework;
        if (courseId != null) {
            List<Homework> all = homeworkRepository.findByStudentIdAndOptionalCourse(studentId, courseId);
            checkedHomework = all.stream()
                    .filter(h -> "checked".equals(h.getStatus()))
                    .collect(Collectors.toList());
        } else {
            checkedHomework = homeworkRepository.findByStudentIdAndStatus(studentId, "checked");
        }

        // Сортируем по дате создания (старые сначала)
        checkedHomework.sort((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()));

        List<Map<String, Object>> timeline = new ArrayList<>();

        for (Homework hw : checkedHomework) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", hw.getCreatedAt().toString());
            point.put("homeworkId", hw.getId());
            point.put("task", hw.getTask() != null ?
                    hw.getTask().substring(0, Math.min(100, hw.getTask().length())) : "Задание");

            // Баллы и проценты
            if (hw.getScore() != null && hw.getMaxScore() != null) {
                point.put("score", hw.getScore());
                point.put("maxScore", hw.getMaxScore());
                point.put("percentage", Math.round(hw.getPercentage() != null ? hw.getPercentage() : 0));
            } else {
                point.put("score", 0);
                point.put("maxScore", 100);
                point.put("percentage", 0);
            }

            // Оценка
            point.put("grade", hw.getGrade() != null ? hw.getGrade() : 0);
            point.put("gradeType", hw.getGradeType() != null ? hw.getGradeType() : "GRADE_5");
            point.put("status", hw.getStatus());

            // Название курса
            point.put("courseName", hw.getCourse() != null ? hw.getCourse().getName() : "Без предмета");

            timeline.add(point);
        }

        log.info("История оценок: {} записей", timeline.size());
        return timeline;
    }
}