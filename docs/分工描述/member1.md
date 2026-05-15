# member1 分工与当前代码文件

[返回总览](README.md)

## 基本信息

| 项目 | 内容 |
| --- | --- |
| Git author | `member1 <member1@edu.com>` |
| 标准提交数 | 18 |
| 最新标准提交 | `82d4566 chore: 添加文件日志工具并替换原有日志输出` |
| 分工概述 | 后端基础能力、认证流程、接口响应与工具类、技能匹配早期实现、部分测试/统计补充 |

## Git 历史证据

- `4ea4072 feat: 创建User实体类和UserDao`
- `86e0557 feat: 实现登录Servlet和注册Servlet`
- `63543c7 feat: 添加Session管理和权限验证`
- `8f6a4e2 feat: 创建SkillMatch服务类，定义技能匹配算法`
- `89ba81f refactor: 统一接口响应并修复职位筛选逻辑`
- `1bdb2d0 feat: 新增管理员邀请制账号开通流程`
- `cf3f849 feat: 添加TA工作量统计功能`
- `82d4566 chore: 添加文件日志工具并替换原有日志输出`

## 分工概述

`member1` 主要承担后端早期基础能力：用户认证、登录注册、Session/权限校验、统一响应工具、日志工具，以及技能匹配服务早期实现。后续也补过管理员邀请流程、职位筛选响应修复、TA 工作量统计和脚本日志相关内容。

## 当前对应代码文件

后端认证与会话入口：

- `backend/src/com/example/tarecruitment/auth/model/User.java`
- `backend/src/com/example/tarecruitment/auth/dao/UserDao.java`
- `backend/src/com/example/tarecruitment/auth/web/LoginServlet.java`
- `backend/src/com/example/tarecruitment/auth/web/RegisterServlet.java`
- `backend/src/com/example/tarecruitment/auth/web/LogoutServlet.java`
- `backend/src/com/example/tarecruitment/auth/web/AuthFilter.java`
- `backend/src/com/example/tarecruitment/auth/web/AccessPolicy.java`
- `backend/src/com/example/tarecruitment/auth/web/CheckAvailableServlet.java`

后端公共响应、Session、权限和日志工具：

- `backend/src/com/example/tarecruitment/common/web/ApiResponses.java`
- `backend/src/com/example/tarecruitment/common/web/JsonResponseUtil.java`
- `backend/src/com/example/tarecruitment/common/web/SessionUtil.java`
- `backend/src/com/example/tarecruitment/common/web/PermissionUtil.java`
- `backend/src/com/example/tarecruitment/common/web/WebRequests.java`
- `backend/src/com/example/tarecruitment/common/service/ServiceResult.java`
- `backend/src/com/example/tarecruitment/common/util/Logger.java`
- `backend/src/com/example/tarecruitment/common/util/SecurityTokenUtil.java`

技能匹配早期服务与入口：

- `backend/src/com/example/tarecruitment/ai/client/AiSkillMatchClient.java`
- `backend/src/com/example/tarecruitment/ai/client/HttpAiSkillMatchClient.java`
- `backend/src/com/example/tarecruitment/ai/service/SkillMatchService.java`
- `backend/src/com/example/tarecruitment/ai/web/SkillMatchServlet.java`
