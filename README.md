# Software Engineering Group Project

基于 Tomcat + Servlet + JSP 的 Web 应用

## 环境要求

- JDK 21+
- Apache Tomcat 11.x

## 快速开始

### 1. 首次配置

Windows:

```cmd
cd scripts
copy config.example.bat config.bat
notepad config.bat
```

修改 `config.bat`，填入你的 Tomcat 路径：

```bat
set CATALINA_HOME=C:\apache-tomcat-11.0.7
```

macOS / Linux:

```bash
cd scripts
cp config.example.sh config.sh
```

修改 `config.sh`，填入你的 Tomcat 路径：

```bash
export CATALINA_HOME="/path/to/apache-tomcat-11.0.7"
export TOMCAT_HOME="${CATALINA_HOME}"
export APP_NAME="groupproject"
```

### 2. 运行项目

Windows:

```cmd
cd scripts
build.bat
deploy.bat
startup.bat
```

最简理解：

- `build.bat`：编译 Java，并整理前端资源到 `build/`
- `deploy.bat`：把 `build/` 部署到 Tomcat
- `startup.bat`：启动 Tomcat

macOS / Linux（推荐一键）:

```bash
cd scripts
chmod +x *.sh
./onekey.sh
```

或分步执行：

```bash
cd scripts
chmod +x *.sh
./build.sh
./deploy.sh
./startup.sh
```

### 3. 访问

- 首页: [http://localhost:8080/groupproject/](http://localhost:8080/groupproject/)
- 登录页: [http://localhost:8080/groupproject/login.jsp](http://localhost:8080/groupproject/login.jsp)

### 4. 最简手动测试

首次运行后，至少做下面 2 个检查：

1. 打开首页：`http://localhost:8080/groupproject/`
2. 打开登录页：`http://localhost:8080/groupproject/login.jsp`

如果这 2 个地址都能正常访问，说明项目已经完成了最基础的编译、部署、启动和访问验证。

## Standard Demo Accounts

以下为固定测试账号；应用启动时若本地 `csv` 中缺失这些账号，后端会自动补齐。

| Role  | Username     | Password   |
| ----- | ------------ | ---------- |
| TA    | `ta_demo`    | `Pass1234` |
| MO    | `mo_demo`    | `Pass1234` |
| Admin | `admin_demo` | `Pass1234` |

## 日常开发工作流一：脚本运行

当你修改了任何 `.java` 源码或 `.jsp/.html` 前端文件后，**无需重启 Tomcat**，只需要在 `scripts/` 目录下重新执行编译和部署命令：

Windows:

```cmd
cd scripts
build.bat
deploy.bat
```

macOS / Linux:

```bash
cd scripts
./build.sh
./deploy.sh
```

说明：这会重新编译最新的 Java 类并把新文件覆盖到 Tomcat 的运行包中，刷新浏览器即可看到变化。

## 日常开发工作流二：IntelliJ IDEA 自动更新开发（推荐）

如果你不想每次都手动执行 `build.bat`、`deploy.bat`、`startup.bat`，推荐在 IntelliJ IDEA 中使用本地 Tomcat + `war exploded` 方式开发。

### 1. Tomcat 运行配置

在 IDEA 中新建 `Tomcat Server -> Local`，并确认：

- `Deployment` 中添加 `groupproject:war exploded`
- `Application context` 设置为 `/groupproject`
- `On 'Update' action` 设置为 `Update classes and resources`

### 2. 开启自动编译

在 IDEA 中确认：

- `Build project automatically` 已开启
- `Allow auto-make to start even if developed application is currently running` 已开启

### 3. 使用效果

- 修改 `JSP / CSS / JS / HTML` 后，通常只需保存并刷新浏览器即可看到效果
- 修改 `.java` 文件后，IDEA 会尽量自动编译并更新到 Tomcat
- 如果某次 Java 改动没有立即生效，可先尝试 `Build Project`，仍不生效再重启 Tomcat

### 4. 不要混用两套启动方式

如果你已经改用 IDEA 管理 Tomcat，平时请尽量：

- 不再手动双击 `startup.bat`
- 统一在 IDEA 中启动和停止 Tomcat

否则很容易出现端口冲突，例如 `8080 已在使用中`。

## 固定使用项目根目录 `data/`（推荐）

项目运行时数据目录由 `StoragePaths` 统一管理。Tomcat 环境下，如果不显式指定数据目录，程序默认可能会把数据写到 Tomcat 自己的目录下，而不是仓库根目录的 `data/`。

### 1. IDEA 运行方式

如果你使用 IDEA 的 Tomcat 运行配置，请在 `VM options` 中填写：

```text
-Dta.hiring.data.dir=D:\Code\2026\SoftwareProject\carnegie_software_engineering\data
```

### 2. 脚本运行方式

如果你使用仓库自带脚本：

```cmd
cd scripts
build.bat
deploy.bat
startup.bat
```

并且希望程序始终使用项目根目录下的 `data/`，推荐在 `scripts/config.bat` 中增加类似如下路径：

```bat
set CATALINA_OPTS=-Dta.hiring.data.dir=D:\Code\2026\SoftwareProject\carnegie_software_engineering\data
```

示例：

```bat
set CATALINA_HOME=C:\apache-tomcat-11.0.7
set TOMCAT_HOME=%CATALINA_HOME%
set APP_NAME=groupproject
set CATALINA_OPTS=-Dta.hiring.data.dir=D:\Code\2026\SoftwareProject\carnegie_software_engineering\data
```

这样通过 `startup.bat` 启动 Tomcat 时，程序会优先使用项目根目录 `data/`，而不是默认切换到 Tomcat 自己的 `data/groupproject` 目录。

这样做的好处：

- 自动编译、自动部署时不会切换到另一份数据
- 本地调试时始终使用同一份测试数据
- 团队成员继续使用脚本时也能保持一致
- 不容易出现“数据没了，实际上只是换了目录”的误判

## 集成测试与回归验证

当前仓库采用轻量级 Java 主类测试（`main + assert`）进行集成/回归验证，可直接在命令行执行。

示例：运行登录注册模块集成测试（成员4）

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

## 项目架构与目录说明

```text
carnegie_software_engineering/
├── backend/               # 👨‍💻 后端开发工作区 (成员1-4)
│   └── src/               # Java 源代码存放处 
│
├── frontend/              # 🎨 前端开发工作区 (成员5-6)
│   └── webapp/            # JSP、HTML、CSS、JS 静态资源与 web.xml
│
├── scripts/               # ⚙️ 构建与部署脚本
│   ├── build.bat          # 核心构建脚本 (将 backend 和 frontend 组装)
│   ├── deploy.bat         # 核心部署脚本
│   ├── startup.bat        # Tomcat 启动脚本
│   └── config.example.bat # 配置文件模板
│
├── data/                  # 💾 纯文本数据存储 (JSON/txt)
└── build/                 # 📦 脚本自动生成的打包产物 (被 Git 忽略)
```

## 常见问题

- **8080 端口被占用**:
  - 最常见原因是你之前已经手动启动过 Tomcat，又尝试从 IDEA 再启动一次
  - 优先关闭旧 Tomcat，再启动 IDEA 中的 Tomcat
  - 可尝试运行 `Tomcat/bin/shutdown.bat`
  - 如果仍然不行，可在管理员命令行中检查端口占用：

```bat
netstat -ano | findstr :8080
tasklist /svc /FI "PID eq <PID>"
taskkill /PID <PID> /F
```

- 如果 `taskkill` 提示拒绝访问，通常说明该进程是管理员权限或 Windows 服务方式启动的；此时可打开 `services.msc`，找到 Tomcat 服务后手动停止
- 如果你暂时不想处理旧进程，也可以把 IDEA 中的 Tomcat HTTP 端口改成 `8081`
- **命令行乱码**: 请确保您的终端代码页格式正确，或在执行构建脚本时确保所有的本地 `.java` 文件是以 `UTF-8` 无 BOM 形式保存的。
