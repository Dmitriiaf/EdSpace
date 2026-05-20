package com.example.demo.controller;

import com.example.demo.entity.Tutor;
import com.example.demo.entity.VideoRoom;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.VideoRoomRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/video-rooms")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class VideoRoomController {

    @Autowired
    private VideoRoomRepository videoRoomRepository;

    @Autowired
    private TutorRepository tutorRepository;

    // Получить все комнаты репетитора
    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getRooms(@PathVariable Long tutorId,
                                      @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        // Студент может видеть комнаты своего репетитора
        List<VideoRoom> rooms = videoRoomRepository.findByTutorIdOrderByCreatedAtDesc(tutorId);
        return ResponseEntity.ok(rooms);
    }

    // Создать комнату
    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, String> request,
                                        @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Tutor tutor = tutorRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

            VideoRoom room = new VideoRoom();
            room.setTutor(tutor);
            room.setName(request.get("name"));
            room.setPlatform(request.getOrDefault("platform", "OTHER"));
            room.setUrl(request.get("url"));

            // Если это первая комната или помечена как дефолтная
            if (Boolean.parseBoolean(request.get("isDefault"))) {
                // Снимаем дефолт с других
                videoRoomRepository.findByTutorIdAndIsDefaultTrue(currentUserId)
                        .ifPresent(r -> {
                            r.setIsDefault(false);
                            videoRoomRepository.save(r);
                        });
                room.setIsDefault(true);
            }

            VideoRoom saved = videoRoomRepository.save(room);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Обновить комнату
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateRoom(@PathVariable Long id,
                                        @RequestBody Map<String, String> request,
                                        @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            VideoRoom room = videoRoomRepository.findByIdAndTutorId(id, currentUserId)
                    .orElseThrow(() -> new RuntimeException("Комната не найдена"));

            if (request.containsKey("name")) room.setName(request.get("name"));
            if (request.containsKey("platform")) room.setPlatform(request.get("platform"));
            if (request.containsKey("url")) room.setUrl(request.get("url"));

            if (Boolean.parseBoolean(request.get("isDefault"))) {
                videoRoomRepository.findByTutorIdAndIsDefaultTrue(currentUserId)
                        .ifPresent(r -> {
                            if (!r.getId().equals(id)) {
                                r.setIsDefault(false);
                                videoRoomRepository.save(r);
                            }
                        });
                room.setIsDefault(true);
            }

            VideoRoom saved = videoRoomRepository.save(room);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Удалить комнату
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteRoom(@PathVariable Long id,
                                        @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            VideoRoom room = videoRoomRepository.findByIdAndTutorId(id, currentUserId)
                    .orElseThrow(() -> new RuntimeException("Комната не найдена"));
            videoRoomRepository.delete(room);
            return ResponseEntity.ok(Map.of("message", "Комната удалена"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}