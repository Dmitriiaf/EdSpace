package com.example.demo.controller;

import com.example.demo.entity.Tutor;
import com.example.demo.repository.TutorRepository;
import com.example.demo.config.JwtUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth/vk")
public class VkOAuthController {

    @Value("${vk.client-id}")
    private String clientId;

    @Value("${vk.client-secret}")
    private String clientSecret;

    @Value("${vk.redirect-uri}")
    private String redirectUri;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private JwtUtils jwtUtils;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/login")
    public ResponseEntity<Void> login() {
        String url = "https://id.vk.com/authorize" +
                "?response_type=code" +
                "&client_id=" + clientId +
                "&redirect_uri=" + redirectUri +
                "&scope=email vkid.personal_info" +
                "&v=5.199";
        return ResponseEntity.status(302).header("Location", url).build();
    }

    @GetMapping("/callback")
    public ResponseEntity<?> callback(@RequestParam("code") String code) {
        try {
            String tokenUrl = "https://id.vk.com/oauth2/auth" +
                    "?grant_type=authorization_code" +
                    "&code=" + code +
                    "&client_id=" + clientId +
                    "&client_secret=" + clientSecret +
                    "&redirect_uri=" + redirectUri;

            ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(tokenUrl, null, Map.class);
            Map<String, Object> tokenBody = tokenResponse.getBody();
            String accessToken = (String) tokenBody.get("access_token");
            Long userId = Long.parseLong(tokenBody.get("user_id").toString());

            String userUrl = "https://id.vk.com/oauth2/user_info" +
                    "?access_token=" + accessToken +
                    "&v=5.199";
            ResponseEntity<Map> userResponse = restTemplate.getForEntity(userUrl, Map.class);
            Map<String, Object> userInfo = userResponse.getBody();

            String email = (String) userInfo.get("email");
            String fullName = ((String) userInfo.get("first_name")) + " " + ((String) userInfo.get("last_name"));

            if (email == null || email.isEmpty()) {
                email = "vk_" + userId + "@ed-space.ru";
            }

            Tutor tutor = tutorRepository.findByEmail(email).orElse(null);
            if (tutor == null) {
                tutor = new Tutor();
                tutor.setEmail(email);
                tutor.setFullName(fullName != null ? fullName : "Пользователь VK");
                tutor.setPasswordHash("VK_OAUTH_" + System.currentTimeMillis());
                tutor.setRole("ROLE_TUTOR");
                tutor.setEmailVerified(true);
                tutor = tutorRepository.save(tutor);
                log.info("✅ Новый репетитор через VK ID: {} ({})", tutor.getFullName(), email);
            }

            String jwt = jwtUtils.generateToken(tutor.getEmail(), tutor.getId(), "ROLE_TUTOR", tutor.getFullName());
            String target = (tutor.getOnboardingCompleted() != null && tutor.getOnboardingCompleted())
                    ? "/dashboard" : "/onboarding";
            String frontendUrl = "https://ed-space.ru/oauth-callback?token=" + jwt + "&target=" + target;
            return ResponseEntity.status(302).header("Location", frontendUrl).build();

        } catch (Exception e) {
            log.error("Ошибка VK OAuth: {}", e.getMessage());
            return ResponseEntity.status(302)
                    .header("Location", "https://ed-space.ru/login?error=vk_auth_failed")
                    .build();
        }
    }
}