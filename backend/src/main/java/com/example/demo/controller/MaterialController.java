// ========== MaterialController.java ==========
package com.example.demo.controller;

import com.example.demo.entity.Material;
import com.example.demo.entity.MaterialFolder;
import com.example.demo.service.MaterialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/materials")
@CrossOrigin(origins = "http://localhost:3000")
public class MaterialController {

    @Autowired
    private MaterialService materialService;

    @PostMapping("/upload")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> uploadMaterial(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "studentId", required = false) Long studentId,
            @RequestParam(value = "courseId", required = false) Long courseId,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Material material = materialService.uploadMaterial(
                    currentUserId, file, title, description, studentId, courseId, folderId);
            return ResponseEntity.ok(material);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ошибка загрузки файла: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/folder")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createFolder(@RequestBody Map<String, Object> request,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            String name = (String) request.get("name");
            Long parentFolderId = request.get("parentFolderId") != null ?
                    Long.parseLong(request.get("parentFolderId").toString()) : null;
            Long courseId = request.get("courseId") != null ?
                    Long.parseLong(request.get("courseId").toString()) : null;
            MaterialFolder folder = materialService.createFolder(currentUserId, name, parentFolderId, courseId);
            return ResponseEntity.ok(folder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/folder/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateFolder(@PathVariable Long id,
                                          @RequestBody Map<String, Object> request,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            String name = (String) request.get("name");
            Long courseId = request.get("courseId") != null ?
                    Long.parseLong(request.get("courseId").toString()) : null;

            MaterialFolder folder = materialService.updateFolder(id, name, courseId, currentUserId);
            return ResponseEntity.ok(folder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getMaterials(
            @RequestParam(value = "courseId", required = false) Long courseId,
            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            List<Material> materials;
            List<MaterialFolder> folders;

            if (courseId != null) {
                materials = materialService.getRootMaterialsByCourse(currentUserId, courseId);
                folders = materialService.getRootFoldersByCourse(currentUserId, courseId);
            } else {
                materials = materialService.getRootMaterials(currentUserId);
                folders = materialService.getRootFolders(currentUserId);
            }

            return ResponseEntity.ok(Map.of("materials", materials, "folders", folders));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/folders")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getFolders(@RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            List<MaterialFolder> folders = materialService.getAllFoldersByTutor(currentUserId);
            return ResponseEntity.ok(folders);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/folder/{folderId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getFolderContent(@PathVariable Long folderId) {
        try {
            List<Material> materials = materialService.getMaterialsByFolder(folderId);
            List<MaterialFolder> subFolders = materialService.getSubFolders(folderId);
            return ResponseEntity.ok(Map.of("materials", materials, "folders", subFolders));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getMaterialsForStudent(@PathVariable Long studentId,
                                                    @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                    @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Map<String, Object> result = materialService.getAllMaterialsForStudent(studentId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/folder/{folderId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getFolderContentForStudent(@PathVariable Long studentId,
                                                        @PathVariable Long folderId,
                                                        @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                        @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Map<String, Object> result = materialService.getFolderContentForStudent(folderId, studentId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/download/{id}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> downloadMaterial(@PathVariable Long id) {
        try {
            Material material = materialService.getMaterialById(id);
            Path filePath = Paths.get(material.getFilePath());
            Resource resource = new FileSystemResource(filePath);

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + material.getFileName() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteMaterial(@PathVariable Long id) {
        try {
            materialService.deleteMaterial(id);
            return ResponseEntity.ok(Map.of("message", "Материал удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/folder/{folderId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteFolder(@PathVariable Long folderId) {
        try {
            materialService.deleteFolder(folderId);
            return ResponseEntity.ok(Map.of("message", "Папка удалена"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/move")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> moveMaterial(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Long folderId = request.get("folderId") != null ? Long.parseLong(request.get("folderId").toString()) : null;
            Material material = materialService.moveMaterial(id, folderId);
            return ResponseEntity.ok(material);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateMaterial(@PathVariable Long id,
                                            @RequestBody Map<String, Object> request,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            Long studentId = request.get("studentId") != null ? Long.parseLong(request.get("studentId").toString()) : null;
            Long courseId = request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null;
            Long folderId = request.get("folderId") != null ? Long.parseLong(request.get("folderId").toString()) : null;

            Material material = materialService.updateMaterial(id, title, description, studentId, courseId, folderId, currentUserId);
            return ResponseEntity.ok(material);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}