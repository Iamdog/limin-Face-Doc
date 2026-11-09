---
title: MySQL索引失效与优化实战
---

# MySQL索引失效与优化实战

## 1. 为什么索引会失效？（B+ 树底层原理）

InnoDB 聚簇索引与二级索引基于 **B+ 树** 存储。B+ 树之所以能以 $O(\log N)$ 的极高效率进行二分检索，根本前提是：**树中的节点物理上严格按照索引字段值进行升序排序**。

- 若在字段上套用了函数或计算，函数输出值并没有在 B+ 树上排序建立索引，B+ 树检索失效。
- 联合索引 `(a, b, c)` 是先按 a 排序，a 相同才按 b 排序。若直接绕过 a 查 b，b 在全局视角下完全无序，B+ 树二分检索崩溃，只能走全表扫描（`type: ALL`）。

---

## 2. 索引失效 8 大高频生产场景

以测试表为例：
```sql
CREATE TABLE `t_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(32) NOT NULL,
  `phone` VARCHAR(11) NOT NULL,
  `age` INT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `create_time` DATETIME NOT NULL,
  INDEX `idx_name_age_status` (`name`, `age`, `status`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 场景 1：违背最左前缀原则
- **失效**：`EXPLAIN SELECT * FROM t_user WHERE age = 20;` （`type: ALL`）
- **生效**：`EXPLAIN SELECT * FROM t_user WHERE name = '张三' AND age = 20;` （`type: ref`）

### 场景 2：索引列使用函数或数学计算
- **失效**：`EXPLAIN SELECT * FROM t_user WHERE age + 1 = 20;`
- **失效**：`EXPLAIN SELECT * FROM t_user WHERE DATE(create_time) = '2026-11-09';`
- **正规优化**：计算移至右侧常量区：`WHERE create_time >= '2026-11-09 00:00:00' AND create_time <= '2026-11-09 23:59:59'`

### 场景 3：隐式类型转换（字符串查数字）
- **失效（极其隐蔽）**：`EXPLAIN SELECT * FROM t_user WHERE phone = 13800138000;`
  - 底层把字段转成了 `CAST(phone AS signed)`，相当于在字段上加了函数。
- **生效**：`EXPLAIN SELECT * FROM t_user WHERE phone = '13800138000';`

### 场景 4：前缀模糊查询（`LIKE '%abc'`）
- **失效**：`WHERE name LIKE '%三'`
- **生效**：`WHERE name LIKE '张%'`（保留了前缀有序性）

### 场景 5：范围查询（`>`, `<`, `BETWEEN`）使右侧联合索引失效
- `WHERE name = '张三' AND age > 20 AND status = 1;`
- `name` 和 `age` 命中索引，但 `status` 无法继续走索引（因为 age 范围下 status 已经无序）。

### 场景 6：OR 连接有一侧无索引
- `WHERE name = '张三' OR create_time = NOW()`（create_time 无索引，导致整体降级为全表扫描）。

### 场景 7：多表关联字符集不一致（utf8 vs utf8mb4）
- 字符集不同导致连接条件隐式转码，导致被驱动表索引失效。

### 场景 8：优化器计算回表成本高于全表扫描
- 当查询出的数据量超过全表的 20%~30%，二级索引回表随机 I/O 开销过大，优化器会直接放弃索引走全表扫描。

---

## 3. 覆盖索引（Covering Index）与回表优化

- **回表**：二级索引叶子节点仅包含（索引列 + 主键 ID）。查其他非索引字段时，需拿主键回到聚簇索引树查整行。
- **覆盖索引**：所查列全部包含在二级索引中（如 `SELECT id, name, age FROM t_user WHERE name = '张三'`），无需回表，在 `EXPLAIN` 的 `Extra` 会显示 `Using index`。
