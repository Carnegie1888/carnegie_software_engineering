# AI 技能匹配模块技术文档

## 1. 模块概述

AI 技能匹配模块为 MO 提供智能化的候选人筛选功能，通过分析职位要求与申请人档案的匹配度，生成匹配分数和详细分析报告。

**核心组件**：
- `AiSkillMatchClient` - AI 客户端接口
- `TongyiXiaomiAnalysisClient` - 通义 & 小米 AI 分析客户端
- `HttpAiSkillMatchClient` - HTTP AI 客户端实现
- `SkillMatchService` - 技能匹配服务 (本地算法)
- `TaJobMatchAnalysisService` - TA 职位匹配分析服务
- `TaJobMatchAnalysisServlet` - TA 匹配分析 API
- `MoApplicationMatchAnalysisServlet` - MO 申请匹配分析 API
- 前端页面: `jsp/mo/ai-skill-match.jsp`

---

## 2. 架构设计

### 2.1 分层架构

```
┌─────────────────────────────────────────┐
│        TaJobMatchAnalysisServlet        │
│         MoApplicationMatchAnalysisServlet │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│       TaJobMatchAnalysisService         │
│   (核心分析逻辑, 负责构造 AI 提示词)       │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────────┐  ┌─────────────────────────┐
│ TongyiXiaomi     │  │   SkillMatchService     │
│ AnalysisClient   │  │   (本地关键词匹配算法)    │
└────────┬─────────┘  └─────────────────────────┘
         │                    ▲
         ▼                    │
┌──────────────────┐          │
│   DashScope API  │──────────┘
│   (外部 AI 服务)  │  (AI 不可用时回退)
└──────────────────┘
```

### 2.2 设计原则

1. **AI 不可用时稳定回退**：当 AI 服务不可用时，自动回退到本地关键词匹配算法
2. **敏感信息脱敏**：在发送给 AI 前对申请人敏感信息进行脱敏处理
3. **结果缓存**：使用内存缓存避免重复计算
4. **白名单字段**：仅使用白名单中的字段构造 AI 上下文

---

## 3. 核心接口

### 3.1 AiSkillMatchClient

**路径**: `backend/src/com/example/authlogin/service/ai/AiSkillMatchClient.java`

```java
public interface AiSkillMatchClient {

    class AiScoreResult {
        private final double score;      // 0-100
        private final String reason;    // 评分原因

        public AiScoreResult(double score, String reason) { ... }
        public double getScore() { return score; }
        public String getReason() { return reason; }
    }

    Optional<AiScoreResult> score(
        List<String> requiredKeywords,    // 岗位关键词
        List<String> applicantKeywords   // 申请人关键词
    );
}
```

### 3.2 TongyiXiaomiAnalysisClient

**路径**: `backend/src/com/example/authlogin/service/ai/TongyiXiaomiAnalysisClient.java`

实现与通义千问 / 小米 AI 的集成。

**配置** (通过 `ta-job-match.properties`):
```properties
api.key=your-api-key
api.url=https://api.dashscope.cn/v1/services/aigc/text-generation/generation
model=qwen-turbo
```

---

## 4. 本地匹配算法

### 4.1 SkillMatchService

**路径**: `backend/src/com/example/authlogin/service/SkillMatchService.java`

#### 技能匹配 (基础)

```java
public SkillMatchResult matchSkills(
    List<String> requiredSkills,    // 岗位要求技能
    List<String> applicantSkills    // 申请人技能
) {
    // 1. 归一化技能列表 (大小写/空白处理)
    List<String> normalizedRequired = normalizeSkillList(requiredSkills);
    List<String> normalizedApplicant = normalizeSkillList(applicantSkills);

    // 2. 计算交集
    Set<String> requiredSet = new LinkedHashSet<>(normalizedRequired);
    Set<String> applicantSet = new LinkedHashSet<>(normalizedApplicant);

    List<String> matched = new ArrayList<>();
    List<String> missing = new ArrayList<>();

    for (String required : requiredSet) {
        if (applicantSet.contains(required)) {
            matched.add(required);
        } else {
            missing.add(required);
        }
    }

    // 3. 计算分数
    double score = requiredSet.isEmpty() ? 100.0 :
                   (matched.size() * 100.0) / requiredSet.size();

    return new SkillMatchResult(score, level, matched, missing, ...);
}
```

#### 关键词匹配 (增强)

在技能匹配基础上，增加关键词文本匹配：

```java
public SkillMatchResult matchByKeywords(
    List<String> requiredSkills,
    String jobContext,           // 岗位描述等文本
    List<String> applicantSkills,
    String applicantContext      // 申请人经历等文本
) {
    // 1. 从文本中提取关键词
    Set<String> requiredKeywords = buildKeywordSet(requiredSkills, jobContext);
    Set<String> applicantKeywords = buildKeywordSet(applicantSkills, applicantContext);

    // 2. 计算关键词匹配分
    double keywordScore = (matchedKeywords.size() * 100.0) / requiredKeywordSet.size();

    // 3. 加权融合
    double finalScore = skillScore * 0.7 + keywordScore * 0.3;

    return result;
}
```

#### AI 增强 (可选)

```java
public SkillMatchResult matchWithAi(...) {
    // 1. 先执行本地匹配
    SkillMatchResult baseResult = matchByKeywords(...);

    // 2. 调用 AI 获取评分
    Optional<AiScoreResult> aiResult = aiClient.score(requiredKeywords, applicantKeywords);

    // 3. 加权融合 (本地 60% + AI 40%)
    double finalScore = baseResult.getScore() * 0.6 + aiResult.getScore() * 0.4;

    return result;
}
```

### 4.2 匹配等级

| 分数范围 | 等级 |
|----------|------|
| 85-100 | HIGH |
| 60-84 | MEDIUM |
| 1-59 | LOW |
| 0 | NONE |

---

## 5. TA 职位匹配分析服务

### 5.1 TaJobMatchAnalysisService

**路径**: `backend/src/com/example/authlogin/service/TaJobMatchAnalysisService.java`

这是面向 TA 的完整匹配分析服务，包括：
- 档案脱敏处理
- AI 提示词构造
- 回退策略
- 完整分析报告生成

#### 敏感信息脱敏

在发送给 AI 前，自动脱敏以下信息：
- 邮箱地址 → `[已脱敏邮箱]`
- 手机号码 → `[已脱敏手机号]`
- 学号 → `[已脱敏学号]`

```java
private static final Pattern EMAIL_PATTERN = Pattern.compile(
    "(?i)[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}");
private static final Pattern PHONE_PATTERN = Pattern.compile(
    "(?<!\\d)(?:\\+?86[-\\s]?)?1\\d{10}(?!\\d)");
private static final Pattern STUDENT_ID_PATTERN = Pattern.compile(
    "(?<!\\d)(?:20\\d{8}|\\d{8,10})(?!\\d)");
```

#### AI 提示词构造

**System Prompt**:
```
你是 TA 岗位匹配分析助手。
请基于岗位信息和候选人非敏感档案做客观评估，输出中文结论。
你必须且只能返回 JSON 对象，禁止输出 Markdown、代码块或额外解释。
JSON 必须包含以下键：
overallScore(0-100整数), matchLevel(HIGH|MEDIUM|LOW), summary(字符串),
strengths(字符串数组), risks(字符串数组), suggestions(字符串数组),
jobEvidence(字符串数组), profileEvidence(字符串数组)。
不得推测、不得输出姓名/学号/电话/邮箱等敏感信息。
```

**User Prompt**:
```
岗位信息：
- title: {职位标题}
- courseCode: {课程代码}
- courseName: {课程名称}
- positions: {职位数量}
- workload: {工作量}
- deadline: {截止日期}
- description: {职位描述}
- requiredSkills: {必需技能}

候选人档案（已做白名单和脱敏处理）：
- department: {院系}
- program: {项目}
- gpa: {GPA}
- skills: {技能列表}
- experience: {经历}
- motivation: {动机}
- coverLetter: {求职信}
```

#### 分析结果

```java
public static final class AnalysisResult {
    private final int overallScore;       // 0-100
    private final String matchLevel;      // HIGH/MEDIUM/LOW
    private final String summary;          // 总评摘要
    private final List<String> strengths; // 优势列表
    private final List<String> risks;      // 风险列表
    private final List<String> suggestions; // 建议列表
    private final List<String> jobEvidence;    // 岗位证据
    private final List<String> profileEvidence; // 档案证据
    private final boolean fallback;        // 是否为回退结果
    private final String fallbackReason;    // 回退原因
}
```

#### 回退策略

当 AI 服务不可用时，自动回退到本地算法并生成友好提示：

```
Summary: "你的技能与岗位核心要求整体匹配度较高，建议在申请材料中突出相关经历与可投入时间。"
Strengths:
- "已匹配岗位技能：Java、Python"
- "当前 GPA 信息可用：3.8"
- "相关经历摘要：曾在 CS101 担任助教..."
Risks:
- "仍缺少部分岗位技能：Machine Learning"
- "缺少可验证的相关经历描述，面试阶段建议重点核验。"
Suggestions:
- "优先补充以下技能案例或学习计划：Machine Learning"
- "在求职信中用量化结果说明与你匹配的课程经验。"
```

---

## 6. Servlet API

### 6.1 TaJobMatchAnalysisServlet

**路径**: `backend/src/com/example/authlogin/servlet/TaJobMatchAnalysisServlet.java`

**端点**: `/api/ta/skill-match`

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| jobId | String | 是 | 职位 ID |
| applicantId | String | 是 | 申请人 ID |
| coverLetter | String | 否 | 求职信 |

**响应**: JSON

```json
{
    "overallScore": 85,
    "matchLevel": "HIGH",
    "summary": "你的技能与岗位核心要求整体匹配度较高...",
    "strengths": ["已匹配岗位技能：Java、Python", ...],
    "risks": ["仍缺少部分岗位技能：Machine Learning", ...],
    "suggestions": [...],
    "jobEvidence": [...],
    "profileEvidence": [...],
    "fallback": false,
    "fallbackReason": ""
}
```

**权限**: TA

### 6.2 MoApplicationMatchAnalysisServlet

**路径**: `backend/src/com/example/authlogin/servlet/MoApplicationMatchAnalysisServlet.java`

**端点**: `/api/mo/skill-match`

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| applicationId | String | 是 | 申请 ID |

**响应**: 同上

**权限**: MO

### 6.3 SkillMatchServlet

**路径**: `backend/src/com/example/authlogin/servlet/SkillMatchServlet.java`

**端点**: `/api/mo/skill-match/batch`

**批量分析**: 对职位下的所有申请进行匹配分析

---

## 7. 前端页面

### 7.1 AI 技能匹配页

**路径**: `frontend/webapp/jsp/mo/ai-skill-match.jsp`

**功能**:
1. 选择职位
2. 查看该职位的所有申请列表
3. 查看每个申请人的匹配分析结果
4. 按匹配分数排序
5. 一键查看 Top 候选人

```javascript
// 获取职位的申请匹配分析
async function analyzeJobApplications(jobId) {
    const response = await fetch(`/api/mo/skill-match/batch?jobId=${jobId}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    return response.json();
}
```

### 7.2 匹配结果展示

```javascript
// 展示匹配结果
function displayMatchResult(result) {
    const score = result.overallScore;
    const level = result.matchLevel;

    // 分数展示
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;

    // 颜色编码
    const color = level === 'HIGH' ? 'green' :
                  level === 'MEDIUM' ? 'orange' : 'red';
    document.getElementById('score').style.color = color;

    // 优势/风险/建议
    displayList('strengths', result.strengths);
    displayList('risks', result.risks);
    displayList('suggestions', result.suggestions);
}
```

---

## 8. 缓存机制

### 8.1 缓存配置

```java
private static final long DEFAULT_CACHE_TTL_MILLIS = 5 * 60 * 1000L;  // 5分钟
private static final int CACHE_MAX_ENTRIES = 1000;

private final ConcurrentMap<String, CacheEntry> resultCache;
```

### 8.2 缓存 Key 构造

```java
private String buildCacheKey(String mode,
                             List<String> requiredSkills,
                             String jobContext,
                             List<String> applicantSkills,
                             String applicantContext) {
    // 归一化后拼接
    return mode + "|" + normalizedSkills + "|" + normalizedContext + "...";
}
```

---

## 9. 配置

### 9.1 AI 配置文件

**模板文件**: `frontend/webapp/WEB-INF/ai/ta-job-match.properties.template`

```properties
# DashScope API 配置
api.key=your-api-key-here
api.url=https://api.dashscope.cn/v1/services/aigc/text-generation/generation
model=qwen-turbo

# 备用配置
# api.key.backup=backup-api-key
# fallback.enabled=true
```

### 9.2 环境变量

也可以通过环境变量配置：
- `DASHSCOPE_API_KEY`
- `TA_AI_API_URL`
- `TA_AI_MODEL`

---

## 10. 错误处理

| 错误场景 | 响应 | 处理 |
|----------|------|------|
| AI 服务超时 | 回退到本地算法 | 继续返回结果 |
| AI 返回格式错误 | 回退到本地算法 | 记录日志 |
| 申请人档案不存在 | 400 | 返回错误消息 |
| 职位不存在 | 404 | 返回错误消息 |
| 权限不足 | 403 | 返回错误消息 |

---

## 11. 测试用例

**集成测试**: `backend/test/SkillMatchServiceTest.java`, `backend/test/TaJobMatchAnalysisServiceTest.java`

**测试场景**:
1. 技能完全匹配 → 100分, HIGH
2. 技能部分匹配 → 60分, MEDIUM
3. 技能无匹配 → 0分, NONE
4. AI 不可用 → 回退到本地算法
5. 敏感信息脱敏 → 邮箱/电话/学号被替换
6. 缓存命中 → 不调用 AI
