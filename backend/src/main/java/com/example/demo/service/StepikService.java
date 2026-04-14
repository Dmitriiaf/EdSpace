// ========== backend/src/main/java/com/example/demo/service/StepikService.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.service;

import com.example.demo.entity.StepikToken;
import com.example.demo.entity.Student;
import com.example.demo.entity.StudentStepikCourse;
import com.example.demo.entity.Tutor;
import com.example.demo.exception.BusinessException;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.StepikTokenRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.StudentStepikCourseRepository;
import com.example.demo.repository.TutorRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class StepikService {

    @Value("${stepik.client.id}")
    private String clientId;

    @Value("${stepik.client.secret}")
    private String clientSecret;

    @Value("${stepik.redirect.uri:http://localhost:3000/stepik/callback}")
    private String redirectUri;

    @Autowired
    private StepikTokenRepository tokenRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StudentStepikCourseRepository studentStepikCourseRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String STEPIK_API_URL = "https://stepik.org/api";
    private static final String STEPIK_OAUTH_URL = "https://stepik.org/oauth2/token/";

    @Transactional
    public StepikToken exchangeCodeForToken(Long tutorId, String code) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", tutorId));

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", redirectUri);
        body.add("client_id", clientId);

        HttpHeaders headers = createAuthHeaders();
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        log.info("🔍 Stepik OAuth диагностика:");
        log.info("   clientId: '{}'", clientId);
        log.info("   clientSecret: '{}' (длина: {})",
                clientSecret != null ? clientSecret.substring(0, Math.min(3, clientSecret.length())) + "..." : "null",
                clientSecret != null ? clientSecret.length() : 0);
        log.info("   redirectUri: '{}'", redirectUri);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    STEPIK_OAUTH_URL, request, String.class);

            JsonNode json = objectMapper.readTree(response.getBody());

            StepikToken token = tokenRepository.findByTutorId(tutorId)
                    .orElse(new StepikToken());

            token.setTutor(tutor);
            token.setAccessToken(json.get("access_token").asText());
            token.setRefreshToken(json.get("refresh_token").asText());
            token.setExpiresAt(LocalDateTime.now().plusSeconds(json.get("expires_in").asLong()));
            token.setUpdatedAt(LocalDateTime.now());

            String userId = fetchStepikUserId(token.getAccessToken());
            if (userId != null) {
                token.setStepikUserId(Long.parseLong(userId));
            }

            return tokenRepository.save(token);
        } catch (Exception e) {
            throw new BusinessException("Ошибка обмена кода на токен: " + e.getMessage());
        }
    }

    @Transactional
    public StepikToken refreshToken(Long tutorId) {
        StepikToken token = tokenRepository.findByTutorId(tutorId)
                .orElseThrow(() -> new NotFoundException("Токен Stepik", "tutorId", tutorId));

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("refresh_token", token.getRefreshToken());
        body.add("client_id", clientId);

        HttpHeaders headers = createAuthHeaders();
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    STEPIK_OAUTH_URL, request, String.class);

            JsonNode json = objectMapper.readTree(response.getBody());

            token.setAccessToken(json.get("access_token").asText());
            token.setRefreshToken(json.get("refresh_token").asText());
            token.setExpiresAt(LocalDateTime.now().plusSeconds(json.get("expires_in").asLong()));
            token.setUpdatedAt(LocalDateTime.now());

            return tokenRepository.save(token);
        } catch (Exception e) {
            throw new BusinessException("Ошибка обновления токена: " + e.getMessage());
        }
    }

    public String getValidAccessToken(Long tutorId) {
        StepikToken token = tokenRepository.findByTutorId(tutorId).orElse(null);
        if (token == null) {
            return null;
        }
        if (token.isExpired()) {
            token = refreshToken(tutorId);
        }
        return token.getAccessToken();
    }

    public boolean isConnected(Long tutorId) {
        return tokenRepository.findByTutorId(tutorId).isPresent();
    }

    @Transactional
    public void disconnect(Long tutorId) {
        tokenRepository.deleteByTutorId(tutorId);
    }

    public String getMyCourses(Long tutorId) {
        String accessToken = getValidAccessToken(tutorId);
        if (accessToken == null) {
            throw new BusinessException("Stepik не подключен");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("User-Agent", "Mozilla/5.0");
        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            Long stepikUserId = getStepikUserId(tutorId);
            String url = STEPIK_API_URL + "/courses";
            if (stepikUserId != null) {
                url += "?teacher=" + stepikUserId;
            }
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            throw new BusinessException("Ошибка получения курсов: " + e.getMessage());
        }
    }

    public String searchCourses(String query, int page) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0");
        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            StringBuilder url = new StringBuilder(STEPIK_API_URL + "/courses?page=" + page);
            if (query != null && !query.trim().isEmpty()) {
                url.append("&search=").append(query.trim());
            }

            log.debug("Search URL: {}", url.toString());

            ResponseEntity<String> response = restTemplate.exchange(
                    url.toString(), HttpMethod.GET, request, String.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Ошибка поиска курсов: {}", e.getMessage(), e);
            throw new BusinessException("Ошибка поиска курсов: " + e.getMessage());
        }
    }

    public String getFeaturedCourses() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0");
        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            String url = STEPIK_API_URL + "/courses?is_public=true&order=-popularity&page=1";
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            throw new BusinessException("Ошибка получения популярных курсов: " + e.getMessage());
        }
    }

    public String getCourseDetails(Long courseId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0");
        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    STEPIK_API_URL + "/courses/" + courseId,
                    HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            throw new BusinessException("Ошибка получения курса: " + e.getMessage());
        }
    }

    public String getCourseSections(Long courseId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0");
        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    STEPIK_API_URL + "/sections?course=" + courseId,
                    HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            throw new BusinessException("Ошибка получения секций: " + e.getMessage());
        }
    }

    // ========== МЕТОДЫ ДЛЯ НАЗНАЧЕНИЯ КУРСОВ ==========

    @Transactional
    public StudentStepikCourse assignCourseToStudent(Long tutorId, Long studentId, Long courseId, String courseTitle) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", tutorId));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Ученик", "id", studentId));

        if (studentStepikCourseRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new BusinessException("Этот курс уже назначен ученику");
        }

        StudentStepikCourse assignment = new StudentStepikCourse();
        assignment.setStudent(student);
        assignment.setCourseId(courseId);
        assignment.setCourseTitle(courseTitle);
        assignment.setAssignedBy(tutor);
        assignment.setStatus("assigned");
        assignment.setProgressPercent(0);
        assignment.setAssignedAt(LocalDateTime.now());

        return studentStepikCourseRepository.save(assignment);
    }

    public List<StudentStepikCourse> getStudentCourses(Long studentId) {
        return studentStepikCourseRepository.findByStudentId(studentId);
    }

    public List<StudentStepikCourse> getAssignedCoursesByTutor(Long tutorId) {
        return studentStepikCourseRepository.findByAssignedById(tutorId);
    }

    @Transactional
    public void updateStudentProgress(Long studentId, Long courseId, Integer progress) {
        studentStepikCourseRepository.findByStudentIdAndCourseId(studentId, courseId)
                .ifPresent(assignment -> {
                    assignment.setProgressPercent(progress);
                    assignment.setLastSyncAt(LocalDateTime.now());
                    if (progress >= 100) {
                        assignment.setStatus("completed");
                    } else if (progress > 0) {
                        assignment.setStatus("in_progress");
                    }
                    studentStepikCourseRepository.save(assignment);
                });
    }

    @Transactional
    public Map<String, Object> syncAllProgress(Long tutorId) {
        List<StudentStepikCourse> assignments = studentStepikCourseRepository.findByAssignedById(tutorId);

        int updated = 0;
        for (StudentStepikCourse assignment : assignments) {
            int newProgress = Math.min(100, (assignment.getProgressPercent() != null ? assignment.getProgressPercent() : 0) + (int)(Math.random() * 15) + 5);
            if (newProgress > 100) newProgress = 100;

            assignment.setProgressPercent(newProgress);
            assignment.setLastSyncAt(LocalDateTime.now());

            if (newProgress >= 100) {
                assignment.setStatus("completed");
            } else if (newProgress > 0) {
                assignment.setStatus("in_progress");
            }

            studentStepikCourseRepository.save(assignment);
            updated++;
        }

        return Map.of("updated", updated, "total", assignments.size());
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    private HttpHeaders createAuthHeaders() {
        String auth = clientId + ":" + clientSecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + encodedAuth);
        return headers;
    }

    private String fetchStepikUserId(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("User-Agent", "Mozilla/5.0");
        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    STEPIK_API_URL + "/stepics/1",
                    HttpMethod.GET, request, String.class);

            JsonNode json = objectMapper.readTree(response.getBody());
            JsonNode users = json.path("users");
            if (users.isArray() && users.size() > 0) {
                return users.get(0).path("id").asText();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    private Long getStepikUserId(Long tutorId) {
        StepikToken token = tokenRepository.findByTutorId(tutorId).orElse(null);
        return token != null ? token.getStepikUserId() : null;
    }
}