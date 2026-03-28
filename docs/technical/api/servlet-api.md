# Servlet API 接口文档

## 1. 概述

本文档列出系统中所有 Servlet 端点的详细规格，包括请求格式、响应格式和权限要求。

**基础 URL**: `http://localhost:8080/groupproject`

**认证方式**: Session-based (登录后自动获得 Session)

**通用响应格式**:
```json
// 成功
{ "success": true, "data": {...} }

// 失败
{ "success": false, "error": "ErrorType", "message": "错误描述" }
```

**AJAX 要求**: 对于 API 端点，建议在请求头中添加:
```
X-Requested-With: XMLHttpRequest
```

---

## 2. 认证相关 API

### 2.1 登录

**端点**: `POST /login`

**权限**: 公开

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| username | String | 是 | 用户名或邮箱 |
| password | String | 是 | 密码 |

**响应 (成功)**: 重定向到仪表盘

**响应 (失败)**: Forward 到 login.jsp，带错误消息

---

### 2.2 注册

**端点**: `POST /register`

**权限**: 公开 (TA, MO)

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| username | String | 是 | 用户名 (3-50字符) |
| email | String | 是 | 邮箱 |
| password | String | 是 | 密码 (至少8字符) |
| confirmPassword | String | 是 | 确认密码 |
| role | String | 是 | TA 或 MO |

**响应 (成功)**: 重定向到仪表盘

**响应 (失败)**: Forward 到 register.jsp，带错误消息

---

### 2.3 登出

**端点**: `GET /logout`

**权限**: 需登录

**响应**: 重定向到 login.jsp

---

## 3. 用户档案 API

### 3.1 获取/创建申请人档案

**端点**: `GET /applicant`

**权限**: TA, MO, ADMIN

**响应**:
```json
{
    "applicantId": "uuid",
    "userId": "user-uuid",
    "fullName": "John Doe",
    "studentId": "2020123456",
    "department": "Computer Science",
    "program": "Master",
    "gpa": "3.8",
    "skills": ["Java", "Python"],
    "resumePath": "/file/resume/uuid_resume.pdf",
    "photoPath": "/file/photo/uuid_photo.jpg"
}
```

---

### 3.2 保存申请人档案

**端点**: `POST /applicant`

**权限**: TA, MO, ADMIN (仅本人)

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| fullName | String | 是 | 姓名 |
| studentId | String | 是 | 学号 |
| department | String | 是 | 院系 |
| program | String | 是 | 项目 |
| gpa | String | 否 | GPA |
| skills | String | 否 | 技能 (逗号分隔) |
| phone | String | 否 | 电话 |
| address | String | 否 | 地址 |
| experience | String | 否 | 经历 |
| motivation | String | 否 | 动机 |

**响应**:
```json
{ "success": true }
```

---

## 4. 职位 API

### 4.1 获取职位列表

**端点**: `GET /job/list`

**权限**: 公开

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| keyword | String | 搜索关键词 |
| status | String | OPEN/CLOSED/FILLED |

**响应**:
```json
[
    {
        "jobId": "uuid",
        "moId": "mo-uuid",
        "moName": "Prof. Smith",
        "title": "TA for CS101",
        "courseCode": "CS101",
        "courseName": "Introduction to Programming",
        "requiredSkills": ["Java"],
        "positions": 2,
        "workload": "10 hours/week",
        "salary": "£15/hour",
        "deadline": "2026-04-15T23:59:59",
        "effectiveStatus": "OPEN"
    }
]
```

---

### 4.2 获取职位详情

**端点**: `GET /job/view`

**权限**: 公开

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| id | String | 是 | 职位 ID |

**响应**:
```json
{
    "jobId": "uuid",
    "moId": "mo-uuid",
    "moName": "Prof. Smith",
    "title": "TA for CS101",
    "courseCode": "CS101",
    "courseName": "Introduction to Programming",
    "description": "Help students...",
    "requiredSkills": ["Java", "Python"],
    "positions": 2,
    "workload": "10 hours/week",
    "salary": "£15/hour",
    "deadline": "2026-04-15T23:59:59",
    "effectiveStatus": "OPEN",
    "createdAt": "2026-03-01T10:00:00"
}
```

---

### 4.3 创建职位

**端点**: `POST /job/create`

**权限**: MO

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| title | String | 是 | 职位标题 |
| courseCode | String | 是 | 课程代码 |
| courseName | String | 否 | 课程名称 |
| description | String | 否 | 职位描述 |
| requiredSkills | String | 否 | 必需技能 (逗号分隔) |
| positions | Integer | 否 | 职位数量 (默认1) |
| workload | String | 否 | 工作量 |
| salary | String | 否 | 薪资 |
| deadline | String | 否 | 截止日期 (ISO格式) |

**响应**:
```json
{ "success": true, "jobId": "new-uuid" }
```

---

### 4.4 更新职位

**端点**: `POST /job/update`

**权限**: MO (仅本人职位)

**请求参数**: 同创建，需额外 `jobId`

---

### 4.5 删除职位

**端点**: `POST /job/delete`

**权限**: MO (仅本人职位)

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| jobId | String | 是 | 职位 ID |

---

## 5. 申请 API

### 5.1 提交申请

**端点**: `POST /apply`

**权限**: TA

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| jobId | String | 是 | 职位 ID |
| coverLetter | String | 否 | 求职信 |

**响应**:
```json
{ "success": true, "applicationId": "new-uuid" }
```

---

### 5.2 取消申请

**端点**: `POST /apply/cancel`

**权限**: TA (仅本人，PENDING状态)

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| applicationId | String | 是 | 申请 ID |

---

### 5.3 更新申请进度

**端点**: `POST /apply/progress`

**权限**: MO (仅本人职位收到的申请)

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| applicationId | String | 是 | 申请 ID |
| progressStage | String | 是 | SUBMITTED/UNDER_REVIEW/INTERVIEW_SCHEDULED/COMPLETED |

---

### 5.4 审核决定

**端点**: `POST /apply/review`

**权限**: MO (仅本人职位收到的申请)

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| applicationId | String | 是 | 申请 ID |
| status | String | 是 | ACCEPTED/REJECTED |
| interviewNotes | String | 否 | 面试备注 |

---

## 6. AI 匹配 API

### 6.1 TA 技能匹配分析

**端点**: `GET /api/ta/skill-match`

**权限**: TA

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| jobId | String | 是 | 职位 ID |
| applicantId | String | 是 | 申请人 ID |
| coverLetter | String | 否 | 求职信 |

**响应**:
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

---

### 6.2 MO 申请匹配分析

**端点**: `GET /api/mo/skill-match`

**权限**: MO

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| applicationId | String | 是 | 申请 ID |

**响应**: 同上

---

### 6.3 批量申请匹配

**端点**: `GET /api/mo/skill-match/batch`

**权限**: MO

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| jobId | String | 是 | 职位 ID |

**响应**:
```json
[
    {
        "applicationId": "app-uuid",
        "applicantName": "John Doe",
        "score": 85,
        "level": "HIGH",
        "summary": "..."
    },
    ...
]
```

---

## 7. 管理员 API

### 7.1 工作量统计

**端点**: `GET /api/admin/stats`

**权限**: ADMIN

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| type | String | system / mo / ta |
| userId | String | 当 type=mo 或 type=ta 时必需 |

**响应 (system)**:
```json
{
    "type": "system",
    "totalUsers": 25,
    "totalTA": 15,
    "totalMO": 8,
    "totalAdmin": 2,
    "totalJobs": 12,
    "totalApplications": 150
}
```

---

### 7.2 创建邀请

**端点**: `POST /api/admin/invite`

**权限**: ADMIN

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| email | String | 是 | 被邀请邮箱 |
| role | String | 是 | MO 或 ADMIN |
| baseUrl | String | 是 | 系统基础 URL |

---

### 7.3 获取邀请列表

**端点**: `GET /api/admin/invite`

**权限**: ADMIN

**响应**:
```json
[
    {
        "inviteId": "uuid",
        "email": "prof.smith@university.edu",
        "role": "MO",
        "status": "PENDING",
        "createdAt": "2026-03-20T10:00:00",
        "expiresAt": "2026-03-27T10:00:00"
    }
]
```

---

### 7.4 验证邀请 Token

**端点**: `GET /api/admin/invite/validate`

**权限**: 公开

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| token | String | 是 | 邀请 Token |

**响应**:
```json
{
    "valid": true,
    "email": "prof.smith@university.edu",
    "role": "MO",
    "expiresAt": "2026-03-27T10:00:00"
}
```

---

### 7.5 接受邀请并注册

**端点**: `POST /api/admin/invite/accept`

**权限**: 公开

**请求参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| token | String | 是 | 邀请 Token |
| username | String | 是 | 用户名 |
| password | String | 是 | 密码 |
| confirmPassword | String | 是 | 确认密码 |

---

## 8. 文件访问 API

### 8.1 简历访问

**端点**: `GET /file/resume/{filename}`

**权限**: TA (仅本人), MO (申请人的)

### 8.2 头像访问

**端点**: `GET /file/photo/{filename}`

**权限**: 需登录

---

## 9. 错误码

| HTTP 状态码 | 错误类型 | 说明 |
|-------------|----------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未登录 |
| 403 | FORBIDDEN | 无权限 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突 (如重复申请) |
| 500 | INTERNAL_ERROR | 服务器错误 |
