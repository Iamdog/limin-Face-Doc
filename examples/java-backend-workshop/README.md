---
title: Java 后端事务、权限与排错练习项目
---

# Java 后端事务、权限与排错练习项目

## 解决什么问题

适合已经能写 CRUD、需要补事务、权限和排错的学习者。用真实 Spring Boot、Spring Security、MyBatis 和 H2，验证任务与记录一起回滚、资源归属、角色授权、并发版本冲突与请求日志。

## 基本使用

需要 JDK 17 或更高版本、可访问 Maven 仓库的网络。Maven Wrapper 固定 Maven 3.9.11，无需预先安装 Maven；Windows 使用 `mvnw.cmd`。

```bash
# 在仓库根目录执行
cd examples/java-backend-workshop
java -version
./mvnw test
./mvnw spring-boot:run
```

也可打包运行：

```bash
./mvnw package
java -jar target/backend-workshop-0.0.1-SNAPSHOT.jar
```

默认地址 `http://127.0.0.1:8081`，使用内存数据库，重启数据消失。应用默认仅绑定本机回环；演示账号为 alice/alice-demo、bob/bob-demo（编辑角色）和 viewer/viewer-demo（只读角色）。用于理解真实认证和授权，不作为生产账号体系。

## 先发出成功请求

需要 curl 和 Python 3，用 Python 读取 JSON 字段，避免另装 jq。

```bash
curl -i -u alice:alice-demo http://127.0.0.1:8081/api/tasks

# 获取 CSRF Token，并保留同一会话 Cookie
curl -fsS -u alice:alice-demo -c /tmp/workshop-alice.cookies \
  http://127.0.0.1:8081/api/csrf > /tmp/workshop-alice-csrf.json
workshop_csrf=$(python3 -c 'import json; print(json.load(open("/tmp/workshop-alice-csrf.json"))["token"])')

curl -i -u alice:alice-demo -b /tmp/workshop-alice.cookies \
  -H "X-CSRF-TOKEN: $workshop_csrf" -H 'Content-Type: application/json' \
  -d '{"title":"我的第一条任务"}' http://127.0.0.1:8081/api/tasks
```

新增预期 201，响应包含 id、title、version=0。下例用 `1` 演示 ID，**应替换为实际新增结果中的 id**。

```bash
curl -i -u alice:alice-demo -b /tmp/workshop-alice.cookies \
  -X PUT -H "X-CSRF-TOKEN: $workshop_csrf" -H 'Content-Type: application/json' \
  -d '{"title":"已修改","version":0}' http://127.0.0.1:8081/api/tasks/1
```

第一次更新预期 200、version=1，再提交相同旧版本预期 409。CSRF Token 与会话关联，换用户时重新取得 Token 和 Cookie，不复用其他账号的会话。

## 再制造失败，观察证据

| 操作 | 预期 | 对应能力 |
|---|---|---|
| 不提供认证 GET /api/tasks | 401 | 认证边界 |
| viewer 写入并带有效 CSRF | 403 | 接口角色授权 |
| alice 写入不带 CSRF | 403 | CSRF 保护 |
| bob 读取 alice 的任务 | 404 | 资源归属，不暴露他人资源 |
| 空 title 或额外 owner 字段 | 400 | 校验和身份注入防护 |
| 两次提交同一个旧 version | 一次成功，之后 409 | 条件更新与冲突 |
| 测试注入 audit 写入后异常 | 两张表都回滚 | 真正的业务事务 |

每次响应 Header 有 `X-Request-Id`；错误 JSON 和日志使用同一 ID。先从 ID 找到请求，再看业务、SQL 和数据，不记录密码/认证 Header 来排查问题。

## 如何读代码

`RequestLogFilter` → `SecurityConfig` → `TaskController` → `TaskService` → `TaskMapper`/`AuditWriter`。先读正常调用，再读失败测试；最后阅读代理、回滚规则和安全过滤链。

所有生产业务代码都在 `src/main/java/com/example/workshop`，集成测试在 `src/test/java/com/example/workshop/WorkshopIntegrationTest.java`。测试不使用外围事务自动回滚，避免掩盖 Service 的提交/回滚结果。事务故障通过测试 spy 注入，业务 API 没有故障参数。

## 已执行的验证

2026-11-12 使用 JDK 21 完成：14 项集成测试全部通过，Maven 打包成功，打包后的应用通过真实 HTTP 检查，知识库站点构建通过。HTTP 检查覆盖匿名/错误密码、同会话 CSRF、新增与更新、旧版本冲突、他人资源隔离、角色拒绝、失败后数据不变，以及响应和日志的 requestId 关联。

测试中的故障注入验证多表与版本回滚；真实 HTTP 检查验证打包应用的正常与拒绝路径。MySQL 隔离、锁等待和死锁尚需单独实验。

## 练习的使用边界

H2 让练习无需安装数据库，SQL/事务参与是真实运行的，但不能替代 MySQL 的隔离、锁等待、死锁与恢复实验。迁移到 MySQL 时换驱动、连接配置和建表语法，并对代表数据重新验证。此项目的创建接口没有额外业务幂等键，重复 POST 可新增两条任务；下一项扩展练习是增加请求号唯一约束和相同结果重放。

继续阅读 [CRUD 之后的补强路线](/doc/Java/CRUD之后的后端补强路线)、[事务、权限与排错实战](/doc/Java/事务权限与排错实战) 和 [MySQL 事务实验](/doc/MySQL/MySQL事务隔离与MVCC原理)。
