---
title: Pinia 状态管理与面试题
---

# Pinia 状态管理与面试题

## 知识点

- Pinia 是 Vue 官方推荐状态管理库。
- 核心结构：`state`、`getters`、`actions`。
- 支持模块化 store、TypeScript 友好、开发体验优于传统 Vuex 方案。

## 使用建议

- 将页面共享状态与业务动作沉淀到 store。
- 组件内部临时状态仍建议局部管理，避免 store 膨胀。
- store 命名按业务域划分，如 `useUserStore`、`useCartStore`。

## 高频面试题

### 1. Pinia 相比 Vuex 的优势？
答：API 更简洁、类型推导更好、样板代码更少、组合式 API 配合更自然。

### 2. 所有状态都应该放 Pinia 吗？
答：不应该。仅放跨页面/跨组件共享且有业务价值的状态。

### 3. Pinia 的 `actions` 能否异步？
答：可以，`actions` 天然支持异步流程。
