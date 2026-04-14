// ========== backend/src/main/java/com/example/demo/service/VariantService.java ==========
package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VariantService {

    @Autowired
    private VariantRepository variantRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Transactional
    public Variant createVariant(Long tutorId, String title, String url, String description,
                                 String subject, String examType, Long courseId) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        Variant variant = new Variant(tutor, title, url);
        variant.setDescription(description);
        variant.setSubject(subject);
        variant.setExamType(examType);

        if (courseId != null) {
            Course course = courseRepository.findById(courseId).orElse(null);
            variant.setCourse(course);
        }

        return variantRepository.save(variant);
    }

    public List<Variant> getVariantsByTutor(Long tutorId) {
        return variantRepository.findByTutorId(tutorId);
    }

    public List<Variant> searchVariants(Long tutorId, String query) {
        if (query == null || query.isEmpty()) {
            return variantRepository.findByTutorId(tutorId);
        }
        return variantRepository.searchByTutor(tutorId, query);
    }

    public Variant getVariantById(Long id) {
        return variantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Вариант не найден"));
    }

    @Transactional
    public void deleteVariant(Long id) {
        Variant variant = getVariantById(id);
        variantRepository.delete(variant);
    }

    @Transactional
    public Variant updateVariant(Long id, String title, String url, String description,
                                 String subject, String examType, Long courseId) {
        Variant variant = getVariantById(id);

        if (title != null) variant.setTitle(title);
        if (url != null) variant.setUrl(url);
        if (description != null) variant.setDescription(description);
        if (subject != null) variant.setSubject(subject);
        if (examType != null) variant.setExamType(examType);

        if (courseId != null) {
            Course course = courseRepository.findById(courseId).orElse(null);
            variant.setCourse(course);
        } else {
            variant.setCourse(null);
        }

        return variantRepository.save(variant);
    }
}