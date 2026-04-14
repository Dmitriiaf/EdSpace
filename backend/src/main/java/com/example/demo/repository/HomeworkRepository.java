package com.example.demo.repository;

import com.example.demo.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, Long> {
    List<Homework> findByStudentId(Long studentId);
    List<Homework> findByStudentIdAndStatus(Long studentId, String status);
    List<Homework> findByTutorId(Long tutorId);
}