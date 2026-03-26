package com.example.authlogin.servlet;

import com.example.authlogin.dao.AdminInviteDao;
import com.example.authlogin.dao.UserDao;
import com.example.authlogin.model.AdminInvite;
import com.example.authlogin.model.User;
import com.example.authlogin.util.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * AdminInviteAcceptServlet - 邀请接受接口（创建管理员账号）。
 */
@WebServlet("/api/admin/invite/accept")
public class AdminInviteAcceptServlet extends HttpServlet {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[A-Za-z][A-Za-z0-9_]{2,19}$");
    private static final int USERNAME_MAX_LENGTH = 20;
    private static final int EMAIL_MAX_LENGTH = 100;
    private static final int PASSWORD_MIN_LENGTH = 6;
    private static final int PASSWORD_MAX_LENGTH = 100;

    private AdminInviteDao inviteDao;
    private UserDao userDao;

    @Override
    public void init() throws ServletException {
        inviteDao = AdminInviteDao.getInstance();
        userDao = UserDao.getInstance();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonResponseUtil.write(response, 200, true, "Use POST to accept invitation", null);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json;charset=UTF-8");

        String username = trimToEmpty(request.getParameter("username"));
        String email = normalizeEmail(request.getParameter("email"));
        String password = trimToEmpty(request.getParameter("password"));
        String confirmPassword = trimToEmpty(request.getParameter("confirmPassword"));
        String token = trimToEmpty(request.getParameter("token"));
        String inviteCode = trimToEmpty(request.getParameter("inviteCode")).toUpperCase();

        String validationError = validateInput(username, email, password, confirmPassword, token, inviteCode);
        if (validationError != null) {
            JsonResponseUtil.write(response, 400, false, validationError, null);
            return;
        }

        Optional<AdminInvite> inviteOpt = !token.isEmpty()
                ? inviteDao.findValidByToken(token)
                : inviteDao.findValidByEmailAndCode(email, inviteCode);

        if (inviteOpt.isEmpty()) {
            JsonResponseUtil.write(response, 404, false, "Invitation is invalid, used, or expired", null);
            return;
        }

        AdminInvite invite = inviteOpt.get();
        if (!email.equalsIgnoreCase(trimToEmpty(invite.getEmail()))) {
            JsonResponseUtil.write(response, 403, false, "Email does not match invitation", null);
            return;
        }

        try {
            User user = new User(username, password, email, User.Role.ADMIN);
            User saved = userDao.create(user);
            inviteDao.markInviteUsed(invite.getInviteId());

            JsonResponseUtil.write(response, 201, true, "Admin account created successfully",
                    JsonResponseUtil.objectMap(
                            "userId", saved.getUserId(),
                            "username", saved.getUsername(),
                            "role", saved.getRole().name(),
                            "redirect", request.getContextPath() + "/login.jsp"
                    ));
        } catch (IllegalArgumentException e) {
            JsonResponseUtil.write(response, 409, false, e.getMessage(), null);
        } catch (Exception e) {
            JsonResponseUtil.write(response, 500, false, "Failed to create admin account", null);
        }
    }

    private String validateInput(String username,
                                 String email,
                                 String password,
                                 String confirmPassword,
                                 String token,
                                 String inviteCode) {
        if (username.isEmpty()) {
            return "Username is required";
        }
        if (username.length() > USERNAME_MAX_LENGTH) {
            return "Username is too long";
        }
        if (hasControlChars(username) || containsDangerousMarkup(username)) {
            return "Username contains unsupported characters";
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            return "Username must be 3-20 characters, start with a letter, and contain only letters, numbers, and underscores";
        }

        if (email.isEmpty()) {
            return "Email is required";
        }
        if (email.length() > EMAIL_MAX_LENGTH) {
            return "Email is too long";
        }
        if (hasControlChars(email) || containsDangerousMarkup(email) || !EMAIL_PATTERN.matcher(email).matches()) {
            return "Invalid email format";
        }

        if (password.isEmpty()) {
            return "Password is required";
        }
        if (password.length() < PASSWORD_MIN_LENGTH) {
            return "Password must be at least 6 characters";
        }
        if (password.length() > PASSWORD_MAX_LENGTH) {
            return "Password is too long";
        }
        if (hasControlChars(password)) {
            return "Password contains unsupported characters";
        }
        if (!password.equals(confirmPassword)) {
            return "Passwords do not match";
        }

        if (token.isEmpty() && inviteCode.isEmpty()) {
            return "Invitation token or invite code is required";
        }
        return null;
    }

    private String normalizeEmail(String value) {
        return trimToEmpty(value).toLowerCase();
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean hasControlChars(String value) {
        return value.matches(".*[\\x00-\\x1F\\x7F].*");
    }

    private boolean containsDangerousMarkup(String value) {
        String text = value.toLowerCase();
        return text.matches(".*<[^>]*>.*")
                || text.contains("javascript:")
                || text.matches(".*on\\w+\\s*=.*");
    }
}
