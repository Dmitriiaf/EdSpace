package com.example.demo.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RateLimitFilter implements Filter {

    // key = ip, value = {windowStartMillis, count}
    private final Map<String, long[]> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_API_REQUESTS = 600;    // API-запросы (не-GET)
    private static final int MAX_GET_REQUESTS = 2000;   // Обычные GET (polling, чат)
    private static final long TIME_WINDOW = 60_000;     // 1 минута

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();
        String method = req.getMethod();

        // Пропускаем статические файлы
        if (path.startsWith("/static/") || path.endsWith(".js") || path.endsWith(".css") ||
                path.endsWith(".png") || path.endsWith(".ico") || path.endsWith(".svg") ||
                path.endsWith(".woff") || path.endsWith(".woff2")) {
            chain.doFilter(request, response);
            return;
        }

        // Пропускаем страницу успеваемости
        if (path.contains("/homework/progress/") || path.contains("/progress/tutor/")) {
            chain.doFilter(request, response);
            return;
        }

        // Health-check
        if (path.equals("/actuator/health")) {
            chain.doFilter(request, response);
            return;
        }

        // WebSocket
        if (path.startsWith("/ws-board")) {
            chain.doFilter(request, response);
            return;
        }

        // Авторизация
        if (path.startsWith("/api/auth/") || path.startsWith("/api/student-auth/") ||
                path.startsWith("/api/parent-auth/")) {
            chain.doFilter(request, response);
            return;
        }

        // Поллинг чата и видеокомнаты — не считаем
        if (path.startsWith("/api/chat/")) {
            chain.doFilter(request, response);
            return;
        }
        if (path.startsWith("/api/games/")) {
            chain.doFilter(request, response);
            return;
        }
        if (path.matches("^/api/lessons/\\d+$") && "GET".equals(method)) {
            chain.doFilter(request, response);
            return;
        }
        if (path.matches("^/api/lessons/\\d+/start$") || path.matches("^/api/lessons/\\d+/call-started$")) {
            chain.doFilter(request, response);
            return;
        }

        // Загрузка файлов (аватары, чеки, ДЗ) — не считаем
        if (path.contains("/avatar") || path.contains("/upload") || path.endsWith("/profile")) {
            chain.doFilter(request, response);
            return;
        }

        String ip = req.getRemoteAddr();
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            ip = xff.split(",")[0].trim();
        }

        long now = System.currentTimeMillis();
        int maxRequests = "GET".equals(method) ? MAX_GET_REQUESTS : MAX_API_REQUESTS;

        long[] bucket = requestCounts.compute(ip, (k, v) -> {
            if (v == null || now - v[0] >= TIME_WINDOW) {
                return new long[]{now, 1};
            }
            v[1] = v[1] + 1;
            return v;
        });

        if (Math.random() < 0.01) {
            requestCounts.entrySet().removeIf(e -> now - e.getValue()[0] >= TIME_WINDOW);
        }

        if (bucket[1] > maxRequests) {
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Too many requests. Try again later.\"}");
            return;
        }

        chain.doFilter(request, response);
    }
}