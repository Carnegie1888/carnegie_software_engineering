# 职位管理模块技术文档

## 1. 模块概述

职位管理模块允许 MO (Module Owner) 创建、发布和管理职位，TA 可以浏览和搜索职位。

**核心组件**：
- `Job` - 职位实体
- `JobDao` - 数据访问层
- `JobServlet` - 职位 CRUD 操作
- 前端页面: `jsp/ta/job-list.jsp`, `jsp/ta/job-detail.jsp`, `jsp/mo/dashboard.jsp`

---

## 2. 实体设计

### 2.1 Job

**路径**: `backend/src/com/example/authlogin/model/Job.java`

```java
public class Job {
    private String jobId;                    // UUID
    private String moId;                     // 发布职位的 MO 用户ID
    private String moName;                    // MO 姓名
    private String title;                    // 职位标题
    private String courseCode;               // 课程代码
    private String courseName;               // 课程名称
    private String description;              // 职位描述
    private List<String> requiredSkills;    // 必需技能 (分号分隔)
    private int positions;                   // 职位数量
    private String workload;                 // 工作量 (如 "10小时/周")
    private String salary;                   // 薪资
    private LocalDateTime deadline;          // 申请截止日期
    private Status status;                   // OPEN / CLOSED / FILLED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum Status { OPEN, CLOSED, FILLED }
}
```

### 2.2 状态有效性

职位状态根据时间自动判断有效性：

```java
public Status getEffectiveStatus(LocalDateTime now) {
    if (status == Status.FILLED) return FILLED;      // 已招满优先
    if (status == Status.CLOSED) return CLOSED;       // 手动关闭优先
    if (deadline != null && deadline.isBefore(now)) return CLOSED;  // 过期自动关闭
    return OPEN;
}
```

### 2.3 CSV 格式

**文件**: `data/jobs/jobs.csv`

**表头**:
```csv
jobId,moId,moName,title,courseCode,courseName,description,requiredSkills,positions,workload,salary,deadline,status,createdAt,updatedAt
```

---

## 3. 数据访问层

### 3.1 JobDao

**路径**: `backend/src/com/example/authlogin/dao/JobDao.java`

**单例模式**: 是

**核心方法**:

| 方法 | 说明 |
|------|------|
| `findById(String jobId)` | 根据 ID 查找 |
| `findByMoId(String moId)` | 查找 MO 发布的所有职位 |
| `findByCourseCode(String courseCode)` | 根据课程代码查找 |
| `findByStatus(Status status)` | 根据状态筛选 (考虑有效性) |
| `findOpenJobs()` | 获取所有开放职位 |
| `findAll()` | 获取所有职位 |
| `save(Job job)` | 保存职位 |
| `create(Job job)` | 创建职位 |
| `update(Job job)` | 更新职位 |
| `delete(String jobId)` | 删除职位 |
| `search(String keyword)` | 关键词搜索职位 |
| `count()` | 职位总数 |
| `countOpenJobs()` | 开放职位数 |

**搜索实现**:
```java
public List<Job> search(String keyword) {
    return FuzzySearchUtil.search(readAllJobs(), keyword, job -> {
        List<String> fields = new ArrayList<>();
        fields.add(job.getTitle());
        fields.add(job.getCourseCode());
        fields.add(job.getCourseName());
        fields.add(job.getDescription());
        fields.add(job.getMoName());
        fields.add(String.join(" ", job.getRequiredSkills()));
        return fields;
    }).getItems();
}
```

---

## 4. Servlet 实现

### 4.1 JobServlet

**路径**: `backend/src/com/example/authlogin/servlet/JobServlet.java`

**端点**: `/job`

**支持的操作**:

| 操作 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 列表 | GET | `/job/list` | 获取职位列表 |
| 详情 | GET | `/job/view?id=xxx` | 获取职位详情 |
| 创建 | POST | `/job/create` | 创建职位 (MO) |
| 更新 | POST | `/job/update` | 更新职位 (MO) |
| 删除 | POST | `/job/delete` | 删除职位 (MO) |

#### GET /job/list

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| keyword | String | 搜索关键词 (可选) |
| status | String | 状态筛选 (可选) |

**响应**: JSON 数组

```json
[
    {
        "jobId": "uuid-123",
        "moId": "mo-456",
        "moName": "Prof. Smith",
        "title": "TA for CS101",
        "courseCode": "CS101",
        "courseName": "Introduction to Programming",
        "description": "Help students with...",
        "requiredSkills": ["Java", "Teaching"],
        "positions": 2,
        "workload": "10 hours/week",
        "salary": "£15/hour",
        "deadline": "2026-04-15T23:59:59",
        "effectiveStatus": "OPEN",
        "createdAt": "2026-03-01T10:00:00"
    }
]
```

#### GET /job/view

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| id | String | 是 | 职位 ID |

**响应**: JSON 对象

#### POST /job/create

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| title | String | 是 | 职位标题 |
| courseCode | String | 是 | 课程代码 |
| courseName | String | 否 | 课程名称 |
| description | String | 否 | 职位描述 |
| requiredSkills | String | 否 | 必需技能 (逗号分隔) |
| positions | Integer | 否 | 职位数量 (默认 1) |
| workload | String | 否 | 工作量 |
| salary | String | 否 | 薪资 |
| deadline | String | 否 | 截止日期 (ISO 格式) |

**权限**: 仅 MO

#### POST /job/update

**请求参数**: 同 create，需额外 `jobId` 参数

**权限**: 仅 MO (只能修改自己的职位)

#### POST /job/delete

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| jobId | String | 是 | 职位 ID |

**权限**: 仅 MO (只能删除自己的职位)

---

## 5. 前端页面

### 5.1 TA 职位列表页

**路径**: `frontend/webapp/jsp/ta/job-list.jsp`

**功能**:
- 职位列表展示
- 关键词搜索
- 状态筛选 (开放/已关闭)
- 分页 (可选)

```javascript
// 加载职位列表
async function loadJobs(keyword = '', status = 'OPEN') {
    let url = '/job/list';
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (status) params.append('status', status);
    if (params.toString()) url += '?' + params.toString();

    const response = await fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    return response.json();
}
```

### 5.2 TA 职位详情页

**路径**: `frontend/webapp/jsp/ta/job-detail.jsp`

**功能**:
- 职位详细信息展示
- 申请按钮
- 相似职位推荐 (可选)

### 5.3 MO 职位管理页

**路径**: `frontend/webapp/jsp/mo/dashboard.jsp`

**功能**:
- 创建新职位表单
- 已有职位列表
- 编辑/关闭/删除操作

---

## 6. 权限控制

| 操作 | TA | MO | ADMIN |
|------|----|----|-------|
| 浏览职位列表 | ✓ | ✓ | ✓ |
| 查看职位详情 | ✓ | ✓ | ✓ |
| 创建职位 | ✗ | ✓ (本人) | ✗ |
| 更新职位 | ✗ | ✓ (本人) | ✗ |
| 删除职位 | ✗ | ✓ (本人) | ✗ |
| 搜索职位 | ✓ | ✓ | ✓ |

---

## 7. 业务流程

### 7.1 MO 创建职位流程

```
MO 点击 "创建职位"
    │
    ▼
填写职位表单
    │
    ▼
点击提交 → POST /job/create
    │
    ▼
验证参数
    │
    ▼
创建 Job 对象
    │
    ▼
保存到 CSV
    │
    ▼
返回成功 → 刷新职位列表
```

### 7.2 职位状态流转

```
[创建] → OPEN
   │
   ├── 过期 → CLOSED (自动)
   │
   ├── 手动关闭 → CLOSED
   │
   ├── 招满 → FILLED
   │
   └── 删除 → (物理删除)
```

---

## 8. 模糊搜索

### 8.1 FuzzySearchUtil

**路径**: `backend/src/com/example/authlogin/util/FuzzySearchUtil.java`

**搜索策略**:
- 关键词拆分
- 大小写不敏感
- 部分匹配

**返回结果**:
```java
public class SearchOutcome<T> {
    private List<T> items;           // 匹配的项
    private Set<T> excluded;          // 不匹配的项
    private Map<T, Integer> scores;  // 匹配得分
    private String keyword;           // 原始关键词
}
```

---

## 9. 错误处理

| 错误场景 | 响应码 | 消息 |
|----------|--------|------|
| 职位不存在 | 404 | "Job not found" |
| 权限不足 | 403 | "Only MO can create jobs" |
| 参数验证失败 | 400 | 具体字段错误 |
| 服务器错误 | 500 | "Internal server error" |

---

## 10. 测试用例

**集成测试**: `backend/test/JobServletValidationTest.java`

**测试场景**:
1. MO 创建职位 → 职位正确保存
2. TA 浏览职位 → 看到正确列表
3. 职位过期 → 状态自动变为 CLOSED
4. MO 更新职位 → 更新生效
5. 非 MO 创建职位 → 返回 403
6. 关键词搜索 → 返回匹配结果
