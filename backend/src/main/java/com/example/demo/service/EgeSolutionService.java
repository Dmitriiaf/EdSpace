package com.example.demo.service;

import com.example.demo.entity.EgeSolution;
import com.example.demo.entity.EgeSolutionImage;
import com.example.demo.repository.EgeSolutionImageRepository;
import com.example.demo.repository.EgeSolutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EgeSolutionService {

    private final EgeSolutionRepository solutionRepository;
    private final EgeSolutionImageRepository imageRepository;

    private static final String UPLOAD_DIR = "/opt/EdSpace/uploads/ege-solutions/";

    // ========== ПОЛУЧЕНИЕ ==========

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllSolutions(Integer taskNumber) {
        List<EgeSolution> solutions = (taskNumber != null)
                ? solutionRepository.findByTaskNumberOrderByCreatedAtDesc(taskNumber)
                : solutionRepository.findAllByOrderByTaskNumberAscCreatedAtDesc();

        List<Map<String, Object>> result = new ArrayList<>();
        for (EgeSolution s : solutions) {
            result.add(toMap(s, true));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSolutionById(Long id) {
        EgeSolution s = solutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Разбор не найден"));
        return toMap(s, true);
    }

    /**
     * Статистика: сколько разборов по каждому заданию (1-27).
     * Возвращает Map: { "1": 3, "5": 2, ... }
     */
    @Transactional(readOnly = true)
    public Map<Integer, Long> getStats() {
        Map<Integer, Long> stats = new HashMap<>();
        for (int i = 1; i <= 27; i++) {
            long count = solutionRepository.countByTaskNumber(i);
            stats.put(i, count);
        }
        return stats;
    }

    // ========== СОЗДАНИЕ ==========

    @Transactional
    public EgeSolution createSolution(Integer taskNumber, String title, String explanation,
                                      String code, String codeLanguage, String videoUrl,
                                      String sourceUrl, List<MultipartFile> images) {
        EgeSolution s = new EgeSolution();
        s.setTaskNumber(taskNumber);
        s.setTitle(title);
        s.setExplanation(explanation);
        s.setCode(code);
        s.setCodeLanguage(codeLanguage != null ? codeLanguage : "python");
        s.setVideoUrl(videoUrl);
        s.setSourceUrl(sourceUrl);
        s = solutionRepository.save(s);

        if (images != null && !images.isEmpty()) {
            saveImages(s, images, "SOLUTION");
        }

        return s;
    }

    // ========== ОБНОВЛЕНИЕ ==========

    @Transactional
    public EgeSolution updateSolution(Long id, Map<String, Object> body) {
        EgeSolution s = solutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Разбор не найден"));

        if (body.containsKey("taskNumber")) s.setTaskNumber(parseInt(body.get("taskNumber")));
        if (body.containsKey("title")) s.setTitle((String) body.get("title"));
        if (body.containsKey("explanation")) s.setExplanation((String) body.get("explanation"));
        if (body.containsKey("code")) s.setCode((String) body.get("code"));
        if (body.containsKey("codeLanguage")) s.setCodeLanguage((String) body.get("codeLanguage"));
        if (body.containsKey("videoUrl")) s.setVideoUrl((String) body.get("videoUrl"));
        if (body.containsKey("sourceUrl")) s.setSourceUrl((String) body.get("sourceUrl"));

        return solutionRepository.save(s);
    }

    // ========== КАРТИНКИ ==========

    @Transactional
    public List<EgeSolutionImage> addImages(Long solutionId, List<MultipartFile> images, String imageType) {
        EgeSolution s = solutionRepository.findById(solutionId)
                .orElseThrow(() -> new RuntimeException("Разбор не найден"));
        saveImages(s, images, imageType);
        return imageRepository.findBySolutionIdOrderByOrderIndexAsc(solutionId);
    }

    @Transactional
    public void deleteImage(Long imageId) {
        EgeSolutionImage img = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Картинка не найдена"));
        // Удаляем файл с диска
        try {
            String fileName = img.getImageUrl().substring(img.getImageUrl().lastIndexOf("/") + 1);
            File f = new File(UPLOAD_DIR + fileName);
            if (f.exists()) f.delete();
        } catch (Exception e) {
            log.warn("Не удалось удалить файл: {}", e.getMessage());
        }
        imageRepository.delete(img);
    }

    // ========== УДАЛЕНИЕ ==========

    @Transactional
    public void deleteSolution(Long id) {
        EgeSolution s = solutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Разбор не найден"));
        // Удаляем все картинки с диска
        for (EgeSolutionImage img : s.getImages()) {
            try {
                String fileName = img.getImageUrl().substring(img.getImageUrl().lastIndexOf("/") + 1);
                File f = new File(UPLOAD_DIR + fileName);
                if (f.exists()) f.delete();
            } catch (Exception e) {
                log.warn("Не удалось удалить файл: {}", e.getMessage());
            }
        }
        solutionRepository.delete(s);
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ ==========

    private void saveImages(EgeSolution solution, List<MultipartFile> images, String imageType) {
        File dir = new File(UPLOAD_DIR);
        if (!dir.exists()) dir.mkdirs();

        int order = solution.getImages() != null ? solution.getImages().size() : 0;

        for (MultipartFile file : images) {
            if (file.isEmpty()) continue;
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new RuntimeException("Файл слишком большой. Максимум 10MB");
            }
            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf("."));
            }
            String fileName = "sol_" + solution.getId() + "_" + System.currentTimeMillis() + "_" + order + ext;
            try {
                file.transferTo(new File(UPLOAD_DIR + fileName));
            } catch (Exception e) {
                throw new RuntimeException("Не удалось сохранить файл: " + e.getMessage());
            }

            EgeSolutionImage img = new EgeSolutionImage();
            img.setSolution(solution);
            img.setImageUrl("/uploads/ege-solutions/" + fileName);
            img.setOrderIndex(order++);
            img.setImageType(imageType != null ? imageType : "SOLUTION");
            imageRepository.save(img);
        }
    }

    private Map<String, Object> toMap(EgeSolution s, boolean withImages) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", s.getId());
        m.put("taskNumber", s.getTaskNumber());
        m.put("title", s.getTitle());
        m.put("explanation", s.getExplanation());
        m.put("code", s.getCode());
        m.put("codeLanguage", s.getCodeLanguage());
        m.put("videoUrl", s.getVideoUrl());
        m.put("sourceUrl", s.getSourceUrl());
        m.put("createdAt", s.getCreatedAt());
        m.put("updatedAt", s.getUpdatedAt());

        if (withImages) {
            List<Map<String, Object>> images = new ArrayList<>();
            for (EgeSolutionImage img : imageRepository.findBySolutionIdOrderByOrderIndexAsc(s.getId())) {
                Map<String, Object> im = new HashMap<>();
                im.put("id", img.getId());
                im.put("imageUrl", img.getImageUrl());
                im.put("orderIndex", img.getOrderIndex());
                im.put("imageType", img.getImageType() != null ? img.getImageType() : "SOLUTION");
                images.add(im);
            }
            m.put("images", images);
        }

        return m;
    }

    private Integer parseInt(Object v) {
        if (v == null) return null;
        try { return Integer.parseInt(v.toString()); }
        catch (NumberFormatException e) { return null; }
    }
}