---
title: JMM并发编程与线程池调优
---

# JMM并发编程与线程池调优

## 1. volatile 内存语义与指令重排验证

### 核心机制
- **内存可见性**：通过 CPU 缓存一致性协议（MESI），写操作直接刷回主内存，并让其他核心对应的缓存行失效。
- **禁止指令重排**：在汇编指令层面插入内存屏障（Memory Barrier / `lock addl`）。
- **注意**：`volatile` **不保证原子性**（例如 `count++` 依然不是线程安全的）。

### 指令重排序实战捕获代码
```java
public class InstructionReorderTest {
    private static int a = 0, b = 0;
    private static int x = 0, y = 0;

    public static void main(String[] args) throws InterruptedException {
        int count = 0;
        while (true) {
            count++;
            a = 0; b = 0; x = 0; y = 0;
            Thread t1 = new Thread(() -> { a = 1; x = b; });
            Thread t2 = new Thread(() -> { b = 1; y = a; });

            t1.start(); t2.start();
            t1.join(); t2.join();

            // 若严格顺序执行，不可能出现 x=0 && y=0
            if (x == 0 && y == 0) {
                System.out.println("在第 " + count + " 次测试捕获到了指令重排：x=0, y=0!");
                break;
            }
        }
    }
}
```

---

## 2. AQS（AbstractQueuedSynchronizer）核心原理

1. **`volatile int state`**：表示共享资源状态，使用 CAS 进行原子修改。
2. **CLH 变体双向双端队列**：管理排队等待获取锁的线程节点。
3. **线程挂起与唤醒**：通过底层 `LockSupport.park()` 和 `LockSupport.unpark()` 挂起和唤醒等待线程。

---

## 3. 生产级线程池调优与拒绝策略

### 严禁使用 Executors
- `Executors.newFixedThreadPool()` 默认使用近似无界的 `LinkedBlockingQueue`（容量为 `Integer.MAX_VALUE`），在高并发任务积压时直接导致 **OOM (OutOfMemoryError)**。

### 工业级自定义线程池配置
```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class ProductionThreadPool {
    public static ThreadPoolExecutor createPool() {
        int cpuCores = Runtime.getRuntime().availableProcessors();
        // CPU 密集型推荐 N+1，IO 密集型推荐 2N
        int corePoolSize = cpuCores;
        int maxPoolSize = cpuCores * 2;
        long keepAliveTime = 60L;

        return new ThreadPoolExecutor(
            corePoolSize,
            maxPoolSize,
            keepAliveTime,
            TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(500), // 有界队列，严格防 OOM
            new ThreadFactory() {
                private final AtomicInteger count = new AtomicInteger(1);
                @Override
                public Thread newThread(Runnable r) {
                    Thread t = new Thread(r, "biz-task-pool-" + count.getAndIncrement());
                    t.setDaemon(false);
                    return t;
                }
            },
            new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略：退回调用方线程执行，平滑降级，防任务丢弃
        );
    }
}
```
