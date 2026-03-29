# 系统架构设计

## 1. 架构概述

TA Hiring System 采用传统的 **三层架构 (Three-Tier Architecture)**，基于 Java Servlet + JSP 技术栈构建。系统分为表示层 (Presentation)、业务逻辑层 (Business Logic) 和数据访问层 (Data Access)。

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Browser                              │
│                  (HTML + JSP + JavaScript)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ HTTP / AJAX
┌─────────────────────────────────────────────────────────────────┐
│                    Apache Tomcat 11.x                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Web Container                              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  ││
│  │  │ AuthFilter  │  │   JSPs      │  │   Static Resources  │  ││
│  │  │ (Security)  │  │ (Views)     │  │   (CSS/JS/Images)   │  ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  ││
│  │                                                              ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │                    Servlets                             │││
│  │  │  LoginServlet, RegisterServlet, JobServlet, ApplyServlet│││
│  │  │  ApplicantServlet, AdminInviteServlet, WorkloadStats... │││
│  │  └─────────────────────────────────────────────────────────┘││
│  │                            │                                 ││
│  │  ┌─────────────────────────┴───────────────────────────────┐││
│  │  │                   Service Layer                          │││
│  │  │  SkillMatchService, WorkloadStatsService,                │││
│  │  │  AdminInviteEmailService, TaJobMatchAnalysisService      │││
│  │  └─────────────────────────────────────────────────────────┘││
│  │                            │                                 ││
│  │  ┌─────────────────────────┴───────────────────────────────┐││
│  │  │                    DAO Layer                            │││
│  │  │  UserDao, JobDao, ApplicantDao, ApplicationDao,          │││
│  │  │  AdminInviteDao                                          │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    File System (CSV Storage)                      │
│  ${TA_HIRING_DATA_DIR}/  (在 config.bat 中配置)                      │
│  ├── users/           # 用户数据 (按角色分文件)                   │
│  │   ├── users_ta.csv                                         │
│  │   ├── users_mo.csv                                         │
│  │   └── users_admin.csv                                      │
│  ├── jobs/jobs.csv     # 职位数据                               │
│  ├── applicants/       # TA申请人档案                            │
│  ├── applications/     # 申请记录                                │
│  ├── invites/          # 邀请记录                                │
│  ├── resumes/          # 简历文件                                │
│  └── photos/          # 头像文件                                │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 技术选型理由

| 组件 | 选择 | 理由 |
|------|------|------|
| **Servlet** | Jakarta Servlet 6 | 标准的 Java Web 组件，轻量可控 |
| **JSP** | JSP 2.x | 适合服务器端渲染，与 Servlet 配合良好 |
| **Tomcat** | Apache Tomcat 11.x | 主流轻量级 Servlet 容器 |
| **存储** | CSV 文件 | 简化部署，适合小型项目，无需 DB |
| **AI** | DashScope API | 通用的 AI 接口，支持国产大模型 |

---

## 2. 模块划分

### 2.1 核心模块

| 模块 | 包路径 | 职责 |
|------|--------|------|
| **认证模块** | `filter/`, `servlet/LoginServlet`, `servlet/RegisterServlet` | 用户登录、注册、会话管理 |
| **TA档案模块** | `servlet/ApplicantServlet`, `dao/ApplicantDao` | TA 申请人信息管理 |
| **职位模块** | `servlet/JobServlet`, `dao/JobDao` | 职位 CRUD 操作 |
| **申请模块** | `servlet/ApplyServlet`, `dao/ApplicationDao` | 申请提交与审核流程 |
| **AI匹配模块** | `service/ai/`, `service/SkillMatchService` | 技能匹配分析 |
| **管理员模块** | `servlet/AdminInviteServlet`, `servlet/WorkloadStatsServlet` | 邀请与统计功能 |

### 2.2 层次依赖关系

```
┌──────────────────┐
│   JSP / Filter   │  ← 依赖 →  ┌─────────────┐
└──────────────────┘           │   Servlets  │
        │                       └──────┬──────┘
        │                              │
        │                       ┌──────▼──────┐
        └──────────────────────▶│  Services   │
                                 └──────┬──────┘
                                        │
                                 ┌──────▼──────┐
                                 │    DAO      │
                                 └──────┬──────┘
                                        │
                                 ┌──────▼──────┐
                                 │ CSV Files   │
                                 └─────────────┘
```

---

## 3. 请求处理流程

### 3.1 标准请求流程

```
HTTP Request
    │
    ▼
AuthFilter.doFilter()
    │ 检查 Session / 权限
    │
    ▼
Servlet.service()
    │ 解析请求参数
    │
    ▼
Service Layer
    │ 业务逻辑处理
    │
    ▼
DAO Layer
    │ 数据持久化
    │
    ▼
CSV File
```

### 3.2 认证流程

```
未登录请求
    │
    ▼
AuthFilter → 检查公开路径?
    │
    ├─ 是 → 直接放行
    │
    └─ 否 → 检查 Session
              │
              ├─ 无 Session → AJAX? 返回 401 : 重定向到 /login.jsp
              │
              └─ 有 Session → 检查角色权限
                               │
                               ├─ 权限不足 → AJAX? 返回 403 : 403 错误页
                               │
                               └─ 权限通过 → 放行
```

### 3.3 申请流程

```
TA 提交申请
    │
    ▼
ApplyServlet (POST)
    │
    ▼
验证: Job 存在? 职位开放? 未重复申请?
    │
    ▼
创建 Application 记录
    │
    ▼
存储到 applications/applications.csv
    │
    ▼
返回成功 / 错误
```

---

## 4. 前端架构

### 4.1 页面结构

```
frontend/webapp/
├── index.jsp           # 首页（职位列表入口）
├── login.jsp           # 登录页
├── register.jsp        # TA/MO 自助注册
├── admin-invite.jsp    # 管理员邀请接受页
│
└── jsp/
    ├── ta/             # TA 角色页面
    │   ├── dashboard.jsp           # TA 档案仪表盘
    │   ├── job-list.jsp            # 职位列表
    │   ├── job-detail.jsp          # 职位详情
    │   ├── application-status.jsp  # 我的申请
    │   └── application-detail.jsp  # 申请详情
    │
    ├── mo/             # MO 角色页面
    │   ├── dashboard.jsp           # MO 管理仪表盘
    │   ├── applicant-selection.jsp # 候选人筛选
    │   └── ai-skill-match.jsp      # AI 匹配分析
    │
    └── admin/          # Admin 角色页面
        ├── dashboard.jsp           # 统计仪表盘
        └── invite.jsp              # 邀请发送
```

### 4.2 AJAX 交互模式

系统广泛使用 AJAX 进行前后端数据交互：

```javascript
// 示例: 获取职位列表
fetch('/api/ta/job/list', {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
})
.then(response => response.json())
.then(data => renderJobs(data));
```

**AJAX 响应格式**：
- 成功: 返回 JSON 数据
- 401: 未登录，返回 `{"error": "Unauthorized"}`
- 403: 无权限，返回 `{"error": "Forbidden"}`
- 500: 服务器错误，返回 `{"error": "..."}`

---

## 5. 配置管理

### 5.1 数据目录配置

数据目录通过 `TA_HIRING_DATA_DIR` 环境变量指定，**必须**在 `scripts/config.bat` 中配置：

```batch
set TA_HIRING_DATA_DIR=%CATALINA_HOME%\data
```

如果未配置，应用启动时会抛出异常。

### 5.2 AI 配置

AI 匹配使用配置文件：
```
frontend/webapp/WEB-INF/ai/ta-job-match.properties.template
```

配置项：
- `api.key`: DashScope API 密钥
- `api.url`: API 端点
- `model`: 使用的模型名称

---

## 6. 多语言支持

系统支持中英文双语切换，通过 URL 参数 `lang` 控制：
- `/jsp/ta/dashboard.jsp?lang=zh` → 中文
- `/jsp/ta/dashboard.jsp?lang=en` → 英文

语言文件存储在 JSP 页面内部或通过请求属性传递。

---

## 7. 错误处理

### 7.1 错误处理策略

| 错误类型 | 处理方式 |
|----------|----------|
| 参数验证失败 | 返回 400 + 错误信息 |
| 未登录 | 返回 401 + 重定向到登录页 |
| 无权限 | 返回 403 + 错误消息 |
| 资源不存在 | 返回 404 + 错误消息 |
| 服务器错误 | 返回 500 + 错误日志 |

### 7.2 统一错误响应

```json
{
    "error": "ErrorType",
    "message": "Human readable message",
    "details": {}  // 可选的额外信息
}
```
