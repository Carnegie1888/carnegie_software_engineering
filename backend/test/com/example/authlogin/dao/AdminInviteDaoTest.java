package com.example.authlogin.dao;

import com.example.authlogin.model.AdminInvite;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;

/**
 * AdminInviteDao Manual Test Runner
 */
public class AdminInviteDaoTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) throws IOException {
        Path tempDir = Files.createTempDirectory("admin-invite-dao-test");
        System.setProperty("ta.hiring.data.dir", tempDir.toString());

        AdminInviteDao inviteDao = AdminInviteDao.getInstance();

        String token = "token_demo_123";
        String inviteCode = "ABCD1234";

        test("Create invite and validate by token", () -> {
            AdminInvite invite = inviteDao.createInvite(
                    "invitee@example.com",
                    token,
                    inviteCode,
                    "admin-id-1",
                    "admin_demo",
                    LocalDateTime.now().plusHours(24)
            );
            assert invite.getInviteId() != null : "invite id should not be null";
            assert inviteDao.findValidByToken(token).isPresent() : "token should be valid";
        });

        test("Validate by email + invite code", () -> {
            assert inviteDao.findValidByEmailAndCode("invitee@example.com", inviteCode).isPresent()
                    : "invite code should be valid";
        });

        test("Mark invite as used should invalidate token", () -> {
            AdminInvite invite = inviteDao.findValidByToken(token)
                    .orElseThrow(() -> new AssertionError("invite should exist before consume"));
            inviteDao.markInviteUsed(invite.getInviteId());
            assert inviteDao.findValidByToken(token).isEmpty() : "used invite should no longer be valid";
        });

        test("Expired invite should not be valid", () -> {
            String expiredToken = "expired_token_456";
            inviteDao.createInvite(
                    "expired@example.com",
                    expiredToken,
                    "ZXCV5678",
                    "admin-id-1",
                    "admin_demo",
                    LocalDateTime.now().minusMinutes(5)
            );
            assert inviteDao.findValidByToken(expiredToken).isEmpty() : "expired invite should be invalid";
        });

        System.out.println("========================================");
        System.out.println("AdminInviteDaoTest Summary");
        System.out.println("========================================");
        System.out.println("Passed: " + passed);
        System.out.println("Failed: " + failed);
        System.out.println("Total:  " + (passed + failed));
        System.out.println("========================================");

        if (failed > 0) {
            System.exit(1);
        }
    }

    private static void test(String name, Runnable runnable) {
        try {
            runnable.run();
            passed++;
            System.out.println("[PASS] " + name);
        } catch (Throwable t) {
            failed++;
            System.out.println("[FAIL] " + name + " - " + t.getMessage());
        }
    }
}
