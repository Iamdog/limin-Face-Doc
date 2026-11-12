---
title: Kotlin 语言使用与面试学习路线
description: 从可空数据、业务模型、集合和 Java 混编开始，逐步进入协程、机制与分层面试。
---

# Kotlin 语言使用与面试学习路线

## 一、先明确 Kotlin 帮你解决什么问题

Kotlin 用可空类型表达缺失数据，用属性、data class 和默认参数减少样板，用集合变换和高阶函数组织业务逻辑。协程库再帮助组织异步任务、取消和状态流。**语言基础、协程库、Android 生命周期是三层知识**：会 `viewModelScope.launch` 不等于已经掌握 Kotlin。

本路线以 Kotlin/JVM 为主要环境，Android 场景单独注明。不会要求你先背 inline 字节码或 suspend 状态机；先能写、能解释输入输出、能处理错误，再深入实现。

## 二、从哪里开始，学到什么算过关

| 顺序 | 解决的问题 | 使用与详解 | 过关证据 |
|---|---|---|---|
| 1. 语言基础 | 空输入、变量和分支怎样表达 | [语言基础与日常开发](/doc/Android/Kotlin语言基础与日常开发) | 写出输入解析、默认值、when 分支；解释 val、null、相等 |
| 2. 业务模型 | 怎样表达对象、状态和类型约束 | [面向对象、泛型与委托](/doc/Android/Kotlin面向对象泛型与委托详解) | 用 sealed 表达状态；复现浅拷贝；设计只读泛型接口 |
| 3. 数据处理 | 怎样清洗列表、组织回调和配置 | [集合、函数式与 DSL](/doc/Android/Kotlin集合函数式与DSL实战) | 处理空集、重复键、惰性求值；选对作用域函数 |
| 4. Java 混编 | Java 返回 null、调用 Kotlin API 怎么办 | [Java 互操作](/doc/Android/Kotlin与Java互操作实战) | 在边界接收可空值；解释默认参数、静态入口和受检异常 |
| 5. 异步任务 | 请求编排、取消和页面状态怎么做 | [协程与 Flow 实战](/doc/Android/协程与Flow实战) | 可取消并发；冷流重复执行；生命周期收集与错误重试 |
| 6. 实现与取舍 | 为什么这样运行，何时值得优化 | [核心机制与高频实战](/doc/Android/Kotlin核心机制与高频实战解析) | 用编译产物验证内联、Continuation 和属性访问 |
| 7. 面试复盘 | 从能用进阶到能解释和排错 | [高频面试题与代码练习](/doc/Android/Kotlin高频面试题与代码练习) | 每题先讲用途与代码，再讲失败、原理和边界 |

语言基础可在 Kotlin Playground 或本地 `kotlinc` 中练习。文中标“完整示例”的标准库程序有 `main`；协程完整示例额外依赖 `kotlinx-coroutines-core`。Android 片段依赖 AndroidX，不能直接放进纯 JVM 控制台运行。

## 三、建议完成的六个小任务

1. **表单解析**：将 `String?` 转成正整数页大小，拒绝空白、非法数字、零、负数，限制上限。不要把所有非法输入都默默当默认值。
2. **页面模型**：定义 Loading/Content/Error；用穷尽 when 渲染，数据模型使用不可变属性。复现 copy 共享列表，再修正状态更新。
3. **列表整理**：按 ID 去重、按标签分组、汇总数量。先决定重复键保留哪条，再写 `associateBy`；比较 List 与 Sequence 的执行次数。
4. **混编边界**：Java 返回 null 时先转为显式可空值；分别检查“不存在”和“非法格式”。用 Java 调一次 Kotlin 的静态入口。
5. **可取消加载**：两个必需请求一起成功或失败；可选请求单独降级；父任务取消必须传播，不能被 `runCatching` 吞掉。
6. **状态收集**：离开页面停止 UI 收集，回来恢复；解释冷流为什么可能重发请求、stateIn 的共享策略以及事件丢失的处理。

每个任务保留正常输入、边界输入、失败复现和修复理由。先回答数据最终是什么、任务是否结束、错误是否可定位，再用底层机制解释原因。

## 四、面试深度分层

| 层级 | 优先掌握 | 不应跳过的验证 |
|---|---|---|
| 基础 | val/var、null、函数、when、class/data class、集合与作用域函数 | null、空集、重复键、浅拷贝、引用与内容相等 |
| 进阶 | 泛型型变、委托、扩展、Java 混编、协程取消、Flow 共享 | 平台类型、异常传播、生命周期、并发更新 |
| 深入 | inline/reified、CPS、调度、Flow 上下文、JVM API 与性能 | 实际编译产物、线程/任务日志和代表负载测量 |

Android 岗位在第 5 步后衔接 ViewModel、Room 和 Compose；Java 后端岗位可把 Kotlin 用在已有 JVM 业务层，但事务、权限、数据库排错仍沿用 [Java 补强路线](/doc/Java/CRUD之后的后端补强路线)。语言便利不会自动解决业务可靠性。

## 五、覆盖范围和进一步专题

本组覆盖常用语言语法、类型与模型、集合、函数与 DSL、JVM 混编、协程/Flow 和分层问答。反射基础、value class 与 K2 编译器在机制/面试中给出边界；Kotlin Multiplatform、Native 内存模型、编译器插件及 kotlinx.serialization 完整接入需独立专题，不能用 JVM 的结论代替各平台验证。

官方核对入口：[语言文档](https://kotlinlang.org/docs/home.html)、[协程指南](https://kotlinlang.org/docs/coroutines-guide.html)、[Android 协程建议](https://developer.android.com/kotlin/coroutines/coroutines-best-practices)。遇到版本差异，记录编译器、协程库、JDK 与 AndroidX 版本再比较。

## 六、已执行的示例验证

2026-11-12，使用 Kotlin 2.2.21、kotlinx-coroutines 1.10.2、JDK 21（JVM target 17），提取并编译运行了本组文档标记的 **37 个完整示例**，包括两组 Java/Kotlin 双向混编。结果断言覆盖空值、浅拷贝、集合重复键、Sequence 求值、扩展分派、泛型擦除、协程故障隔离/取消、Flow 重试/状态合并、无订阅事件丢失及回调注销。

页面本地链接与导航检查、Vue 页面解析和 VitePress 生产构建通过。Android ViewModel/Fragment 片段明确标注依赖，尚未在实际 Android 工程编译或设备演练；KMP/Native 与目标 release 性能也不在此次 JVM 示例验证范围内。
