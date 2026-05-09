package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_path")
    private String receiptPath;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @Column(name = "receipt_number")
    private String receiptNumber;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate;

    @Column(name = "lesson_date")
    private LocalDate lessonDate;

    @Column(name = "payment_type", nullable = false)
    private String paymentType;

    @Column(nullable = false)
    private String status;

    private String notes;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @Column(name = "confirmed_by_parent", nullable = false)
    private boolean confirmedByParent = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "course_name")
    private String courseName;

    @Column(name = "tutor_name")
    private String tutorName;

    @Column(name = "subscription_id")
    private Long subscriptionId;

    // ✅ НОВЫЕ ПОЛЯ ДЛЯ ЮKASSA
    @Column(name = "external_payment_id")
    private String externalPaymentId;

    @Column(name = "payment_url", length = 500)
    private String paymentUrl;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public Payment() {
        this.createdAt = LocalDateTime.now();
    }

    public Payment(Tutor tutor, Student student, Double amount,
                   LocalDateTime paymentDate, String paymentType, String status) {
        this();
        this.tutor = tutor;
        this.student = student;
        this.amount = amount;
        this.paymentDate = paymentDate;
        this.paymentType = paymentType;
        this.status = status;
        this.confirmedByParent = false;
    }

    // ========== ГЕТТЕРЫ И СЕТТЕРЫ ==========

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
    public Long getCourseId() { return course != null ? course.getId() : null; }

    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

    public String getReceiptPath() { return receiptPath; }
    public void setReceiptPath(String receiptPath) { this.receiptPath = receiptPath; }

    public Tutor getTutor() { return tutor; }
    public void setTutor(Tutor tutor) { this.tutor = tutor; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

    public LocalDate getLessonDate() { return lessonDate; }
    public void setLessonDate(LocalDate lessonDate) { this.lessonDate = lessonDate; }

    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }

    public boolean isConfirmedByParent() { return confirmedByParent; }
    public void setConfirmedByParent(boolean confirmedByParent) { this.confirmedByParent = confirmedByParent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getTutorName() { return tutorName; }
    public void setTutorName(String tutorName) { this.tutorName = tutorName; }

    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }

    // ✅ ГЕТТЕРЫ И СЕТТЕРЫ ДЛЯ НОВЫХ ПОЛЕЙ
    public String getExternalPaymentId() { return externalPaymentId; }
    public void setExternalPaymentId(String externalPaymentId) { this.externalPaymentId = externalPaymentId; }

    public String getPaymentUrl() { return paymentUrl; }
    public void setPaymentUrl(String paymentUrl) { this.paymentUrl = paymentUrl; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}