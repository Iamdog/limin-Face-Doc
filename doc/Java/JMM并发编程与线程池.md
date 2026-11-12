---
title: JMM并发编程与线程池调优
---

# JMM并发编程与线程池调优

## 使用入口：先解决问题，再做验证

安全共享数据并控制并发任务。

**先做基本操作**：先使用 ExecutorService 提交、等待、取消并关闭任务，复现共享计数竞争，再解释原子性、可见性和锁。初次学习可先完成[本模块基础实践](/doc/Java/Java语言基础与日常开发)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

> **一句话大白话**：
> - **JMM（Java 内存模型）**：多核 CPU 跑得太快，每个核都有自己的私家小抽屉（L1/L2 高速缓存与工作内存）。为了不读到别家抽屉里的过期数据，JMM 制定了规则：`volatile` 就是给共享数据装了根“光纤专线”，只要有人改了，立马通电强刷回主仓库，并让其他所有抽屉里的旧数据当场作废！
> - **AQS（锁的基石）**：就是一个**带叫号机的银行大堂经理**。谁先抢到窗口（CAS 抢到 `state=1`）谁就办业务；没抢到的按先来后到去后面的长椅（CLH 双向排队链表）上坐着睡觉（`park()`），前面办完了大堂经理再叫下一个起来（`unpark()`）。
> - **线程池**：就像**一家外卖站点的骑手运力调度系统**。固定编制（核心线程）负责日常底量，高峰期先堆积进暂存货架（阻塞队列）；货架堆满了才招募临时工（最大线程）；爆仓了就执行拒单策略（拒绝策略）。

---

## 30 秒生活比喻：外卖站点的运力调度模型

- **核心线程数（正式全职骑手 `corePoolSize`）**：
  站点里签了长期合同的 5 位正式员工。就算今天雨天没单子，也不会被辞退，随时待命。
- **阻塞队列（外卖架子 `workQueue`）**：
  中午高峰期单子像雪花一样飞来，5 位正式骑手手头全占满了。新订单先整整齐齐码在架子上排队。
- **最大线程数（临时兼职骑手 `maximumPoolSize`）**：
  外卖架子全堆满了（比如最多堆 500 单），订单还在源源不断涌进来！站长赶紧在微信群里临时喊兼职骑手来帮忙，站点骑手总人数扩充到 10 人。
- **存活时间（临时工闲置解聘 `keepAliveTime`）**：
  下午两点大促高峰过去，兼职骑手如果连续闲了 60 秒都没接单，站长直接结账让他们下班回家，站点运力缩容回 5 位正式骑手。
- **拒绝策略（前台关单机制 `handler`）**：
  架子堆满了、兼职骑手也全部跑到极限了，外卖软件如果还提示来新订单，系统启动兜底防御：直接退回给顾客说“运力饱和暂不接单（`AbortPolicy`）”或者“让顾客自己来后厨端菜（`CallerRunsPolicy` 调用方线程直接执行）”。

---

## 一张图看懂 JMM 内存结构与线程池任务派发机制

```mermaid
flowchart TD
    subgraph 线程池任务派发完整四步法
    Task["新任务提交 (execute)"] --> CheckCore{"1. 当前运行线程数 < corePoolSize ?"}
    CheckCore --"是"--> CreateCore["创建并启动核心工作线程处理"]
    CheckCore --"否"--> CheckQueue{"2. 阻塞队列 workQueue 未满 ?"}
    CheckQueue --"未满"--> Enqueue["任务放入阻塞队列等待排队"]
    CheckQueue --"已满"--> CheckMax{"3. 当前线程数 < maximumPoolSize ?"}
    CheckMax --"是"--> CreateNonCore["紧急创建临时非核心线程处理"]
    CheckMax --"已满"--> Reject["4. 触发饱和拒绝策略 RejectedExecutionHandler"]
    end

    subgraph JMM 内存可见性交互
    T1["线程 1 (工作内存)"] <-->|"volatile 写: 插入内存屏障即时刷新"| MainMem[("主内存 (所有线程共享)") ]
    T2["线程 2 (工作内存)"] <-->|"volatile 读: 强制从主内存重新加载最新值"| MainMem
    end
```

---

## 一、volatile 核心机制与指令重排实战捕获

### 1. `volatile` 的三大核心特性
- **保证内存可见性**：底层利用 CPU 缓存一致性协议（如 Intel 的 MESI）。任何对 `volatile` 变量的写操作都会强制在汇编指令前添加 `lock` 前缀，把工作内存的数据即时刷入主内存，并让其他核心对应缓存行（Cache Line）状态置为无效（Invalid），迫使其下次读取必须重新访问主内存。
- **禁止指令重排序**：在编译和运行时，JVM 会在指令前后插入四种**内存屏障（Memory Barrier：LoadLoad、StoreStore、LoadStore、StoreLoad）**，确保前后指令不被打乱。
- **注意：`volatile` 不保证原子性**！
  - 像 `count++` 这种操作在底层字节码分为：读值、加一、写回三步。如果两个线程同时读到 10，分别加到 11 写回，最终结果是 11 而不是 12。保证原子性必须使用 `synchronized` 或 `AtomicInteger`（底层 CAS）。

---

### 2. 编写代码：亲手捕获指令重排序现场
编译器和 CPU 为了榨干流水线性能，在保证单线程“执行结果等价”（as-if-serial 语义）的前提下，会对没有依赖关系的指令调换执行顺序。在多线程环境下，这会导致诡异的并发 Bug！

```java
public class InstructionReorderVerifier {

    private static int a = 0, b = 0;
    private static int x = 0, y = 0;

    public static void main(String[] args) throws InterruptedException {
        int loopCount = 0;
        while (true) {
            loopCount++;
            // 每次循环前重置变量
            a = 0; b = 0; x = 0; y = 0;

            // 线程 1 执行: 先写 a，再读 b 赋给 x
            Thread t1 = new Thread(() -> {
                a = 1;
                x = b;
            });

            // 线程 2 执行: 先写 b，再读 a 赋给 y
            Thread t2 = new Thread(() -> {
                b = 1;
                y = a;
            });

            t1.start();
            t2.start();
            t1.join();
            t2.join();

            /*
             * 按照正常的先后顺序，只可能出现：
             * 1. t1 先跑完: a=1, x=0, b=1, y=1  -> (x=0, y=1)
             * 2. t2 先跑完: b=1, y=0, a=1, x=1  -> (x=1, y=0)
             * 3. 交叉跑:   a=1, b=1, x=1, y=1  -> (x=1, y=1)
             * 
             * 绝不可能出现 x=0 且 y=0！
             * 如果出现 x=0 且 y=0，唯一的原因就是：CPU 或 JIT 编译器在执行时发生了指令重排（先执行了 x=b / y=a，后执行了 a=1 / b=1）！
             */
            if (x == 0 && y == 0) {
                System.out.printf("💥 [成功捕获] 在并发迭代第 %d 次时，发生指令重排序：x=0, y=0!%n", loopCount);
                break;
            }
        }
    }
}
```

---

## 二、AQS（AbstractQueuedSynchronizer）核心架构

AQS 是 `ReentrantLock`、`CountDownLatch`、`Semaphore`、`ReentrantReadWriteLock` 的共同基石。它的架构极其精炼：

1. **`volatile int state`（核心同步状态标尺）**：
   - 0 代表空闲无人占用；
   - 1 代表锁已被某个线程独占；
   - 大于 1 代表持有该锁的线程发生了**重入**（每次重入 state 加一，退出时减一）。
2. **CAS 原子修改状态**：
   - 线程通过 `compareAndSetState(0, 1)` 尝试抢锁。底层调用操作系统的原子硬件指令 `cmpxchg`，只有一个线程能成功，无锁自旋开销小。
3. **CLH 变体双向链表队列**：
   - 没抢到锁的线程，会被包装成 `Node` 节点，加入到双向链表的队尾。
   - 节点设置等待状态（如 `SIGNAL = -1`），随后通过底层 **`LockSupport.park()`** 让当前线程安全挂起让出 CPU。
   - 当持有锁的线程调用 `unlock()` 时，`state` 归零，并调用 **`LockSupport.unpark(head.next)`** 唤醒排在首位的排队线程。

---

## 三、工业级自定义线程池生产配置

### 为什么大厂规范严禁使用 `Executors`？
- **`Executors.newFixedThreadPool()` 和 `newSingleThreadExecutor()`**：
  底层默认使用的阻塞队列是 `new LinkedBlockingQueue<Runnable>()`。其默认容量为 **`Integer.MAX_VALUE`（21 亿多）**，接近无界！当上游流量激增、下游处理变慢时，任务无限堆积进内存，**直接引发 JVM 堆内存 OOM 导致进程崩盘**！
- **`Executors.newCachedThreadPool()`**：
  最大线程数允许开到 `Integer.MAX_VALUE`，高并发下一瞬间创建几万个操作系统线程，直接榨干操作系统线程数上限和物理内存。

---

### 企业级线程池标准配置模板
```java
package com.example.concurrent.pool;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class ProductionThreadPoolFactory {

    private static final Logger log = LoggerFactory.getLogger(ProductionThreadPoolFactory.class);

    public static ThreadPoolExecutor createBusinessThreadPool(String poolName) {
        // 1. 获取物理机可用核心数
        int cpuCores = Runtime.getRuntime().availableProcessors();

        /*
         * 线程数估算公式经验法则：
         * - CPU 密集型任务（加解密、排序计算）：core = cpuCores + 1
         * - IO 密集型任务（网络 RPC、查询 DB、发消息）：core = cpuCores * 2 到 cpuCores / (1 - 阻塞系数)
         */
        int corePoolSize = cpuCores;
        int maxPoolSize = cpuCores * 2;
        long keepAliveTime = 60L;

        return new ThreadPoolExecutor(
            corePoolSize,
            maxPoolSize,
            keepAliveTime,
            TimeUnit.SECONDS,
            // 2. 强制使用有界队列，设置合理的容量上限，防止任务堆积打爆内存
            new ArrayBlockingQueue<>(1000),
            // 3. 必须自定义 ThreadFactory，为线程赋予有业务意义的前缀，方便线上 jstack 查故障
            new ThreadFactory() {
                private final AtomicInteger threadIndex = new AtomicInteger(1);
                @Override
                public Thread newThread(Runnable r) {
                    Thread t = new Thread(r, poolName + "-worker-" + threadIndex.getAndIncrement());
                    // 设为非守护线程，确保未执行完的任务不被 JVM 强制退出
                    t.setDaemon(false);
                    return t;
                }
            },
            // 4. 推荐使用 CallerRunsPolicy 拒绝策略：退回由调用方主线程执行，平滑限流降级，任务绝不丢失
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }
}
```

---

## 四、生产避坑速查表

| 场景 | 危险程度 | 根因与现象 | 生产避坑治理方案 |
|---|---|---|---|
| **`Executors` 创建线程池导致 OOM** | 致命 | 默认无界队列或无限最大线程，任务排队撑爆堆内存 | **强制手工使用 `ThreadPoolExecutor`**，队列指定容量（如 500~2000） |
| **线程池内部任务异常直接静默消失** | 高 | 使用 `submit()` 提交任务，内部抛出的异常被吞进 `Future`，不调 `get()` 连异常日志都看不到 | 1. 提交用 `execute()`；<br/>2. 业务 `Runnable` 最外层显式包裹 `try-catch(Throwable)` 打印堆栈 |
| **`ThreadLocal` 变量在线程池中串号** | 严重 | 线程池中的工作线程是复用的，如果用完没调 `remove()`，下个请求会拿到上一个用户的登录身份 | 在 Filter、AOP 或拦截器的 `finally` 块中**强制调用 `threadLocal.remove()`** |
| **Spring 容器关闭时线程池暴力中断** | 中 | 应用重新发布发版时，正在执行的转账等核心任务被直接 kill | 配合优雅停机机制，调用 `executor.shutdown()` + `awaitTermination(30, TimeUnit.SECONDS)` |

---

## 五、高频面试追问（含高分/低分特征）

| 追问 | 高分回答要点 | 低分回答特征 |
|---|---|---|
| **Q1: 单核 CPU 下，多线程并发执行能提高程序性能吗？** | 如果是纯 CPU 计算密集型，单核下多线程不会提速，频繁的线程上下文切换（保存与恢复寄存器和 PC）反而会造成性能损耗；但如果是 IO 密集型（如读文件、等网络请求），单核下当线程 A 发生 IO 阻塞挂起时，CPU 可以立即切给线程 B 处理计算，从而显著提高单核整体的吞吐利用率。 | “一定能提高”或“一定不能提高”。 |
| **Q2: 线程池中的工作线程是如何保持不退出的？** | 核心工作线程在 `runWorker()` 方法内部通过 `while (task != null || (task = getTask()) != null)` 循环驱动；当无任务时，通过阻塞队列的 `take()`（核心线程阻塞等待）或 `poll(keepAliveTime)` 挂起等待新任务到来，因此线程不会死掉。 | “线程池在死循环中一直敲 sleep”。 |
| **Q3: 为什么 `ReentrantLock` 默认推荐非公平锁？** | 非公平锁的吞吐量通常显著高于公平锁。在公平锁下，每次都要让新进来的线程先去排队，唤醒队列里的老线程需要经历系统的线程上下文切换，开销巨大；非公平锁允许刚来的活跃线程先尝试 CAS 顺道插队拿下，充分利用了 CPU 缓存局部性，大大减少了上下文切换频率。 | “因为公平锁实现太复杂”。 |
