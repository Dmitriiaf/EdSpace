package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_room")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class VideoRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 50)
    private String platform = "OTHER"; // JITSI, ZOOM, TELEMOST, SKYPE, OTHER

    @Column(length = 500)
    private String url;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public VideoRoom() {}

    public VideoRoom(Tutor tutor, String name, String platform, String url) {
        this.tutor = tutor;
        this.name = name;
        this.platform = platform;
        this.url = url;
    }

    // Геттеры
    public Long getId() { return id; }
    public Tutor getTutor() { return tutor; }
    public String getName() { return name; }
    public String getPlatform() { return platform; }
    public String getUrl() { return url; }
    public Boolean getIsDefault() { return isDefault; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Сеттеры
    public void setId(Long id) { this.id = id; }
    public void setTutor(Tutor tutor) { this.tutor = tutor; }
    public void setName(String name) { this.name = name; }
    public void setPlatform(String platform) { this.platform = platform; }
    public void setUrl(String url) { this.url = url; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}