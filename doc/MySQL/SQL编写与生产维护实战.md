---
title: SQL 编写与生产维护实战
description: 从基础查询到索引、事务、数据修复、备份和回滚，建立安全维护 MySQL 的完整流程。
---

# SQL 编写与生产维护实战

SQL 学习分为两部分：一是准确表达业务查询，二是在生产环境安全地修改数据。第二部分更重要。任何线上 SQL 都必须能够回答“影响哪些行、为什么影响、执行多长时间、出错如何恢复”。

## 一、先建立示例表

```sql
CREATE TABLE app_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_app_user_phone (phone),
    INDEX idx_app_user_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'TODO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task_user_status_created (user_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

表设计原则：

- 每张业务表都有稳定主键。
- 用户可见的唯一业务字段设置唯一约束，不依赖 Java 代码判断重复。
- 状态字段使用明确的枚举值或有限范围。
- 经常出现在 `WHERE`、`JOIN`、`ORDER BY` 中的字段进入索引设计评估。
- 时间字段统一命名和时区策略。

## 二、常用 SQL 语句

### 1. 插入

```sql
INSERT INTO app_user (username, phone)
VALUES ('alice', '13800000000');
```

批量插入时使用一条语句：

```sql
INSERT INTO app_user (username, phone)
VALUES
    ('alice', '13800000000'),
    ('bob', '13900000000');
```

唯一键冲突应由业务明确处理。`INSERT IGNORE` 会隐藏部分错误，不应在不了解后果时使用。

### 2. 查询

```sql
SELECT id, username, phone, status, created_at
FROM app_user
WHERE status = 1
ORDER BY id DESC
LIMIT 20 OFFSET 0;
```

生产查询应明确列名，不使用 `SELECT *`。分页数据量很大时，优先使用基于主键的游标分页：

```sql
SELECT id, username, phone, created_at
FROM app_user
WHERE status = 1
  AND id < 100000
ORDER BY id DESC
LIMIT 20;
```

### 3. 更新

```sql
UPDATE app_user
SET status = 0, updated_at = CURRENT_TIMESTAMP
WHERE id = 1001 AND status = 1;
```

更新后检查受影响行数。`0` 行可能表示记录不存在、状态不匹配或并发请求已经完成修改。

### 4. 删除

业务数据通常采用逻辑删除：

```sql
UPDATE app_user
SET status = 0, updated_at = CURRENT_TIMESTAMP
WHERE id = 1001 AND status = 1;
```

历史日志或临时数据可以物理删除，但必须分批执行并提前确认备份和恢复方案。

## 三、多表查询

### `INNER JOIN`

只返回两张表都存在匹配记录的数据：

```sql
SELECT t.id, t.title, u.username
FROM task t
INNER JOIN app_user u ON u.id = t.user_id
WHERE t.status = 'TODO';
```

### `LEFT JOIN`

保留左表的全部记录，即使右表没有匹配数据：

```sql
SELECT u.id, u.username, COUNT(t.id) AS task_count
FROM app_user u
LEFT JOIN task t ON t.user_id = u.id
GROUP BY u.id, u.username;
```

需要保留左表空记录时，右表条件应写在 `ON` 中，而不是随意写到 `WHERE` 中，否则可能把 `LEFT JOIN` 变成类似 `INNER JOIN` 的结果。

## 四、聚合、分组和分页

```sql
SELECT status, COUNT(*) AS total
FROM task
GROUP BY status
HAVING COUNT(*) > 10
ORDER BY total DESC;
```

执行顺序可以按以下方式理解：

```text
FROM / JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```

`WHERE` 过滤分组前的明细行，`HAVING` 过滤分组后的结果。需要统计总数时，确认统计 SQL 与列表 SQL 的筛选条件完全一致。

## 五、事务与并发更新

```sql
START TRANSACTION;

UPDATE task
SET status = 'DONE'
WHERE id = 1001
  AND user_id = 2001
  AND status = 'TODO';

-- 应用程序检查受影响行数为 1 后再提交
COMMIT;
```

发生异常时执行：

```sql
ROLLBACK;
```

库存、余额和状态流转等关键更新应使用条件更新：

```sql
UPDATE product_stock
SET stock = stock - 1
WHERE product_id = 1001 AND stock >= 1;
```

应用程序根据受影响行数判断扣减是否成功。不要先查询库存，再在 Java 内存中判断，最后单独执行扣减；并发情况下会产生超卖。

## 六、索引与执行计划

使用 `EXPLAIN` 检查查询：

```sql
EXPLAIN
SELECT id, title, created_at
FROM task
WHERE user_id = 2001
  AND status = 'TODO'
ORDER BY created_at DESC
LIMIT 20;
```

重点关注：

| 字段 | 关注点 |
| --- | --- |
| `type` | 优先达到 `const`、`ref`、`range`，避免大表 `ALL` |
| `key` | 实际使用的索引，空值表示未使用索引 |
| `rows` | 预计扫描行数，越大越需要优化 |
| `Extra` | 关注 `Using filesort`、`Using temporary` 和回表情况 |

联合索引 `(user_id, status, created_at)` 适合同时按用户、状态过滤并按创建时间排序的查询。索引并非越多越好，每个索引都会增加写入、更新和存储成本。

## 七、生产 SQL 安全流程

### 1. 执行前确认

- 确认数据库、表名和环境，生产环境禁止凭记忆执行。
- 将待执行的 `SELECT` 先运行，检查目标行数量和关键字段。
- 为 `UPDATE`、`DELETE` 补充完整 `WHERE` 条件。
- 记录预计影响行数，设置合理的执行超时。
- 对重要数据进行备份或生成可回滚脚本。

### 2. 更新和删除必须先预览

错误示例：

```sql
DELETE FROM task WHERE status = 'DONE';
```

安全步骤：

```sql
SELECT id, user_id, title
FROM task
WHERE status = 'DONE'
  AND created_at < '2026-01-01'
LIMIT 100;
```

确认结果后，再执行带有相同条件的分批删除：

```sql
DELETE FROM task
WHERE status = 'DONE'
  AND created_at < '2026-01-01'
ORDER BY id
LIMIT 1000;
```

循环执行并检查受影响行数，直到返回 `0`。大表维护禁止执行一个持续数小时的大事务。

### 3. 使用事务保护可回滚修改

```sql
START TRANSACTION;

SELECT id, status
FROM task
WHERE id IN (1001, 1002)
FOR UPDATE;

UPDATE task
SET status = 'TODO'
WHERE id IN (1001, 1002);

-- 核对结果后 COMMIT；结果不正确则 ROLLBACK
COMMIT;
```

事务不能替代备份。事务提交后，仍需要通过备份、binlog 或反向脚本恢复数据。

## 八、数据变更与回滚

表结构变更应使用版本化迁移文件，例如：

```text
db/migration/
├── V1__create_app_user.sql
├── V2__create_task.sql
└── V3__add_task_priority.sql
```

每个变更文件应包含：变更目的、执行 SQL、影响范围、回滚 SQL、预计耗时和验证 SQL。生产发布顺序如下：

1. 备份并确认恢复方式。
2. 在测试库执行迁移，验证应用读写。
3. 在预生产环境执行，观察锁等待和执行时间。
4. 选择低峰期发布，保留原字段和兼容逻辑。
5. 应用发布完成后执行数据校验。
6. 发现问题时先回滚应用，再执行数据补偿或反向迁移。

新增字段优先使用“先加字段、再发布代码、最后清理旧字段”的兼容策略，避免应用和数据库版本短暂不一致时发生错误。

## 九、慢 SQL 排查清单

1. 记录完整 SQL、参数、执行耗时和请求 ID。
2. 使用 `EXPLAIN` 判断是否走索引、扫描行数是否过大。
3. 检查是否存在隐式类型转换、函数包裹索引列、前置 `%` 模糊查询。
4. 检查排序、分组是否产生临时表或磁盘文件排序。
5. 检查锁等待、事务是否长时间未提交。
6. 优化后重新执行相同参数的查询，比较耗时和扫描行数。

## 十、SQL 代码审查清单

- [ ] 查询只返回需要的字段。
- [ ] `UPDATE` 和 `DELETE` 具备完整条件，并已执行预览查询。
- [ ] 外部参数使用预编译绑定。
- [ ] 分页、排序和筛选字段有明确索引依据。
- [ ] 事务范围没有包含长时间网络调用。
- [ ] 大批量数据采用分批处理。
- [ ] 生产变更有备份、验证和回滚方案。
- [ ] 变更文件已经提交到版本库并经过测试环境验证。
