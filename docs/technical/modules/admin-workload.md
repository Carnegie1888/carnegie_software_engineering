# 管理员工作量统计模块技术文档

## 1. 模块概述

管理员工作量统计模块允许 ADMIN 查看系统中各角色 (MO, TA) 的工作量统计信息。

**核心组件**：
- `WorkloadStatsServlet` - 统计 API (`/api/admin/workload`)
- `WorkloadStatsService` - 统计业务逻辑
- 前端页面: `jsp/admin/dashboard.jsp`

---

## 2. 统计指标

### 2.1 MO 统计

| 指标 | 说明 |
|------|------|
| `totalApplications` | 收到的申请总数 |
| `pending` | 待审核申请数 |
| `processed` | 已处理申请数 (accepted + rejected) |
| `accepted` | 已接受申请数 |
| `rejected` | 已拒绝申请数 |
| `withdrawn` | 已撤回申请数 |

### 2.2 TA 统计

| 指标 | 说明 |
|------|------|
| `totalApplications` | 提交的申请总数 |
| `pending` | 待审核申请数 |
| `accepted` | 已接受申请数 |
| `rejected` | 已拒绝申请数 |
| `withdrawn` | 已撤回申请数 |

### 2.3 系统统计

| 指标 | 说明 |
|------|------|
| `total` | 申请总数 |
| `pending` | 待审核申请数 |
| `accepted` | 已接受申请数 |
| `rejected` | 已拒绝申请数 |
| `withdrawn` | 已撤回申请数 |

---

## 3. 服务层实现

### 3.1 WorkloadStatsService

**路径**: `backend/src/com/example/authlogin/service/WorkloadStatsService.java`

**内部类**:

```java
public static class MoWorkloadStats {
    private final String moId;
    private final String moName;
    private final int totalApplications;
    private final int pending;
    private final int processed;
    private final int accepted;
    private final int rejected;
    private final int withdrawn;
    // getters...
}

public static class TaWorkloadStats {
    private final String taId;
    private final String taName;
    private final int totalApplications;
    private final int pending;
    private final int accepted;
    private final int rejected;
    private final int withdrawn;
    // getters...
}
```

**核心方法**:

| 方法 | 说明 |
|------|------|
| `calculateApplicationCounts(List<Application>)` | 计算系统申请状态统计 |
| `calculateMoWorkloadStats(List<Application>)` | 计算所有 MO 的工作量统计 |
| `calculateTaWorkloadStats(List<Application>)` | 计算所有 TA 的工作量统计 |

---

## 4. Servlet API

### 4.1 WorkloadStatsServlet

**路径**: `backend/src/com/example/authlogin/servlet/WorkloadStatsServlet.java`

**端点**: `/api/admin/workload`

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| mode | String | `mo` / `ta` (可选，默认返回系统统计) |
| start | String | 开始时间 ISO 格式 (可选) |
| end | String | 结束时间 ISO 格式 (可选) |
| export | String | `csv` (仅 mode=mo 时支持) |

#### GET /api/admin/workload

返回系统申请状态统计。

**响应**:
```json
{
    "success": true,
    "message": "Application count stats generated",
    "data": {
        "total": 150,
        "pending": 30,
        "accepted": 80,
        "rejected": 25,
        "withdrawn": 15
    }
}
```

#### GET /api/admin/workload?mode=mo

返回所有 MO 的工作量统计列表。

**响应**:
```json
{
    "success": true,
    "message": "MO workload stats generated",
    "data": {
        "moWorkloads": [
            {
                "moId": "mo-123",
                "moName": "张三",
                "totalApplications": 45,
                "pending": 10,
                "processed": 35,
                "accepted": 20,
                "rejected": 15,
                "withdrawn": 0
            }
        ]
    }
}
```

#### GET /api/admin/workload?mode=ta

返回所有 TA 的工作量统计列表。

**响应**:
```json
{
    "success": true,
    "message": "TA workload stats generated",
    "data": {
        "taWorkloads": [
            {
                "taId": "ta-456",
                "taName": "李四",
                "totalApplications": 8,
                "pending": 2,
                "accepted": 3,
                "rejected": 2,
                "withdrawn": 1
            }
        ]
    }
}
```

#### GET /api/admin/workload?mode=mo&export=csv

导出 MO 工作量统计为 CSV 文件。

**权限**: 仅 ADMIN

---

## 5. 前端页面

### 5.1 Admin 仪表盘

**路径**: `frontend/webapp/jsp/admin/dashboard.jsp`

**JS 文件**: `frontend/webapp/js/admin/admin-dashboard.js`

**功能**:
1. 系统总体统计卡片 (Total, Pending, Accepted, Rejected, Withdrawn)
2. 申请状态分布图表
3. MO 工作量图表 (前 6 名)
4. TA 工作量图表 (前 6 名)
5. MO 工作量详细列表
6. TA 工作量详细列表
7. 时间范围筛选
8. CSV 导出 (仅 MO)

**API 调用**:

```javascript
// 加载系统统计
fetch('/api/admin/workload', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })

// 加载 MO 统计
fetch('/api/admin/workload?mode=mo', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })

// 加载 TA 统计
fetch('/api/admin/workload?mode=ta', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
```

---

## 6. 权限控制

| 操作 | ADMIN | MO | TA |
|------|-------|----|----|
| 查看系统统计 | ✓ | ✗ | ✗ |
| 查看 MO 工作量 | ✓ | ✗ | ✗ |
| 查看 TA 工作量 | ✓ | ✗ | ✗ |

**注意**: 当前实现仅允许 ADMIN 访问所有统计接口。MO 和 TA 无法查看工作量统计。

---

## 7. 数据库依赖

**Application 表关键字段**:

| 字段 | 说明 |
|------|------|
| applicantId | 申请人 (TA) ID |
| applicantName | 申请人 (TA) 姓名 |
| moId | 职位所属 MO ID |
| moName | 职位所属 MO 姓名 |
| status | 申请状态 (PENDING/ACCEPTED/REJECTED/WITHDRAWN) |
| appliedAt | 申请时间 |
