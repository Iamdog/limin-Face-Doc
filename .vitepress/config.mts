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
          { text: "Android", link: "/doc/Android/前言" },
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
          { text: "知识库检查与分层学习地图", link: "/doc/知识库检查与分层学习地图" },
          { text: "逐篇检查清单", link: "/doc/专题逐篇检查清单" },
          { text: "数据结构与算法实践", link: "/doc/基础能力/数据结构算法与面试实践" },
          { text: "测试设计与工程交付", link: "/doc/基础能力/测试设计与工程交付" },
        ],
      },
      {
        text: "📱 移动端与跨端",
        items: [
          {
            text: "Android",
            link: "/doc/Android/前言",
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/Android/前言" },
              { text: "应用基本开发与验证", link: "/doc/Android/Android应用基本开发与验证" },
              {
                text: "UI组件与视图体系",
                collapsed: false,
                items: [
                  { text: "Activity", link: "/doc/Android/四大组件之Activity" },
                  { text: "Fragment", link: "/doc/Android/Fragment" },
                  { text: "Service", link: "/doc/Android/四大组件之Service" },
                  { text: "BroadcastReceiver", link: "/doc/Android/四大组件之BroadcastReceiver" },
                  { text: "ContentProvider", link: "/doc/Android/四大组件之ContentProvider" },
                  { text: "UI布局方式", link: "/doc/Android/布局方式" },
                  { text: "Window与DecorView", link: "/doc/Android/Window与DecorView" },
                  { text: "View事件分发", link: "/doc/Android/View事件分发" },
                  { text: "自定义View", link: "/doc/Android/自定义View" },
                  { text: "动画体系", link: "/doc/Android/动画体系" },
                  { text: "触摸滑动冲突实战", link: "/doc/Android/触摸滑动冲突实战" },
                ],
              },
              {
                text: "Kotlin语言与异步并发",
                collapsed: false,
                items: [
                  { text: "Kotlin语言使用与面试学习路线", link: "/doc/Android/Kotlin语言使用与面试学习路线" },
                  { text: "Kotlin语言基础与日常开发", link: "/doc/Android/Kotlin语言基础与日常开发" },
                  { text: "Kotlin面向对象、泛型与委托", link: "/doc/Android/Kotlin面向对象泛型与委托详解" },
                  { text: "Kotlin集合、函数式与DSL", link: "/doc/Android/Kotlin集合函数式与DSL实战" },
                  { text: "Kotlin与Java互操作实战", link: "/doc/Android/Kotlin与Java互操作实战" },
                  { text: "协程与Flow实战", link: "/doc/Android/协程与Flow实战" },
                  { text: "Kotlin核心机制与高频实战解析", link: "/doc/Android/Kotlin核心机制与高频实战解析" },
                  { text: "Kotlin高频面试题与代码练习", link: "/doc/Android/Kotlin高频面试题与代码练习" },
                  { text: "多线程", link: "/doc/Android/多线程" },
                  { text: "线程池调优实战", link: "/doc/Android/线程池调优实战" },
                ],
              },
              {
                text: "核心机制与列表组件",
                collapsed: false,
                items: [
                  { text: "RecyclerView", link: "/doc/Android/RecyclerView" },
                  { text: "RecyclerView源码与缓存深挖", link: "/doc/Android/RecyclerView源码与缓存深挖" },
                  { text: "Handler消息机制", link: "/doc/Android/Handler消息机制" },
                  { text: "HandlerThread-IntentService-WorkManager对比", link: "/doc/Android/HandlerThread-IntentService-WorkManager对比" },
                  { text: "Binder机制", link: "/doc/Android/Binder机制" },
                  { text: "AMS-WMS-PMS", link: "/doc/Android/AMS-WMS-PMS" },
                ],
              },
              {
                text: "现代架构与Jetpack/Compose",
                collapsed: false,
                items: [
                  { text: "开发架构演变", link: "/doc/Android/开发架构演变" },
                  { text: "Jetpack之ViewModel与LiveData", link: "/doc/Android/Jetpack之ViewModel与LiveData" },
                  { text: "Jetpack之Room", link: "/doc/Android/Jetpack之Room" },
                  { text: "Compose基础与核心要点", link: "/doc/Android/Compose基础与核心要点" },
                  { text: "Compose底层原理与深度实战", link: "/doc/Android/Compose底层原理与深度实战" },
                  { text: "Compose与Flutter声明式UI布局与优化全景", link: "/doc/Android/Compose与Flutter声明式UI布局与性能优化全景指南" },
                ],
              },
              {
                text: "网络通信与数据持久化",
                collapsed: false,
                items: [
                  { text: "网络框架Retrofit-OkHttp", link: "/doc/Android/网络框架Retrofit-OkHttp" },
                  { text: "网络安全与HTTPS", link: "/doc/Android/网络安全与HTTPS" },
                  { text: "SharedPreferences-DataStore-MMKV", link: "/doc/Android/SharedPreferences-DataStore-MMKV" },
                  { text: "缓存", link: "/doc/Android/缓存" },
                  { text: "Bitmap与图片加载", link: "/doc/Android/Bitmap与图片加载" },
                ],
              },
              {
                text: "性能优化与稳定性治理",
                collapsed: false,
                items: [
                  { text: "性能优化", link: "/doc/Android/性能优化" },
                  { text: "启动流程与冷启动", link: "/doc/Android/启动流程与冷启动" },
                  { text: "启动优化任务编排实战", link: "/doc/Android/启动优化任务编排实战" },
                  { text: "内存泄漏", link: "/doc/Android/内存泄漏" },
                  { text: "OOM专题", link: "/doc/Android/OOM专题" },
                  { text: "ANR专题", link: "/doc/Android/ANR专题" },
                  { text: "崩溃治理专题", link: "/doc/Android/崩溃治理专题" },
                ],
              },
              {
                text: "底层开发与工程打包",
                collapsed: false,
                items: [
                  { text: "AIDL实战", link: "/doc/Android/AIDL实战" },
                  { text: "JNI与NDK", link: "/doc/Android/JNI与NDK" },
                  { text: "⚠️ 16KB 页面大小兼容影响与治理全解", link: "/doc/Android/Android16KB页面大小兼容影响与治理全解" },
                  { text: "APK打包安装与签名", link: "/doc/Android/APK打包安装与签名" },
                  { text: "Android代码混淆与R8高级实战全解", link: "/doc/Android/Android代码混淆与R8高级实战全解" },
                  { text: "Android发包打包、签名与ADB调试命令全集", link: "/doc/Android/Android发包打包与ADB调试命令全集" },
                ],
              },
            ],
          },
          {
            text: "Flutter",
            link: "/doc/flutter/前言",
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/flutter/前言" },
              { text: "Dart 与页面基本使用", link: "/doc/flutter/Dart与Flutter页面基本使用" },
              {
                text: "核心原理与UI渲染",
                collapsed: false,
                items: [
                  { text: "Flutter基础与核心要点", link: "/doc/flutter/Flutter基础与核心要点" },
                  { text: "渲染机制与Widget体系核心解析", link: "/doc/flutter/渲染机制与Widget体系核心解析" },
                  { text: "布局机制与核心原理", link: "/doc/flutter/布局机制与核心原理" },
                  { text: "Compose与Flutter声明式UI布局与优化全景", link: "/doc/Android/Compose与Flutter声明式UI布局与性能优化全景指南" },
                ],
              },
              {
                text: "状态管理与跨端通信",
                collapsed: false,
                items: [
                  { text: "状态管理与架构实战", link: "/doc/flutter/状态管理与架构实战" },
                  { text: "原生通信与工程化实战", link: "/doc/flutter/原生通信与工程化实战" },
                  { text: "跨端框架架构设计与技术选型对比", link: "/doc/flutter/跨端框架架构设计与技术选型对比" },
                ],
              },
              {
                text: "常用第三方库与网络",
                collapsed: false,
                items: [
                  { text: "热门第三方库选型与生产避坑全集", link: "/doc/flutter/Flutter热门第三方库与MVP实战" },
                  { text: "Dio网络请求与企业级封装详解", link: "/doc/flutter/Dio网络请求与企业级封装详解" },
                  { text: "相册多选与相机采集实战 (wechat_picker)", link: "/doc/flutter/相册多选与相机采集实战" },
                  { text: "图片缓存与大图缩放画廊实战 (photo_view+crop)", link: "/doc/flutter/图片缓存与大图缩放画廊实战" },
                  { text: "视频播放与视口滚动联播实战 (video_player)", link: "/doc/flutter/视频播放与视口滚动联播实战" },
                  { text: "端侧多媒体前置压缩流水线实战 (compress)", link: "/doc/flutter/端侧多媒体前置压缩流水线实战" },
                  { text: "EasyRefresh下拉刷新与触底分页实战", link: "/doc/flutter/EasyRefresh下拉刷新与触底分页实战" },
                  { text: "扫码识别与二维码动态生成实战 (mobile_scanner)", link: "/doc/flutter/扫码识别与二维码动态生成实战" },
                  { text: "桌面端拖拽与跨平台文件交互实战 (desktop_drop)", link: "/doc/flutter/桌面端拖拽与跨平台文件交互实战" },
                  { text: "语音识别搜图与文本转换实战 (speech_to_text)", link: "/doc/flutter/语音识别搜图与文本转换实战" },
                ],
              },
              {
                text: "性能调优与工程实战",
                collapsed: false,
                items: [
                  { text: "性能优化与实战总结", link: "/doc/flutter/性能优化与实战总结" },
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
              { text: "前言", link: "/doc/uniapp/前言" },
              { text: "页面、登录与支付基本实践", link: "/doc/uniapp/页面开发登录与支付基本实践" },
              { text: "UniApp高频面试题与项目实战", link: "/doc/uniapp/UniApp高频面试题与项目实战" },
              { text: "UniApp第三方库选型与实战", link: "/doc/uniapp/UniApp第三方库选型与实战" },
              { text: "UniApp核心架构与跨端开发体系", link: "/doc/uniapp/UniApp核心架构与跨端开发体系" },
              { text: "企业级网络封装与状态管理实战", link: "/doc/uniapp/企业级网络封装与状态管理实战" },
              { text: "性能优化与多端避坑全景指南", link: "/doc/uniapp/性能优化与多端避坑全景指南" },
            ],
          },
          {
            text: "微信小程序",
            link: "/doc/微信小程序/前言",
            collapsed: true,
            items: [
              { text: "前言：MVP 地图", link: "/doc/微信小程序/前言" },
              { text: "原生小程序基本开发与面试", link: "/doc/微信小程序/原生小程序基本开发与面试" },
              { text: "快速部署与上架审核", link: "/doc/微信小程序/微信小程序快速部署与上架审核" },
            ],
          },
          {
            text: "浙政钉",
            link: "/doc/浙政钉/浙政钉开发上架流程",
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/浙政钉/前言" },
              { text: "身份、权限与专网联调", link: "/doc/浙政钉/身份接入权限与联调实践" },
              { text: "浙政钉开发上架流程", link: "/doc/浙政钉/浙政钉开发上架流程" },
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
              { text: "前言：阅读地图与串讲主线", link: "/doc/Vue/前言" },
              { text: "JavaScript 与浏览器基础", link: "/doc/Vue/JavaScript与浏览器基础实战" },
              { text: "Vue 组件与页面基本使用", link: "/doc/Vue/Vue组件与页面基本使用" },
              {
                text: "页面基础与 CSS",
                collapsed: false,
                items: [
                  { text: "CSS布局与响应式实战", link: "/doc/Vue/CSS布局与响应式实战" },
                ],
              },
              {
                text: "① 核心响应式与组件开发",
                collapsed: false,
                items: [
                  { text: "Vue2/Vue3 响应式深度对比（先看）", link: "/doc/Vue/Vue2与Vue3底层演进与响应式深度对比" },
                  { text: "响应式原理与实战解析", link: "/doc/Vue/响应式原理与实战解析" },
                  { text: "组合式API与实战解析", link: "/doc/Vue/组合式API与实战解析" },
                  { text: "生命周期与实战总结", link: "/doc/Vue/生命周期与实战总结" },
                  { text: "组件通信与实战解析", link: "/doc/Vue/组件通信与实战解析" },
                  { text: "v-model原理与实战解析", link: "/doc/Vue/v-model原理与实战解析" },
                ],
              },
              {
                text: "② 路由与状态管理",
                collapsed: false,
                items: [
                  { text: "VueRouter原理与实战", link: "/doc/Vue/VueRouter原理与实战" },
                  { text: "路由权限守卫与实战", link: "/doc/Vue/路由权限守卫与实战" },
                  { text: "Pinia状态管理与架构实战", link: "/doc/Vue/Pinia状态管理与实战解析" },
                ],
              },
              {
                text: "③ 渲染、类型与工程化",
                collapsed: false,
                items: [
                  { text: "TypeScript工程实践与类型体操", link: "/doc/Vue/TypeScript工程实践与类型体操" },
                  { text: "nextTick与异步更新队列深度解析", link: "/doc/Vue/nextTick与异步更新队列深度解析" },
                  { text: "渲染机制与Diff算法深度解析", link: "/doc/Vue/渲染机制与Diff算法深度解析" },
                  { text: "Webpack与Vite架构对比及组件性能优化全集", link: "/doc/Vue/Webpack与Vite架构对比及组件性能优化全集" },
                  { text: "性能优化与实战总结", link: "/doc/Vue/性能优化与实战总结" },
                  { text: "工程化构建与部署实战", link: "/doc/Vue/工程化构建与部署实战" },
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
              { text: "大前端全栈通俗心智模型与实战全景", link: "/doc/Fullstack/大前端全栈通俗心智模型与实战全景" },
              { text: "大文件分片上传与断点续传", link: "/doc/Fullstack/大文件分片上传与断点续传" },
              { text: "大模型SSE流式交互全栈实战", link: "/doc/Fullstack/大模型SSE流式交互全栈实战" },
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
              { text: "前言", link: "/doc/Java/前言" },
              { text: "Java 语言与日常开发", link: "/doc/Java/Java语言基础与日常开发" },
              { text: "CRUD 后：事务、权限与排错路线", link: "/doc/Java/CRUD之后的后端补强路线" },
              { text: "事务、权限与排错实战", link: "/doc/Java/事务权限与排错实战" },
              { text: "可运行的后端练习项目", link: "/examples/java-backend-workshop/README" },
              {
                text: "Java 核心与底层",
                collapsed: false,
                items: [
                  { text: "Java基础与集合源码", link: "/doc/Java/Java基础与集合源码" },
                  { text: "JMM并发编程与线程池", link: "/doc/Java/JMM并发编程与线程池" },
                  { text: "JVM底层原理与调优实战", link: "/doc/Java/JVM底层原理与调优实战" },
                  { text: "JDK 17-21 新特性与虚拟线程", link: "/doc/Java/JDK17-21新特性与虚拟线程全解" },
                  { text: "Java生态核心工具库与MVP实战", link: "/doc/Java/Java生态核心工具库与MVP实战" },
                ],
              },
              {
                text: "Spring 生态",
                collapsed: false,
                items: [
                  { text: "Spring Boot业务开发实战入门", link: "/doc/Java/SpringBoot业务开发实战入门" },
                  { text: "Spring核心与事务失效实战", link: "/doc/Java/Spring/Spring核心与事务失效实战" },
                  { text: "AOP底层原理与三级缓存", link: "/doc/Java/Spring/AOP底层原理与三级缓存" },
                  { text: "SpringBoot自动装配与核心机制", link: "/doc/Java/Spring/SpringBoot自动装配与核心机制" },
                  { text: "SpringCloud微服务核心组件与架构实战", link: "/doc/Java/Spring/SpringCloud微服务核心组件与架构实战" },
                ],
              },
              {
                text: "持久层 (MyBatis)",
                collapsed: false,
                items: [
                  { text: "SQL与MyBatis映射实战全景对照", link: "/doc/Java/MyBatis/SQL与MyBatis映射实战全景对照" },
                  { text: "MyBatis核心原理与插件实战", link: "/doc/Java/MyBatis/MyBatis核心原理与插件实战" },
                  { text: "MyBatis缓存机制与SQL注入防范", link: "/doc/Java/MyBatis/MyBatis缓存机制与SQL注入防范" },
                  { text: "MyBatis-Plus核心使用与技术选型对比", link: "/doc/Java/MyBatis/MyBatis-Plus核心使用与技术选型对比" },
                ],
              },
              {
                text: "高并发中间件与生产治理",
                collapsed: false,
                items: [
                  { text: "Redis高并发缓存与一致性实战", link: "/doc/Java/Redis高并发缓存与一致性实战" },
                  { text: "Redis大Key热Key与集群治理实战", link: "/doc/Java/Redis大Key热Key与集群治理实战" },
                  { text: "MQ消息队列与延迟任务实战", link: "/doc/Java/MQ消息队列与延迟任务实战" },
                  { text: "消息中间件选型与高可靠投递全解", link: "/doc/Java/消息中间件选型与高可靠投递全解" },
                  { text: "Kafka与RocketMQ生产级接入实战", link: "/doc/Java/Kafka与RocketMQ生产级接入实战" },
                  { text: "Dubbo分布式RPC核心原理与实战", link: "/doc/Java/Dubbo分布式RPC核心原理与实战" },
                  { text: "分布式定时任务与调度框架实战", link: "/doc/Java/分布式定时任务与调度框架实战" },
                  { text: "常用中间件核心原理与选型速查", link: "/doc/Java/常用中间件核心原理与选型速查" },
                ],
              },
              {
                text: "🔥 核心避坑与生产实战精要",
                collapsed: false,
                items: [
                  { text: "后端核心避坑与生产实战全解", link: "/doc/Java/后端核心避坑与生产实战全解" },
                  { text: "Java后端与分布式高频硬核考点全解", link: "/doc/Java/Java后端与分布式高频硬核考点全解" },
                  { text: "高并发大数据与线上疑难故障排查实战", link: "/doc/Java/高并发大数据与线上疑难故障排查实战" },
                ],
              },
            ],
          },
          {
            text: "MySQL",
            link: "/doc/MySQL/前言",
            collapsed: true,
            items: [
              { text: "前言：MySQL 实战地图", link: "/doc/MySQL/前言" },
              { text: "备份恢复与数据库变更", link: "/doc/MySQL/备份恢复与数据库变更实践" },
              { text: "SQL编写与生产维护实战", link: "/doc/MySQL/SQL编写与生产维护实战" },
              { text: "MySQL基础语句与多表关联查询深度", link: "/doc/MySQL/MySQL基础语句与多表关联查询深度" },
              { text: "生产级SQL开发技巧与真实场景实战", link: "/doc/MySQL/生产级SQL开发技巧与真实场景实战" },
              { text: "MySQL索引失效与优化实战", link: "/doc/MySQL/MySQL索引失效与优化实战" },
              { text: "MySQL事务隔离与MVCC原理", link: "/doc/MySQL/MySQL事务隔离与MVCC原理" },
              { text: "MySQL底层原理日志体系与BufferPool", link: "/doc/MySQL/MySQL底层原理日志体系与BufferPool" },
              { text: "高并发大字段建表规范与生产场景", link: "/doc/MySQL/高并发大字段建表规范与生产场景" },
              { text: "MySQL主从复制与读写分离实战", link: "/doc/MySQL/MySQL主从复制与读写分离实战" },
            ],
          },
        ],
      },
      {
        text: "🚀 网络与运维工程化",
        items: [
          {
            text: "网络与通信协议",
            link: "/doc/Network/前言",
            collapsed: true,
            items: [
              { text: "前言：网络与通信协议地图", link: "/doc/Network/前言" },
              { text: "HTTP/DNS 基本使用与排错", link: "/doc/Network/HTTP与DNS基本使用及排错" },
              { text: "计算机网络与核心通信协议全解", link: "/doc/Network/计算机网络与核心通信协议全解" },
            ],
          },
          {
            text: "DevOps与容器工程化",
            link: "/doc/DevOps/前言",
            collapsed: true,
            items: [
              { text: "前言：DevOps 与部署工程化地图", link: "/doc/DevOps/前言" },
              { text: "部署运维基本使用与排错", link: "/doc/DevOps/部署运维基本使用与故障排查" },
              { text: "Docker容器化与CI/CD自动化部署实战", link: "/doc/DevOps/Docker容器化与CICD自动化部署实战" },
              {
                text: "Kubernetes 专题（按序阅读）",
                collapsed: false,
                items: [
                  { text: "① 架构全景与核心对象", link: "/doc/DevOps/K8s生产级容器编排与核心架构全解" },
                  { text: "② 工作负载与发布策略", link: "/doc/DevOps/K8s工作负载与发布策略实战" },
                  { text: "③ 网络与存储体系", link: "/doc/DevOps/K8s网络与存储体系全解" },
                  { text: "④ 生产治理与故障排查", link: "/doc/DevOps/K8s生产治理与故障排查" },
                ],
              },
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
            ],
          },
        ],
      },
      {
        text: "🤖 前沿探索与极客生态",
        items: [
          {
            text: "AI 实战",
            link: "/doc/AI/前言",
            collapsed: true,
            items: [
              { text: "前言：AI 工程化与应用地图", link: "/doc/AI/前言" },
              { text: "模型调用、RAG 与评测基础", link: "/doc/AI/模型调用RAG与评测基础" },
              { text: "LangChain+LangGraph+LlamaIndex+Qdrant实战", link: "/doc/AI/大模型技术栈LangChain-LangGraph-LlamaIndex-Qdrant实战" },
              { text: "VibeCoding与MCP生态(Stitch/Superpowers/Trellis/UUPM)", link: "/doc/AI/VibeCoding与MCP生态实战-Stitch-Superpowers-Trellis与UIUXProMax" },
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
