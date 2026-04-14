package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentRepository studentRepository;

    // Создать группу
    public Group createGroup(Long tutorId, Long courseId, String name,
                             String description, Integer maxStudents,
                             Double pricePerStudent, String status) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Курс не найден"));

        Group group = new Group(tutor, course, name, status);
        group.setDescription(description);
        group.setMaxStudents(maxStudents);
        group.setPricePerStudent(pricePerStudent);

        return groupRepository.save(group);
    }

    // Получить все группы репетитора
    public List<Group> getGroupsByTutor(Long tutorId) {
        return groupRepository.findByTutorId(tutorId);
    }

    // Получить группу по ID
    public Group getGroupById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Группа не найдена"));
    }

    // Обновить информацию о группе
    public Group updateGroup(Long id, String name, String description,
                             Integer maxStudents, Double pricePerStudent, String status) {
        Group group = getGroupById(id);

        if (name != null) {
            group.setName(name);
        }
        if (description != null) {
            group.setDescription(description);
        }
        if (maxStudents != null) {
            group.setMaxStudents(maxStudents);
        }
        if (pricePerStudent != null) {
            group.setPricePerStudent(pricePerStudent);
        }
        if (status != null) {
            group.setStatus(status);
        }

        return groupRepository.save(group);
    }

    // Добавить ученика в группу
    @Transactional
    public Group addStudentToGroup(Long groupId, Long studentId) {
        Group group = getGroupById(groupId);
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        // Проверяем, не в группе ли уже ученик
        if (group.getStudents().contains(student)) {
            throw new RuntimeException("Ученик уже в этой группе");
        }

        // Проверяем, есть ли место в группе
        if (group.getMaxStudents() != null &&
                group.getStudents().size() >= group.getMaxStudents()) {
            throw new RuntimeException("В группе нет свободных мест");
        }

        group.getStudents().add(student);
        return groupRepository.save(group);
    }

    // Удалить ученика из группы
    @Transactional
    public Group removeStudentFromGroup(Long groupId, Long studentId) {
        Group group = getGroupById(groupId);
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        if (!group.getStudents().contains(student)) {
            throw new RuntimeException("Ученика нет в этой группе");
        }

        group.getStudents().remove(student);
        return groupRepository.save(group);
    }

    // Получить всех учеников группы
    public List<Student> getStudentsInGroup(Long groupId) {
        Group group = getGroupById(groupId);
        return group.getStudents();
    }

    // Получить количество учеников в группе
    public int getStudentsCount(Long groupId) {
        Group group = getGroupById(groupId);
        return group.getStudents().size();
    }

    // Проверить, есть ли место в группе
    public boolean hasAvailableSeats(Long groupId) {
        Group group = getGroupById(groupId);
        if (group.getMaxStudents() == null) {
            return true; // безлимитная группа
        }
        return group.getStudents().size() < group.getMaxStudents();
    }

    // Получить группы по курсу
    public List<Group> getGroupsByCourse(Long courseId) {
        return groupRepository.findByCourseId(courseId);
    }

    // Удалить группу
    @Transactional
    public void deleteGroup(Long id) {
        Group group = getGroupById(id);

        // Проверяем, есть ли ученики в группе
        if (!group.getStudents().isEmpty()) {
            throw new RuntimeException("Нельзя удалить группу с учениками");
        }

        groupRepository.delete(group);
    }

    // Получить группы по статусу
    public List<Group> getGroupsByStatus(Long tutorId, String status) {
        return groupRepository.findByTutorId(tutorId).stream()
                .filter(g -> status.equals(g.getStatus()))
                .toList();
    }

    // Получить статистику по группам
    public Map<String, Object> getGroupStats(Long tutorId) {
        List<Group> allGroups = groupRepository.findByTutorId(tutorId);

        long totalGroups = allGroups.size();
        long activeGroups = allGroups.stream()
                .filter(g -> "active".equals(g.getStatus()))
                .count();
        long finishedGroups = allGroups.stream()
                .filter(g -> "finished".equals(g.getStatus()))
                .count();

        int totalStudents = allGroups.stream()
                .mapToInt(g -> g.getStudents().size())
                .sum();

        double averageGroupSize = totalGroups > 0 ?
                (double) totalStudents / totalGroups : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGroups", totalGroups);
        stats.put("activeGroups", activeGroups);
        stats.put("finishedGroups", finishedGroups);
        stats.put("totalStudentsInGroups", totalStudents);
        stats.put("averageGroupSize", averageGroupSize);

        return stats;
    }
}