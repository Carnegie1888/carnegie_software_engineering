# member4 分工与当前代码文件

[返回总览](README.md)

## 基本信息

| 项目 | 内容 |
| --- | --- |
| Git author | `member4 <member4@edu.com>` |
| 标准提交数 | 22 |
| 最新标准提交 | `998b080 feat: 新增通知与管理员邀请码服务` |
| 分工概述 | 申请流程、状态流转、TA 撤回、MO 选择、通知与邀请码业务、集成测试/用户手册早期工作 |

## Git 历史证据

- `e2e3d85 feat: 创建Application申请实体类和ApplicationDao`
- `7638e84 feat: 实现职位申请Servlet`
- `1a21361 feat: 实现申请状态查询API`
- `8af6b7d feat: 添加MO选择申请人功能`
- `9470d7a fix: 收紧 TA 档案必填字段校验`
- `d3326c0 feat: 完善申请人档案接口并支持简历草稿与头像读写`
- `d37a71d refactor: 下线面试安排阶段并收敛申请流程`
- `7bb777a feat: 重做 TA 工作量统计规则`
- `ea6c756 feat: 支持 TA 撤回申请并同步审核状态`
- `998b080 feat: 新增通知与管理员邀请码服务`

## 分工概述

`member4` 主要承担申请业务流程：职位申请、申请状态查询、MO 选择/录用、流程阶段收敛、TA 撤回申请和审核状态同步。后期也补充通知与管理员邀请码服务，并在早期承担集成测试、打包和用户手册类工作。

## 当前对应代码文件

职位申请、申请状态、MO 审核与 TA 撤回：

- `backend/src/com/example/tarecruitment/application/model/Application.java`
- `backend/src/com/example/tarecruitment/application/dao/ApplicationDao.java`
- `backend/src/com/example/tarecruitment/application/mapper/ApplicationRequestMapper.java`
- `backend/src/com/example/tarecruitment/application/mapper/ApplicationResponseMapper.java`
- `backend/src/com/example/tarecruitment/application/service/ApplicationApplicantService.java`
- `backend/src/com/example/tarecruitment/application/service/ApplicationService.java`
- `backend/src/com/example/tarecruitment/application/validator/ApplicationValidator.java`
- `backend/src/com/example/tarecruitment/application/web/ApplicationServlet.java`

通知业务：

- `backend/src/com/example/tarecruitment/notification/model/Notification.java`
- `backend/src/com/example/tarecruitment/notification/dao/NotificationDao.java`
- `backend/src/com/example/tarecruitment/notification/web/NotificationServlet.java`

管理员邀请码业务：

- `backend/src/com/example/tarecruitment/admin/model/AdminInvite.java`
- `backend/src/com/example/tarecruitment/admin/dao/AdminInviteDao.java`
- `backend/src/com/example/tarecruitment/admin/service/AdminInviteEmailService.java`
- `backend/src/com/example/tarecruitment/admin/service/InviteCodeService.java`
- `backend/src/com/example/tarecruitment/admin/web/AdminCurrentInviteCodeServlet.java`
- `backend/src/com/example/tarecruitment/admin/web/AdminInviteAcceptServlet.java`
- `backend/src/com/example/tarecruitment/admin/web/AdminInviteServlet.java`

工作量统计规则协作文件：

- `backend/src/com/example/tarecruitment/admin/service/WorkloadStatsService.java`
- `backend/src/com/example/tarecruitment/admin/web/WorkloadStatsServlet.java`

相关公共能力：

- `backend/src/com/example/tarecruitment/common/util/SecurityTokenUtil.java`
- `backend/src/com/example/tarecruitment/common/search/FuzzySearchUtil.java`
