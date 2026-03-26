package com.example.authlogin.servlet;

import com.example.authlogin.dao.AdminInviteDao;
import com.example.authlogin.model.AdminInvite;
import com.example.authlogin.model.User;
import com.example.authlogin.service.AdminInviteEmailService;
import com.example.authlogin.util.JsonResponseUtil;
import com.example.authlogin.util.SecurityTokenUtil;
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
 */
@WebServlet({"/api/admin/invite", "/api/admin/invite/validate"})
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
        if (!"/api/admin/invite".equals(servletPath)) {
            JsonResponseUtil.write(response, 404, false, "Endpoint not found", null);
            return;
        }

        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            JsonResponseUtil.write(response, 401, false, "Please login first", null);
            return;
        }
        if (currentUser.getRole() != User.Role.ADMIN) {
            JsonResponseUtil.write(response, 403, false, "Only ADMIN can create admin invitations", null);
            return;
        }

        String email = normalizeEmail(request.getParameter("email"));
        if (!isValidEmail(email)) {
            JsonResponseUtil.write(response, 400, false, "Please provide a valid email address", null);
            return;
        }

        int expireHours = parseExpireHours(request.getParameter("expireHours"));
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(expireHours);
        String inviteToken = SecurityTokenUtil.generateInviteToken();
        String inviteCode = SecurityTokenUtil.generateInviteCode();

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

        Map<String, Object> data = JsonResponseUtil.objectMap(
                "inviteId", invite.getInviteId(),
                "email", invite.getEmail(),
                "inviteCode", inviteCode,
                "inviteUrl", inviteUrl,
                "expiresAt", expiresAt.toString(),
                "emailDelivery", sendResult.isSent() ? "sent" : "fallback",
                "deliveryDetail", sendResult.getDetail(),
                "previewBody", sendResult.getPreviewBody()
        );
        JsonResponseUtil.write(response, 201, true, "Admin invitation created", data);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json;charset=UTF-8");

        String servletPath = request.getServletPath();
        if (!"/api/admin/invite/validate".equals(servletPath)) {
            JsonResponseUtil.write(response, 404, false, "Endpoint not found", null);
            return;
        }

        String token = trimToEmpty(request.getParameter("token"));
        String email = normalizeEmail(request.getParameter("email"));
        String inviteCode = trimToEmpty(request.getParameter("inviteCode")).toUpperCase();

        if (token.isEmpty() && (email.isEmpty() || inviteCode.isEmpty())) {
            JsonResponseUtil.write(response, 400, false, "Provide token or email with invite code", null);
            return;
        }

        java.util.Optional<AdminInvite> inviteOpt;
        if (!token.isEmpty()) {
            inviteOpt = inviteDao.findValidByToken(token);
        } else {
            inviteOpt = inviteDao.findValidByEmailAndCode(email, inviteCode);
        }

        if (inviteOpt.isEmpty()) {
            JsonResponseUtil.write(response, 404, false, "Invitation is invalid, used, or expired", null);
            return;
        }

        AdminInvite invite = inviteOpt.get();
        JsonResponseUtil.write(response, 200, true, "Invitation is valid",
                JsonResponseUtil.objectMap(
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
