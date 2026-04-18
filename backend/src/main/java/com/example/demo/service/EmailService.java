package com.example.demo.service;

import com.example.demo.entity.InvitationToken;
import com.example.demo.entity.PasswordResetToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    @Value("${spring.mail.host}")
    private String host;

    @Value("${spring.mail.port}")
    private int port;

    @Value("${spring.mail.username}")
    private String username;

    /**
     * Отправить приглашение ученику
     */
    public void sendStudentInvitation(InvitationToken token, String studentName, String tutorName) {
        String inviteUrl = baseUrl + "/complete-registration?token=" + token.getToken();
        String subject = "🎓 Приглашение в EdSpace от " + tutorName;

        String paymentTypeText = "subscription".equals(token.getPaymentType()) ? "Абонемент" : "Поурочная оплата";

        String htmlMessage = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                    .info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 EdSpace</h1>
                        <p>Персональная платформа для обучения</p>
                    </div>
                    <div class="content">
                        <h2>Здравствуйте, %s!</h2>
                        <p><strong>%s</strong> приглашает вас присоединиться к платформе EdSpace.</p>
                        
                        <div class="info">
                            <strong>📋 Детали:</strong><br>
                            👤 Ученик: %s<br>
                            💰 Ставка: %s ₽/занятие<br>
                            📅 Тип оплаты: %s
                        </div>
                        
                        <p>Для завершения регистрации нажмите на кнопку:</p>
                        <center><a href="%s" class="button">✅ Завершить регистрацию</a></center>
                        
                        <p>Или перейдите по ссылке:<br>
                        <a href="%s">%s</a></p>
                        
                        <p><small>⏰ Ссылка действительна 7 дней.</small></p>
                    </div>
                    <div class="footer">
                        <p>© 2026 EdSpace. Это письмо отправлено автоматически.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
                studentName,
                tutorName,
                studentName,
                token.getRatePerLesson() != null ? token.getRatePerLesson().toString() : "не указана",
                paymentTypeText,
                inviteUrl, inviteUrl, inviteUrl
        );

        sendHtmlEmail(token.getEmail(), subject, htmlMessage);
        log.info("📧 Приглашение отправлено ученику {} на email {}", studentName, token.getEmail());
    }

    /**
     * Отправить приглашение родителю
     */
    public void sendParentInvitation(InvitationToken token, String studentName, String tutorName) {
        String inviteUrl = baseUrl + "/parent-registration?token=" + token.getToken();
        String subject = "👨‍👩‍👧 Приглашение в EdSpace от " + tutorName;

        String htmlMessage = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #10B981 0%%, #059669 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                    .info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>👨‍👩‍👧 EdSpace</h1>
                        <p>Кабинет родителя</p>
                    </div>
                    <div class="content">
                        <h2>Здравствуйте!</h2>
                        <p><strong>%s</strong> приглашает вас как родителя ученика <strong>%s</strong>.</p>
                        
                        <div class="info">
                            <strong>📋 Информация:</strong><br>
                            👤 Ученик: %s<br>
                            👨‍🏫 Репетитор: %s
                        </div>
                        
                        <p>В кабинете родителя вы сможете:</p>
                        <ul>
                            <li>📅 Следить за расписанием</li>
                            <li>💳 Подтверждать оплату</li>
                            <li>📊 Отслеживать успеваемость</li>
                        </ul>
                        
                        <p>Для завершения регистрации нажмите на кнопку:</p>
                        <center><a href="%s" class="button">✅ Подтвердить родительство</a></center>
                        
                        <p><small>⏰ Ссылка действительна 7 дней.</small></p>
                    </div>
                    <div class="footer">
                        <p>© 2026 EdSpace. Это письмо отправлено автоматически.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
                tutorName, studentName,
                studentName, tutorName,
                inviteUrl
        );

        sendHtmlEmail(token.getEmail(), subject, htmlMessage);
        log.info("📧 Приглашение отправлено родителю на email {}", token.getEmail());
    }

    /**
     * Отправить письмо для восстановления пароля (HTML)
     */
    public void sendPasswordResetEmail(String email, String userName, String resetToken) {
        String resetUrl = baseUrl + "/reset-password?token=" + resetToken;
        String subject = "🔐 EdSpace — Восстановление пароля";

        String htmlMessage = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #F59E0B 0%%, #D97706 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                    .warning { background: #FEF3C7; padding: 15px; border-radius: 5px; border-left: 4px solid #F59E0B; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 EdSpace</h1>
                        <p>Восстановление пароля</p>
                    </div>
                    <div class="content">
                        <h2>Здравствуйте, %s!</h2>
                        <p>Вы запросили восстановление пароля для вашего аккаунта на платформе EdSpace.</p>
                        
                        <center><a href="%s" class="button">🔑 Установить новый пароль</a></center>
                        
                        <p>Или перейдите по ссылке:<br>
                        <a href="%s">%s</a></p>
                        
                        <div class="warning">
                            <strong>⚠️ Важно:</strong>
                            <ul>
                                <li>Ссылка действительна 24 часа</li>
                                <li>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо</li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2026 EdSpace. Это письмо отправлено автоматически.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
                userName, resetUrl, resetUrl, resetUrl
        );

        sendHtmlEmail(email, subject, htmlMessage);
        log.info("📧 Письмо для восстановления пароля отправлено на {}", email);
    }

    /**
     * Отправить HTML-письмо
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            log.info("📧 Попытка отправки письма на {}", to);
            log.info("   SMTP host: {}, port: {}, username: {}", host, port, username);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(username);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Письмо успешно отправлено на {}", to);
        } catch (MessagingException e) {
            log.error("❌ Ошибка отправки email на {}: {}", to, e.getMessage());
            throw new RuntimeException("Не удалось отправить email: " + e.getMessage(), e);
        }
    }
}