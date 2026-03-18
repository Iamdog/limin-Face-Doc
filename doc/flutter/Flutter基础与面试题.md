---
title: Flutter基础与面试题
---

# Flutter基础与面试题

Flutter 是跨平台移动开发中的主流方案。面试核心通常围绕：渲染机制、Widget 体系、状态管理、性能优化与原生通信。

## 1. Flutter 是什么？

- Flutter 是 Google 推出的跨平台 UI 框架。
- 使用 Dart 开发，一套代码可运行在 iOS、Android、Web、Desktop。
- 核心能力是自绘渲染，不依赖系统原生 UI 组件。

## 2. Flutter 为什么性能好？

- 通过 Skia 直接绘制 UI，减少跨平台桥接成本。
- Widget -> Element -> RenderObject 分层明确，更新路径可控。
- 编译模式下支持 AOT，运行时性能更稳定。

## 3. Widget、Element、RenderObject 的关系

- Widget：配置描述，轻量不可变。
- Element：Widget 在树中的实例与上下文，负责生命周期和比对更新。
- RenderObject：真正参与布局、绘制、命中测试。

面试常答法：Widget 是“声明”，Element 是“管理者”，RenderObject 是“执行者”。

## 4. `StatelessWidget` 和 `StatefulWidget`

- `StatelessWidget`：无内部可变状态，依赖外部输入重建。
- `StatefulWidget`：通过 `State` 管理可变状态，调用 `setState` 触发更新。

## 5. Flutter 常见状态管理方案

- `setState`：适合简单页面局部状态。
- `Provider`：轻量、易上手，项目中常见。
- `Riverpod`：依赖管理与测试体验更好，近年热度高。
- `Bloc/Cubit`：强调事件流与可预测状态变更，适合中大型项目。

## 6. Flutter 渲染与布局要点

- 布局采用约束传递模型（Constraints go down, sizes go up）。
- 父组件传约束，子组件在约束内计算尺寸并回传。
- `Row/Column` 常见溢出问题本质是约束不匹配。

## 7. 性能优化高频点

- 减少不必要的 `build` 重复执行，拆分可复用子组件。
- 优先使用 `const` 构造函数。
- 长列表使用 `ListView.builder`，避免一次性构建。
- 图片按需压缩与缓存，避免大图直接解码导致卡顿和内存峰值。
- 使用 `RepaintBoundary` 隔离高频重绘区域。

## 8. Flutter 与原生通信

- 通过 `MethodChannel` 进行 Dart 与原生双向调用。
- 复杂或高频通信可用 `EventChannel` / `BasicMessageChannel`。
- 插件机制可封装平台差异，统一 Dart 层调用。

## 9. 常见面试题

### Q1: Flutter 为什么说是“自绘引擎”？
A: 因为 Flutter 不依赖系统原生控件树，而是通过 Skia 绘制 UI，因此跨平台一致性更强。

### Q2: `setState` 是同步还是异步？
A: `setState` 调用本身是同步标记状态变更，真正的重建由框架在后续帧调度执行。

### Q3: 为什么要尽量多用 `const`？
A: `const` 对象可复用，减少对象创建与无意义重建，有助于降低 GC 和提升构建效率。

### Q4: Flutter 页面卡顿通常先看什么？
A: 先看是否存在大范围重建、布局过深、图片解码过大、主线程耗时任务，再配合 DevTools 的帧分析定位。

### Q5: Flutter 如何做跨端统一又保留平台体验？
A: 通用业务与大部分 UI 用 Flutter，平台差异点通过插件和平台通道下沉到原生层处理。

## 10. 小结

Flutter 面试回答重点是：渲染链路（Widget/Element/RenderObject）、状态管理取舍、性能优化手段、平台通信方案。只要能把这四块讲清楚，基础到中级面试基本覆盖。
