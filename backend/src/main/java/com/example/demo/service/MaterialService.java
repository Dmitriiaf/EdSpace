// ========== MaterialService.java ==========
package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MaterialService {

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private MaterialFolderRepository folderRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    private final String uploadDir = "uploads/materials/";

    @Transactional
    public Material uploadMaterial(Long tutorId, MultipartFile file, String title, String description,
                                   Long studentId, Long courseId, Long folderId) throws IOException {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        if (file.getSize() > 50 * 1024 * 1024) {
            throw new RuntimeException("Файл слишком большой. Максимальный размер 50MB");
        }

        Course course = null;
        if (courseId != null && courseId > 0) {
            course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Курс не найден"));
            if (!course.getTutor().getId().equals(tutorId)) {
                throw new RuntimeException("У вас нет доступа к этому курсу");
            }
        }

        MaterialFolder folder = null;
        if (folderId != null && folderId > 0) {
            folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new RuntimeException("Папка не найдена"));
            if (!folder.getTutor().getId().equals(tutorId)) {
                throw new RuntimeException("У вас нет доступа к этой папке");
            }
            if (folder.getCourse() != null && course == null) {
                course = folder.getCourse();
            }
        }

        Path uploadPath = Paths.get(uploadDir + tutorId);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String uniqueFileName = UUID.randomUUID().toString() + extension;
        String filePath = uploadDir + tutorId + "/" + uniqueFileName;

        Path fullPath = uploadPath.resolve(uniqueFileName);
        Files.write(fullPath, file.getBytes());

        Material material = new Material(tutor, title, filePath, originalFileName, file.getContentType());
        material.setDescription(description);
        material.setFileSize(file.getSize());

        if (studentId != null && studentId > 0) {
            Student student = studentRepository.findById(studentId).orElse(null);
            material.setStudent(student);
        }
        if (course != null) {
            material.setCourse(course);
        }
        if (folder != null) {
            material.setFolder(folder);
        }

        return materialRepository.save(material);
    }

    @Transactional
    public MaterialFolder createFolder(Long tutorId, String name, Long parentFolderId, Long courseId) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        Course course = null;
        if (courseId != null && courseId > 0) {
            course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Курс не найден"));
            if (!course.getTutor().getId().equals(tutorId)) {
                throw new RuntimeException("У вас нет доступа к этому курсу");
            }
        }

        MaterialFolder folder = new MaterialFolder(tutor, name);
        folder.setCourse(course);

        if (parentFolderId != null && parentFolderId > 0) {
            MaterialFolder parent = folderRepository.findById(parentFolderId)
                    .orElseThrow(() -> new RuntimeException("Родительская папка не найдена"));
            if (!parent.getTutor().getId().equals(tutorId)) {
                throw new RuntimeException("У вас нет доступа к родительской папке");
            }
            folder.setParentFolder(parent);
        }

        return folderRepository.save(folder);
    }

    @Transactional
    public MaterialFolder updateFolder(Long folderId, String name, Long courseId, Long tutorId) {
        MaterialFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Папка не найдена"));

        if (!folder.getTutor().getId().equals(tutorId)) {
            throw new RuntimeException("У вас нет доступа к этой папке");
        }

        if (name != null && !name.isEmpty()) {
            folder.setName(name);
        }

        if (courseId != null && courseId > 0) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Курс не найден"));
            if (!course.getTutor().getId().equals(tutorId)) {
                throw new RuntimeException("У вас нет доступа к этому курсу");
            }
            folder.setCourse(course);
        } else {
            folder.setCourse(null);
        }

        return folderRepository.save(folder);
    }

    @Transactional
    public Material updateMaterial(Long materialId, String title, String description,
                                   Long studentId, Long courseId, Long folderId, Long tutorId) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Материал не найден"));

        if (!material.getTutor().getId().equals(tutorId)) {
            throw new RuntimeException("У вас нет доступа к этому материалу");
        }

        if (title != null && !title.isEmpty()) {
            material.setTitle(title);
        }
        material.setDescription(description);

        if (studentId != null && studentId > 0) {
            Student student = studentRepository.findById(studentId).orElse(null);
            material.setStudent(student);
        } else {
            material.setStudent(null);
        }

        if (courseId != null && courseId > 0) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Курс не найден"));
            if (!course.getTutor().getId().equals(tutorId)) {
                throw new RuntimeException("У вас нет доступа к этому курсу");
            }
            material.setCourse(course);
        } else {
            material.setCourse(null);
        }

        if (folderId != null && folderId > 0) {
            MaterialFolder folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new RuntimeException("Папка не найдена"));
            if (!folder.getTutor().getId().equals(tutorId)) {
                throw new RuntimeException("У вас нет доступа к этой папке");
            }
            material.setFolder(folder);
        } else {
            material.setFolder(null);
        }

        material.setUpdatedAt(LocalDateTime.now());
        return materialRepository.save(material);
    }

    public List<MaterialFolder> getAllFoldersByTutor(Long tutorId) {
        return folderRepository.findByTutorId(tutorId);
    }

    public List<Material> getMaterialsByTutor(Long tutorId) {
        return materialRepository.findByTutorId(tutorId);
    }

    public List<Material> getMaterialsByTutorAndCourse(Long tutorId, Long courseId) {
        if (courseId != null) {
            return materialRepository.findByTutorIdAndCourseId(tutorId, courseId);
        }
        return materialRepository.findByTutorId(tutorId);
    }

    public List<MaterialFolder> getFoldersByTutor(Long tutorId) {
        return folderRepository.findByTutorId(tutorId);
    }

    public List<MaterialFolder> getRootFolders(Long tutorId) {
        return folderRepository.findByTutorIdAndParentFolderIsNull(tutorId);
    }

    public List<MaterialFolder> getRootFoldersByCourse(Long tutorId, Long courseId) {
        List<MaterialFolder> rootFolders = getRootFolders(tutorId);
        if (courseId != null) {
            return rootFolders.stream()
                    .filter(f -> f.getCourse() != null && f.getCourse().getId().equals(courseId))
                    .collect(Collectors.toList());
        }
        return rootFolders;
    }

    public List<Material> getRootMaterials(Long tutorId) {
        return materialRepository.findRootMaterials(tutorId);
    }

    public List<Material> getRootMaterialsByCourse(Long tutorId, Long courseId) {
        List<Material> rootMaterials = getRootMaterials(tutorId);
        if (courseId != null) {
            return rootMaterials.stream()
                    .filter(m -> m.getCourse() != null && m.getCourse().getId().equals(courseId))
                    .collect(Collectors.toList());
        }
        return rootMaterials;
    }

    public List<Material> getMaterialsByFolder(Long folderId) {
        return materialRepository.findByFolderId(folderId);
    }

    public List<MaterialFolder> getSubFolders(Long folderId) {
        return folderRepository.findByParentFolderId(folderId);
    }

    public Material getMaterialById(Long id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Материал не найден"));
    }

    public MaterialFolder getFolderById(Long id) {
        return folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Папка не найдена"));
    }

    @Transactional
    public void deleteMaterial(Long id) {
        Material material = getMaterialById(id);
        try {
            Path path = Paths.get(material.getFilePath());
            Files.deleteIfExists(path);
        } catch (IOException e) {
            System.err.println("Ошибка при удалении файла: " + e.getMessage());
        }
        materialRepository.delete(material);
    }

    @Transactional
    public void deleteFolder(Long folderId) {
        MaterialFolder folder = getFolderById(folderId);
        List<Material> materials = materialRepository.findByFolderId(folderId);
        for (Material material : materials) {
            deleteMaterial(material.getId());
        }
        List<MaterialFolder> subFolders = folderRepository.findByParentFolderId(folderId);
        for (MaterialFolder subFolder : subFolders) {
            deleteFolder(subFolder.getId());
        }
        folderRepository.delete(folder);
    }

    @Transactional
    public Material moveMaterial(Long materialId, Long folderId) {
        Material material = getMaterialById(materialId);
        if (folderId != null && folderId > 0) {
            MaterialFolder folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new RuntimeException("Папка не найдена"));
            if (material.getCourse() != null && folder.getCourse() != null) {
                if (!material.getCourse().getId().equals(folder.getCourse().getId())) {
                    throw new RuntimeException("Нельзя переместить материал в папку другого курса");
                }
            }
            material.setFolder(folder);
        } else {
            material.setFolder(null);
        }
        return materialRepository.save(material);
    }

    public List<Material> getMaterialsForStudent(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        Set<Material> accessibleMaterials = new HashSet<>();

        List<Material> allMaterials = materialRepository.findAll();
        List<Material> directMaterials = allMaterials.stream()
                .filter(m -> m.getStudent() != null && m.getStudent().getId().equals(studentId))
                .collect(Collectors.toList());
        accessibleMaterials.addAll(directMaterials);

        List<Course> enrolledCourses = courseRepository.findCoursesByStudentId(studentId);
        for (Course course : enrolledCourses) {
            List<Material> courseMaterials = allMaterials.stream()
                    .filter(m -> m.getCourse() != null && m.getCourse().getId().equals(course.getId()))
                    .collect(Collectors.toList());
            accessibleMaterials.addAll(courseMaterials);
        }

        return new ArrayList<>(accessibleMaterials);
    }

    public List<MaterialFolder> getFoldersForStudent(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        Set<MaterialFolder> accessibleFolders = new HashSet<>();

        List<Course> enrolledCourses = courseRepository.findCoursesByStudentId(studentId);
        List<MaterialFolder> allFolders = folderRepository.findAll();

        for (Course course : enrolledCourses) {
            List<MaterialFolder> courseFolders = allFolders.stream()
                    .filter(f -> f.getCourse() != null && f.getCourse().getId().equals(course.getId()))
                    .collect(Collectors.toList());
            accessibleFolders.addAll(courseFolders);
        }

        return new ArrayList<>(accessibleFolders);
    }

    public Map<String, Object> getFolderContentForStudent(Long folderId, Long studentId) {
        MaterialFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Папка не найдена"));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        // Проверяем доступ к папке: либо через курс, либо у ученика есть материалы в этой папке
        boolean hasAccess = hasAccessToFolder(folder, studentId);
        if (!hasAccess) {
            List<Material> studentMaterialsInFolder = materialRepository.findByFolderId(folderId).stream()
                    .filter(m -> m.getStudent() != null && m.getStudent().getId().equals(studentId))
                    .collect(Collectors.toList());
            if (studentMaterialsInFolder.isEmpty()) {
                throw new RuntimeException("У вас нет доступа к этой папке");
            }
        }

        // Получаем ВСЕ материалы в папке и фильтруем доступные ученику
        List<Material> allMaterials = materialRepository.findByFolderId(folderId);
        List<Material> accessibleMaterials = allMaterials.stream()
                .filter(m -> isMaterialAccessibleForStudent(m, studentId))
                .collect(Collectors.toList());

        List<MaterialFolder> subFolders = folderRepository.findByParentFolderId(folderId).stream()
                .filter(f -> hasAccessToFolder(f, studentId) || hasStudentMaterialsInFolder(f, studentId))
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("materials", accessibleMaterials);
        result.put("folders", subFolders);
        return result;
    }

    private boolean hasAccessToFolder(MaterialFolder folder, Long studentId) {
        // Если папка не привязана к курсу — проверяем, есть ли в ней файлы ученика
        if (folder.getCourse() == null) {
            return hasStudentMaterialsInFolder(folder, studentId);
        }
        // Если привязана к курсу — проверяем, записан ли ученик на этот курс
        List<Course> enrolledCourses = courseRepository.findCoursesByStudentId(studentId);
        return enrolledCourses.stream()
                .anyMatch(c -> c.getId().equals(folder.getCourse().getId()));
    }

    /**
     * Проверяет, доступен ли материал ученику
     */
    private boolean isMaterialAccessibleForStudent(Material material, Long studentId) {
        if (material.getStudent() != null && material.getStudent().getId().equals(studentId)) {
            return true;
        }
        if (material.getCourse() != null) {
            List<Course> enrolledCourses = courseRepository.findCoursesByStudentId(studentId);
            return enrolledCourses.stream()
                    .anyMatch(c -> c.getId().equals(material.getCourse().getId()));
        }
        return material.getStudent() == null && material.getCourse() == null;
    }

    /**
     * Проверяет, есть ли в папке файлы, привязанные лично к ученику
     */
    private boolean hasStudentMaterialsInFolder(MaterialFolder folder, Long studentId) {
        List<Material> materials = materialRepository.findByFolderId(folder.getId());
        return materials.stream()
                .anyMatch(m -> m.getStudent() != null && m.getStudent().getId().equals(studentId));
    }

    public Map<String, Object> getAllMaterialsForStudent(Long studentId) {
        List<Material> allAccessibleMaterials = getMaterialsForStudent(studentId);
        List<MaterialFolder> allAccessibleFolders = getFoldersForStudent(studentId);

        List<Material> rootMaterials = allAccessibleMaterials.stream()
                .filter(m -> m.getFolder() == null)
                .collect(Collectors.toList());

        List<MaterialFolder> rootFolders = allAccessibleFolders.stream()
                .filter(f -> f.getParentFolder() == null)
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("materials", rootMaterials);
        result.put("folders", rootFolders);
        return result;
    }
}