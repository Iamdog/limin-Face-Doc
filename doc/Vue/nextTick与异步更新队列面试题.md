---
title: nextTick与异步批量更新队列底层原理
---

# nextTick与异步批量更新队列底层原理

## 🎯 招聘面试核心考点
- **面试官设问**：“`nextTick` 的底层实现原理是什么？为什么你在修改了响应式数据之后，立即通过 `document.getElementById` 获取 DOM 内容拿到的还是旧值？”
- **深水区追问**：“如果在同一个方法里连续执行 1000 次 `count.value++`，Vue 底层到底会执行多少次虚拟 DOM 计算与真实 DOM 渲染？Vue 2 中为了兼容各种环境写了多层降级，为什么 Vue 3 能够彻底精简为 **`Promise.then` 微任务**？请手写一个极简的异步批量去重调度器（Scheduler）！”

---

## 一、 为什么数据修改不能立即同步更新 DOM？

### 1. 同步更新的灾难分析
想象一下如果没有异步更新队列：
```javascript
for (let i = 0; i < 1000; i++) {
  count.value++
}
```
如果每次 `count.value++` 都立即触发真实的 DOM 重排（Reflow）与重绘（Repaint），浏览器主线程会在一瞬间执行 1000 次昂贵的图形计算，**整个页面将瞬间卡死、掉帧严重**。

### 2. 批量异步更新（Batch Update）核心哲学
- Vue 的更新机制是 **异步的（Asynchronous）** 且是 **批量聚合的（Batched）**。
- 当响应式数据发生改变时，Vue 不会立刻去操作真实 DOM，而是开启一个微任务队列，将这个需要更新的组件渲染 Effect（或 Watcher）**推入一个带有去重特性的全局待处理任务队列中**。
- 无论你在一次同步代码执行过程中修改了多少次数据，**同一个组件的渲染 Effect 在队列中只会被保留一份**！直到当前所有同步 JavaScript 脚本全部执行完毕，才在**微任务（Microtask）**阶段一次性执行 DOM 统一更新！

---

## 二、 结合浏览器 EventLoop 详解更新时序

```text
  [主线程同步任务]                  [微任务队列 (Microtask Queue)]
        │                                         │
        ├── 1. count.value++                      │
        │      (触发 Setter，推入渲染 Effect) ────┼──> [Job 1: 异步更新组件 DOM]
        │                                         │
        ├── 2. count.value++                      │
        │      (检测到 Job 1 已在队列中，直接去重)  │
        │                                         │
        ├── 3. nextTick(() => { ... }) ───────────┼──> [Job 2: 开发者 nextTick 回调]
        │                                         │
  [同步任务执行完毕]                              │
        │                                         ▼
        └─────────────────────────────────> 按顺序依次执行:
                                            1. 先执行 Job 1: 真实更新并挂载 DOM
                                            2. 再执行 Job 2: 此时用户回调拿到最新 DOM！
```

- **为什么在修改数据后立即调 `nextTick` 能拿到最新 DOM？**
  因为 `nextTick` 本身也是利用 `Promise.then` 将你的回调注册进微任务队列。由于**组件的渲染更新 Job 是在修改数据时先一步注册进微任务队列的**，根据队列“先进先出（FIFO）”原则，组件 DOM 渲染必定在你的 `nextTick` 回调之前执行完毕！

---

## 三、 Vue 2 vs Vue 3 nextTick 底层源码演进

- **Vue 2 的复杂降级链（兼顾古董浏览器）**：
  Vue 2 源码中采用四层降级策略：优先 `Promise.then`（微任务） ➔ 不支持则降级为 `MutationObserver`（微任务） ➔ 再不支持则降级为 `setImmediate`（宏任务） ➔ 最终兜底为 `setTimeout(fn, 0)`（宏任务）。
- **Vue 3 的极简革命（拥抱现代浏览器标准）**：
  Vue 3 明确不再支持 IE 11 等老旧浏览器，原生 `Promise` 已在所有现代浏览器中得到 100% 普遍支持。
  **Vue 3 的 `nextTick` 核心源码精简到了极致，本质就是一行代码：**
  ```typescript
  // Vue 3 核心 nextTick 源码
  export function nextTick<T = void>(
    this: T,
    fn?: (this: T) => void
  ): Promise<void> {
    const p = currentFlushPromise || resolvedPromise
    return fn ? p.then(this ? fn.bind(this) : fn) : p
  }
  ```

---

## 四、 最小可运行 MVP 实战：手写一个异步批量去重调度器

面试官最爱考现场编码能力：“请不借助 Vue，手写一个能将多次同步修改合并为单次异步更新的简易调度函数”：

```javascript
// mini_scheduler.js

// 1. 全局任务队列（使用 Set 数据结构天然去重）
const queue = new Set();
let isFlushing = false;

function queueJob(job) {
  // 天然去重：同一个任务无论被提交多少次，Set 里始终只有 1 个
  queue.add(job);

  if (!isFlushing) {
    isFlushing = true;

    // 核心：利用 Promise.resolve().then 推入浏览器微任务队列
    Promise.resolve().then(() => {
      try {
        // 在微任务中一次性清空并执行所有任务
        queue.forEach((job) => job());
      } finally {
        isFlushing = false;
        queue.clear();
      }
    });
  }
}

// ================= 测试验证 =================
// 模拟组件的真实 DOM 渲染函数
const renderComponent = () => {
  console.log(`[DOM 真实渲染触发] 当前最终时间戳: ${Date.now()}`);
};

console.log('--- 1. 开始同步并发修改数据 ---');
// 连续触发 5 次更新请求
queueJob(renderComponent);
queueJob(renderComponent);
queueJob(renderComponent);
queueJob(renderComponent);
queueJob(renderComponent);

console.log('--- 2. 同步任务结束，等待微任务触发 ---');

// 控制台输出结果：
// --- 1. 开始同步并发修改数据 ---
// --- 2. 同步任务结束，等待微任务触发 ---
// [DOM 真实渲染触发] 当前最终时间戳: xxxx  <--- 验证成功：5 次修改被完美压缩成 1 次真实渲染！
```
