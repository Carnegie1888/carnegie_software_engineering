# TARecruitmentSystem Software Engineering Group Project

基于 `Tomcat + Servlet + JSP` 的教学场景 TA 招聘系统，面向三类角色：

- **TA**：维护档案、上传简历、浏览职位、提交申请、查看 AI 匹配分析
- **MO**：发布职位、筛选候选人、推进审核流程、查看申请 AI 分析面板
- **Admin**：查看工作量统计、发送管理员邀请

## 技术栈

| 层次 | 技术 |
|---|---|
| 后端 | Java 17+、Jakarta Servlet 6 |
| 容器 | Apache Tomcat 11.x |
| 前端 | JSP、HTML、CSS、原生 JavaScript |
| 构建 | Maven / 脚本 |
| 持久化 | CSV 文件 + 本地文件目录 |
| AI | DashScope 兼容配置 + 可选 HTTP Skill Match 客户端 |

## 环境要求

| 工具 | 要求 | 说明 |
|---|---|---|
| JDK | `17+` | 推荐 JDK 21 |
| Tomcat | `11.x` | 项目使用 Jakarta Servlet 6 |
| Maven | `3.9+` | 可选，用于 WAR 打包 |

## 快速启动

### 1. 配置

编辑 `scripts/config.bat`（Windows）或 `scripts/config.sh`（macOS/Linux），设置 Tomcat 路径：

```bat
REM Windows 示例
set CATALINA_HOME=D:\path\to\apache-tomcat-11.0.7
set APP_NAME=groupproject
```

```bash
# macOS / Linux 示例
export CATALINA_HOME="/path/to/apache-tomcat-11.0.7"
export APP_NAME="groupproject"
```

### 2. 启动

**Windows**：
```cmd
cd scripts
dev.bat
```

**macOS / Linux**：
```bash
cd scripts
chmod +x dev.sh
./dev.sh
```

这会自动完成：编译 → 部署到 Tomcat → 启动服务。

### 3. 访问地址

| 页面 | URL |
|---|---|
| 门户首页 | http://localhost:8080/groupproject/ |
| 登录页 | http://localhost:8080/groupproject/login.jsp |

### 4. 演示账号

| Role | Username | Password |
|---|---|---|
| TA | `ta_demo` | `Pass1234` |
| MO | `mo_demo` | `Pass1234` |
| Admin | `admin_demo` | `Pass1234` |

## 其他启动方式

### Maven 打包

```bash
./scripts/package-war.sh      # macOS / Linux
scripts\package-war.bat       # Windows
```

生成 `target/groupproject.war`，可部署到任意 Tomcat。

### 脚本说明

| 脚本 | 用途 |
|---|---|
| `dev.bat` / `dev.sh` | 一键：编译 + 部署 + 启动 |
| `build.bat` / `build.sh` | 仅编译 |
| `deploy.bat` / `deploy.sh` | 仅部署 |
| `startup.bat` / `startup.sh` | 仅启动 Tomcat |
| `package-war.bat` / `package-war.sh` | Maven WAR 打包 |

## 详细文档

项目文档已迁移至 `docs/technical/`：

```
docs/technical/
├── README.md                      # 文档总览
├── architecture/
│   ├── system-architecture.md     # 系统架构
│   ├── data-architecture.md       # 数据架构
│   └── security-architecture.md   # 安全架构
├── modules/
│   ├── authentication.md          # 认证模块
│   ├── ta-profile.md              # TA 档案模块
│   ├── job-management.md          # 职位管理模块
│   ├── application.md             # 申请流程模块
│   ├── ai-matching.md            # AI 匹配模块
│   ├── admin-workload.md          # 管理员工作量模块
│   └── admin-invite.md           # 管理员邀请模块
├── api/
│   └── servlet-api.md             # Servlet API 文档
└── deployment/
    └── deployment-guide.md        # 部署指南
```

## 数据目录

运行时数据默认存储在项目 `data/` 目录下。如需指定其他位置，可设置 JVM 属性：

```text
-Dta.hiring.data.dir=/path/to/data
```

或环境变量 `TA_HIRING_DATA_DIR`。

## 日志

后端日志文件位于项目根目录 `logs/app.log`，记录所有接口的请求和错误信息。

## 常见问题

- **端口 8080 被占用**：先关闭已运行的 Tomcat 实例
- **数据"消失"**：检查是否指定了正确的数据目录
- **页面能打开但无数据**：确认使用同一 Tomcat 实例
- **邮件邀请未发送**：本地开发环境无 sendmail 时，系统会返回邀请链接供手动复制
