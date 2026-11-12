---
title: JVM底层原理与调优实战
---

# JVM底层原理与调优实战

## 使用入口：先解决问题，再做验证

定位 Java 进程内存、GC 与线程问题。

**先做基本操作**：先用对应 JDK 的 jcmd 获取版本、线程和堆信息，结合指标定位，再评估 dump 和 GC 参数。初次学习可先完成[本模块基础实践](/doc/Java/Java语言基础与日常开发)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

> **一句话大白话**：JVM 就是一个自带保洁大妈（垃圾收集器 GC）的「Java 专属操作系统」。它把内存划分为**每个员工独立的办公桌（线程私有：栈和程序计数器）**与**全公司共享的超级大仓库（线程共享：堆和元空间）**。所谓调优，核心就是给不同职能分配恰当的空间，别让仓库频繁堆满报警、别让保洁大妈逼得全体停工打扫（Stop-The-World）。

---

## 30 秒生活比喻：公司办公楼与层层审批

- **JVM 运行时内存（公司大楼的分工）**：
  - **程序计数器（当前工单行号记事贴）**：每个员工（线程）桌上的一张便签，专门记录“我刚刚敲代码敲到了第几行”。就算临时被拉去接电话（CPU 线程上下文切换），回来瞄一眼便签就能立刻接着干。
  - **Java 虚拟机栈（员工当下的办公桌面）**：每处理一个业务方法，就在桌上摆一个文件夹（栈帧）。里面放着局部变量和临时计算纸。方法处理完，文件夹直接扔碎纸机（出栈），根本不需要保洁大妈操心。
  - **Java 堆（公司公共共享的大仓库）**：全公司所有通过 `new` 采购回来的办公设备、家具全部堆在这里。东西太多塞不下就会爆炸（Heap OOM），保洁大妈每天在这里巡逻分类回收垃圾。
  - **元空间 Metaspace（公司制度与档案图纸室）**：专门存放每个类的图纸规范、方法元信息，直接占用物理机本身的内存（本地内存），不再受 JVM 堆大小限制。
- **类加载双亲委派（请示汇报机制）**：
  公司来了个新任务（加载一个类）。底层员工（AppClassLoader）不敢擅作主张，逐级向上请示经理（PlatformClassLoader），经理再请示总经理（BootstrapClassLoader）。
  只有总经理和经理都摆手说“这个我不懂、我管不了”时，底层员工才敢自己动手去加载。这样可以彻底防止有人伪造一份假的“公司最高公章”（如黑客写个伪造的 `java.lang.String` 替换官方核心类）。

---

## 一张图看懂 JVM 运行时内存全景与类加载

```mermaid
flowchart TD
    subgraph 类加载双亲委派机制
    App["应用类加载器 (AppClassLoader)"] -->|"1. 向上请示"| Plat["平台类加载器 (Platform/ExtClassLoader)"]
    Plat -->|"2. 向上请示"| Boot["引导启动类加载器 (BootstrapClassLoader C++)"]
    Boot -->|"3. 无法加载则向下委派"| Plat
    Plat -->|"4. 无法加载则向下委派"| App
    end

    subgraph JVM 运行时数据区 (Runtime Data Area)
    subgraph 线程私有（生命周期同线程）
    PC["程序计数器: 记录字节码指令行号"]
    Stack["虚拟机栈: 方法调用对应栈帧 (局部变量表/操作数栈)"]
    NativeStack["本地方法栈: C/C++ Native 方法执行"]
    end

    subgraph 线程共享（GC 调优主战场）
    Heap["Java 堆 (Heap): 存储全部 new 实例对象与数组"]
    subgraph 堆内存细分
    Young["年轻代 (Eden + S0 + S1): 存活周期短，频繁 Minor GC"]
    Old["老年代 (Tenured): 存放大对象与长寿对象，Full GC 主力区"]
    end
    Meta["元空间 Metaspace: 存放类元信息/常量池 (占用物理机本地内存)"]
    end
    end
```

---

## 一、类加载双亲委派与打破委派深度实操

### 1. 为什么必须有双亲委派？
- **沙箱安全防篡改**：防止核心 API 被随意篡改。例如有人恶意在本地写了一个 `java.lang.String`，没有双亲委派就会被加载进 JVM 产生安全灾难；有了双亲委派，请求一路送达顶层 `BootstrapClassLoader`，顶层发现核心类库早已加载过官方的 `rt.jar / java.base`，直接忽略伪造类。
- **避免类重复加载**：父类已经加载过的 Class，子类无需二次加载，保证对象类型的唯一性。

---

### 2. 生产中打破双亲委派的典型三大场景

#### 场景 A：SPI 机制（如 JDBC 驱动加载）
- **痛点**：核心类 `java.sql.DriverManager` 位于 JDK 核心库中，由顶层 `BootstrapClassLoader` 加载。但具体的数据库厂商驱动（如 `com.mysql.cj.jdbc.Driver`）是在第三方依赖包里，顶层加载器根本看不到！
- **破局**：引入 **线程上下文类加载器（Thread Context ClassLoader）**，核心类反向借用当前业务线程绑定的 `AppClassLoader` 去加载厂商实现类，实现了逆向打破！

#### 场景 B：Tomcat 等 Web 容器类隔离
- **痛点**：同一台服务器部署了应用 1 和应用 2。应用 1 依赖 Spring 5，应用 2 依赖 Spring 6。如果遵循双亲委派，父加载器一旦先加载了 Spring 5，应用 2 将直接因为版本冲突崩盘。
- **破局**：Tomcat 设计了独立的 `WebAppClassLoader`，重写了 `loadClass` 逻辑：**先查当前 WebApp 私有目录，查不到再向上请示父加载器**，实现同容器下不同应用的代码隔离。

#### 实战：手写打破双亲委派的自定义类加载器
```java
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;

public class BreakParentClassLoader extends ClassLoader {
    private final String classPath;

    public BreakParentClassLoader(String classPath) {
        this.classPath = classPath;
    }

    /**
     * 重写 loadClass：直接打断向上请示的逻辑，优先在自己的路径下找类
     */
    @Override
    public Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        synchronized (getClassLoadingLock(name)) {
            // 1. 检查是否已经加载过
            Class<?> c = findLoadedClass(name);
            if (c == null) {
                // 2. 核心系统类（以 java. 开头）依然必须交由系统加载，确保沙箱安全
                if (name.startsWith("java.")) {
                    return super.loadClass(name, resolve);
                }
                // 3. 业务自定义类打破委派：自己先在私有目录下加载！
                try {
                    c = findClass(name);
                } catch (ClassNotFoundException e) {
                    // 私有路径查不到，再降级找父加载器
                    c = super.loadClass(name, resolve);
                }
            }
            if (resolve) resolveClass(c);
            return c;
        }
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        String fileName = classPath + File.separator + name.replace('.', File.separatorChar) + ".class";
        try (FileInputStream fis = new FileInputStream(fileName);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            int len;
            byte[] buf = new byte[1024];
            while ((len = fis.read(buf)) != -1) {
                baos.write(buf, 0, len);
            }
            byte[] bytes = baos.toByteArray();
            return defineClass(name, bytes, 0, bytes.length);
        } catch (Exception e) {
            throw new ClassNotFoundException(name);
        }
    }
}
```

---

## 二、实战制造堆内存 OOM 与 MAT 离线分析

在生产故障排查中，堆溢出是导致服务下线最致命的元凶。

### 1. 模拟工业级堆溢出代码与故障转储配置
```java
import java.util.ArrayList;
import java.util.List;

/**
 * 启动 JVM 参数设置（制造小内存以便秒级复现，并配置崩盘自动抓取现场）：
 * -Xms30m -Xmx30m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=./crash_dump.hprof
 */
public class HeapOOMReproduce {

    static class BusinessMemoryLeakObject {
        // 每个对象携带 1MB 的超大字节数组
        private byte[] payload = new byte[1024 * 1024];
        private String tag = "订单大促未释放任务";
    }

    public static void main(String[] args) {
        List<BusinessMemoryLeakObject> leakList = new ArrayList<>();
        int count = 0;
        try {
            while (true) {
                leakList.add(new BusinessMemoryLeakObject());
                count++;
            }
        } catch (Throwable e) {
            System.err.printf("💥 [告警] 在分配第 %d 个对象（约 %d MB）时堆内存被撑爆！%n", count, count);
            e.printStackTrace();
        }
    }
}
```

### 2. 生产排查四步法（使用 Eclipse MAT 或 JProfiler）
1. **获取现场证据**：配置 `-XX:+HeapDumpOnOutOfMemoryError`，在 OOM 发生的瞬间，JVM 会将内存快照以毫秒级写入 `crash_dump.hprof`。
2. **定位大对象（Dominator Tree 支配树）**：用 MAT 打开 dump 文件，看支配树第一行，通常会发现某个 `ArrayList` 或静态全局 `HashMap` 吞食了 90% 以上的堆内存。
3. **寻找 GC Roots 强引用链（Path to GC Roots）**：右键该对象查看「Exclude all phantom/weak/soft references」，看是谁在死死抓住它不放（例如某个未解绑的静态监听器、未关闭的 `ThreadLocal`、或者全局单例中的长列表）。
4. **修复下发**：针对泄漏源，将强引用及时置空或采用分页流式处理。

---

## 三、生产避坑与高频调优参数速查

| 故障现象 | 根因机制 | 诊断命令与工业级对策 |
|---|---|---|
| **`java.lang.OutOfMemoryError: Java heap space`** | 1. 内存泄漏（静态集合持续添加不清理）；<br/>2. 突发大查询（SELECT 未分页查出 50 万条数据） | 1. 导出 dump 用 MAT 分析；<br/>2. 调大 `-Xms` 与 `-Xmx`（生产建议二者设为相同值，防止堆频繁扩缩容抖动） |
| **`java.lang.OutOfMemoryError: Metaspace`** | 动态生成了大量的代理类（如 CGLIB / Groovy 脚本未做缓存复用） | 限制元空间最大上限：`-XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m` |
| **`java.lang.StackOverflowError`** | 方法递归过深、循环递归调用没有正确退出出口 | 检查递归终止条件；若业务确实需要极深层级，可通过 `-Xss1m` 调大单线程栈容量 |
| **CPU 飙高 100% 且系统频繁假死** | 堆内存不足触发高频 Full GC，垃圾回收线程并发抢占 CPU（Stop-The-World 停顿） | 执行 `jstat -gcutil <pid> 1000` 观察 FGC 次数，若每几秒一次，说明老年代已满濒临崩盘 |

---

## 四、高频面试追问（含高分/低分特征）

| 追问 | 高分回答要点 | 低分回答特征 |
|---|---|---|
| **Q1: 为什么 JDK 8 要用元空间取代永久代？** | 永久代使用的是 JVM 堆内存的一部分，受 `-XX:MaxPermSize` 限制，加载类过多时极易发生 PermGen OOM；元空间使用物理机的本地内存（Native Memory），默认大小只受限于宿主机实际物理内存，极大减少了 OOM 几率，同时类的元数据管理与 GC 回收机制更加高效。 | “因为元空间性能更快”。 |
| **Q2: 生产环境为什么建议把 `-Xms` 和 `-Xmx` 设为一样大？** | 避免每次垃圾回收后 JVM 根据空闲率动态向操作系统申请或归还内存，这种内存震荡会导致频繁触发额外的 GC 和系统停顿（STW）。初始大小和最大大小一致可以在启动时直接锁定内存，运行期更平稳。 | “习惯这么配，不知道原因”。 |
| **Q3: 哪些对象可以作为垃圾回收的 GC Roots？** | 四大类核心：1. 虚拟机栈（栈帧中的局部变量表）中引用的对象；2. 方法区中类静态属性引用的对象；3. 方法区中常量引用的对象（如字符串常量池）；4. 本地方法栈中 JNI（Native 方法）引用的对象。 | 模糊背诵，说不清栈和堆的关系。 |
