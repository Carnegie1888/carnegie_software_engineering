package com.example.authlogin;

import com.example.authlogin.dao.UserDao;
import com.example.authlogin.model.User;
import com.example.authlogin.util.JsonResponseUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.regex.Pattern;

/**
 * RegisterServlet - 处理用户注册
 * 访问路径: /register
 *
 * 优化内容:
 * - 添加日志记录
 * - 增强输入验证
 * - 统一JSON响应格式
 * - 添加异常处理
 */
@WebServlet("/register")
public class RegisterServlet extends HttpServlet {

    private UserDao userDao;

    // 邮箱验证正则
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    // 用户名验证正则 (字母开头，允许字母数字下划线，3-20字符)
    private static final Pattern USERNAME_PATTERN = Pattern.compile(
        "^[a-zA-Z][a-zA-Z0-9_]{2,19}$"
    );
    private static final int USERNAME_MAX_LENGTH = 20;
    private static final int EMAIL_MAX_LENGTH = 100;
    private static final int PASSWORD_MIN_LENGTH = 6;
    private static final int PASSWORD_MAX_LENGTH = 100;

    // 简单的日志方法
    private void logInfo(String message) {
        System.out.println("[RegisterServlet] " + message);
    }

    private void logError(String message, Throwable t) {
        System.err.println("[RegisterServlet ERROR] " + message);
        if (t != null) {
            t.printStackTrace(System.err);
        }
    }

    @Override
    public void init() throws ServletException {
        userDao = UserDao.getInstance();
        logInfo("RegisterServlet initialized");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        JsonResponseUtil.writeJsonResponse(response, 200, true, "Use POST to register", null);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");

        try {
            String username = request.getParameter("username");
            String password = request.getParameter("password");
            String confirmPassword = request.getParameter("confirmPassword");
            String email = request.getParameter("email");
            String roleStr = request.getParameter("role");

            // 输入验证
            String error = validateInput(username, password, confirmPassword, email, roleStr);
            if (error != null) {
                logInfo("Validation failed: " + error);
                JsonResponseUtil.writeJsonResponse(response, 400, false, error, null);
                return;
            }

            // 去除输入首尾空格
            username = username.trim();
            password = password.trim();
            email = email.trim();
            roleStr = roleStr.trim();

            // 解析角色（公开注册仅允许 TA / MO）
            User.Role role;
            try {
                role = parsePublicRole(roleStr);
            } catch (IllegalArgumentException e) {
                logInfo("Invalid role: " + roleStr);
                JsonResponseUtil.writeJsonResponse(response, 400, false, e.getMessage(), null);
                return;
            }

            // 创建用户
            logInfo("Attempting to create user: " + username);
            User user = new User(username, password, email, role);
            User savedUser = userDao.create(user);

            logInfo("User registered successfully: " + username + ", role: " + role);

            // 注册成功
            JsonResponseUtil.writeJsonResponse(
                    response,
                    201,
                    true,
                    "Registration successful!",
                    JsonResponseUtil.objectMap(
                            "userId", savedUser.getUserId(),
                            "username", savedUser.getUsername()
                    )
            );

        } catch (IllegalArgumentException e) {
            // 用户名或邮箱已存在
            logInfo("Registration failed: " + e.getMessage());
            JsonResponseUtil.writeJsonResponse(response, 409, false, e.getMessage(), null);
        } catch (Exception e) {
            logError("Unexpected error during registration", e);
            JsonResponseUtil.writeJsonResponse(response, 500, false, "An error occurred during registration. Please try again later.", null);
        }
    }

    /**
     * 验证输入
     * @return 错误信息，如果验证通过返回null
     */
    private String validateInput(String username, String password,
                                  String confirmPassword, String email, String role) {
        String usernameText = username != null ? username.trim() : "";
        String emailText = email != null ? email.trim() : "";
        String passwordText = password != null ? password.trim() : "";
        String confirmPasswordText = confirmPassword != null ? confirmPassword.trim() : "";
        String roleText = role != null ? role.trim().toUpperCase() : "";

        // 验证用户名
        if (usernameText.isEmpty()) {
            return "Username is required";
        }
        if (usernameText.length() > USERNAME_MAX_LENGTH) {
            return "Username is too long";
        }
        if (hasControlChars(username) || containsDangerousMarkup(username)) {
            return "Username contains unsupported characters";
        }
        if (!USERNAME_PATTERN.matcher(usernameText).matches()) {
            return "Username must be 3-20 characters, start with a letter, and contain only letters, numbers, and underscores";
        }

        // 验证密码
        if (passwordText.isEmpty()) {
            return "Password is required";
        }
        if (passwordText.length() < PASSWORD_MIN_LENGTH) {
            return "Password must be at least 6 characters";
        }
        if (passwordText.length() > PASSWORD_MAX_LENGTH) {
            return "Password is too long";
        }
        if (hasControlChars(password)) {
            return "Password contains unsupported characters";
        }

        // 验证确认密码
        if (confirmPasswordText.isEmpty()) {
            return "Please confirm your password";
        }
        if (!passwordText.equals(confirmPasswordText)) {
            return "Passwords do not match";
        }

        // 验证邮箱
        if (emailText.isEmpty()) {
            return "Email is required";
        }
        if (emailText.length() > EMAIL_MAX_LENGTH) {
            return "Email is too long";
        }
        if (hasControlChars(email) || containsDangerousMarkup(email)) {
            return "Email contains unsupported characters";
        }
        if (!isValidEmailAddress(emailText)) {
            return "Invalid email format";
        }

        // 验证角色
        if (roleText.isEmpty()) {
            return "Please select a role";
        }
        if ("ADMIN".equals(roleText)) {
            return "Admin registration is invitation-only";
        }
        if (!isSupportedPublicRole(roleText)) {
            return "Invalid role selected";
        }

        return null;
    }

    private boolean isValidEmailAddress(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            return false;
        }

        String[] parts = email.split("@", -1);
        if (parts.length != 2) {
            return false;
        }

        String local = parts[0];
        String domain = parts[1];
        if (local.isEmpty() || domain.isEmpty()) {
            return false;
        }

        if (local.startsWith(".") || local.endsWith(".") || local.contains("..")) {
            return false;
        }
        if (domain.startsWith(".") || domain.endsWith(".") || domain.contains("..")) {
            return false;
        }

        return true;
    }

    private boolean hasControlChars(String value) {
        return value != null && value.matches(".*[\\x00-\\x1F\\x7F].*");
    }

    private boolean containsDangerousMarkup(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        String text = value.toLowerCase();
        return text.matches(".*<[^>]*>.*")
            || text.contains("javascript:")
            || text.matches(".*on\\w+\\s*=.*");
    }

    private boolean isSupportedPublicRole(String role) {
        return "TA".equals(role) || "MO".equals(role);
    }

    private User.Role parsePublicRole(String roleText) {
        if (roleText == null) {
            throw new IllegalArgumentException("Invalid role selected");
        }
        String normalized = roleText.trim().toUpperCase();
        if ("ADMIN".equals(normalized)) {
            throw new IllegalArgumentException("Admin registration is invitation-only");
        }
        if (!isSupportedPublicRole(normalized)) {
            throw new IllegalArgumentException("Invalid role selected");
        }
        return User.Role.valueOf(normalized);
    }

}
