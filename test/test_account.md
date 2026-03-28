# TA 账户

## 已注册的 TA（你自己注册的）
carnegie
123456

## 演示 TA 账户（启动时自动创建）
ta_demo / Pass1234
ta_demo_mia / Pass1234
ta_demo_noah / Pass1234
ta_demo_olivia / Pass1234
ta_demo_liam / Pass1234

---

# MO 账户（可用于登录审核 TA 申请）

## 演示 MO 账户（启动时自动创建）
mo_demo / Pass1234
mo_demo_alice / Pass1234
mo_demo_brian / Pass1234

---

# ADMIN 账户

admin_demo / Pass1234

---

# 测试说明

1. 启动 Tomcat 服务器后，演示账户会自动创建到 `data/users/` 目录下的 CSV 文件中
2. 使用 MO 账户登录后可审核 TA 的申请
3. 数据目录默认位置：`{user.dir}/data/` 或 `{catalina.base}/data/groupproject/`