# TA Hiring System

基于 `Tomcat + Servlet + JSP` 的教学场景 TA 招聘系统，面向三类角色：

- **TA**：维护档案、上传简历、浏览职位、提交申请、查看 AI 匹配分析
- **MO**：发布职位、筛选候选人、推进审核流程、查看申请 AI 分析面板
- **Admin**：查看工作量统计、发送管理员邀请


## 技术栈

| 层次 | 技术 |
|---|---|
| 后端 | Java 17+、Jakarta Servlet |
| 容器 | Apache Tomcat 10.1+ 或 11.x |
| 前端 | JSP、HTML、CSS、原生 JavaScript |
| 构建/运行 | `scripts/dev.sh` / `scripts/dev.bat` |
| 持久化 | CSV 文件 + 本地文件目录 |
| AI | DashScope 兼容配置 + 可选 HTTP Skill Match 客户端 |

## 目录结构

| 路径 | 作用 |
|---|---|
| `backend/src/` | 后端 Java 源码 |
| `frontend/webapp/` | JSP、CSS、JavaScript 和 `WEB-INF/web.xml` |
| `scripts/dev.sh` | macOS / Linux 一键编译、部署、启动 |
| `scripts/dev.bat` | Windows 一键编译、部署、启动 |
| `scripts/config.example.sh` | macOS / Linux 配置模板 |
| `scripts/config.example.bat` | Windows 配置模板 |
| `docs/` | 项目文档和课程交付资料 |
| `test/` | 手工测试资料 |

## 环境要求

| 工具 | 要求 | 说明 |
|---|---|---|
| JDK | `17+` | 需要能直接使用 `javac` |
| Tomcat | `10.1+` 或 `11.x` | 项目使用 Jakarta Servlet API |

## 快速启动

### Windows

```bat
cd scripts
copy config.example.bat config.bat
```

编辑 `scripts\config.bat`：

```bat
set CATALINA_HOME=D:\path\to\apache-tomcat-11.0.7
set TOMCAT_HOME=%CATALINA_HOME%
set APP_NAME=groupproject
set TA_HIRING_DATA_DIR=%CATALINA_HOME%\data
```

启动：

```bat
dev.bat
```

### macOS / Linux

```bash
cd scripts
cp config.example.sh config.sh
chmod +x dev.sh
```

编辑 `scripts/config.sh`：

```bash
export CATALINA_HOME="/path/to/apache-tomcat-11.0.7"
export TOMCAT_HOME="${CATALINA_HOME}"
export APP_NAME="groupproject"
export TA_HIRING_DATA_DIR="${CATALINA_HOME}/data"
```

启动：

```bash
./dev.sh
```

`dev.sh` / `dev.bat` 会自动完成：

```text
编译 backend/src -> 复制 frontend/webapp -> 部署到 Tomcat webapps -> 启动 Tomcat
```

## 访问地址

| 页面 | URL |
|---|---|
| 门户首页 | http://localhost:8080/groupproject/ |
| 登录页 | http://localhost:8080/groupproject/login.jsp |

## 演示账号

| Role | Username | Password |
|---|---|---|
| TA | `ta_demo` | `Pass1234` |
| MO | `mo_demo` | `Pass1234` |
| Admin | `admin_demo` | `Pass1234` |

## 运行数据和日志

运行时数据由 `TA_HIRING_DATA_DIR` 指定，目录下会保存用户、职位、申请、邀请、简历等 CSV/文件数据。建议本地开发时设置为 Tomcat 目录下的 `data/`。

后端日志文件位于项目根目录：

```text
logs/app.log
```

## 常见问题

- **提示找不到 Tomcat**：检查 `CATALINA_HOME` / `TOMCAT_HOME` 是否指向真实 Tomcat 根目录。
- **提示数据目录未配置**：检查 `TA_HIRING_DATA_DIR` 是否已写入 `config.sh` 或 `config.bat`。
- **端口 8080 被占用**：先关闭已有 Tomcat 或其他占用 8080 的服务。
- **脚本显示启动但页面打不开**：查看 Tomcat 日志，确认 8080/8005 没有端口冲突。
- **页面能打开但无数据**：确认本次运行使用的是同一个 `TA_HIRING_DATA_DIR`。
- **邮件邀请未发送**：本地开发环境无 sendmail 时，系统会返回邀请链接供手动复制。
