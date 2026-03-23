package com.example.authlogin.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * AdminInvite - 管理员邀请记录模型。
 */
public class AdminInvite {

    public enum Status {
        PENDING,
        USED,
        EXPIRED
    }

    private String inviteId;
    private String email;
    private String tokenHash;
    private String inviteCodeHash;
    private User.Role role;
    private String createdByUserId;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime usedAt;
    private Status status;

    public AdminInvite() {
        this.inviteId = UUID.randomUUID().toString();
        this.role = User.Role.ADMIN;
        this.createdAt = LocalDateTime.now();
        this.status = Status.PENDING;
    }

    public String getInviteId() {
        return inviteId;
    }

    public void setInviteId(String inviteId) {
        this.inviteId = inviteId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public String getInviteCodeHash() {
        return inviteCodeHash;
    }

    public void setInviteCodeHash(String inviteCodeHash) {
        this.inviteCodeHash = inviteCodeHash;
    }

    public User.Role getRole() {
        return role;
    }

    public void setRole(User.Role role) {
        this.role = role;
    }

    public String getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(String createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public String getCreatedByUsername() {
        return createdByUsername;
    }

    public void setCreatedByUsername(String createdByUsername) {
        this.createdByUsername = createdByUsername;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public boolean isExpired(LocalDateTime now) {
        if (expiresAt == null) {
            return false;
        }
        return now != null && now.isAfter(expiresAt);
    }

    public String toCsv() {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        return String.join(",",
                escapeCsv(inviteId),
                escapeCsv(email),
                escapeCsv(tokenHash),
                escapeCsv(inviteCodeHash),
                role != null ? role.name() : User.Role.ADMIN.name(),
                escapeCsv(createdByUserId),
                escapeCsv(createdByUsername),
                createdAt != null ? createdAt.format(formatter) : "",
                expiresAt != null ? expiresAt.format(formatter) : "",
                usedAt != null ? usedAt.format(formatter) : "",
                status != null ? status.name() : Status.PENDING.name()
        );
    }

    public static AdminInvite fromCsv(String csvLine) {
        String[] parts = csvLine.split(",(?=([^\\\"]*\\\"[^\\\"]*\\\")*[^\\\"]*$)", -1);
        if (parts.length < 11) {
            return null;
        }

        AdminInvite invite = new AdminInvite();
        invite.setInviteId(unescapeCsv(parts[0]));
        invite.setEmail(unescapeCsv(parts[1]));
        invite.setTokenHash(unescapeCsv(parts[2]));
        invite.setInviteCodeHash(unescapeCsv(parts[3]));
        try {
            invite.setRole(User.Role.valueOf(parts[4].trim()));
        } catch (IllegalArgumentException ignored) {
            invite.setRole(User.Role.ADMIN);
        }
        invite.setCreatedByUserId(unescapeCsv(parts[5]));
        invite.setCreatedByUsername(unescapeCsv(parts[6]));
        if (!parts[7].isEmpty()) {
            invite.setCreatedAt(LocalDateTime.parse(parts[7], DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        if (!parts[8].isEmpty()) {
            invite.setExpiresAt(LocalDateTime.parse(parts[8], DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        if (!parts[9].isEmpty()) {
            invite.setUsedAt(LocalDateTime.parse(parts[9], DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        try {
            invite.setStatus(Status.valueOf(parts[10].trim()));
        } catch (IllegalArgumentException ignored) {
            invite.setStatus(Status.PENDING);
        }
        return invite;
    }

    private static String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private static String unescapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.startsWith("\"") && value.endsWith("\"")) {
            value = value.substring(1, value.length() - 1);
            return value.replace("\"\"", "\"");
        }
        return value;
    }
}
