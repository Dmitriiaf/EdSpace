package com.example.demo.service;

import com.example.demo.entity.Lesson;
import com.example.demo.entity.Tutor;
import com.example.demo.entity.Student;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.StudentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
public class JitsiService {

    @Value("${jitsi.domain:meet.jit.si}")
    private String jitsiDomain;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    /**
     * Генерирует или возвращает существующую ссылку на комнату Jitsi для занятия
     */
    public String getOrCreateRoomUrl(Long lessonId, Long userId, String userRole) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Занятие", "id", lessonId));

        // Проверяем права доступа
        if ("ROLE_TUTOR".equals(userRole)) {
            if (!lesson.getTutor().getId().equals(userId)) {
                throw new NotFoundException("Занятие", "id", lessonId);
            }
        } else if ("ROLE_STUDENT".equals(userRole)) {
            if (!lesson.getStudent().getId().equals(userId)) {
                throw new NotFoundException("Занятие", "id", lessonId);
            }
        }

        // Если у занятия уже есть комната, возвращаем её
        if (lesson.getJitsiRoomName() != null && !lesson.getJitsiRoomName().isEmpty()) {
            log.info("🔑 Возвращаем существующую комнату Jitsi: {}", lesson.getJitsiRoomName());
            return buildRoomUrl(lesson.getJitsiRoomName());
        }

        // Создаём новую комнату
        String roomName = generateRoomName(lesson);
        lesson.setJitsiRoomName(roomName);
        lessonRepository.save(lesson);

        log.info("🆕 Создана новая комната Jitsi: {} для занятия id={}", roomName, lessonId);
        return buildRoomUrl(roomName);
    }

    /**
     * Получить информацию о комнате для присоединения
     */
    public JitsiRoomInfo getRoomInfo(Long lessonId, Long userId, String userRole) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Занятие", "id", lessonId));

        String displayName;
        String email;

        if ("ROLE_TUTOR".equals(userRole)) {
            if (!lesson.getTutor().getId().equals(userId)) {
                throw new NotFoundException("Занятие", "id", lessonId);
            }
            Tutor tutor = lesson.getTutor();
            displayName = tutor.getFullName();
            email = tutor.getEmail();
        } else if ("ROLE_STUDENT".equals(userRole)) {
            if (!lesson.getStudent().getId().equals(userId)) {
                throw new NotFoundException("Занятие", "id", lessonId);
            }
            Student student = lesson.getStudent();
            displayName = student.getFullName();
            email = student.getEmail();
        } else {
            throw new NotFoundException("Занятие", "id", lessonId);
        }

        String roomName = lesson.getJitsiRoomName();
        if (roomName == null || roomName.isEmpty()) {
            roomName = generateRoomName(lesson);
            lesson.setJitsiRoomName(roomName);
            lessonRepository.save(lesson);
        }

        return new JitsiRoomInfo(
                buildRoomUrl(roomName),
                roomName,
                displayName,
                email,
                lesson.getCourse() != null ? lesson.getCourse().getName() : "Занятие"
        );
    }

    private String generateRoomName(Lesson lesson) {
        String base = String.format("EdSpace-%d-%d-%d",
                lesson.getTutor().getId(),
                lesson.getStudent().getId(),
                System.currentTimeMillis() / 1000
        );
        // Делаем имя комнаты безопасным для URL
        return base.replaceAll("[^a-zA-Z0-9-]", "-").toLowerCase();
    }

    private String buildRoomUrl(String roomName) {
        return String.format("https://%s/%s", jitsiDomain, roomName);
    }

    /**
     * DTO для информации о комнате
     */
    public static class JitsiRoomInfo {
        private final String roomUrl;
        private final String roomName;
        private final String displayName;
        private final String email;
        private final String courseName;

        public JitsiRoomInfo(String roomUrl, String roomName, String displayName, String email, String courseName) {
            this.roomUrl = roomUrl;
            this.roomName = roomName;
            this.displayName = displayName;
            this.email = email;
            this.courseName = courseName;
        }

        public String getRoomUrl() { return roomUrl; }
        public String getRoomName() { return roomName; }
        public String getDisplayName() { return displayName; }
        public String getEmail() { return email; }
        public String getCourseName() { return courseName; }
    }
}