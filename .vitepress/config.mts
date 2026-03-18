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
      { text: "技术栈", link: "/doc/Android/RecyclerView" },
    ],

    sidebar: [
      {
        text: "技术栈",
        items: [
          {
            text: "前言",
            link: "/doc/前言",
          },
          {
            text: "Android",
            link: "/doc/Android/前言",
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/Android/前言" },
              { text: "Activity", link: "/doc/Android/四大组件之Activity" },
              { text: "Fragment", link: "/doc/Android/Fragment" },
              { text: "Service", link: "/doc/Android/四大组件之Service" },
              { text: "BroadcastReceiver", link: "/doc/Android/四大组件之BroadcastReceiver" },
              { text: "ContentProvider", link: "/doc/Android/四大组件之ContentProvider" },
              { text: "UI布局方式", link: "/doc/Android/布局方式" },
              { text: "Window与DecorView", link: "/doc/Android/Window与DecorView" },
              { text: "View事件分发", link: "/doc/Android/View事件分发" },
              { text: "RecyclerView", link: "/doc/Android/RecyclerView" },
              { text: "RecyclerView源码与缓存深挖", link: "/doc/Android/RecyclerView源码与缓存深挖" },
              { text: "Handler消息机制", link: "/doc/Android/Handler消息机制" },
              { text: "HandlerThread-IntentService-WorkManager对比", link: "/doc/Android/HandlerThread-IntentService-WorkManager对比" },
              { text: "协程与Flow实战", link: "/doc/Android/协程与Flow实战" },
              { text: "线程池调优实战", link: "/doc/Android/线程池调优实战" },
              { text: "Binder机制", link: "/doc/Android/Binder机制" },
              { text: "AMS-WMS-PMS", link: "/doc/Android/AMS-WMS-PMS" },
              { text: "触摸滑动冲突实战", link: "/doc/Android/触摸滑动冲突实战" },
              { text: "缓存", link: "/doc/Android/缓存" },
              { text: "Bitmap与图片加载", link: "/doc/Android/Bitmap与图片加载" },
              { text: "OOM专题", link: "/doc/Android/OOM专题" },
              { text: "ANR专题", link: "/doc/Android/ANR专题" },
              { text: "网络框架Retrofit-OkHttp", link: "/doc/Android/网络框架Retrofit-OkHttp" },
              { text: "网络安全与HTTPS", link: "/doc/Android/网络安全与HTTPS" },
              { text: "SharedPreferences-DataStore-MMKV", link: "/doc/Android/SharedPreferences-DataStore-MMKV" },
              { text: "Jetpack之ViewModel与LiveData", link: "/doc/Android/Jetpack之ViewModel与LiveData" },
              { text: "Jetpack之Room", link: "/doc/Android/Jetpack之Room" },
              { text: "Compose基础与面试题", link: "/doc/Android/Compose基础与面试题" },
              { text: "启动流程与冷启动", link: "/doc/Android/启动流程与冷启动" },
              { text: "启动优化任务编排实战", link: "/doc/Android/启动优化任务编排实战" },
              { text: "性能优化", link: "/doc/Android/性能优化" },
              { text: "内存泄漏", link: "/doc/Android/内存泄漏" },
              { text: "多线程", link: "/doc/Android/多线程" },
              { text: "崩溃治理专题", link: "/doc/Android/崩溃治理专题" },
              { text: "开发架构演变", link: "/doc/Android/开发架构演变" },
              { text: "动画体系", link: "/doc/Android/动画体系" },
              { text: "自定义View", link: "/doc/Android/自定义View" },
              { text: "APK打包安装与签名", link: "/doc/Android/APK打包安装与签名" },
              { text: "AIDL实战", link: "/doc/Android/AIDL实战" },
              { text: "JNI与NDK", link: "/doc/Android/JNI与NDK" },
            ],
          },
          {
            text: "Flutter",
            link: "/doc/flutter/前言",
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/flutter/前言" },
              { text: "Flutter基础与面试题", link: "/doc/flutter/Flutter基础与面试题" },
              { text: "渲染机制与Widget体系面试题", link: "/doc/flutter/渲染机制与Widget体系面试题" },
              { text: "状态管理与面试题", link: "/doc/flutter/状态管理与面试题" },
              { text: "布局机制与面试题", link: "/doc/flutter/布局机制与面试题" },
              { text: "性能优化与面试题", link: "/doc/flutter/性能优化与面试题" },
              { text: "原生通信与工程化面试题", link: "/doc/flutter/原生通信与工程化面试题" },
            ],
          },
          {
            text: "Vue",
            link: "/doc/vue/前言",
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/vue/前言" },
              { text: "组合式API与面试题", link: "/doc/vue/组合式API与面试题" },
              { text: "响应式原理与面试题", link: "/doc/vue/响应式原理与面试题" },
              { text: "生命周期与面试题", link: "/doc/vue/生命周期与面试题" },
              { text: "组件通信与面试题", link: "/doc/vue/组件通信与面试题" },
              { text: "v-model的原理与面试题", link: "/doc/vue/v-model的原理与面试题" },
              { text: "VueRouter与面试题", link: "/doc/vue/VueRouter与面试题" },
              { text: "路由权限守卫与面试题", link: "/doc/vue/路由权限守卫与面试题" },
              { text: "Pinia状态管理与面试题", link: "/doc/vue/Pinia状态管理与面试题" },
              { text: "nextTick与异步更新队列面试题", link: "/doc/vue/nextTick与异步更新队列面试题" },
              { text: "渲染机制与Diff面试题", link: "/doc/vue/渲染机制与Diff面试题" },
              { text: "性能优化与面试题", link: "/doc/vue/性能优化与面试题" },
              { text: "工程化构建与部署面试题", link: "/doc/vue/工程化构建与部署面试题" },
            ],
          },
          { text: "浙政钉", link: "/doc/浙政钉/浙政钉开发上架流程" ,
            collapsed: true,
            items: [
              { text: "前言", link: "/doc/浙政钉/前言" },
              { text: "开发上架流程", link: "/doc/浙政钉/浙政钉开发上架流程" },
            ],
          },
          { text: "AI", link: "/doc/AI/OpenClaw.md" ,
            collapsed: true,
            items: [
              { text: "OpenClaw部署", link: "/doc/AI/OpenClaw.md" },
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
