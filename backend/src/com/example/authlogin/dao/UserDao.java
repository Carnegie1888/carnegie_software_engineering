package com.example.authlogin.dao;

import com.example.authlogin.model.User;
import com.example.authlogin.util.StoragePaths;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * UserDao - 用户数据访问对象
 * 使用CSV文件存储用户数据
 */
public class UserDao {

    private static final String USER_DIR = StoragePaths.getUsersDir();
    private static final String USER_FILE_TA = USER_DIR + File.separator + "users_ta.csv";
    private static final String USER_FILE_MO = USER_DIR + File.separator + "users_mo.csv";
    private static final String USER_FILE_ADMIN = USER_DIR + File.separator + "users_admin.csv";
    private static final String CSV_HEADER = "userId,username,password,email,role,createdAt,lastLoginAt";
    private static final String DEFAULT_DEMO_PASSWORD = "Pass1234";
    private static final String DEFAULT_TA_DEMO_EMAIL = "ta_demo@local.test";
    private static final String DEFAULT_MO_DEMO_EMAIL = "mo_demo@local.test";
    private static final String DEFAULT_ADMIN_DEMO_EMAIL = "admin_demo@local.test";

    private static UserDao instance;

    private UserDao() {
        initDataDirectory();
        ensureDefaultDemoAccounts();
    }

    public static synchronized UserDao getInstance() {
        if (instance == null) {
            instance = new UserDao();
        }
        return instance;
    }

    private void initDataDirectory() {
        File userDir = new File(USER_DIR);
        if (!userDir.exists()) {
            userDir.mkdirs();
        }
        initUserFiles();
    }

    /**
     * 初始化用户数据文件
     */
    private void initUserFile(String filePath) {
        File userFile = new File(filePath);
        if (!userFile.exists()) {
            try {
                File parentDir = userFile.getParentFile();
                if (parentDir != null && !parentDir.exists()) {
                    parentDir.mkdirs();
                }
                userFile.createNewFile();
                try (FileWriter writer = new FileWriter(filePath)) {
                    writer.write(CSV_HEADER + "\n");
                }
            } catch (IOException e) {
                throw new RuntimeException("Failed to create users file", e);
            }
        }
    }

    private void initUserFiles() {
        initUserFile(USER_FILE_TA);
        initUserFile(USER_FILE_MO);
        initUserFile(USER_FILE_ADMIN);
    }

    /**
     * 启动时补齐固定测试账号，但不覆盖已有本地数据。
     */
    private void ensureDefaultDemoAccounts() {
        ensureDefaultDemoAccount("ta_demo", DEFAULT_TA_DEMO_EMAIL, User.Role.TA);
        ensureDefaultDemoAccount("mo_demo", DEFAULT_MO_DEMO_EMAIL, User.Role.MO);
        ensureDefaultDemoAccount("admin_demo", DEFAULT_ADMIN_DEMO_EMAIL, User.Role.ADMIN);
    }

    private void ensureDefaultDemoAccount(String username, String preferredEmail, User.Role role) {
        if (findByUsername(username).isPresent()) {
            return;
        }

        String email = resolveAvailableDemoEmail(username, preferredEmail);
        create(new User(username, DEFAULT_DEMO_PASSWORD, email, role));
    }

    private String resolveAvailableDemoEmail(String username, String preferredEmail) {
        if (!existsByEmail(preferredEmail)) {
            return preferredEmail;
        }

        int suffix = 1;
        while (true) {
            String candidateEmail = username + "+" + suffix + "@local.test";
            if (!existsByEmail(candidateEmail)) {
                return candidateEmail;
            }
            suffix++;
        }
    }

    /**
     * 读取所有用户
     */
    private List<User> readAllUsers() {
        initUserFiles();
        List<User> users = new ArrayList<>();

        users.addAll(readUsersForRole(User.Role.TA));
        users.addAll(readUsersForRole(User.Role.MO));
        users.addAll(readUsersForRole(User.Role.ADMIN));

        return users;
    }

    private List<User> readUsersFromFile(String filePath) {
        List<User> users = new ArrayList<>();
        File userFile = new File(filePath);
        if (!userFile.exists()) {
            return users;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String line;
            boolean isFirstLine = true;
            while ((line = reader.readLine()) != null) {
                if (isFirstLine) {
                    isFirstLine = false;
                    continue;
                }
                if (line.trim().isEmpty()) {
                    continue;
                }
                User user = User.fromCsv(line);
                if (user != null) {
                    users.add(user);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read users file", e);
        }

        return users;
    }

    private List<User> readUsersForRole(User.Role role) {
        return readUsersFromFile(getUserFileByRole(role));
    }

    /**
     * 写入所有用户
     */
    private void writeUsersToFile(String filePath, List<User> users) {
        Path targetPath = Path.of(filePath);
        Path tempPath = targetPath.resolveSibling(targetPath.getFileName() + ".tmp");
        try (PrintWriter writer = new PrintWriter(new FileWriter(tempPath.toFile()))) {
            writer.println(CSV_HEADER);
            for (User user : users) {
                writer.println(user.toCsv());
            }
            writer.flush();
            Files.move(tempPath, targetPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write users file", e);
        }
    }

    private String getUserFileByRole(User.Role role) {
        if (role == User.Role.TA) {
            return USER_FILE_TA;
        }
        if (role == User.Role.MO) {
            return USER_FILE_MO;
        }
        if (role == User.Role.ADMIN) {
            return USER_FILE_ADMIN;
        }
        throw new IllegalArgumentException("Unsupported role: " + role);
    }

    /**
     * 根据ID查找用户
     */
    public Optional<User> findById(String userId) {
        return readAllUsers().stream()
                .filter(u -> u.getUserId().equals(userId))
                .findFirst();
    }

    /**
     * 根据用户名查找用户
     */
    public Optional<User> findByUsername(String username) {
        if (username == null) {
            return Optional.empty();
        }
        String normalized = username.trim();
        return readAllUsers().stream()
                .filter(u -> u.getUsername().equals(normalized))
                .findFirst();
    }

    /**
     * 根据邮箱查找用户
     */
    public Optional<User> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        String normalized = email.trim();
        return readAllUsers().stream()
                .filter(u -> u.getEmail().equalsIgnoreCase(normalized))
                .findFirst();
    }

    /**
     * 检查用户名是否存在
     */
    public boolean existsByUsername(String username) {
        return findByUsername(username).isPresent();
    }

    /**
     * 检查邮箱是否存在
     */
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    /**
     * 保存用户（新建或更新）
     */
    public User save(User user) {
        initUserFiles();

        String targetFile = getUserFileByRole(user.getRole());
        List<User> targetUsers = readUsersForRole(user.getRole());
        List<User> taUsers = readUsersForRole(User.Role.TA);
        List<User> moUsers = readUsersForRole(User.Role.MO);
        List<User> adminUsers = readUsersForRole(User.Role.ADMIN);

        taUsers.removeIf(u -> u.getUserId().equals(user.getUserId()));
        moUsers.removeIf(u -> u.getUserId().equals(user.getUserId()));
        adminUsers.removeIf(u -> u.getUserId().equals(user.getUserId()));
        targetUsers.removeIf(u -> u.getUserId().equals(user.getUserId()));
        targetUsers.add(user);

        if (USER_FILE_TA.equals(targetFile)) {
            taUsers = targetUsers;
        } else if (USER_FILE_MO.equals(targetFile)) {
            moUsers = targetUsers;
        } else {
            adminUsers = targetUsers;
        }

        writeUsersToFile(USER_FILE_TA, taUsers);
        writeUsersToFile(USER_FILE_MO, moUsers);
        writeUsersToFile(USER_FILE_ADMIN, adminUsers);

        return user;
    }

    /**
     * 创建新用户
     */
    public User create(User user) {
        if (existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + user.getUsername());
        }
        if (existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + user.getEmail());
        }

        // 加密密码
        user.setPassword(hashPassword(user.getPassword()));

        return save(user);
    }

    /**
     * 更新用户
     */
    public User update(User user) {
        List<User> users = readAllUsers();

        boolean found = users.stream()
                .anyMatch(u -> u.getUserId().equals(user.getUserId()));

        if (!found) {
            throw new IllegalArgumentException("User not found: " + user.getUserId());
        }

        return save(user);
    }

    /**
     * 删除用户
     */
    public boolean delete(String userId) {
        List<User> taUsers = readUsersForRole(User.Role.TA);
        List<User> moUsers = readUsersForRole(User.Role.MO);
        List<User> adminUsers = readUsersForRole(User.Role.ADMIN);

        boolean removed = taUsers.removeIf(u -> u.getUserId().equals(userId));
        removed = moUsers.removeIf(u -> u.getUserId().equals(userId)) || removed;
        removed = adminUsers.removeIf(u -> u.getUserId().equals(userId)) || removed;

        if (removed) {
            writeUsersToFile(USER_FILE_TA, taUsers);
            writeUsersToFile(USER_FILE_MO, moUsers);
            writeUsersToFile(USER_FILE_ADMIN, adminUsers);
        }
        return removed;
    }

    /**
     * 获取所有用户
     */
    public List<User> findAll() {
        return new ArrayList<>(readAllUsers());
    }

    /**
     * 根据角色查找用户
     */
    public List<User> findByRole(User.Role role) {
        return new ArrayList<>(readUsersForRole(role));
    }

    /**
     * 验证用户登录
     * 返回用户对象（密码已验证）
     */
    public Optional<User> verifyLogin(String usernameOrEmail, String password) {
        Optional<User> userOpt = findByUsername(usernameOrEmail);
        if (!userOpt.isPresent()) {
            userOpt = findByEmail(usernameOrEmail);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String hashedInput = hashPassword(password);

            if (hashedInput.equals(user.getPassword())) {
                // 更新最后登录时间
                user.setLastLoginAt(java.time.LocalDateTime.now());
                save(user);
                return Optional.of(user);
            }
        }

        return Optional.empty();
    }

    /**
     * 密码哈希（SHA-256）
     */
    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | UnsupportedEncodingException e) {
            throw new RuntimeException("Failed to hash password", e);
        }
    }

    /**
     * 获取用户数量
     */
    public long count() {
        return readAllUsers().size();
    }

    /**
     * 清空所有用户（仅用于测试）
     */
    public void deleteAll() {
        writeUsersToFile(USER_FILE_TA, new ArrayList<>());
        writeUsersToFile(USER_FILE_MO, new ArrayList<>());
        writeUsersToFile(USER_FILE_ADMIN, new ArrayList<>());
    }

    /**
     * 批量创建用户（仅用于测试初始化）
     */
    public void batchCreate(List<User> users) {
        List<User> taUsers = readUsersForRole(User.Role.TA);
        List<User> moUsers = readUsersForRole(User.Role.MO);
        List<User> adminUsers = readUsersForRole(User.Role.ADMIN);

        for (User user : users) {
            if (user.getRole() == User.Role.TA) {
                taUsers.add(user);
            } else if (user.getRole() == User.Role.MO) {
                moUsers.add(user);
            } else if (user.getRole() == User.Role.ADMIN) {
                adminUsers.add(user);
            }
        }

        writeUsersToFile(USER_FILE_TA, taUsers);
        writeUsersToFile(USER_FILE_MO, moUsers);
        writeUsersToFile(USER_FILE_ADMIN, adminUsers);
    }
}
