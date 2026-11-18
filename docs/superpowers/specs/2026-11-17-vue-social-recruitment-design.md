# Vue 3 阶梯式全景知识库设计规约（初级筑基 → 中级进阶 → 高级深水 → 资深架构）

## 1. 目标与设计哲学
本专栏旨在打造业界最完整、阶梯递进最平滑的 **Vue 3 现代化全景技术知识库与面试宝典**。
专栏摒弃“一上来就堆砌高深晦涩底层源码”的错误路线，遵循 **“认识现象 → 掌握用法 → 理解边界 → 排障避坑 → 源码推导 → 架构设计”** 的认知规律，让**初学者能够零门槛迅速上手核心语法与日常业务开发**，同时让**中高级与资深架构师能够直击响应式内核、编译优化、Diff 算法极限与企业级工程架构**。

---

## 2. 四大进阶梯队与文档标准

| 梯队 | 适合人群 | 核心目标 | 文档包含的核心板块 |
| :--- | :--- | :--- | :--- |
| **梯队一：初级筑基 (10篇)** | 0~2年/应届生/转栈同学 | 快速掌握核心语法与基本使用，解决日常页面开发与初级面试 | ① 白话通俗机制与生活类比<br/>② 完整的 `<script setup>` 基础代码演示<br/>③ 初学者高频报错与排错排坑指南<br/>④ 初级面试经典问答标准模板 |
| **梯队二：中级进阶 (10篇)** | 2~3年业务骨干 | 掌握组件封装设计、Hooks 复用、状态流转与常见业务场景工程化 | ① 组件通信与架构图谱<br/>② 复杂业务场景优雅代码范式<br/>③ 踩坑案例与性能边界条件<br/>④ 中级面试核心追问与方案取舍 |
| **梯队三：高级深水 (10篇)** | 3~5年资深技术专家 | 吃透 Vue 3 响应式底层、编译优化 AST、虚拟 DOM 与 Diff 算法 | ① 核心底层拓扑架构图 (Mermaid)<br/>② 源码逐行剖析与算法数学物理推导<br/>③ 大厂技术连环追问与反证法<br/>④ 极端边界死锁与性能脱轨攻防 |
| **梯队四：资深架构 (10篇)** | 5年+ 架构师/全栈专家 | 覆盖微前端、SSR 水合、工程化构建体系、APM 监控与安全攻防 | ① 企业级系统全景链路图<br/>② 线上真实事故现场诊断 SOP<br/>③ CLI/DevTools 工具链实战与底层机制<br/>④ 工业级架构落地指南 |
| **梯队五：通关题库 (3篇)** | 全阶段面试突击 | 按层级精准匹配招聘需求，共 150 道大厂标准真题库 | 50 道初级基础 + 50 道中级实战 + 50 道高级架构连环炮 |

---

## 3. 43 篇专题完整清单

### 梯队一：初级筑基·零基础快速入门与核心语法实战（10 篇）
1. `doc/Vue/初级-Vue3项目初始化与SFC单文件组件结构全解.md`
   - *内容*：`create-vue` 脚手架搭建、`main.ts` 与 `createApp()` 挂载机制；`<template>`、`<script setup>`、`<style scoped>` 组成剖析；插值表达式 `{{ }}` 与响应式初步体验。
2. `doc/Vue/初级-模板语法核心指令v-if与v-show物理区别及key机制.md`
   - *内容*：`v-if` / `v-else-if` / `v-else` 条件渲染（DOM 物理创建/销毁）对比 `v-show`（CSS `display: none`）；`v-for` 列表渲染数组与对象；为什么 `v-if` 与 `v-for` 严禁混用；`key` 为什么严禁使用 `index`。
3. `doc/Vue/初级-属性与事件绑定v-bind与v-on常用修饰符实战.md`
   - *内容*：动态属性绑定 `v-bind`（简写 `:`）；动态 class 与 style（对象语法与数组语法）；事件监听 `v-on`（简写 `@`）；事件传参 `$event` 与常用修饰符（`.stop`、`.prevent`、`.once`、`.enter` 键盘修饰符）。
4. `doc/Vue/初级-表单输入双向绑定v-model基础用法与常用修饰符.md`
   - *内容*：文本框、单选框、复选框（布尔值 vs 数组）、下拉选择框的 `v-model`；修饰符 `.lazy`、`.number`、`.trim` 的实战场景；`v-model` 的底层原理（`:value` + `@input` 语法糖）。
5. `doc/Vue/初级-计算属性computed与侦听器watch及methods全方位对比.md`
   - *内容*：`computed` 缓存机制与只读/可写属性（getter/setter）；`watch` 基础监听、深度监听 `deep: true` 与立即执行 `immediate: true`；`methods` 每次渲染都执行的开销；三者选型标准与决策树。
6. `doc/Vue/初级-Vue生命周期全流程Vue2与Vue3对比及资源清理避坑.md`
   - *内容*：组件完整生命周期（创建、挂载、更新、销毁）；Vue 2（created 到 destroyed）与 Vue 3（setup 到 onUnmounted）映射表；接口请求放在哪个钩子最合理；什么时候才能拿真实 DOM；组件销毁前清除定时器与全局事件规范。
7. `doc/Vue/初级-组件基础通信props与emit及单向数据流原则.md`
   - *内容*：父传子 `defineProps` 类型约束、默认值 `withDefaults`；子传父 `defineEmits`；为什么子组件严禁直接修改 prop（单向数据流原则）；`$attrs` 属性透传与 `inheritAttrs: false`。
8. `doc/Vue/初级-插槽Slot默认插槽具名插槽与作用域插槽保姆级教学.md`
   - *内容*：插槽解决的核心问题；默认插槽 `<slot>`；具名插槽 `#header` / `#footer`；作用域插槽子传父参数渲染；实战案例：封装一个通用弹窗卡片和表格操作列。
9. `doc/Vue/初级-组件模板引用ref与defineExpose暴露子组件方法.md`
   - *内容*：在 DOM 上绑定 `ref` 获取真实元素；在组件上绑定 `ref` 获取子组件实例；`<script setup>` 默认封闭性；使用 `defineExpose` 显式暴露属性与方法供父组件调用（如表单校验、弹窗打开）。
10. `doc/Vue/初级-新手常见报错排查指南与控制台Warning根治SOP.md`
    - *内容*：初学者 8 大常见报错：`Cannot read properties of undefined`（可选链 `?.` 与 v-if 守护）、`Invalid prop type check failed`、模板死循环更新、解构丢失响应、scoped 样式修改第三方组件无效（`:deep()` 解决）。

---

### 梯队二：中级进阶·组件架构、响应式与业务工程实战（10 篇）
11. `doc/Vue/中级-组合式API对比选项式API与自定义Hooks复用实战.md`
    - *内容*：Composition API 核心设计哲学；为什么弃用 Vue 2 Mixin；如何抽离生产级自定义 Hooks（`useRequest` 接口请求、`useTablePagination` 表格分页、`useWindowSize` 响应式屏幕）。
12. `doc/Vue/中级-响应式核心API选型ref与reactive及toRef-toRefs避坑.md`
    - *内容*：`ref` 与 `reactive` 选型指南；为什么解构 reactive 会导致响应丢失；`toRef` 与 `toRefs` 解决解构难题；`shallowRef` 与 `shallowReactive` 大数据量性能优化；`readonly` 防篡改。
13. `doc/Vue/中级-跨层级组件通信provide-inject与全局事件总线替代方案.md`
    - *内容*：`provide` 与 `inject` 依赖注入原理；如何让注入数据保持响应式；为什么 Vue 3 移除了 `$on` / `$off`；全局事件总线替代方案：mitt 轻量级事件库接入与组件注销防泄漏。
14. `doc/Vue/中级-动态组件与内置组件KeepAlive-Teleport-Suspense全解.md`
    - *内容*：`<component :is="...">` 动态组件；`<KeepAlive>` 页面与组件缓存（`include`、`exclude`、`max`，独有的 `onActivated` / `onDeactivated` 钩子）；`<Teleport>` 传送门将模态框挂载至 body；`<Suspense>` 异步加载骨架屏。
15. `doc/Vue/中级-组件高级v-model多绑定与defineModel宏深度实战.md`
    - *内容*：自定义组件 `v-model` 机制（`modelValue` 与 `update:modelValue`）；一个组件绑定多个 `v-model:title` 和 `v-model:visible`；Vue 3.4+ 新特性 `defineModel` 宏的底层语法糖展开与生产实战。
16. `doc/Vue/中级-VueRouter4核心实战动态路由参数传递与导航守卫.md`
    - *内容*：`createRouter` 与 `createWebHistory` / `createWebHashHistory`；页面跳转 `push` 与 `replace`；传参 `query`（URL 明文携带）vs `params`（动态路由匹配与内存隐式传参刷新丢失破局）；全局前置守卫 `beforeEach` 登录拦截与 Token 鉴权；路由懒加载分包。
17. `doc/Vue/中级-Pinia现代化状态管理核心实践对比Vuex4.md`
    - *内容*：Pinia 为什么废弃了 Mutation？State、Getters、Actions 核心用法；Options Store 与 Setup Store 两种写法的选型；`$patch` 批量修改与 `$reset` 重置；解构 Store 状态为什么必须使用 `storeToRefs`；持久化插件接入。
18. `doc/Vue/中级-异步更新与nextTick的业务实战与DOM更新时序.md`
    - *内容*：为什么修改响应式数据后，下一行代码获取 DOM 仍然是旧值？Vue 内部微任务合批机制；`nextTick` 核心实战场景（弹窗弹出后 input 自动聚焦、ECharts 数据更新后 resize、滚动条自动滚到底部）；`await nextTick()` 规范写法。
19. `doc/Vue/中级-Axios企业级封装请求拦截响应处理与Token传递.md`
    - *内容*：Axios 实例二次封装；请求拦截器统一携带 `Authorization: Bearer <token>`；响应拦截器统一处理 200/401/403/500 业务状态码与统一错误提示；开发环境 Vite `server.proxy` 解决本地浏览器跨域的物理机制。
20. `doc/Vue/中级-表单组件库集成与复杂数据校验实战.md`
    - *内容*：企业级管理后台中 Element Plus / Ant Design Vue 表单集成；动态表单渲染（动态增删表单项）；异步校验规则（如检查用户名是否存在）；表单联动重置与性能优化。

---

### 梯队三：高级深水·底层源码、Diff 算法与现代工程化（10 篇）
21. `doc/Vue/高级-Vue3响应式内核底层架构WeakMap依赖图谱与effect源码.md`
22. `doc/Vue/高级-Computed与Watch底层机制版本号演进与竞态取消.md`
23. `doc/Vue/高级-自定义响应式customRef与toRaw-markRaw防御代理.md`
24. `doc/Vue/高级-模板编译器AST解析transform与代码生成Codegen逐行推导.md`
25. `doc/Vue/高级-BlockTree靶向更新PatchFlags位掩码与静态提升优化.md`
26. `doc/Vue/高级-Vue3.4+新特性VaporMode无虚拟DOM与宏展开底层.md`
27. `doc/Vue/高级-VNode数据结构ShapeFlags位运算与createRenderer自定义渲染器.md`
28. `doc/Vue/高级-Vue2双端Diff算法4指针演进推导与key物理作用.md`
29. `doc/Vue/高级-Vue3快速Diff最长递增子序列LIS算法贪心二分数学推导.md`
30. `doc/Vue/高级-组件实例化全时序setupStatefulComponent与renderEffect.md`

---

### 梯队四：资深架构·微前端/SSR/工程化/APM性能攻防（10 篇）
31. `doc/Vue/资深-微前端架构qiankun与无界Wujie双沙箱机制与Vue3多应用协同.md`
32. `doc/Vue/资深-SSR服务端渲染Nuxt3架构renderToString与Hydration水合失败破局.md`
33. `doc/Vue/资深-Nuxt3同构状态管理useAsyncData去重序列化与SSR内存泄漏四大陷阱.md`
34. `doc/Vue/资深-Vite按需编译esbuild预构建与HMR热更新WebSocket协议.md`
35. `doc/Vue/资深-Rollup打包优化Tree-Shaking物理条件与manualChunks分包SOP.md`
36. `doc/Vue/资深-企业级Monorepo组件库架构pnpm-workspace与Changesets.md`
37. `doc/Vue/资深-前端内存泄露深度排查HeapSnapshot分析脱离DOM节点.md`
38. `doc/Vue/资深-核心性能指标Web-Vitals监控LCP-INP-CLS与长任务治理.md`
39. `doc/Vue/资深-线上异常监控Sentry集成SourceMap逆向还原与白屏治理.md`
40. `doc/Vue/资深-虚拟列表VirtualList高性能无限滚动动态高度与二分查找.md`

---

### 梯队五：阶梯式全通关真题库（3 篇，共 150 题）
41. **`doc/Vue/Vue全阶段面试通关-初级基础50题标准对标.md`**
    - 针对初学者与 0~2 年经验：指令使用、v-if/v-show、computed/watch、props/emit、插槽、生命周期、v-model、scoped 样式、Vue3 对比 Vue2 基础特性等 50 题。
42. **`doc/Vue/Vue全阶段面试通关-中级实战50题标准对标.md`**
    - 针对 2~3 年中级开发：Hooks 抽离、ref/reactive 选型与踩坑、provide/inject、KeepAlive 缓存、VueRouter 传参/守卫、Pinia 实战、nextTick 时序、Axios 拦截封装、动态表单等 50 题。
43. **`doc/Vue/Vue全阶段面试通关-高级资深架构50道连环炮全景通关.md`**
    - 针对 3~5 年及以上资深/架构：Proxy/WeakMap 依赖图谱、PatchFlags、LIS 最长递增子序列 Diff、微前端双沙箱、SSR 水合失败、Vite HMR、HeapSnapshot 内存排查、安全攻防等 50 道连环追问与标准应答。
