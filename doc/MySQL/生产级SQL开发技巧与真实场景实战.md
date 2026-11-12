---
title: 生产级SQL开发技巧与真实场景实战
---

# 生产级SQL开发技巧与真实场景实战

## 使用入口：先解决问题，再做验证

安全处理库存、软删除、清洗和归档。

**先做基本操作**：先用小规模样例验证条件更新与影响行数，准备回滚再逐批维护，最后分析并发锁和访问路径。初次学习可先完成[本模块基础实践](/doc/MySQL/SQL编写与生产维护实战)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

在真实企业级开发中，绝大多数业务问题不是光靠简单的 `SELECT / INSERT / UPDATE` 就能解决的。本篇提炼 **生产一线业务系统中最常用的 6 大高级 SQL 技巧与真实场景**，包含高并发防超卖、软删除唯一冲突解决、大表无锁平滑归档、动态行列转换与 JSON 字段索引。

---

## 场景 1：秒杀抢购高并发防超卖（无锁原子更新）

### 业务痛点
1000 个人同时抢 10 件商品。如果在业务代码层先 `SELECT stock FROM table` 查出库存，在 Java 内存中判断 `stock > 0` 再执行扣减，**瞬间发生严重超卖，库存被扣成负数**。

### 生产级 SQL 技巧：条件原子扣减（CAS 思想）
利用 MySQL InnoDB 底层行级排他锁（X 锁）的原子性，一条 SQL 搞定校验与扣减，**彻底免去代码层的分布式锁**：

```sql
-- 核心 SQL：在更新的同时校验库存边界
UPDATE `mall_seckill_stock`
SET `stock` = `stock` - 1, `version` = `version` + 1
WHERE `product_id` = 1001 
  AND `stock` >= 1; -- 关键条件：库存大于等于 1 才放行！
```

- **业务判定逻辑（Java / 客户端）**：
  检查 JDBC 执行后返回的 **受影响行数（Rows Affected）**：
  - 若 `rowsAffected == 1`：说明成功抢到并扣减库存。
  - 若 `rowsAffected == 0`：说明库存已见底，直接给用户提示“手慢了，商品已售罄”，性能比加 Redisson 分布式锁提升 3 倍以上！

---

## 场景 2：软删除（逻辑删除）与唯一键冲突的优雅解法

### 业务痛点
用户表需要对手机号 `phone` 建立唯一索引防重（`UNIQUE KEY uk_phone`），同时系统设计了软删除标记 `is_deleted TINYINT DEFAULT 0`。
- 用户注销账号后：`is_deleted` 被置为 `1`。
- 该用户想用相同的手机号重新注册：系统触发 `Duplicate entry '13800000000' for key 'uk_phone'` 报错！因为已注销的旧记录占用了该唯一索引。

### 生产级 SQL 技巧：删除标记存储“主键 ID 或时间戳”
将联合唯一索引改为：`UNIQUE KEY uk_phone_del (phone, is_deleted)`。

- **正常有效数据**：`is_deleted` 一律为 `0`。只要手机号相同且 `is_deleted = 0`，就能精准拦截重复注册。
- **注销软删除 SQL**：
  ```sql
  -- 注销时，将 is_deleted 字段修改为当前记录的主键 ID (或者当前时间戳)
  UPDATE `sys_user` 
  SET `is_deleted` = `id` 
  WHERE `id` = 1001;
  ```
  此时该注销记录的键值为 `('13800000000', 1001)`，下次再注册相同手机号时，新记录键值为 `('13800000000', 0)`，**完全不冲突**！即兼顾了逻辑删除，又完美保留了数据库层面的唯一性强约束。

---

## 场景 3：历史重复数据清洗（保留最新/最小 ID，批量删除其余冗余）

### 业务痛点
系统因历史并发写 Bug 或数据导入失误，导致某表（如 `user_bank_card` 银行卡绑定表）出现同卡号多条重复记录，需要保留 `id` 最小的合规数据，删除其他冗余垃圾数据。

### 生产级 SQL 技巧：自连接（Self Join）批量清理
千万不要查到内存中循环一条条删！用自连接一条 SQL 批量完成清理：

```sql
-- 一键删除所有重复卡号中 ID 较大的多余行，仅保留 ID 最小的那一条
DELETE t1 
FROM `user_bank_card` t1
INNER JOIN `user_bank_card` t2 
  ON t1.`card_no` = t2.`card_no` 
  AND t1.`id` > t2.`id`; -- 只要存在比自己小的 ID，当前行就是重复的多余行，删！
```

---

## 场景 4：千万级历史大表“无锁平滑归档与分批删除”

### 业务痛点
操作日志表 `sys_log` 累积了 5000 万条数据，磁盘告警，需要删除 3 个月前的历史数据。
- **线上直接跑路的自杀写法**：
  ```sql
  DELETE FROM `sys_log` WHERE `created_time` < '2026-08-01'; -- 严禁在生产执行！
  ```
  该操作会产生数百万行的巨大事务，将 Undo Log 打满，主从复制延迟飙升到数小时，并且由于大事务持有行锁过久，导致全库业务全部卡死！

### 生产级 SQL 技巧：按自增 ID 游标分批限速删除（Batch Delete）
通过脚本或存储过程按主键步长小批量提交，每次删除 2000 条，配合短暂休眠（`sleep`），让数据库有时间释放行锁与执行主从同步：

```sql
-- 1. 先定位 3 个月前那条边界记录的最大 ID
SELECT MAX(`id`) INTO @max_delete_id FROM `sys_log` WHERE `created_time` < '2026-08-01';

-- 2. 循环执行小批量删除，直到受影响行数为 0
DELETE FROM `sys_log` 
WHERE `id` <= @max_delete_id 
ORDER BY `id` ASC 
LIMIT 2000;

-- 每次执行完毕后，脚本暂停 50~100 毫秒，平滑释放磁盘与锁资源
```

---

## 场景 5：动态行列转换（报表 Pivot 实战）

### 业务痛点
原始学生成绩表 `student_score` 为纵表结构：
| student_id | subject | score |
| :---: | :---: | :---: |
| 101 | '语文' | 90 |
| 101 | '数学' | 95 |
| 102 | '语文' | 80 |

管理后台报表需求：需要横向平铺展示为：`学号 | 语文 | 数学 | 英语 | 总分`。

### 生产级 SQL 技巧：`CASE WHEN` 配合聚合函数
```sql
SELECT 
  `student_id`,
  MAX(CASE WHEN `subject` = '语文' THEN `score` ELSE 0 END) AS `chinese_score`,
  MAX(CASE WHEN `subject` = '数学' THEN `score` ELSE 0 END) AS `math_score`,
  MAX(CASE WHEN `subject` = '英语' THEN `score` ELSE 0 END) AS `english_score`,
  SUM(`score`) AS `total_score`
FROM `student_score`
GROUP BY `student_id`
ORDER BY `total_score` DESC;
```

---

## 场景 6：MySQL 8.0 JSON 动态字段查询与虚拟生成列索引

### 业务痛点
电商商品的动态规格属性（如手机的颜色、内存、网络制式）通常使用 JSON 存储在 `attributes` 字段中：
```json
{"color": "暗夜黑", "memory": "16G", "battery": 5000}
```
直接使用 `WHERE attributes->>'$.memory' = '16G'` 会进行**全表扫描**，导致查询极慢。

### 生产级 SQL 技巧：虚拟生成列（Generated Column）+ 二级索引
MySQL 允许从 JSON 字段中提取属性作为**虚拟列**，并直接在虚拟列上建立 B+ 树索引！

```sql
-- 1. 创建表并提取 JSON 属性为虚拟生成列 (VIRTUAL 模式不占用物理磁盘存储)
CREATE TABLE `mall_sku` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `sku_code` VARCHAR(64) NOT NULL,
  `attributes` JSON NOT NULL COMMENT '商品动态扩展属性',
  -- 提取 JSON 中的 memory 属性作为虚拟计算列
  `memory_spec` VARCHAR(32) GENERATED ALWAYS AS (`attributes`->>'$.memory') VIRTUAL,
  INDEX `idx_memory_spec` (`memory_spec`) -- 为虚拟列建立原生 B+ 树索引！
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 查询时自动命中索引 (执行计划 type 为 ref，速度提升数百倍)
EXPLAIN SELECT * FROM `mall_sku` WHERE `memory_spec` = '16G';
```
