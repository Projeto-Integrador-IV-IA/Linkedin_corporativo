package br.com.linkedincorporativo.project;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetMailService {
    private final JavaMailSender mailSender;
    private final String publicUrl;
    private final String from;

    public PasswordResetMailService(
        JavaMailSender mailSender,
        @Value("${security.password-reset.public-url}") String publicUrl,
        @Value("${security.password-reset.from}") String from
    ) {
        this.mailSender = mailSender;
        this.publicUrl = publicUrl.replaceAll("/+$", "");
        this.from = from;
    }

    public void send(String recipient, String token, int expirationMinutes) {
        String resetUrl = publicUrl + "/reset-password?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(recipient);
            helper.setSubject("Redefina sua senha da Synapse");
            helper.setText(html(resetUrl, expirationMinutes), true);
            mailSender.send(message);
        } catch (MessagingException exception) {
            throw new IllegalStateException("Não foi possível preparar o e-mail de recuperação.", exception);
        } catch (RuntimeException exception) {
            throw new IllegalStateException("Não foi possível enviar o e-mail de recuperação.", exception);
        }
    }

    private static String html(String resetUrl, int expirationMinutes) {
        return """
            <!doctype html><html lang=\"pt-BR\"><body style=\"margin:0;background:#f5f6f2;color:#19372c;font-family:Arial,sans-serif\">
            <main style=\"max-width:560px;margin:32px auto;background:#fff;padding:42px;border-radius:16px\">
            <p style=\"font-size:12px;letter-spacing:2px;color:#668150\">SYNAPSE</p>
            <h1 style=\"font-size:28px;line-height:1.2\">Redefina sua senha.</h1>
            <p style=\"color:#63716b;line-height:1.7\">Recebemos um pedido para redefinir a senha da sua conta. Use o botão abaixo para criar uma nova senha.</p>
            <p style=\"margin:30px 0\"><a href=\"%s\" style=\"display:inline-block;background:#226351;color:#fff;padding:15px 20px;border-radius:8px;text-decoration:none;font-weight:bold\">Criar nova senha</a></p>
            <p style=\"color:#63716b;font-size:13px;line-height:1.7\">Este link expira em %d minutos e só pode ser usado uma vez. Se você não solicitou a alteração, ignore este e-mail.</p>
            </main></body></html>
            """.formatted(resetUrl, expirationMinutes);
    }
}
