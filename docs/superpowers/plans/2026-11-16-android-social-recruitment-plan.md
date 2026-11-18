# Android 社招 2~5年+ 41 篇硬核知识库实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Android 板块构建 41 篇面向社招 2~5 年+、覆盖 Linux 内核、IPC、Framework 源码、渲染管线、ART 虚拟机、JNI、Compose、APM 性能治理的高密度知识库，并完成侧边栏重构与构建验证。

**Architecture:** 严格遵循 4 维度规范（Mermaid 架构/时序拓扑 + 源码/算法物理推导 + 社招连环追问 + 生产排障 SOP），重构 `doc/Android/` 目录下全部核心专题。

**Tech Stack:** Android Framework (ATMS/WMS/PMS), Linux Kernel (Binder, mmap, epoll, ashmem), ART VM, Skia/RenderThread, Compose Compiler, Kotlin Coroutines, NDK, VitePress.

**Spec:** `docs/superpowers/specs/2026-11-16-android-social-recruitment-design.md`

---

## 任务拆解清单

- [ ] **Task 1: 阶段一 Linux 内核基石与 Binder IPC 通信深水区 (5 篇)**
  - `doc/Android/Binder核心物理机制与一次拷贝mmap原理.md`
  - `doc/Android/AIDL底层编译架构与Stub-Proxy模型逐行剖析.md`
  - `doc/Android/Binder线程池管理死亡代理与驱动协议码.md`
  - `doc/Android/跨进程超大传输突破Ashmem匿名共享内存与FileProvider.md`
  - `doc/Android/Zygote孵化机制与应用进程创建全流程.md`

- [ ] **Task 2: 阶段二 Framework 核心子系统与生命周期调度 (5 篇)**
  - `doc/Android/App冷启动全时序深挖从startActivity到首帧上屏.md`
  - `doc/Android/AMS与ATMS任务栈管理与LaunchMode底层状态机.md`
  - `doc/Android/WMS窗口管理系统Token校验与BadTokenException破局.md`
  - `doc/Android/PMS包管理服务APK解析签名校验与权限映射.md`
  - `doc/Android/四大组件底层机制Service跨进程保活与广播风暴治理.md`

- [ ] **Task 3: 阶段三 UI 渲染引擎、屏幕刷新与事件分发 (5 篇)**
  - `doc/Android/Choreographer编舞者VSYNC与SurfaceFlinger渲染管线.md`
  - `doc/Android/屏幕防撕裂双缓冲三缓冲Triple-Buffering与掉帧物理成因.md`
  - `doc/Android/View树绘制流程深入performTraversals与MeasureSpec计算.md`
  - `doc/Android/硬件加速底层DisplayList-RenderNode与RenderThread渲染管线.md`
  - `doc/Android/View事件分发责任链多点触控与NestedScrolling嵌套滑动.md`

- [ ] **Task 4: 阶段四 消息循环、异步机制与高级组件 (4 篇)**
  - `doc/Android/Handler消息机制底层源码与Linux-epoll唤醒原理.md`
  - `doc/Android/同步屏障Sync-Barrier与IdleHandler冷启动分批初始化.md`
  - `doc/Android/RecyclerView五级缓存架构与预取机制Prefetch.md`
  - `doc/Android/自定义View高级绘制Xfermode-PathMeasure与Shader着色器.md`

- [ ] **Task 5: 阶段五 ART 虚拟机、Class加载与热修复/插件化 (4 篇)**
  - `doc/Android/Dalvik与ART架构演进AOT-JIT与Profile引导混合编译.md`
  - `doc/Android/DEX文件格式深度拆解与65535方法数限制物理成因.md`
  - `doc/Android/类加载器ClassLoader体系与双亲委派机制.md`
  - `doc/Android/热修复与插件化核心原理DexElements合并与资源加载.md`

- [ ] **Task 6: 阶段六 NDK、C++ 底层与 Native 稳定性监控 (3 篇)**
  - `doc/Android/JNI核心原理动态注册静态注册与引用泄漏防范.md`
  - `doc/Android/Android-Linker与SO加载流程PLT-GOT-Hook与Inline-Hook.md`
  - `doc/Android/Native-Crash捕获机制Linux信号处理与Breakpad移植.md`

- [ ] **Task 7: 阶段七 Kotlin 协程并发与现代响应式架构 (4 篇)**
  - `doc/Android/Kotlin协程底层原理挂起函数与Continuation状态机.md`
  - `doc/Android/协程调度器Dispatchers与工作窃取线程池机制.md`
  - `doc/Android/Flow响应式冷流与热流StateFlow-SharedFlow背压治理.md`
  - `doc/Android/ViewModel跨配置恢复与Lifecycle状态机深度解密.md`

- [ ] **Task 8: 阶段八 Jetpack Compose 声明式 UI 革命 (3 篇)**
  - `doc/Android/Compose编译器插件底层Composable字节码变换与Composer调用树.md`
  - `doc/Android/Compose运行时状态管理SlotTable-GapBuffer与快照系统.md`
  - `doc/Android/智能重组Smart-Recomposition机制稳定性推导与布局绘制.md`

- [ ] **Task 9: 阶段九 网络通信与高并发持久化核心框架 (2 篇)**
  - `doc/Android/OkHttp核心架构全景五大拦截器责任链与连接池复用机制.md`
  - `doc/Android/MMKV极速持久化原理mmap与Room数据库WAL并发模式.md`

- [ ] **Task 10: 阶段十 大厂 APM 性能治理与线上疑难攻防 (5 篇)**
  - `doc/Android/内存泄露深度治理LeakCanary源码Shark引擎与Native泄漏.md`
  - `doc/Android/Bitmap物理内存变迁复用池与超大图分块加载.md`
  - `doc/Android/线上卡顿监控BlockCanary-Matrix原理与ASM插桩APM实战.md`
  - `doc/Android/ANR触发四大场景底层超时机制与traces物理排障SOP.md`
  - `doc/Android/极速冷启动秒开有向无环图DAG任务编排与包体积瘦身SOP.md`

- [ ] **Task 11: 压轴篇 Android 社招高频硬核 50 道连环炮全景通关 (1 篇)**
  - `doc/Android/Android社招高频硬核50道连环炮全景通关.md`

- [ ] **Task 12: 侧边栏导航重构与构建验证**
  - 更新 `doc/Android/前言.md` 为 10 大阶段社招学习导航
  - 更新 `.vitepress/config.mts` 中 Android 侧边栏为阶梯式完整分组
  - 执行 `npm run docs:build` 确保全量 0 编译错误、0 坏链
