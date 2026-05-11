package com.example.demo.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RateLimitFilter implements Filter {

    private final Map<String, Long> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_API_REQUESTS = 120;   // API-запросы
    private static final int MAX_GET_REQUESTS = 300;    // Обычные GET
    private static final long TIME_WINDOW = 60_000;     // 1 минута

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();
        String method = req.getMethod();

        // ✅ Пропускаем статические файлы
        if (path.startsWith("/static/") || path.endsWith(".js") || path.endsWith(".css") ||
                path.endsWith(".png") || path.endsWith(".ico") || path.endsWith(".svg") ||
                path.endsWith(".woff") || path.endsWith(".woff2")) {
            chain.doFilter(request, response);
            return;
        }

        // ✅ Пропускаем страницу успеваемости (массовые запросы)
        if (path.contains("/homework/progress/") || path.contains("/progress/tutor/")) {
            chain.doFilter(request, response);
            return;
        }

        // ✅ Пропускаем health-check
        if (path.equals("/actuator/health")) {
            chain.doFilter(request, response);
            return;
        }

        // ✅ Пропускаем WebSocket
        if (path.startsWith("/ws-board")) {
            chain.doFilter(request, response);
            return;
        }

        // ✅ Пропускаем авторизацию
        if (path.startsWith("/api/auth/") || path.startsWith("/api/student-auth/") ||
                path.startsWith("/api/parent-auth/")) {
            chain.doFilter(request, response);
            return;
        }

        String ip = req.getRemoteAddr();
        long now = System.currentTimeMillis();

        // Очищаем старые записи
        requestCounts.entrySet().removeIf(e -> now - e.getValue() > TIME_WINDOW);

        // Считаем запросы от этого IP
        String key = ip;
        long count = requestCounts.values().stream()
                .filter(t -> now - t < TIME_WINDOW)
                .count();

        int maxRequests = "GET".equals(method) ? MAX_GET_REQUESTS : MAX_API_REQUESTS;

        if (count >= maxRequests) {
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Too many requests. Try again later.\"}");
            return;
        }

        requestCounts.put(key + ":" + now, now);
        chain.doFilter(request, response);
    }
}