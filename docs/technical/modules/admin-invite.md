# 管理员邀请模块技术文档

## 1. 模块概述

管理员邀请模块允许 ADMIN 向特定邮箱发送邀请链接，被邀请人通过邀请链接注册成为 MO 或 ADMIN。

**核心组件**：
- `AdminInvite` - 邀请实体
- `AdminInviteDao` - 数据访问层
- `AdminInviteServlet` - 邀请管理 API
- `AdminInviteAcceptServlet` - 邀请接受处理
- `AdminInviteEmailService` - 邮件服务
- 前端页面: `jsp/admin/invite.jsp`, `admin-invite.jsp`

---

## 2. 实体设计

### 2.1 AdminInvite

**路径**: `backend/src/com/example/authlogin/model/AdminInvite.java`

```java
public class AdminInvite {
    private String inviteId;           // UUID
    private String email;               // 被邀请邮箱
    private Role role;                  // MO / ADMIN
    private String token;               // 验证令牌 (UUID)
    private Status status;              // PENDING / ACCEPTED / EXPIRED
    private String invitedBy;           // 邀请人 ID
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;    // 过期时间 (如 7 天后)
    private LocalDateTime acceptedAt;   // 接受时间
}
```

### 2.2 邀请状态

| 状态 | 说明 |
|------|------|
| PENDING | 等待接受 |
| ACCEPTED | 已接受 |
| EXPIRED | 已过期 |

### 2.3 CSV 格式

**文件**: `data/invites/invites.csv`

**表头**:
```csv
inviteId,email,role,token,status,invitedBy,createdAt,expiresAt,acceptedAt
```

---

## 3. 数据访问层

### 3.1 AdminInviteDao

**路径**: `backend/src/com/example/authlogin/dao/AdminInviteDao.java`

**单例模式**: 是

**核心方法**:

| 方法 | 说明 |
|------|------|
| `findById(String inviteId)` | 根据 ID 查找 |
| `findByToken(String token)` | 根据 Token 查找 |
| `findByEmail(String email)` | 根据邮箱查找 |
| `findByStatus(Status status)` | 根据状态筛选 |
| `findByInvitedBy(String invitedBy)` | 查找某邀请人的邀请 |
| `save(AdminInvite invite)` | 保存邀请 |
| `create(AdminInvite invite)` | 创建邀请 |
| `updateStatus(String inviteId, Status status)` | 更新状态 |
| `deleteExpired()` | 删除过期邀请 |
| `isValidToken(String token)` | 验证 Token 是否有效 |

**Token 验证**:
```java
public boolean isValidToken(String token) {
    Optional<AdminInvite> inviteOpt = findByToken(token);
    if (inviteOpt.isEmpty()) {
        return false;
    }
    AdminInvite invite = inviteOpt.get();
    // 检查状态和过期时间
    return invite.getStatus() == Status.PENDING &&
           invite.getExpiresAt().isAfter(LocalDateTime.now());
}
```

---

## 4. Servlet 实现

### 4.1 AdminInviteServlet

**路径**: `backend/src/com/example/authlogin/servlet/AdminInviteServlet.java`

**端点**: `/api/admin/invite`

**支持的操作**:

| 操作 | 方法 | 说明 |
|------|------|------|
| 创建邀请 | POST | ADMIN 发送新邀请 |
| 列表 | GET | 获取邀请列表 |
| 取消 | POST | 取消邀请 |

#### POST /api/admin/invite (创建邀请)

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| email | String | 是 | 被邀请邮箱 |
| role | String | 是 | MO 或 ADMIN |
| baseUrl | String | 是 | 系统基础 URL (用于构造邀请链接) |

**处理流程**:
```
接收邀请请求
    │
    ▼
验证 ADMIN 权限
    │
    ▼
验证邮箱格式
    │
    ▼
检查邮箱是否已有对应角色用户
    │
    ├── 已有 → 返回错误
    │
    └── 无 → 继续
           │
           ▼
检查是否有待处理的同邮箱邀请
    │
    ├── 有 → 可选择重新发送或返回错误
    │
    └── 无 → 继续
               │
               ▼
生成唯一 Token
    │
               ▼
创建 AdminInvite 记录
    │
               ▼
发送邀请邮件
    │
               ▼
返回成功
```

**邀请邮件内容**:
```
Subject: [TA Hiring System] You are invited to register as {role}

Dear Candidate,

You have been invited to join our TA Hiring System as a {role}.

Please click the link below to complete your registration:
{baseUrl}/admin-invite.jsp?token={token}

This link will expire in 7 days.

Best regards,
TA Hiring System Admin
```

#### GET /api/admin/invite

**响应**: JSON 数组

```json
[
    {
        "inviteId": "uuid-123",
        "email": "prof.smith@university.edu",
        "role": "MO",
        "status": "PENDING",
        "createdAt": "2026-03-20T10:00:00",
        "expiresAt": "2026-03-27T10:00:00"
    },
    {
        "inviteId": "uuid-456",
        "email": "admin@university.edu",
        "role": "ADMIN",
        "status": "ACCEPTED",
        "createdAt": "2026-03-15T10:00:00",
        "acceptedAt": "2026-03-16T14:30:00"
    }
]
```

**权限**: 仅 ADMIN

#### POST /api/admin/invite/cancel

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| inviteId | String | 是 | 邀请 ID |

### 4.2 AdminInviteAcceptServlet

**路径**: `backend/src/com/example/authlogin/servlet/AdminInviteAcceptServlet.java`

**端点**: `/api/admin/invite/accept`

#### POST /api/admin/invite/accept

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| token | String | 是 | 邀请 Token |
| username | String | 是 | 用户名 |
| password | String | 是 | 密码 |
| confirmPassword | String | 是 | 确认密码 |

**处理流程**:
```
接收注册请求
    │
    ▼
验证 Token 有效性
    │
    ├── Token 无效或已过期 → 返回错误
    │
    └── 有效 → 继续
                  │
                  ▼
验证参数
    │
    ▼
检查用户名唯一性
    │
    ▼
创建用户 (角色来自邀请)
    │
    ▼
更新邀请状态为 ACCEPTED
    │
    ▼
自动登录 + 重定向
```

#### GET /api/admin/invite/validate

**端点**: `/api/admin/invite/validate?token=xxx`

**响应**:
```json
{
    "valid": true,
    "email": "prof.smith@university.edu",
    "role": "MO",
    "expiresAt": "2026-03-27T10:00:00"
}
```

---

## 5. 邮件服务

### 5.1 AdminInviteEmailService

**路径**: `backend/src/com/example/authlogin/service/AdminInviteEmailService.java`

```java
public class AdminInviteEmailService {

    public void sendInviteEmail(String toEmail, String role, String token, String baseUrl) {
        String inviteLink = baseUrl + "/admin-invite.jsp?token=" + token;

        String subject = "[TA Hiring System] You are invited to register as " + role;
        String body = buildEmailBody(role, inviteLink);

        // 根据配置选择发送方式
        if (emailEnabled) {
            sendEmail(toEmail, subject, body);
        } else {
            // 开发模式: 仅打印到日志
            System.out.println("[Email - Dev Mode]");
            System.out.println("To: " + toEmail);
            System.out.println("Subject: " + subject);
            System.out.println("Link: " + inviteLink);
        }
    }

    private String buildEmailBody(String role, String inviteLink) {
        return String.format("""
            Dear Candidate,

            You have been invited to join our TA Hiring System as a %s.

            Please click the link below to complete your registration:
            %s

            This link will expire in 7 days.

            Best regards,
            TA Hiring System Admin
            """, role, inviteLink);
    }
}
```

---

## 6. 前端页面

### 6.1 邀请管理页

**路径**: `frontend/webapp/jsp/admin/invite.jsp`

**功能**:
- 发送新邀请表单
- 邀请列表展示
- 邀请状态显示
- 取消邀请操作

```javascript
// 发送邀请
async function sendInvite(email, role) {
    const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `email=${encodeURIComponent(email)}&role=${role}&baseUrl=${encodeURIComponent(window.location.origin)}`
    });
    return response.json();
}

// 加载邀请列表
async function loadInvites() {
    const response = await fetch('/api/admin/invite', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    return response.json();
}
```

### 6.2 邀请接受页

**路径**: `frontend/webapp/admin-invite.jsp`

**功能**:
- 验证 Token 并显示邀请信息
- 显示被邀请的角色和邮箱
- 注册表单

```javascript
// 验证 Token
async function validateToken(token) {
    const response = await fetch(`/api/admin/invite/validate?token=${token}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    return response.json();
}

// 接受邀请并注册
async function acceptInvite(token, username, password) {
    const response = await fetch('/api/admin/invite/accept', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `token=${encodeURIComponent(token)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&confirmPassword=${encodeURIComponent(password)}`
    });
    return response.json();
}
```

---

## 7. 权限控制

| 操作 | ADMIN | 其他 |
|------|-------|------|
| 创建邀请 | ✓ | ✗ |
| 查看邀请列表 | ✓ | ✗ |
| 取消邀请 | ✓ | ✗ |
| 接受邀请 (注册) | 公开 | ✗ |

---

## 8. 安全考虑

### 8.1 Token 安全

- 使用 UUID 作为 Token，不可预测
- Token 有效期 7 天
- Token 使用后失效
- 每个邀请关联特定邮箱

### 8.2 邮箱验证

- 检查邮箱是否已被注册
- 防止重复邀请

### 8.3 速率限制 (建议)

- 限制同一邮箱的邀请频率
- 限制 ADMIN 发送邀请的频率

---

## 9. 配置

### 9.1 邮件配置

```properties
# 邮件发送配置 (可选)
mail.smtp.host=smtp.example.com
mail.smtp.port=587
mail.smtp.username=notifications@example.com
mail.smtp.password=password
mail.from=notifications@example.com

# 开发模式 (打印到日志而非发送)
email.dev.mode=true
```

---

## 10. 错误处理

| 错误场景 | 响应码 | 消息 |
|----------|--------|------|
| Token 无效 | 400 | "Invalid or expired invite link" |
| Token 已使用 | 400 | "This invite link has already been used" |
| 邮箱已注册 | 400 | "This email is already registered" |
| 用户名已存在 | 400 | "Username already exists" |
| 邀请已过期 | 400 | "This invite has expired" |
| 权限不足 | 403 | "Only admin can create invites" |

---

## 11. 测试用例

**集成测试**: `backend/test/AdminInviteFlowIntegrationTest.java`

**测试场景**:
1. ADMIN 创建邀请 → 邀请正确保存
2. 验证邀请 Token → 返回正确信息
3. 使用邀请 Token 注册 → 用户创建，邀请状态更新
4. 使用过期 Token → 返回错误
5. 重复邀请同一邮箱 → 返回错误
6. 非 ADMIN 创建邀请 → 返回 403
