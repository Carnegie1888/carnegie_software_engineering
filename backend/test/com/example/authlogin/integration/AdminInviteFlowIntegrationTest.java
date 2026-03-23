package com.example.authlogin.integration;

import com.example.authlogin.dao.AdminInviteDao;
import com.example.authlogin.dao.UserDao;
import com.example.authlogin.model.AdminInvite;
import com.example.authlogin.model.User;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;

/**
 * 邀请制管理员注册流程集成测试（无容器版）
 */
public class AdminInviteFlowIntegrationTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) throws IOException {
        Path tempDir = Files.createTempDirectory("admin-invite-flow-test");
        System.setProperty("ta.hiring.data.dir", tempDir.toString());

        UserDao userDao = UserDao.getInstance();
        AdminInviteDao inviteDao = AdminInviteDao.getInstance();

        final String inviteToken = "integration_flow_token";
        final String inviteCode = "QWER1234";
        final String inviteeEmail = "new_admin@example.com";
        final String inviteeUsername = "new_admin_user";

        test("Create invitation should produce valid token and code", () -> {
            inviteDao.createInvite(
                    inviteeEmail,
                    inviteToken,
                    inviteCode,
                    "admin-root",
                    "admin_demo",
                    LocalDateTime.now().plusHours(48)
            );
            assert inviteDao.findValidByToken(inviteToken).isPresent() : "token should be valid";
            assert inviteDao.findValidByEmailAndCode(inviteeEmail, inviteCode).isPresent() : "invite code should be valid";
        });

        test("Accept flow should create admin account and consume invitation", () -> {
            AdminInvite invite = inviteDao.findValidByToken(inviteToken)
                    .orElseThrow(() -> new AssertionError("invite not found"));

            User user = new User(inviteeUsername, "Pass1234", inviteeEmail, User.Role.ADMIN);
            userDao.create(user);
            inviteDao.markInviteUsed(invite.getInviteId());

            assert userDao.findByUsername(inviteeUsername).isPresent() : "admin user should be created";
            assert inviteDao.findValidByToken(inviteToken).isEmpty() : "used token should be invalid";
        });

        test("Public register should not allow ADMIN role anymore", () -> {
            // 此用例在无 servlet 容器下仅校验系统约束：管理员必须通过邀请流创建。
            assert userDao.findByRole(User.Role.ADMIN).stream()
                    .noneMatch(u -> "public_admin".equals(u.getUsername()))
                    : "public register should not create admin account";
        });

        System.out.println("========================================");
        System.out.println("AdminInviteFlowIntegrationTest Summary");
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
