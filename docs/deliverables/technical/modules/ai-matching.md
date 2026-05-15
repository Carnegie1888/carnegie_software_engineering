# AI 推荐与详情分析模块技术文档

## 1. 模块概述

AI 模块保留两类前端可见能力：

1. **详情分析**：TA 职位详情页和 MO 申请详情页调用 DashScope，生成结构化 AI 匹配分析。AI 不可用时返回 `503`，不生成本地普通匹配结果。
2. **推荐搜索**：TA 职位推荐和 MO 申请人推荐依赖 DeepSeek。AI 不可用时返回不可用提示，不生成本地假推荐。

独立 MO AI 匹配页面和对应 API 已移除。

**核心组件**：
- `DashScopeAnalysisClient` - 详情分析 AI 客户端
- `MatchAnalysisAiConfig` - 详情分析配置
- `DeepSeekAiConfig` - DeepSeek 推荐搜索配置
- `DeepSeekApplicantSearchClient` - MO 申请人推荐客户端
- `DeepSeekTaJobSearchClient` - TA 职位推荐客户端
- `TaJobMatchAnalysisService` - 详情分析服务
- `MoApplicantAiSearchService` - MO 申请人推荐服务
- `TaJobAiSearchService` - TA 职位推荐服务

---

## 2. 分层架构

```text
AI Servlets
  -> AI Services
      -> prompt building / privacy filtering / result mapping
      -> DashScopeAnalysisClient or DeepSeek...Client
  -> ApiResponses
```

| 层次 | 职责 |
|------|------|
| `ai/web` | 校验当前用户角色、读取参数、加载领域对象、写统一 JSON |
| `ai/service` | 构造上下文、脱敏、结果整理和推荐业务规则 |
| `ai/client` | 读取配置、调用外部 AI API、解析返回文本 |
| `common/api` | 统一维护 `/api/...` 路由常量 |

---

## 3. API

| 功能 | Method | Path | 权限 |
|------|--------|------|------|
| MO 申请人推荐 | POST | `/api/mo/applicant-recommendations` | MO |
| MO 单申请匹配分析 | POST | `/api/mo/application-match-analyses` | MO |
| TA 职位推荐 | POST | `/api/ta/job-recommendations` | TA |
| TA 职位匹配分析 | POST | `/api/ta/job-match-analyses` | TA |

### 3.1 TA 职位匹配分析

**Servlet**: `TaJobMatchAnalysisServlet`

请求参数：

| 参数 | 必需 | 说明 |
|------|------|------|
| `jobId` | 是 | 需要分析的职位 ID |

该接口会读取当前登录 TA 的档案，不接受前端传入 `applicantId`。

### 3.2 MO 单申请匹配分析

**Servlet**: `MoApplicationMatchAnalysisServlet`

请求参数：

| 参数 | 必需 | 说明 |
|------|------|------|
| `applicationId` | 是 | 申请 ID |

MO 只能分析自己职位下的申请。

### 3.3 推荐搜索

`MoApplicantAiSearchServlet` 和 `TaJobAiSearchServlet` 都使用 DeepSeek 客户端：

- MO 推荐需要 `jobId`，可选 `query`。
- TA 推荐可选 `query`，后端会排除已申请职位和非开放职位。
- DeepSeek 不可用时返回 `503`，前端显示“AI 暂不可用”。

---

## 4. 详情分析服务

### 4.1 TaJobMatchAnalysisService

**路径**: `backend/src/com/example/tarecruitment/ai/service/TaJobMatchAnalysisService.java`

职责：

- 从 `Job`、`Applicant` 和可选 cover letter 构造白名单上下文。
- 对邮箱、电话、学号等敏感信息做脱敏。
- 调用 `DashScopeAnalysisClient` 获取结构化分析。
- AI 不可用或返回格式异常时抛出不可用异常，由 Servlet 返回 `503`。

返回数据包含：

```json
{
  "overallScore": 85,
  "matchLevel": "HIGH",
  "summary": "你的技能与岗位核心要求整体匹配度较高...",
  "strengths": [],
  "risks": [],
  "suggestions": [],
  "jobEvidence": [],
  "profileEvidence": []
}
```

---

## 5. 配置

### 5.1 详情分析

模板文件：

```text
frontend/webapp/WEB-INF/ai/match-analysis.properties.template
```

本地配置文件：

```text
frontend/webapp/WEB-INF/ai/match-analysis.local.properties
```

`MatchAnalysisAiConfig` 支持从本地配置、System Property 和环境变量读取配置。

### 5.2 DeepSeek 推荐搜索

模板文件：

```text
frontend/webapp/WEB-INF/ai/deepseek.properties.template
```

本地配置文件：

```text
frontend/webapp/WEB-INF/ai/deepseek.local.properties
```

`DeepSeekAiConfig` 的读取优先级是：本地 properties 文件、System Property、Environment Variable。

---

## 6. 前端调用方式

所有 AI API URL 都通过 `TARecruitment.routes` 生成。

MO 单申请分析：

```javascript
TARecruitment.api.request(TARecruitment.routes.mo.applicationMatchAnalyses(), {
    method: "POST",
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ applicationId: applicationId }).toString()
});
```

TA 职位推荐：

```javascript
TARecruitment.api.request(TARecruitment.routes.ta.jobRecommendations(), {
    method: "POST",
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ query: query }).toString()
});
```

---

## 7. 错误处理

| 场景 | 响应 |
|------|------|
| 未登录 | 401 JSON |
| 角色不匹配 | 403 JSON |
| 缺少 `jobId` 或 `applicationId` | 400 JSON |
| 职位、申请或档案不存在 | 404 JSON |
| DashScope 分析不可用 | 503 JSON，不返回本地普通匹配结果 |
| DeepSeek 推荐不可用 | 503 JSON，不返回本地假推荐 |

---

## 8. 测试

推荐检查：

```bash
./scripts/test.sh
./scripts/javadocs.sh
```
