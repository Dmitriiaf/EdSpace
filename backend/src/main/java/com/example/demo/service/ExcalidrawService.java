package com.example.demo.service;

import com.example.demo.entity.Lesson;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.LessonRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
public class ExcalidrawService {

    @Value("${excalidraw.url:https://excalidraw.com}")
    private String excalidrawUrl;

    @Autowired
    private LessonRepository lessonRepository;

    /**
     * Генерирует или возвращает существующую ссылку на доску Excalidraw для занятия
     */
    public String getOrCreateBoardUrl(Long lessonId, Long userId, String userRole) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Занятие", "id", lessonId));

        // Проверяем права доступа
        checkAccess(lesson, userId, userRole);

        // Если у занятия уже есть доска, возвращаем её
        if (lesson.getBoardRoomName() != null && !lesson.getBoardRoomName().isEmpty()) {
            log.info("🎨 Возвращаем существующую доску Excalidraw: {}", lesson.getBoardRoomName());
            return buildBoardUrl(lesson.getBoardRoomName());
        }

        // Создаём новую доску
        String roomName = generateRoomName(lesson);
        lesson.setBoardRoomName(roomName);
        lessonRepository.save(lesson);

        log.info("🆕 Создана новая доска Excalidraw: {} для занятия id={}", roomName, lessonId);
        return buildBoardUrl(roomName);
    }

    /**
     * Получить информацию о доске
     */
    public BoardInfo getBoardInfo(Long lessonId, Long userId, String userRole) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Занятие", "id", lessonId));

        checkAccess(lesson, userId, userRole);

        String roomName = lesson.getBoardRoomName();
        if (roomName == null || roomName.isEmpty()) {
            roomName = generateRoomName(lesson);
            lesson.setBoardRoomName(roomName);
            lessonRepository.save(lesson);
        }

        return new BoardInfo(
                buildBoardUrl(roomName),
                roomName,
                lesson.getCourse() != null ? lesson.getCourse().getName() : "Занятие"
        );
    }

    private void checkAccess(Lesson lesson, Long userId, String userRole) {
        if ("ROLE_TUTOR".equals(userRole)) {
            if (!lesson.getTutor().getId().equals(userId)) {
                throw new NotFoundException("Занятие", "id", lesson.getId());
            }
        } else if ("ROLE_STUDENT".equals(userRole)) {
            if (!lesson.getStudent().getId().equals(userId)) {
                throw new NotFoundException("Занятие", "id", lesson.getId());
            }
        }
    }

    private String generateRoomName(Lesson lesson) {
        String base = String.format("EdSpace-board-%d-%d-%d",
                lesson.getTutor().getId(),
                lesson.getStudent().getId(),
                System.currentTimeMillis() / 1000
        );
        return base.replaceAll("[^a-zA-Z0-9-]", "-").toLowerCase();
    }

    private String buildBoardUrl(String roomName) {
        // Excalidraw поддерживает комнаты через хэш
        return String.format("%s/#room=%s", excalidrawUrl, roomName);
    }

    /**
     * DTO для информации о доске
     */
    public static class BoardInfo {
        private final String boardUrl;
        private final String roomName;
        private final String courseName;

        public BoardInfo(String boardUrl, String roomName, String courseName) {
            this.boardUrl = boardUrl;
            this.roomName = roomName;
            this.courseName = courseName;
        }

        public String getBoardUrl() { return boardUrl; }
        public String getRoomName() { return roomName; }
        public String getCourseName() { return courseName; }
    }
}