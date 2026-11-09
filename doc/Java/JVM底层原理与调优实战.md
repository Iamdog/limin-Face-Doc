---
title: JVM底层原理与调优实战
---

# JVM底层原理与调优实战

## 1. JVM 运行时数据区

- **程序计数器（Program Counter）**：线程私有，记录当前线程正在执行的字节码指令地址。
- **Java 虚拟机栈（JVM Stack）**：线程私有，生命周期与线程相同。每个方法调用对应一个**栈帧（Stack Frame）**，存放局部变量表、操作数栈、动态链接、方法出口。
- **本地方法栈（Native Method Stack）**：服务于 Native 本地方法。
- **Java 堆（Heap）**：所有线程共享，存放对象实例和数组。GC 回收的主战场。
- **元空间（Metaspace）**：JDK 1.8 替代永久代，存放类元数据，使用本地物理内存（Native Memory）。

---

## 2. 类加载机制与破坏双亲委派

### 双亲委派模型
- 顺序：`BootstrapClassLoader` -> `ExtClassLoader (PlatformClassLoader)` -> `AppClassLoader` -> `CustomClassLoader`。
- 逻辑：自底向上检查是否已加载，自顶向下尝试加载。
- 目的：保证核心类库安全，防止自定义 `java.lang.String` 覆盖系统核心类。

### 破坏双亲委派的典型场景
1. **SPI 机制（如 JDBC DriverManager）**：
   - 核心类由引导类加载器加载，需要反向调用各数据库厂商提供的驱动实现类。
   - 解决方案：通过 `Thread.currentThread().getContextClassLoader()`（线程上下文类加载器）实现逆向委派。
2. **Tomcat Servlet 容器**：
   - 为隔离不同 Web 应用同名但版本不同的类，每个 WebApp 拥有独立的 `WebAppClassLoader`，先查自身，找不到再委派给父加载器。

---

## 3. 实战制造堆内存 OOM 与 Dump 诊断

### OOM 复现代码
```java
import java.util.ArrayList;
import java.util.List;

// JVM 参数: -Xms20m -Xmx20m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=./heap.hprof
public class HeapOOM {
    static class HeavyObject {
        byte[] placeholder = new byte[1024 * 1024]; // 1MB
    }

    public static void main(String[] args) {
        List<HeavyObject> list = new ArrayList<>();
        int count = 0;
        try {
            while (true) {
                list.add(new HeavyObject());
                count++;
            }
        } catch (Throwable e) {
            System.out.println("在分配第 " + count + " MB 时触发 Heap OOM!");
            e.printStackTrace();
        }
    }
}
```

### 诊断步骤
1. 配置 `-XX:+HeapDumpOnOutOfMemoryError` 自动在崩溃时导出 `heap.hprof`。
2. 使用 **Eclipse MAT (Memory Analyzer Tool)** 或 **JProfiler** 打开 Dump 文件。
3. 查看 **支配树（Dominator Tree）** 和 **Histogram**，定位占用内存最大的对象。
4. 查看 **GC Roots 强引用链**，找出对象无法被正常回收的内存泄漏根因。
