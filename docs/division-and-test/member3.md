# member3 分工与当前代码文件

[返回总览](Overview.md)

## 基本信息

| 项目 | 内容 |
| --- | --- |
| Git author | `member3 <member3@edu.com>` |
| 标准提交数 | 19 |
| 分工概述 | 职位发布/查询/校验、工作量统计接口、账号资料同步、AI 配置模板 |

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
- `backend/src/com/example/tarecruitment/ai/service/TaJobMatchAnalysisService.java`
- `backend/src/com/example/tarecruitment/ai/web/TaJobMatchAnalysisServlet.java`
- `backend/src/com/example/tarecruitment/ai/web/MoApplicationMatchAnalysisServlet.java`
- `frontend/webapp/WEB-INF/ai/match-analysis.properties.template`

相关公共能力：

- `backend/src/com/example/tarecruitment/common/search/FuzzySearchUtil.java`
- `backend/src/com/example/tarecruitment/common/storage/StoragePaths.java`

## 测试展示

运行命令：

```bash
./scripts/test/test-member3.sh
```

测试代码：

- `backend/test/Member3BackendTest.java`

测试覆盖点：

- `JobValidator` 是否接受合法职位，并拒绝危险标题、重复技能和错误分隔符。
- `Job` 的有效状态是否能根据截止时间从 `OPEN` 自动转为 `CLOSED`。
- `JobDao` 是否能创建职位、搜索职位字段并更新职位状态。
- `AccountProfileValidator` 是否能校验用户名、TA 实名和上传文件名。
- `MatchAnalysisAiConfig` 在 API key 是占位符或超时配置非法时是否安全降级。

答辩时可以这样解释：

`member3` 的测试重点是职位发布、结构化校验和账号资料同步。测试不仅验证“能创建职位”，也验证错误输入会被后端挡住，例如重复技能、危险 HTML 和非法用户名。这样可以说明职位模块不是只靠前端限制，而是后端也有规则兜底。
