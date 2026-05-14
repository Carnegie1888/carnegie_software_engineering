# 用户手册截图说明

本目录用于存放 TARecruitmentSystem 用户手册所需的截图。

## 截图规范

- **格式**：PNG
- **推荐分辨率**：1920x1080 或更高
- **浏览器边框**：去除浏览器外框，只保留应用页面内容
- **文件命名**：使用小写字母和连字符，例如 `login.png`

## 必需截图

| 文件名 | 来源页面 | 内容说明 |
| ------ | -------- | -------- |
| `login.png` | `/login.jsp` | 包含用户名 / 密码字段和角色选择器的完整登录界面 |
| `register.png` | `/register.jsp` | 包含角色选择和表单字段的注册页面 |
| `ta-dashboard.png` | `/jsp/ta/dashboard.jsp` | 显示个人资料摘要和快捷操作的 TA 仪表盘 |
| `ta-job-list.png` | `/jsp/ta/job-list.jsp` | 可申请岗位列表 |
| `ta-application-status.png` | `/jsp/ta/application-status.jsp` | 申请状态跟踪页面 |
| `mo-dashboard.png` | `/jsp/mo/dashboard.jsp` | 包含统计信息和待处理申请的 MO 仪表盘 |
| `mo-applicant-selection.png` | `/jsp/mo/applicant-selection.jsp` | 包含接受 / 拒绝按钮的申请人审核页面 |
| `mo-ai-skill-match.png` | `/jsp/mo/ai-skill-match.jsp` | AI 技能匹配分析可视化页面 |
| `admin-dashboard.png` | `/jsp/admin/dashboard.jsp` | 包含系统统计和工作量图表的管理员仪表盘 |

## 在 Markdown 中的使用位置

保存为以上文件名后，截图会在用户手册的以下位置自动显示：

```text
![登录页面](user-manual-images/login.png)      -- 第 2.2 节
![注册页面](user-manual-images/register.png)    -- 第 2.3 节
![TA 仪表盘](user-manual-images/ta-dashboard.png)           -- 第 5.0 节
![TA 岗位列表](user-manual-images/ta-job-list.png)             -- 第 5.4 节
![TA 申请状态](user-manual-images/ta-application-status.png) -- 第 5.5 节
![MO 仪表盘](user-manual-images/mo-dashboard.png)            -- 第 6.0 节
![MO 申请人筛选](user-manual-images/mo-applicant-selection.png) -- 第 6.3 节
![MO AI 技能匹配](user-manual-images/mo-ai-skill-match.png)  -- 第 6.5 节
![管理员仪表盘](user-manual-images/admin-dashboard.png)      -- 第 7.0 节
```

## 备注

1. 拍摄登录截图时，可以使用用户手册中的演示账号：
   - TA：`ta_demo` / `Pass1234`
   - MO：`mo_demo` / `Pass1234`
   - 管理员：`admin_demo` / `Pass1234`

2. 截图前请先填充演示数据，确保页面内容可见。

3. 管理员仪表盘截图中应确保 TA 工作量统计可见。
