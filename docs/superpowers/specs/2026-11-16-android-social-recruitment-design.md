# Android 社招 2~5年+ 资深工程师 41 篇全景知识库设计规约

## 1. 目标与背景
针对社招 2~5 年+ 资深 Android 开发工程师、架构师，构建覆盖操作系统底层、内核 IPC、Framework 核心服务源码、UI 渲染管线、ART 虚拟机、JNI/NDK、Compose 编译器、Kotlin 协程以及大厂 APM 全链路监控的硬核体系。

## 2. 4 维度规范
所有文档必须严格遵循 4 维度标准：
1. **核心底层机制与全景架构**：必须包含 Mermaid 架构图、时序图或状态机；
2. **源码级 / 算法物理推导**：包含物理原理、底层数据结构、数学公式与核心源码逐行解析；
3. **社招高频硬核连环追问**：3~5 组深度追问链路与反证分析；
4. **生产级避坑指南与排障 SOP**：真实线上资损/卡顿/崩溃事故排查命令与治理方案。

## 3. 41 篇专题完整清单

### 阶段一：Linux 内核基石与 Binder IPC 通信深水区（5 篇）
1. `doc/Android/Binder核心物理机制与一次拷贝mmap原理.md`
2. `doc/Android/AIDL底层编译架构与Stub-Proxy模型逐行剖析.md`
3. `doc/Android/Binder线程池管理死亡代理与驱动协议码.md`
4. `doc/Android/跨进程超大传输突破Ashmem匿名共享内存与FileProvider.md`
5. `doc/Android/Zygote孵化机制与应用进程创建全流程.md`

### 阶段二：Framework 核心子系统与生命周期调度（5 篇）
6. `doc/Android/App冷启动全时序深挖从startActivity到首帧上屏.md`
7. `doc/Android/AMS与ATMS任务栈管理与LaunchMode底层状态机.md`
8. `doc/Android/WMS窗口管理系统Token校验与BadTokenException破局.md`
9. `doc/Android/PMS包管理服务APK解析签名校验与权限映射.md`
10. `doc/Android/四大组件底层机制Service跨进程保活与广播风暴治理.md`

### 阶段三：UI 渲染引擎、屏幕刷新与事件分发（5 篇）
11. `doc/Android/Choreographer编舞者VSYNC与SurfaceFlinger渲染管线.md`
12. `doc/Android/屏幕防撕裂双缓冲三缓冲Triple-Buffering与掉帧物理成因.md`
13. `doc/Android/View树绘制流程深入performTraversals与MeasureSpec计算.md`
14. `doc/Android/硬件加速底层DisplayList-RenderNode与RenderThread渲染管线.md`
15. `doc/Android/View事件分发责任链多点触控与NestedScrolling嵌套滑动.md`

### 阶段四：消息循环、异步机制与高级组件（4 篇）
16. `doc/Android/Handler消息机制底层源码与Linux-epoll唤醒原理.md`
17. `doc/Android/同步屏障Sync-Barrier与IdleHandler冷启动分批初始化.md`
18. `doc/Android/RecyclerView五级缓存架构与预取机制Prefetch.md`
19. `doc/Android/自定义View高级绘制Xfermode-PathMeasure与Shader着色器.md`

### 阶段五：ART 虚拟机、Class加载与热修复/插件化（4 篇）
20. `doc/Android/Dalvik与ART架构演进AOT-JIT与Profile引导混合编译.md`
21. `doc/Android/DEX文件格式深度拆解与65535方法数限制物理成因.md`
22. `doc/Android/类加载器ClassLoader体系与双亲委派机制.md`
23. `doc/Android/热修复与插件化核心原理DexElements合并与资源加载.md`

### 阶段六：NDK、C++ 底层与 Native 稳定性监控（3 篇）
24. `doc/Android/JNI核心原理动态注册静态注册与引用泄漏防范.md`
25. `doc/Android/Android-Linker与SO加载流程PLT-GOT-Hook与Inline-Hook.md`
26. `doc/Android/Native-Crash捕获机制Linux信号处理与Breakpad移植.md`

### 阶段七：Kotlin 协程并发与现代响应式架构（4 篇）
27. `doc/Android/Kotlin协程底层原理挂起函数与Continuation状态机.md`
28. `doc/Android/协程调度器Dispatchers与工作窃取线程池机制.md`
29. `doc/Android/Flow响应式冷流与热流StateFlow-SharedFlow背压治理.md`
30. `doc/Android/ViewModel跨配置恢复与Lifecycle状态机深度解密.md`

### 阶段八：Jetpack Compose 声明式 UI 革命（3 篇）
31. `doc/Android/Compose编译器插件底层Composable字节码变换与Composer调用树.md`
32. `doc/Android/Compose运行时状态管理SlotTable-GapBuffer与快照系统.md`
33. `doc/Android/智能重组Smart-Recomposition机制稳定性推导与布局绘制.md`

### 阶段九：网络通信与高并发持久化核心框架（2 篇）
34. `doc/Android/OkHttp核心架构全景五大拦截器责任链与连接池复用机制.md`
35. `doc/Android/MMKV极速持久化原理mmap与Room数据库WAL并发模式.md`

### 阶段十：大厂 APM 性能治理与线上疑难攻防（5 篇）
36. `doc/Android/内存泄露深度治理LeakCanary源码Shark引擎与Native泄漏.md`
37. `doc/Android/Bitmap物理内存变迁复用池与超大图分块加载.md`
38. `doc/Android/线上卡顿监控BlockCanary-Matrix原理与ASM插桩APM实战.md`
39. `doc/Android/ANR触发四大场景底层超时机制与traces物理排障SOP.md`
40. `doc/Android/极速冷启动秒开有向无环图DAG任务编排与包体积瘦身SOP.md`

### 压轴终极篇（1 篇）
41. `doc/Android/Android社招高频硬核50道连环炮全景通关.md`
