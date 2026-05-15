# member6 分工与当前代码文件

[返回总览](README.md)

## 基本信息

| 项目 | 内容 |
| --- | --- |
| Git author | `member6 <member6@edu.com>` |
| 标准提交数 | 38 |
| 最新标准提交 | `e2e334c docs: 同步架构文档与命名规范` |
| 分工概述 | 项目 leader/架构重组、通用配置、文档脚本整理、门户壳层、公共样式、Admin 页面与全站双语资源 |

## Git 历史证据

- `6b20b38 refactor: 统一系统默认入口为登录页`
- `7967776 feat: 统一TA/MO/Admin门户固定布局`
- `3a00d0c feat: 重构MO候选人筛选并接入AI分析面板`
- `259394b refactor: 重组后端与前端目录结构并清理占位文件`
- `137344e chore: 重组项目文档与脚本入口`
- `86cea25 refactor: 统一门户壳层与账号资料入口`
- `b591e27 style: 抽取通用组件表单与动效样式`
- `a407820 feat: 补齐全站双语资源与服务端消息映射`
- `f483477 feat: 重构 Admin 工作量与通知页面`
- `4abe022 refactor: 统一后端模块架构与 API 路由`
- `e2e334c docs: 同步架构文档与命名规范`

## 分工概述

`member6` 是项目 leader 和整体结构负责人。主要负责目录整理、架构重组、通用配置、文档/脚本入口、门户统一壳层、全站通用样式、双语资源、Admin 页面重构，以及后期把后端旧大入口与旧包名迁移为当前轻量分层结构。

## 当前对应代码文件

后端架构、路由、公共基础设施：

- `backend/src/com/example/tarecruitment/common/api/ApiRoutes.java`
- `backend/src/com/example/tarecruitment/common/service/ServiceResult.java`
- `backend/src/com/example/tarecruitment/common/storage/CsvCodec.java`
- `backend/src/com/example/tarecruitment/common/storage/StoragePaths.java`
- `backend/src/com/example/tarecruitment/common/search/FuzzySearchUtil.java`
- `backend/src/com/example/tarecruitment/common/util/Logger.java`
- `backend/src/com/example/tarecruitment/common/util/SecurityTokenUtil.java`
- `backend/src/com/example/tarecruitment/common/web/ApiResponses.java`
- `backend/src/com/example/tarecruitment/common/web/JsonResponseUtil.java`
- `backend/src/com/example/tarecruitment/common/web/PermissionUtil.java`
- `backend/src/com/example/tarecruitment/common/web/SessionUtil.java`
- `backend/src/com/example/tarecruitment/common/web/WebRequests.java`
- `backend/src/com/example/tarecruitment/auth/web/AccessPolicy.java`
- `frontend/webapp/WEB-INF/web.xml`

当前分层架构重组覆盖到的后端业务入口：

- `backend/src/com/example/tarecruitment/admin/dao/AdminInviteDao.java`
- `backend/src/com/example/tarecruitment/admin/model/AdminInvite.java`
- `backend/src/com/example/tarecruitment/admin/service/AdminInviteEmailService.java`
- `backend/src/com/example/tarecruitment/admin/service/InviteCodeService.java`
- `backend/src/com/example/tarecruitment/admin/service/WorkloadStatsService.java`
- `backend/src/com/example/tarecruitment/admin/web/AdminCurrentInviteCodeServlet.java`
- `backend/src/com/example/tarecruitment/admin/web/AdminInviteAcceptServlet.java`
- `backend/src/com/example/tarecruitment/admin/web/AdminInviteServlet.java`
- `backend/src/com/example/tarecruitment/admin/web/WorkloadStatsServlet.java`
- `backend/src/com/example/tarecruitment/ai/client/AiSkillMatchClient.java`
- `backend/src/com/example/tarecruitment/ai/client/DashScopeAnalysisClient.java`
- `backend/src/com/example/tarecruitment/ai/client/DeepSeekAiConfig.java`
- `backend/src/com/example/tarecruitment/ai/client/DeepSeekApplicantSearchClient.java`
- `backend/src/com/example/tarecruitment/ai/client/DeepSeekChatClient.java`
- `backend/src/com/example/tarecruitment/ai/client/DeepSeekTaJobSearchClient.java`
- `backend/src/com/example/tarecruitment/ai/client/HttpAiSkillMatchClient.java`
- `backend/src/com/example/tarecruitment/ai/client/MatchAnalysisAiConfig.java`
- `backend/src/com/example/tarecruitment/ai/service/MoApplicantAiSearchService.java`
- `backend/src/com/example/tarecruitment/ai/service/SkillMatchService.java`
- `backend/src/com/example/tarecruitment/ai/service/TaJobAiSearchService.java`
- `backend/src/com/example/tarecruitment/ai/service/TaJobMatchAnalysisService.java`
- `backend/src/com/example/tarecruitment/ai/web/MoApplicantAiSearchServlet.java`
- `backend/src/com/example/tarecruitment/ai/web/MoApplicationMatchAnalysisServlet.java`
- `backend/src/com/example/tarecruitment/ai/web/SkillMatchServlet.java`
- `backend/src/com/example/tarecruitment/ai/web/TaJobAiSearchServlet.java`
- `backend/src/com/example/tarecruitment/ai/web/TaJobMatchAnalysisServlet.java`
- `backend/src/com/example/tarecruitment/application/dao/ApplicationDao.java`
- `backend/src/com/example/tarecruitment/application/mapper/ApplicationRequestMapper.java`
- `backend/src/com/example/tarecruitment/application/mapper/ApplicationResponseMapper.java`
- `backend/src/com/example/tarecruitment/application/model/Application.java`
- `backend/src/com/example/tarecruitment/application/service/ApplicationApplicantService.java`
- `backend/src/com/example/tarecruitment/application/service/ApplicationService.java`
- `backend/src/com/example/tarecruitment/application/validator/ApplicationValidator.java`
- `backend/src/com/example/tarecruitment/application/web/ApplicationServlet.java`
- `backend/src/com/example/tarecruitment/auth/dao/UserDao.java`
- `backend/src/com/example/tarecruitment/auth/model/User.java`
- `backend/src/com/example/tarecruitment/auth/web/AuthFilter.java`
- `backend/src/com/example/tarecruitment/auth/web/CheckAvailableServlet.java`
- `backend/src/com/example/tarecruitment/auth/web/LoginServlet.java`
- `backend/src/com/example/tarecruitment/auth/web/LogoutServlet.java`
- `backend/src/com/example/tarecruitment/auth/web/RegisterServlet.java`
- `backend/src/com/example/tarecruitment/demo/DemoAccountBootstrapListener.java`
- `backend/src/com/example/tarecruitment/demo/DemoDataSeeder.java`
- `backend/src/com/example/tarecruitment/job/dao/JobDao.java`
- `backend/src/com/example/tarecruitment/job/mapper/JobRequestMapper.java`
- `backend/src/com/example/tarecruitment/job/mapper/JobResponseMapper.java`
- `backend/src/com/example/tarecruitment/job/model/Job.java`
- `backend/src/com/example/tarecruitment/job/service/JobService.java`
- `backend/src/com/example/tarecruitment/job/validator/JobValidator.java`
- `backend/src/com/example/tarecruitment/job/web/JobServlet.java`
- `backend/src/com/example/tarecruitment/notification/dao/NotificationDao.java`
- `backend/src/com/example/tarecruitment/notification/model/Notification.java`
- `backend/src/com/example/tarecruitment/notification/web/NotificationServlet.java`
- `backend/src/com/example/tarecruitment/profile/dao/ApplicantDao.java`
- `backend/src/com/example/tarecruitment/profile/mapper/AccountProfileResponseMapper.java`
- `backend/src/com/example/tarecruitment/profile/mapper/ApplicantProfileRequestMapper.java`
- `backend/src/com/example/tarecruitment/profile/mapper/ApplicantProfileResponseMapper.java`
- `backend/src/com/example/tarecruitment/profile/model/Applicant.java`
- `backend/src/com/example/tarecruitment/profile/service/AccountProfileService.java`
- `backend/src/com/example/tarecruitment/profile/service/ApplicantProfileService.java`
- `backend/src/com/example/tarecruitment/profile/service/ProfileAssetService.java`
- `backend/src/com/example/tarecruitment/profile/validator/AccountProfileValidator.java`
- `backend/src/com/example/tarecruitment/profile/validator/ApplicantProfileInput.java`
- `backend/src/com/example/tarecruitment/profile/validator/ApplicantProfileValidator.java`
- `backend/src/com/example/tarecruitment/profile/validator/ProfileAssetValidator.java`
- `backend/src/com/example/tarecruitment/profile/web/AccountProfileServlet.java`
- `backend/src/com/example/tarecruitment/profile/web/ApplicantAssetServlet.java`
- `backend/src/com/example/tarecruitment/profile/web/ApplicantProfileServlet.java`

门户壳层、公共样式、双语资源和首页：

- `frontend/webapp/index.jsp`
- `frontend/webapp/WEB-INF/jsp/fragments/portal-sidebar.jspf`
- `frontend/webapp/WEB-INF/jsp/fragments/portal-topbar.jspf`
- `frontend/webapp/css/common/ai-modules-common.css`
- `frontend/webapp/css/common/components.css`
- `frontend/webapp/css/common/forms.css`
- `frontend/webapp/css/common/motion.css`
- `frontend/webapp/css/common/notifications.css`
- `frontend/webapp/css/common/tokens.css`
- `frontend/webapp/css/portal/portal-home.css`
- `frontend/webapp/css/portal/portal-shell.css`
- `frontend/webapp/js/common/i18n.js`
- `frontend/webapp/js/common/locale-bootstrap.js`
- `frontend/webapp/js/common/portal-i18n.js`
- `frontend/webapp/js/common/ta-recruitment.js`

Admin 页面整体重构：

- `frontend/webapp/jsp/admin/dashboard.jsp`
- `frontend/webapp/jsp/admin/invite.jsp`
- `frontend/webapp/jsp/admin/notifications.jsp`
- `frontend/webapp/css/admin/admin-dashboard.css`
- `frontend/webapp/css/admin/admin-invite-management.css`
- `frontend/webapp/js/admin/admin-dashboard.js`
- `frontend/webapp/js/admin/admin-invite-management.js`
- `frontend/webapp/js/admin/admin-notifications.js`

AI 配置模板：

- `frontend/webapp/WEB-INF/ai/deepseek.properties.template`
- `frontend/webapp/WEB-INF/ai/match-analysis.properties.template`

脚本、运行配置和技术文档：

- `scripts/config.example.bat`
- `scripts/config.example.sh`
- `scripts/dev.bat`
- `scripts/dev.sh`
- `scripts/javadocs.bat`
- `scripts/javadocs.sh`
- `README.md`
- `docs/deliverables/technical/index.md`
- `docs/deliverables/technical/api/servlet-api.md`
- `docs/deliverables/technical/architecture/data-architecture.md`
- `docs/deliverables/technical/architecture/security-architecture.md`
- `docs/deliverables/technical/architecture/system-architecture.md`
- `docs/deliverables/technical/deployment/deployment-guide.md`
- `docs/deliverables/technical/modules/admin-invite.md`
- `docs/deliverables/technical/modules/admin-workload.md`
- `docs/deliverables/technical/modules/ai-matching.md`
- `docs/deliverables/technical/modules/application-review.md`
- `docs/deliverables/technical/modules/authentication.md`
- `docs/deliverables/technical/modules/job-management.md`
- `docs/deliverables/technical/modules/ta-profile.md`
