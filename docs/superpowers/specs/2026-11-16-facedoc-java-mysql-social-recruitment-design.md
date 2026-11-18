# 面试知识库 Java 后端与 MySQL 模块社招全面体系化重构与扩充设计（66 篇专题全景）

## 意图与背景

针对用户反馈“整个文档不同板块不系统、杂乱、缺乏由浅入深，特别是 Java 后端和 MySQL 篇幅较少、无法覆盖社招高频面试题与真实生产场景”的问题，对知识库（`limin-Face-Doc`）的 **Java 后端** 与 **MySQL 数据库** 板块进行**社招中高级（2~5年+）**定向的全面重构与系统化大扩充。

通过建立清晰的“由浅入深分级阶梯”，重排侧边栏阅读动线，并全量覆盖社招高频考点、底层原理（AQS 源码、锁升级、Netty 零拷贝、B+树物理结构与容量估算、Next-Key Lock 加锁全场景判定、EXPLAIN 优化、分库分表、分布式事务等）与真实生产排错场景，共规划 **66 篇核心硬核专题（MySQL 24 篇 + Java 后端 42 篇）**。

---

## 目标与原则

### 目标
1. **分级阶梯清晰**：每个板块严格按「由浅入深」的 6~9 级阶梯递进，从语法规范、底层物理结构、事务与锁、性能调优，到分布式架构、面试连环炮与事故复盘。
2. **深度覆盖社招中高级核心考点**：
   - **MySQL（7 大阶段 · 24 篇）**：SQL 执行机制、数据类型与建表规范、InnoDB 逻辑/物理页结构、行格式与行溢出、B+树千万级容量估算公式、ACID 底层机制、Read View 算法与 MVCC 深度推导、redo log 与 WAL、两阶段提交崩溃恢复逻辑、Buffer Pool 冷热分离 LRU、MDL 锁与大表 DDL 隐患、Record/Gap/Next-Key Lock 全场景加锁判定规则（等值/范围/唯一/普通/无索引）、死锁日志逐行拆解与规避、慢查询捕获与 optimizer_trace、EXPLAIN 各列深度解析、索引失效 15 大场景、千万级深度分页优化策略、主从延迟 6 大破局方案、分库分表（垂直/水平、Sharding Key、雪花算法、跨库 Join/分页）、大表无锁 DDL（gh-ost/pt-osc）与生产备份恢复 SOP。
   - **Java 后端（9 大阶段 · 42 篇）**：String 内存模型与常量池、泛型与类型擦除、反射膨胀机制、动态代理（JDK Proxy vs CGLIB 深度对比）、SPI 机制、异常体系与 try-with-resources 底层、BIO/NIO 三大组件与零拷贝；ArrayList 与 CopyOnWriteArrayList、HashMap 1.8 源码终极大解剖（扰动函数、put 流程、树化阈值 8/6、扩容高低位链表、并发问题）、ConcurrentHashMap 1.7 vs 1.8（分段锁 vs CAS+synchronized、CounterCell 统计、协助扩容）、LinkedHashMap 与 TreeMap；JMM 与 Happens-Before、volatile 与内存屏障汇编 lock、CAS 与 LongAdder 分段累加、synchronized 锁升级全生命周期与 64 位 Mark Word 状态位、AQS 独占/共享源码逐行剖析与 Condition 条件队列、JUC 并发锁与同步工具、ThreadLocal 内存泄漏根因与 TransmittableThreadLocal（TTL）全链路透传实战、ThreadPoolExecutor 7 大参数与动态调优监控、CompletableFuture 异步编排；JVM 内存划分与对象创建生命周期、类加载双亲委派与破坏双亲委派 3 大经典场景、垃圾回收算法与 CMS/G1/ZGC 现代回收器深度对比、JVM 核心调优参数与 GC 日志分析、线上 CPU 100%/OOM 故障排查与 Arthas 实战；I/O 多路复用 epoll、Reactor 线程模型、Netty 核心组件、ByteBuf 内存分配与 Netty 零拷贝、TCP 粘包拆包与心跳；Spring IoC 容器启动流程与 Bean 生命周期、Spring 循环依赖与三级缓存终极推导（为什么必须三级缓存解决 AOP）、Spring AOP 底层与自调用失效破解、Spring 声明式事务 12 种失效场景排查、Spring Boot 自动装配原理与自定义 Starter、MyBatis 架构与插件拦截器；微服务核心组件选型对比、分布式事务 Seata 架构与 AT/TCC 模式深度实战；Redis 8 大底层数据结构、单线程高性能模型、缓存穿透/击穿/雪崩、Redisson 分布式锁看门狗与 Lua 脚本、Cache Aside 双写一致性与 Canal 监听 binlog；Kafka & RocketMQ 高可靠投递与积压治理；秒杀系统全链路设计与社招 40 道硬核连环炮。
3. **内容结构高标准**：每篇核心专题统一具备：
   - 核心机制心智模型与架构图（Mermaid / 结构图）
   - 核心原理源码/底层推导（拒绝泛泛空谈）
   - 面试官高频追问链条（Q&A 连环炮）
   - 真实生产事故还原与避坑排查 SOP
4. **侧边栏与站点体验升级**：在 `.vitepress/config.mts` 中建立层级分明的阶梯式分组，消除视觉混乱感；保持所有已有文档路径兼容，确保 `npm run docs:build` 零死链顺利通过。

---

## 专题架构全景清单

### 一、 MySQL 数据库（7 大阶段 · 24 篇）

#### 阶梯 1：SQL 核心、表设计规范与存储底座
1. `doc/MySQL/SQL执行原理与逻辑执行顺序全解.md`
2. `doc/MySQL/高并发大字段建表规范与数据类型精准选型.md`
3. `doc/MySQL/多表关联查询内幕与JOIN优化.md`
4. `doc/MySQL/字符集与排序规则实战避坑.md`

#### 阶梯 2：InnoDB 存储引擎与数据结构底层
5. `doc/MySQL/InnoDB逻辑存储结构与页结构深度剖析.md`
6. `doc/MySQL/InnoDB行格式与溢出页机制.md`
7. `doc/MySQL/B+树索引结构演进与千万级容量推导计算.md`
8. `doc/MySQL/索引分类物理组织与查询加速机制.md`

#### 阶梯 3：事务、MVCC 与底层日志机制
9. `doc/MySQL/事务ACID四大特性的底层实现机制.md`
10. `doc/MySQL/并发事务问题与四大隔离级别实现差异.md`
11. `doc/MySQL/MVCC多版本并发控制底层实现深度推导.md`
12. `doc/MySQL/redolog-binlog与两阶段提交Crash-Safe机制.md`
13. `doc/MySQL/BufferPool缓冲池核心原理与冷热LRU.md`

#### 阶梯 4：锁机制与高并发并发控制
14. `doc/MySQL/全局锁表级锁与元数据锁MDL.md`
15. `doc/MySQL/行锁分类记录锁间隙锁与Next-KeyLock.md`
16. `doc/MySQL/Next-KeyLock全场景加锁规则深度判定.md`
17. `doc/MySQL/死锁的本质排查与防范实战.md`

#### 阶梯 5：执行计划分析与慢查询性能调优
18. `doc/MySQL/慢查询日志捕获与优化器追踪optimizer_trace.md`
19. `doc/MySQL/EXPLAIN执行计划各字段深度拆解.md`
20. `doc/MySQL/索引失效15大经典场景与调优清单.md`
21. `doc/MySQL/千万级数据深度分页优化与COUNT终极对比.md`

#### 阶梯 6：高可用集群架构与分库分表实战
22. `doc/MySQL/MySQL主从复制底层原理与主从延迟6大破局方案.md`
23. `doc/MySQL/分库分表架构设计与ShardingSphere核心实战.md`
24. `doc/MySQL/大表无锁DDL工具与生产备份恢复SOP.md`

---

### 二、 Java 后端（9 大阶段 · 42 篇）

#### 阶梯 1：Java 语言深水区与高级特性
1. `doc/Java/String深入与字符串常量池底层机制.md`
2. `doc/Java/Java泛型机制与类型擦除深挖.md`
3. `doc/Java/反射机制底层原理与性能损耗深度分析.md`
4. `doc/Java/动态代理深度对比JDK-Proxy与CGLIB.md`
5. `doc/Java/SPI机制底层原理与在开源框架中的演进.md`
6. `doc/Java/Java异常体系语法糖底层与try-with-resources.md`
7. `doc/Java/Java-IO演进从传统BIO到NIO三大核心组件.md`

#### 阶梯 2：集合框架源码深度解剖（社招必刷）
8. `doc/Java/ArrayList与CopyOnWriteArrayList源码剖析.md`
9. `doc/Java/HashMap-1.8源码终极大解剖-结构演进与Hash算法.md`
10. `doc/Java/HashMap-1.8源码终极大解剖-put流程树化与扩容.md`
11. `doc/Java/ConcurrentHashMap-1.7与1.8架构演进与并发控制.md`
12. `doc/Java/LinkedHashMap与TreeMap底层原理.md`

#### 阶梯 3：JMM 内存模型、并发编程与锁机制内核
13. `doc/Java/JMM内存模型与Happens-Before原则深度解析.md`
14. `doc/Java/volatile关键字底层原理与内存屏障汇编分析.md`
15. `doc/Java/CAS机制与无锁并发编程Unsafe与LongAdder.md`
16. `doc/Java/synchronized锁与对象头MarkWord锁升级全过程.md`
17. `doc/Java/AQS核心架构设计与源码深度逐行解析.md`
18. `doc/Java/JUC核心并发锁与同步工具实战.md`
19. `doc/Java/ThreadLocal核心原理内存泄漏与全链路透传TTL.md`
20. `doc/Java/ThreadPoolExecutor线程池底层源码与动态调优实战.md`
21. `doc/Java/CompletableFuture异步编排实战与并发吞吐量提升.md`

#### 阶梯 4：JVM 底层原理、垃圾回收与线上排障
22. `doc/Java/JVM内存区域划分与对象创建生命周期.md`
23. `doc/Java/类加载机制与破坏双亲委派3大经典场景.md`
24. `doc/Java/垃圾收集算法与经典垃圾收集器演进.md`
25. `doc/Java/现代垃圾收集器深度G1与ZGC核心原理解析.md`
26. `doc/Java/JVM核心性能调优参数与GC日志分析.md`
27. `doc/Java/线上CPU-100与OOM疑难故障排查与Arthas实战.md`

#### 阶梯 5：高性能网络通信与 Netty 深度
28. `doc/Java/IO多路复用模型与epoll底层工作机制.md`
29. `doc/Java/Reactor反应堆线程模型与Netty核心架构.md`
30. `doc/Java/ByteBuf内存分配与Netty零拷贝机制全景.md`
31. `doc/Java/Netty网络编解码粘包拆包与心跳检测实战.md`

#### 阶梯 6：Spring 全家桶内核与持久层深度透视
32. `doc/Java/Spring-IoC容器启动流程与Bean完整生命周期.md`
33. `doc/Java/Spring循环依赖与三级缓存终极推导.md`
34. `doc/Java/Spring-AOP原理与方法内部自调用失效全解.md`
35. `doc/Java/Spring声明式事务传播机制与12种失效场景排查.md`
36. `doc/Java/SpringBoot自动装配原理与自定义Starter实战.md`
37. `doc/Java/MyBatis核心架构SQL映射与插件拦截器实战.md`

#### 阶梯 7：分布式微服务与分布式事务体系
38. `doc/Java/微服务核心组件架构与技术选型对比.md`
39. `doc/Java/分布式事务Seata核心原理与AT-TCC模式深度实战.md`

#### 阶梯 8：分布式缓存 Redis 与消息中间件 MQ 深度
40. `doc/Java/Redis核心原理高并发三大难题与双写一致性.md`
41. `doc/Java/Kafka与RocketMQ生产级高可靠投递与积压治理.md`

#### 阶梯 9：社招高频系统设计与大厂连环炮冲刺
42. `doc/Java/高并发秒杀系统全链路设计与社招40道硬核连环炮.md`

---

## 落地实施与验证计划

1. **阶段 1：MySQL 核心专题落地（24 篇）**
   - 梳理现有 10 篇内容并与规划对齐升级，补充全新 14 篇硬核专题，确保 24 篇内容全部到位。
2. **阶段 2：Java 后端核心专题落地（42 篇）**
   - 梳理现有 24 篇内容并与规划对齐升级，补充全新 18 篇硬核专题，确保 42 篇内容全部到位。
3. **阶段 3：导读指南与学习地图重写**
   - 全新重写 `doc/MySQL/前言.md` 与 `doc/Java/后端学习地图.md`。
4. **阶段 4：VitePress 侧边栏与全局导航全面重构**
   - 彻底重构 `.vitepress/config.mts` 中的 `sidebar` 导航，按阶梯清晰渲染。
5. **阶段 5：全站编译与链接验证**
   - 运行 `npm run docs:build` 进行全站构建与死链静态检测，验证通过。
