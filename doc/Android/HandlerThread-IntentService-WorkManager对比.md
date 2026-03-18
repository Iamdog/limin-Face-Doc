---
title: Android HandlerThread-IntentService-WorkManager对比
---

# Android HandlerThread / IntentService / WorkManager 对比

这三个方案都能做后台任务，但定位完全不同。面试核心是讲清楚“任务时效性、生命周期、可靠性、系统约束”。

## 1. HandlerThread

- 本质是带 `Looper` 的后台线程。
- 适合串行短任务。
- 进程被杀后任务不保活。
- 需要自己管理线程退出、异常和重试。

适用场景：
- 日志落盘、轻量本地 IO、串行任务队列。

## 2. IntentService（已过时）

- 基于 Service + 工作线程，按队列串行处理 Intent。
- 任务执行完会自动 `stopSelf()`。
- Android 8.0+ 后台限制后，很多场景不再推荐。
- 官方更推荐迁移到 WorkManager。

适用场景：
- 老项目存量维护。

## 3. WorkManager

- 面向“可延迟但必须执行”的可靠任务。
- 支持约束条件（网络、充电、空闲等）。
- 支持进程重启后继续执行。
- 底层会按系统版本自动选择调度器（如 JobScheduler）。

适用场景：
- 数据同步、日志上报、离线任务补偿、周期任务。

## 4. 核心对比

| 维度 | HandlerThread | IntentService | WorkManager |
| --- | --- | --- | --- |
| 任务模型 | 串行线程消息循环 | 串行处理 Intent | 可靠任务调度 |
| 后台限制兼容 | 弱 | 弱（新系统受限） | 强 |
| 进程被杀后 | 丢失 | 多数丢失 | 可恢复 |
| 约束条件 | 需自实现 | 基本无 | 原生支持 |
| 推荐程度 | 视场景可用 | 不推荐新用 | 推荐 |

## 5. 面试高频问题

### Q1: 为什么 IntentService 被淘汰？
A: Android 后台执行限制加强后，IntentService 很多场景不再可靠，官方推荐用 WorkManager。

### Q2: WorkManager 会立即执行吗？
A: 不保证立即执行。它保证“最终执行”，并按约束和系统策略调度。

### Q3: HandlerThread 和线程池怎么选？
A: 需要单线程串行 + Looper 消息循环选 HandlerThread；需要并发吞吐选线程池。

### Q4: 周期任务首选什么？
A: 新项目优先 WorkManager，不建议手写常驻 Service 保活。

### Q5: 哪种适合关键离线补偿任务？
A: WorkManager，因为它支持持久化和系统级调度恢复。

## 6. 小结

临时、轻量、进程内任务可用 HandlerThread；老代码里会见到 IntentService；需要可靠执行、跨重启恢复和约束调度，首选 WorkManager。
