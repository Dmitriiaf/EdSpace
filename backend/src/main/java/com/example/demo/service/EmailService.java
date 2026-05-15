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
        String registerUrl = baseUrl + "/complete-registration?token=" + token.getToken();
        String dashboardUrl = baseUrl + "/dashboard";
        String subject = "🎓 " + tutorName + " приглашает вас в EdSpace";

        String htmlMessage = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #EEF2FF;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #EEF2FF 0%%, #F3F4F6 100%%); padding: 30px 0;">
                    <tr>
                        <td align="center">
                            <!-- Карточка -->
                            <table width="520" cellpadding="0" cellspacing="0" style="background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(79,70,229,0.15); max-width: 520px;">
                                
                                <!-- ШАПКА -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #4F46E5 0%%, #7C3AED 100%%); padding: 36px 28px; text-align: center;">
                                        <p style="margin: 0; font-size: 48px;">🎓</p>
                                        <h1 style="margin: 8px 0 0; font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">EdSpace</h1>
                                        <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.85);">Ваша персональная платформа для обучения</p>
                                    </td>
                                </tr>
                                
                                <!-- СОДЕРЖАНИЕ -->
                                <tr>
                                    <td style="padding: 28px 28px 20px;">
                                        <h2 style="margin: 0 0 12px; font-size: 20px; color: #1F2937;">Здравствуйте, %s! 👋</h2>
                                        <p style="margin: 0 0 20px; font-size: 15px; color: #4B5563; line-height: 1.6;">
                                            <strong style="color: #4F46E5;">%s</strong> приглашает вас присоединиться к платформе EdSpace.
                                        </p>
                                        
                                        <!-- Карточка с инфо -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="background: #F5F3FF; border-radius: 14px; border: 1px solid #DDD6FE; margin-bottom: 20px;">
                                            <tr>
                                                <td style="padding: 16px 20px;">
                                                    <table width="100%%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="padding: 6px 0; font-size: 14px; color: #6B7280; width: 100px;">👤 Ученик</td>
                                                            <td style="padding: 6px 0; font-size: 14px; color: #1F2937; font-weight: 600;">%s</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 6px 0; font-size: 14px; color: #6B7280;">👨‍🏫 Репетитор</td>
                                                            <td style="padding: 6px 0; font-size: 14px; color: #1F2937; font-weight: 600;">%s</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Возможности -->
                                        <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #1F2937;">🚀 Что вы сможете:</p>
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #374151;">📅 <strong>Расписание</strong> — все занятия в одном месте</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #374151;">📝 <strong>Домашние задания</strong> — получайте и сдавайте онлайн</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #374151;">📊 <strong>Успеваемость</strong> — отслеживайте свой прогресс</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #374151;">🎥 <strong>Видеозвонки</strong> — подключайтесь к урокам</td>
                                            </tr>
                                        </table>
                                        
                                        <!-- КНОПКА НОВЫЙ -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                                            <tr>
                                                <td style="font-size: 14px; font-weight: 600; color: #1F2937; padding-bottom: 8px;">🆕 Я новый пользователь:</td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%%, #7C3AED 100%%); color: #FFFFFF; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(79,70,229,0.35);">✅ Завершить регистрацию</a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- РАЗДЕЛИТЕЛЬ -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                                            <tr>
                                                <td style="border-top: 1px solid #E5E7EB; padding-top: 16px;"></td>
                                            </tr>
                                        </table>
                                        
                                        <!-- КНОПКА СУЩЕСТВУЮЩИЙ -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="font-size: 14px; font-weight: 600; color: #1F2937; padding-bottom: 8px;">✅ У меня уже есть аккаунт:</td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <a href="%s" style="display: inline-block; background: #FFFFFF; color: #4F46E5; padding: 14px 34px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; border: 2px solid #4F46E5;">📋 Перейти в личный кабинет</a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="text-align: center; margin: 20px 0 0; font-size: 13px; color: #9CA3AF;">⏰ Приглашение действительно 7 дней</p>
                                    </td>
                                </tr>
                                
                                <!-- ФУТЕР -->
                                <tr>
                                    <td style="background: #F9FAFB; padding: 16px 28px; text-align: center; border-top: 1px solid #E5E7EB;">
                                        <p style="margin: 4px 0; font-size: 12px; color: #9CA3AF;">© 2026 EdSpace. Письмо отправлено автоматически.</p>
                                        <p style="margin: 4px 0; font-size: 12px; color: #9CA3AF;">По вопросам: <a href="mailto:noreplay@ed-space.ru" style="color: #4F46E5; text-decoration: none;">noreplay@ed-space.ru</a></p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """,
                studentName,           // %s 1
                tutorName,             // %s 2
                studentName,           // %s 3
                tutorName,             // %s 4
                registerUrl,           // %s 5
                dashboardUrl           // %s 6
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
     * Отправить простое текстовое письмо
     */
    public void sendSimpleEmail(String to, String subject, String body) {
        try {
            log.info("📧 Отправка письма на {}: {}", to, subject);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(username);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
            log.info("✅ Письмо отправлено на {}", to);
        } catch (MessagingException e) {
            log.error("❌ Ошибка отправки на {}: {}", to, e.getMessage());
        }
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