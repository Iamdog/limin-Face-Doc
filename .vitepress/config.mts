import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "Face-Doc",
  description: "全栈技术学习与实战沉淀：Android/Flutter/UniApp · Vue 3 · Java 后端与 Spring 微服务 · MySQL · DevOps 与 AI 实战",
  base: "/limin-Face-Doc/", // 必须和你的 GitHub 仓库名一致，且前后都有斜杠

  // Mermaid 11.17 新增依赖 fastdom（UMD/CJS 包）。
  // vitepress-plugin-mermaid 的 optimizeDeps.include 白名单里漏了它，
  // 开发模式下 Vite 会把 UMD 源码当 ESM 直出，浏览器报
  // "does not provide an export named 'default'"；显式预构建即可修复。
  // 生产构建由 Rollup 的 commonjs 插件处理，本身不受影响。
  vite: {
    optimizeDeps: {
      include: ["fastdom", "fastdom/extensions/fastdom-promised.js"],
    },
  },

  // 三篇内部审计/检查记录：保留在仓库作为维护日志，不构建进站点
  srcExclude: [
    'doc/知识库检查与分层学习地图.md',
    'doc/专题逐篇检查清单.md',
    'doc/面试考点覆盖复查报告.md',
  ],

  themeConfig: {
    // 长文档展开三级目录，便于快速定位到具体小节
    outline: { level: [2, 3], label: "本节导航" },
    search: {
      provider: "local",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "快速开始", link: "/doc/前言" },
      {
        text: "移动端与跨端",
        items: [
          { text: "Android 原生与底层", link: "/doc/Android/前言" },
          { text: "Kotlin 现代化语言", link: "/doc/Android/Kotlin前言" },
          { text: "Jetpack Compose UI", link: "/doc/Android/Compose前言" },
          { text: "Flutter", link: "/doc/flutter/前言" },
          { text: "Uni-App", link: "/doc/uniapp/前言" },
          { text: "微信小程序", link: "/doc/微信小程序/前言" },
          { text: "浙政钉", link: "/doc/浙政钉/浙政钉开发上架流程" },
        ],
      },
      {
        text: "前端与全栈",
        items: [
          { text: "Vue", link: "/doc/Vue/前言" },
          { text: "全栈高并发场景", link: "/doc/Fullstack/前言" },
        ],
      },
      {
        text: "后端与存储",
        items: [
          { text: "Java 后端", link: "/doc/Java/前言" },
          { text: "MySQL 数据库", link: "/doc/MySQL/前言" },
          { text: "中间件与高可用治理", link: "/doc/Java/常用中间件核心原理与选型速查" },
        ],
      },
      {
        text: "架构与运维",
        items: [
          { text: "系统设计与场景题", link: "/doc/SystemDesign/前言" },
          { text: "网络与通信协议", link: "/doc/Network/前言" },
          { text: "DevOps 与容器工程化", link: "/doc/DevOps/前言" },
        ],
      },
      {
        text: "前沿与生态",
        items: [
          { text: "AI 前沿实战", link: "/doc/AI/前言" },
          { text: "极客社区与资源", link: "/doc/社区资源/第三方论坛与技术社区导航" },
        ],
      },
    ],

    sidebar: [
      {
        text: "📖 导读指南",
        items: [
          {
            text: "前言",
            link: "/doc/前言",
          },
          { text: "数据结构与算法实践", link: "/doc/基础能力/数据结构算法与面试实践" },
          { text: "测试设计与工程交付", link: "/doc/基础能力/测试设计与工程交付" },
        ],
      },
      {
        text: "📱 移动端与跨端",
        items: [
          {
            text: "Android 原生与系统底层",
            link: "/doc/Android/前言",
            collapsed: true,
            items: [
              { text: "前言：全阶段技术图谱与学习路线", link: "/doc/Android/前言" },
              {
                text: "一、初级筑基·四大组件与核心视图体系",
                collapsed: true,
                items: [
                  { text: "01. Android 原生应用基础开发与调试验证规范", link: "/doc/Android/Android应用基本开发与验证" },
                  { text: "02. 四大组件之 Activity 状态机与生命周期深入", link: "/doc/Android/四大组件之Activity" },
                  { text: "03. 四大组件之 Service 生命周期、前台服务与绑定机制", link: "/doc/Android/四大组件之Service" },
                  { text: "04. 四大组件之 BroadcastReceiver 注册机制与广播风暴治理", link: "/doc/Android/四大组件之BroadcastReceiver" },
                  { text: "05. 四大组件之 ContentProvider 数据共享与多进程访问", link: "/doc/Android/四大组件之ContentProvider" },
                  { text: "06. Fragment 核心生命周期、事务提交与栈管理实战", link: "/doc/Android/Fragment" },
                  { text: "07. 常用布局容器测量排版特性与自适应布局方式", link: "/doc/Android/布局方式" },
                  { text: "08. Window、DecorView 与 ViewRootImpl 层级结构剖析", link: "/doc/Android/Window与DecorView" },
                  { text: "09. Android 动画体系核心：补间动画、帧动画与属性动画", link: "/doc/Android/动画体系" },
                  { text: "10. 网络通信基础：Retrofit 与 OkHttp 企业级网络层封装", link: "/doc/Android/网络框架Retrofit-OkHttp" },
                ],
              },
              {
                text: "二、中级进阶·异步消息、数据持久化与现代架构",
                collapsed: true,
                items: [
                  { text: "11. OkHttp 核心架构全景：五大拦截器责任链与连接池复用机制", link: "/doc/Android/OkHttp核心架构全景五大拦截器责任链与连接池复用机制" },
                  { text: "12. Handler 消息机制四大核心对象与底层源码全景", link: "/doc/Android/Handler消息机制" },
                  { text: "13. 同步屏障 Sync-Barrier 与 IdleHandler 冷启动分批初始化", link: "/doc/Android/同步屏障Sync-Barrier与IdleHandler冷启动分批初始化" },
                  { text: "14. 异步任务组件对比：HandlerThread、IntentService 与 WorkManager", link: "/doc/Android/HandlerThread-IntentService-WorkManager对比" },
                  { text: "15. 本地持久化选型：SharedPreferences、DataStore 与 MMKV 深度对比", link: "/doc/Android/SharedPreferences-DataStore-MMKV" },
                  { text: "16. 极速持久化 MMKV 原理 mmap 与 Room 数据库 WAL 并发模式", link: "/doc/Android/MMKV极速持久化原理mmap与Room数据库WAL并发模式" },
                  { text: "17. Jetpack 之 Room 数据库核心架构与实战", link: "/doc/Android/Jetpack之Room" },
                  { text: "18. Jetpack ViewModel 跨配置恢复与 LiveData/Lifecycle 状态机解密", link: "/doc/Android/ViewModel跨配置恢复与Lifecycle状态机深度解密" },
                  { text: "19. 自定义 View 高级绘制：Xfermode、PathMeasure 与 Shader 着色器", link: "/doc/Android/自定义View高级绘制Xfermode-PathMeasure与Shader着色器" },
                  { text: "20. View 事件分发责任链、多点触控与滑动冲突实战", link: "/doc/Android/View事件分发责任链多点触控与NestedScrolling嵌套滑动" },
                  { text: "21. RecyclerView 五级缓存架构与预取机制 Prefetch 深度解析", link: "/doc/Android/RecyclerView五级缓存架构与预取机制Prefetch" },
                ],
              },
              {
                text: "三、高级深水·Framework 核心调度、Binder IPC 与系统渲染管线",
                collapsed: true,
                items: [
                  { text: "22. Linux 内核基石：Binder 物理机制与一次拷贝 mmap 原理深剖", link: "/doc/Android/Binder核心物理机制与一次拷贝mmap原理" },
                  { text: "23. AIDL 底层编译架构与 Stub-Proxy 模型逐行剖析", link: "/doc/Android/AIDL底层编译架构与Stub-Proxy模型逐行剖析" },
                  { text: "24. Binder 线程池管理、死亡代理与驱动协议码", link: "/doc/Android/Binder线程池管理死亡代理与驱动协议码" },
                  { text: "25. 跨进程超大传输突破：Ashmem 匿名共享内存与 FileProvider 机制", link: "/doc/Android/跨进程超大传输突破Ashmem匿名共享内存与FileProvider" },
                  { text: "26. Zygote 孵化机制与应用进程创建全流程", link: "/doc/Android/Zygote孵化机制与应用进程创建全流程" },
                  { text: "27. AMS 与 ATMS 任务栈管理与 LaunchMode 底层状态机", link: "/doc/Android/AMS与ATMS任务栈管理与LaunchMode底层状态机" },
                  { text: "28. WMS 窗口管理系统：Token 校验与 BadTokenException 破局", link: "/doc/Android/WMS窗口管理系统Token校验与BadTokenException破局" },
                  { text: "29. PMS 包管理服务：APK 解析、签名校验与权限映射", link: "/doc/Android/PMS包管理服务APK解析签名校验与权限映射" },
                  { text: "30. 四大组件底层机制：Service 跨进程保活与广播风暴治理", link: "/doc/Android/四大组件底层机制Service跨进程保活与广播风暴治理" },
                  { text: "31. UI 渲染引擎：Choreographer 编舞者 VSYNC 与 SurfaceFlinger 渲染管线", link: "/doc/Android/Choreographer编舞者VSYNC与SurfaceFlinger渲染管线" },
                  { text: "32. 屏幕防撕裂双缓冲三缓冲 Triple-Buffering 与掉帧物理成因", link: "/doc/Android/屏幕防撕裂双缓冲三缓冲Triple-Buffering与掉帧物理成因" },
                  { text: "33. View 树绘制流程深入：performTraversals 与 MeasureSpec 计算", link: "/doc/Android/View树绘制流程深入performTraversals与MeasureSpec计算" },
                  { text: "34. 硬件加速底层 DisplayList-RenderNode 与 RenderThread 渲染管线", link: "/doc/Android/硬件加速底层DisplayList-RenderNode与RenderThread渲染管线" },
                  { text: "35. Handler 消息机制底层源码与 Linux-epoll 唤醒原理物理剖析", link: "/doc/Android/Handler消息机制底层源码与Linux-epoll唤醒原理" },
                ],
              },
              {
                text: "四、资深架构·ART 虚拟机、NDK 底层、APM 性能治理与稳定性攻防",
                collapsed: true,
                items: [
                  { text: "36. Dalvik 与 ART 架构演进：AOT-JIT 与 Profile 引导混合编译", link: "/doc/Android/Dalvik与ART架构演进AOT-JIT与Profile引导混合编译" },
                  { text: "37. DEX 文件格式深度拆解与 65535 方法数限制物理成因", link: "/doc/Android/DEX文件格式深度拆解与65535方法数限制物理成因" },
                  { text: "38. 类加载器 ClassLoader 体系与双亲委派机制", link: "/doc/Android/类加载器ClassLoader体系与双亲委派机制" },
                  { text: "39. 热修复与插件化核心原理：DexElements 合并与资源加载", link: "/doc/Android/热修复与插件化核心原理DexElements合并与资源加载" },
                  { text: "40. JNI 核心原理：动态注册、静态注册与引用泄漏防范", link: "/doc/Android/JNI核心原理动态注册静态注册与引用泄漏防范" },
                  { text: "41. Android-Linker 与 SO 加载流程：PLT-GOT-Hook 与 Inline-Hook", link: "/doc/Android/Android-Linker与SO加载流程PLT-GOT-Hook与Inline-Hook" },
                  { text: "42. ⚠️ Android 16KB 页面大小兼容影响与治理全解", link: "/doc/Android/Android16KB页面大小兼容影响与治理全解" },
                  { text: "43. App 冷启动全时序深挖：从 startActivity 到首帧上屏", link: "/doc/Android/App冷启动全时序深挖从startActivity到首帧上屏" },
                  { text: "44. 极速冷启动秒开：有向无环图 DAG 任务编排与包体积瘦身 SOP", link: "/doc/Android/极速冷启动秒开有向无环图DAG任务编排与包体积瘦身SOP" },
                  { text: "45. 内存泄露深度治理：LeakCanary 源码 Shark 引擎与 Native 泄漏", link: "/doc/Android/内存泄露深度治理LeakCanary源码Shark引擎与Native泄漏" },
                  { text: "46. Bitmap 物理内存变迁、复用池与超大图分块加载", link: "/doc/Android/Bitmap物理内存变迁复用池与超大图分块加载" },
                  { text: "47. 线上卡顿监控：BlockCanary-Matrix 原理与 ASM 插桩 APM 实战", link: "/doc/Android/线上卡顿监控BlockCanary-Matrix原理与ASM插桩APM实战" },
                  { text: "48. ANR 触发四大场景底层超时机制与 traces 物理排障 SOP", link: "/doc/Android/ANR触发四大场景底层超时机制与traces物理排障SOP" },
                  { text: "49. Native-Crash 捕获机制：Linux 信号处理与 Breakpad 移植", link: "/doc/Android/Native-Crash捕获机制Linux信号处理与Breakpad移植" },
                  { text: "50. OOM 内存溢出防范与线上复杂崩溃治理全景实战", link: "/doc/Android/崩溃治理专题" },
                  { text: "51. Android 代码混淆与 R8 高级实战全解", link: "/doc/Android/Android代码混淆与R8高级实战全解" },
                  { text: "52. Android 发包打包、签名与 ADB 调试命令全集", link: "/doc/Android/Android发包打包与ADB调试命令全集" },
                ],
              },
              {
                text: "五、全阶段通关真题库·社招高频硬核连环炮",
                collapsed: false,
                items: [
                  { text: "53. 🎯 Android 社招高频硬核 50 道连环炮全景通关", link: "/doc/Android/Android社招高频硬核50道连环炮全景通关" },
                ],
              },
            ],
          },
          {
            text: "Kotlin 现代语言与并发响应式",
            link: "/doc/Android/Kotlin前言",
            collapsed: true,
            items: [
              { text: "前言：Kotlin 全阶段技术图谱与学习路线", link: "/doc/Android/Kotlin前言" },
              {
                text: "一、初级筑基·核心语法、函数式与面向对象实战",
                collapsed: true,
                items: [
                  { text: "01. Kotlin 语言使用与全阶段学习路线", link: "/doc/Android/Kotlin语言使用与面试学习路线" },
                  { text: "02. Kotlin 基础核心语法、控制流与空安全深度剖析", link: "/doc/Android/Kotlin语言基础与日常开发" },
                  { text: "03. Kotlin 面向对象、泛型型变(out/in)与委托详解", link: "/doc/Android/Kotlin面向对象泛型与委托详解" },
                  { text: "04. Kotlin 集合操作符、高阶函数与 DSL 实战", link: "/doc/Android/Kotlin集合函数式与DSL实战" },
                  { text: "05. Kotlin 与 Java 互操作实战与平台类型空安全避坑", link: "/doc/Android/Kotlin与Java互操作实战" },
                ],
              },
              {
                text: "二、中级进阶·协程体系、并发模型与结构化调度",
                collapsed: true,
                items: [
                  { text: "06. 异步演进历程与结构化并发 Job 与作用域体系深度解密", link: "/doc/Android/Kotlin异步演进与结构化并发Job与作用域体系" },
                  { text: "07. 协程调度器 Dispatchers 与底核工作窃取线程池机制", link: "/doc/Android/协程调度器Dispatchers与工作窃取线程池机制" },
                  { text: "08. 协程与 Flow 实战：并发模型演进与结构化并发", link: "/doc/Android/协程与Flow实战" },
                  { text: "09. 多线程并发编程模型与生产级线程池调优实战", link: "/doc/Android/多线程" },
                  { text: "10. Channel 通道模型与 CSP 跨协程高并发安全实战", link: "/doc/Android/KotlinChannel通道模型与并发安全实战" },
                ],
              },
              {
                text: "三、高级深水·状态机编译底层、Flow 响应式流与源码剖析",
                collapsed: true,
                items: [
                  { text: "11. 协程底层编译黑魔法：挂起函数与 Continuation 状态机源码推导", link: "/doc/Android/Kotlin协程底层原理挂起函数与Continuation状态机" },
                  { text: "12. Flow 响应式冷流与热流 StateFlow-SharedFlow 背压治理全解", link: "/doc/Android/Flow响应式冷流与热流StateFlow-SharedFlow背压治理" },
                  { text: "13. Kotlin 核心编译机制与高频实战解析", link: "/doc/Android/Kotlin核心机制与高频实战解析" },
                  { text: "14. Kotlin 元编程：KSP 符号处理器与编译器插件实战", link: "/doc/Android/Kotlin元编程KSP符号处理器与编译器插件实战" },
                  { text: "15. Kotlin 跨平台 KMP 架构设计与双端代码共享实战", link: "/doc/Android/Kotlin跨平台KMP架构设计与代码共享实战" },
                ],
              },
              {
                text: "四、资深架构·性能调优、工程治理与响应式落地",
                collapsed: true,
                items: [
                  { text: "16. Kotlin 现代化响应式单向数据流 MVI 架构实战", link: "/doc/Android/Kotlin现代化响应式单向数据流MVI架构实战" },
                  { text: "17. ViewModel 跨配置恢复与 Lifecycle 协程生命周期绑定", link: "/doc/Android/ViewModel跨配置恢复与Lifecycle状态机深度解密" },
                ],
              },
              {
                text: "五、全阶段通关真题库·大厂高频面试硬核连环炮",
                collapsed: false,
                items: [
                  { text: "18. Kotlin 核心基础与高频代码练习全景通关", link: "/doc/Android/Kotlin高频面试题与代码练习" },
                  { text: "19. 🎯 Kotlin 资深与架构师社招高频硬核 50 道连环炮全景通关", link: "/doc/Android/Kotlin资深与架构师社招高频硬核50道连环炮全景通关" },
                ],
              },
            ],
          },
          {
            text: "Jetpack Compose 声明式 UI",
            link: "/doc/Android/Compose前言",
            collapsed: true,
            items: [
              { text: "前言：Compose 全阶段技术图谱与学习路线", link: "/doc/Android/Compose前言" },
              {
                text: "一、初级筑基·声明式思维与核心组件布局",
                collapsed: true,
                items: [
                  { text: "01. Compose 基础与核心要点：从命令式到声明式思维转变", link: "/doc/Android/Compose基础与核心要点" },
                  { text: "02. Compose 核心布局容器 Row、Column、Box 与 Lazy 列表实战", link: "/doc/Android/Compose核心布局容器Row-Column-Box与Lazy列表实战" },
                  { text: "03. Compose 与 Flutter 声明式 UI 布局与性能优化全景指南", link: "/doc/Android/Compose与Flutter声明式UI布局与性能优化全景指南" },
                ],
              },
              {
                text: "二、中级进阶·状态驱动、快照系统与生命周期",
                collapsed: true,
                items: [
                  { text: "04. Compose 状态管理：remember、mutableStateOf 与状态提升实战", link: "/doc/Android/Compose状态管理remember与mutableStateOf及状态提升" },
                  { text: "05. Compose 副作用 API：LaunchedEffect、DisposableEffect 与生命周期实战", link: "/doc/Android/Compose副作用APILaunchedEffect与生命周期实战" },
                  { text: "06. Compose 单 Activity 导航路由 Navigation-Compose 实战", link: "/doc/Android/Compose单Activity导航路由Navigation-Compose实战" },
                  { text: "07. Compose 底层原理与深度实战：CompositionLocal 与组件封装", link: "/doc/Android/Compose底层原理与深度实战" },
                ],
              },
              {
                text: "三、高级深水·编译器黑魔法、运行时原理与智能重组",
                collapsed: true,
                items: [
                  { text: "08. Compose 编译器插件底层：Composable 字节码变换与 Composer 调用树", link: "/doc/Android/Compose编译器插件底层Composable字节码变换与Composer调用树" },
                  { text: "09. Compose 运行时状态管理：SlotTable、GapBuffer 与快照系统", link: "/doc/Android/Compose运行时状态管理SlotTable-GapBuffer与快照系统" },
                  { text: "10. 智能重组 Smart-Recomposition 机制：稳定性推导与布局绘制", link: "/doc/Android/智能重组Smart-Recomposition机制稳定性推导与布局绘制" },
                  { text: "11. Compose 自定义绘制与手势交互嵌套滚动全解", link: "/doc/Android/Compose自定义绘制与手势交互嵌套滚动全解" },
                ],
              },
              {
                text: "四、资深架构·性能调优、跨端演进与生产治理",
                collapsed: true,
                items: [
                  { text: "12. Compose 性能调优实战：Layout 优化、Phase 绕过与重组检测", link: "/doc/Android/Compose性能调优实战Layout优化Phase绕过与重组检测" },
                  { text: "13. Compose 与传统 View 混合开发互操作：ComposeView 与 AndroidView 全解", link: "/doc/Android/Compose与传统View混合开发互操作ComposeView与AndroidView" },
                  { text: "14. Compose 跨平台 CMP 在 Desktop 与 iOS 生产演进", link: "/doc/Android/Compose跨平台CMP在Desktop与iOS生产演进" },
                ],
              },
              {
                text: "五、全阶段通关真题库·大厂高频面试硬核连环炮",
                collapsed: false,
                items: [
                  { text: "15. 🎯 Jetpack Compose 资深与架构师社招高频硬核 50 道连环炮全景通关", link: "/doc/Android/Jetpack-Compose资深与架构师社招高频硬核50道连环炮全景通关" },
                ],
              },
            ],
          },
          {
            text: "Flutter",
            link: "/doc/flutter/前言",
            collapsed: true,
            items: [
              { text: "前言：Flutter全阶段技术图谱与学习路线", link: "/doc/flutter/前言" },
              {
                text: "一、初级筑基·Dart语言与Flutter核心组件实战",
                collapsed: true,
                items: [
                  { text: "01. Dart核心语法空安全与异步Future-Stream", link: "/doc/flutter/初级-Dart基础核心语法空安全与异步编程Future-Stream" },
                  { text: "02. 目录结构与Widget声明式UI编程思想", link: "/doc/flutter/初级-Flutter工程目录结构与Widget声明式UI编程思想" },
                  { text: "03. StatelessWidget与StatefulWidget生命周期与setState", link: "/doc/flutter/初级-StatelessWidget与StatefulWidget核心生命周期与setState" },
                  { text: "04. 基础排版Row-Column与Flex-Expanded自适应", link: "/doc/flutter/初级-基础排版布局Row-Column与Flex-Expanded自适应实战" },
                  { text: "05. 层叠布局Stack与Positioned及层级覆盖实战", link: "/doc/flutter/初级-层叠布局Stack与Positioned及层级覆盖实战" },
                  { text: "06. 基础表单输入TextField与Form校验体系", link: "/doc/flutter/初级-基础表单输入TextField与Form表单校验体系" },
                  { text: "07. 滚动容器ListView与GridView基础与分割线", link: "/doc/flutter/初级-滚动容器ListView与GridView基础用法与列表分割线" },
                  { text: "08. 手势识别GestureDetector与InkWell水波纹交互", link: "/doc/flutter/初级-手势识别GestureDetector与InkWell水波纹点击交互" },
                  { text: "09. 图片组件Image全场景加载资产网络与缓存策略", link: "/doc/flutter/初级-图片组件Image全场景加载资产网络与缓存策略" },
                  { text: "10. 新手常见报错排查指南与控制台Error根治SOP", link: "/doc/flutter/初级-新手常见报错排查指南与控制台Error根治SOP" },
                ],
              },
              {
                text: "二、中级进阶·组件架构、导航路由与状态管理实战",
                collapsed: true,
                items: [
                  { text: "11. BuildContext本质作用域链与Theme-MediaQuery", link: "/doc/flutter/中级-BuildContext本质作用域链与Theme-MediaQuery查找机制" },
                  { text: "12. Key机制ValueKey-ObjectKey与GlobalKey物理应用", link: "/doc/flutter/中级-Flutter中的Key机制ValueKey-ObjectKey与GlobalKey物理应用" },
                  { text: "13. CustomScrollView与Sliver视口系统折叠滑动实战", link: "/doc/flutter/中级-CustomScrollView与Sliver视口系统高级折叠滑动实战" },
                  { text: "14. 路由体系Navigator1.0对比Navigator2.0与go_router", link: "/doc/flutter/中级-路由体系Navigator1.0对比Navigator2.0与go_router实战" },
                  { text: "15. InheritedWidget底层数据共享机制与updateShouldNotify", link: "/doc/flutter/中级-InheritedWidget底层数据共享机制与updateShouldNotify" },
                  { text: "16. 状态管理选型对比Provider-Riverpod-Bloc-GetX", link: "/doc/flutter/中级-状态管理选型对比Provider-Riverpod-Bloc-GetX深度实战" },
                  { text: "17. 动画体系核心AnimationController-Tween与CurvedAnimation", link: "/doc/flutter/中级-动画体系核心AnimationController-Tween与CurvedAnimation" },
                  { text: "18. Dio企业级网络层封装拦截器Token无感刷新与取消请求", link: "/doc/flutter/中级-Dio企业级网络层封装拦截器Token无感刷新与取消请求" },
                  { text: "19. 本地数据持久化Hive与SharedPreferences及Isar", link: "/doc/flutter/中级-本地数据持久化Hive与SharedPreferences及Isar选型实战" },
                  { text: "20. 通用弹窗体系Dialog-BottomSheet与SnackBars优雅封装", link: "/doc/flutter/中级-通用弹窗体系Dialog-BottomSheet与SnackBars优雅封装" },
                ],
              },
              {
                text: "三、高级深水·渲染三棵树、事件机制与底层编译源码",
                collapsed: true,
                items: [
                  { text: "21. 渲染核心Widget-Element-RenderObject三棵树生命周期", link: "/doc/flutter/高级-渲染核心Widget-Element-RenderObject三棵树全生命周期" },
                  { text: "22. 布局核心Constraints物理传递向下约束向上确定尺寸", link: "/doc/flutter/高级-布局核心Constraints物理传递向下约束向上确定尺寸" },
                  { text: "23. 绘制管道Layer图层树与RepaintBoundary重绘隔离", link: "/doc/flutter/高级-绘制管道Layer图层树与RepaintBoundary重绘隔离" },
                  { text: "24. 手势竞技场GestureArena机制与多手势滑动冲突解决", link: "/doc/flutter/高级-手势竞技场GestureArena机制与多手势滑动冲突解决" },
                  { text: "25. 自定义绘制CustomPainter与Canvas画笔贝塞尔曲线", link: "/doc/flutter/高级-自定义绘制CustomPainter与Canvas画笔贝塞尔曲线实战" },
                  { text: "26. Dart多线程并发Isolate机制与compute轻量调度", link: "/doc/flutter/高级-Dart多线程并发Isolate机制与compute轻量调度" },
                  { text: "27. Dart编译模式JIT与AOT及底层虚拟机DDC与Snapshot", link: "/doc/flutter/高级-Dart编译模式JIT与AOT及底层虚拟机DDC与Snapshot" },
                  { text: "28. Flutter启动全时序从Native引导到首帧RenderView挂载", link: "/doc/flutter/高级-Flutter启动全时序从Native引导到首帧RenderView挂载" },
                  { text: "29. 热重载HotReload物理原理与状态保留机制源码推导", link: "/doc/flutter/高级-热重载HotReload物理原理与状态保留机制源码推导" },
                  { text: "30. 原生平台通道PlatformChannel编解码源码与二进制流", link: "/doc/flutter/高级-原生平台通道PlatformChannel编解码源码与二进制流" },
                ],
              },
              {
                text: "四、资深架构·混合工程、性能调优与APM稳定性实战",
                collapsed: true,
                items: [
                  { text: "31. 混合开发架构FlutterBoost与多引擎多Activity栈管理", link: "/doc/flutter/资深-混合开发架构FlutterBoost与多引擎多Activity栈管理" },
                  { text: "32. 新一代渲染引擎Impeller架构对比Skia与着色器预编译", link: "/doc/flutter/资深-新一代渲染引擎Impeller架构对比Skia与着色器预编译" },
                  { text: "33. Dart-FFI高性能原生C-C++绑定与内存指针交互", link: "/doc/flutter/资深-Dart-FFI高性能原生C-C++绑定与内存指针交互" },
                  { text: "34. APM全链路性能监控卡顿掉帧FPS采集与卡顿堆栈还原", link: "/doc/flutter/资深-APM全链路性能监控卡顿掉帧FPS采集与卡顿堆栈还原" },
                  { text: "35. 内存泄露排查DevTools-Memory分析与ImageCache调优", link: "/doc/flutter/资深-Flutter内存泄露排查DevTools-Memory分析与ImageCache调优" },
                  { text: "36. 线上异常崩溃监控与Zone沙箱捕获及符号表解析", link: "/doc/flutter/资深-线上异常崩溃监控与Zone沙箱捕获及符号表解析" },
                  { text: "37. 无头渲染与自动化测试单元测试Widget测试集成测试", link: "/doc/flutter/资深-无头渲染与自动化测试单元测试Widget测试集成测试" },
                  { text: "38. CI-CD持续集成流水线Fastlane自动化打包与多渠道风味", link: "/doc/flutter/资深-CI-CD持续集成流水线Fastlane自动化打包与多渠道风味Flavor" },
                  { text: "39. 包体积深度优化产物瘦身代码混淆与动态资产拆包", link: "/doc/flutter/资深-包体积深度优化产物瘦身代码混淆与动态资产拆包" },
                  { text: "40. 跨平台桌面端与Web适配大屏响应式与键盘鼠标交互", link: "/doc/flutter/资深-跨平台桌面端与Web适配大屏响应式与键盘鼠标交互" },
                ],
              },
              {
                text: "五、全阶段面试通关真题库·150道硬核连环炮",
                collapsed: false,
                items: [
                  { text: "41. 初级基础50题标准对标", link: "/doc/flutter/Flutter全阶段面试通关-初级基础50题标准对标" },
                  { text: "42. 中级实战50题标准对标", link: "/doc/flutter/Flutter全阶段面试通关-中级实战50题标准对标" },
                  { text: "43. 高级资深架构50道连环炮全景通关", link: "/doc/flutter/Flutter全阶段面试通关-高级资深架构50道连环炮全景通关" },
                ],
              },
              {
                text: "六、Flutter原生通信与多媒体专题集锦",
                collapsed: true,
                items: [
                  { text: "相册多选与相机采集实战 (wechat_picker)", link: "/doc/flutter/相册多选与相机采集实战" },
                  { text: "图片缓存与大图缩放画廊实战 (photo_view+crop)", link: "/doc/flutter/图片缓存与大图缩放画廊实战" },
                  { text: "视频播放与视口滚动联播实战 (video_player)", link: "/doc/flutter/视频播放与视口滚动联播实战" },
                  { text: "端侧多媒体前置压缩流水线实战 (compress)", link: "/doc/flutter/端侧多媒体前置压缩流水线实战" },
                  { text: "EasyRefresh下拉刷新与触底分页实战", link: "/doc/flutter/EasyRefresh下拉刷新与触底分页实战" },
                  { text: "扫码识别与二维码动态生成实战 (mobile_scanner)", link: "/doc/flutter/扫码识别与二维码动态生成实战" },
                  { text: "桌面端拖拽与跨平台文件交互实战 (desktop_drop)", link: "/doc/flutter/桌面端拖拽与跨平台文件交互实战" },
                  { text: "语音识别搜图与文本转换实战 (speech_to_text)", link: "/doc/flutter/语音识别搜图与文本转换实战" },
                  { text: "Flutter热门第三方库与MVP实战", link: "/doc/flutter/Flutter热门第三方库与MVP实战" },
                  { text: "Flutter发包构建与调试命令全集", link: "/doc/flutter/Flutter发包构建与调试命令全集" },
                ],
              },
            ],
          },
          {
            text: "Uni-App",
            link: "/doc/uniapp/前言",
            collapsed: true,
            items: [
              { text: "前言：Uni-App全阶梯技术图谱与社招通关", link: "/doc/uniapp/前言" },
              {
                text: "一、初级筑基·Vue3语法、页面配置与起步",
                collapsed: true,
                items: [
                  { text: "01. 工程架构目录规范与CLI对比HBuilderX选型", link: "/doc/uniapp/初级-UniApp工程架构目录规范与CLI对比HBuilderX选型" },
                  { text: "02. 全局配置pages与manifest及分包声明", link: "/doc/uniapp/初级-全局配置文件pages与manifest核心配置与分包声明" },
                  { text: "03. 三套生命周期时序应用-页面与Vue组件生命周期", link: "/doc/uniapp/初级-三套生命周期执行全时序应用-页面与Vue组件生命周期" },
                  { text: "04. 响应式单位rpx物理计算原理与多端自适应", link: "/doc/uniapp/初级-响应式单位rpx物理计算原理与多端屏幕自适应实战" },
                  { text: "05. 核心内置基础组件view-text-image与button", link: "/doc/uniapp/初级-核心内置基础组件view-text-image与button实战" },
                  { text: "06. 表单输入组件input与textarea软键盘交互避坑", link: "/doc/uniapp/初级-表单输入组件input与textarea软键盘交互避坑" },
                  { text: "07. 滚动容器scroll-view横向纵向滚动实战", link: "/doc/uniapp/初级-滚动容器scroll-view基础用法与横向纵向滚动实战" },
                  { text: "08. 页面路由导航uni-navigateTo全系列与参数传递", link: "/doc/uniapp/初级-页面路由导航uni-navigateTo全系列跳转与参数传递" },
                  { text: "09. 网络请求uni-request基础封装与域名白名单", link: "/doc/uniapp/初级-网络请求uni-request基础封装与跨端域名白名单配置" },
                  { text: "10. 新手常见报错排查指南与多端Error根治SOP", link: "/doc/uniapp/初级-新手常见报错排查指南与多端控制台Error根治SOP" },
                ],
              },
              {
                text: "二、中级进阶·组件架构、跨端兼容与工程实战",
                collapsed: true,
                items: [
                  { text: "11. 条件编译ifdef核心语法与多端差异化代码治理", link: "/doc/uniapp/中级-条件编译ifdef核心语法与多端差异化代码治理" },
                  { text: "12. 组件通信全方案props-emit与全局事件总线uni-emit", link: "/doc/uniapp/中级-组件通信全方案props-emit与全局事件总线uni-emit" },
                  { text: "13. 状态管理Pinia在UniApp中的多端持久化适配", link: "/doc/uniapp/中级-状态管理Pinia在UniApp中的多端持久化适配实战" },
                  { text: "14. 现代化UI组件库wot-design-uni与uview-plus选型", link: "/doc/uniapp/中级-现代化UI组件库wot-design-uni与uview-plus选型集成" },
                  { text: "15. 企业级网络层luch-request拦截器与Token无感刷新", link: "/doc/uniapp/中级-企业级网络层封装luch-request拦截器与Token无感刷新" },
                  { text: "16. 本地数据持久化uni-storage异步同步选型实战", link: "/doc/uniapp/中级-本地数据持久化uni-storage与异步同步选型实战" },
                  { text: "17. 自定义顶部导航栏CustomNavBar与状态栏胶囊对齐", link: "/doc/uniapp/中级-自定义顶部导航栏CustomNavBar与状态栏胶囊对齐实战" },
                  { text: "18. 下拉刷新onPullDownRefresh与上拉触底分页封装", link: "/doc/uniapp/中级-下拉刷新onPullDownRefresh与上拉触底加载分页封装" },
                  { text: "19. 通用弹窗体系Popup-Modal与ActionSheet优雅封装", link: "/doc/uniapp/中级-通用弹窗体系Popup-Modal与ActionSheet优雅封装" },
                  { text: "20. 多端文件上传uni-uploadFile与图片选择压缩实战", link: "/doc/uniapp/中级-多端文件上传uni-uploadFile与图片选择压缩实战" },
                ],
              },
              {
                text: "三、高级深水·双线程架构、底层通信与内核",
                collapsed: true,
                items: [
                  { text: "21. 小程序双线程架构逻辑层JSCore与渲染层WebView", link: "/doc/uniapp/高级-小程序双线程架构逻辑层JSCore与渲染层WebView原理" },
                  { text: "22. setData底层序列化通信瓶颈与局部差量更新推导", link: "/doc/uniapp/高级-setData底层序列化通信瓶颈与局部差量更新推导" },
                  { text: "23. 极速视图交互wxs与renderjs零跨线程通信实战", link: "/doc/uniapp/高级-极速视图交互wxs与renderjs零跨线程通信实战" },
                  { text: "24. 无DOM环境下跨端节点查询uni-createSelectorQuery", link: "/doc/uniapp/高级-无DOM环境下跨端节点查询uni-createSelectorQuery" },
                  { text: "25. 自定义组件样式隔离styleIsolation与virtualHost", link: "/doc/uniapp/高级-自定义组件样式隔离styleIsolation与virtualHost配置" },
                  { text: "26. App原生运行时架构Weex-NVue与WebView双渲染引擎", link: "/doc/uniapp/高级-App原生运行时架构Weex-NVue与WebView双渲染引擎" },
                  { text: "27. App离线打包全流程Android-Studio与Xcode工程集成", link: "/doc/uniapp/高级-App离线打包全流程Android-Studio与Xcode原生工程集成" },
                  { text: "28. 原生插件开发机制与新一代UTS语言直译内核", link: "/doc/uniapp/高级-原生插件开发机制与新一代UTS语言直译内核" },
                  { text: "29. 跨端Canvas2D动态海报绘制与离屏光栅化导出", link: "/doc/uniapp/高级-跨端Canvas2D动态海报绘制与离屏光栅化导出" },
                  { text: "30. 多端登录鉴权状态机微信静默登录与手机号授权闭环", link: "/doc/uniapp/高级-多端登录鉴权状态机微信静默登录与手机号授权闭环" },
                ],
              },
              {
                text: "四、资深架构·分包预加载、极致调优与工程化",
                collapsed: true,
                items: [
                  { text: "31. 突破2MB主包限制subPackages分包与独立分包架构", link: "/doc/uniapp/资深-突破2MB主包限制subPackages分包与独立分包架构" },
                  { text: "32. 小程序性能极限压榨setData频率合并与虚拟列表实战", link: "/doc/uniapp/资深-小程序性能极限压榨setData频率合并与虚拟列表实战" },
                  { text: "33. 新一代渲染引擎Skyline架构适配与Worklet手势动画", link: "/doc/uniapp/资深-新一代渲染引擎Skyline架构适配与Worklet手势动画" },
                  { text: "34. 冷启动性能全链路优化代码注入懒加载与骨架屏", link: "/doc/uniapp/资深-冷启动性能全链路优化代码注入懒加载与骨架屏" },
                  { text: "35. 全渠道跨端支付架构微信-支付宝与Apple-IAP实战", link: "/doc/uniapp/资深-全渠道跨端支付架构微信-支付宝与Apple-IAP实战" },
                  { text: "36. 企业级自动化构建流水线miniprogram-ci与多租户分包", link: "/doc/uniapp/资深-企业级自动化构建流水线miniprogram-ci与多租户分包" },
                  { text: "37. APM实时日志监控wx-getRealtimeLogManager与崩溃还原", link: "/doc/uniapp/资深-APM实时日志监控wx-getRealtimeLogManager与崩溃还原" },
                  { text: "38. 多端兼容全矩阵微信-支付宝-抖音-App行为差异与抹平", link: "/doc/uniapp/资深-多端兼容全矩阵微信-支付宝-抖音-App行为差异与抹平" },
                  { text: "39. 新一代uni-app-x技术革命纯原生编译与性能飞跃", link: "/doc/uniapp/资深-新一代uni-app-x技术革命纯原生编译与性能飞跃" },
                  { text: "40. 大厂级小程序工程治理隐私协议合规与多团队协同规范", link: "/doc/uniapp/资深-大厂级小程序工程治理隐私协议合规与多团队协同规范" },
                ],
              },
              {
                text: "五、全阶段面试通关真题库·150道硬核连环炮",
                collapsed: false,
                items: [
                  { text: "41. 初级基础50题标准对标", link: "/doc/uniapp/UniApp全阶段面试通关-初级基础50题标准对标" },
                  { text: "42. 中级实战50题标准对标", link: "/doc/uniapp/UniApp全阶段面试通关-中级实战50题标准对标" },
                  { text: "43. 高级资深架构50道连环炮全景通关", link: "/doc/uniapp/UniApp全阶段面试通关-高级资深架构50道连环炮全景通关" },
                ],
              },
              {
                text: "六、Uni-App工程实战与历史专题集锦",
                collapsed: true,
                items: [
                  { text: "页面开发登录与支付基本实践", link: "/doc/uniapp/页面开发登录与支付基本实践" },
                  { text: "UniApp高频面试题与项目实战", link: "/doc/uniapp/UniApp高频面试题与项目实战" },
                  { text: "UniApp第三方库选型与实战", link: "/doc/uniapp/UniApp第三方库选型与实战" },
                  { text: "UniApp核心架构与跨端开发体系", link: "/doc/uniapp/UniApp核心架构与跨端开发体系" },
                  { text: "企业级网络封装与状态管理实战", link: "/doc/uniapp/企业级网络封装与状态管理实战" },
                  { text: "性能优化与多端避坑全景指南", link: "/doc/uniapp/性能优化与多端避坑全景指南" },
                ],
              },
            ],
          },
          {
            text: "微信小程序",
            link: "/doc/微信小程序/前言",
            collapsed: true,
            items: [
              { text: "前言：全阶段技术图谱与实战", link: "/doc/微信小程序/前言" },
              { text: "01. 双线程运行机制与 setData 性能调优 SOP", link: "/doc/微信小程序/微信小程序双线程运行机制与setData性能调优SOP" },
              { text: "02. 原生小程序基本开发与生命周期实战", link: "/doc/微信小程序/原生小程序基本开发与面试" },
              { text: "03. 登录鉴权全流程：code2Session 与手机号授权闭环", link: "/doc/微信小程序/微信小程序登录鉴权全流程code2Session与手机号一键授权闭环" },
              { text: "04. 微信支付全流程前后端闭环：JSAPI 统一下单与回调验签", link: "/doc/微信小程序/微信支付全流程前后端闭环统一下单与回调验签" },
              { text: "05. 分包加载：subpackages、独立分包与分包预下载实战", link: "/doc/微信小程序/微信小程序分包加载subpackages与独立分包及分包预下载实战" },
              { text: "06. 小程序快速部署发布与全流程上架审核", link: "/doc/微信小程序/微信小程序快速部署与上架审核" },
              { text: "07. 🎯 微信小程序社招高频核心面试 30 题全景通关", link: "/doc/微信小程序/微信小程序社招高频核心面试30题通关" },
            ],
          },
          {
            text: "浙政钉",
            link: "/doc/浙政钉/浙政钉开发上架流程",
            collapsed: true,
            items: [
              { text: "01. 浙政钉应用接入与全流程上架审核", link: "/doc/浙政钉/浙政钉开发上架流程" },
              { text: "02. 浙政钉单点登录免密鉴权与专有钉钉网关联调实战", link: "/doc/浙政钉/浙政钉单点登录免密鉴权与专有钉钉网关联调实战" },
              { text: "03. 专有前端 JSAPI 接入与真机离线调试避坑指南", link: "/doc/浙政钉/浙政钉专有前端JSAPI接入与真机离线调试避坑指南" },
            ],
          },
        ],
      },
      {
        text: "💻 Web 前端与全栈",
        items: [
          {
            text: "Vue",
            link: "/doc/Vue/前言",
            collapsed: true,
            items: [
              { text: "前言：Vue 3 阶梯全景地图", link: "/doc/Vue/前言" },
              {
                text: "一、初级筑基·核心语法与快速实战",
                collapsed: true,
                items: [
                  { text: "01. 项目初始化与SFC单文件组件结构全解", link: "/doc/Vue/初级-Vue3项目初始化与SFC单文件组件结构全解" },
                  { text: "02. 模板指令v-if与v-show物理区别及key机制", link: "/doc/Vue/初级-模板语法核心指令v-if与v-show物理区别及key机制" },
                  { text: "03. 属性与事件绑定v-bind与v-on修饰符实战", link: "/doc/Vue/初级-属性与事件绑定v-bind与v-on常用修饰符实战" },
                  { text: "04. 表单双向绑定v-model基础用法与修饰符", link: "/doc/Vue/初级-表单输入双向绑定v-model基础用法与常用修饰符" },
                  { text: "05. computed与watch及methods全方位对比", link: "/doc/Vue/初级-计算属性computed与侦听器watch及methods全方位对比" },
                  { text: "06. Vue生命周期全流程对比及资源清理避坑", link: "/doc/Vue/初级-Vue生命周期全流程Vue2与Vue3对比及资源清理避坑" },
                  { text: "07. 组件基础通信props与emit及单向数据流", link: "/doc/Vue/初级-组件基础通信props与emit及单向数据流原则" },
                  { text: "08. 插槽Slot默认/具名/作用域插槽保姆级教学", link: "/doc/Vue/初级-插槽Slot默认插槽具名插槽与作用域插槽保姆级教学" },
                  { text: "09. 模板引用ref与defineExpose暴露子组件", link: "/doc/Vue/初级-组件模板引用ref与defineExpose暴露子组件方法" },
                  { text: "10. 新手常见报错排查与控制台Warning根治", link: "/doc/Vue/初级-新手常见报错排查指南与控制台Warning根治SOP" },
                ],
              },
              {
                text: "二、中级进阶·组件架构与业务工程实战",
                collapsed: true,
                items: [
                  { text: "11. 组合式API对比选项式API与Hooks复用实战", link: "/doc/Vue/中级-组合式API对比选项式API与自定义Hooks复用实战" },
                  { text: "12. 响应式API选型ref/reactive与toRefs避坑", link: "/doc/Vue/中级-响应式核心API选型ref与reactive及toRef-toRefs避坑" },
                  { text: "13. 跨层级通信provide-inject与事件总线替代", link: "/doc/Vue/中级-跨层级组件通信provide-inject与全局事件总线替代方案" },
                  { text: "14. 动态组件与KeepAlive/Teleport/Suspense", link: "/doc/Vue/中级-动态组件与内置组件KeepAlive-Teleport-Suspense全解" },
                  { text: "15. 高级v-model多绑定与defineModel宏深度实战", link: "/doc/Vue/中级-组件高级v-model多绑定与defineModel宏深度实战" },
                  { text: "16. VueRouter4核心实战动态路由与导航守卫", link: "/doc/Vue/中级-VueRouter4核心实战动态路由参数传递与导航守卫" },
                  { text: "17. Pinia现代化状态管理核心实践对比Vuex4", link: "/doc/Vue/中级-Pinia现代化状态管理核心实践对比Vuex4" },
                  { text: "18. 异步更新与nextTick业务实战与DOM时序", link: "/doc/Vue/中级-异步更新与nextTick的业务实战与DOM更新时序" },
                  { text: "19. Axios企业级封装拦截处理与Token传递", link: "/doc/Vue/中级-Axios企业级封装请求拦截响应处理与Token传递" },
                  { text: "20. 表单组件库集成与复杂数据校验实战", link: "/doc/Vue/中级-表单组件库集成与复杂数据校验实战" },
                ],
              },
              {
                text: "三、高级深水·底层源码与Diff算法推导",
                collapsed: true,
                items: [
                  { text: "21. 响应式内核WeakMap依赖图谱与effect源码", link: "/doc/Vue/高级-Vue3响应式内核底层架构WeakMap依赖图谱与effect源码" },
                  { text: "22. Computed与Watch底层版本号演进与竞态", link: "/doc/Vue/高级-Computed与Watch底层机制版本号演进与竞态取消" },
                  { text: "23. 自定义响应式customRef与toRaw-markRaw", link: "/doc/Vue/高级-自定义响应式customRef与toRaw-markRaw防御代理" },
                  { text: "24. 编译器AST解析transform与Codegen推导", link: "/doc/Vue/高级-模板编译器AST解析transform与代码生成Codegen逐行推导" },
                  { text: "25. BlockTree靶向更新PatchFlags与静态提升", link: "/doc/Vue/高级-BlockTree靶向更新PatchFlags位掩码与静态提升优化" },
                  { text: "26. Vue3.4+新特性VaporMode无虚拟DOM剖析", link: "/doc/Vue/高级-Vue3.4+新特性VaporMode无虚拟DOM与宏展开底层剖析" },
                  { text: "27. VNode结构ShapeFlags与createRenderer", link: "/doc/Vue/高级-VNode数据结构ShapeFlags位运算与createRenderer自定义渲染器" },
                  { text: "28. Vue2双端Diff算法4指针演进推导与key作用", link: "/doc/Vue/高级-Vue2双端Diff算法4指针演进推导与key物理作用" },
                  { text: "29. Vue3快速Diff最长递增子序列LIS数学推导", link: "/doc/Vue/高级-Vue3快速Diff最长递增子序列LIS算法贪心二分数学推导" },
                  { text: "30. 组件实例化全时序setupStatefulComponent", link: "/doc/Vue/高级-组件实例化全时序setupStatefulComponent与renderEffect" },
                ],
              },
              {
                text: "四、资深架构·微前端/SSR/工程化与APM",
                collapsed: true,
                items: [
                  { text: "31. 微前端qiankun与无界Wujie双沙箱机制", link: "/doc/Vue/资深-微前端架构qiankun与无界Wujie双沙箱机制与Vue3多应用协同" },
                  { text: "32. SSR服务端渲染Nuxt3架构与Hydration水合破局", link: "/doc/Vue/资深-SSR服务端渲染Nuxt3架构renderToString与Hydration水合失败破局" },
                  { text: "33. Nuxt3同构状态useAsyncData与SSR内存泄漏", link: "/doc/Vue/资深-Nuxt3同构状态管理useAsyncData去重序列化与SSR内存泄漏四大陷阱" },
                  { text: "34. Vite按需编译esbuild预构建与HMR协议", link: "/doc/Vue/资深-Vite按需编译esbuild预构建与HMR热更新WebSocket协议" },
                  { text: "35. Rollup打包优化Tree-Shaking与分包SOP", link: "/doc/Vue/资深-Rollup打包优化Tree-Shaking物理条件与manualChunks分包SOP" },
                  { text: "36. 企业级Monorepo组件库pnpm与Changesets", link: "/doc/Vue/资深-企业级Monorepo组件库架构pnpm-workspace与Changesets" },
                  { text: "37. 内存泄露排查HeapSnapshot分析脱离DOM", link: "/doc/Vue/资深-前端内存泄露深度排查HeapSnapshot分析脱离DOM节点" },
                  { text: "38. Web-Vitals监控LCP-INP-CLS与长任务治理", link: "/doc/Vue/资深-核心性能指标Web-Vitals监控LCP-INP-CLS与长任务治理" },
                  { text: "39. 线上异常监控Sentry与SourceMap白屏治理", link: "/doc/Vue/资深-线上异常监控Sentry集成SourceMap逆向还原与白屏治理" },
                  { text: "40. 虚拟列表VirtualList动态高度与二分查找", link: "/doc/Vue/资深-虚拟列表VirtualList高性能无限滚动动态高度与二分查找" },
                ],
              },
              {
                text: "五、全阶段面试通关真题库·150道硬核连环炮",
                collapsed: false,
                items: [
                  { text: "41. 初级基础50题标准对标", link: "/doc/Vue/Vue全阶段面试通关-初级基础50题标准对标" },
                  { text: "42. 中级实战50题标准对标", link: "/doc/Vue/Vue全阶段面试通关-中级实战50题标准对标" },
                  { text: "43. 高级资深架构50道连环炮全景通关", link: "/doc/Vue/Vue全阶段面试通关-高级资深架构50道连环炮全景通关" },
                ],
              },
              {
                text: "六、前端与工程化专题集锦",
                collapsed: true,
                items: [
                  { text: "JavaScript与浏览器基础实战", link: "/doc/Vue/JavaScript与浏览器基础实战" },
                  { text: "JS模块化规范与扩展名对比(.js/.mjs/.cjs)", link: "/doc/Vue/JS模块化规范与文件扩展名深度对比-js-mjs-cjs" },
                  { text: "CSS布局与响应式实战", link: "/doc/Vue/CSS布局与响应式实战" },
                  { text: "TypeScript工程实践与类型体操", link: "/doc/Vue/TypeScript工程实践与类型体操" },
                  { text: "Vue热门生态库与工程化MVP", link: "/doc/Vue/Vue热门生态库与工程化MVP" },
                ],
              },
            ],
          },
          {
            text: "全栈高并发场景",
            link: "/doc/Fullstack/前言",
            collapsed: true,
            items: [
              { text: "前言：全栈开发与工程化地图", link: "/doc/Fullstack/前言" },
              { text: "认证、权限与接口安全基础", link: "/doc/Fullstack/登录认证权限与接口安全基础" },
              { text: "全栈开发学习路线与实战地图", link: "/doc/Fullstack/全栈开发学习路线与实战地图" },
              { text: "全栈MVP最新实现与使用场景", link: "/doc/Fullstack/全栈MVP最新实现与使用场景" },
              { text: "大前端全栈通俗心智模型与实战", link: "/doc/Fullstack/大前端全栈通俗心智模型与实战全景" },
              { text: "大文件分片上传与断点续传", link: "/doc/Fullstack/大文件分片上传与断点续传" },
              { text: "大模型SSE流式交互全栈实战", link: "/doc/Fullstack/大模型SSE流式交互全栈实战" },
              { text: "全栈Token无感刷新与双Token架构生产实战", link: "/doc/Fullstack/全栈Token无感刷新与双Token架构生产实战" },
              { text: "接口防刷与全栈安全攻防实战", link: "/doc/Fullstack/接口防刷与全栈安全攻防实战" },
            ],
          },
        ],
      },
      {
        text: "☕ 后端与数据存储",
        items: [
          {
            text: "Java后端",
            link: "/doc/Java/前言",
            collapsed: true,
            items: [
              { text: "学习地图（社招硬核进阶）", link: "/doc/Java/后端学习地图" },
              { text: "前言与模块边界", link: "/doc/Java/前言" },
              { text: "可运行的后端练习项目", link: "/examples/java-backend-workshop/README" },
              {
                text: "一、Java 语言深水区核心原理",
                collapsed: true,
                items: [
                  { text: "String与常量池底层机制", link: "/doc/Java/String深入与字符串常量池底层机制" },
                  { text: "Java泛型机制与类型擦除深挖", link: "/doc/Java/Java泛型机制与类型擦除深挖" },
                  { text: "反射底层原理与性能损耗深度分析", link: "/doc/Java/反射机制底层原理与性能损耗深度分析" },
                  { text: "动态代理深度对比: JDK Proxy与CGLIB", link: "/doc/Java/动态代理深度对比JDK-Proxy与CGLIB" },
                  { text: "SPI机制底层原理与开源演进", link: "/doc/Java/SPI机制底层原理与在开源框架中的演进" },
                  { text: "异常体系语法糖与try-with-resources", link: "/doc/Java/Java异常体系语法糖底层与try-with-resources" },
                  { text: "Java IO演进: 从传统BIO到NIO核心组件", link: "/doc/Java/Java-IO演进从传统BIO到NIO三大核心组件" },
                  { text: "JDK 17~21 长期支持版新特性与虚拟线程全解", link: "/doc/Java/JDK17-21新特性与虚拟线程全解" },
                ],
              },
              {
                text: "二、Java 容器集合源码终极大解剖",
                collapsed: true,
                items: [
                  { text: "ArrayList与CopyOnWriteArrayList源码剖析", link: "/doc/Java/ArrayList与CopyOnWriteArrayList源码剖析" },
                  { text: "HashMap 1.8源码解剖: 结构演进与Hash算法", link: "/doc/Java/HashMap-1.8源码终极大解剖-结构演进与Hash算法" },
                  { text: "HashMap 1.8源码解剖: put树化与扩容机制", link: "/doc/Java/HashMap-1.8源码终极大解剖-put流程树化与扩容" },
                  { text: "ConcurrentHashMap: 1.7与1.8架构演进", link: "/doc/Java/ConcurrentHashMap-1.7与1.8架构演进与并发控制" },
                  { text: "LinkedHashMap与TreeMap底层原理", link: "/doc/Java/LinkedHashMap与TreeMap底层原理" },
                ],
              },
              {
                text: "三、JMM 并发编程与锁机制深度剖析",
                collapsed: true,
                items: [
                  { text: "JMM内存模型与Happens-Before原则", link: "/doc/Java/JMM内存模型与Happens-Before原则深度解析" },
                  { text: "volatile底层原理与内存屏障汇编分析", link: "/doc/Java/volatile关键字底层原理与内存屏障汇编分析" },
                  { text: "CAS机制与无锁并发Unsafe/LongAdder", link: "/doc/Java/CAS机制与无锁并发编程Unsafe与LongAdder" },
                  { text: "synchronized锁与MarkWord锁升级全过程", link: "/doc/Java/synchronized锁与对象头MarkWord锁升级全过程" },
                  { text: "AQS核心架构设计与源码深度逐行解析", link: "/doc/Java/AQS核心架构设计与源码深度逐行解析" },
                  { text: "JUC核心并发锁与同步工具实战", link: "/doc/Java/JUC核心并发锁与同步工具实战" },
                ],
              },
              {
                text: "四、高并发线程池与异步编排实战",
                collapsed: true,
                items: [
                  { text: "ThreadLocal核心原理内存泄漏与TTL透传", link: "/doc/Java/ThreadLocal核心原理内存泄漏与全链路透传TTL" },
                  { text: "ThreadPoolExecutor源码与动态调优实战", link: "/doc/Java/ThreadPoolExecutor线程池底层源码与动态调优实战" },
                  { text: "CompletableFuture异步编排实战", link: "/doc/Java/CompletableFuture异步编排实战与并发吞吐量提升" },
                ],
              },
              {
                text: "五、JVM 虚拟机内存模型与生产级性能调优",
                collapsed: true,
                items: [
                  { text: "JVM内存区域划分与对象创建生命周期", link: "/doc/Java/JVM内存区域划分与对象创建生命周期" },
                  { text: "类加载机制与破坏双亲委派3大场景", link: "/doc/Java/类加载机制与破坏双亲委派3大经典场景" },
                  { text: "现代垃圾收集器深度: G1与ZGC核心解析", link: "/doc/Java/现代垃圾收集器深度G1与ZGC核心原理解析" },
                  { text: "JVM核心性能调优参数与GC日志分析", link: "/doc/Java/JVM核心性能调优参数与GC日志分析" },
                  { text: "线上CPU 100%与OOM疑难排查及Arthas实战", link: "/doc/Java/线上CPU-100与OOM疑难故障排查与Arthas实战" },
                ],
              },
              {
                text: "六、高性能网络通信与 Netty 核心剖析",
                collapsed: true,
                items: [
                  { text: "IO多路复用模型与epoll底层工作机制", link: "/doc/Java/IO多路复用模型与epoll底层工作机制" },
                  { text: "Reactor反应堆线程模型与Netty核心架构", link: "/doc/Java/Reactor反应堆线程模型与Netty核心架构" },
                  { text: "ByteBuf内存分配与Netty零拷贝机制全景", link: "/doc/Java/ByteBuf内存分配与Netty零拷贝机制全景" },
                  { text: "Netty网络编解码粘包拆包与心跳检测实战", link: "/doc/Java/Netty网络编解码粘包拆包与心跳检测实战" },
                ],
              },
              {
                text: "七、Spring 全家桶与 MyBatis 框架底层解剖",
                collapsed: true,
                items: [
                  { text: "Spring IoC启动流程与Bean完整生命周期", link: "/doc/Java/Spring-IoC容器启动流程与Bean完整生命周期" },
                  { text: "Spring循环依赖与三级缓存终极推导", link: "/doc/Java/Spring循环依赖与三级缓存终极推导" },
                  { text: "Spring AOP原理与方法内部自调用失效全解", link: "/doc/Java/Spring-AOP原理与方法内部自调用失效全解" },
                  { text: "Spring声明式事务传播机制与12种失效场景", link: "/doc/Java/Spring声明式事务传播机制与12种失效场景排查" },
                  { text: "SpringBoot自动装配原理与自定义Starter实战", link: "/doc/Java/SpringBoot自动装配原理与自定义Starter实战" },
                  { text: "MyBatis核心架构SQL映射与插件拦截器实战", link: "/doc/Java/MyBatis核心架构SQL映射与插件拦截器实战" },
                  { text: "MyBatis-Plus核心增强与企业级技术选型", link: "/doc/Java/MyBatis/MyBatis-Plus核心使用与技术选型对比" },
                  { text: "MyBatis缓存机制与SQL注入防范", link: "/doc/Java/MyBatis/MyBatis缓存机制与SQL注入防范" },
                  { text: "SQL与MyBatis高级映射实战全景对照", link: "/doc/Java/MyBatis/SQL与MyBatis映射实战全景对照" },
                ],
              },
              {
                text: "八、分布式系统、微服务治理与中间件",
                collapsed: true,
                items: [
                  { text: "微服务核心组件架构与技术选型对比", link: "/doc/Java/微服务核心组件架构与技术选型对比" },
                  { text: "SpringCloud微服务全家桶核心架构实战", link: "/doc/Java/Spring/SpringCloud微服务核心组件与架构实战" },
                  { text: "Dubbo分布式RPC核心原理与生产实战", link: "/doc/Java/Dubbo分布式RPC核心原理与实战" },
                  { text: "分布式事务Seata核心原理与AT/TCC模式实战", link: "/doc/Java/分布式事务Seata核心原理与AT-TCC模式深度实战" },
                  { text: "分布式定时任务调度XXL-Job核心实战", link: "/doc/Java/分布式定时任务与调度框架实战" },
                  { text: "Redis核心原理高并发三大难题与双写一致性", link: "/doc/Java/Redis核心原理高并发三大难题与双写一致性" },
                  { text: "Redis大Key热Key排查与集群高可用治理", link: "/doc/Java/Redis大Key热Key与集群治理实战" },
                  { text: "Kafka与RocketMQ高可靠投递与积压治理", link: "/doc/Java/Kafka与RocketMQ生产级高可靠投递与积压治理" },
                  { text: "Kafka与RocketMQ生产级接入实战全景", link: "/doc/Java/Kafka与RocketMQ生产级接入实战" },
                  { text: "常用中间件核心原理与选型速查地图", link: "/doc/Java/常用中间件核心原理与选型速查" },
                ],
              },
              {
                text: "九、高并发系统设计与社招实战",
                collapsed: false,
                items: [
                  { text: "高并发秒杀系统全链路设计与社招40道硬核连环炮", link: "/doc/Java/高并发秒杀系统全链路设计与社招40道硬核连环炮" },
                  { text: "高并发大数据与线上疑难故障排查", link: "/doc/Java/高并发大数据与线上疑难故障排查实战" },
                  { text: "Java后端与分布式高频硬核考点全解", link: "/doc/Java/Java后端与分布式高频硬核考点全解" },
                  { text: "后端核心避坑与生产实战全解", link: "/doc/Java/后端核心避坑与生产实战全解" },
                ],
              },
            ],
          },
          {
            text: "MySQL",
            link: "/doc/MySQL/前言",
            collapsed: true,
            items: [
              { text: "前言：MySQL 阶梯全景地图", link: "/doc/MySQL/前言" },
              {
                text: "一、初级筑基·核心语法与快速实战",
                collapsed: true,
                items: [
                  { text: "01. MySQL架构全景客户端连接与核心配置精讲", link: "/doc/MySQL/初级-MySQL架构全景客户端连接与核心配置精讲" },
                  { text: "02. SQL语言分类DDL-DML-DQL-DCL与语法规则", link: "/doc/MySQL/初级-SQL语言分类DDL-DML-DQL-DCL与基础语法规则" },
                  { text: "03. 核心数据类型选用规范数值/字符/日期/JSON", link: "/doc/MySQL/初级-核心数据类型选用规范数值-字符串-日期时间与JSON" },
                  { text: "04. 表完整性约束主键/外键/唯一/非空与默认值", link: "/doc/MySQL/初级-表完整性约束主键-外键-唯一-非空与默认值实战" },
                  { text: "05. 单表基础查询WHERE/ORDER/LIMIT与运算符", link: "/doc/MySQL/初级-单表基础查询与条件过滤WHERE-ORDER-LIMIT与运算符" },
                  { text: "06. 分组查询GROUP BY与HAVING及ONLY_FULL_GROUP_BY", link: "/doc/MySQL/初级-分组查询GROUP-BY与聚合函数HAVING及ONLY_FULL_GROUP_BY避坑" },
                  { text: "07. 常用内置函数字符串/日期运算与条件控制", link: "/doc/MySQL/初级-常用内置函数实战字符串处理-日期时间计算与条件控制" },
                  { text: "08. 基础多表连接查询INNER/LEFT/RIGHT与笛卡尔积", link: "/doc/MySQL/初级-基础多表连接查询INNER-LEFT-RIGHT与笛卡尔积避坑" },
                  { text: "09. 数据库事务入门与手动提交回滚COMMIT/ROLLBACK", link: "/doc/MySQL/初级-数据库事务入门与手动提交回滚COMMIT-ROLLBACK" },
                  { text: "10. 新手常见报错排查指南与高频Error根治SOP", link: "/doc/MySQL/初级-新手常见报错排查指南与高频Error根治SOP" },
                ],
              },
              {
                text: "二、中级进阶·索引实战与查询优化",
                collapsed: true,
                items: [
                  { text: "11. SQL执行原理与逻辑执行顺序全解", link: "/doc/MySQL/SQL执行原理与逻辑执行顺序全解" },
                  { text: "12. 多表关联查询内幕与JOIN优化", link: "/doc/MySQL/多表关联查询内幕与JOIN优化" },
                  { text: "13. 索引分类物理组织与查询加速机制", link: "/doc/MySQL/索引分类物理组织与查询加速机制" },
                  { text: "14. B+树索引结构演进与千万级容量推导计算", link: "/doc/MySQL/B+树索引结构演进与千万级容量推导计算" },
                  { text: "15. MySQL索引失效与优化实战", link: "/doc/MySQL/MySQL索引失效与优化实战" },
                  { text: "16. EXPLAIN执行计划各字段深度拆解", link: "/doc/MySQL/EXPLAIN执行计划各字段深度拆解" },
                  { text: "17. 慢查询日志捕获与优化器追踪optimizer_trace", link: "/doc/MySQL/慢查询日志捕获与优化器追踪optimizer_trace" },
                  { text: "18. 千万级数据深度分页优化与COUNT终极对比", link: "/doc/MySQL/千万级数据深度分页优化与COUNT终极对比" },
                  { text: "19. 字符集与排序规则实战避坑", link: "/doc/MySQL/字符集与排序规则实战避坑" },
                  { text: "20. 高并发大字段建表规范与生产场景", link: "/doc/MySQL/高并发大字段建表规范与生产场景" },
                ],
              },
              {
                text: "三、高级深水·底层存储、事务与锁机制",
                collapsed: true,
                items: [
                  { text: "21. InnoDB逻辑存储结构与页结构深度剖析", link: "/doc/MySQL/InnoDB逻辑存储结构与页结构深度剖析" },
                  { text: "22. InnoDB行格式与溢出页机制", link: "/doc/MySQL/InnoDB行格式与溢出页机制" },
                  { text: "23. 事务ACID四大特性的底层实现机制", link: "/doc/MySQL/事务ACID四大特性的底层实现机制" },
                  { text: "24. 并发事务问题与四大隔离级别实现差异", link: "/doc/MySQL/并发事务问题与四大隔离级别实现差异" },
                  { text: "25. MySQL事务隔离与MVCC原理", link: "/doc/MySQL/MySQL事务隔离与MVCC原理" },
                  { text: "26. BufferPool缓冲池核心原理与冷热LRU", link: "/doc/MySQL/BufferPool缓冲池核心原理与冷热LRU" },
                  { text: "27. redo log/binlog与两阶段提交Crash-Safe机制", link: "/doc/MySQL/redolog-binlog与两阶段提交Crash-Safe机制" },
                  { text: "28. 全局锁表级锁与元数据锁MDL", link: "/doc/MySQL/全局锁表级锁与元数据锁MDL" },
                  { text: "29. 行锁分类记录锁间隙锁与Next-KeyLock", link: "/doc/MySQL/行锁分类记录锁间隙锁与Next-KeyLock" },
                  { text: "30. 死锁的本质排查与防范实战", link: "/doc/MySQL/死锁的本质排查与防范实战" },
                ],
              },
              {
                text: "四、资深架构·高可用集群与海量分库分表",
                collapsed: true,
                items: [
                  { text: "31. MySQL主从复制原理与主从延迟6大破局方案", link: "/doc/MySQL/MySQL主从复制底层原理与主从延迟6大破局方案" },
                  { text: "32. 资深-高可用复制Orchestrator与组复制MGR选型", link: "/doc/MySQL/资深-高可用复制架构Orchestrator与组复制MGR选型实战" },
                  { text: "33. 分库分表架构设计与ShardingSphere核心实战", link: "/doc/MySQL/分库分表架构设计与ShardingSphere核心实战" },
                  { text: "34. 资深-分库分表分布式事务Seata与Saga柔性落地", link: "/doc/MySQL/资深-分库分表分布式事务Seata与Saga及柔性事务落地" },
                  { text: "35. 大表无锁DDL工具与生产备份恢复SOP", link: "/doc/MySQL/大表无锁DDL工具与生产备份恢复SOP" },
                  { text: "36. 资深-高性能数据库连接池HikariCP核心调优", link: "/doc/MySQL/资深-高性能数据库连接池HikariCP核心原理与生产调优" },
                  { text: "37. 资深-高并发读写分离架构与主从数据一致性方案", link: "/doc/MySQL/资深-高并发读写分离架构与主从数据一致性解决方案" },
                  { text: "38. 资深-MySQL8.0新特性窗口函数/CTE与即时DDL", link: "/doc/MySQL/资深-MySQL8.0新特性革命窗口函数-CTE与即时DDL" },
                  { text: "39. 资深-生产级APM性能监控大盘与慢SQL治理体系", link: "/doc/MySQL/资深-生产级APM性能监控大盘与慢SQL自动化治理体系" },
                  { text: "40. 备份恢复与数据库变更实践", link: "/doc/MySQL/备份恢复与数据库变更实践" },
                ],
              },
              {
                text: "五、全阶段面试通关真题库·150道硬核连环炮",
                collapsed: false,
                items: [
                  { text: "41. 初级基础50题标准对标", link: "/doc/MySQL/MySQL全阶段面试通关-初级基础50题标准对标" },
                  { text: "42. 中级实战50题标准对标", link: "/doc/MySQL/MySQL全阶段面试通关-中级实战50题标准对标" },
                  { text: "43. 高级资深架构50道连环炮全景通关", link: "/doc/MySQL/MySQL全阶段面试通关-高级资深架构50道连环炮全景通关" },
                ],
              },
              {
                text: "六、MySQL存量实战与历史专题集锦",
                collapsed: true,
                items: [
                  { text: "附01. MySQL基础语句与多表关联查询深度", link: "/doc/MySQL/MySQL基础语句与多表关联查询深度" },
                  { text: "附02. SQL编写与生产维护实战", link: "/doc/MySQL/SQL编写与生产维护实战" },
                  { text: "附03. 生产级SQL开发技巧与真实场景实战", link: "/doc/MySQL/生产级SQL开发技巧与真实场景实战" },
                  { text: "附04. MySQL主从复制与读写分离实战", link: "/doc/MySQL/MySQL主从复制与读写分离实战" },
                  { text: "附05. MySQL底层原理日志体系与BufferPool", link: "/doc/MySQL/MySQL底层原理日志体系与BufferPool" },
                  { text: "附06. Next-KeyLock全场景加锁规则深度判定", link: "/doc/MySQL/Next-KeyLock全场景加锁规则深度判定" },
                ],
              },
            ],
          },
        ],
      },
      {
        text: "🚀 网络与运维工程化",
        items: [
          {
            text: "全栈运维与中间件实战",
            link: "/doc/DevOps/前言",
            collapsed: false,
            items: [
              { text: "前言：全栈运维与中间件地图", link: "/doc/DevOps/前言" },
              {
                text: "一、Linux 命令行与服务器排障实战",
                collapsed: true,
                items: [
                  { text: "01. 文件目录权限管理与SSH免密登录全解", link: "/doc/DevOps/Linux-文件目录权限管理与SSH免密登录全解" },
                  { text: "02. 文本三剑客grep/awk/sed日志过滤实战", link: "/doc/DevOps/Linux-文本三剑客grep-awk-sed生产日志过滤实战" },
                  { text: "03. 系统监控top/htop/free/df/iostat性能分析", link: "/doc/DevOps/Linux-系统监控top-htop-free-df-iostat性能分析" },
                  { text: "04. 网络排障netstat/ss/lsof/curl网络调试", link: "/doc/DevOps/Linux-网络排障netstat-ss-lsof-curl网络调试" },
                  { text: "05. 进程管理nohup/tmux与Systemd服务守护实战", link: "/doc/DevOps/Linux-进程管理nohup-tmux与Systemd服务守护实战" },
                ],
              },
              {
                text: "二、Nginx 高性能网关与反向代理实战",
                collapsed: true,
                items: [
                  { text: "06. Nginx核心配置结构与location匹配优先级", link: "/doc/DevOps/Nginx-核心配置结构与location路径匹配优先级" },
                  { text: "07. 前端SPA托管try_files防404与静态缓存", link: "/doc/DevOps/Nginx-前端SPA托管try_files防404与静态缓存" },
                  { text: "08. 反向代理proxy_pass路径截断与跨域CORS", link: "/doc/DevOps/Nginx-反向代理proxy_pass路径截断与跨域CORS" },
                  { text: "09. 负载均衡upstream算法与高可用配置", link: "/doc/DevOps/Nginx-负载均衡upstream算法与高可用配置" },
                  { text: "10. SSL证书自动化Let's-Encrypt与限流防刷", link: "/doc/DevOps/Nginx-SSL证书自动化Let's-Encrypt与限流防刷" },
                ],
              },
              {
                text: "三、Docker 容器与全栈编排工程化",
                collapsed: true,
                items: [
                  { text: "11. Docker核心架构镜像容器操作与命令速查", link: "/doc/DevOps/Docker-核心架构镜像容器操作与常用命令速查" },
                  { text: "12. 生产级Dockerfile编写规范与多阶段瘦身", link: "/doc/DevOps/Docker-生产级Dockerfile编写规范与多阶段瘦身" },
                  { text: "13. 数据卷Volume持久化与自定义网络通信", link: "/doc/DevOps/Docker-数据卷Volume持久化与自定义网络通信" },
                  { text: "14. Docker-Compose全栈一键编排前后端与数据库", link: "/doc/DevOps/Docker-Compose全栈一键编排前后端与数据库" },
                  { text: "附: Docker容器化与CI/CD自动化部署实战", link: "/doc/DevOps/Docker容器化与CICD自动化部署实战" },
                ],
              },
              {
                text: "四、全栈核心中间件私有化与容器化运维",
                collapsed: true,
                items: [
                  { text: "15. 🌟 MySQL Docker容器化运维与自动备份", link: "/doc/DevOps/MySQL-Docker容器化运维数据持久化与自动备份" },
                  { text: "16. 🌟 MinIO高性能对象存储私有化与S3直传", link: "/doc/DevOps/MinIO-高性能对象存储私有化搭建与全栈S3直传" },
                  { text: "17. Redis生产级容器化运维持久化与安全加固", link: "/doc/DevOps/Redis-生产级容器化运维持久化落盘与安全加固" },
                  { text: "18. PM2全栈Node进程守护集群模式与日志管理", link: "/doc/DevOps/PM2-全栈Node进程守护集群模式与日志管理" },
                ],
              },
              {
                text: "五、全栈突发排障与性能监控 SOP",
                collapsed: true,
                items: [
                  { text: "19. 全栈排障SOP: CPU飙升100/磁盘打爆与502-504根治", link: "/doc/DevOps/全栈排障SOP-CPU飙升100磁盘打爆与502-504根治" },
                  { text: "20. 生产级容器日志治理滚动轮转与防爆盘实战", link: "/doc/DevOps/生产级容器日志治理滚动轮转与防爆盘实战" },
                ],
              },
              {
                text: "六、Kubernetes 生产级容器编排架构 (进阶专栏)",
                collapsed: true,
                items: [
                  { text: "① 架构全景与核心对象", link: "/doc/DevOps/K8s生产级容器编排与核心架构全解" },
                  { text: "② 工作负载与发布策略", link: "/doc/DevOps/K8s工作负载与发布策略实战" },
                  { text: "③ 网络与存储体系", link: "/doc/DevOps/K8s网络与存储体系全解" },
                  { text: "④ 生产治理与故障排查", link: "/doc/DevOps/K8s生产治理与故障排查" },
                ],
              },
            ],
          },
          {
            text: "网络与通信协议全解",
            link: "/doc/Network/前言",
            collapsed: true,
            items: [
              { text: "前言：网络与通信协议全景地图", link: "/doc/Network/前言" },
              { text: "01. HTTP 与 DNS 基本使用及排错实战", link: "/doc/Network/HTTP与DNS基本使用及排错" },
              { text: "02. 计算机网络与核心通信协议全解", link: "/doc/Network/计算机网络与核心通信协议全解" },
              { text: "03. TCP 三次握手、四次挥手状态机与 TIME_WAIT 根治全解", link: "/doc/Network/TCP三次握手四次挥手状态机与TIME_WAIT根治全解" },
              { text: "04. HTTPS 加密原理：TLS 握手全时序与数字证书链解密", link: "/doc/Network/HTTPS加密原理TLS握手全时序与数字证书链解密" },
              { text: "05. WebSocket 与 SSE 全双工通信与心跳重连高并发实战", link: "/doc/Network/WebSocket与SSE全双工实时通信与心跳重连高并发实战" },
              { text: "06. 🎯 计算机网络与通信协议大厂社招高频硬核 30 道连环炮", link: "/doc/Network/计算机网络与通信协议大厂社招高频硬核30道连环炮" },
            ],
          },
        ],
      },
      {
        text: "🧩 系统设计与场景题",
        items: [
          {
            text: "系统设计专题（按序阅读）",
            link: "/doc/SystemDesign/前言",
            collapsed: false,
            items: [
              { text: "前言：四步答题框架与容量估算", link: "/doc/SystemDesign/前言" },
              { text: "系统设计与可靠性基本实践", link: "/doc/SystemDesign/系统设计基本方法与可靠性实践" },
              { text: "① 高并发秒杀全链路设计", link: "/doc/SystemDesign/高并发秒杀系统全链路设计" },
              { text: "② 限流算法与分布式限流", link: "/doc/SystemDesign/限流算法与分布式限流实战" },
              { text: "③ 幂等性设计与重复请求治理", link: "/doc/SystemDesign/幂等性设计与重复请求治理" },
              { text: "④ 分布式锁与 Redisson 源码", link: "/doc/SystemDesign/分布式锁与Redisson源码全解" },
              { text: "⑤ 分库分表与全局主键设计", link: "/doc/SystemDesign/分库分表与全局主键设计" },
              { text: "⑥ 分布式全局唯一ID：Snowflake雪花算法与时钟回拨治理", link: "/doc/SystemDesign/分布式全局唯一ID生成方案Snowflake雪花算法与时钟回拨治理" },
              { text: "⑦ 海量数据处理：布隆过滤器BloomFilter与Top-K统计", link: "/doc/SystemDesign/海量数据处理架构布隆过滤器BloomFilter与Top-K高频统计" },
            ],
          },
        ],
      },
      {
        text: "🤖 前沿探索与极客生态",
        items: [
          {
            text: "AI 原生与大模型工程架构",
            link: "/doc/AI/前言",
            collapsed: false,
            items: [
              { text: "前言：全阶段技术图谱与学习路线", link: "/doc/AI/前言" },
              {
                text: "一、初级筑基·模型调用、Prompt工程与确定性工作流实战",
                collapsed: true,
                items: [
                  { text: "01. 模型调用基础、Token 机制与评测指标规范", link: "/doc/AI/模型调用RAG与评测基础" },
                  { text: "02. 真实项目：家庭云相册「时光寻忆」确定性工作流 Agent 落地实战", link: "/doc/AI/结构化工作流编排型Agent落地实战-家庭云相册时光寻忆" },
                ],
              },
              {
                text: "二、中级进阶·自主决策Agent体系、状态机与工业全家桶",
                collapsed: true,
                items: [
                  { text: "03. 自主决策 Agent 体系：ReAct 循环、Tool Calling 原理与生产级选型思辨", link: "/doc/AI/自主决策Agent体系-ReAct与ToolCalling原理解析" },
                  { text: "04. 现代 AI 工程全家桶实战：LangChain + LangGraph + LlamaIndex + Qdrant", link: "/doc/AI/大模型技术栈LangChain-LangGraph-LlamaIndex-Qdrant实战" },
                ],
              },
              {
                text: "三、高级深水·工业级RAG检索增强、意图路由与状态闭环",
                collapsed: true,
                items: [
                  { text: "05. 现代工业级 RAG 全生命周期体系：从 Naive RAG 到高级多路检索与评测", link: "/doc/AI/现代工业级RAG全生命周期体系" },
                  { text: "06. AI 模块文档意图识别与多级级联动态路由架构", link: "/doc/AI/AI模块文档意图识别与动态路由" },
                ],
              },
              {
                text: "四、资深架构·开放协议生态(MCP)与极客智能体工具链",
                collapsed: true,
                items: [
                  { text: "07. MCP（Model Context Protocol）模型上下文协议：原理、生态与开发实战", link: "/doc/AI/MCP模型上下文协议与开发实战" },
                  { text: "08. VibeCoding 与 Agent 生态工具实战：Stitch、Superpowers、Trellis 与 UI-UX-Pro-Max", link: "/doc/AI/VibeCoding与MCP生态实战-Stitch-Superpowers-Trellis与UIUXProMax" },
                ],
              },
              {
                text: "五、全阶段通关真题库·大厂AI工程化高频面试硬核连环炮",
                collapsed: false,
                items: [
                  { text: "09. 🎯 大厂 AI 工程化高频面试攻防与系统设计 12 连环炮全景通关", link: "/doc/AI/大厂AI工程化高频面试攻防与系统设计" },
                ],
              },
            ],
          },
          {
            text: "社区与资源",
            link: "/doc/社区资源/第三方论坛与技术社区导航",
            collapsed: true,
            items: [
              { text: "资料验证与学习方法", link: "/doc/社区资源/技术资料验证与学习方法" },
              { text: "第三方论坛与技术社区导航", link: "/doc/社区资源/第三方论坛与技术社区导航" },
            ],
          },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/Iamdog/limin-Face-Doc" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026-present Li Min",
    },
  },
  lastUpdated: true,

  // 宽图按原始尺寸渲染，容器提供横向滚动，避免 Mermaid 把 14px 字体缩到 5px
  head: [
    [
      "style",
      {},
      ".mermaid{overflow-x:auto;overflow-y:hidden;padding:4px 0}.mermaid svg{max-width:none!important;height:auto!important}.mermaid::-webkit-scrollbar{height:8px}.mermaid::-webkit-scrollbar-track{background:#f4f5fb}.mermaid::-webkit-scrollbar-thumb{background:#c9cbe8;border-radius:4px}",
    ],
  ],

  // 全站 Mermaid 架构图渲染配置（浅色主题，中文友好）
  mermaid: {
    securityLevel: "loose", // 允许标签内 <br/> 换行，文档内容全部自控
    // 用原生 SVG text 渲染节点文字，避免 foreignObject 裁切 <br/> 第二行
    htmlLabels: false,
    theme: "default",
    themeVariables: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      primaryColor: "#eef0ff",
      primaryBorderColor: "#1d1e70",
      primaryTextColor: "#1f2340",
      lineColor: "#5b5fa8",
      fontSize: "14px",
    },
    flowchart: { useMaxWidth: false, curve: "basis" },
    sequence: { useMaxWidth: false },
    state: { useMaxWidth: false },
  },
});
