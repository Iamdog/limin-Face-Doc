---
title: MyBatis缓存机制与SQL注入防范
---

# MyBatis缓存机制与SQL注入防范

## 1. `#{}` 与 `${}` 的本质区别与 SQL 注入

### 底层区别
- **`#{}`（推荐）**：使用 JDBC `PreparedStatement` 占位符 `?`。变量传递给数据库驱动进行安全转义与参数绑定，**天然防御 SQL 注入**。
- **`${}`（慎用）**：纯文本字符串替换（`Statement` 拼接）。用户输入未经验证直接拼接进 SQL，极易造成 SQL 注入攻击。
- **必须使用 `${}` 的场景**：动态排序字段（`ORDER BY ${column}`）、动态升降序关键字（`${sortType}`）、动态表名切换（分表场景）。在此类场景下，必须在 Java 代码层进行严格白名单过滤。

### SQL 注入复现示例
```sql
-- 危险的 XML 写法：
-- SELECT * FROM sys_user WHERE username = '${username}'

-- 恶意输入：
username = "admin' OR '1'='1"

-- 拼接后生成的最终执行 SQL：
SELECT * FROM sys_user WHERE username = 'admin' OR '1'='1'
-- 结果导致整个表的数据在无需密码的情况下全量泄露！
```

---

## 2. 一级缓存与二级缓存的生产大坑

### 一级缓存（SqlSession 级别，默认开启）
- **作用域**：仅在同一个 `SqlSession` 内部生效。
- **失效条件**：
  1. 调用了 `insert / update / delete` 语句。
  2. 手动调用 `sqlSession.commit()`、`rollback()` 或 `clearCache()`。
  3. 执行了不同的查询条件或不同的 `SqlSession`。
- **生产深坑**：如果多个线程或服务并发更新数据，同个 `SqlSession` 内重复查询会命中旧数据导致脏读。

### 二级缓存（Mapper Namespace 级别，默认关闭）
- **作用域**：跨 `SqlSession` 共享。
- **生产大坑**：**在微服务及集群多实例部署下严禁开启 MyBatis 二级缓存！**
  因为二级缓存基于单 JVM 进程内存，当实例 A 执行更新并清除本地缓存后，实例 B 的二级缓存毫不知情，仍向客户端返回旧脏数据。分布式缓存必须使用 Redis 统一维护。
