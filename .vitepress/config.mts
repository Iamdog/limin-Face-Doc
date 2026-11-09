import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Face-Doc",
  description: "A VitePress Site",
  base: "/limin-Face-Doc/", // 必须和你的 GitHub 仓库名一致，且前后都有斜杠
  themeConfig: {
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
          { text: "浙政钉", link: "/doc/浙政钉/浙政钉开发上架流程" },
        ],
      },
      {
        text: "前端与全栈",
        items: [
          { text: "Vue", link: "/doc/vue/前言" },
          { text: "全栈高并发场景", link: "/doc/Fullstack/大前端全栈通俗心智模型与实战全景" },
        ],
      },
      {
        text: "后端与存储",
        items: [
          { text: "Java 后端", link: "/doc/Java/前言" },
          { text: "MySQL 数据库", link: "/doc/MySQL/MySQL底层原理日志体系与BufferPool" },
        ],
      },
      {
        text: "架构与运维",
        items: [
          { text: "网络与通信协议", link: "/doc/Network/计算机网络与核心通信协议全解" },
          { text: "DevOps 与容器工程化", link: "/doc/DevOps/Docker容器化与CICD自动化部署实战" },
        ],
      },
      {
        text: "前沿与生态",
        items: [
          { text: "AI 前沿实战", link: "/doc/AI/OpenClaw.md" },
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
                text: "Kotlin语言与异步并发",
                collapsed: false,
                items: [
                  { text: "Kotlin核心机制与高频实战解析", link: "/doc/Android/Kotlin核心机制与大厂高频面试题" },
                  { text: "协程与Flow实战", link: "/doc/Android/协程与Flow实战" },
                  { text: "多线程", link: "/doc/Android/多线程" },
                  { text: "线程池调优实战", link: "/doc/Android/线程池调优实战" },
                ],
              },
              {
                text: "现代架构与Jetpack/Compose",
                collapsed: false,
                items: [
                  { text: "开发架构演变", link: "/doc/Android/开发架构演变" },
                  { text: "Jetpack之ViewModel与LiveData", link: "/doc/Android/Jetpack之ViewModel与LiveData" },
                  { text: "Jetpack之Room", link: "/doc/Android/Jetpack之Room" },
                  { text: "Compose基础与面试题", link: "/doc/Android/Compose基础与面试题" },
                  { text: "Compose底层原理与高频面试实战", link: "/doc/Android/Compose底层原理与高频面试实战" },
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
                  { text: "APK打包安装与签名", link: "/doc/Android/APK打包安装与签名" },
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
              {
                text: "核心原理与UI渲染",
                collapsed: false,
                items: [
                  { text: "Flutter基础与面试题", link: "/doc/flutter/Flutter基础与面试题" },
                  { text: "渲染机制与Widget体系面试题", link: "/doc/flutter/渲染机制与Widget体系面试题" },
                  { text: "布局机制与面试题", link: "/doc/flutter/布局机制与面试题" },
                  { text: "Compose与Flutter声明式UI布局与优化全景", link: "/doc/Android/Compose与Flutter声明式UI布局与性能优化全景指南" },
                ],
              },
              {
                text: "状态管理与跨端通信",
                collapsed: false,
                items: [
                  { text: "状态管理与面试题", link: "/doc/flutter/状态管理与面试题" },
                  { text: "原生通信与工程化面试题", link: "/doc/flutter/原生通信与工程化面试题" },
                  { text: "跨端框架架构设计与技术选型对比", link: "/doc/flutter/跨端框架架构设计与技术选型对比" },
                ],
              },
              {
                text: "性能调优与工程实战",
                collapsed: false,
                items: [
                  { text: "性能优化与面试题", link: "/doc/flutter/性能优化与面试题" },
                  { text: "Flutter发包构建与调试命令全集", link: "/doc/flutter/Flutter发包构建与调试命令全集" },
                  { text: "Flutter热门第三方库与MVP实战", link: "/doc/flutter/Flutter热门第三方库与MVP实战" },
                ],
              },
            ],
          },
          {
            text: "浙政钉",
            link: "/doc/浙政钉/浙政钉开发上架流程",
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/浙政钉/前言" },
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
            link: "/doc/vue/前言",
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/vue/前言" },
              {
                text: "核心响应式与组件开发",
                collapsed: false,
                items: [
                  { text: "组合式API与面试题", link: "/doc/vue/组合式API与面试题" },
                  { text: "响应式原理与面试题", link: "/doc/vue/响应式原理与面试题" },
                  { text: "生命周期与面试题", link: "/doc/vue/生命周期与面试题" },
                  { text: "组件通信与面试题", link: "/doc/vue/组件通信与面试题" },
                  { text: "v-model的原理与面试题", link: "/doc/vue/v-model的原理与面试题" },
                  { text: "Vue2与Vue3底层演进与响应式深度对比", link: "/doc/Vue/Vue2与Vue3底层演进与响应式深度对比" },
                ],
              },
              {
                text: "路由与状态管理",
                collapsed: false,
                items: [
                  { text: "VueRouter与面试题", link: "/doc/vue/VueRouter与面试题" },
                  { text: "路由权限守卫与面试题", link: "/doc/vue/路由权限守卫与面试题" },
                  { text: "Pinia状态管理与面试题", link: "/doc/vue/Pinia状态管理与面试题" },
                ],
              },
              {
                text: "渲染原理与工程化",
                collapsed: false,
                items: [
                  { text: "nextTick与异步更新队列面试题", link: "/doc/vue/nextTick与异步更新队列面试题" },
                  { text: "渲染机制与Diff面试题", link: "/doc/vue/渲染机制与Diff面试题" },
                  { text: "性能优化与面试题", link: "/doc/vue/性能优化与面试题" },
                  { text: "Webpack与Vite架构对比及组件性能优化全集", link: "/doc/Vue/Webpack与Vite架构对比及组件性能优化全集" },
                  { text: "工程化构建与部署面试题", link: "/doc/vue/工程化构建与部署面试题" },
                  { text: "Vue热门生态库与工程化MVP", link: "/doc/Vue/Vue热门生态库与工程化MVP" },
                ],
              },
            ],
          },
          {
            text: "全栈高并发场景",
            link: "/doc/Fullstack/大前端全栈通俗心智模型与实战全景",
            collapsed: true,
            items: [
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
              {
                text: "Java 核心与底层",
                collapsed: false,
                items: [
                  { text: "Java基础与集合源码", link: "/doc/Java/Java基础与集合源码" },
                  { text: "JMM并发编程与线程池", link: "/doc/Java/JMM并发编程与线程池" },
                  { text: "JVM底层原理与调优实战", link: "/doc/Java/JVM底层原理与调优实战" },
                  { text: "Java生态核心工具库与MVP实战", link: "/doc/Java/Java生态核心工具库与MVP实战" },
                ],
              },
              {
                text: "Spring 生态",
                collapsed: false,
                items: [
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
                ],
              },
              {
                text: "高并发中间件 (Redis & MQ)",
                collapsed: false,
                items: [
                  { text: "Redis高并发缓存与一致性实战", link: "/doc/Java/Redis高并发缓存与一致性实战" },
                  { text: "MQ消息队列与延迟任务实战", link: "/doc/Java/MQ消息队列与延迟任务实战" },
                ],
              },
            ],
          },
          {
            text: "MySQL",
            link: "/doc/MySQL/MySQL底层原理日志体系与BufferPool",
            collapsed: true,
            items: [
              { text: "MySQL底层原理日志体系与BufferPool", link: "/doc/MySQL/MySQL底层原理日志体系与BufferPool" },
              { text: "MySQL基础语句与多表关联查询深度", link: "/doc/MySQL/MySQL基础语句与多表关联查询深度" },
              { text: "生产级SQL开发技巧与真实场景实战", link: "/doc/MySQL/生产级SQL开发技巧与真实场景实战" },
              { text: "MySQL索引失效与优化实战", link: "/doc/MySQL/MySQL索引失效与优化实战" },
              { text: "MySQL事务隔离与MVCC原理", link: "/doc/MySQL/MySQL事务隔离与MVCC原理" },
              { text: "高并发大字段建表规范与生产场景", link: "/doc/MySQL/高并发大字段建表规范与生产场景" },
            ],
          },
        ],
      },
      {
        text: "🚀 网络与运维工程化",
        items: [
          {
            text: "网络与通信协议",
            link: "/doc/Network/计算机网络与核心通信协议全解",
            collapsed: true,
            items: [
              { text: "计算机网络与核心通信协议全解", link: "/doc/Network/计算机网络与核心通信协议全解" },
            ],
          },
          {
            text: "DevOps与容器工程化",
            link: "/doc/DevOps/Docker容器化与CICD自动化部署实战",
            collapsed: true,
            items: [
              { text: "Docker容器化与CICD自动化部署实战", link: "/doc/DevOps/Docker容器化与CICD自动化部署实战" },
              { text: "K8s生产级容器编排与核心架构全解", link: "/doc/DevOps/K8s生产级容器编排与核心架构全解" },
            ],
          },
        ],
      },
      {
        text: "🤖 前沿探索与极客生态",
        items: [
          {
            text: "AI 实战",
            link: "/doc/AI/OpenClaw.md",
            collapsed: true,
            items: [
              { text: "OpenClaw部署", link: "/doc/AI/OpenClaw.md" },
              { text: "LangChain+LangGraph+LlamaIndex+Qdrant实战", link: "/doc/AI/大模型技术栈LangChain-LangGraph-LlamaIndex-Qdrant实战" },
              { text: "VibeCoding与MCP生态(Stitch/Superpowers/Trellis/UUPM)", link: "/doc/AI/VibeCoding与MCP生态实战-Stitch-Superpowers-Trellis与UIUXProMax" },
            ],
          },
          {
            text: "社区与资源",
            link: "/doc/社区资源/第三方论坛与技术社区导航",
            collapsed: true,
            items: [
              { text: "第三方论坛与技术社区导航", link: "/doc/社区资源/第三方论坛与技术社区导航" },
            ],
          },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026-present Li Min",
    },
  },
  lastUpdated: true,
});
