package com.example.tarecruitment.admin.web;

import com.example.tarecruitment.admin.dao.AdminInviteDao;
import com.example.tarecruitment.admin.model.AdminInvite;
import com.example.tarecruitment.auth.model.User;
import com.example.tarecruitment.admin.service.AdminInviteEmailService;
import com.example.tarecruitment.common.api.ApiRoutes;
import com.example.tarecruitment.common.web.ApiResponses;
import com.example.tarecruitment.common.util.SecurityTokenUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * AdminInviteServlet - 管理员邀请创建与邀请校验接口。
 *
 * 路径：
 * - POST /api/admin/invitations：旧邮件邀请创建接口，需要 ADMIN。
 * - GET  /api/admin/invitations/validate：旧邀请链接/验证码校验接口。
 *
 * 遗留/待移除：当前管理员可见页面使用 AdminCurrentInviteCodeServlet 显示短邀请码，
 * admin-register.jsp 也只要求短邀请码注册；本 Servlet 的邮件/token 链路没有页面入口。
 * 保留原因是兼容已有 admin_invites.csv 和历史演示接口。后续确认前端、测试、文档都不再引用后可删。
 */
@WebServlet({ApiRoutes.ADMIN_INVITATIONS, ApiRoutes.ADMIN_INVITATION_VALIDATION})
public class AdminInviteServlet extends HttpServlet {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );
    private static final int DEFAULT_EXPIRE_HOURS = 48;
    private static final int MAX_EXPIRE_HOURS = 168;
    private static final int MIN_EXPIRE_HOURS = 1;

    private AdminInviteDao inviteDao;
    private AdminInviteEmailService emailService;

    @Override
    public void init() throws ServletException {
        inviteDao = AdminInviteDao.getInstance();
        emailService = new AdminInviteEmailService();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json;charset=UTF-8");

        String servletPath = request.getServletPath();
        if (!ApiRoutes.ADMIN_INVITATIONS.equals(servletPath)) {
            ApiResponses.write(response, 404, false, "Endpoint not found", null);
            return;
        }

        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            ApiResponses.write(response, 401, false, "Please login first", null);
            return;
        }
        if (currentUser.getRole() != User.Role.ADMIN) {
            ApiResponses.write(response, 403, false, "Only ADMIN can create admin invitations", null);
            return;
        }

        String email = normalizeEmail(request.getParameter("email"));
        if (!isValidEmail(email)) {
            ApiResponses.write(response, 400, false, "Please provide a valid email address", null);
            return;
        }

        int expireHours = parseExpireHours(request.getParameter("expireHours"));
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(expireHours);
        String inviteToken = SecurityTokenUtil.generateInviteToken();
        String inviteCode = SecurityTokenUtil.generateInviteCode();

        // 明文 token/code 只在本次响应和邮件正文中出现，CSV 里保存 hash。
        AdminInvite invite = inviteDao.createInvite(
                email,
                inviteToken,
                inviteCode,
                currentUser.getUserId(),
                currentUser.getUsername(),
                expiresAt
        );

        String inviteUrl = buildInviteUrl(request, inviteToken);
        AdminInviteEmailService.SendResult sendResult =
                emailService.sendInviteEmail(email, inviteUrl, inviteCode, expiresAt);

        Map<String, Object> data = ApiResponses.objectMap(
                "inviteId", invite.getInviteId(),
                "email", invite.getEmail(),
                "inviteCode", inviteCode,
                "inviteUrl", inviteUrl,
                "expiresAt", expiresAt.toString(),
                "emailDelivery", sendResult.isSent() ? "sent" : "fallback",
                "deliveryDetail", sendResult.getDetail(),
                "previewBody", sendResult.getPreviewBody()
        );
        ApiResponses.write(response, 201, true, "Admin invitation created", data);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json;charset=UTF-8");

        String servletPath = request.getServletPath();
        if (!ApiRoutes.ADMIN_INVITATION_VALIDATION.equals(servletPath)) {
            ApiResponses.write(response, 404, false, "Endpoint not found", null);
            return;
        }

        String token = trimToEmpty(request.getParameter("token"));
        String email = normalizeEmail(request.getParameter("email"));
        String inviteCode = trimToEmpty(request.getParameter("inviteCode")).toUpperCase();

        if (token.isEmpty() && (email.isEmpty() || inviteCode.isEmpty())) {
            ApiResponses.write(response, 400, false, "Provide token or email with invite code", null);
            return;
        }

        java.util.Optional<AdminInvite> inviteOpt;
        if (!token.isEmpty()) {
            // 遗留/待移除：旧邮件链接从 admin-invite.jsp?token=... 进入。
            inviteOpt = inviteDao.findValidByToken(token);
        } else {
            inviteOpt = inviteDao.findValidByEmailAndCode(email, inviteCode);
        }

        if (inviteOpt.isEmpty()) {
            ApiResponses.write(response, 404, false, "Invitation is invalid, used, or expired", null);
            return;
        }

        AdminInvite invite = inviteOpt.get();
        ApiResponses.write(response, 200, true, "Invitation is valid",
                ApiResponses.objectMap(
                        "inviteId", invite.getInviteId(),
                        "email", invite.getEmail(),
                        "expiresAt", invite.getExpiresAt() != null ? invite.getExpiresAt().toString() : ""
                ));
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return (User) session.getAttribute("user");
    }

    private String buildInviteUrl(HttpServletRequest request, String token) {
        StringBuilder url = new StringBuilder();
        // 用当前请求拼绝对地址，保证部署在 /groupproject 这类 context path 下时链接仍正确。
        url.append(request.getScheme())
                .append("://")
                .append(request.getServerName());
        int port = request.getServerPort();
        if (!(("http".equalsIgnoreCase(request.getScheme()) && port == 80)
                || ("https".equalsIgnoreCase(request.getScheme()) && port == 443))) {
            url.append(":").append(port);
        }
        url.append(request.getContextPath())
                .append("/admin-invite.jsp?token=")
                .append(URLEncoder.encode(token, StandardCharsets.UTF_8));
        return url.toString();
    }

    private String normalizeEmail(String value) {
        return trimToEmpty(value).toLowerCase();
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isValidEmail(String email) {
        return !email.isEmpty() && EMAIL_PATTERN.matcher(email).matches();
    }

    private int parseExpireHours(String value) {
        String text = trimToEmpty(value);
        if (text.isEmpty()) {
            return DEFAULT_EXPIRE_HOURS;
        }
        try {
            int parsed = Integer.parseInt(text);
            if (parsed < MIN_EXPIRE_HOURS) {
                return MIN_EXPIRE_HOURS;
            }
            if (parsed > MAX_EXPIRE_HOURS) {
                return MAX_EXPIRE_HOURS;
            }
            return parsed;
        } catch (NumberFormatException ignored) {
            return DEFAULT_EXPIRE_HOURS;
        }
    }
}
