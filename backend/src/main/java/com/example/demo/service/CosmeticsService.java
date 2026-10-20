package com.example.demo.service;

import com.example.demo.entity.StudentCosmetic;
import com.example.demo.repository.StudentCosmeticRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CosmeticsService {

    private final StudentCosmeticRepository cosmeticRepository;
    private final PointsService pointsService;
    private final AchievementService achievementService;

    // ========== КАТАЛОГ ==========
    private static final List<Map<String, Object>> SHOP = buildShop();

    public List<Map<String, Object>> getShop() {
        return SHOP;
    }

    // ========== МОИ ПОКУПКИ ==========

    public List<StudentCosmetic> getMyCosmetics(Long studentId) {
        return cosmeticRepository.findByStudentIdOrderByPurchasedAtDesc(studentId);
    }

    public List<StudentCosmetic> getActive(Long studentId) {
        return cosmeticRepository.findByStudentIdAndActiveTrue(studentId);
    }

    public List<String> getAvatarPackItems(String packKey) {
        Map<String, Object> item = findShopItem("AVATAR_PACK", packKey);
        if (item == null) {
            throw new RuntimeException("Набор не найден");
        }
        List<String> urls = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            urls.add("/uploads/avatars/packs/" + packKey + "/" + i + ".jpg");
        }
        return urls;
    }

    // ========== ПОКУПКА ==========

    @Transactional
    public StudentCosmetic buy(Long studentId, String itemType, String itemKey) {
        Map<String, Object> item = findShopItem(itemType, itemKey);
        if (item == null) {
            throw new RuntimeException("Товар не найден");
        }

        Optional<StudentCosmetic> existing =
                cosmeticRepository.findByStudentIdAndItemTypeAndItemKey(studentId, itemType, itemKey);
        if (existing.isPresent()) {
            throw new RuntimeException("Товар уже куплен");
        }

        int price = (int) item.get("price");

        boolean ok = pointsService.spend(
                studentId,
                price,
                "BUY_" + itemType + "_" + itemKey,
                null
        );
        if (!ok) {
            throw new RuntimeException("Недостаточно баллов");
        }

        StudentCosmetic c = new StudentCosmetic();
        c.setStudentId(studentId);
        c.setItemType(itemType);
        c.setItemKey(itemKey);
        c.setActive(false);
        c = cosmeticRepository.save(c);

        log.info("✅ Ученик {} купил {}/{} за {} баллов", studentId, itemType, itemKey, price);
        return c;
    }

    // ========== АКТИВАЦИЯ ==========

    @Transactional
    public StudentCosmetic activate(Long studentId, Long cosmeticId) {
        StudentCosmetic c = cosmeticRepository.findById(cosmeticId)
                .orElseThrow(() -> new RuntimeException("Покупка не найдена"));

        if (!c.getStudentId().equals(studentId)) {
            throw new RuntimeException("Это не ваша покупка");
        }

        String type = c.getItemType();

        // STICKER — до 3 активных одновременно, остальные типы — только одна активная
        if (!"STICKER".equals(type)) {
            List<StudentCosmetic> same = cosmeticRepository.findByStudentIdAndItemType(studentId, type);
            for (StudentCosmetic s : same) {
                if (!s.getId().equals(c.getId()) && Boolean.TRUE.equals(s.getActive())) {
                    s.setActive(false);
                    cosmeticRepository.save(s);
                }
            }
            c.setActive(true);
        } else {
            // Тоггл: если активен — выключаем; если нет — включаем (но не больше 3)
            if (Boolean.TRUE.equals(c.getActive())) {
                c.setActive(false);
            } else {
                long activeCount = cosmeticRepository.findByStudentIdAndItemType(studentId, "STICKER")
                        .stream().filter(s -> Boolean.TRUE.equals(s.getActive())).count();
                if (activeCount >= 3) {
                    throw new RuntimeException("Можно активировать не больше 3 стикеров");
                }
                c.setActive(true);
            }
        }

        // 🏅 Выдача ачивок за активацию косметики
        try {
            if ("NICK_COLOR".equals(type) && "rainbow".equals(c.getItemKey())) {
                achievementService.unlock(studentId, "RAINBOW_NICK");
            }
            if ("AVATAR_FRAME".equals(type) && "gold_fr".equals(c.getItemKey())) {
                achievementService.unlock(studentId, "GOLD_FRAME");
            }
        } catch (Exception e) {
            log.warn("Ошибка при выдаче ачивок за косметику: {}", e.getMessage());
        }

        return cosmeticRepository.save(c);
    }

    // ========== ВСПОМОГАТЕЛЬНОЕ ==========

    private Map<String, Object> findShopItem(String type, String key) {
        for (Map<String, Object> item : SHOP) {
            if (type.equals(item.get("type")) && key.equals(item.get("key"))) {
                return item;
            }
        }
        return null;
    }

    private static Map<String, Object> item(String type, String key, String title, String icon, int price, String preview) {
        Map<String, Object> m = new HashMap<>();
        m.put("type", type);
        m.put("key", key);
        m.put("title", title);
        m.put("icon", icon);
        m.put("price", price);
        m.put("preview", preview);
        return m;
    }

    private static List<Map<String, Object>> buildShop() {
        List<Map<String, Object>> list = new ArrayList<>();

        // 🎨 ЦВЕТ НИКА
        list.add(item("NICK_COLOR", "yellow",   "Жёлтый ник",     "🟡", 50,  "#FBBF24"));
        list.add(item("NICK_COLOR", "green",    "Зелёный ник",    "🟢", 50,  "#22C55E"));
        list.add(item("NICK_COLOR", "blue",     "Синий ник",      "🔵", 50,  "#3B82F6"));
        list.add(item("NICK_COLOR", "purple",   "Фиолетовый ник", "🟣", 80,  "#8B5CF6"));
        list.add(item("NICK_COLOR", "red",      "Красный ник",    "🔴", 80,  "#EF4444"));
        list.add(item("NICK_COLOR", "pink",     "Розовый ник",    "💗", 80,  "#EC4899"));
        list.add(item("NICK_COLOR", "rainbow",  "Радужный ник",   "🌈", 200, "rainbow"));
        list.add(item("NICK_COLOR", "gold",     "Золотой ник",    "✨", 250, "#FFD700"));

        // 🖼️ РАМКА АВАТАРА
        list.add(item("AVATAR_FRAME", "silver",  "Серебряная рамка",  "⚪", 100, "#C0C0C0"));
        list.add(item("AVATAR_FRAME", "gold_fr", "Золотая рамка",     "🥇", 150, "#FFD700"));
        list.add(item("AVATAR_FRAME", "diamond", "Бриллиантовая",     "💎", 250, "#67E8F9"));
        list.add(item("AVATAR_FRAME", "fire",    "Огненная",          "🔥", 300, "fire"));
        list.add(item("AVATAR_FRAME", "royal",   "Королевская",       "👑", 400, "#7C3AED"));

        // 😀 СТИКЕРЫ
        list.add(item("STICKER", "scholar",  "Учёный",       "🎓", 60,  "🎓"));
        list.add(item("STICKER", "onfire",   "В ударе",      "🔥", 60,  "🔥"));
        list.add(item("STICKER", "strong",   "Сильный",      "💪", 60,  "💪"));
        list.add(item("STICKER", "rocket",   "Ракета",       "🚀", 80,  "🚀"));
        list.add(item("STICKER", "star",     "Звезда",       "⭐", 80,  "⭐"));
        list.add(item("STICKER", "winner",   "Победитель",   "🏆", 100, "🏆"));
        list.add(item("STICKER", "cool",     "Крутой",       "😎", 100, "😎"));
        list.add(item("STICKER", "king",     "Король",       "👑", 150, "👑"));

        // 🏅 БЕЙДЖИ
        list.add(item("BADGE", "active", "Активный", "⚡", 80,  "⚡"));
        list.add(item("BADGE", "smart",  "Умник",    "📚", 100, "📚"));
        list.add(item("BADGE", "hundred","Сотка",    "💯", 150, "💯"));
        list.add(item("BADGE", "ege",    "ЕГЭшник",  "🎯", 120, "🎯"));
        list.add(item("BADGE", "top1",   "Топ-1",    "🥇", 250, "🥇"));

        // 🌈 ФОН ПРОФИЛЯ
        list.add(item("BACKGROUND", "pink_grad", "Розовый градиент", "🌸", 100, "linear-gradient(135deg,#FBCFE8,#F9A8D4)"));
        list.add(item("BACKGROUND", "blue_grad", "Синий градиент",   "🌊", 100, "linear-gradient(135deg,#BFDBFE,#93C5FD)"));
        list.add(item("BACKGROUND", "sunset",    "Закат",            "🌅", 120, "linear-gradient(135deg,#FDBA74,#F472B6)"));
        list.add(item("BACKGROUND", "space",     "Космос",           "🌌", 200, "linear-gradient(135deg,#1E1B4B,#312E81)"));
        list.add(item("BACKGROUND", "custom",    "Персональный",     "🎨", 300, "custom"));

        // 🎯 АВАТАРЫ
        list.add(item("AVATAR_PACK", "free",      "Базовые",   "🎨", 0, "free"));
        list.add(item("AVATAR_PACK", "cats",     "Кошки",       "🐱", 100, "cats"));
        list.add(item("AVATAR_PACK", "dogs",     "Собаки",      "🐶", 100, "dogs"));
        list.add(item("AVATAR_PACK", "foxes",    "Лисы",        "🦊", 120, "foxes"));
        list.add(item("AVATAR_PACK", "robots",   "Роботы",      "🤖", 150, "robots"));
        list.add(item("AVATAR_PACK", "gamers",   "Геймеры",     "🎮", 180, "gamers"));
        list.add(item("AVATAR_PACK", "mythical", "Мифические",  "🐉", 200, "mythical"));

        return list;
    }
}