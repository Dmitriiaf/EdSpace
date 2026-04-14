package com.example.demo.repository;

import com.example.demo.entity.TaskBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskBankRepository extends JpaRepository<TaskBank, Long> {

    List<TaskBank> findBySource(String source);
    List<TaskBank> findBySubject(String subject);
    List<TaskBank> findByExamType(String examType);
    List<TaskBank> findBySubjectAndExamType(String subject, String examType);

    @Query("SELECT t FROM TaskBank t WHERE " +
            "LOWER(t.question) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(t.topic) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(t.tags) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<TaskBank> search(@Param("query") String query);

    // НОВЫЙ МЕТОД для RAG
    @Query("SELECT t FROM TaskBank t WHERE t.subject = :subject AND t.taskNumber = :taskNumber")
    List<TaskBank> findSimilarTasks(@Param("subject") String subject, @Param("taskNumber") Integer taskNumber);

    @Query("SELECT DISTINCT t.subject FROM TaskBank t")
    List<String> findAllSubjects();

    @Query("SELECT DISTINCT t.examType FROM TaskBank t")
    List<String> findAllExamTypes();

    @Query("SELECT DISTINCT t.topic FROM TaskBank t WHERE t.subject = :subject")
    List<String> findTopicsBySubject(@Param("subject") String subject);
}