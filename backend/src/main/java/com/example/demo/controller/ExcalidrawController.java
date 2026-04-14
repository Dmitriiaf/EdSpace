package com.example.demo.controller;

import com.example.demo.service.ExcalidrawService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/excalidraw")
@CrossOrigin(origins = "http://localhost:3000")
public class ExcalidrawController {

    @Autowired
    private ExcalidrawService excalidrawService;

    @GetMapping("/board/{lessonId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getBoardInfo(@PathVariable Long lessonId,
                                          @RequestAttribute("userId") Long userId,
                                          @RequestAttribute("userRole") String userRole) {
        try {
            ExcalidrawService.BoardInfo boardInfo = excalidrawService.getBoardInfo(lessonId, userId, userRole);
            return ResponseEntity.ok(Map.of(
                    "boardUrl", boardInfo.getBoardUrl(),
                    "roomName", boardInfo.getRoomName(),
                    "courseName", boardInfo.getCourseName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/board/{lessonId}/generate")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> generateBoard(@PathVariable Long lessonId,
                                           @RequestAttribute("userId") Long userId) {
        try {
            String boardUrl = excalidrawService.getOrCreateBoardUrl(lessonId, userId, "ROLE_TUTOR");
            return ResponseEntity.ok(Map.of(
                    "boardUrl", boardUrl,
                    "message", "Онлайн-доска создана"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}