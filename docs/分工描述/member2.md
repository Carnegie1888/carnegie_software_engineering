# member2 分工与当前代码文件

[返回总览](README.md)

## 基本信息

| 项目 | 内容 |
| --- | --- |
| Git author | `member2 <member2@edu.com>` |
| 标准提交数 | 19 |
| 最新标准提交 | `a00f6e9 feat: 接入 DeepSeek 推荐搜索服务` |
| 分工概述 | TA 档案与文件上传、数据路径/初始化稳定性、AI 推荐搜索与匹配服务 |

## Git 历史证据

- `22d8703 feat: 创建Applicant实体类和ApplicantDao`
- `ee7326a feat: 实现档案创建Servlet，支持基本信息存储`
- `2751fc3 feat: 实现简历文件上传功能`
- `98d6024 refactor: 优化文件写入与权限路径配置`
- `d9235c7 refactor: 按业务模块拆分本地数据文件路径`
- `26f40ce feat: 补齐默认演示账号并支持启动时自动初始化`
- `1e51b1d feat: 新增TA与MO岗位匹配分析服务接口`
- `a00f6e9 feat: 接入 DeepSeek 推荐搜索服务`

## 分工概述

`member2` 主要承担 TA 档案、简历/头像等资源上传、数据存储路径与演示账号初始化稳定性，并在后期负责 AI 推荐搜索与匹配分析接口的后端接入，包括 DeepSeek 相关配置和客户端。

## 当前对应代码文件

TA 档案、简历、头像与草稿资料：

- `backend/src/com/example/tarecruitment/profile/model/Applicant.java`
- `backend/src/com/example/tarecruitment/profile/dao/ApplicantDao.java`
- `backend/src/com/example/tarecruitment/profile/mapper/ApplicantProfileRequestMapper.java`
- `backend/src/com/example/tarecruitment/profile/mapper/ApplicantProfileResponseMapper.java`
- `backend/src/com/example/tarecruitment/profile/service/ApplicantProfileService.java`
- `backend/src/com/example/tarecruitment/profile/service/ProfileAssetService.java`
- `backend/src/com/example/tarecruitment/profile/validator/ApplicantProfileInput.java`
- `backend/src/com/example/tarecruitment/profile/validator/ApplicantProfileValidator.java`
- `backend/src/com/example/tarecruitment/profile/validator/ProfileAssetValidator.java`
- `backend/src/com/example/tarecruitment/profile/web/ApplicantProfileServlet.java`
- `backend/src/com/example/tarecruitment/profile/web/ApplicantAssetServlet.java`

本地数据路径、CSV 存储与演示数据：

- `backend/src/com/example/tarecruitment/common/storage/StoragePaths.java`
- `backend/src/com/example/tarecruitment/common/storage/CsvCodec.java`
- `backend/src/com/example/tarecruitment/demo/DemoAccountBootstrapListener.java`
- `backend/src/com/example/tarecruitment/demo/DemoDataSeeder.java`

DeepSeek 推荐搜索与 AI 搜索入口：

- `backend/src/com/example/tarecruitment/ai/client/DeepSeekAiConfig.java`
- `backend/src/com/example/tarecruitment/ai/client/DeepSeekApplicantSearchClient.java`
- `backend/src/com/example/tarecruitment/ai/client/DeepSeekTaJobSearchClient.java`
- `backend/src/com/example/tarecruitment/ai/client/DeepSeekChatClient.java`
- `backend/src/com/example/tarecruitment/ai/service/MoApplicantAiSearchService.java`
- `backend/src/com/example/tarecruitment/ai/service/TaJobAiSearchService.java`
- `backend/src/com/example/tarecruitment/ai/web/MoApplicantAiSearchServlet.java`
- `backend/src/com/example/tarecruitment/ai/web/TaJobAiSearchServlet.java`
- `frontend/webapp/WEB-INF/ai/deepseek.properties.template`

岗位匹配分析接口协作文件：

- `backend/src/com/example/tarecruitment/ai/service/TaJobMatchAnalysisService.java`
- `backend/src/com/example/tarecruitment/ai/web/TaJobMatchAnalysisServlet.java`
- `backend/src/com/example/tarecruitment/ai/web/MoApplicationMatchAnalysisServlet.java`
