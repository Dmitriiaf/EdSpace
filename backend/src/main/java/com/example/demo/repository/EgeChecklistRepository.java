package com.example.demo.repository;

import com.example.demo.entity.EgeChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EgeChecklistRepository extends JpaRepository<EgeChecklist, Long> {

    Optional<EgeChecklist> findByStudentIdAndExamTypeAndSubject(
            Long studentId, String examType, String subject);

    List<EgeChecklist> findByStudentId(Long studentId);
}