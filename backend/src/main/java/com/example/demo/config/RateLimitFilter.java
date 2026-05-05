package com.example.demo.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RateLimitFilter implements Filter {

    private final Map<String, Long> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS = 60;
    private static final long TIME_WINDOW = 60_000;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String key = req.getRemoteAddr();
        long now = System.currentTimeMillis();

        requestCounts.entrySet().removeIf(e -> now - e.getValue() > TIME_WINDOW);
        long count = requestCounts.values().stream().filter(t -> now - t < TIME_WINDOW).count();

        if (count >= MAX_REQUESTS) {
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Too many requests\"}");
            return;
        }

        requestCounts.put(key + now, now);
        chain.doFilter(request, response);
    }
}