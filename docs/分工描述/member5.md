# member5 分工与当前代码文件

[返回总览](README.md)

## 基本信息

| 项目 | 内容 |
| --- | --- |
| Git author | `member5 <member5@edu.com>` |
| 标准提交数 | 33 |
| 最新标准提交 | `2503375 refactor: 统一前端 API 路由调用` |
| 分工概述 | 前端页面与交互，覆盖登录注册、TA/MO/Admin 页面、前端 API 路由统一 |

## Git 历史证据

- `ee34935 feat: 设计并实现登录页面HTML/CSS`
- `8e3ef29 feat: 设计并实现注册页面`
- `c92e799 feat: 设计并实现TA档案创建页面`
- `6976020 feat: 重构TA档案与简历草稿保存流程`
- `2ca667e feat: 新增TA职位详情AI匹配面板并优化职位列表`
- `f4edd42 fix: 修改岗位更新请求从PUT改为POST`
- `7ca796c feat: 优化登录注册与账号资料交互`
- `eb7427a feat: 优化 TA 职位与申请页面体验`
- `025d856 feat: 优化 MO 发布与申请人审核页面`
- `2503375 refactor: 统一前端 API 路由调用`

## 分工概述

`member5` 主要承担前端页面、交互和样式。范围覆盖登录注册、TA 档案、TA 职位列表/详情/申请状态、MO 发布与申请人审核、Admin 页面请求适配，以及后期统一页面 JS 对 `TARecruitment.routes` 和公共请求工具的调用方式。

## 当前对应代码文件

认证、注册和管理员邀请前端：

- `frontend/webapp/login.jsp`
- `frontend/webapp/register.jsp`
- `frontend/webapp/admin-invite.jsp`
- `frontend/webapp/admin-register.jsp`
- `frontend/webapp/css/auth/login.css`
- `frontend/webapp/css/auth/register.css`
- `frontend/webapp/js/auth/login.js`
- `frontend/webapp/js/auth/register.js`
- `frontend/webapp/js/auth/admin-invite.js`

TA 页面、脚本和样式：

- `frontend/webapp/jsp/ta/dashboard.jsp`
- `frontend/webapp/jsp/ta/job-list.jsp`
- `frontend/webapp/jsp/ta/job-detail.jsp`
- `frontend/webapp/jsp/ta/application-status.jsp`
- `frontend/webapp/jsp/ta/application-detail.jsp`
- `frontend/webapp/jsp/ta/notifications.jsp`
- `frontend/webapp/css/ta/ta-dashboard.css`
- `frontend/webapp/css/ta/ta-job-list.css`
- `frontend/webapp/css/ta/ta-job-detail.css`
- `frontend/webapp/css/ta/ta-application-status.css`
- `frontend/webapp/css/ta/ta-application-detail.css`
- `frontend/webapp/js/ta/ta-dashboard.js`
- `frontend/webapp/js/ta/ta-job-list.js`
- `frontend/webapp/js/ta/ta-job-detail.js`
- `frontend/webapp/js/ta/ta-application-status.js`
- `frontend/webapp/js/ta/ta-application-detail.js`
- `frontend/webapp/js/ta/ta-notifications.js`

MO 页面、脚本和样式：

- `frontend/webapp/jsp/mo/dashboard.jsp`
- `frontend/webapp/jsp/mo/applicant-selection.jsp`
- `frontend/webapp/jsp/mo/ai-skill-match.jsp`
- `frontend/webapp/jsp/mo/notifications.jsp`
- `frontend/webapp/css/mo/mo-dashboard.css`
- `frontend/webapp/css/mo/mo-applicant-selection.css`
- `frontend/webapp/css/mo/mo-ai-skill-match.css`
- `frontend/webapp/js/mo/mo-dashboard.js`
- `frontend/webapp/js/mo/mo-applicant-selection.js`
- `frontend/webapp/js/mo/mo-ai-skill-match.js`
- `frontend/webapp/js/mo/mo-notifications.js`

Admin 前端页面请求适配：

- `frontend/webapp/jsp/admin/dashboard.jsp`
- `frontend/webapp/jsp/admin/invite.jsp`
- `frontend/webapp/jsp/admin/notifications.jsp`
- `frontend/webapp/css/admin/admin-dashboard.css`
- `frontend/webapp/css/admin/admin-invite-management.css`
- `frontend/webapp/js/admin/admin-dashboard.js`
- `frontend/webapp/js/admin/admin-invite-management.js`
- `frontend/webapp/js/admin/admin-notifications.js`

前端公共 API 路由调用：

- `frontend/webapp/js/common/ta-recruitment.js`
- `frontend/webapp/WEB-INF/jsp/fragments/portal-sidebar.jspf`
