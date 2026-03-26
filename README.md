# Carnegie Software Engineering Group Project

基于 `Tomcat + Servlet + JSP` 的教学场景 TA 招聘系统。项目面向三类角色：

- `TA`：维护个人档案、上传简历/头像、浏览职位、提交申请、查看申请状态、查看岗位 AI 匹配分析。
- `MO`：发布职位、筛选候选人、推进审核流程、查看申请 AI 分析面板。
- `Admin`：查看工作量统计、发送管理员邀请、完成管理员开通与管理流程。

这份 README 的目标不是只给出几条启动命令，而是把下面这些问题一次讲清楚：

- 这个项目到底做什么。
- 代码和页面分别放在哪里。
- 推荐用哪种方式在本地开发。
- Tomcat、数据目录、AI、邮件邀请分别怎么配置。
- 哪些路径、页面、接口是真正存在于当前代码里的。
- 第一次运行后应该如何验证系统是正常的。
- 常见坑点和排查方式有哪些。

## 目录

- [1. 项目简介](#1-项目简介)
- [2. 系统角色与能力地图](#2-系统角色与能力地图)
- [3. 技术栈与运行架构](#3-技术栈与运行架构)
- [4. 仓库结构说明](#4-仓库结构说明)
- [5. 环境要求](#5-环境要求)
- [6. 推荐本地开发方式：IDEA + Local Tomcat](#6-推荐本地开发方式idea--local-tomcat)
- [7. Maven 打包方式](#7-maven-打包方式)
- [8. 历史脚本工作流](#8-历史脚本工作流)
- [9. 首次启动后的访问入口](#9-首次启动后的访问入口)
- [10. 页面地图](#10-页面地图)
- [11. 后端接口地图](#11-后端接口地图)
- [12. 关键业务流程说明](#12-关键业务流程说明)
- [13. 配置项说明](#13-配置项说明)
- [14. 数据与文件存储说明](#14-数据与文件存储说明)
- [15. Demo 数据与默认账号](#15-demo-数据与默认账号)
- [16. 日常开发建议](#16-日常开发建议)
- [17. 测试与回归验证](#17-测试与回归验证)
- [18. 常见问题与排查](#18-常见问题与排查)

## 1. 项目简介

本项目是一个典型的课程助教招聘系统，主要围绕三个核心业务对象展开：

- `User`：系统账号，角色包括 `TA`、`MO`、`ADMIN`
- `Job`：MO 发布的岗位
- `Application`：TA 对岗位的申请记录

系统整体采用传统 Java Web 结构：

- 前端使用 `JSP + CSS + JavaScript`
- 后端使用 `Jakarta Servlet`
- 容器使用 `Apache Tomcat 11`
- 本地数据持久化使用 **CSV 文件 + 文件系统目录**
- AI 能力通过可选 HTTP 客户端接入，不依赖数据库

这个项目非常适合课程组协作开发，因为：

- 前后端目录分离清晰
- 页面与 Servlet 对应关系比较直接
- 不需要数据库安装，拉仓库后即可在本地跑起来
- 演示账号和演示数据可以在应用启动时自动补齐

## 2. 系统角色与能力地图

### 2.1 TA（助教申请人）

TA 侧主要功能如下：

- 注册普通账号
- 登录系统并进入 TA Portal
- 创建和更新个人档案
- 上传简历草稿、正式简历和头像
- 浏览岗位列表与岗位详情
- 提交申请、撤回申请
- 查看申请状态与申请详情
- 查看面向 TA 的岗位 AI 匹配分析

### 2.2 MO（Module Organizer）

MO 侧主要功能如下：

- 注册普通账号
- 登录系统并进入 MO Portal
- 创建、更新、删除自己发布的职位
- 查看申请自己岗位的候选人
- 启动审核、接受申请、拒绝申请
- 调用 MO 侧申请 AI 分析接口
- 查看技能匹配结果

### 2.3 Admin（管理员）

Admin 侧主要功能如下：

- 登录管理端
- 查看全局工作量统计
- 查看按 MO 维度的处理情况
- 发送管理员邀请
- 通过邀请链接或邀请码开通管理员账号

### 2.4 角色权限要点

当前代码中的权限控制由 `backend/src/com/example/authlogin/filter/AuthFilter.java` 负责，几个值得特别注意的点如下：

- `/jsp/`*、`/api/*` 等大部分业务路径都需要登录后访问
- `TA` 只能访问自己的 TA 侧资源
- `MO` 可访问 MO 侧资源，也会访问部分 TA 通用查询资源来支撑审核流程
- `ADMIN` 基本拥有全局权限，但当前代码明确屏蔽了 MO AI 技能匹配的部分路径：
  - `/jsp/mo/ai-skill-match.jsp`
  - `/api/mo/skill-match`
- 公开可访问的典型路径包括：
  - `/`
  - `/index.jsp`
  - `/login.jsp`
  - `/register.jsp`
  - `/admin-invite.jsp`
  - `/api/admin/invite/validate`
  - `/api/admin/invite/accept`

## 3. 技术栈与运行架构

### 3.1 技术栈


| 层次  | 技术                                       |
| --- | ---------------------------------------- |
| 后端  | Java 17+、Jakarta Servlet 6               |
| 容器  | Apache Tomcat 11.x                       |
| 前端  | JSP、HTML、CSS、原生 JavaScript               |
| 构建  | Maven WAR 插件、历史 `scripts/` 脚本            |
| 持久化 | CSV 文件、本地文件目录                            |
| AI  | DashScope 兼容配置 + 可选 HTTP Skill Match 客户端 |
| 多语言 | 页面内置中英文切换文案                              |


### 3.2 `pom.xml` 当前约定

根目录 `pom.xml` 的关键事实如下：

- 打包类型是 `war`
- `groupId` 为 `com.example`
- `artifactId` 为 `groupproject`
- Java 编译目标是 `17`
- `backend/src` 被作为源码目录
- `backend/test` 被作为测试源码目录
- `frontend/webapp` 被作为 Web 资源目录

这意味着：

- **Tomcat 11** 与 **JDK 17+** 是兼容组合
- 如果你要做标准 WAR 打包，优先走 Maven 是最自然的方式

### 3.3 运行架构

可以把整个项目理解为下面这条链路：

```text
Browser (JSP / CSS / JS)
        |
        v
Servlet Controller
        |
        v
DAO Layer
        |
        +--> CSV files under data/
        |
        +--> uploaded resumes / photos
        |
        +--> optional AI HTTP client
```

### 3.4 持久化方式的特点

本项目没有接数据库，而是把业务数据直接落在本地文件里：

- 用户数据：CSV
- 申请人档案：CSV
- 职位数据：CSV
- 申请记录：CSV
- 管理员邀请：CSV
- 简历、头像等文件：直接存储在数据目录下的子文件夹

优点：

- 本地开发零数据库依赖
- 演示环境搭建简单
- 数据文件可直接观察

缺点：

- 多人并发写入不适合作为真实生产方案
- 数据目录一旦配置漂移，很容易误以为“数据丢了”

## 4. 仓库结构说明

当前仓库的重要目录如下：

```text
carnegie_software_engineering/
├── backend/
│   ├── src/com/example/authlogin/
│   │   ├── bootstrap/         # 启动时补齐演示账号 / 演示业务数据
│   │   ├── dao/               # CSV 读写访问层
│   │   ├── filter/            # 登录与权限过滤器
│   │   ├── model/             # User / Job / Applicant / Application / AdminInvite
│   │   ├── service/           # 业务服务
│   │   ├── service/ai/        # AI 配置与 HTTP 客户端
│   │   ├── servlet/           # 各业务入口 Servlet
│   │   └── util/              # StoragePaths / JsonResponseUtil / SessionUtil 等
│   └── test/                  # 回归测试与集成测试
│
├── frontend/
│   └── webapp/
│       ├── index.jsp          # 门户首页
│       ├── login.jsp          # 登录页
│       ├── register.jsp       # 普通注册页（TA / MO）
│       ├── admin-invite.jsp   # 管理员邀请接受页（公开）
│       ├── admin-register.jsp # 管理员注册说明页
│       ├── css/               # 页面样式
│       ├── js/                # 前端脚本
│       ├── jsp/
│       │   ├── ta/            # TA Portal 页面
│       │   ├── mo/            # MO Portal 页面
│       │   └── admin/         # Admin Portal 页面
│       └── WEB-INF/
│           ├── web.xml
│           └── ai/            # AI 本地配置模板与本地私有配置
│
├── scripts/
│   ├── build.*               # 历史编译脚本
│   ├── deploy.*              # 历史部署脚本
│   ├── startup.*             # 历史启动脚本
│   ├── onekey.sh             # 历史一键脚本
│   └── package-war.*         # Maven WAR 打包脚本
│
├── docs/
│   ├── Deliverables/
│   └── plan-and-handout/
│
├── data/                     # 推荐的统一运行时数据目录
├── build/                    # 历史脚本产物目录
├── target/                   # Maven 打包输出目录
├── pom.xml                   # Maven 打包配置
└── web.xml                   # Maven WAR 插件使用的 web.xml
```

### 4.1 根目录 `web.xml` 与 `frontend/webapp/WEB-INF/web.xml`

仓库里同时存在两份 `web.xml`：

- 根目录 `web.xml`：供 Maven WAR 插件使用
- `frontend/webapp/WEB-INF/web.xml`：位于 Web 资源目录中，随资源一起复制

如果你只是日常开发，不必频繁改动它们；但如果你在排查打包差异，这一点要知道。

## 5. 环境要求

### 5.1 必需环境


| 工具     | 要求      | 说明                                     |
| ------ | ------- | -------------------------------------- |
| JDK    | `17+`   | `pom.xml` 以 Java 17 为编译目标，推荐安装 JDK 21  |
| Tomcat | `11.x`  | 项目当前按 Jakarta Servlet 6 / Tomcat 11 使用 |
| 浏览器    | 任意现代浏览器 | 本地验证用                                  |


### 5.2 推荐环境


| 工具            | 是否推荐 | 说明          |
| ------------- | ---- | ----------- |
| IntelliJ IDEA | 强烈推荐 | 日常开发效率最高    |
| Maven 3.9+    | 推荐   | 用于标准 WAR 打包 |
| Git           | 推荐   | 常规版本管理      |


### 5.3 编码约定

建议所有源码和文档统一使用：

- `UTF-8`
- 无 BOM

否则在 Windows 命令行、脚本编译或日志打印时容易出现乱码。

## 6. 推荐本地开发方式：IDEA + Local Tomcat

这是当前最适合本仓库的工作流，也是团队协作时最不容易踩坑的方式。

### 6.1 为什么推荐 IDEA 工作流

原因很直接：

- JSP / CSS / JS 修改后刷新页面即可验证
- Java 代码可以通过 IDEA 的构建与部署流程更新到 Tomcat
- 不需要反复手动执行旧脚本
- 更符合当前仓库已经逐步迁移后的目录结构

### 6.2 配置步骤

#### 第一步：导入项目

直接在 IDEA 中打开仓库根目录：

```text
D:\Code\2026\SoftwareProject\carnegie_software_engineering
```

#### 第二步：配置 Local Tomcat

在 IDEA 中新建：

```text
Run / Debug Configurations -> Tomcat Server -> Local
```

关键配置建议如下：

- `Application Server`：选择你本机的 Tomcat 11
- `Deployment`：添加 `groupproject:war exploded`
- `Application context`：设置为 `/groupproject`
- `On 'Update' action`：设置为 `Redeploy`

#### 第三步：指定统一数据目录

在该 Tomcat 配置的 `VM options` 中加入：

```text
-Dta.hiring.data.dir=D:\Code\2026\SoftwareProject\carnegie_software_engineering\data
```

如果你在 macOS / Linux 上，替换为自己的绝对路径，例如：

```text
-Dta.hiring.data.dir=/path/to/carnegie_software_engineering/data
```

#### 第四步：开启自动编译

建议在 IDEA 中开启：

- `Build project automatically`
- `Allow auto-make to start even if developed application is currently running`

#### 第五步：启动 Tomcat

启动后默认访问：

- 门户首页：`http://localhost:8080/groupproject/`
- 登录页：`http://localhost:8080/groupproject/login.jsp`

### 6.3 日常修改时怎么生效

#### 修改前端文件时

如果你修改的是：

- `.jsp`
- `.css`
- `.js`
- `.html`

一般只需要保存并刷新浏览器。

#### 修改 Java 文件时

如果你修改的是：

- `backend/src/.../*.java`

一般流程是：

1. 在 IDEA 中执行 `Build Project`
2. 使用 `Update classes and resources`
3. 如仍未生效，再重启 IDEA 管理的 Tomcat

### 6.4 非常重要：不要混用两套启动方式

如果你已经使用 IDEA 管理 Tomcat，请尽量不要同时再去执行：

- `scripts/startup.bat`
- `scripts/startup.sh`

混用最常见的后果是：

- `8080` 端口冲突
- 你以为改动没生效，实际上浏览器访问的是另一套 Tomcat 实例
- 数据目录指向不同位置，导致“同一份项目出现两份数据”

## 7. Maven 打包方式

如果你的目标是：

- 生成标准可部署 WAR
- 不依赖 IDEA 本地操作
- 做交付或部署前检查

那么 Maven 打包方式更合适。

### 7.1 直接使用 Maven

在仓库根目录运行：

```bash
mvn -DskipTests clean package
```

成功后输出文件为：

```text
target/groupproject.war
```

### 7.2 使用仓库自带打包脚本

Windows：

```cmd
scripts\package-war.bat
```

macOS / Linux：

```bash
chmod +x scripts/package-war.sh
./scripts/package-war.sh
```

### 7.3 什么时候选 Maven

推荐在这些场景使用：

- 提交前做标准打包验证
- 准备演示包或部署包
- 不想依赖 IDEA 的本地配置
- 历史 `build/deploy/startup` 脚本不适合当前代码结构时

## 8. 历史脚本工作流

仓库里仍保留了这组脚本：

- `scripts/build.bat` / `scripts/build.sh`
- `scripts/deploy.bat` / `scripts/deploy.sh`
- `scripts/startup.bat` / `scripts/startup.sh`
- `scripts/onekey.sh`

### 8.1 这些脚本的原始职责

- `build.*`：手工调用 `javac` 编译 Java，并把 `frontend/webapp` 资源复制到 `build/`
- `deploy.*`：把 `build/` 复制到 Tomcat 的 `webapps/groupproject`
- `startup.*`：启动 Tomcat
- `onekey.sh`：依次执行 `build -> deploy -> startup`

### 8.2 当前为什么不再作为首选

当前源码已经拆分为例如：

- `backend/src/com/example/authlogin/servlet/...`
- `backend/src/com/example/authlogin/service/ai/...`

而历史脚本中仍保留了较早时期的部分编译路径写法。换句话说：

- 它们仍然能表达项目原先的脚本化工作流思路
- 但在当前代码结构下，**不一定是最稳妥的日常开发主路径**

因此建议：

- 日常开发优先用 **IDEA + Local Tomcat**
- 标准打包优先用 **Maven**
- 如果你确实要使用 `scripts/build.`*，请先核对脚本中的源码路径是否与当前仓库一致

### 8.3 如果你仍要使用脚本流

#### Windows 配置

```cmd
cd scripts
copy config.example.bat config.bat
notepad config.bat
```

最小配置示例：

```bat
set CATALINA_HOME=C:\apache-tomcat-11.0.7
set TOMCAT_HOME=%CATALINA_HOME%
set APP_NAME=groupproject
set CATALINA_OPTS=-Dta.hiring.data.dir=D:\Code\2026\SoftwareProject\carnegie_software_engineering\data
```

#### macOS / Linux 配置

```bash
cd scripts
cp config.example.sh config.sh
```

示例：

```bash
export CATALINA_HOME="/path/to/apache-tomcat-11.0.7"
export TOMCAT_HOME="${CATALINA_HOME}"
export APP_NAME="groupproject"
export CATALINA_OPTS="-Dta.hiring.data.dir=/path/to/carnegie_software_engineering/data"
```

#### 脚本流常见命令

Windows：

```cmd
cd scripts
build.bat
deploy.bat
startup.bat
```

macOS / Linux：

```bash
cd scripts
chmod +x *.sh
./build.sh
./deploy.sh
./startup.sh
```

### 8.4 `APP_NAME` 不建议改

虽然 `config.example.*` 中把 `APP_NAME` 写成了“可选”，但从当前代码实际情况看，不建议随意修改。原因包括：

- 登录成功后的跳转路径在后端里仍是 `/groupproject/...`
- 默认数据目录逻辑中也使用了 `groupproject` 作为应用名

因此：

- 如果你只是本地开发，请保持 `APP_NAME=groupproject`
- 只有在你愿意同步修改相关代码时，才考虑改动上下文路径

## 9. 首次启动后的访问入口

无论你是通过 IDEA 还是部署 WAR，成功启动后优先验证下面几个地址：


| 页面     | URL                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| 门户首页   | [http://localhost:8080/groupproject/](http://localhost:8080/groupproject/)                                 |
| 登录页    | [http://localhost:8080/groupproject/login.jsp](http://localhost:8080/groupproject/login.jsp)               |
| 普通注册页  | [http://localhost:8080/groupproject/register.jsp](http://localhost:8080/groupproject/register.jsp)         |
| 管理员邀请页 | [http://localhost:8080/groupproject/admin-invite.jsp](http://localhost:8080/groupproject/admin-invite.jsp) |


建议第一次运行至少完成下面这组 smoke test：

1. 能打开门户首页。
2. 能打开登录页。
3. 用演示账号能成功登录 TA / MO / Admin。
4. 登录后能进入对应角色的 dashboard。

## 10. 页面地图

下面列出当前仓库内已经存在的主要 JSP 页面。

### 10.1 公共页面


| 路径                                   | 作用             |
| ------------------------------------ | -------------- |
| `frontend/webapp/index.jsp`          | 门户首页           |
| `frontend/webapp/login.jsp`          | 登录页            |
| `frontend/webapp/register.jsp`       | 普通注册页（TA / MO） |
| `frontend/webapp/admin-invite.jsp`   | 管理员邀请接受页       |
| `frontend/webapp/admin-register.jsp` | 管理员注册说明页       |


### 10.2 TA 页面


| 路径                                              | 作用                 |
| ----------------------------------------------- | ------------------ |
| `frontend/webapp/jsp/ta/dashboard.jsp`          | TA 档案页 / 简历与头像操作入口 |
| `frontend/webapp/jsp/ta/job-list.jsp`           | 职位列表               |
| `frontend/webapp/jsp/ta/job-detail.jsp`         | 职位详情页              |
| `frontend/webapp/jsp/ta/application-status.jsp` | 我的申请列表             |
| `frontend/webapp/jsp/ta/application-detail.jsp` | 单个申请详情页            |


### 10.3 MO 页面


| 路径                                               | 作用            |
| ------------------------------------------------ | ------------- |
| `frontend/webapp/jsp/mo/dashboard.jsp`           | MO 发岗 / 管理主页面 |
| `frontend/webapp/jsp/mo/applicant-selection.jsp` | 候选人筛选与审核页面    |
| `frontend/webapp/jsp/mo/ai-skill-match.jsp`      | MO AI 分析与匹配页  |


### 10.4 Admin 页面


| 路径                                        | 作用       |
| ----------------------------------------- | -------- |
| `frontend/webapp/jsp/admin/dashboard.jsp` | 管理员统计仪表盘 |
| `frontend/webapp/jsp/admin/invite.jsp`    | 管理员邀请发送页 |


### 10.5 多语言支持

当前多个页面带有 `data-i18n` 文案标记，并包含语言切换按钮，因此可以认为：

- 系统前端已有较完整的中英文切换结构
- 文案调整时，需要留意中英文两套内容是否同步

## 11. 后端接口地图

下面列出当前最关键的一组 Servlet 路径。


| 路径                                   | 方法                    | 主要用途            | 访问角色            |
| ------------------------------------ | --------------------- | --------------- | --------------- |
| `/login`                             | `POST`                | 登录              | 公开              |
| `/logout`                            | `GET/POST`            | 登出              | 已登录用户           |
| `/register`                          | `POST`                | 普通注册            | 公开，且仅 TA / MO   |
| `/applicant`                         | `GET/POST/PUT/DELETE` | TA 档案、简历草稿、头像资源 | TA              |
| `/jobs`                              | `GET`                 | 查询职位列表/详情       | 公开或登录           |
| `/jobs`                              | `POST/PUT/DELETE`     | 新建/修改/删除职位      | MO              |
| `/apply`                             | `GET`                 | 查询申请列表与详情       | TA / MO / Admin |
| `/apply`                             | `POST`                | 提交申请            | TA              |
| `/apply`                             | `PUT`                 | 接受/拒绝/撤回/开始审核   | TA / MO / Admin |
| `/api/ta/job-match-analysis`         | `POST`                | TA 侧岗位 AI 匹配分析  | TA              |
| `/api/mo/application-match-analysis` | `POST`                | MO 侧申请 AI 分析    | MO              |
| `/api/mo/skill-match`                | `GET`                 | MO 技能匹配分析       | MO              |
| `/api/admin/workload`                | `GET`                 | 管理员工作量统计与导出     | Admin           |
| `/api/admin/invite`                  | `POST`                | 创建管理员邀请         | Admin           |
| `/api/admin/invite/validate`         | `GET`                 | 校验邀请是否有效        | 公开              |
| `/api/admin/invite/accept`           | `POST`                | 使用邀请创建管理员账号     | 公开              |


### 11.1 登录与跳转约定

`LoginServlet` 当前登录成功后会返回如下角色跳转：

- `TA` -> `/groupproject/jsp/ta/dashboard.jsp`
- `MO` -> `/groupproject/jsp/mo/dashboard.jsp`
- `ADMIN` -> `/groupproject/jsp/admin/dashboard.jsp`

这也是为什么本 README 一直强调：

- 默认上下文路径请保持 `/groupproject`

## 12. 关键业务流程说明

### 12.1 普通注册与登录

#### 普通注册

公开注册页只允许创建：

- `TA`
- `MO`

如果尝试传 `ADMIN`，后端会直接拒绝，并提示：

```text
Admin registration is invitation-only
```

#### 登录

登录支持：

- 用户名登录
- 邮箱登录

并且可以带角色参数。若用户在前端选的角色与账号真实角色不一致，后端会返回 `403`。

### 12.2 TA 档案与简历/头像

TA 档案由 `/applicant` 统一处理，支持：

- `GET`：查询当前登录用户档案
- `POST`：创建档案
- `PUT`：更新档案
- `DELETE`：清除待保存简历草稿（特定场景）

支持的能力包括：

- 基本信息录入
- 简历草稿上传
- 正式简历保存
- 头像上传与读取
- 档案完整度计算

### 12.3 职位发布

职位由 `/jobs` 统一处理：

- `GET /jobs`：列表查询
- `GET /jobs?id=...`：查询单个职位
- `POST /jobs`：创建职位
- `PUT /jobs?id=...`：更新职位
- `DELETE /jobs?id=...`：删除职位

职位仅允许岗位所属 MO 自己修改和删除。

### 12.4 申请与审核

申请由 `/apply` 统一处理：

- `POST /apply`：TA 提交申请
- `GET /apply`：查询申请
- `PUT /apply?id=...&action=...`：执行状态变更

支持的典型动作包括：

- `accept`
- `reject`
- `withdraw`
- `start_review`

申请状态包括：

- `PENDING`
- `ACCEPTED`
- `REJECTED`
- `WITHDRAWN`

此外，代码中还记录了更细的流程阶段字段，例如：

- `progressStage`
- `reviewStartedAt`
- `finalDecisionAt`

### 12.5 管理员邀请制开通

管理员账号的完整流程是：

1. 已登录 Admin 在管理页面发起邀请
2. 后端生成 `inviteToken`、`inviteCode` 和过期时间
3. 系统尝试通过邮件发送邀请
4. 受邀用户打开 `admin-invite.jsp`
5. 通过邀请链接或邮箱 + 邀请码创建管理员账号
6. 邀请使用后失效

### 12.6 AI 分析能力

当前仓库里实际存在两组 AI 相关能力：

#### A. TA / MO 岗位分析

由这组组件支撑：

- `TaJobMatchAnalysisServlet`
- `MoApplicationMatchAnalysisServlet`
- `TaJobMatchAnalysisService`
- `TongyiXiaomiAnalysisClient`
- `TaJobMatchAiConfig`

配置来源主要是：

- `frontend/webapp/WEB-INF/ai/ta-job-match.local.properties`

#### B. Skill Match 可选 HTTP AI 客户端

由这组组件支撑：

- `SkillMatchServlet`
- `SkillMatchService`
- `HttpAiSkillMatchClient`

这个客户端是 **可选的**。如果没有配置对应 endpoint，服务会退回到非远程 AI 的路径，而不是直接崩掉。

## 13. 配置项说明

这一节很重要，因为这个项目最容易出现的问题，几乎都和配置项有关。

### 13.1 Tomcat 与上下文路径

建议统一保持：

```text
Context Path = /groupproject
```

原因：

- 登录成功重定向写死到了 `/groupproject/...`
- 默认数据目录命名逻辑也绑定了 `groupproject`
- README、用户手册、页面链接、部署脚本示例都以此为基础

### 13.2 数据目录配置

运行时数据目录由 `StoragePaths` 统一决定，优先级如下：

1. JVM 属性 `ta.hiring.data.dir`
2. 环境变量 `TA_HIRING_DATA_DIR`
3. `catalina.base/data/groupproject`
4. 当前工作目录下的 `data`

最推荐的做法是显式指定：

```text
-Dta.hiring.data.dir=<repo>/data
```

为什么一定建议这样做：

- 避免数据被写到 Tomcat 安装目录中
- 避免你重装/切换 Tomcat 后突然“找不到数据”
- 团队成员本地排查时更容易统一口径

### 13.3 TA / MO 岗位 AI 配置

模板文件：

```text
frontend/webapp/WEB-INF/ai/ta-job-match.properties.template
```

本地真实配置文件：

```text
frontend/webapp/WEB-INF/ai/ta-job-match.local.properties
```

模板中的关键项如下：


| Key                          | 说明                |
| ---------------------------- | ----------------- |
| `dashscope.api.key`          | DashScope API Key |
| `ta.job.match.ai.base-url`   | 兼容接口地址            |
| `ta.job.match.ai.model`      | 模型名               |
| `ta.job.match.ai.timeout-ms` | 超时毫秒数             |


代码中的读取优先级是：

1. `ta-job-match.local.properties`
2. 同名 JVM System Property
3. 同名环境变量

对应的环境变量示例：


| 配置项                          | 环境变量                         |
| ---------------------------- | ---------------------------- |
| `dashscope.api.key`          | `DASHSCOPE_API_KEY`          |
| `ta.job.match.ai.base-url`   | `TA_JOB_MATCH_AI_BASE_URL`   |
| `ta.job.match.ai.model`      | `TA_JOB_MATCH_AI_MODEL`      |
| `ta.job.match.ai.timeout-ms` | `TA_JOB_MATCH_AI_TIMEOUT_MS` |


### 13.4 Skill Match HTTP AI 客户端配置

这组配置与上面的 DashScope 配置不是一回事。

可用环境变量包括：


| Key                         | 说明                  |
| --------------------------- | ------------------- |
| `SKILL_MATCH_AI_ENDPOINT`   | 远程 Skill Match 服务地址 |
| `SKILL_MATCH_AI_API_KEY`    | API Key（如果远程服务需要）   |
| `SKILL_MATCH_AI_TIMEOUT_MS` | 超时设置                |


如果 `SKILL_MATCH_AI_ENDPOINT` 未配置，系统会走非远程路径。

### 13.5 管理员邀请邮件配置

管理员邀请邮件服务优先尝试使用系统 `sendmail`。

支持的配置键如下：


| Key                                                     | 说明          | 示例                    |
| ------------------------------------------------------- | ----------- | --------------------- |
| `TA_HIRING_MAIL_FROM` / `-Dta.hiring.mail.from`         | 发件地址        | `noreply@example.com` |
| `TA_HIRING_SENDMAIL_PATH` / `-Dta.hiring.sendmail.path` | sendmail 路径 | `/usr/sbin/sendmail`  |


### 13.6 邮件发送失败时会发生什么

这是一个很值得知道的实现细节：

- 如果没有配置 `sendmail`
- 或当前环境不支持执行 `sendmail`
- 或发送失败

系统不会阻断邀请流程，而是进入 **fallback 模式**：

- 邀请仍会成功创建
- 接口响应里会返回 `inviteUrl`
- 同时会返回 `inviteCode`
- 还会包含 `previewBody`

这意味着在很多 Windows 本地开发环境里，最常见的操作方式其实是：

- 复制接口返回的邀请链接
- 手工发给受邀人

## 14. 数据与文件存储说明

### 14.1 当前使用的是本地 CSV 存储

DAO 层当前主要写入这些 CSV 文件：


| 文件                                   | 用途       |
| ------------------------------------ | -------- |
| `data/users/users_ta.csv`            | TA 账号    |
| `data/users/users_mo.csv`            | MO 账号    |
| `data/users/users_admin.csv`         | Admin 账号 |
| `data/applicants/applicants.csv`     | 申请人档案    |
| `data/jobs/jobs.csv`                 | 职位数据     |
| `data/applications/applications.csv` | 申请记录     |
| `data/invites/admin_invites.csv`     | 管理员邀请记录  |


### 14.2 上传文件目录

运行时还会用到这些子目录：


| 目录                    | 用途        |
| --------------------- | --------- |
| `data/resumes/`       | 正式简历      |
| `data/resume-drafts/` | 简历草稿      |
| `data/photos/`        | 头像        |
| `data/photo-drafts/`  | 头像草稿或预留目录 |


### 14.3 这意味着什么

请特别注意：

- 这个项目不是数据库驱动项目
- 你看到的“数据状态”完全取决于当前进程正在使用哪个 `data` 目录
- 只要数据目录变了，页面表现就会像换了一个全新的系统

## 15. Demo 数据与默认账号

项目启动时会尝试补齐固定测试账号。如果本地 CSV 中缺少这些账号，后端会自动创建。


| Role  | Username     | Password   |
| ----- | ------------ | ---------- |
| TA    | `ta_demo`    | `Pass1234` |
| MO    | `mo_demo`    | `Pass1234` |
| Admin | `admin_demo` | `Pass1234` |


默认邮箱通常会使用类似：

- `ta_demo@local.test`
- `mo_demo@local.test`
- `admin_demo@local.test`

除了账号初始化外，仓库中还包含启动时演示业务数据补齐逻辑，因此本地第一次运行后通常不会是“全空系统”。

## 16. 日常开发建议

### 16.1 修改前端时

常见涉及目录：

- `frontend/webapp/*.jsp`
- `frontend/webapp/jsp/**/*.jsp`
- `frontend/webapp/css/**/*.css`
- `frontend/webapp/js/**/*.js`

建议流程：

1. 保存文件
2. 刷新浏览器
3. 若样式未更新，清缓存或确认访问的是 IDEA 管理的同一 Tomcat 实例

### 16.2 修改后端时

常见涉及目录：

- `backend/src/com/example/authlogin/servlet`
- `backend/src/com/example/authlogin/service`
- `backend/src/com/example/authlogin/dao`
- `backend/src/com/example/authlogin/util`

建议流程：

1. 保存 `.java`
2. IDEA `Build Project`
3. `Update classes and resources`
4. 刷新浏览器或重试接口

### 16.3 新增页面时

建议保持现在的分层习惯：

- 公共页：放 `frontend/webapp/`
- 角色页：放 `frontend/webapp/jsp/<role>/`
- 样式：放 `frontend/webapp/css/<role>/`
- 对应接口：放 `backend/src/com/example/authlogin/servlet/`

### 16.4 不要提交本地密钥

尤其不要把下面这些真实值提交进仓库：

- `frontend/webapp/WEB-INF/ai/ta-job-match.local.properties`
- 任何 API key
- 任何邮件配置中的真实密钥或企业邮箱账号

### 16.5 文案和中英文切换要一起维护

当前页面已有较多 `data-i18n` 标记，因此在修改：

- 按钮
- 提示语
- 标题

时，尽量同时检查：

- 中文文案
- 英文文案
- 切换按钮状态

## 17. 测试与回归验证

### 17.1 当前测试形态

当前仓库并不是完整的 JUnit 自动化工程，更多采用：

- 独立 Java 测试类
- 集成测试类
- `main + assert` 风格回归测试

常见测试文件位于：

```text
backend/test/com/example/authlogin/
```

例如：

- `integration/LoginRegisterIntegrationTest.java`
- `integration/AdminInviteFlowIntegrationTest.java`
- `integration/ApplicantJobIntegrationTest.java`
- `integration/ApplicationFlowE2ETest.java`
- `integration/DemoDataSeederTest.java`
- `integration/JobServletValidationTest.java`
- `service/SkillMatchServiceTest.java`
- `service/TaJobMatchAnalysisServiceTest.java`
- `service/ai/TongyiXiaomiAnalysisClientTest.java`

### 17.2 建议的最小手工回归

每次合并较大改动后，至少做下面这组手工验证：

1. 首页可访问。
2. `ta_demo` / `mo_demo` / `admin_demo` 能登录。
3. TA 能打开档案页并查看/上传简历。
4. MO 能打开发岗页或候选人页。
5. Admin 能打开统计页和邀请页。
6. 公开注册页不能注册管理员。
7. 管理员邀请页可以正常校验 token。

### 17.3 手动编译运行示例

下面保留两组典型示例，适合做局部回归时参考。

#### 示例一：登录注册集成测试

```bash
cd /path/to/carnegie_software_engineering
rm -rf /tmp/build-test-login && mkdir /tmp/build-test-login
javac -encoding UTF-8 -d /tmp/build-test-login \
  backend/src/com/example/authlogin/util/StoragePaths.java \
  backend/src/com/example/authlogin/model/User.java \
  backend/src/com/example/authlogin/dao/UserDao.java \
  backend/test/com/example/authlogin/integration/LoginRegisterIntegrationTest.java
java -ea -cp /tmp/build-test-login com.example.authlogin.integration.LoginRegisterIntegrationTest
```

#### 示例二：管理员邀请流程回归测试

```bash
cd /path/to/carnegie_software_engineering
rm -rf /tmp/build-test-admin-invite && mkdir /tmp/build-test-admin-invite
javac -encoding UTF-8 -d /tmp/build-test-admin-invite \
  backend/src/com/example/authlogin/util/StoragePaths.java \
  backend/src/com/example/authlogin/util/SecurityTokenUtil.java \
  backend/src/com/example/authlogin/model/User.java \
  backend/src/com/example/authlogin/model/AdminInvite.java \
  backend/src/com/example/authlogin/dao/UserDao.java \
  backend/src/com/example/authlogin/dao/AdminInviteDao.java \
  backend/test/com/example/authlogin/dao/AdminInviteDaoTest.java \
  backend/test/com/example/authlogin/integration/AdminInviteFlowIntegrationTest.java
java -ea -cp /tmp/build-test-admin-invite com.example.authlogin.dao.AdminInviteDaoTest
java -ea -cp /tmp/build-test-admin-invite com.example.authlogin.integration.AdminInviteFlowIntegrationTest
```

## 18. 常见问题与排查

### 18.1 端口 `8080` 被占用

最常见原因：

- 你之前已经手动启动过 Tomcat
- 现在又从 IDEA 再启动了一次

排查建议：

1. 先确认是否混用了两套 Tomcat 启动方式
2. 尝试执行 Tomcat 自带的 `shutdown`
3. 再检查端口占用

Windows 示例：

```bat
netstat -ano | findstr :8080
tasklist /svc /FI "PID eq <PID>"
taskkill /PID <PID> /F
```

如果 `taskkill` 拒绝访问：

- 说明该进程可能由管理员权限或服务方式启动
- 可以打开 `services.msc` 手动停止对应 Tomcat 服务

### 18.2 页面能打开，但数据像是“没了”

先不要急着怀疑代码。优先检查：

- 当前 Tomcat 的 `VM options` 有没有 `-Dta.hiring.data.dir=...`
- 运行中的实例是不是另一个 Tomcat
- 数据是否被写到了 `catalina.base/data/groupproject`

### 18.3 登录后跳转异常

请优先检查：

- 是否修改过 `APP_NAME`
- 是否把上下文路径改成了不是 `/groupproject`

当前后端登录成功跳转路径是固定写法，因此上下文路径不一致时最容易出问题。

### 18.4 管理员邀请“没发出邮件”

这在本地开发环境里很常见，不一定是 bug。

先确认：

- 是否配置了 `TA_HIRING_MAIL_FROM`
- 是否配置了 `TA_HIRING_SENDMAIL_PATH`
- 当前机器是否真的有可执行的 `sendmail`

如果没有，也没关系：

- 系统会进入 fallback 模式
- 使用接口返回的 `inviteUrl` / `inviteCode` / `previewBody` 即可继续测试流程

### 18.5 AI 面板没结果

重点检查：

- `frontend/webapp/WEB-INF/ai/ta-job-match.local.properties` 是否存在
- `dashscope.api.key` 是否还是占位符
- base URL、model、timeout 是否配置正确
- 你访问的是 TA 还是 MO 对应的 AI 页面

另外还要知道：

- TA/MO 岗位分析配置和 Skill Match 的 HTTP endpoint 配置不是同一套

### 18.6 脚本构建失败

如果失败发生在 `scripts/build.*`，请优先判断是否属于历史脚本与当前源码目录不完全同步的问题。当前更稳妥的替代方案是：

- 日常开发：用 IDEA + Local Tomcat
- 打包验证：用 `mvn -DskipTests clean package`

### 18.7 文件上传失败

请检查：

- 简历格式是否为 `PDF / DOC / DOCX`
- 简历是否超过 `10MB`
- 头像是否为 `JPG / JPEG / PNG / WEBP`
- 头像是否超过 `5MB`

### 18.8 命令行乱码

请确保：

- 本地文件编码为 `UTF-8`
- 终端代码页和字体支持中文
- 脚本输出没有被旧编码环境污染

