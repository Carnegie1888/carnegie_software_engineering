# AI 自动提交规范

## 提交分工

| 成员 | 负责范围 |
|------|----------|
| member1 | 后端 - 测试、工具类 |
| member2 | 后端 - 业务接口、AI服务 |
| member3 | 后端 - 配置、校验逻辑 |
| member4 | 后端 - 核心业务、流程 |
| member5 | 前端 - 页面、交互、样式 |
| member6 | 前端 - 页面、组件、样式 |

## 提交规则

### 1. 分工原则
- **后端改动** → 分配给 member1~4（按 Round-Robin 轮换）
- **前端改动** → 分配给 member5~6（按 Round-Robin 轮换）
- 纯文档/配置改动 → 交给最后活跃的成员

### 2. 提交信息格式
```
<type>(<scope>): <subject>
```
- type: `feat` `fix` `refactor` `test` `chore` `docs`
- scope: 简短范围，如 `auth` `job` `profile` `ta` `mo`

### 3. 协作要求
- 同一功能的多处改动应由**不同成员**分别提交
- 避免连续提交，间隔至少一次其他成员介入
- 大功能拆分为多个小提交，分配给不同成员

### 4. 提交命令格式
```bash
git commit -m "<type>: <subject>" --author="<name> <email>"
```

### 5. 成员 author 信息
| 成员 | author |
|------|--------|
| member1 | member1 <member1@edu.com> |
| member2 | member2 <member2@edu.com> |
| member3 | member3 <member3@edu.com> |
| member4 | member4 <member4@edu.com> |
| member5 | member5 <member5@edu.com> |
| member6 | member6 <member6@edu.com> |

### 6. 提交示例
```bash
git commit -m "feat: 新增候选人筛选面板" --author="member5 <member5@edu.com>"
git commit -m "fix: 修复岗位匹配接口参数错误" --author="member2 <member2@edu.com>"
git commit -m "refactor: 重构申请人档案读写逻辑" --author="member4 <member4@edu.com>"
```
