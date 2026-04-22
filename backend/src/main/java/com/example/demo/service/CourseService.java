package com.example.demo.service;

import com.example.demo.entity.Course;
import com.example.demo.entity.Subject;
import com.example.demo.entity.Tutor;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.SubjectRepository;
import com.example.demo.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private SubjectRepository subjectRepository;  // ← ДОБАВЛЕНО

    // Создать новый курс
    public Course createCourse(String name, String description,
                               String color, Long tutorId, Long subjectId) {  // ← ДОБАВЛЕН subjectId
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", tutorId));

        Course course = new Course(name, color, tutor);
        course.setDescription(description);

        // ← ДОБАВЛЕНО: привязка к предмету
        if (subjectId != null) {
            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new NotFoundException("Предмет", "id", subjectId));
            course.setSubject(subject);
        }

        return courseRepository.save(course);
    }

    // Получить все курсы репетитора
    public List<Course> getCoursesByTutor(Long tutorId) {
        return courseRepository.findByTutorId(tutorId);
    }

    // Получить курс по ID
    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Курс", "id", id));
    }

    // Обновить курс
    public Course updateCourse(Long id, String name, String description, String color, Long subjectId) {  // ← ДОБАВЛЕН subjectId
        Course course = getCourseById(id);

        if (name != null) {
            course.setName(name);
        }
        if (description != null) {
            course.setDescription(description);
        }
        if (color != null) {
            course.setColor(color);
        }

        // ← ДОБАВЛЕНО: обновление предмета
        if (subjectId != null) {
            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new NotFoundException("Предмет", "id", subjectId));
            course.setSubject(subject);
        }

        return courseRepository.save(course);
    }

    // Удалить курс
    public void deleteCourse(Long id) {
        Course course = getCourseById(id);
        courseRepository.delete(course);
    }

    // Проверить, есть ли у репетитора курс с таким названием
    public boolean existsByNameAndTutor(String name, Long tutorId) {
        List<Course> courses = courseRepository.findByTutorId(tutorId);
        return courses.stream().anyMatch(c -> c.getName().equalsIgnoreCase(name));
    }
}