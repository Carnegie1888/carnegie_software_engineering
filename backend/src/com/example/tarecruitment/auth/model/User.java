package com.example.tarecruitment.auth.model;

import com.example.tarecruitment.common.storage.CsvCodec;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * User实体类 - 用户
 * 支持三种角色: TA (助教申请人), MO (模块负责人), ADMIN (管理员)
 */
public class User {

    private String userId;
    private String username;
    private String password;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private String displayName;
    private String realName;
    private String professionalTitle;
    private String avatarPath;

    public enum Role {
        TA, MO, ADMIN
    }

    public User() {
        this.userId = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
    }

    public User(String username, String password, String email, Role role) {
        this();
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
    }

    // Getters and Setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getRealName() {
        return realName;
    }

    public void setRealName(String realName) {
        this.realName = realName;
    }

    public String getProfessionalTitle() {
        return professionalTitle;
    }

    public void setProfessionalTitle(String professionalTitle) {
        this.professionalTitle = professionalTitle;
    }

    public String getAvatarPath() {
        return avatarPath;
    }

    public void setAvatarPath(String avatarPath) {
        this.avatarPath = avatarPath;
    }

    /**
     * 转换为CSV格式存储
     */
    public String toCsv() {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        return String.join(",",
            escapeCsv(userId),
            escapeCsv(username),
            escapeCsv(password),
            escapeCsv(email),
            role.name(),
            createdAt != null ? createdAt.format(formatter) : "",
            lastLoginAt != null ? lastLoginAt.format(formatter) : "",
            escapeCsv(displayName),
            escapeCsv(realName),
            escapeCsv(professionalTitle),
            escapeCsv(avatarPath)
        );
    }

    /**
     * 从CSV格式解析
     */
    public static User fromCsv(String csvLine) {
        String[] parts = CsvCodec.split(csvLine);
        if (parts.length < 6) {
            return null;
        }

        User user = new User();
        user.setUserId(unescapeCsv(parts[0]));
        user.setUsername(unescapeCsv(parts[1]));
        user.setPassword(unescapeCsv(parts[2]));
        user.setEmail(unescapeCsv(parts[3]));
        user.setRole(Role.valueOf(parts[4].trim()));

        if (parts.length > 5 && !parts[5].isEmpty()) {
            user.setCreatedAt(LocalDateTime.parse(parts[5], DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        if (parts.length > 6 && !parts[6].isEmpty()) {
            user.setLastLoginAt(LocalDateTime.parse(parts[6], DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        if (parts.length > 7) {
            user.setDisplayName(unescapeCsv(parts[7]));
        }
        if (parts.length > 8) {
            user.setRealName(unescapeCsv(parts[8]));
        }
        if (parts.length > 9) {
            String ninthField = unescapeCsv(parts[9]);
            if (parts.length == 10 && looksLikeAvatarPath(ninthField)) {
                user.setAvatarPath(ninthField);
            } else {
                user.setProfessionalTitle(ninthField);
            }
        }
        if (parts.length > 10) {
            user.setAvatarPath(unescapeCsv(parts[10]));
        }

        return user;
    }

    private static boolean looksLikeAvatarPath(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        String lower = value.toLowerCase();
        return lower.startsWith("account-avatars/")
                || lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".png")
                || lower.endsWith(".webp");
    }

    private static String escapeCsv(String value) {
        return CsvCodec.escape(value);
    }

    private static String unescapeCsv(String value) {
        return CsvCodec.unescape(value);
    }

    @Override
    public String toString() {
        return "User{" +
                "userId='" + userId + '\'' +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", createdAt=" + createdAt +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return userId != null && userId.equals(user.userId);
    }

    @Override
    public int hashCode() {
        return userId != null ? userId.hashCode() : 0;
    }
}
