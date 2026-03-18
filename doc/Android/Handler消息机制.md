---
title: Android Handler消息机制
---

# Android Handler消息机制

`Handler` 是 Android 中最经典的线程通信机制之一，本质是 `Handler + MessageQueue + Looper` 三者协作完成消息派发。面试中常和线程切换、主线程更新 UI、内存泄漏一起考。

## 1. 核心组成

### 1.1 Handler

- 负责发送和处理消息。
- 常见方法有 `sendMessage()`、`post()`、`postDelayed()`。

### 1.2 MessageQueue

- 每个线程最多只有一个 `MessageQueue`。
- 本质是一个按执行时间排序的消息队列，不是严格意义上的先进先出。

### 1.3 Looper

- 负责开启消息循环，不断从 `MessageQueue` 中取消息并分发给对应的 `Handler`。
- 主线程在应用启动时已经自动创建好 `Looper`。

### 1.4 Message

- 消息载体，用于传递 `what`、`arg1`、`arg2`、`obj` 等数据。
- 内部使用对象池复用，减少频繁创建对象带来的 GC 压力。

## 2. 工作流程

1. 线程先调用 `Looper.prepare()` 创建 `Looper` 和 `MessageQueue`。
2. 创建 `Handler`，它会绑定当前线程的 `Looper`。
3. 通过 `sendMessage()` 或 `post()` 往队列中插入消息或任务。
4. `Looper.loop()` 不断轮询队列。
5. 取出消息后，回调 `Handler.dispatchMessage()`，再进入 `handleMessage()` 或执行 `Runnable`。

## 3. 为什么主线程可以更新 UI？

- 因为 Android UI 工具包不是线程安全的。
- 系统要求所有 View 的创建、绘制、事件分发都在主线程执行。
- 主线程天然持有 `Looper`，因此可以通过 `Handler`、`runOnUiThread`、协程 `Dispatchers.Main` 等方式安全更新 UI。

## 4. `post()` 和 `sendMessage()` 的区别

- `post()` 本质是把 `Runnable` 包装成消息后放入队列。
- `sendMessage()` 直接发送 `Message` 对象，适合传递标识和简单数据。
- 现代项目里，简单延迟任务常用 `post()`，复杂状态分发更常见 `Message` 或协程/Flow。

## 5. 子线程如何使用 Handler？

子线程默认没有 `Looper`，需要手动准备：

```kotlin
Thread {
    Looper.prepare()

    val handler = object : Handler(Looper.myLooper()!!) {
        override fun handleMessage(msg: Message) {
            // 处理消息
        }
    }

    Looper.loop()
}.start()
```

实际开发中，子线程消息循环更常用 `HandlerThread`：

```kotlin
val handlerThread = HandlerThread("work-thread")
handlerThread.start()
val workHandler = Handler(handlerThread.looper)
workHandler.post {
    // 后台任务
}
```

## 6. HandlerThread 是什么？

- `HandlerThread` 本质是一个自带 `Looper` 的线程。
- 适合串行后台任务，比如日志写入、埋点落盘、轻量 IO。
- 优点是简单；缺点是单线程串行，吞吐有限，不适合大量并发任务。

## 7. 为什么 Handler 容易内存泄漏？

典型场景：

- Activity 内部类 `Handler` 默认持有外部 Activity 引用。
- 消息队列里有延迟消息。
- 页面退出后消息仍未处理完成，导致 Activity 无法回收。

解决方案：

- 静态内部类 + `WeakReference`。
- 在 `onDestroy()` 中调用 `removeCallbacksAndMessages(null)`。
- 优先使用 `lifecycleScope`、`viewModelScope` 等生命周期感知方案。

## 8. IdleHandler 是什么？

- `MessageQueue.IdleHandler` 会在消息队列暂时空闲时回调。
- 常用于延迟初始化、预加载、非核心任务分批执行。
- 注意不能放重任务，否则会影响下一轮消息处理。

## 9. 同步屏障是什么？

- 同步屏障会阻塞普通同步消息，让异步消息优先执行。
- Choreographer 渲染调度就依赖同步屏障来保障 UI 刷新优先级。
- 面试中提到即可，不必展开到源码细节。

## 10. 常见面试题

### Q1: `Looper.prepare()` 和 `Looper.loop()` 分别做了什么？
- `prepare()` 负责给当前线程创建 `Looper` 和 `MessageQueue`。
- `loop()` 负责开启死循环，从队列中不断取消息并分发。

### Q2: 一个线程可以有几个 Looper 和 Handler？
- 一个线程只能有一个 `Looper` 和一个 `MessageQueue`。
- 但可以有多个 `Handler`，它们共享同一个 `Looper`。

### Q3: `postDelayed()` 为什么能实现延迟执行？
- 因为消息入队时会记录触发时间，`MessageQueue` 会按时间排序。
- `Looper` 轮询时只有到达执行时机的消息才会被取出。

### Q4: `Handler.post()` 和 `View.post()` 有什么关系？
- `View.post()` 最终也是借助主线程 Handler 把任务切回 UI 线程。
- 区别在于 `View.post()` 依赖 View 附着状态，在某些 UI 场景更方便。

### Q5: 现在有协程了，为什么还要懂 Handler？
- 因为很多 Android 底层机制仍基于消息循环。
- 协程切主线程、View 事件分发、Choreographer、AMS 回调，底层都能看到 Handler/Looper 的影子。

## 11. 小结

`Handler` 的核心不是 API 用法，而是理解 Android 为什么要用“单线程 + 消息循环”驱动 UI。面试里把 `Looper`、`MessageQueue`、线程切换、泄漏治理这四点讲清楚，基本就够了。
