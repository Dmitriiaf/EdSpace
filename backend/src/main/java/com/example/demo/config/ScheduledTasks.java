package com.example.demo.config;

import com.example.demo.service.BoardSessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@EnableScheduling
public class ScheduledTasks {

    @Autowired
    private BoardSessionService boardSessionService;

    /**
     * Каждый день в 3:00 ночи — архивирует доски, не обновлявшиеся более 30 дней
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void archiveOldBoards() {
        log.info("🔄 [Scheduled] Запуск автоархивации досок...");
        try {
            int count = boardSessionService.archiveOldBoards(30);
            log.info("✅ [Scheduled] Архивировано досок: {}", count);
        } catch (Exception e) {
            log.error("❌ [Scheduled] Ошибка архивации досок: {}", e.getMessage(), e);
        }
    }
}