---
title: Redis高并发缓存与一致性实战
---

# Redis高并发缓存与一致性实战

## 🎯 招聘面试核心考点
- **面试官设问**：“聊聊缓存穿透、缓存击穿、缓存雪崩的区别？在你们项目里怎么落地的？”
- **深水区追问**：“热点 Key（例如大促爆款商品）在几万并发瞬间失效，如何确保不会把 MySQL 打死？双写一致性中，为什么‘先删缓存再改数据库’会被淘汰？‘先改数据库再删缓存’如何保证高并发下 100% 一致？如何通过 Canal 监听 Binlog 优雅解耦？”

---

## 🏢 真实生产业务场景
- **电商大促与秒杀商品详情页**：数万人同时抢购某一款特价手机，读 QPS 破 10 万。
- **高频全局热搜排行榜 / 首页运营推荐位**：单 Key 访问密集，一旦失效即刻形成数据库压力洪峰。

---

## ⚙️ 核心机制剖析：缓存三兄弟防范全景

| 现象 | 本质根因 | 生产防线设计 |
| :--- | :--- | :--- |
| **缓存穿透** | 查询一个**数据库根本不存在**的数据（如恶意黑客传 `id = -1`），缓存和 DB 均无法命中，请求直击 DB | 1. **布隆过滤器（BloomFilter）** 快速预拦截<br>2. 缓存空对象（`set key "" EX 60` 短命兜底） |
| **缓存击穿** | **单个热点 Key** 在高并发瞬间过期，海量请求同时并发回源查询 DB | 1. **分布式互斥锁（Mutex）**，仅允许一个线程查库回填<br>2. **逻辑过期时间**（异步线程续期，用户永不等待） |
| **缓存雪崩** | **大量不同 Key 集中在同一时间过期**，或者 Redis 单点宕机，导致 DB 瞬间被打崩 | 1. 缓存过期时间加上**随机扰动值（如 10m + Random(0~300s)）**<br>2. 多级缓存（本地 Caffeine + 远程 Redis 集群） |

---

## 💻 最小可运行 MVP 代码：逻辑过期时间防击穿

逻辑过期方案中，Key 本身在 Redis 里永不过期（TTL 永久），我们将过期时间戳包装在 Value 对象里。当发现逻辑过期时，通过获取互斥锁启动**异步独立线程**去更新数据库和缓存，而当前并发请求**直接返回旧数据降级，业务丝毫不阻塞**！

```java
import java.time.LocalDateTime;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CacheBreakdownService {

    // 包装逻辑过期的缓存对象
    static class RedisData<T> {
        private LocalDateTime expireTime;
        private T data;
        public RedisData(T data, LocalDateTime expireTime) { this.data = data; this.expireTime = expireTime; }
        public boolean isExpired() { return LocalDateTime.now().isAfter(expireTime); }
        public T getData() { return data; }
    }

    private final ExecutorService CACHE_REBUILD_EXECUTOR = Executors.newFixedThreadPool(10);

    // 查询热点商品逻辑
    public String getHotProduct(Long id) {
        String key = "product:hot:" + id;
        
        // 1. 从缓存读取逻辑对象
        RedisData<String> redisData = mockGetFromRedis(key);

        // 2. 判断是否逻辑过期
        if (!redisData.isExpired()) {
            return redisData.getData(); // 未过期，直接极速返回
        }

        // 3. 已经逻辑过期，尝试获取互斥锁（使用 Redis setnx）
        String lockKey = "lock:product:" + id;
        boolean isLockAcquired = mockTryLock(lockKey);

        if (isLockAcquired) {
            // 4. 获取锁成功，开启独立异步线程更新缓存，当前线程不等待
            CACHE_REBUILD_EXECUTOR.submit(() -> {
                try {
                    System.out.println("[异步线程] 查询 MySQL 最新商品信息并重构缓存...");
                    Thread.sleep(200); // 模拟耗时 DB 操作
                    String freshDataFromDb = "最新商品详情_版本2.0";
                    mockSaveRedis(key, new RedisData<>(freshDataFromDb, LocalDateTime.now().plusMinutes(30)));
                } finally {
                    mockReleaseLock(lockKey); // 释放锁
                }
            });
        }

        // 5. 无论是获取锁成功的线程还是没拿到锁的并发线程，先立即返回旧数据兜底！
        return redisData.getData();
    }

    // 辅助模拟方法
    private RedisData<String> mockGetFromRedis(String k) {
        return new RedisData<>("旧缓存商品数据", LocalDateTime.now().minusSeconds(10)); // 故意模拟已过期
    }
    private boolean mockTryLock(String k) { return true; }
    private void mockReleaseLock(String k) {}
    private void mockSaveRedis(String k, RedisData<String> v) {}
}
```

---

## ⚙️ 双写一致性终极方案：Canal 监听 Binlog 异步淘汰

面试中千万别只答“延迟双删”！延迟双删需要估算休眠时间（如 `Thread.sleep(500)`），在高并发下极其脆弱不可靠。

### 工业级标准方案：Cache Aside + Canal 异步队列
1. **写请求流程**：
   - 应用程序直接更新 MySQL 数据库。
   - **不需要**在业务代码里手写任何删除 Redis 缓存的代码。
2. **异步同步链路**：
   - MySQL 写入成功后生成 **Row 格式 Binlog**。
   - 阿里开源中间件 **Canal** 伪装成 MySQL 从库（Slave），实时监听 Binlog 变更。
   - Canal 解析出变更的表名与主键 ID，投递到 **RocketMQ / RabbitMQ**。
   - 专门的缓存消费服务从 MQ 中拉取消息，调用 Redis 执行 `DEL key`。
   - 若删除失败，利用 MQ 重试机制指数退避重试，**保证最终 100% 一致，业务代码完全解耦**。
