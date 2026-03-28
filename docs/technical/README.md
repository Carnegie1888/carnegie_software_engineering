# TA Hiring System - Technical Documentation

## 概述

本文档是 Carnegie Software Engineering Group Project (TA Hiring System) 的技术文档集合，提供系统的整体架构设计和各功能模块的详细技术实现说明。

**项目背景**：这是一个面向计算机科学硕士课程的 TA (Teaching Assistant) 招聘管理系统，允许学生申请 TA 职位，模块负责人 (MO) 发布职位并审核申请，系统还集成了 AI 技能匹配功能。

---

## 文档目录

### 架构设计

| 文档 | 说明 |
|------|------|
| [system-architecture.md](./architecture/system-architecture.md) | 系统整体架构设计 |
| [data-architecture.md](./architecture/data-architecture.md) | 数据架构与存储设计 |
| [security-architecture.md](./architecture/security-architecture.md) | 安全架构与权限设计 |

### 功能模块技术文档

| 文档 | 说明 |
|------|------|
| [authentication.md](./modules/authentication.md) | 认证与权限模块 |
| [ta-profile.md](./modules/ta-profile.md) | TA 档案管理模块 |
| [job-management.md](./modules/job-management.md) | 职位管理模块 |
| [application.md](./modules/application.md) | 申请审核模块 |
| [ai-matching.md](./modules/ai-matching.md) | AI 技能匹配模块 |
| [admin-workload.md](./modules/admin-workload.md) | 管理员工作量统计模块 |
| [admin-invite.md](./modules/admin-invite.md) | 管理员邀请模块 |

### API 与部署

| 文档 | 说明 |
|------|------|
| [servlet-api.md](./api/servlet-api.md) | Servlet API 接口文档 |
| [deployment-guide.md](./deployment/deployment-guide.md) | 部署运维指南 |

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 后端 | Java 17+, Jakarta Servlet 6 |
| 容器 | Apache Tomcat 11.x |
| 前端 | JSP, HTML5, CSS3, Vanilla JavaScript |
| 构建 | Maven WAR |
| 持久化 | CSV 文件存储 |
| AI | DashScope 兼容 API (可选) |
| 多语言 | 中英文双语 |

---

## 项目结构

```
backend/src/com/example/authlogin/
├── bootstrap/          # 启动数据初始化
├── dao/                # 数据访问层 (CSV)
├── filter/             # 权限过滤器
├── model/              # 实体类
├── service/            # 业务服务层
│   └── ai/             # AI 客户端
├── servlet/            # Servlet 控制器
└── util/               # 工具类

frontend/webapp/
├── index.jsp           # 门户首页
├── login.jsp           # 登录页
├── register.jsp        # 注册页
├── jsp/
│   ├── ta/             # TA 角色页面 (5个)
│   ├── mo/             # MO 角色页面 (3个)
│   └── admin/          # Admin 角色页面 (2个)
├── css/                # 样式文件
└── js/                 # 前端脚本

docs/technical/
├── architecture/       # 架构设计文档
├── modules/           # 功能模块文档
├── api/               # API 文档
└── deployment/        # 部署文档
```

---

## 角色说明

| 角色 | 说明 | 主要功能 |
|------|------|----------|
| **TA** | Teaching Assistant 申请人 | 创建档案、浏览职位、提交申请、查看申请状态 |
| **MO** | Module Owner 模块负责人 | 发布职位、管理申请、AI 匹配筛选 |
| **ADMIN** | 系统管理员 | 工作量统计、发送邀请链接 |

---

## 核心数据流

```
[TA]  --注册--> [User] --创建档案--> [Applicant]
                           |
[MO]  --发布职位--> [Job] <--申请-- [Application] --审核--> [TA]
                           |
[AI]  --技能匹配--> [Match Score] --> [MO 筛选]
```

---

## 文档更新记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-03-28 | 1.0.0 | 初始技术文档 |
