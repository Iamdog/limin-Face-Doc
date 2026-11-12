---
title: Vue 组件与页面基本使用
---

# Vue 组件与页面基本使用

## 解决什么问题

Vue 用于把页面拆成组件，让界面随状态更新，减少手动维护 DOM。先掌握显示、输入、列表、组件通信和请求状态，再讨论 Proxy、调度器和 Diff。

## 基本使用：一个任务列表

需要已创建的 Vue 3 + Vite 项目。将下面代码放入 `src/App.vue`，使用项目的开发命令运行。

```vue
<script setup>
import { computed, ref } from 'vue'
const title = ref('')
const tasks = ref([])
let nextId = 1
const remaining = computed(() => tasks.value.filter(task => !task.done).length)
function addTask() {
  const value = title.value.trim()
  if (!value) return
  tasks.value.push({ id: nextId++, title: value, done: false })
  title.value = ''
}
</script>

<template>
  <form @submit.prevent="addTask">
    <label>任务名称 <input v-model="title"></label>
    <button type="submit">添加</button>
  </form>
  <p v-if="tasks.length === 0">暂无任务</p>
  <ul v-else>
    <li v-for="task in tasks" :key="task.id">
      <label><input v-model="task.done" type="checkbox">{{ task.title }}</label>
    </li>
  </ul>
  <p>未完成：{{ remaining }}</p>
</template>
```

验证：空白不能新增；提交后清空输入；勾选后统计变化。刷新数据消失是预期现象，因为当前状态只在内存中。

## 基础 API 按场景选择

| 场景 | 用法 | 使用边界 |
|---|---|---|
| 展示文本与属性 | 插值、`:disabled`、`:class` | 插值默认转义；不可信内容不要直接 v-html |
| 条件显示 | v-if / v-show | v-if 创建销毁；v-show 保留实例、切换 CSS |
| 列表 | v-for + 稳定业务 key | 会增删、排序或有局部状态时避免 index key |
| 本地状态 | ref；模板通常自动解包 | JS 中 ref 常需 `.value`；解包有上下文边界 |
| 派生数据 | computed | getter 保持无副作用；不用 watch 同步重复状态 |
| 外部副作用 | watch / watchEffect | 处理异步竞态和清理；不能把所有业务都塞进监听器 |
| 父子通信 | props 向下、emit 向上 | 不直接修改父组件传入对象；复杂状态再评估 store |
| 表单 | v-model + 校验 + 提交状态 | 客户端校验改善体验，服务端仍需校验 |

## 常见场景：列表接接口

请求状态至少区分 loading、success、empty、error。发起请求前清掉旧错误，在 finally 恢复 loading；页面切换时取消请求或忽略旧结果；分页刷新要重置页码，并防止重复加载。同一组件复用时，路由参数改变需要重新加载，不能只依赖 onMounted。

组件拆分先按职责：页面负责路由和数据组合，列表项负责显示与事件，composable 负责可复用行为。Pinia 适合跨页面共享状态，单个弹窗是否打开通常留在组件里。

## 再深入的顺序

1. [组件通信](/doc/Vue/组件通信与实战解析)、[v-model](/doc/Vue/v-model原理与实战解析)：先会拆组件。
2. [生命周期](/doc/Vue/生命周期与实战总结)、[组合式 API](/doc/Vue/组合式API与实战解析)：管理副作用和复用。
3. [Router](/doc/Vue/VueRouter原理与实战)、[Pinia](/doc/Vue/Pinia状态管理与实战解析)：完成多页业务。
4. [响应式](/doc/Vue/响应式原理与实战解析)、[nextTick](/doc/Vue/nextTick与异步更新队列深度解析)、[Diff](/doc/Vue/渲染机制与Diff算法深度解析)：解释已观察到的行为。

## 面试与交付验证

| 基础题 | 场景追问 | 深入方向 |
|---|---|---|
| ref 和 computed 怎么用？ | 为什么不直接存两个统计值？ | 依赖追踪、缓存与单一数据源 |
| props/emit 怎么配合？ | 编辑表单取消时如何不污染原对象？ | 对象引用、草稿和提交边界 |
| v-if 与 v-show 怎么选？ | 弹窗反复打开是否保留输入？ | 实例生命周期和副作用清理 |
| 为什么列表要 key？ | 头部插入后输入串行如何复现？ | 身份匹配、组件复用，再讲 Diff |

最小交付应包含成功、空数据、失败、重复提交、刷新和页面退出这六类验证记录。
