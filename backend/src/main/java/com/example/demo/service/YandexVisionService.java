package com.example.demo.service;

import com.google.gson.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class YandexVisionService {

    @Value("${yandex.api.key}")
    private String apiKey;

    @Value("${yandex.folder.id}")
    private String folderId;

    private static final String VISION_URL = "https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText";

    /**
     * Распознать текст на изображении
     */
    public String recognizeText(byte[] imageBytes) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        String requestBody = String.format("""
            {
                "mimeType": "image/jpeg",
                "languageCodes": ["ru", "en"],
                "content": "%s"
            }
            """, base64Image);

        URL url = URI.create(VISION_URL).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Api-Key " + apiKey);
        conn.setRequestProperty("x-folder-id", folderId);
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(requestBody.getBytes());
            os.flush();
        }

        String response = new String(conn.getInputStream().readAllBytes());
        return extractTextFromResponse(response);
    }

    /**
     * Извлечь текст из ответа Vision API
     */
    private String extractTextFromResponse(String jsonResponse) {
        StringBuilder text = new StringBuilder();
        JsonObject root = JsonParser.parseString(jsonResponse).getAsJsonObject();
        JsonArray pages = root.getAsJsonArray("textAnnotation");
        if (pages != null) {
            for (JsonElement page : pages) {
                JsonObject pageObj = page.getAsJsonObject();
                if (pageObj.has("text")) {
                    text.append(pageObj.get("text").getAsString()).append(" ");
                }
            }
        }
        return text.toString();
    }

    /**
     * Найти сумму в рублях в распознанном тексте
     */
    public Double extractAmount(String text) {
        if (text == null || text.isEmpty()) return null;

        Pattern pattern = Pattern.compile(
                "(\\d{1,3}(?:[\\s.]?\\d{3})*(?:[,.]\\d{2})?)\\s*(?:₽|руб|rub|р\\.)",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            String amountStr = matcher.group(1)
                    .replace(" ", "")
                    .replace(",", ".");
            try {
                return Double.parseDouble(amountStr);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Извлечь номер чека из распознанного текста
     */
    public String extractReceiptNumber(String text) {
        if (text == null || text.isEmpty()) return null;

        Pattern pattern = Pattern.compile(
                "(?:чек|квитанция|транзакция|операция|платёж|receipt|transaction)\\s*[№#]?\\s*(\\d{4,20})",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            return matcher.group(1);
        }

        Pattern numberPattern = Pattern.compile("\\b(\\d{6,20})\\b");
        Matcher numberMatcher = numberPattern.matcher(text);
        if (numberMatcher.find()) {
            return numberMatcher.group(1);
        }

        return null;
    }
}