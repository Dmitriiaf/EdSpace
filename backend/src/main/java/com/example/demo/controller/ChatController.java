package com.example.demo.controller;

import com.example.demo.entity.ChatMessage;
import com.example.demo.entity.Student;
import com.example.demo.entity.Tutor;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ========== ОТПРАВИТЬ СООБЩЕНИЕ ==========
    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> send(@RequestBody Map<String, Object> body,
                                  @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                  @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Long recipientId = Long.parseLong(body.get("recipientId").toString());
            String text = body.get("text").toString().trim();

            if (text.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Пустое сообщение"));
            }
            if (text.length() > 2000) {
                text = text.substring(0, 2000);
            }

            String senderRole = "ROLE_TUTOR".equals(userRole) ? "TUTOR" : "STUDENT";
            String recipientRole = "ROLE_TUTOR".equals(userRole) ? "STUDENT" : "TUTOR";

            ChatMessage msg = new ChatMessage(currentUserId, senderRole, recipientId, recipientRole, text);
            chatMessageRepository.save(msg);

            Map<String, Object> resp = new HashMap<>();
            resp.put("id", msg.getId());
            resp.put("senderId", msg.getSenderId());
            resp.put("recipientId", msg.getRecipientId());
            resp.put("text", msg.getText());
            resp.put("createdAt", msg.getCreatedAt().toString());
            resp.put("time", msg.getCreatedAt().format(TIME_FMT));
            resp.put("isRead", msg.getIsRead());

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Ошибка отправки сообщения: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ПЕРЕПИСКА С КОНКРЕТНЫМ ПОЛЬЗОВАТЕЛЕМ ==========
    @GetMapping("/messages/{otherUserId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getMessages(@PathVariable Long otherUserId,
                                         @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            List<ChatMessage> messages = chatMessageRepository.findConversation(currentUserId, otherUserId);

            // Помечаем входящие прочитанными
            chatMessageRepository.markAsRead(currentUserId, otherUserId);

            List<Map<String, Object>> result = new ArrayList<>();
            for (ChatMessage m : messages) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", m.getId());
                item.put("senderId", m.getSenderId());
                item.put("recipientId", m.getRecipientId());
                item.put("text", m.getText());
                item.put("isRead", m.getIsRead());
                item.put("createdAt", m.getCreatedAt().toString());
                item.put("time", m.getCreatedAt().format(TIME_FMT));
                item.put("fromMe", m.getSenderId().equals(currentUserId));
                result.add(item);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Ошибка загрузки переписки: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== СПИСОК ДИАЛОГОВ РЕПЕТИТОРА ==========
    @GetMapping("/dialogs")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getDialogs(@RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Tutor tutor = tutorRepository.findById(currentUserId).orElse(null);
            if (tutor == null) return ResponseEntity.ok(List.of());

            List<Student> students = studentRepository.findByTutorId(currentUserId);

            List<Map<String, Object>> dialogs = new ArrayList<>();

            for (Student s : students) {
                List<ChatMessage> conv = chatMessageRepository.findConversationDesc(currentUserId, s.getId());
                ChatMessage last = conv.isEmpty() ? null : conv.get(0);

                long unread = chatMessageRepository.countByRecipientIdAndSenderIdAndIsReadFalse(currentUserId, s.getId());

                Map<String, Object> item = new HashMap<>();
                item.put("studentId", s.getId());
                item.put("studentName", s.getFullName());
                item.put("avatar", s.getFullName() != null && !s.getFullName().isEmpty()
                        ? s.getFullName().substring(0, 1).toUpperCase() : "?");
                item.put("lastMessage", last != null ? last.getText() : "");
                item.put("lastTime", last != null ? last.getCreatedAt().format(TIME_FMT) : "");
                item.put("lastAt", last != null ? last.getCreatedAt().toString() : "");
                item.put("unread", unread);
                dialogs.add(item);
            }

            dialogs.sort((a, b) -> {
                String aAt = (String) a.get("lastAt");
                String bAt = (String) b.get("lastAt");
                if (aAt == null && bAt == null) return 0;
                if (aAt == null) return 1;
                if (bAt == null) return -1;
                return bAt.compareTo(aAt);
            });

            return ResponseEntity.ok(dialogs);
        } catch (Exception e) {
            log.error("Ошибка загрузки диалогов: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== КОНТАКТ УЧЕНИКА (свой репетитор) ==========
    @GetMapping("/my-tutor")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getMyTutor(@RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Student student = studentRepository.findById(currentUserId).orElse(null);
            if (student == null) return ResponseEntity.ok(Map.of());

            if (student.getTutors() == null || student.getTutors().isEmpty()) {
                return ResponseEntity.ok(Map.of());
            }

            Tutor tutor = student.getTutors().get(0);

            Map<String, Object> item = new HashMap<>();
            item.put("tutorId", tutor.getId());
            item.put("tutorName", tutor.getFullName());
            item.put("avatar", tutor.getFullName() != null && !tutor.getFullName().isEmpty()
                    ? tutor.getFullName().substring(0, 1).toUpperCase() : "?");

            long unread = chatMessageRepository.countByRecipientIdAndSenderIdAndIsReadFalse(currentUserId, tutor.getId());
            item.put("unread", unread);

            return ResponseEntity.ok(item);
        } catch (Exception e) {
            log.error("Ошибка загрузки репетитора: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ОБЩЕЕ КОЛИЧЕСТВО НЕПРОЧИТАННЫХ ==========
    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getUnreadCount(@RequestAttribute(name = "userId", required = false) Long currentUserId) {
        long count = chatMessageRepository.countByRecipientIdAndIsReadFalse(currentUserId);
        return ResponseEntity.ok(Map.of("count", count));
    }
}