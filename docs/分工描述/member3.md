# member3 分工与当前代码文件

[返回总览](README.md)

## 基本信息

| 项目 | 内容 |
| --- | --- |
| Git author | `member3 <member3@edu.com>` |
| 标准提交数 | 19 |
| 最新标准提交 | `b32f933 feat: 支持账号资料与用户名同步更新` |
| 分工概述 | 职位发布/查询/校验、工作量统计接口、账号资料同步、AI 配置模板 |

## Git 历史证据

- `376d895 feat: 创建Job职位实体类和JobDao`
- `9d6eae3 feat: 实现职位发布Servlet`
- `7e77bc4 feat: 实现职位列表查询API，支持筛选`
- `04e3028 feat: 添加职位编辑和删除功能`
- `b6981e0 feat: 创建WorkloadStats统计服务类`
- `d5fd1ac feat: 实现MO处理工作量统计`
- `0989358 refactor: 统一职位发布校验并按有效状态返回列表`
- `83ea5a3 fix: 完善职位发布结构化校验`
- `b32f933 feat: 支持账号资料与用户名同步更新`

## 分工概述

`member3` 主要承担职位模块和校验逻辑：职位创建、列表筛选、编辑删除、结构化字段校验、职位有效状态处理。同时承担管理员/MO 工作量统计的一部分后端能力，并在后期补充账号资料同步更新。

## 当前对应代码文件

职位发布、职位列表、结构化字段和校验：

- `backend/src/com/example/tarecruitment/job/model/Job.java`
- `backend/src/com/example/tarecruitment/job/dao/JobDao.java`
- `backend/src/com/example/tarecruitment/job/mapper/JobRequestMapper.java`
- `backend/src/com/example/tarecruitment/job/mapper/JobResponseMapper.java`
- `backend/src/com/example/tarecruitment/job/service/JobService.java`
- `backend/src/com/example/tarecruitment/job/validator/JobValidator.java`
- `backend/src/com/example/tarecruitment/job/web/JobServlet.java`

账号资料同步：

- `backend/src/com/example/tarecruitment/profile/mapper/AccountProfileResponseMapper.java`
- `backend/src/com/example/tarecruitment/profile/service/AccountProfileService.java`
- `backend/src/com/example/tarecruitment/profile/validator/AccountProfileValidator.java`
- `backend/src/com/example/tarecruitment/profile/web/AccountProfileServlet.java`

工作量统计：

- `backend/src/com/example/tarecruitment/admin/service/WorkloadStatsService.java`
- `backend/src/com/example/tarecruitment/admin/web/WorkloadStatsServlet.java`

岗位匹配 AI 配置与调用客户端：

- `backend/src/com/example/tarecruitment/ai/client/MatchAnalysisAiConfig.java`
- `backend/src/com/example/tarecruitment/ai/client/DashScopeAnalysisClient.java`
- `backend/src/com/example/tarecruitment/ai/client/HttpAiSkillMatchClient.java`
- `backend/src/com/example/tarecruitment/ai/service/TaJobMatchAnalysisService.java`
- `backend/src/com/example/tarecruitment/ai/web/TaJobMatchAnalysisServlet.java`
- `backend/src/com/example/tarecruitment/ai/web/MoApplicationMatchAnalysisServlet.java`
- `frontend/webapp/WEB-INF/ai/match-analysis.properties.template`

相关公共能力：

- `backend/src/com/example/tarecruitment/common/search/FuzzySearchUtil.java`
- `backend/src/com/example/tarecruitment/common/storage/StoragePaths.java`
