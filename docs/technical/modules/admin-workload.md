# 管理员工作量统计模块技术文档

## 1. 模块概述

管理员工作量统计模块允许 ADMIN 查看系统中各角色 (MO, TA) 的工作量统计信息。

**核心组件**：
- `WorkloadStatsServlet` - 统计 API
- `WorkloadStatsService` - 统计业务逻辑
- 前端页面: `jsp/admin/dashboard.jsp`

---

## 2. 统计指标

### 2.1 MO 统计

| 指标 | 说明 |
|------|------|
| `totalJobs` |发布的职位总数 |
| `openJobs` | 开放职位数 |
| `totalApplications` | 收到的申请总数 |
| `pendingApplications` | 待审核申请数 |
| `acceptedApplications` | 已接受申请数 |
| `rejectedApplications` | 已拒绝申请数 |

### 2.2 TA 统计

| 指标 | 说明 |
|------|------|
| `totalApplications` | 提交的申请总数 |
| `pendingApplications` | 待审核申请数 |
| `acceptedApplications` | 已接受申请数 |
| `rejectedApplications` | 已拒绝申请数 |
| `withdrawnApplications` | 已撤回申请数 |

### 2.3 系统统计

| 指标 | 说明 |
|------|------|
| `totalUsers` | 用户总数 |
| `totalTA` | TA 用户数 |
| `totalMO` | MO 用户数 |
| `totalAdmin` | Admin 用户数 |
| `totalJobs` | 职位总数 |
| `totalApplications` | 申请总数 |

---

## 3. 服务层实现

### 3.1 WorkloadStatsService

**路径**: `backend/src/com/example/authlogin/service/WorkloadStatsService.java`

```java
public class WorkloadStatsService {

    public MoWorkloadStats getMoStats(String moId) {
        // 获取 MO 发布的职位
        List<Job> moJobs = jobDao.findByMoId(moId);

        // 获取职位下的所有申请
        List<Application> moApplications = new ArrayList<>();
        for (Job job : moJobs) {
            moApplications.addAll(applicationDao.findByJobId(job.getJobId()));
        }

        // 统计各项指标
        MoWorkloadStats stats = new MoWorkloadStats();
        stats.setTotalJobs(moJobs.size());
        stats.setOpenJobs(countOpenJobs(moJobs));
        stats.setTotalApplications(moApplications.size());
        stats.setPendingApplications(countByStatus(moApplications, PENDING));
        stats.setAcceptedApplications(countByStatus(moApplications, ACCEPTED));
        stats.setRejectedApplications(countByStatus(moApplications, REJECTED));

        return stats;
    }

    public TaWorkloadStats getTaStats(String taId) {
        // 获取 TA 的所有申请
        List<Application> taApplications = applicationDao.findByApplicantId(taId);

        // 统计各项指标
        TaWorkloadStats stats = new TaWorkloadStats();
        stats.setTotalApplications(taApplications.size());
        stats.setPendingApplications(countByStatus(taApplications, PENDING));
        stats.setAcceptedApplications(countByStatus(taApplications, ACCEPTED));
        stats.setRejectedApplications(countByStatus(taApplications, REJECTED));
        stats.setWithdrawnApplications(countByStatus(taApplications, WITHDRAWN));

        return stats;
    }

    public SystemStats getSystemStats() {
        // 统计系统级别数据
        SystemStats stats = new SystemStats();
        stats.setTotalUsers(userDao.count());
        stats.setTotalTA(userDao.findByRole(TA).size());
        stats.setTotalMO(userDao.findByRole(MO).size());
        stats.setTotalAdmin(userDao.findByRole(ADMIN).size());
        stats.setTotalJobs(jobDao.count());
        stats.setTotalApplications(applicationDao.count());

        return stats;
    }
}
```

---

## 4. Servlet API

### 4.1 WorkloadStatsServlet

**路径**: `backend/src/com/example/authlogin/servlet/WorkloadStatsServlet.java`

**端点**: `/api/admin/stats`

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| type | String | `system` / `mo` / `ta` |
| userId | String | 当 type=mo 或 type=ta 时必需 |

#### GET /api/admin/stats?type=system

**响应**:
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

#### GET /api/admin/stats?type=mo&userId=xxx

**响应**:
```json
{
    "type": "mo",
    "userId": "mo-123",
    "totalJobs": 5,
    "openJobs": 3,
    "totalApplications": 45,
    "pendingApplications": 10,
    "acceptedApplications": 20,
    "rejectedApplications": 15
}
```

#### GET /api/admin/stats?type=ta&userId=xxx

**响应**:
```json
{
    "type": "ta",
    "userId": "ta-456",
    "totalApplications": 8,
    "pendingApplications": 2,
    "acceptedApplications": 3,
    "rejectedApplications": 2,
    "withdrawnApplications": 1
}
```

**权限**: 仅 ADMIN

---

## 5. 前端页面

### 5.1 Admin 仪表盘

**路径**: `frontend/webapp/jsp/admin/dashboard.jsp`

**功能**:
1. 系统总体统计卡片
2. 各 MO 工作量排名
3. 各 TA 申请统计
4. 可视化图表 (可选)

```javascript
// 加载系统统计
async function loadSystemStats() {
    const response = await fetch('/api/admin/stats?type=system', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    return response.json();
}

// 加载 MO 统计
async function loadMoStats(moId) {
    const response = await fetch(`/api/admin/stats?type=mo&userId=${moId}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    return response.json();
}
```

---

## 6. 权限控制

| 操作 | ADMIN | MO | TA |
|------|-------|----|----|
| 查看系统统计 | ✓ | ✗ | ✗ |
| 查看 MO 统计 | ✓ | ✓ (仅本人) | ✗ |
| 查看 TA 统计 | ✓ | ✗ | ✓ (仅本人) |
