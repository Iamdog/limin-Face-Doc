---
title: Vue热门生态库与工程化MVP
---

# Vue热门生态库与工程化MVP

## 使用入口：先解决问题，再做验证

按业务需求接入状态、请求和交互工具。

**先做基本操作**：先用原生 Vue API 完成一页业务，再按重复需求引入 VueUse/Pinia/Axios，并验证错误和清理。初次学习可先完成[本模块基础实践](/doc/Vue/Vue组件与页面基本使用)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

现代 Vue 3 开发已经完全建立在成熟的生态体系之上。掌握 **VueUse 工具集、Pinia 组合式持久化、Axios+TS 封装与 Vite 生产级分包优化** 是全栈前端工程师的必备素养。

---

## 1. 瑞士军刀：VueUse 核心工具实战

`@vueuse/core` 是 Vue 3 官方生态最强大的组合式工具库，避免手写大量 DOM 监听和浏览器 API 兼容代码。

### 最小 MVP 演示（响应式存储 + 实时防抖 + 图片懒加载）
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useStorage, useDebounceFn, useIntersectionObserver } from '@vueuse/core'

// 1. useStorage: 自动将 ref 状态双向绑定持久化到 localStorage
const userTheme = useStorage<'light' | 'dark'>('app_theme', 'light')

// 2. useDebounceFn: 搜索输入防抖
const searchQuery = ref('')
const handleSearch = useDebounceFn((keyword: string) => {
  console.log('触发防抖搜索 API 请求:', keyword)
}, 500)

// 3. useIntersectionObserver: 元素曝光（图片懒加载/无限滚动）
const targetImage = ref<HTMLImageElement | null>(null)
const isVisible = ref(false)

useIntersectionObserver(targetImage, ([{ isIntersecting }]) => {
  if (isIntersecting) {
    isVisible.value = true
    console.log('图片进入视口，开始加载高清资源！')
  }
})
</script>

<template>
  <div>
    <button @click="userTheme = userTheme === 'light' ? 'dark' : 'light'">
      切换主题: {{ userTheme }}
    </button>

    <input v-model="searchQuery" @input="handleSearch(searchQuery)" placeholder="防抖输入搜索..." />

    <div ref="targetImage" style="margin-top: 800px; height: 200px; background: #eee;">
      <p v-if="isVisible">高清大图已加载！</p>
    </div>
  </div>
</template>
```

---

## 2. 状态管理：Pinia 组合式风格与数据持久化

### 安装依赖
```bash
npm install pinia pinia-plugin-persistedstate
```

### 最小 MVP 代码（用户 Store + 自动持久化到本地）
```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    // State 响应式状态
    const token = ref<string>('')
    const userInfo = ref<{ id: number; name: string } | null>(null)

    // Getters 计算属性
    const isLogin = computed(() => !!token.value)

    // Actions 业务行为
    function setAuth(newToken: string, user: { id: number; name: string }) {
      token.value = newToken
      userInfo.value = user
    }

    function logout() {
      token.value = ''
      userInfo.value = null
    }

    return { token, userInfo, isLogin, setAuth, logout }
  },
  {
    // 启用持久化插件配置
    persist: {
      key: 'auth_user_cache',
      storage: localStorage,
    },
  }
)
```

---

## 3. 网络通信：Axios + TypeScript 工业级封装

提供统一的泛型类型约束 `Result<T>`、请求超时管理、自动 Token 挂载以及全局 401 登出拦截。

```typescript
// utils/request.ts
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

// 统一后端数据返回结构契约
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

// 请求拦截器
service.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    // 如果与后端约定的业务 code 不是 200，说明业务异常
    if (res.code !== 200) {
      console.error('[业务异常]', res.message)
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res.data // 直接剥离外层，只把核心 data 返回给上层页面
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('登录已过期，清空本地票据并跳往登录页')
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 导出强类型 request 助手方法
export function httpGet<T>(url: string, params?: object, config?: AxiosRequestConfig): Promise<T> {
  return service.get(url, { params, ...config })
}

export function httpPost<T>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
  return service.post(url, data, config)
}
```

---

## 4. Vite 生产构建优化与分包配置

在大型项目中，如果不加配置，Vite 会把所有依赖打包进单个大 `vendor.js` 中，导致首屏加载极慢。

### `vite.config.ts` 核心生产分包配置
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境自动剔除所有 console.log
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // 核心：按厂商依赖库分包，利用浏览器长期缓存
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
              return 'vue-vendor'
            }
            if (id.includes('@vueuse')) {
              return 'vueuse-vendor'
            }
            return 'libs-vendor'
          }
        },
      },
    },
  },
})
```
