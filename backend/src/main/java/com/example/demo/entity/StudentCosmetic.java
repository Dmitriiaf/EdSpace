package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_cosmetics")
public class StudentCosmetic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "item_type", nullable = false, length = 50)
    private String itemType;

    @Column(name = "item_key", nullable = false, length = 100)
    private String itemKey;

    @Column(name = "purchased_at")
    private LocalDateTime purchasedAt;

    @Column(nullable = false)
    private Boolean active = false;

    @PrePersist
    public void prePersist() {
        if (purchasedAt == null) purchasedAt = LocalDateTime.now();
        if (active == null) active = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }

    public String getItemKey() { return itemKey; }
    public void setItemKey(String itemKey) { this.itemKey = itemKey; }

    public LocalDateTime getPurchasedAt() { return purchasedAt; }
    public void setPurchasedAt(LocalDateTime purchasedAt) { this.purchasedAt = purchasedAt; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}