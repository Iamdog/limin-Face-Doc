---
title: Java 基础与集合源码深度
---

# Java 基础与集合源码深度

## 使用入口：先解决问题，再做验证

正确选择集合并满足对象相等契约。

**先做基本操作**：先实现 List 遍历、Set 去重与 Map 查询，验证重复值与可变 key，再分析哈希、扩容和并发。初次学习可先完成[本模块基础实践](/doc/Java/Java语言基础与日常开发)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

## 1. `==` 与 `equals`，以及 `hashCode()` 契约

### 核心机制
- `==` 对引用比较是否指向同一个对象，对基本类型比较对应值；对象身份不等于可直接观测的物理内存地址。
- `Object.equals()` 默认实现就是 `==`。
- `hashCode()` 映射哈希码。哈希集合（`HashMap`, `HashSet`）定位桶索引依赖公式：`index = (n - 1) & hash`。
- **致命大坑**：若只重写 `equals` 而不重写 `hashCode`，即使业务上两对象完全等价，也会因为落入不同的桶位，导致哈希表 `get()` 查找返回 `null`，甚至引发内存泄漏。

### 实战代码验证
```java
import java.util.HashMap;
import java.util.Objects;

public class HashCodeTest {
    static class User {
        private String id;
        public User(String id) { this.id = id; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            User user = (User) o;
            return Objects.equals(id, user.id);
        }
        // 故意注释掉 hashCode() 的重写
        // @Override
        // public int hashCode() { return Objects.hash(id); }
    }

    public static void main(String[] args) {
        HashMap<User, String> map = new HashMap<>();
        User u1 = new User("1001");
        User u2 = new User("1001");

        map.put(u1, "Admin");
        
        // 按照业务逻辑 u1.equals(u2) 为 true，理应能查出 "Admin"
        System.out.println("equals 结果: " + u1.equals(u2)); // true
        System.out.println("map 查询 u2 结果: " + map.get(u2)); // 输出 null！直接引发业务 Bug
    }
}
```

---

## 2. HashMap 核心设计与并发数据丢失

### 核心机制
1. **为什么以 8 树化，以 6 退化？**
   - **泊松分布**：理想随机 Hash 情况下，单个桶节点数达到 8 的概率极低（约千万分之六 `0.00000006`）。树化是极端恶劣 Hash 碰撞下防 DoS 攻击的兜底手段。
   - **退化为 6**：留出缓冲差值 2，防止节点频繁增删造成链表与红黑树之间频繁转换，造成系统抖动。
2. **并发扩容死链与覆盖写**：
   - JDK 1.7 头插法在并发扩容时可能形成环形链表导致死循环。
   - JDK 1.8 虽改为尾插法消除了死循环，但在多线程并发 `put` 时仍然存在**覆盖写（数据丢失）**问题。

### 并发覆盖写实战代码验证
```java
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;

public class HashMapConcurrenceBug {
    public static void main(String[] args) throws InterruptedException {
        final Map<Integer, Integer> map = new HashMap<>();
        int threadCount = 100;
        CountDownLatch latch = new CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    map.put(index * 1000 + j, j);
                }
                latch.countDown();
            }).start();
        }
        latch.await();
        // 预期大小: 100 * 1000 = 100,000
        System.out.println("实际存入元素量: " + map.size()); // 可能小于 100000；并发问题不保证每次运行都复现
    }
}
```

---

## 3. ConcurrentHashMap 锁粒度演进

- **JDK 1.7**：基于 `Segment` 分段锁（继承自 `ReentrantLock`），默认并发度 16，锁粒度是一个分段数组。
- **JDK 1.8**：移除 Segment，采用 **`Node 数组 + CAS + synchronized`**，锁粒度细化到**单个桶位的头节点**。
- **为什么使用 synchronized 而不是 ReentrantLock？**
  - JVM 底层对 `synchronized` 做了锁消除、锁粗化及不同版本的锁实现优化；具体性能取决于 JDK 和竞争模式。偏向锁属于旧版本机制，不能作为现代 JDK 的普遍结论。
