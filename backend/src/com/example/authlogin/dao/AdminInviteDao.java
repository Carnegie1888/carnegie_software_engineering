package com.example.authlogin.dao;

import com.example.authlogin.model.AdminInvite;
import com.example.authlogin.model.User;
import com.example.authlogin.util.SecurityTokenUtil;
import com.example.authlogin.util.StoragePaths;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * AdminInviteDao - 管理员邀请数据访问对象。
 */
public class AdminInviteDao {

    private static final String INVITE_DIR = StoragePaths.getInvitesDir();
    private static final String INVITE_FILE = INVITE_DIR + File.separator + "admin_invites.csv";
    private static final String CSV_HEADER =
            "inviteId,email,tokenHash,inviteCodeHash,role,createdByUserId,createdByUsername,createdAt,expiresAt,usedAt,status";

    private static AdminInviteDao instance;

    private AdminInviteDao() {
        initStorage();
    }

    public static synchronized AdminInviteDao getInstance() {
        if (instance == null) {
            instance = new AdminInviteDao();
        }
        return instance;
    }

    private void initStorage() {
        File directory = new File(INVITE_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        File file = new File(INVITE_FILE);
        if (!file.exists()) {
            try (FileWriter writer = new FileWriter(file)) {
                writer.write(CSV_HEADER);
                writer.write("\n");
            } catch (IOException e) {
                throw new RuntimeException("Failed to initialize admin invite storage", e);
            }
        }
    }

    public synchronized AdminInvite createInvite(String email,
                                                 String plainToken,
                                                 String plainInviteCode,
                                                 String createdByUserId,
                                                 String createdByUsername,
                                                 LocalDateTime expiresAt) {
        List<AdminInvite> invites = readAll();

        AdminInvite invite = new AdminInvite();
        invite.setEmail(normalizeEmail(email));
        invite.setTokenHash(SecurityTokenUtil.sha256Hex(plainToken));
        invite.setInviteCodeHash(SecurityTokenUtil.sha256Hex(plainInviteCode));
        invite.setRole(User.Role.ADMIN);
        invite.setCreatedByUserId(trimToEmpty(createdByUserId));
        invite.setCreatedByUsername(trimToEmpty(createdByUsername));
        invite.setCreatedAt(LocalDateTime.now());
        invite.setExpiresAt(expiresAt);
        invite.setStatus(AdminInvite.Status.PENDING);

        invites.add(invite);
        writeAll(invites);
        return invite;
    }

    public synchronized Optional<AdminInvite> findValidByToken(String plainToken) {
        if (plainToken == null || plainToken.trim().isEmpty()) {
            return Optional.empty();
        }
        String hashedToken = SecurityTokenUtil.sha256Hex(plainToken.trim());
        return findValidInvite(invite -> hashedToken.equals(invite.getTokenHash()));
    }

    public synchronized Optional<AdminInvite> findValidByEmailAndCode(String email, String plainInviteCode) {
        if (email == null || email.trim().isEmpty() || plainInviteCode == null || plainInviteCode.trim().isEmpty()) {
            return Optional.empty();
        }
        String normalizedEmail = normalizeEmail(email);
        String codeHash = SecurityTokenUtil.sha256Hex(plainInviteCode.trim().toUpperCase());
        return findValidInvite(invite ->
                normalizedEmail.equalsIgnoreCase(trimToEmpty(invite.getEmail()))
                        && codeHash.equals(invite.getInviteCodeHash()));
    }

    public synchronized void markInviteUsed(String inviteId) {
        List<AdminInvite> invites = readAll();
        boolean changed = false;
        for (AdminInvite invite : invites) {
            if (invite.getInviteId().equals(inviteId)) {
                invite.setStatus(AdminInvite.Status.USED);
                invite.setUsedAt(LocalDateTime.now());
                changed = true;
                break;
            }
        }
        if (changed) {
            writeAll(invites);
        }
    }

    private Optional<AdminInvite> findValidInvite(InviteMatcher matcher) {
        List<AdminInvite> invites = readAll();
        boolean changed = false;
        LocalDateTime now = LocalDateTime.now();
        AdminInvite matched = null;

        for (AdminInvite invite : invites) {
            if (invite.getStatus() == AdminInvite.Status.PENDING && invite.isExpired(now)) {
                invite.setStatus(AdminInvite.Status.EXPIRED);
                changed = true;
                continue;
            }
            if (invite.getStatus() != AdminInvite.Status.PENDING) {
                continue;
            }
            if (matcher.matches(invite)) {
                matched = invite;
                break;
            }
        }

        if (changed) {
            writeAll(invites);
        }
        return Optional.ofNullable(matched);
    }

    private List<AdminInvite> readAll() {
        initStorage();
        List<AdminInvite> invites = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(INVITE_FILE))) {
            String line;
            boolean firstLine = true;
            while ((line = reader.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    continue;
                }
                if (line.trim().isEmpty()) {
                    continue;
                }
                AdminInvite invite = AdminInvite.fromCsv(line);
                if (invite != null) {
                    invites.add(invite);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read admin invites", e);
        }
        return invites;
    }

    private void writeAll(List<AdminInvite> invites) {
        try (PrintWriter writer = new PrintWriter(new FileWriter(INVITE_FILE))) {
            writer.println(CSV_HEADER);
            for (AdminInvite invite : invites) {
                writer.println(invite.toCsv());
            }
            writer.flush();
        } catch (IOException e) {
            throw new RuntimeException("Failed to write admin invites", e);
        }
    }

    private String normalizeEmail(String email) {
        return trimToEmpty(email).toLowerCase();
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    @FunctionalInterface
    private interface InviteMatcher {
        boolean matches(AdminInvite invite);
    }
}
