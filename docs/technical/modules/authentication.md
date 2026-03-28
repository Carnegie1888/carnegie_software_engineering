# 认证与权限模块技术文档

## 1. 模块概述

认证与权限模块是系统的基础安全模块，负责用户登录、注册、会话管理和访问控制。

**核心组件**：
- `AuthFilter` - 权限验证过滤器
- `LoginServlet` - 登录处理
- `RegisterServlet` - 注册处理
- `LogoutServlet` - 登出处理
- `UserDao` - 用户数据访问
- `SessionUtil` - Session 工具类
- `PermissionUtil` - 权限工具类

---

## 2. 核心类设计

### 2.1 User 实体

**路径**: `backend/src/com/example/authlogin/model/User.java`

```java
public class User {
    private String userId;           // UUID
    private String username;          // 用户名 (唯一)
    private String password;         // SHA-256 哈希
    private String email;            // 邮箱 (唯一)
    private Role role;               // TA / MO / ADMIN
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public enum Role { TA, MO, ADMIN }
}
```

### 2.2 UserDao

**路径**: `backend/src/com/example/authlogin/dao/UserDao.java`

**单例模式实现**：
```java
private static UserDao instance;

public static synchronized UserDao getInstance() {
    if (instance == null) {
        instance = new UserDao();
    }
    return instance;
}
```

**核心方法**：

| 方法 | 说明 | 复杂度 |
|------|------|--------|
| `findById(String userId)` | 根据 ID 查找 | O(n) |
| `findByUsername(String username)` | 根据用户名查找 | O(n) |
| `findByEmail(String email)` | 根据邮箱查找 | O(n) |
| `verifyLogin(String usernameOrEmail, String password)` | 验证登录 | O(n) |
| `create(User user)` | 创建用户 (密码加密) | O(n) |
| `save(User user)` | 保存用户 | O(n) |
| `findAll()` | 获取所有用户 | O(n) |
| `findByRole(Role role)` | 根据角色筛选 | O(n) |

**密码验证流程**：
```java
public Optional<User> verifyLogin(String usernameOrEmail, String password) {
    // 1. 尝试用户名查找
    Optional<User> userOpt = findByUsername(usernameOrEmail);
    // 2. 尝试邮箱查找
    if (!userOpt.isPresent()) {
        userOpt = findByEmail(usernameOrEmail);
    }
    // 3. 验证密码
    if (userOpt.isPresent()) {
        User user = userOpt.get();
        String hashedInput = hashPassword(password);
        if (hashedInput.equals(user.getPassword())) {
            // 4. 更新最后登录时间
            user.setLastLoginAt(LocalDateTime.now());
            save(user);
            return Optional.of(user);
        }
    }
    return Optional.empty();
}
```

---

## 3. Servlet 实现

### 3.1 LoginServlet

**路径**: `backend/src/com/example/authlogin/servlet/LoginServlet.java`

**端点**: `POST /login`

**请求参数**：
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| username | String | 是 | 用户名或邮箱 |
| password | String | 是 | 密码 |

**处理流程**：
```
接收登录请求
    │
    ▼
验证参数非空
    │
    ▼
调用 UserDao.verifyLogin(username, password)
    │
    ├── 验证失败 → forward 到 login.jsp + 错误消息
    │
    └── 验证成功 → 创建 Session → 重定向到仪表盘
```

**成功响应**：重定向到角色对应页面
- TA → `/jsp/ta/dashboard.jsp`
- MO → `/jsp/mo/dashboard.jsp`
- ADMIN → `/jsp/admin/dashboard.jsp`

**失败响应**：转发到 `login.jsp`，显示错误信息

### 3.2 RegisterServlet

**路径**: `backend/src/com/example/authlogin/servlet/RegisterServlet.java`

**端点**: `POST /register`

**请求参数**：
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| username | String | 是 | 用户名 (3-50字符) |
| email | String | 是 | 邮箱 (有效格式) |
| password | String | 是 | 密码 (至少8字符) |
| confirmPassword | String | 是 | 确认密码 |
| role | String | 是 | TA 或 MO |

**验证规则**：
```java
// 用户名验证
if (username == null || username.trim().length() < 3 || username.trim().length() > 50) {
    return error("Username must be 3-50 characters");
}
if (!username.matches("^[a-zA-Z0-9_]+$")) {
    return error("Username can only contain letters, numbers and underscore");
}

// 邮箱验证
if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
    return error("Invalid email format");
}

// 密码验证
if (password.length() < 8) {
    return error("Password must be at least 8 characters");
}
if (!password.equals(confirmPassword)) {
    return error("Passwords do not match");
}

// 角色验证
try {
    role = User.Role.valueOf(role.toUpperCase());
} catch (IllegalArgumentException e) {
    return error("Invalid role");
}
if (role == User.Role.ADMIN) {
    return error("Cannot register as Admin");
}
```

**处理流程**：
```
接收注册请求
    │
    ▼
验证参数
    │
    ▼
检查用户名唯一性
    │
    ▼
检查邮箱唯一性
    │
    ▼
创建 User 对象 (密码自动 SHA-256 加密)
    │
    ▼
调用 UserDao.create(user)
    │
    ▼
自动登录 + 重定向到对应仪表盘
```

### 3.3 LogoutServlet

**路径**: `backend/src/com/example/authlogin/servlet/LogoutServlet.java`

**端点**: `GET /logout`

**处理流程**：
```java
HttpSession session = request.getSession(false);
if (session != null) {
    session.invalidate();
}
response.sendRedirect(request.getContextPath() + "/login.jsp");
```

---

## 4. AuthFilter 过滤器

### 4.1 过滤器配置

```java
@WebFilter("/*")
public class AuthFilter implements Filter {
    // 公开路径集合
    private static final Set<String> PUBLIC_PATHS = new HashSet<>(Arrays.asList(
        "/", "/index.jsp",
        "/login", "/register",
        "/login.jsp", "/register.jsp",
        "/admin-invite.jsp",
        "/api/admin/invite/validate",
        "/api/admin/invite/accept",
        "/logout",
        "/test_applicant.jsp",
        "/jobs"
    ));

    // MO 专属路径
    private static final Set<String> MO_PATHS = new HashSet<>(Arrays.asList(
        "/jsp/mo/", "/api/mo/",
        "/job/create", "/job/delete", "/job/update"
    ));

    // TA 可访问路径
    private static final Set<String> TA_PATHS = new HashSet<>(Arrays.asList(
        "/jsp/ta/", "/api/ta/",
        "/api/applicants/", "/profile/",
        "/applicant", "/apply",
        "/application/", "/job/list", "/job/view"
    ));
}
```

### 4.2 过滤逻辑

```java
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
    HttpServletRequest httpRequest = (HttpServletRequest) request;
    String path = getPath(httpRequest);

    // 1. 静态资源直接放行
    if (isStaticResource(path)) {
        chain.doFilter(request, response);
        return;
    }

    // 2. 公开路径放行
    if (isPublicPath(path)) {
        chain.doFilter(request, response);
        return;
    }

    // 3. 检查登录状态
    HttpSession session = httpRequest.getSession(false);
    User user = session != null ? (User) session.getAttribute("user") : null;

    if (user == null) {
        handleUnauthenticated(httpRequest, httpResponse, path);
        return;
    }

    // 4. 验证权限
    if (!hasPermission(path, user.getRole())) {
        handleForbidden(httpRequest, httpResponse, path);
        return;
    }

    // 5. 放行
    chain.doFilter(request, response);
}
```

### 4.3 权限验证

```java
private boolean hasPermission(String path, User.Role role) {
    // ADMIN 可访问除 MO AI 匹配外的所有路径
    if (role == User.Role.ADMIN) {
        return !ADMIN_BLOCKED_PATHS.contains(path);
    }

    // MO 可访问 MO 路径和 TA 路径
    if (role == User.Role.MO) {
        return isPathMatch(path, MO_PATHS) || isPathMatch(path, TA_PATHS);
    }

    // TA 只能访问 TA 路径
    if (role == User.Role.TA) {
        return isPathMatch(path, TA_PATHS) ||
               path.startsWith("/profile/") ||
               path.startsWith("/application/");
    }

    return false;
}
```

---

## 5. Session 管理

### 5.1 SessionUtil

**路径**: `backend/src/com/example/authlogin/util/SessionUtil.java`

```java
public class SessionUtil {
    // 获取当前登录用户
    public static User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        return session != null ? (User) session.getAttribute("user") : null;
    }

    // 检查是否已登录
    public static boolean isLoggedIn(HttpServletRequest request) {
        return getCurrentUser(request) != null;
    }

    // 检查角色
    public static boolean hasRole(HttpServletRequest request, User.Role role) {
        User user = getCurrentUser(request);
        return user != null && user.getRole() == role;
    }
}
```

### 5.2 登录后 Session 创建

```java
// LoginServlet 中
User user = userDao.verifyLogin(username, password);
if (user.isPresent()) {
    // 防止 Session  fixation
    HttpSession oldSession = request.getSession(false);
    if (oldSession != null) oldSession.invalidate();

    HttpSession newSession = request.getSession(true);
    newSession.setAttribute("user", user);

    // 根据角色重定向
    redirectBasedOnRole(response, user.getRole());
}
```

---

## 6. 工具类

### 6.1 PermissionUtil

**路径**: `backend/src/com/example/authlogin/util/PermissionUtil.java`

提供权限判断的辅助方法。

### 6.2 SecurityTokenUtil

**路径**: `backend/src/com/example/authlogin/util/SecurityTokenUtil.java`

用于生成安全令牌（如邀请链接 Token）。

---

## 7. 错误处理

### 7.1 AJAX 错误响应

```java
if (isAjaxRequest(httpRequest)) {
    response.setContentType("application/json;charset=UTF-8");
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Please login first\"}");
    return;
}
```

### 7.2 错误消息传递

通过请求属性传递错误消息：
```java
request.setAttribute("error", "Invalid username or password");
request.getRequestDispatcher("/login.jsp").forward(request, response);
```

---

## 8. 测试用例

**集成测试**: `backend/test/LoginRegisterIntegrationTest.java`

**测试场景**：
1. 正确登录 → 重定向到仪表盘
2. 错误密码 → 留在登录页 + 错误消息
3. 未登录访问受保护资源 → 重定向到登录页
4. TA 访问 MO 页面 → 403 错误
5. 注册重复用户名 → 错误消息
