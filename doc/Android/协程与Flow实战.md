---
title: Android 协程与Flow实战
---

# Android 协程与Flow实战

协程和 Flow 是现代 Android 面试高频，核心是线程调度、结构化并发、状态流设计和取消语义。

## 1. 协程核心价值

- 用更低心智成本管理异步任务。
- 生命周期可绑定，减少泄漏风险。
- 结构化并发让取消和异常传播可控。

## 2. 常见作用域

- `lifecycleScope`：页面级任务。
- `viewModelScope`：页面状态任务，随 ViewModel 生命周期存在。
- 自定义 `CoroutineScope`：模块内部长期任务。

## 3. Dispatcher 选择

- `Dispatchers.Main`：UI 更新。
- `Dispatchers.IO`：网络、数据库、文件。
- `Dispatchers.Default`：CPU 密集型计算。

## 4. Flow 与 LiveData 的差异

- Flow 更通用，操作符更丰富。
- Flow 默认冷流，只有被收集才执行。
- LiveData 生命周期感知更直接，但复杂流式处理能力较弱。

## 5. StateFlow 与 SharedFlow

- `StateFlow`：保存“当前状态”，适合页面状态渲染。
- `SharedFlow`：广播事件流，适合一次性事件或多订阅分发。

## 6. 常见面试题

### Q1: 为什么推荐在 ViewModel 中发起协程？
A: 因为 ViewModel 生命周期更稳定，能避免 Activity 重建导致任务反复启动。

### Q2: `launch` 和 `async` 的区别？
A: `launch` 返回 `Job`，适合无返回值任务；`async` 返回 `Deferred`，适合需要结果的并发任务。

### Q3: Flow 为什么默认是冷流？
A: 为了避免无订阅时无意义执行，减少资源浪费。

### Q4: 如何避免重复收集导致重复请求？
A: 在 UI 层使用 `repeatOnLifecycle`，在数据层做缓存/去重。

### Q5: 协程能彻底替代线程池吗？
A: 不能。协程是并发模型，底层仍依赖线程池执行。

## 7. 小结

面试回答重点是：作用域、调度器、取消机制、Flow 选型边界。把这四点讲清楚，基本能覆盖大部分协程题。
