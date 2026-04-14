// ========== backend/src/main/java/com/example/demo/repository/VariantRepository.java (ПОЛНАЯ ЗАМЕНА) ==========
package com.example.demo.repository;

import com.example.demo.entity.Variant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VariantRepository extends JpaRepository<Variant, Long> {

    List<Variant> findByTutorId(Long tutorId);

    List<Variant> findBySubject(String subject);

    @Query("SELECT v FROM Variant v WHERE v.tutor.id = :tutorId AND " +
            "(LOWER(v.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(v.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Variant> searchByTutor(@Param("tutorId") Long tutorId, @Param("query") String query);

    Optional<Variant> findByUrl(String url);
}