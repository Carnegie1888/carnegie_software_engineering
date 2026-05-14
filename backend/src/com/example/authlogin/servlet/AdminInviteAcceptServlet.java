package com.example.authlogin.servlet;

import com.example.authlogin.dao.UserDao;
import com.example.authlogin.model.User;
import com.example.authlogin.service.InviteCodeService;
import com.example.authlogin.util.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.regex.Pattern;

/**
 * AdminInviteAcceptServlet - 接受邀请码，创建管理员账号。
 *
 * 邀请码由 InviteCodeService 生成的时间窗口码校验；
 * 不再依赖 CSV 存储的邀请记录。
 */
@WebServlet("/api/admin/invite/accept")
public class AdminInviteAcceptServlet extends HttpServlet {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[A-Za-z][A-Za-z0-9_]{2,19}$");
    private static final int USERNAME_MAX_LENGTH = 20;
    private static final int EMAIL_MAX_LENGTH = 100;
    private static final int PASSWORD_MIN_LENGTH = 8;
    private static final int PASSWORD_MAX_LENGTH = 100;

    private InviteCodeService inviteCodeService;
    private UserDao userDao;

    @Override
    public void init() throws ServletException {
        inviteCodeService = InviteCodeService.getInstance();
        userDao = UserDao.getInstance();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonResponseUtil.write(response, 200, true, "Use POST to accept invitation", null);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json;charset=UTF-8");

        String username = trimToEmpty(request.getParameter("username")).toLowerCase();
        String email = normalizeEmail(request.getParameter("email"));
        String password = emptyIfNull(request.getParameter("password"));         // no trim
        String confirmPassword = emptyIfNull(request.getParameter("confirmPassword")); // no trim
        String inviteCode = trimToEmpty(request.getParameter("inviteCode")).toUpperCase();

        String validationError = validateInput(username, email, password, confirmPassword, inviteCode);
        if (validationError != null) {
            JsonResponseUtil.write(response, 400, false, validationError, null);
            return;
        }

        if (!inviteCodeService.isValidCode(inviteCode)) {
            JsonResponseUtil.write(response, 403, false, "Invite code is invalid or expired", null);
            return;
        }

        try {
            User user = new User(username, password, email, User.Role.ADMIN);
            User saved = userDao.create(user);

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

    private String validateInput(String username, String email,
                                 String password, String confirmPassword,
                                 String inviteCode) {
        if (username.isEmpty()) return "Username is required";
        if (username.length() > USERNAME_MAX_LENGTH) return "Username is too long";
        if (hasControlChars(username) || containsDangerousMarkup(username))
            return "Username contains unsupported characters";
        if (!USERNAME_PATTERN.matcher(username).matches())
            return "Username must be 3-20 characters, start with a letter, and contain only letters, numbers, and underscores";
        if (username.contains("__")) return "Username cannot contain consecutive underscores";
        if (username.charAt(username.length() - 1) == '_') return "Username cannot end with an underscore";

        if (email.isEmpty()) return "Email is required";
        if (email.length() > EMAIL_MAX_LENGTH) return "Email is too long";
        if (hasControlChars(email) || containsDangerousMarkup(email) || !EMAIL_PATTERN.matcher(email).matches())
            return "Invalid email format";

        if (password.isEmpty()) return "Password is required";
        if (password.length() < PASSWORD_MIN_LENGTH) return "Password must be at least 8 characters";
        if (password.length() > PASSWORD_MAX_LENGTH) return "Password is too long";
        if (hasControlChars(password)) return "Password contains unsupported characters";
        if (!password.matches(".*[A-Za-z].*") || !password.matches(".*[0-9].*"))
            return "Password must contain at least one letter and one number";
        if (!password.equals(confirmPassword)) return "Passwords do not match";

        if (inviteCode.isEmpty()) return "Invite code is required";

        return null;
    }

    private String normalizeEmail(String value) {
        return trimToEmpty(value).toLowerCase();
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private String emptyIfNull(String value) {
        return value == null ? "" : value;
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
