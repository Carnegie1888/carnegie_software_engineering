package com.example.tarecruitment.admin.service;

import com.example.tarecruitment.common.storage.StoragePaths;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;

/**
 * InviteCodeService - 基于时间窗口的邀请码生成与校验。
 *
 * 每 30s 产生一个新码（HMAC-SHA256 + 服务端密钥）。
 * 校验时接受当前窗口及前后各一个窗口，防止边界情况失效。
 * 管理员可主动刷新（rotationOffset++），旧码立即作废。
 */
public class InviteCodeService {

    private static final long WINDOW_MILLIS = 600_000L;
    private static final char[] CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final String SECRET_FILE = "invite_secret.bin";
    private static final String OFFSET_FILE = "rotation_offset.txt";
    private static final String FORCED_WINDOW_START_FILE = "forced_window_start.txt";

    private static InviteCodeService instance;

    private final byte[] secretBytes;
    private long rotationOffset;
    private long forcedWindowStartMillis;
    private final String invitesDir;

    private InviteCodeService() {
        invitesDir = StoragePaths.getInvitesDir();
        ensureDirExists();
        secretBytes = loadOrCreateSecret();
        rotationOffset = loadRotationOffset();
        forcedWindowStartMillis = loadForcedWindowStartMillis();
    }

    public static synchronized InviteCodeService getInstance() {
        if (instance == null) {
            instance = new InviteCodeService();
        }
        return instance;
    }

    public synchronized String getCurrentCode() {
        return computeCode(secretBytes, effectiveWindow());
    }

    public synchronized int getSecondsRemaining() {
        long now = System.currentTimeMillis();
        long windowStart = activeWindowStartMillis(now);
        long elapsed = Math.max(0L, now - windowStart);
        long remainingMillis = Math.max(0L, WINDOW_MILLIS - elapsed);
        return (int) Math.min(WINDOW_MILLIS / 1000, Math.ceil(remainingMillis / 1000.0));
    }

    public synchronized String forceRotate() {
        rotationOffset++;
        forcedWindowStartMillis = System.currentTimeMillis();
        saveRotationOffset();
        saveForcedWindowStartMillis();
        return computeCode(secretBytes, effectiveWindow());
    }

    public synchronized boolean isValidCode(String code) {
        if (code == null || code.trim().isEmpty()) return false;
        String normalized = code.replaceAll("\\s+", "").toUpperCase();
        long base = effectiveWindow();
        for (long delta = -1; delta <= 1; delta++) {
            if (computeCode(secretBytes, base + delta).equals(normalized)) {
                return true;
            }
        }
        return false;
    }

    private long effectiveWindow() {
        long now = System.currentTimeMillis();
        return activeWindowStartMillis(now) / WINDOW_MILLIS + rotationOffset;
    }

    private long activeWindowStartMillis(long now) {
        if (forcedWindowStartMillis > 0L && now - forcedWindowStartMillis < WINDOW_MILLIS) {
            return forcedWindowStartMillis;
        }
        return now - now % WINDOW_MILLIS;
    }

    private static String computeCode(byte[] secret, long timeWindow) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            ByteBuffer buffer = ByteBuffer.allocate(8);
            buffer.putLong(timeWindow);
            byte[] hash = mac.doFinal(buffer.array());
            StringBuilder code = new StringBuilder(8);
            for (int i = 0; i < 8; i++) {
                code.append(CODE_CHARS[(hash[i] & 0xff) % CODE_CHARS.length]);
            }
            return code.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute invite code", e);
        }
    }

    private byte[] loadOrCreateSecret() {
        Path secretPath = Paths.get(invitesDir, SECRET_FILE);
        if (Files.exists(secretPath)) {
            try {
                byte[] loaded = Files.readAllBytes(secretPath);
                if (loaded.length >= 16) return loaded;
            } catch (IOException ignored) {}
        }
        byte[] secret = new byte[32];
        new SecureRandom().nextBytes(secret);
        try {
            Files.write(secretPath, secret);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save invite secret", e);
        }
        return secret;
    }

    private long loadRotationOffset() {
        Path offsetPath = Paths.get(invitesDir, OFFSET_FILE);
        if (Files.exists(offsetPath)) {
            try {
                String text = new String(Files.readAllBytes(offsetPath)).trim();
                return Long.parseLong(text);
            } catch (Exception ignored) {}
        }
        return 0L;
    }

    private long loadForcedWindowStartMillis() {
        Path startPath = Paths.get(invitesDir, FORCED_WINDOW_START_FILE);
        if (Files.exists(startPath)) {
            try {
                String text = new String(Files.readAllBytes(startPath)).trim();
                return Long.parseLong(text);
            } catch (Exception ignored) {}
        }
        return 0L;
    }

    private void saveRotationOffset() {
        Path offsetPath = Paths.get(invitesDir, OFFSET_FILE);
        try {
            Files.write(offsetPath, String.valueOf(rotationOffset).getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Failed to save rotation offset", e);
        }
    }

    private void saveForcedWindowStartMillis() {
        Path startPath = Paths.get(invitesDir, FORCED_WINDOW_START_FILE);
        try {
            Files.write(startPath, String.valueOf(forcedWindowStartMillis).getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Failed to save forced invite window start", e);
        }
    }

    private void ensureDirExists() {
        new File(invitesDir).mkdirs();
    }
}
