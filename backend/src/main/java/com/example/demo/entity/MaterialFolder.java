// ========== MaterialFolder.java ==========
package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "material_folder")
public class MaterialFolder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    @JsonIgnore
    private Tutor tutor;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "parent_folder_id")
    @JsonIgnore
    private MaterialFolder parentFolder;

    @OneToMany(mappedBy = "parentFolder", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<MaterialFolder> subFolders = new ArrayList<>();

    @OneToMany(mappedBy = "folder")
    @JsonIgnore
    private List<Material> materials = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public MaterialFolder() {
        this.createdAt = LocalDateTime.now();
    }

    public MaterialFolder(Tutor tutor, String name) {
        this();
        this.tutor = tutor;
        this.name = name;
    }

    public MaterialFolder(Tutor tutor, String name, Course course) {
        this();
        this.tutor = tutor;
        this.name = name;
        this.course = course;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Tutor getTutor() { return tutor; }
    public void setTutor(Tutor tutor) { this.tutor = tutor; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public MaterialFolder getParentFolder() { return parentFolder; }
    public void setParentFolder(MaterialFolder parentFolder) { this.parentFolder = parentFolder; }

    public List<MaterialFolder> getSubFolders() { return subFolders; }
    public void setSubFolders(List<MaterialFolder> subFolders) { this.subFolders = subFolders; }

    public List<Material> getMaterials() { return materials; }
    public void setMaterials(List<Material> materials) { this.materials = materials; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}