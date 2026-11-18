---
title: 慢查询日志捕获与优化器追踪 (optimizer_trace)
description: 拆解慢查询日志精准配置、mysqldumpslow 聚合分析工具，深入利用 optimizer_trace 剖析优化器索引选择与成本计算逻辑。
---

# 慢查询日志捕获与优化器追踪 (optimizer_trace)

很多开发者在面对线上慢查询时，往往只是盲目地“猜索引”或者执行 `EXPLAIN`。但当 `EXPLAIN` 显示没有走你期望的索引、反而走了全表扫描时，很多人就束手无策了：“为什么我明明建了索引，MySQL 却偏偏不走？”

要彻底解开这个谜团，必须学会**慢查询日志捕获工具**以及 MySQL 官方提供的终极底层探针 —— **`optimizer_trace`（优化器追踪）**。

---

## 1. 慢查询日志（Slow Query Log）全套配置规范

慢查询日志是发现系统性能瓶颈的第一现场。

### 1.1 核心参数精准配置
建议在生产配置 `my.cnf` 中进行如下标准化配置：

```ini
[mysqld]
# 1. 开启慢查询日志
slow_query_log = 1

# 2. 慢查询物理日志存放路径
slow_query_log_file = /var/log/mysql/mysql-slow.log

# 3. 慢查询阈值（超过此秒数即记录，支持微秒级别。建议线上设为 0.5s 或 1s）
long_query_time = 0.5

# 4. 是否记录没有使用索引的查询（根据磁盘 I/O 谨慎开启）
log_queries_not_using_indexes = 0

# 5. 限制每分钟记录无索引 SQL 的条数（防止突发把磁盘刷爆）
log_throttle_queries_not_using_indexes = 60

# 6. 管理语句（如 OPTIMIZE, ANALYZE, ALTER）是否计入慢日志
log_slow_admin_statements = 1
```

---

## 2. 慢查询分析神器：mysqldumpslow 实战

生产慢日志可能每天产生数十万行，肉眼直接 `cat` 或 `grep` 效率极低。MySQL 官方自带了聚合分析脚本工具 `mysqldumpslow`。

### 2.1 常用参数选项
- `-s`：排序方式。`c`（访问次数）、`t`（查询耗时）、`l`（锁等待时间）、`r`（返回行数）。
- `-t`：返回前 $N$ 条（Top N）。
- `-g`：支持正则表达式过滤。

### 2.2 生产典型命令示例
```bash
# 1. 得到访问次数最多的 10 条 SQL（高频慢查）
mysqldumpslow -s c -t 10 /var/log/mysql/mysql-slow.log

# 2. 得到按照单次执行耗时排序的前 10 条慢查询（单次极慢的大查询）
mysqldumpslow -s t -t 10 /var/log/mysql/mysql-slow.log

# 3. 得到包含左连接的按耗时排序的前 5 条 SQL
mysqldumpslow -s t -t 5 -g "left join" /var/log/mysql/mysql-slow.log
```

---

## 3. 核心核武器：使用 optimizer_trace 洞察优化器选路

有时优化器选错索引，开发人员感到困惑。MySQL 5.6+ 提供了 `optimizer_trace`，能把优化器在评估每一种执行路径时的**物理成本计算过程（Cost Model）**完整打印出来！

### 3.1 开启与抓取步骤
`optimizer_trace` 极其消耗内存，**绝不能在线上全局长效开启**，仅在排查会话中临时使用：

```sql
-- 1. 打开 optimizer_trace 开关
SET optimizer_trace="enabled=on";

-- 2. 执行出现疑惑的慢查询 SQL
SELECT * FROM orders WHERE user_id = 100 AND status = 1;

-- 3. 查看优化器的决策完整链路 JSON
SELECT * FROM information_schema.OPTIMIZER_TRACE\G

-- 4. 排查完毕必须立刻关闭开关！
SET optimizer_trace="enabled=off";
```

### 3.2 拆解 OPTIMIZER_TRACE 的 JSON 关键段落

输出的 JSON 主要包含三大阶段：
1. **`join_preparation`**：语法准备、常量折叠与表达式简化；
2. **`join_optimization`**：**核心优化阶段**，评估所有候选索引与全表扫描的成本；
3. **`join_execution`**：最终调用执行器执行。

在 `join_optimization` 中重点观察 `considered_execution_plans`：

```json
{
  "rows_estimation": [
    {
      "table": "`orders`",
      "table_scan": {
        "rows": 100000,
        "cost": 10250.5  <-- 全表扫描代价 (根据页数与行数计算)
      }
    },
    {
      "index": "idx_user_id",
      "rows": 30000,
      "cost": 36200.2, <-- 走 idx_user_id 索引扫描代价 + 30000 次回表代价！
      "chosen": false, <-- 为什么不选它？因为 36200 > 10250，优化器判定回表成本远高于全表扫描！
      "cause": "cost"
    }
  ]
}
```

#### 顿悟时刻：
看懂了 `cost`，你就瞬间明白了优化器的底层逻辑：
- 并不是“有索引就必须走”！
- 当走二级索引预估命中的行数占全表比例较大时（例如超过 20%~30%），**回表带来的随机磁盘 I/O 代价，远比直接连续顺序读取整张表（顺序 I/O）更加昂贵**！
- 优化器在客观计算了两个方案的真实代价后，理性地放弃了索引，选择了全表扫描！

---

## 4. 优化器失算的生产自救方案

如果优化器是因为**基数统计偏差（Cardinality 不准）**而误判：
1. **重新采样收集统计信息**：
   ```sql
   ANALYZE TABLE orders;
   ```
2. **使用覆盖索引消除回表成本**：修改 SELECT 列表，让索引树涵盖所需字段，使索引成本大幅下降低于全表扫描。
3. **线上应急强制指定索引（FORCE INDEX）**：
   ```sql
   SELECT * FROM orders FORCE INDEX(idx_user_id) WHERE user_id = 100 AND status = 1;
   ```
