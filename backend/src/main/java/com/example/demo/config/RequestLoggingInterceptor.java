package com.example.demo.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute("startTime", LocalDateTime.now());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        LocalDateTime startTime = (LocalDateTime) request.getAttribute("startTime");
        long duration = startTime != null ? ChronoUnit.MILLIS.between(startTime, LocalDateTime.now()) : -1;

        String userId = request.getAttribute("userId") != null ? request.getAttribute("userId").toString() : "anon";
        String method = request.getMethod();
        String uri = request.getRequestURI();
        int status = response.getStatus();

        if (uri.startsWith("/api/")) {
            log.info("🌐 [{}] {} {} — {}ms (user: {}, status: {})",
                    LocalDateTime.now().toLocalTime().truncatedTo(ChronoUnit.SECONDS),
                    method, uri, duration, userId, status);
        }
    }
}