package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExternalIntegrationService {

    @Autowired
    private TaskBankRepository taskBankRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    /**
     * Имитация импорта заданий из КЕГЭ
     */
    @Transactional
    public List<TaskBank> importFromKEGE(String subject, String examType, Long tutorId) {
        List<TaskBank> importedTasks = new ArrayList<>();
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        List<TaskBank> demoTasks = getDemoKEGETasks(subject, examType);

        for (TaskBank task : demoTasks) {
            boolean exists = taskBankRepository.findAll().stream()
                    .anyMatch(t -> t.getExternalId() != null &&
                            t.getExternalId().equals(task.getExternalId()) &&
                            t.getSource().equals("KEGE"));

            if (!exists) {
                task.setTutor(tutor);
                importedTasks.add(taskBankRepository.save(task));
            }
        }

        return importedTasks;
    }

    /**
     * Имитация импорта заданий из Решу ЕГЭ
     */
    @Transactional
    public List<TaskBank> importFromReshUEGE(String subject, String examType, Long tutorId) {
        List<TaskBank> importedTasks = new ArrayList<>();
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        List<TaskBank> demoTasks = getDemoReshUEGETasks(subject, examType);

        for (TaskBank task : demoTasks) {
            boolean exists = taskBankRepository.findAll().stream()
                    .anyMatch(t -> t.getExternalId() != null &&
                            t.getExternalId().equals(task.getExternalId()) &&
                            t.getSource().equals("RESHUEGE"));

            if (!exists) {
                task.setTutor(tutor);
                importedTasks.add(taskBankRepository.save(task));
            }
        }

        return importedTasks;
    }

    /**
     * Демонстрационные задания для КЕГЭ
     */
    private List<TaskBank> getDemoKEGETasks(String subject, String examType) {
        List<TaskBank> tasks = new ArrayList<>();

        if ("Информатика".equals(subject) || "informatics".equals(subject)) {
            TaskBank task1 = new TaskBank("KEGE",
                    "Найдите количество натуральных чисел, не превосходящих 1000, которые делятся на 3 или на 5.",
                    "Информатика", "problem", examType);
            task1.setExternalId("KEGE_INF_1");
            task1.setAnswer("467");
            task1.setExplanation("Используем принцип включения-исключения: N(3) + N(5) - N(15) = 333 + 200 - 66 = 467");
            task1.setDifficulty(3);
            task1.setMaxScore(1);
            task1.setTopic("Теория чисел");
            task1.setTags("делимость, множества");
            tasks.add(task1);

            TaskBank task2 = new TaskBank("KEGE",
                    "Логическая функция F задаётся выражением (x ∧ y) ∨ (x ∧ ¬z). Определите, какому столбцу таблицы истинности соответствует каждая из переменных x, y, z.",
                    "Информатика", "problem", examType);
            task2.setExternalId("KEGE_INF_2");
            task2.setDifficulty(4);
            task2.setMaxScore(1);
            task2.setTopic("Логика");
            task2.setTags("таблица истинности, логические операции");
            tasks.add(task2);
        }

        if ("Математика".equals(subject) || "math".equals(subject)) {
            TaskBank task1 = new TaskBank("KEGE",
                    "Решите уравнение: 2^x = 8",
                    "Математика", "problem", examType);
            task1.setExternalId("KEGE_MATH_1");
            task1.setAnswer("3");
            task1.setExplanation("2^x = 8 = 2^3, следовательно x = 3");
            task1.setDifficulty(1);
            task1.setMaxScore(1);
            task1.setTopic("Показательные уравнения");
            task1.setTags("уравнения, степень");
            tasks.add(task1);
        }

        if ("Русский язык".equals(subject) || "russian".equals(subject)) {
            TaskBank task1 = new TaskBank("KEGE",
                    "В каком слове верно выделена буква, обозначающая ударный гласный звук?",
                    "Русский язык", "test", examType);
            task1.setExternalId("KEGE_RUS_1");
            task1.setAnswer("звонИт");
            task1.setDifficulty(2);
            task1.setMaxScore(1);
            task1.setTopic("Орфоэпия");
            task1.setTags("ударение, произношение");
            tasks.add(task1);
        }

        return tasks;
    }

    /**
     * Демонстрационные задания для Решу ЕГЭ
     */
    private List<TaskBank> getDemoReshUEGETasks(String subject, String examType) {
        List<TaskBank> tasks = new ArrayList<>();

        if ("Информатика".equals(subject) || "informatics".equals(subject)) {
            TaskBank task1 = new TaskBank("RESHUEGE",
                    "Для какого наименьшего целого неотрицательного числа A выражение (x + 2y < A) ∨ (y > x) ∨ (x > 20) тождественно истинно?",
                    "Информатика", "problem", examType);
            task1.setExternalId("RESHUEGE_INF_1");
            task1.setDifficulty(5);
            task1.setMaxScore(1);
            task1.setTopic("Логика и множества");
            task1.setTags("кванторы, истинность");
            tasks.add(task1);
        }

        if ("Математика".equals(subject) || "math".equals(subject)) {
            TaskBank task1 = new TaskBank("RESHUEGE",
                    "В треугольнике ABC угол C равен 90°, AB = 10, BC = 6. Найдите синус угла A.",
                    "Математика", "problem", examType);
            task1.setExternalId("RESHUEGE_MATH_1");
            task1.setAnswer("0.6");
            task1.setExplanation("sin A = противолежащий катет / гипотенуза = BC/AB = 6/10 = 0.6");
            task1.setDifficulty(2);
            task1.setMaxScore(1);
            task1.setTopic("Тригонометрия");
            task1.setTags("треугольник, синус");
            tasks.add(task1);
        }

        return tasks;
    }

    /**
     * Поиск заданий в банке с фильтрацией по репетитору
     */
    public List<TaskBank> searchTasks(String query, String subject, String examType, String source, Long tutorId) {
        List<TaskBank> results = taskBankRepository.search(query);

        // ✅ ФИЛЬТРАЦИЯ ПО РЕПЕТИТОРУ
        results = results.stream()
                .filter(t -> t.getTutor() == null ||
                        t.getTutor().getId().equals(tutorId) ||
                        Boolean.TRUE.equals(t.getIsPublic()))
                .collect(Collectors.toList());

        if (subject != null && !subject.isEmpty()) {
            results = results.stream()
                    .filter(t -> subject.equals(t.getSubject()))
                    .toList();
        }

        if (examType != null && !examType.isEmpty()) {
            results = results.stream()
                    .filter(t -> examType.equals(t.getExamType()))
                    .toList();
        }

        if (source != null && !source.isEmpty()) {
            results = results.stream()
                    .filter(t -> source.equals(t.getSource()))
                    .toList();
        }

        return results;
    }

    /**
     * Получение задания для создания ДЗ
     */
    public TaskBank getTaskForHomework(Long taskId) {
        return taskBankRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Задание не найдено"));
    }

    /**
     * Создание ДЗ из задания из банка
     */
    @Transactional
    public Homework createHomeworkFromTask(Long taskId, Long tutorId, Long studentId, LocalDateTime dueDate) {
        TaskBank task = getTaskForHomework(taskId);

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        Homework homework = new Homework();
        homework.setTutor(tutor);
        homework.setStudent(student);
        homework.setTask(task.getQuestion());
        homework.setDueDate(dueDate);
        homework.setStatus("assigned");
        homework.setMaxScore(task.getMaxScore());
        homework.setCreatedAt(LocalDateTime.now());
        homework.setUpdatedAt(LocalDateTime.now());

        return homeworkRepository.save(homework);
    }
}