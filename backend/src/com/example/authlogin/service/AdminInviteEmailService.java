package com.example.authlogin.service;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * AdminInviteEmailService - 负责发送管理员邀请邮件。
 * 优先尝试系统 sendmail；不可用时回退为日志预览。
 */
public class AdminInviteEmailService {

    public SendResult sendInviteEmail(String recipientEmail,
                                      String inviteUrl,
                                      String inviteCode,
                                      LocalDateTime expiresAt) {
        MailConfig config = MailConfig.load();
        String textBody = buildTextBody(inviteUrl, inviteCode, expiresAt);

        if (!config.isSendmailReady()) {
            String reason = "Sendmail is not configured. Set TA_HIRING_MAIL_FROM and optionally TA_HIRING_SENDMAIL_PATH.";
            System.out.println("[AdminInviteEmailService] " + reason);
            System.out.println("[AdminInviteEmailService] Invite email preview to " + recipientEmail + ":\n" + textBody);
            return SendResult.fallback(reason, textBody);
        }

        try {
            Process process = new ProcessBuilder(config.sendmailPath, "-t", "-oi")
                    .redirectErrorStream(true)
                    .start();

            StringBuilder payload = new StringBuilder();
            payload.append("From: ").append(config.fromAddress).append("\n");
            payload.append("To: ").append(recipientEmail).append("\n");
            payload.append("Subject: TA Hiring Portal Admin Invitation\n");
            payload.append("Content-Type: text/plain; charset=UTF-8\n");
            payload.append("\n");
            payload.append(textBody);
            payload.append("\n");

            try (BufferedWriter writer = new BufferedWriter(
                    new OutputStreamWriter(process.getOutputStream(), StandardCharsets.UTF_8))) {
                writer.write(payload.toString());
                writer.flush();
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                String reason = "sendmail exited with code " + exitCode;
                System.err.println("[AdminInviteEmailService] " + reason);
                return SendResult.fallback(reason, textBody);
            }
            return SendResult.sent();
        } catch (Exception e) {
            String reason = "sendmail failed: " + e.getMessage();
            System.err.println("[AdminInviteEmailService] " + reason);
            System.err.println("[AdminInviteEmailService] Invite email preview to " + recipientEmail + ":\n" + textBody);
            return SendResult.fallback(reason, textBody);
        }
    }

    private String buildTextBody(String inviteUrl, String inviteCode, LocalDateTime expiresAt) {
        String expiryText = expiresAt != null
                ? expiresAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : "unknown";

        return "You have been invited to create an Admin account for TA Hiring Portal.\n\n"
                + "One-time invitation link:\n"
                + inviteUrl + "\n\n"
                + "Backup invite code:\n"
                + inviteCode + "\n\n"
                + "This invitation expires at: " + expiryText + "\n"
                + "If you were not expecting this invitation, please ignore this email.";
    }

    public static final class SendResult {
        private final boolean sent;
        private final boolean fallback;
        private final String detail;
        private final String previewBody;

        private SendResult(boolean sent, boolean fallback, String detail, String previewBody) {
            this.sent = sent;
            this.fallback = fallback;
            this.detail = detail;
            this.previewBody = previewBody;
        }

        public static SendResult sent() {
            return new SendResult(true, false, "Email sent", "");
        }

        public static SendResult fallback(String detail, String previewBody) {
            return new SendResult(false, true, detail, previewBody);
        }

        public boolean isSent() {
            return sent;
        }

        public boolean isFallback() {
            return fallback;
        }

        public String getDetail() {
            return detail;
        }

        public String getPreviewBody() {
            return previewBody;
        }
    }

    private static final class MailConfig {
        private static final String DEFAULT_SENDMAIL_PATH = "/usr/sbin/sendmail";

        private final String fromAddress;
        private final String sendmailPath;

        private MailConfig(String fromAddress, String sendmailPath) {
            this.fromAddress = fromAddress;
            this.sendmailPath = sendmailPath;
        }

        private static MailConfig load() {
            String from = readConfig("ta.hiring.mail.from", "TA_HIRING_MAIL_FROM");
            String path = readConfig("ta.hiring.sendmail.path", "TA_HIRING_SENDMAIL_PATH");
            if (isBlank(path)) {
                path = DEFAULT_SENDMAIL_PATH;
            }
            return new MailConfig(from, path);
        }

        private boolean isSendmailReady() {
            if (isBlank(fromAddress) || isBlank(sendmailPath)) {
                return false;
            }
            Path path = Path.of(sendmailPath);
            return Files.isRegularFile(path) && Files.isExecutable(path);
        }

        private static String readConfig(String propertyName, String envName) {
            String propertyValue = System.getProperty(propertyName);
            if (!isBlank(propertyValue)) {
                return propertyValue.trim();
            }
            String envValue = System.getenv(envName);
            if (!isBlank(envValue)) {
                return envValue.trim();
            }
            return "";
        }

        private static boolean isBlank(String value) {
            return value == null || value.trim().isEmpty();
        }
    }
}
