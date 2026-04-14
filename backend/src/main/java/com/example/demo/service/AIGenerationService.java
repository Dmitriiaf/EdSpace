package com.example.demo.service;

import com.example.demo.entity.TaskBank;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.TaskBankRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AIGenerationService {

    @Value("${yandex.api.key}")
    private String apiKey;

    @Value("${yandex.folder.id}")
    private String folderId;

    @Autowired
    private TaskBankRepository taskBankRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String YANDEX_GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

    /**
     * Сгенерировать задание с использованием RAG (примеры из базы)
     */
    public TaskBank generateTaskWithRAG(String prompt, String subject, String examType, String taskType) {
        // 1. Определяем номер задания
        Integer taskNumber = detectTaskNumber(prompt, taskType);

        // 2. Ищем похожие задания в базе
        List<TaskBank> examples = (taskNumber != null && subject != null)
                ? taskBankRepository.findSimilarTasks(subject, taskNumber)
                : List.of();

        log.info("📚 [RAG] Найдено примеров для subject={}, taskNumber={}: {}", subject, taskNumber, examples.size());

        // 3. Формируем промт с примерами
        String enhancedPrompt = buildPromptWithExamples(prompt, subject, examType, examples);

        // 4. Отправляем в YandexGPT
        return generateTask(enhancedPrompt, subject, examType, taskNumber);
    }

    private TaskBank generateTask(String fullPrompt, String subject, String examType, Integer taskNumber) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Api-Key " + apiKey);

        Map<String, Object> body = Map.of(
                "modelUri", "gpt://" + folderId + "/yandexgpt-lite/latest",
                "completionOptions", Map.of(
                        "stream", false,
                        "temperature", 0.7,
                        "maxTokens", "2000"
                ),
                "messages", List.of(
                        Map.of("role", "system", "text", "Ты — опытный преподаватель и эксперт по составлению заданий ЕГЭ и ОГЭ. Отвечай строго в указанном формате."),
                        Map.of("role", "user", "text", fullPrompt)
                )
        );

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);

            log.info("🤖 Отправка запроса к YandexGPT...");
            ResponseEntity<String> response = restTemplate.postForEntity(YANDEX_GPT_URL, request, String.class);
            log.info("✅ Ответ получен");

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode result = root.path("result");
            JsonNode alternatives = result.path("alternatives");

            String generatedText = "";
            if (alternatives.isArray() && alternatives.size() > 0) {
                JsonNode firstAlternative = alternatives.get(0);
                JsonNode message = firstAlternative.path("message");
                generatedText = message.path("text").asText();
            }

            return parseGeneratedText(generatedText, subject, examType, taskNumber);

        } catch (Exception e) {
            log.error("❌ Ошибка генерации: {}", e.getMessage(), e);
            throw new BusinessException("Ошибка генерации задания: " + e.getMessage());
        }
    }

    private Integer detectTaskNumber(String prompt, String taskType) {
        // Пытаемся извлечь номер из taskType (например, "inf_16" -> 16)
        if (taskType != null && !taskType.isEmpty() && !"custom".equals(taskType)) {
            String num = taskType.replaceAll("[^0-9]", "");
            if (!num.isEmpty()) {
                log.info("📌 [RAG] Определён номер задания из taskType: {}", num);
                return Integer.parseInt(num);
            }
        }

        // Ищем число в промте
        if (prompt != null) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b(\\d{1,2})\\s*(?:задание|номер|задача)");
            java.util.regex.Matcher matcher = pattern.matcher(prompt.toLowerCase());
            if (matcher.find()) {
                String num = matcher.group(1);
                log.info("📌 [RAG] Определён номер задания из промта: {}", num);
                return Integer.parseInt(num);
            }
        }

        log.info("📌 [RAG] Номер задания не определён");
        return null;
    }

    private String buildPromptWithExamples(String prompt, String subject, String examType, List<TaskBank> examples) {
        StringBuilder sb = new StringBuilder();

        if (!examples.isEmpty()) {
            sb.append("Вот примеры реальных заданий в таком же формате:\n\n");
            int count = Math.min(3, examples.size());
            for (int i = 0; i < count; i++) {
                TaskBank ex = examples.get(i);
                sb.append(String.format("Пример %d:\n", i + 1));
                sb.append(String.format("ЗАДАНИЕ: %s\n", ex.getQuestion()));
                sb.append(String.format("ОТВЕТ: %s\n\n", ex.getAnswer()));
            }
            sb.append("На основе этих примеров, создай НОВОЕ уникальное задание такого же типа и сложности.\n");
            sb.append(String.format("Тема: %s. %s\n\n", subject, prompt));
        } else {
            sb.append(String.format("Создай задание в формате %s по предмету \"%s\". %s\n\n",
                    examType, subject, prompt));
        }

        sb.append("Ответ должен быть строго в следующем формате:\n");
        sb.append("ЗАДАНИЕ: [текст задания]\n");
        sb.append("ОТВЕТ: [правильный ответ]\n");
        sb.append("РЕШЕНИЕ: [краткое пояснение или решение]");

        return sb.toString();
    }

    private TaskBank parseGeneratedText(String text, String subject, String examType, Integer taskNumber) {
        TaskBank task = new TaskBank();
        task.setSource("AI_GENERATED");
        task.setSubject(subject);
        task.setExamType(examType);
        task.setType("problem");
        task.setTaskNumber(taskNumber);

        String question = extractBetween(text, "ЗАДАНИЕ:", "ОТВЕТ:");
        String answer = extractBetween(text, "ОТВЕТ:", "РЕШЕНИЕ:");
        String explanation = extractAfter(text, "РЕШЕНИЕ:");

        task.setQuestion(question != null ? question.trim() : "Текст задания не сгенерирован");
        task.setAnswer(answer != null ? answer.trim() : "");
        task.setExplanation(explanation != null ? explanation.trim() : "");

        if (question != null && question.length() > 30) {
            task.setTopic(question.substring(0, Math.min(50, question.length())));
        }

        return task;
    }

    private String extractBetween(String text, String startMarker, String endMarker) {
        int startIndex = text.indexOf(startMarker);
        if (startIndex == -1) return null;
        startIndex += startMarker.length();

        int endIndex = text.indexOf(endMarker, startIndex);
        if (endIndex == -1) return text.substring(startIndex);

        return text.substring(startIndex, endIndex);
    }

    private String extractAfter(String text, String marker) {
        int index = text.indexOf(marker);
        if (index == -1) return null;
        return text.substring(index + marker.length());
    }
}