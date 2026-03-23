package com.example.authlogin.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * SecurityTokenUtil - 生成邀请令牌、邀请码并提供哈希工具。
 */
public final class SecurityTokenUtil {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final char[] INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    private SecurityTokenUtil() {
    }

    public static String generateInviteToken() {
        byte[] buffer = new byte[32];
        SECURE_RANDOM.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    public static String generateInviteCode() {
        StringBuilder code = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            int index = SECURE_RANDOM.nextInt(INVITE_CODE_CHARS.length);
            code.append(INVITE_CODE_CHARS[index]);
        }
        return code.toString();
    }

    public static String sha256Hex(String plainText) {
        if (plainText == null) {
            return "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(plainText.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                String value = Integer.toHexString(b & 0xff);
                if (value.length() == 1) {
                    hex.append('0');
                }
                hex.append(value);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm is not available", e);
        }
    }
}
