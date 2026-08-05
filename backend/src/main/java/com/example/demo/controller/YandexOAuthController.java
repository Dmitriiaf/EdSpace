package com.example.demo.controller;

import com.example.demo.entity.Tutor;
import com.example.demo.repository.TutorRepository;
import com.example.demo.config.JwtUtils;
import lombok.extern.slf4j.Slf4j;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth/yandex")
public class YandexOAuthController {

    @Value("${yandex.client-id}")
    private String clientId;

    @Value("${yandex.client-secret}")
    private String clientSecret;

    @Value("${yandex.redirect-uri}")
    private String redirectUri;

    @Value("${yandex.token-url}")
    private String tokenUrl;

    @Value("${yandex.userinfo-url}")
    private String userinfoUrl;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private JwtUtils jwtUtils;

    private final RestTemplate restTemplate;

    public YandexOAuthController() {
        this.restTemplate = new RestTemplate();
        this.restTemplate.getMessageConverters().add(0,
                new org.springframework.http.converter.StringHttpMessageConverter(StandardCharsets.UTF_8));
    }
    // Шаг 1: Редирект на Яндекс для авторизации
    @GetMapping("/login")
    public ResponseEntity<Void> login() {
        String url = "https://oauth.yandex.ru/authorize" +
                "?response_type=code" +
                "&client_id=" + clientId +
                "&redirect_uri=" + redirectUri +
                "&force_confirm=yes";
        return ResponseEntity.status(302).header("Location", url).build();
    }

    // Шаг 2: Callback от Яндекса с кодом
    @GetMapping("/callback")
    public ResponseEntity<?> callback(@RequestParam("code") String code) {
        try {
            // Обмениваем код на токен
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "authorization_code");
            params.add("code", code);
            params.add("client_id", clientId);
            params.add("client_secret", clientSecret);
            params.add("redirect_uri", redirectUri);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<Map> tokenResponse = restTemplate.exchange(
                    tokenUrl, HttpMethod.POST,
                    new HttpEntity<>(params, headers), Map.class);

            Map<String, Object> tokenBody = tokenResponse.getBody();
            String accessToken = (String) tokenBody.get("access_token");

            // Получаем данные пользователя
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.set("Authorization", "OAuth " + accessToken);
            ResponseEntity<Map> userResponse = restTemplate.exchange(
                    userinfoUrl + "?format=json",
                    HttpMethod.GET,
                    new HttpEntity<>(userHeaders), Map.class);

            Map<String, Object> userInfo = userResponse.getBody();
            String email = (String) userInfo.get("default_email");
            String fullName = (String) userInfo.get("real_name");
            // Ищем или создаём репетитора
            Tutor tutor = tutorRepository.findByEmail(email).orElse(null);
            if (tutor == null) {
                tutor = new Tutor();
                tutor.setEmail(email);
                tutor.setFullName(fullName != null ? fullName : email.split("@")[0]);
                tutor.setPasswordHash("YANDEX_OAUTH_" + System.currentTimeMillis());
                tutor.setRole("ROLE_TUTOR");
                tutor.setEmailVerified(true);
                tutor = tutorRepository.save(tutor);
                log.info("✅ Новый репетитор через Яндекс: {} ({})", tutor.getFullName(), email);
            }

            // Генерируем JWT
            String jwt = jwtUtils.generateToken(tutor.getEmail(), tutor.getId(), "ROLE_TUTOR", tutor.getFullName());
            // Если онбординг уже пройден — редирект сразу в дашборд
            // Если нет — на страницу онбординга
            String target = (tutor.getOnboardingCompleted() != null && tutor.getOnboardingCompleted())
                    ? "/dashboard" : "/onboarding";
            String frontendUrl = "https://ed-space.ru/oauth-callback?token=" + jwt + "&target=" + target;
            return ResponseEntity.status(302).header("Location", frontendUrl).build();

        } catch (Exception e) {
            log.error("Ошибка Яндекс OAuth: {}", e.getMessage());
            return ResponseEntity.status(302)
                    .header("Location", "https://ed-space.ru/login?error=yandex_auth_failed")
                    .build();
        }
    }
}