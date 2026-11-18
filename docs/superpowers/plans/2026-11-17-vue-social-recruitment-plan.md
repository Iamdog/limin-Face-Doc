# Vue 3 阶梯式全景知识库实施计划（43 篇专题）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打造业界最完整、阶梯最平滑的 Vue 3 知识库，涵盖从初学者核心语法/实战避坑（梯队一 10 篇），中级组件架构/工程实战（梯队二 10 篇），高级源码底层/Diff 算法（梯队三 10 篇），资深微前端/SSR/APM 性能治理（梯队四 10 篇），到初中高三级 150 题通关题库（梯队五 3 篇），全量 43 篇高品质文档。

**Architecture:** 严格遵循 4 维度规范（架构图谱 + 源码/算法推导 + 面试连环追问 + 生产排障 SOP），针对初级专题强化“通俗机制、保姆级代码示例、新手避坑排错”。

**Tech Stack:** Vue 3.4/3.5, TypeScript 5.x, Vite 5/6, Pinia, Vue Router 4, Nuxt 3, qiankun, Wujie, Element Plus, Sentry, VitePress.

**Spec:** `docs/superpowers/specs/2026-11-17-vue-social-recruitment-design.md`

---

## 任务拆解清单

- [ ] **Task 1: 梯队一 初级筑基·零基础快速入门与核心语法实战 (10 篇)**
  - `doc/Vue/初级-Vue3项目初始化与SFC单文件组件结构全解.md`
  - `doc/Vue/初级-模板语法核心指令v-if与v-show物理区别及key机制.md`
  - `doc/Vue/初级-属性与事件绑定v-bind与v-on常用修饰符实战.md`
  - `doc/Vue/初级-表单输入双向绑定v-model基础用法与常用修饰符.md`
  - `doc/Vue/初级-计算属性computed与侦听器watch及methods全方位对比.md`
  - `doc/Vue/初级-Vue生命周期全流程Vue2与Vue3对比及资源清理避坑.md`
  - `doc/Vue/初级-组件基础通信props与emit及单向数据流原则.md`
  - `doc/Vue/初级-插槽Slot默认插槽具名插槽与作用域插槽保姆级教学.md`
  - `doc/Vue/初级-组件模板引用ref与defineExpose暴露子组件方法.md`
  - `doc/Vue/初级-新手常见报错排查指南与控制台Warning根治SOP.md`

- [ ] **Task 2: 梯队二 中级进阶·组件架构、响应式与业务工程实战 (10 篇)**
  - `doc/Vue/中级-组合式API对比选项式API与自定义Hooks复用实战.md`
  - `doc/Vue/中级-响应式核心API选型ref与reactive及toRef-toRefs避坑.md`
  - `doc/Vue/中级-跨层级组件通信provide-inject与全局事件总线替代方案.md`
  - `doc/Vue/中级-动态组件与内置组件KeepAlive-Teleport-Suspense全解.md`
  - `doc/Vue/中级-组件高级v-model多绑定与defineModel宏深度实战.md`
  - `doc/Vue/中级-VueRouter4核心实战动态路由参数传递与导航守卫.md`
  - `doc/Vue/中级-Pinia现代化状态管理核心实践对比Vuex4.md`
  - `doc/Vue/中级-异步更新与nextTick的业务实战与DOM更新时序.md`
  - `doc/Vue/中级-Axios企业级封装请求拦截响应处理与Token传递.md`
  - `doc/Vue/中级-表单组件库集成与复杂数据校验实战.md`

- [ ] **Task 3: 梯队三 高级深水·底层源码、Diff 算法与现代工程化 (10 篇)**
  - `doc/Vue/高级-Vue3响应式内核底层架构WeakMap依赖图谱与effect源码.md`
  - `doc/Vue/高级-Computed与Watch底层机制版本号演进与竞态取消.md`
  - `doc/Vue/高级-自定义响应式customRef与toRaw-markRaw防御代理.md`
  - `doc/Vue/高级-模板编译器AST解析transform与代码生成Codegen逐行推导.md`
  - `doc/Vue/高级-BlockTree靶向更新PatchFlags位掩码与静态提升优化.md`
  - `doc/Vue/高级-Vue3.4+新特性VaporMode无虚拟DOM与宏展开底层.md`
  - `doc/Vue/高级-VNode数据结构ShapeFlags位运算与createRenderer自定义渲染器.md`
  - `doc/Vue/高级-Vue2双端Diff算法4指针演进推导与key物理作用.md`
  - `doc/Vue/高级-Vue3快速Diff最长递增子序列LIS算法贪心二分数学推导.md`
  - `doc/Vue/高级-组件实例化全时序setupStatefulComponent与renderEffect.md`

- [ ] **Task 4: 梯队四 资深架构·微前端/SSR/工程化/APM性能攻防 (10 篇)**
  - `doc/Vue/资深-微前端架构qiankun与无界Wujie双沙箱机制与Vue3多应用协同.md`
  - `doc/Vue/资深-SSR服务端渲染Nuxt3架构renderToString与Hydration水合失败破局.md`
  - `doc/Vue/资深-Nuxt3同构状态管理useAsyncData去重序列化与SSR内存泄漏四大陷阱.md`
  - `doc/Vue/资深-Vite按需编译esbuild预构建与HMR热更新WebSocket协议.md`
  - `doc/Vue/资深-Rollup打包优化Tree-Shaking物理条件与manualChunks分包SOP.md`
  - `doc/Vue/资深-企业级Monorepo组件库架构pnpm-workspace与Changesets.md`
  - `doc/Vue/资深-前端内存泄露深度排查HeapSnapshot分析脱离DOM节点.md`
  - `doc/Vue/资深-核心性能指标Web-Vitals监控LCP-INP-CLS与长任务治理.md`
  - `doc/Vue/资深-线上异常监控Sentry集成SourceMap逆向还原与白屏治理.md`
  - `doc/Vue/资深-虚拟列表VirtualList高性能无限滚动动态高度与二分查找.md`

- [ ] **Task 5: 梯队五 阶梯式全通关真题库 (3 篇，共 150 题)**
  - `doc/Vue/Vue全阶段面试通关-初级基础50题标准对标.md`
  - `doc/Vue/Vue全阶段面试通关-中级实战50题标准对标.md`
  - `doc/Vue/Vue全阶段面试通关-高级资深架构50道连环炮全景通关.md`

- [ ] **Task 6: 侧边栏导航重构与全量构建验证**
  - 重构 `doc/Vue/前言.md`：建立 5 大梯队平滑学习与面试主线
  - 更新 `.vitepress/config.mts`：在 Vue 菜单下构建 5 个清晰的折叠组
  - 执行 `cd /Users/laoliu/Documents/limin-Face-Doc && npm run docs:build` 验证 0 broken links
