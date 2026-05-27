package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
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

    @Transactional
    public TaskBank createTask(Map<String, Object> request, Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        String source = request.get("source") != null ? String.valueOf(request.get("source")) : "MANUAL";
        String question = String.valueOf(request.getOrDefault("question", ""));
        String subject = request.get("subject") != null ? String.valueOf(request.get("subject")) : "Информатика";
        String type = request.get("type") != null ? String.valueOf(request.get("type")) : "problem";
        String examType = request.get("examType") != null ? String.valueOf(request.get("examType")) : "ЕГЭ";

        TaskBank task = new TaskBank(source, question, subject, type, examType);
        task.setTutor(tutor);

        if (request.get("answer") != null) task.setAnswer(String.valueOf(request.get("answer")));
        if (request.get("topic") != null) task.setTopic(String.valueOf(request.get("topic")));
        if (request.get("explanation") != null) task.setExplanation(String.valueOf(request.get("explanation")));
        if (request.get("difficulty") != null) task.setDifficulty(Integer.parseInt(String.valueOf(request.get("difficulty"))));
        if (request.get("maxScore") != null) task.setMaxScore(Integer.parseInt(String.valueOf(request.get("maxScore"))));

        task.setIsPublic(false);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());

        return taskBankRepository.save(task);
    }

    /**
     * Генерация задания через ИИ (DeepSeek API)
     */
    public TaskBank generateWithAI(String prompt, String subject, String examType, Long tutorId) {
        // Вызываем DeepSeek API
        String jsonResponse = callDeepSeek(prompt, subject, examType);

        // Парсим JSON ответ
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> result = mapper.readValue(jsonResponse, Map.class);

            TaskBank task = new TaskBank(
                    "AI_GENERATED",
                    (String) result.getOrDefault("question", ""),
                    subject,
                    "problem",
                    examType
            );

            task.setAnswer((String) result.getOrDefault("answer", ""));
            task.setExplanation((String) result.getOrDefault("explanation", ""));
            task.setTopic((String) result.getOrDefault("topic", ""));
            task.setDifficulty(result.get("difficulty") != null ?
                    Integer.parseInt(result.get("difficulty").toString()) : 3);
            task.setIsPublic(true);
            task.setCreatedAt(LocalDateTime.now());
            task.setUpdatedAt(LocalDateTime.now());

            if (tutorId != null) {
                Tutor tutor = tutorRepository.findById(tutorId).orElse(null);
                task.setTutor(tutor);
            }

            return taskBankRepository.save(task);

        } catch (Exception e) {
            log.error("Ошибка парсинга ответа DeepSeek: {}", e.getMessage());
            throw new RuntimeException("Не удалось распознать ответ ИИ");
        }
    }

    @Transactional
    public List<TaskBank> importFromKEGE(String subject, String examType, Long tutorId) {
        List<TaskBank> importedTasks = new ArrayList<>();
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        List<TaskBank> demoTasks = parseKEGE(subject, examType);

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

    private List<TaskBank> parseKEGE(String subject, String examType) {
        List<TaskBank> tasks = new ArrayList<>();

        try {
            String url = "https://kompege.ru/variant?subject=" + subject.toLowerCase();

            org.jsoup.nodes.Document doc = org.jsoup.Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .timeout(15000)
                    .get();

            var taskElements = doc.select("a[href*='task?id=']");

            int count = 0;
            for (var element : taskElements) {
                if (count >= 50) break;

                String href = element.attr("href");
                String taskId = href.replaceAll(".*task\\?id=", "").replaceAll("[^0-9].*", "");
                String taskText = element.text();

                if (taskId.isEmpty() || taskText.isEmpty()) continue;

                boolean exists = taskBankRepository.findAll().stream()
                        .anyMatch(t -> "KEGE".equals(t.getSource()) &&
                                ("KEGE_" + taskId).equals(t.getExternalId()));
                if (exists) continue;

                TaskBank task = new TaskBank("KEGE", taskText, subject, "problem", examType);
                task.setExternalId("KEGE_" + taskId);
                task.setDifficulty(3);
                task.setMaxScore(1);
                task.setIsPublic(true);
                tasks.add(task);
                count++;
            }

            log.info("Спарсено {} заданий с КЕГЭ по предмету {}", count, subject);
        } catch (Exception e) {
            log.error("Ошибка парсинга КЕГЭ: {}", e.getMessage());
        }

        return tasks;
    }

    private List<TaskBank> getDemoReshUEGETasks(String subject, String examType) {
        List<TaskBank> tasks = new ArrayList<>();

        if ("Информатика".equals(subject)) {
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

        return tasks;
    }

    public List<TaskBank> searchTasks(String query, String subject, String examType, String source, Long tutorId) {
        List<TaskBank> results = taskBankRepository.search(query);

        results = results.stream()
                .filter(t -> t.getTutor() == null ||
                        t.getTutor().getId().equals(tutorId) ||
                        Boolean.TRUE.equals(t.getIsPublic()))
                .collect(Collectors.toList());

        if (subject != null && !subject.isEmpty()) {
            results = results.stream().filter(t -> subject.equals(t.getSubject())).toList();
        }
        if (examType != null && !examType.isEmpty()) {
            results = results.stream().filter(t -> examType.equals(t.getExamType())).toList();
        }
        if (source != null && !source.isEmpty()) {
            results = results.stream().filter(t -> source.equals(t.getSource())).toList();
        }

        return results;
    }

    public TaskBank getTaskForHomework(Long taskId) {
        return taskBankRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Задание не найдено"));
    }

    private String callDeepSeek(String prompt, String subject, String examType) {
        // Бесплатный API DeepSeek
        String apiKey = "sk-9f287861f91348f9829fc9325bf9263e"; // ← ВСТАВЬ СВОЙ КЛЮЧ

        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();

            String systemPrompt = String.format(
                    "Ты — помощник для генерации учебных заданий. " +
                            "Сгенерируй задание по предмету '%s' для экзамена '%s'. " +
                            "Ответь СТРОГО в формате JSON без лишнего текста:\n" +
                            "{\n" +
                            "  \"question\": \"текст задания\",\n" +
                            "  \"answer\": \"правильный ответ\",\n" +
                            "  \"explanation\": \"пояснение к решению\",\n" +
                            "  \"topic\": \"тема задания\",\n" +
                            "  \"difficulty\": 3\n" +
                            "}", subject, examType);

            String body = String.format("""
            {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": "%s"},
                    {"role": "user", "content": "%s"}
                ],
                "temperature": 0.7,
                "max_tokens": 2000
            }
            """, systemPrompt.replace("\"", "\\\""), prompt.replace("\"", "\\\""));

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.deepseek.com/v1/chat/completions"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(body))
                    .build();

            java.net.http.HttpResponse<String> response = client.send(request,
                    java.net.http.HttpResponse.BodyHandlers.ofString());

            // Парсим ответ
            String responseBody = response.body();
            int jsonStart = responseBody.indexOf("```json");
            int jsonEnd = responseBody.indexOf("```", jsonStart + 7);

            if (jsonStart != -1 && jsonEnd != -1) {
                return responseBody.substring(jsonStart + 7, jsonEnd).trim();
            } else {
                return responseBody;
            }

        } catch (Exception e) {
            log.error("Ошибка вызова DeepSeek: {}", e.getMessage());
            throw new RuntimeException("Ошибка генерации: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteTask(Long taskId) {
        TaskBank task = taskBankRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Задание не найдено"));
        taskBankRepository.delete(task);
    }

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
        homework.setStatus("ASSIGNED");
        homework.setMaxScore(task.getMaxScore());
        homework.setCreatedAt(LocalDateTime.now());
        homework.setUpdatedAt(LocalDateTime.now());

        return homeworkRepository.save(homework);
    }
}