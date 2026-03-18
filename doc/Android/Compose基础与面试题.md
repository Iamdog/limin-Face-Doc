---
title: Android Compose基础与面试题
---

# Android Compose基础与面试题

Jetpack Compose 已经成为现代 Android 的重要方向。面试常问：Compose 和 XML View 的区别、重组是什么、状态如何管理、为什么声明式 UI 更适合现代开发。

## 1. Compose 是什么？

- Compose 是 Android 的声明式 UI 工具包。
- 开发者描述“界面应该是什么样”，而不是手动控制每一步视图更新。

## 2. Compose 和传统 XML + View 的区别

### 传统 View

- 偏命令式。
- 需要手动查找 View、更新属性、处理状态同步。

### Compose

- 偏声明式。
- 状态变化后，UI 自动根据状态重新描述和更新。

## 3. 什么是重组 Recomposition？

- 当 Compose 观察到状态变化时，会重新执行相关 Composable。
- 这个过程叫重组。
- 它不等于整页完全重绘，而是尽量只更新受影响部分。

## 4. Compose 中状态怎么管理？

基础写法：

```kotlin
var count by remember { mutableStateOf(0) }
```

更常见的工程写法：

- 页面状态放在 ViewModel
- UI 层只负责收集状态并渲染

## 5. `remember` 和 `rememberSaveable`

- `remember` 在当前组合期间保存状态。
- `rememberSaveable` 能在配置变更或进程恢复场景下保留可序列化状态。

## 6. 为什么说 Compose 更适合现代 UI？

- 状态驱动 UI，更符合单向数据流。
- 减少模板代码。
- 更适合动画、主题和复杂状态同步。
- 与 Kotlin、协程、Flow 集成更自然。

## 7. Compose 和 View 能混用吗？

- 可以。
- 现有项目经常采用渐进式接入。
- 可以在 Compose 中嵌 View，也可以在传统页面中嵌 Compose。

## 8. 常见面试题

### Q1: Compose 和 RecyclerView 的列表思想有什么不同？
A: RecyclerView 更偏传统复用和命令式更新；Compose 的 LazyColumn 更偏声明式，根据状态描述列表内容。

### Q2: 重组是不是性能问题？
A: 不是。重组是 Compose 的正常机制，关键在于控制状态粒度和避免无意义的大范围重组。

### Q3: 为什么 Compose 仍然需要 ViewModel？
A: 因为 Compose 只是 UI 层方案，不负责完整业务状态持久化和生命周期边界，ViewModel 仍然适合承载页面状态。

### Q4: `remember` 和 `rememberSaveable` 的区别是什么？
A: 前者只在当前组合生命周期内保留状态，后者还能在配置变更后恢复可保存状态。

### Q5: Compose 会完全取代 XML 吗？
A: 长期趋势上占比会越来越高，但大量存量项目仍会长期混用，因此两套体系都值得掌握。

## 9. 小结

Compose 面试题的核心关键词是：声明式、状态驱动、重组、单向数据流、与 ViewModel 配合。把这几个点讲清楚就够了。
