package com.example.demo.repository;

import com.example.demo.entity.BoardSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BoardSessionRepository extends JpaRepository<BoardSession, Long> {
    List<BoardSession> findByTutorIdAndStatusOrderByCreatedAtDesc(Long tutorId, String status);
    void deleteByStudentId(Long studentId);
    List<BoardSession> findByStudentIdAndStatusOrderByCreatedAtDesc(Long studentId, String status);
    Optional<BoardSession> findByLessonIdAndStatus(Long lessonId, String status);
    Optional<BoardSession> findByRoomName(String roomName);
    // ДОБАВИТЬ перед последней закрывающей скобкой:
    List<BoardSession> findByStatusAndUpdatedAtBefore(String status, java.time.LocalDateTime threshold);

}