# Software Engineering Group Project

基于 Tomcat + Servlet + JSP 的 Web 应用

## 环境要求

- JDK 17+
- Apache Tomcat 11.x

## 快速开始

### 1. 首次配置

```cmd
copy config.example.bat config.bat
notepad config.bat
```

修改 `config.bat`，填入你的 Tomcat 路径：
```bat
set CATALINA_HOME=C:\apache-tomcat-11.0.7
```

### 2. 运行项目

```cmd
build.bat
deploy.bat
startup.bat
```

### 3. 访问

- 首页: http://localhost:8080/groupproject/
- Servlet: http://localhost:8080/groupproject/hello
- JSP: http://localhost:8080/groupproject/jsp/welcome.jsp

## 修改代码后

```cmd
build.bat
deploy.bat
```

## 项目结构

```
src/main/java/          # Java代码
src/main/webapp/        # JSP和静态资源
config.bat              # 本地配置 (不提交Git)
```

## 常见问题
- **端口被占用**: 修改 Tomcat/conf/server.xml
