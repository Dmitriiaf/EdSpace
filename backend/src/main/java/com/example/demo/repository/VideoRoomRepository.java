package com.example.demo.repository;

import com.example.demo.entity.VideoRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VideoRoomRepository extends JpaRepository<VideoRoom, Long> {
    List<VideoRoom> findByTutorIdOrderByCreatedAtDesc(Long tutorId);
    Optional<VideoRoom> findByIdAndTutorId(Long id, Long tutorId);
    Optional<VideoRoom> findByTutorIdAndIsDefaultTrue(Long tutorId);
}