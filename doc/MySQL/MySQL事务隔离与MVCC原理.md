---
title: MySQL 事务隔离与 MVCC 原理
---

# MySQL 事务隔离与 MVCC 原理

## 一、解决什么问题

事务用于让一组业务修改按规则提交或回滚，隔离用于约束并发观察和冲突。先会 BEGIN/COMMIT/ROLLBACK 和条件更新，再理解快照、锁和 MVCC。本文以 InnoDB 为范围。

## 二、基本使用：先做一次可重复的双会话实验

在测试库准备数据：

```sql
CREATE TABLE account_demo (
  id BIGINT PRIMARY KEY,
  balance INT NOT NULL
) ENGINE=InnoDB;
INSERT INTO account_demo VALUES (1, 100);
```

会话 A：

```sql
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;
SELECT balance FROM account_demo WHERE id = 1; -- 100，建立快照
```

会话 B：

```sql
UPDATE account_demo SET balance = 200 WHERE id = 1;
COMMIT;
```

回到会话 A：

```sql
SELECT balance FROM account_demo WHERE id = 1; -- 仍为 100
SELECT balance FROM account_demo WHERE id = 1 FOR UPDATE; -- 200，当前读
ROLLBACK;
```

将数据恢复为 100，再把 A 改为 READ COMMITTED 重做：B 提交后第二次普通 SELECT 可读到 200。两次实验均需先完成上一事务，且明确 autocommit；普通 BEGIN 本身不一定立即建立 RR 一致性快照。

## 三、常见场景：余额扣减与锁等待

```sql
START TRANSACTION;
UPDATE account_demo SET balance = balance - 20
WHERE id = 1 AND balance >= 20;
-- 应用必须判断影响行数：1 表示成功，0 表示条件不满足
COMMIT;
```

不能先普通 SELECT 检查余额，再不带条件扣减，这会有并发竞态。多行转账应在同一事务中按稳定顺序锁定并修改；不要在事务里等待慢网络调用。

锁等待不等于死锁：一个事务等另一个释放锁是等待，多个事务形成循环等待才可能死锁。死锁重试应回滚后重试整个业务事务，并确保业务幂等。

## 四、隔离级别与读取方式

| 隔离级别 | 基本行为 | InnoDB 需要区分的边界 |
|---|---|---|
| RU | 可能读未提交数据 | 不适合大多数需要可靠业务语义的场景 |
| RC | 普通一致性读每次建立新 ReadView | 不可重复读；通常减少间隙锁，但外键/唯一检查等有例外 |
| RR | 普通一致性读复用首次 ReadView | 当前读与自身写入仍可看到新状态，不能把混合读取当作固定快照 |
| Serializable | 加强隔离 | 并发读写可能阻塞；普通 SELECT 的加锁行为与 autocommit 有关 |

普通一致性读与 `SELECT ... FOR UPDATE/FOR SHARE`、UPDATE/DELETE 的锁定行为不同。写操作基于当前状态并获取必要锁；锁范围由访问路径、索引、隔离级别和具体操作决定，并不是所有当前读都一定加相同间隙锁。

## 五、最后深入：MVCC 的版本与可见性

InnoDB 维护记录的事务标识与回滚指针，用 undo 信息重建历史版本。更新会保存必要的旧版本信息并改变当前记录，不能理解成从不覆盖当前记录。历史版本在不再被需要时由 purge 清理。

ReadView 记录创建者、活跃事务集合和可见性上下界。简化判定：自身修改可见；早于最小活跃事务的版本可见；晚于快照分配边界的版本不可见；中间范围检查当时是否活跃，不可见时沿 undo 版本链查找。

RC 每次普通一致性读创建快照，RR 通常复用首次一致性读的快照。自身写入可以被自身看到，因此混合快照读和写入的结果不能总解释成某个单一时刻的数据库状态。快照读减少数据行的读写冲突，但仍可能受元数据锁等影响。

## 六、无索引更新：锁范围扩大，不是行锁升级成表锁

InnoDB 没有因为行锁多就自动升级为表锁的通用机制。缺少合适索引可能扫描并锁住大量索引记录；在 RR 等情况下还可能锁住相关间隙，表现为大量并发操作被阻塞。RC 下非匹配记录的锁处理和间隙锁策略不同，不能说“无索引必定锁所有行和所有间隙”。

通过 EXPLAIN 确认访问路径，结合 `performance_schema.data_locks`、`data_lock_waits`、事务信息和死锁日志分析实际等待。增加索引也需要评估选择性和写入成本，不是只要 WHERE 有索引就不会冲突。

## 七、面试与治理追问

| 基础题 | 场景追问 | 深入要点 |
|---|---|---|
| 事务如何提交和回滚？ | 更新后抛异常为何没回滚？ | 框架代理、回滚规则、事务边界 |
| RC/RR 有什么区别？ | 同一事务为什么前后读不同？ | ReadView 创建时机，区分快照与当前读 |
| MVCC 用于什么？ | 长事务为何阻碍清理？ | undo 版本链、purge 和历史保留 |
| RR 如何处理幻读？ | 混合当前读与快照读会发生什么？ | 快照稳定与锁范围分别讨论，不给绝对结论 |
| 无索引 UPDATE 为什么阻塞范围大？ | 是否升级成表锁？ | 扫描范围与记录/间隙锁，没有自动锁升级 |
| RC 是否完全没有 Gap Lock？ | 唯一键/外键检查呢？ | 通常关闭扫描间隙锁，但存在例外 |
| 锁超时与死锁区别？ | 如何安全重试？ | 等待链、事务回滚、稳定加锁顺序和幂等 |

优化先缩短事务、改善访问路径和一致加锁顺序，再根据业务语义选择隔离级别。RC 不保证一定更快，也不保证长事务没有历史版本压力。
