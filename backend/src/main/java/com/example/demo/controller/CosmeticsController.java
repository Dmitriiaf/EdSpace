package com.example.demo.controller;

import com.example.demo.entity.StudentCosmetic;
import com.example.demo.service.CosmeticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cosmetics")
public class CosmeticsController {

    @Autowired
    private CosmeticsService cosmeticsService;

    @GetMapping("/shop")
    public ResponseEntity<List<Map<String, Object>>> getShop() {
        return ResponseEntity.ok(cosmeticsService.getShop());
    }

    @GetMapping("/my/{studentId}")
    public ResponseEntity<List<StudentCosmetic>> getMy(@PathVariable Long studentId) {
        return ResponseEntity.ok(cosmeticsService.getMyCosmetics(studentId));
    }

    @GetMapping("/active/{studentId}")
    public ResponseEntity<List<StudentCosmetic>> getActive(@PathVariable Long studentId) {
        return ResponseEntity.ok(cosmeticsService.getActive(studentId));
    }

    @PostMapping("/buy")
    public ResponseEntity<?> buy(@RequestBody Map<String, Object> body) {
        try {
            Long studentId = Long.valueOf(body.get("studentId").toString());
            String itemType = body.get("itemType").toString();
            String itemKey = body.get("itemKey").toString();

            StudentCosmetic c = cosmeticsService.buy(studentId, itemType, itemKey);
            return ResponseEntity.ok(c);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/packs/{packKey}")
    public ResponseEntity<?> getPackItems(@PathVariable String packKey) {
        try {
            List<String> urls = cosmeticsService.getAvatarPackItems(packKey);
            return ResponseEntity.ok(urls);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PatchMapping("/activate/{id}")
    public ResponseEntity<?> activate(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long studentId = Long.valueOf(body.get("studentId").toString());
            StudentCosmetic c = cosmeticsService.activate(studentId, id);
            return ResponseEntity.ok(c);
        } catch (RuntimeException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}