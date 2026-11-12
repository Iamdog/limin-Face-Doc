---
title: MySQL索引失效与优化实战
---

# MySQL索引失效与优化实战

## 使用入口：先解决问题，再做验证

让业务查询在正确结果下减少扫描与回表。

**先做基本操作**：先写真实 WHERE/ORDER BY/LIMIT，查看 EXPLAIN，按代表数据比较耗时和扫描行，再讲 B+ 树。初次学习可先完成[本模块基础实践](/doc/MySQL/SQL编写与生产维护实战)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

> **一句话大白话**：索引就是一本按拼音排好序的「新华字典」。B+ 树之所以能在一千万条数据里毫秒级查出结果，根本前提是：**树上的目录是严格排好序的**。一旦你在字段上套函数、跳过左边前缀查中间、或者隐式类型转换，就相当于把字典所有页全拆散打乱了，数据库小管家没法按目录二分查找，只能含泪从第 1 页硬翻到第 1000 万页（全表扫描 `type: ALL`）。

---

## 30 秒生活比喻：查新华字典与通讯录排序

- **联合索引（按拼音查字典）**：
  假设建了联合索引 `(姓氏, 名字, 年龄)`。
  - **最左匹配**：字典目录是先按“姓氏”拼音排（A、B、C...），姓氏相同才按“名字”排，名字还相同才按“年龄”排。
  - **为什么直接查名字会失效？** 如果你直接问：“全国所有叫‘强’的人在哪？（跳过了姓氏）”。因为叫“强”的人可能姓李、姓张、姓王，分散在整本字典的一千多页里，目录完全无序，你只能整本字典逐页翻看（全表扫描）。
- **函数失效（在目录上做算术）**：
  目录上印的是出生年份（`2000`、`2001`...），你却让管家查“当前年份减去出生年份等于 24 的人”（`WHERE YEAR(NOW()) - birth = 24`）。管家脑子里没算过每行减出来的结果，只能每一页拿计算器现算一遍。
- **回表（拿着借书证去书库搬整套书）**：
  二级索引目录卡片上只有【借书卡号 + 索书号】。如果你只要索书号，直接看卡片就行（覆盖索引 `Using index`）；如果你要读整本书的内容，就必须拿着索书号一次次跑去深层仓库搬书（回表 IO 开销）。

---

## 一张图看懂 B+ 树联合索引与最左匹配机制

```mermaid
flowchart TD
    subgraph 联合索引 idx_name_age (先按 name 排序，name 相同再按 age 排序)
    Root["根节点: [张三, 18] | [李四, 20] | [王五, 25]"]
    Root --> Leaf1["叶子节点 1: [张三, 18] -> [张三, 22] -> [张三, 30]"]
    Root --> Leaf2["叶子节点 2: [李四, 19] -> [李四, 20] -> [李四, 26]"]
    Root --> Leaf3["叶子节点 3: [王五, 21] -> [王五, 25] -> [赵六, 20]"]
    end

    subgraph 查询路径抉择
    Q1["查询: WHERE name = '张三' AND age = 22"] -->|命中前缀，树上有序| Fast["二分查找精确命中 Leaf1 (type: ref)"]
    Q2["查询: WHERE age = 20 (跳过 name)"] -->|全局来看 age 忽大忽小，完全无序| Slow["B+ 树索引彻底失效，全表扫描 (type: ALL)"]
    end
```

---

## 一、实战建表与索引失效 8 大高频生产场景复现

首先建立一张具有代表性的生产用户测试表：

```sql
CREATE TABLE `t_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID（聚簇索引）',
  `name` VARCHAR(32) NOT NULL COMMENT '姓名',
  `phone` VARCHAR(11) NOT NULL COMMENT '手机号',
  `age` INT NOT NULL COMMENT '年龄',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0禁用 1正常',
  `create_time` DATETIME NOT NULL COMMENT '创建时间',
  INDEX `idx_name_age_status` (`name`, `age`, `status`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

---

### 场景 1：违背最左前缀匹配原则（直接跨列）
```sql
-- ❌ 索引失效：跳过了最左侧的 name，直接用 age 查询，无法走联合索引
EXPLAIN SELECT * FROM t_user WHERE age = 20;
-- 执行计划: type = ALL, key = NULL

-- ✅ 索引生效：包含最左前缀 name，二分检索正常运作
EXPLAIN SELECT * FROM t_user WHERE name = '张三' AND age = 20;
-- 执行计划: type = ref, key = idx_name_age_status
```

---

### 场景 2：在索引列上使用函数或数学运算
```sql
-- ❌ 索引失效：在 create_time 上套了 DATE() 函数，B+ 树存储的是原始 DATETIME，无法走索引
EXPLAIN SELECT * FROM t_user WHERE DATE(create_time) = '2026-11-10';
-- ❌ 索引失效：在 age 上做加减运算
EXPLAIN SELECT * FROM t_user WHERE age + 1 = 25;

-- ✅ 工业级标准改写：将所有计算和转换移至等号右侧常量区！
EXPLAIN SELECT * FROM t_user 
WHERE create_time >= '2026-11-10 00:00:00' 
  AND create_time <= '2026-11-10 23:59:59';
EXPLAIN SELECT * FROM t_user WHERE age = 25 - 1;
-- 执行计划: type = range / ref，高效利用索引
```

---

### 场景 3：隐式类型转换（字符串被传成了数字）
这是线上**最隐蔽、最容易酿成事故**的坑！
```sql
-- ❌ 索引失效（致命）：phone 字段定义为 VARCHAR(11) 字符串，但传入了数字 13800000000
EXPLAIN SELECT * FROM t_user WHERE phone = 13800000000;
-- 底层机制：MySQL 发现类型不匹配，内部会自动执行 CAST(phone AS SIGNED)，相当于给字段加了函数，索引当场失效！

-- ✅ 索引生效：严格带上单引号，保持字符串类型一致
EXPLAIN SELECT * FROM t_user WHERE phone = '13800000000';
-- 执行计划: type = ref, key = idx_phone
```

---

### 场景 4：前缀模糊查询（`LIKE '%abc'`）
```sql
-- ❌ 索引失效：以百分号开头，字符串前缀完全无法确定，B+ 树只能全表扫
EXPLAIN SELECT * FROM t_user WHERE name LIKE '%三';

-- ✅ 索引生效：右侧模糊（保留前缀有序性）
EXPLAIN SELECT * FROM t_user WHERE name LIKE '张%';
-- 执行计划: type = range
```

---

### 场景 5：联合索引中范围查询（`>`, `<`, `BETWEEN`）导致右侧列失效
```sql
-- 联合索引为 (name, age, status)
-- ⚠️ 部分失效：name 命中等值匹配，age 命中范围查询；但在 age > 20 的区间内，status 在物理上已经不是全局有序的了！
EXPLAIN SELECT * FROM t_user WHERE name = '张三' AND age > 20 AND status = 1;
-- key_len 只计算了 name 和 age 的长度，右侧 status 无法继续用于索引二分检索（但能作为 MySQL 5.6+ 的索引下推 ICP 过滤）
```

---

### 场景 6：OR 连接条件中存在未建索引的列
```sql
-- ❌ 索引失效：name 虽然有索引，但 create_time 没建索引。即使走了 name 索引，后半句依然必须回全表扫描，优化器索性直接全表扫
EXPLAIN SELECT * FROM t_user WHERE name = '张三' OR create_time = NOW();
-- 执行计划: type = ALL
```

---

### 场景 7：优化器判定回表成本高于全表扫描
如果表中总共 10 万条数据，你的查询条件命中了其中 3 万条：
- 如果走二级索引，需要先在二级索引树查出 3 万个 ID，然后拿着这 3 万个 ID 发起 **3 万次离散随机磁盘 I/O** 回表去聚簇索引树捞整行；
- 如果直接全表扫描，是 **顺序 I/O 读取**。
- **MySQL 优化器（CBO）在计算代价后，会果断放弃索引直接走全表扫描**！

---

## 二、覆盖索引（Covering Index）与回表极致优化

### 1. 什么是回表与覆盖索引？
- **回表（Table Lookup）**：二级索引叶子节点只保存（索引字段 + 主键 ID）。如果要查询的字段（如 `phone`）不在该二级索引中，就必须拿着主键 ID 回到主键聚簇索引树重新查一次。
- **覆盖索引（无需回表）**：如果查询所需的所有字段，全部包含在当前二级索引中，引擎在二级索引树上就能直接拿齐数据返回！
```sql
-- ✅ 触发覆盖索引：查询的 id, name, age 全在 idx_name_age_status 树上
EXPLAIN SELECT id, name, age FROM t_user WHERE name = '张三';
-- 执行计划: Extra 显示 "Using index"（极致高效，零回表 IO！）
```

---

### 2. 深度优化实战：千万级超大分页（`LIMIT 1000000, 10`）秒级优化
```sql
-- ❌ 传统写法（线上拉垮卡死，耗时 5~10 秒）：
-- MySQL 需要扫描出 1000010 条完整数据，做 1000010 次回表，然后把前 1000000 条扔掉，只返回最后 10 条！
SELECT * FROM t_user ORDER BY id LIMIT 1000000, 10;

-- ✅ 工业级优化方案：延迟关联（利用子查询走覆盖索引先捞出 10 个 ID）
-- 子查询中仅查 id，全部在聚簇索引树内部跑完，零回表；外层只有 10 次精准主键定位，耗时降至 10 毫秒以内！
SELECT a.* 
FROM t_user a
JOIN (
    SELECT id FROM t_user ORDER BY id LIMIT 1000000, 10
) b ON a.id = b.id;
```

---

## 三、生产避坑速查表

| 场景 | 避坑铁律 | EXPLAIN 诊断特征 |
|---|---|---|
| **字符集不一致联表** | 跨多表关联（JOIN）时，两表关联字段的字符集必须一致（如全为 `utf8mb4`，严禁 `utf8` 混用 `utf8mb4`） | 被驱动表关联字段触发隐式转码函数，`type = ALL` |
| **深分页卡顿** | 严禁直接使用大偏移量 `LIMIT offset, size` | 改用延迟关联 JOIN 子查询，或记录上一页最大 ID（`WHERE id > last_id LIMIT size`） |
| **模糊查询需求** | 必须根据中间内容模糊搜索时，不要直接加前缀 `%` | 业务引入 Elasticsearch 或使用 ngram 全文索引 |
| **联合索引字段顺序** | 区分度高的字段放最左边；常用于等值查询的放前面，范围查询的放后面 | 观察 `key_len` 是否吃满了索引中所有列的长度 |

---

## 四、高频面试追问（含高分/低分特征）

| 追问 | 高分回答要点 | 低分回答特征 |
|---|---|---|
| **Q1: 为什么 MySQL 为什么用 B+ 树做索引，而不用 Hash 或红黑树？** | 1. Hash 索引只支持单值等值等号匹配，**天然不支持范围查询（>、<、BETWEEN）和排序**；2. 红黑树是二叉树，随着数据量剧增，树的高度会非常高，每次查询带来大量随机磁盘 IO；3. **B+ 树是多叉宽矮树**（3~4 层即可支撑千万级数据），且叶子节点通过双向链表相连，极大提升了顺序与范围扫描的效率。 | 只说“B+ 树查找快”。 |
| **Q2: 什么是索引下推（ICP, Index Condition Pushdown）？** | MySQL 5.6 引入的特性。当联合索引包含多个列时，如果前缀列满足等值/范围，但后续列无法走二分检索，在没有 ICP 前，存储引擎会把所有满足前缀的数据全部回表交给 Server 层过滤；开启 ICP 后，存储引擎在二级索引树遍历时，会先直接比对联合索引中已有的后续字段值，不符合的直接在底层过滤掉，**大幅减少了无意义的回表次数**（EXPLAIN 会显示 `Using index condition`）。 | “不知道什么是索引下推”。 |
| **Q3: 为什么索引字段区分度不高（如性别）不建议建索引？** | 性别字段只有“男/女”，区分度极低。在全表 1000 万数据中，查“男”会命中约 500 万条。如果走二级索引，会引发 500 万次随机回表 IO，代价远高于整表顺序扫描。优化器会直接忽略该索引，建了白白浪费写性能和磁盘空间。 | “因为男女只有两个值，不好建”。 |
