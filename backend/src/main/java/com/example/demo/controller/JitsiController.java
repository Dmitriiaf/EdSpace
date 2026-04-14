package com.example.demo.controller;

import com.example.demo.service.JitsiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/jitsi")
@CrossOrigin(origins = "http://localhost:3000")
public class JitsiController {

    @Autowired
    private JitsiService jitsiService;

    @GetMapping("/room/{lessonId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getRoomInfo(@PathVariable Long lessonId,
                                         @RequestAttribute("userId") Long userId,
                                         @RequestAttribute("userRole") String userRole) {
        try {
            JitsiService.JitsiRoomInfo roomInfo = jitsiService.getRoomInfo(lessonId, userId, userRole);
            return ResponseEntity.ok(Map.of(
                    "roomUrl", roomInfo.getRoomUrl(),
                    "roomName", roomInfo.getRoomName(),
                    "displayName", roomInfo.getDisplayName(),
                    "email", roomInfo.getEmail(),
                    "courseName", roomInfo.getCourseName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/room/{lessonId}/generate")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> generateRoom(@PathVariable Long lessonId,
                                          @RequestAttribute("userId") Long userId) {
        try {
            String roomUrl = jitsiService.getOrCreateRoomUrl(lessonId, userId, "ROLE_TUTOR");
            return ResponseEntity.ok(Map.of(
                    "roomUrl", roomUrl,
                    "message", "Комната для видеозвонка создана"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}