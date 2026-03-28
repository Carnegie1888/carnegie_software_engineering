# TA 档案管理模块技术文档

## 1. 模块概述

TA 档案管理模块允许 TA 申请人创建和管理个人档案，包括基本信息、技能、简历和头像。

**核心组件**：
- `Applicant` - 申请人档案实体
- `ApplicantDao` - 数据访问层
- `ApplicantServlet` - 档案 CRUD 操作
- `ApplicantAccessServlet` - 头像访问
- 前端页面: `jsp/ta/dashboard.jsp`

---

## 2. 实体设计

### 2.1 Applicant

**路径**: `backend/src/com/example/authlogin/model/Applicant.java`

```java
public class Applicant {
    private String applicantId;       // UUID
    private String userId;            // 关联的 User ID
    private String fullName;          // 姓名
    private String studentId;         // 学号
    private String department;        // 院系
    private String program;           // 本科/硕士/博士
    private String gpa;              // GPA
    private List<String> skills;     // 技能列表 (分号分隔)
    private String resumePath;        // 简历文件路径
    private String photoPath;         // 头像文件路径
    private String phone;             // 电话
    private String address;           // 地址
    private String experience;        // 相关经验
    private String motivation;        // 申请动机
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 2.2 CSV 格式

**文件**: `data/applicants/applicants.csv`

**表头**:
```csv
applicantId,userId,fullName,studentId,department,program,gpa,skills,resumePath,photoPath,phone,address,experience,motivation,createdAt,updatedAt
```

**示例**:
```csv
uuid-123,user-456,John Doe,2020123456,Computer Science,Master,3.8,Java;Python;Machine Learning,,photo.jpg,1234567890,London,2 years TA experience,Want to help students
```

---

## 3. 数据访问层

### 3.1 ApplicantDao

**路径**: `backend/src/com/example/authlogin/dao/ApplicantDao.java`

**单例模式**: 是

**核心方法**:

| 方法 | 说明 |
|------|------|
| `findById(String applicantId)` | 根据 ID 查找 |
| `findByUserId(String userId)` | 根据用户 ID 查找 (关联查询) |
| `findAll()` | 获取所有档案 |
| `save(Applicant applicant)` | 保存档案 (新建或更新) |
| `create(Applicant applicant)` | 创建档案 |
| `update(Applicant applicant)` | 更新档案 |
| `delete(String applicantId)` | 删除档案 |

**关联查询实现**:
```java
public Optional<Applicant> findByUserId(String userId) {
    return readAllApplicants().stream()
        .filter(a -> a.getUserId().equals(userId))
        .findFirst();
}

public Optional<Applicant> findByUserIdOrCreate(String userId) {
    Optional<Applicant> existing = findByUserId(userId);
    if (existing.isPresent()) {
        return existing;
    }
    // 不自动创建，返回空
    return Optional.empty();
}
```

---

## 4. Servlet 实现

### 4.1 ApplicantServlet

**路径**: `backend/src/com/example/authlogin/servlet/ApplicantServlet.java`

**端点**: `/applicant`

**支持的方法**:
- `GET` - 获取当前用户档案
- `POST` - 创建/更新档案

#### GET 处理

```
GET /applicant
    │
    ▼
获取当前登录用户
    │
    ▼
调用 applicantDao.findByUserId(user.getUserId())
    │
    ├── 档案存在 → JSON 返回档案数据
    │
    └── 档案不存在 → JSON 返回 null 或自动创建
```

**响应格式** (JSON):
```json
{
    "applicantId": "uuid-123",
    "userId": "user-456",
    "fullName": "John Doe",
    "studentId": "2020123456",
    "department": "Computer Science",
    "program": "Master",
    "gpa": "3.8",
    "skills": ["Java", "Python", "Machine Learning"],
    "resumePath": "/file/resume/resume.pdf",
    "photoPath": "/file/photo/photo.jpg",
    "phone": "1234567890",
    "address": "London",
    "experience": "2 years TA experience",
    "motivation": "Want to help students"
}
```

#### POST 处理 (创建/更新)

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
| experience | String | 否 | 经验 |
| motivation | String | 否 | 动机 |

**处理流程**:
```
POST /applicant
    │
    ▼
验证必需参数
    │
    ▼
获取或创建 Applicant 对象
    │
    ▼
设置字段值
    │
    ▼
调用 applicantDao.save(applicant)
    │
    ▼
返回 JSON 响应
```

---

## 5. 头像与简历上传

### 5.1 文件存储

**头像目录**: `{DATA_DIR}/photos/`
**简历目录**: `{DATA_DIR}/resumes/`

**文件名生成**:
```java
String extension = FilenameUtils.getExtension(originalFilename);
String newFilename = userId + "_photo_" + System.currentTimeMillis() + "." + extension;
String newFilename = userId + "_resume_" + System.currentTimeMillis() + "." + extension;
```

### 5.2 ApplicantAccessServlet

**路径**: `backend/src/com/example/authlogin/servlet/ApplicantAccessServlet.java`

**端点**: `/profile/*`

**功能**:
- 头像访问: `/profile/photo/{filename}`
- 简历访问: `/profile/resume/{filename}`

**安全检查**:
- 验证用户是否登录
- 验证文件是否属于当前用户

### 5.3 文件类型验证

```java
// 头像验证
private boolean isValidImage(String filename) {
    String ext = FilenameUtils.getExtension(filename).toLowerCase();
    return Arrays.asList("jpg", "jpeg", "png", "gif").contains(ext);
}

// 简历验证
private boolean isValidResume(String filename) {
    String ext = FilenameUtils.getExtension(filename).toLowerCase();
    return "pdf".equals(ext);
}
```

---

## 6. 前端页面

### 6.1 dashboard.jsp

**路径**: `frontend/webapp/jsp/ta/dashboard.jsp`

**功能区域**:
1. **档案信息展示/编辑**
   - 基本信息表单
   - 技能标签
2. **简历上传**
   - PDF 文件上传
   - 上传状态显示
3. **头像上传**
   - 图片预览
   - 裁剪功能 (可选)

### 6.2 前端交互

```javascript
// 保存档案
async function saveProfile(formData) {
    const response = await fetch('/applicant', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
    });
    return response.json();
}

// 上传头像
async function uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch('/applicant/photo', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
    });
    return response.json();
}
```

---

## 7. 权限控制

| 操作 | TA | MO | ADMIN |
|------|----|----|-------|
| 查看自己档案 | ✓ | ✓ | ✓ |
| 修改自己档案 | ✓ | ✓ | ✓ |
| 查看他人档案 | ✗ | ✗ | ✗ |
| 上传简历 | ✓ | ✗ | ✗ |
| 上传头像 | ✓ | ✗ | ✗ |

---

## 8. 错误处理

| 错误场景 | 响应码 | 消息 |
|----------|--------|------|
| 档案不存在 | 404 | "Applicant not found" |
| 上传文件过大 | 400 | "File too large" |
| 文件类型不支持 | 400 | "Invalid file type" |
| 权限不足 | 403 | "Access denied" |
| 服务器错误 | 500 | "Internal server error" |

---

## 9. 测试用例

**集成测试**: `backend/test/ApplicantJobIntegrationTest.java`

**测试场景**:
1. TA 创建档案 → 档案正确保存
2. TA 更新档案 → 更新生效
3. TA 上传头像 → 文件正确存储
4. TA 上传简历 → 文件正确存储
5. 未登录访问 → 返回 401
