// ========== backend/src/main/java/com/example/demo/scheduler/LessonGeneratorScheduler.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.scheduler;

import com.example.demo.service.LessonGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
@EnableScheduling
public class LessonGeneratorScheduler {

    @Autowired
    private LessonGeneratorService lessonGeneratorService;

    // Запускается каждый понедельник в 00:01
    @Scheduled(cron = "0 1 0 * * MON")
    public void generateWeeklyLessons() {
        System.out.println("========== ЗАПУСК ЕЖЕНЕДЕЛЬНОЙ ГЕНЕРАЦИИ ЗАНЯТИЙ ==========");
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusWeeks(4); // на 4 недели вперёд
        lessonGeneratorService.generateLessons(today, endDate);
        System.out.println("========== ГЕНЕРАЦИЯ ЗАВЕРШЕНА ==========");
    }
}