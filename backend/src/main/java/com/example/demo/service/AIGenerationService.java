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
    private static final String GIGACHAT_AUTH_KEY = "MDE5ZTU5ZWQtZDUxMS03NDdjLWIxMTQtNDI5MjYzODRiNjdiOjZkMzMwOWRhLTM0ZjEtNGI2NC1hMGY4LWMyMmUwMTU0MGUyNg==";

    /**
     * Основной метод генерации — через GigaChat с RAG (примерами из базы)
     */
    public TaskBank generateWithAI(String prompt, String subject, String examType, Long tutorId) {
        // 1. Ищем похожие задания в базе
        Integer taskNumber = detectTaskNumber(prompt, null);
        List<TaskBank> examples = (taskNumber != null && subject != null)
                ? taskBankRepository.findSimilarTasks(subject, taskNumber)
                : List.of();

        log.info("📚 [RAG] Найдено примеров для subject={}, taskNumber={}: {}", subject, taskNumber, examples.size());

        // 2. Формируем промт с примерами
        String enhancedPrompt = buildRAGPrompt(prompt, subject, examType, examples);

        // 3. Отправляем в GigaChat
        String jsonResponse = callGigaChat(enhancedPrompt, subject, examType);

        // 4. Парсим ответ
        try {
            JsonNode result = objectMapper.readTree(jsonResponse);

            TaskBank task = new TaskBank();
            task.setSource("AI_GENERATED");
            task.setSubject(subject);
            task.setExamType(examType);
            task.setType("problem");
            task.setTaskNumber(taskNumber);
            task.setQuestion(result.has("question") ? result.get("question").asText() : "");
            task.setAnswer(result.has("answer") ? result.get("answer").asText() : "");
            task.setExplanation(result.has("explanation") ? result.get("explanation").asText() : "");
            task.setTopic(result.has("topic") ? result.get("topic").asText() : "");
            task.setDifficulty(result.has("difficulty") ? result.get("difficulty").asInt() : 3);
            task.setIsPublic(true);
            task.setCreatedAt(java.time.LocalDateTime.now());
            task.setUpdatedAt(java.time.LocalDateTime.now());

            log.info("✅ Задание сгенерировано: topic={}, difficulty={}", task.getTopic(), task.getDifficulty());
            return task;

        } catch (Exception e) {
            log.error("Ошибка парсинга ответа GigaChat: {}", e.getMessage());
            throw new BusinessException("Не удалось распознать ответ ИИ");
        }
    }

    /**
     * Формирует промт с примерами из базы (RAG)
     */
    private String buildRAGPrompt(String prompt, String subject, String examType, List<TaskBank> examples) {
        StringBuilder sb = new StringBuilder();

        sb.append(String.format(
                "Ты — эксперт ФИПИ, 15 лет создаёшь задания для %s по предмету \"%s\".\n\n",
                examType, subject));

        if (!examples.isEmpty()) {
            sb.append("Вот примеры РЕАЛЬНЫХ заданий из базы ФИПИ в правильном формате:\n\n");
            for (int i = 0; i < Math.min(3, examples.size()); i++) {
                TaskBank ex = examples.get(i);
                sb.append(String.format("ПРИМЕР %d:\n%s\n\n", i + 1, ex.getQuestion()));
                if (ex.getAnswer() != null && !ex.getAnswer().isEmpty()) {
                    sb.append(String.format("ОТВЕТ К ПРИМЕРУ %d: %s\n\n", i + 1, ex.getAnswer()));
                }
            }
            sb.append("Создай НОВОЕ уникальное задание ТОЧНО ТАКОГО ЖЕ ТИПА и СЛОЖНОСТИ, но с другими числами и условиями.\n\n");
        } else {
            sb.append("Создай уникальное задание в формате ЕГЭ.\n\n");
        }

        sb.append("ТРЕБОВАНИЯ К ЗАДАНИЮ:\n");
        sb.append("- Формат как в настоящем ЕГЭ: подробное условие, алгоритм, входные данные, вопрос\n");
        sb.append("- Сложность: средняя или выше средней\n");
        sb.append("- Должна быть одна неочевидная ловушка\n");
        sb.append("- Ответ — целое число или конкретное значение\n");
        sb.append("- В решении — пошаговый разбор\n\n");

        sb.append(String.format("ЗАПРОС: %s\n\n", prompt));

        sb.append("ОТВЕТЬ СТРОГО ТОЛЬКО JSON БЕЗ ТЕКСТА ВОКРУГ:\n");
        sb.append("{\"question\":\"полный текст задания\",\"answer\":\"правильный ответ\",\"explanation\":\"подробное пошаговое решение\",\"topic\":\"тема задания\",\"difficulty\":3}");

        return sb.toString();
    }

    /**
     * GigaChat API (Сбер) — бесплатно для РФ
     */
    private String callGigaChat(String prompt, String subject, String examType) {
        try {
            // Отключаем проверку SSL для GigaChat
            javax.net.ssl.TrustManager[] trustAllCerts = new javax.net.ssl.TrustManager[]{
                    new javax.net.ssl.X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() { return null; }
                        public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                        public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                    }
            };
            javax.net.ssl.SSLContext sc = javax.net.ssl.SSLContext.getInstance("SSL");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder().sslContext(sc).build();

            // Шаг 1: Получаем токен
            String authBody = "scope=GIGACHAT_API_PERS";
            java.net.http.HttpRequest authRequest = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://ngw.devices.sberbank.ru:9443/api/v2/oauth"))
                    .header("Authorization", "Bearer " + GIGACHAT_AUTH_KEY)
                    .header("RqUID", java.util.UUID.randomUUID().toString())
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(authBody))
                    .build();

            java.net.http.HttpResponse<String> authResponse = client.send(authRequest,
                    java.net.http.HttpResponse.BodyHandlers.ofString());

            JsonNode authJson = objectMapper.readTree(authResponse.body());
            if (authJson.has("error")) {
                throw new BusinessException("Ошибка авторизации GigaChat: " + authJson.path("error").asText());
            }
            String accessToken = authJson.get("access_token").asText();

            // Шаг 2: Генерируем задание
            String escaped = prompt
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "")
                    .replace("\t", " ");

            String body = "{"
                    + "\"model\": \"GigaChat\","
                    + "\"messages\": [{\"role\": \"user\", \"content\": \"" + escaped + "\"}],"
                    + "\"temperature\": 0.8,"
                    + "\"max_tokens\": 2500"
                    + "}";

            java.net.http.HttpRequest chatRequest = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://gigachat.devices.sberbank.ru/api/v1/chat/completions"))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(body))
                    .build();

            java.net.http.HttpResponse<String> chatResponse = client.send(chatRequest,
                    java.net.http.HttpResponse.BodyHandlers.ofString());

            String responseBody = chatResponse.body();
            log.info("📩 GigaChat raw: {}", responseBody);

            JsonNode root = objectMapper.readTree(responseBody);
            if (root.has("error")) {
                throw new BusinessException("GigaChat: " + root.path("error").path("message").asText());
            }

            String text = root.path("choices").get(0).path("message").path("content").asText();

            // Очищаем ответ от мусора
            text = text.replace("```json", "").replace("```", "").trim();
            text = text.replace("\\n", " ").replace("\\r", " ").replace("\\t", " ");
            text = text.replace("\\\"", "'").replace("\\\\", " ");
            text = text.replaceAll("\\\\[a-z]", " ");
            text = text.replace("\n", " ").replace("\r", " ");
            text = text.replaceAll("\\s+", " ");

            int jsonStart = text.indexOf("{");
            int jsonEnd = text.lastIndexOf("}") + 1;

            return (jsonStart != -1 && jsonEnd > jsonStart) ? text.substring(jsonStart, jsonEnd) : text;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("GigaChat error: {}", e.getMessage());
            throw new BusinessException("Ошибка GigaChat: " + e.getMessage());
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    private Integer detectTaskNumber(String prompt, String taskType) {
        if (taskType != null && !taskType.isEmpty() && !"custom".equals(taskType)) {
            String num = taskType.replaceAll("[^0-9]", "");
            if (!num.isEmpty()) return Integer.parseInt(num);
        }
        if (prompt != null) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b(\\d{1,2})\\s*(?:задание|номер|задача)");
            java.util.regex.Matcher matcher = pattern.matcher(prompt.toLowerCase());
            if (matcher.find()) return Integer.parseInt(matcher.group(1));
        }
        return null;
    }

    // ========== СТАРЫЕ МЕТОДЫ (YandexGPT) — сохранены ==========

    public TaskBank generateTaskWithRAG(String prompt, String subject, String examType, String taskType) {
        Integer taskNumber = detectTaskNumber(prompt, taskType);
        List<TaskBank> examples = (taskNumber != null && subject != null)
                ? taskBankRepository.findSimilarTasks(subject, taskNumber) : List.of();
        log.info("📚 [RAG] Найдено примеров: {}", examples.size());
        String enhancedPrompt = buildPromptWithExamples(prompt, subject, examType, examples);
        return generateTask(enhancedPrompt, subject, examType, taskNumber);
    }

    private TaskBank generateTask(String fullPrompt, String subject, String examType, Integer taskNumber) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Api-Key " + apiKey);

        String modelUri = "gpt://" + folderId + "/yandexgpt/latest";

        String expertSystemPrompt = String.format(
                "Ты — ведущий эксперт ФИПИ. Создай уникальное задание для %s по предмету \"%s\". " +
                        "Средняя сложность, с ловушкой на внимательность. Ответ — целое число. " +
                        "Формат: задание, потом решение, потом ОТВЕТ: 123.", examType, subject);

        Map<String, Object> body = Map.of(
                "modelUri", modelUri,
                "completionOptions", Map.of("stream", false, "temperature", 0.7, "maxTokens", "2500"),
                "messages", List.of(
                        Map.of("role", "system", "text", expertSystemPrompt),
                        Map.of("role", "user", "text", fullPrompt)));

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(YANDEX_GPT_URL, request, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            if (root.has("error")) throw new BusinessException("YandexGPT: " + root.path("error").path("message").asText());

            JsonNode alternatives = root.path("result").path("alternatives");
            String generatedText = alternatives.isArray() && alternatives.size() > 0
                    ? alternatives.get(0).path("message").path("text").asText() : "";
            if (generatedText.isEmpty()) throw new BusinessException("Пустой ответ");

            return parseGeneratedText(generatedText, subject, examType, taskNumber);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Ошибка YandexGPT: {}", e.getMessage());
            throw new BusinessException("Ошибка генерации: " + e.getMessage());
        }
    }

    private String buildPromptWithExamples(String prompt, String subject, String examType, List<TaskBank> examples) {
        StringBuilder sb = new StringBuilder();
        if (!examples.isEmpty()) {
            sb.append("Примеры реальных заданий:\n\n");
            for (int i = 0; i < Math.min(3, examples.size()); i++) {
                TaskBank ex = examples.get(i);
                sb.append(String.format("Пример %d:\nЗАДАНИЕ: %s\nОТВЕТ: %s\n\n", i + 1, ex.getQuestion(), ex.getAnswer()));
            }
            sb.append("Создай НОВОЕ уникальное задание такого же типа.\n");
        }
        sb.append(String.format("Тема: %s. %s\n\n", subject, prompt));
        sb.append("Формат ответа:\nЗАДАНИЕ: [текст]\nОТВЕТ: [ответ]\nРЕШЕНИЕ: [пояснение]");
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

        task.setQuestion(question != null ? question.trim() : "Не сгенерировано");
        task.setAnswer(answer != null ? answer.trim() : "");
        task.setExplanation(explanation != null ? explanation.trim() : "");
        if (question != null && question.length() > 30) {
            task.setTopic(question.substring(0, Math.min(50, question.length())));
        }
        return task;
    }

    private String extractBetween(String text, String start, String end) {
        int s = text.indexOf(start);
        if (s == -1) return null;
        s += start.length();
        int e = text.indexOf(end, s);
        return e == -1 ? text.substring(s) : text.substring(s, e);
    }

    private String extractAfter(String text, String marker) {
        int i = text.indexOf(marker);
        return i == -1 ? null : text.substring(i + marker.length());
    }
}