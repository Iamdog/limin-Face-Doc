# Java 后端与 MySQL 模块社招全面体系化重构与扩充实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 面向社招（2~5年+）中高级工程师，全量重构并扩充 `limin-Face-Doc` 知识库的 Java 后端与 MySQL 板块，建立清晰的 6~9 级阶梯式动线，输出 66 篇高密度、带源码推导、图解与高频面试追问的硬核专题，重构 VitePress 侧边栏，并通过全站编译与链接验证。

**Architecture:** 采用“阶梯式分级进阶”模型，将 MySQL 划分为 7 大阶段（24 篇专题），Java 后端划分为 9 大阶段（42 篇专题）。每篇专题严格落实“核心机制图解 + 底层源码/算法推导 + 社招面试高频连环追问 + 真实生产排错 SOP”四维标准结构。

**Tech Stack:** VitePress 1.x, Markdown, Mermaid 图表, Node.js, Java 17/21, Spring Boot 3.x, MySQL 8.0, Netty 4.x, ShardingSphere 5.x, Redis 7.x, Kafka/RocketMQ, Seata.

**Spec:** `/Users/laoliu/Documents/limin-Face-Doc/docs/superpowers/specs/2026-11-16-facedoc-java-mysql-social-recruitment-design.md`

## Global Constraints

- 所有正文严禁空洞八股文，必须包含底层原理推导或源码/机制分析。
- 涉及复杂机制必须提供 Mermaid 架构图或文本结构图。
- 必须严格保留现存有效旧链接，若有文件重命名或拆分，须在导航中保持平滑兼容或做重定向声明。
- 避免装饰性 emoji 滥用，保持严谨工程技术规范。
- 每完成一个阶段必须确保 Markdown 语法正确、代码块栅栏配平，并在最后执行 `npm run docs:build` 零错误通过。

## Review Focus

1. **MySQL Next-Key Lock 加锁判定**：等值/范围、主键/唯一/普通非唯一索引在 RR 级别下的具体加锁范围推导准确性。
2. **Spring 循环依赖推导**：三级缓存中为何二级缓存不足以优雅解决 AOP 提前暴露的推导逻辑准确性。
3. **AQS 独占与共享模式**：CLH 变种队列状态转换与 `acquire`/`release` 源码推导。
4. **VitePress 侧边栏链接配对**：新增的 66 篇专题在 `config.mts` 中的链接与物理文件路径 100% 对应无死链。
5. **构建验证**：`npm run docs:build` 编译耗时与结果，无 `<table` 或 Markdown 解析错误。

---

### Task 1: MySQL 基础、表规范与物理存储底层（阶梯 1 & 2，共 8 篇）

**Files:**
- Create: `doc/MySQL/SQL执行原理与逻辑执行顺序全解.md`
- Create: `doc/MySQL/多表关联查询内幕与JOIN优化.md`
- Create: `doc/MySQL/字符集与排序规则实战避坑.md`
- Create: `doc/MySQL/InnoDB逻辑存储结构与页结构深度剖析.md`
- Create: `doc/MySQL/InnoDB行格式与溢出页机制.md`
- Create: `doc/MySQL/B+树索引结构演进与千万级容量推导计算.md`
- Create: `doc/MySQL/索引分类物理组织与查询加速机制.md`
- Modify: `doc/MySQL/高并发大字段建表规范与生产场景.md`

- [ ] **Step 1: 编写阶梯 1 篇章**
  - 编写《SQL 执行原理与逻辑执行顺序全解》：Server 与引擎层、执行顺序推导。
  - 增强《高并发大字段建表规范与生产场景》：补齐数值/字符/时间类型避坑。
  - 编写《多表关联查询内幕与 JOIN 优化》：驱动表判定、INLJ/BNL/BKA 算法。
  - 编写《字符集与排序规则实战避坑》：utf8mb4、Emoji 截断事故与隐式转换失效。
- [ ] **Step 2: 编写阶梯 2 篇章**
  - 编写《InnoDB 逻辑存储结构与页结构深度剖析》：段/区/页/行、Page Directory 与槽位二分。
  - 编写《InnoDB 行格式与溢出页机制》：Compact/Dynamic 头部、NULL 列表、隐藏列、Off-Page。
  - 编写《B+ 树索引结构演进与千万级容量推导计算》：数据结构选型对比、千万级容量推导数学公式。
  - 编写《索引分类物理组织与查询加速机制》：聚簇/二级索引、最左匹配、覆盖索引、ICP。
- [ ] **Step 3: 格式与栅栏自检**
  - 验证 8 篇文档 frontmatter、标题层级与 Mermaid 图表语法。

---

### Task 2: MySQL 事务、日志体系与锁机制（阶梯 3 & 4，共 9 篇）

**Files:**
- Create: `doc/MySQL/事务ACID四大特性的底层实现机制.md`
- Create: `doc/MySQL/并发事务问题与四大隔离级别实现差异.md`
- Create: `doc/MySQL/redolog-binlog与两阶段提交Crash-Safe机制.md`
- Create: `doc/MySQL/BufferPool缓冲池核心原理与冷热LRU.md`
- Create: `doc/MySQL/全局锁表级锁与元数据锁MDL.md`
- Create: `doc/MySQL/行锁分类记录锁间隙锁与Next-KeyLock.md`
- Create: `doc/MySQL/Next-KeyLock全场景加锁规则深度判定.md`
- Create: `doc/MySQL/死锁的本质排查与防范实战.md`
- Modify: `doc/MySQL/MySQL事务隔离与MVCC原理.md`

- [ ] **Step 1: 编写阶梯 3 篇章**
  - 编写《事务 ACID 四大特性的底层实现机制》：undo/redo/锁/MVCC 协同。
  - 编写《并发事务问题与四大隔离级别实现差异》：脏读/不可重复读/幻读、InnoDB RR 特殊幻读。
  - 增强重构《MySQL 事务隔离与 MVCC 原理》：Read View 四大属性比对算法逐行推导。
  - 编写《redo log、binlog 与两阶段提交 Crash-Safe 机制》：WAL、刷盘参数、崩溃恢复推导。
  - 编写《Buffer Pool 缓冲池核心原理与冷热 LRU》：冷热分离 LRU、防全表扫描污染。
- [ ] **Step 2: 编写阶梯 4 篇章**
  - 编写《全局锁、表级锁与元数据锁（MDL）》：FTWRL、意向锁作用、MDL 锁与大表 DDL 隐患。
  - 编写《行锁分类：记录锁、间隙锁与 Next-Key Lock》：行锁类型与互斥矩阵。
  - 编写《Next-Key Lock 全场景加锁规则深度判定》：等值/范围、主键/唯一/普通非唯一索引判定。
  - 编写《死锁的本质、排查与防范实战》：死锁日志拆解、并发插入死锁、死锁规避。
- [ ] **Step 3: 格式与栅栏自检**
  - 验证事务与锁模块的推导流程与图解。

---

### Task 3: MySQL 性能调优、高可用与分库分表（阶梯 5 & 6，共 7 篇）

**Files:**
- Create: `doc/MySQL/慢查询日志捕获与优化器追踪optimizer_trace.md`
- Create: `doc/MySQL/EXPLAIN执行计划各字段深度拆解.md`
- Create: `doc/MySQL/千万级数据深度分页优化与COUNT终极对比.md`
- Create: `doc/MySQL/分库分表架构设计与ShardingSphere核心实战.md`
- Create: `doc/MySQL/大表无锁DDL工具与生产备份恢复SOP.md`
- Modify: `doc/MySQL/MySQL索引失效与优化实战.md`
- Modify: `doc/MySQL/MySQL主从复制与读写分离实战.md`

- [ ] **Step 1: 编写阶梯 5 篇章**
  - 编写《慢查询日志捕获与优化器追踪（optimizer_trace）》：成本 cost 计算分析。
  - 编写《EXPLAIN 执行计划各字段深度拆解》：type 各级别详解、key_len、Extra 关键项。
  - 增强《MySQL 索引失效与优化实战》：15 大经典失效场景与排查清单。
  - 编写《千万级数据深度分页优化与 COUNT(*) 终极对比》：4 种分页方案、count 性能剖析。
- [ ] **Step 2: 编写阶梯 6 篇章**
  - 增强《MySQL 主从复制底层原理与主从延迟 6 大破局方案》：MTS 并行复制、GTID、延迟治理。
  - 编写《分库分表架构设计与 ShardingSphere 核心实战》：拆分维度、分片键、雪花算法、跨库分页。
  - 编写《大表无锁 DDL 工具与生产备份恢复 SOP》：gh-ost/pt-osc、xtrabackup 热备。
- [ ] **Step 3: 自检与确认**
  - 检查 MySQL 24 篇专题闭环。

---

### Task 4: Java 语言深水区与集合源码剖析（阶梯 1 & 2，共 12 篇）

**Files:**
- Create: `doc/Java/String深入与字符串常量池底层机制.md`
- Create: `doc/Java/Java泛型机制与类型擦除深挖.md`
- Create: `doc/Java/反射机制底层原理与性能损耗深度分析.md`
- Create: `doc/Java/动态代理深度对比JDK-Proxy与CGLIB.md`
- Create: `doc/Java/SPI机制底层原理与在开源框架中的演进.md`
- Create: `doc/Java/Java异常体系语法糖底层与try-with-resources.md`
- Create: `doc/Java/Java-IO演进从传统BIO到NIO三大核心组件.md`
- Create: `doc/Java/ArrayList与CopyOnWriteArrayList源码剖析.md`
- Create: `doc/Java/HashMap-1.8源码终极大解剖-结构演进与Hash算法.md`
- Create: `doc/Java/HashMap-1.8源码终极大解剖-put流程树化与扩容.md`
- Create: `doc/Java/ConcurrentHashMap-1.7与1.8架构演进与并发控制.md`
- Create: `doc/Java/LinkedHashMap与TreeMap底层原理.md`

- [ ] **Step 1: 编写阶梯 1 篇章**
  - 编写 String、泛型擦除、反射膨胀机制。
  - 编写动态代理 JDK vs CGLIB、SPI 机制。
  - 编写异常底层与 BIO 到 NIO 三大组件。
- [ ] **Step 2: 编写阶梯 2 篇章**
  - 编写 ArrayList 与 CopyOnWriteArrayList 源码。
  - 编写 HashMap 1.8 源码终极大解剖（上、下）：结构演进、Hash扰动、put流程、树化/扩容。
  - 编写 ConcurrentHashMap 1.7 vs 1.8 架构演进与并发控制（分段锁 vs CAS+synchronized）。
  - 编写 LinkedHashMap（手写 LRU）与 TreeMap 底层原理。
- [ ] **Step 3: 格式与编译自检**
  - 检查代码块高亮与格式。

---

### Task 5: JMM 并发编程、锁机制与 JVM 线上调优（阶梯 3 & 4，共 15 篇）

**Files:**
- Create: `doc/Java/JMM内存模型与Happens-Before原则深度解析.md`
- Create: `doc/Java/volatile关键字底层原理与内存屏障汇编分析.md`
- Create: `doc/Java/CAS机制与无锁并发编程Unsafe与LongAdder.md`
- Create: `doc/Java/synchronized锁与对象头MarkWord锁升级全过程.md`
- Create: `doc/Java/AQS核心架构设计与源码深度逐行解析.md`
- Create: `doc/Java/JUC核心并发锁与同步工具实战.md`
- Create: `doc/Java/ThreadLocal核心原理内存泄漏与全链路透传TTL.md`
- Create: `doc/Java/ThreadPoolExecutor线程池底层源码与动态调优实战.md`
- Create: `doc/Java/CompletableFuture异步编排实战与并发吞吐量提升.md`
- Create: `doc/Java/JVM内存区域划分与对象创建生命周期.md`
- Create: `doc/Java/类加载机制与破坏双亲委派3大经典场景.md`
- Create: `doc/Java/现代垃圾收集器深度G1与ZGC核心原理解析.md`
- Create: `doc/Java/JVM核心性能调优参数与GC日志分析.md`
- Create: `doc/Java/线上CPU-100与OOM疑难故障排查与Arthas实战.md`
- Modify: `doc/Java/JVM底层原理与调优实战.md`

- [ ] **Step 1: 编写并发与锁内核（阶梯 3）**
  - JMM、volatile、CAS/LongAdder。
  - synchronized 锁升级与 Mark Word。
  - AQS 独占/共享与 Condition 源码逐行剖析。
  - JUC 核心工具、ThreadLocal/TTL 透传、线程池源码与动态调优、CompletableFuture。
- [ ] **Step 2: 编写 JVM 深度与线上排障（阶梯 4）**
  - JVM 内存划分与对象创建、类加载与破坏双亲委派。
  - 经典垃圾收集器演进、G1 与 ZGC 深度原理解析。
  - JVM 核心参数与 GC 日志分析、线上 CPU 100%/OOM 与 Arthas 实战。
- [ ] **Step 3: 格式与逻辑核对**

---

### Task 6: Netty 高性能网络与 Spring 全家桶深度（阶梯 5 & 6，共 10 篇）

**Files:**
- Create: `doc/Java/IO多路复用模型与epoll底层工作机制.md`
- Create: `doc/Java/Reactor反应堆线程模型与Netty核心架构.md`
- Create: `doc/Java/ByteBuf内存分配与Netty零拷贝机制全景.md`
- Create: `doc/Java/Netty网络编解码粘包拆包与心跳检测实战.md`
- Create: `doc/Java/Spring-IoC容器启动流程与Bean完整生命周期.md`
- Create: `doc/Java/Spring循环依赖与三级缓存终极推导.md`
- Create: `doc/Java/Spring-AOP原理与方法内部自调用失效全解.md`
- Create: `doc/Java/Spring声明式事务传播机制与12种失效场景排查.md`
- Create: `doc/Java/SpringBoot自动装配原理与自定义Starter实战.md`
- Create: `doc/Java/MyBatis核心架构SQL映射与插件拦截器实战.md`

- [ ] **Step 1: 编写 Netty 高性能网络专题（阶梯 5）**
  - epoll 底层工作机制（LT vs ET）。
  - Reactor 反应堆线程模型与 Netty 核心架构组件。
  - ByteBuf 内存分配与 Netty 零拷贝机制。
  - 粘包拆包与心跳检测重连实战。
- [ ] **Step 2: 编写 Spring 内核与持久层专题（阶梯 6）**
  - Spring IoC 容器启动与 Bean 生命周期。
  - 循环依赖与三级缓存推导（为什么三级缓存解决 AOP）。
  - Spring AOP 底层与自调用失效破解方案。
  - 声明式事务传播行为与 12 种失效场景排查。
  - Spring Boot 自动装配原理与自定义 Starter。
  - MyBatis 核心架构与插件拦截器。
- [ ] **Step 3: 格式自检**

---

### Task 7: 微服务、分布式事务、中间件与系统设计（阶梯 7、8 & 9，共 5 篇）

**Files:**
- Create: `doc/Java/微服务核心组件架构与技术选型对比.md`
- Create: `doc/Java/分布式事务Seata核心原理与AT-TCC模式深度实战.md`
- Create: `doc/Java/Redis核心原理高并发三大难题与双写一致性.md`
- Create: `doc/Java/Kafka与RocketMQ生产级高可靠投递与积压治理.md`
- Create: `doc/Java/高并发秒杀系统全链路设计与社招40道硬核连环炮.md`

- [ ] **Step 1: 编写分布式微服务与事务专题（阶梯 7）**
  - 微服务核心组件选型对比（Nacos/Sentinel/Gateway）。
  - Seata 架构、AT 模式一阶段前镜像/二阶段全局锁、TCC 幂等/防悬挂。
- [ ] **Step 2: 编写分布式缓存与消息队列专题（阶梯 8）**
  - Redis 底层、缓存三大难题、双写一致性（Canal 异步更新）。
  - Kafka 与 RocketMQ 零丢失、消息幂等、消息积压处置 SOP。
- [ ] **Step 3: 编写系统设计与社招大厂连环炮（阶梯 9）**
  - 秒杀系统防超卖全链路设计、40 道社招硬核高频连环追问与打法。

---

### Task 8: 导航重构、学习地图升级与全站构建验证

**Files:**
- Modify: `.vitepress/config.mts`
- Modify: `doc/MySQL/前言.md`
- Modify: `doc/Java/后端学习地图.md`
- Modify: `doc/Java/前言.md`

- [ ] **Step 1: 重写导读与学习地图**
  - 重写 `doc/MySQL/前言.md`：建立 7 大阶段清晰路线。
  - 重构 `doc/Java/后端学习地图.md`：建立 9 大阶段社招知识图谱。
- [ ] **Step 2: 全面重构 VitePress 侧边栏配置**
  - 在 `.vitepress/config.mts` 中将 MySQL 与 Java 板块替换为阶梯式分组，严格对应 66 篇专题。
- [ ] **Step 3: 执行全站构建与死链静态检测**
  - 在 `limin-Face-Doc` 根目录执行 `npm run docs:build`，验证无报错、无死链、产物正常输出。
