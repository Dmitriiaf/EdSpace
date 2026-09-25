package com.example.demo.repository;

import com.example.demo.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
            "(m.senderId = :u1 AND m.recipientId = :u2) OR " +
            "(m.senderId = :u2 AND m.recipientId = :u1) " +
            "ORDER BY m.createdAt ASC")
    List<ChatMessage> findConversation(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT m FROM ChatMessage m WHERE " +
            "(m.senderId = :u1 AND m.recipientId = :u2) OR " +
            "(m.senderId = :u2 AND m.recipientId = :u1) " +
            "ORDER BY m.createdAt DESC")
    List<ChatMessage> findConversationDesc(@Param("u1") Long u1, @Param("u2") Long u2);

    long countByRecipientIdAndSenderIdAndIsReadFalse(Long recipientId, Long senderId);

    long countByRecipientIdAndIsReadFalse(Long recipientId);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.recipientId = :recipientId AND m.senderId = :senderId AND m.isRead = false")
    int markAsRead(@Param("recipientId") Long recipientId, @Param("senderId") Long senderId);
}