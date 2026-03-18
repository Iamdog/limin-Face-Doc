---
title: Android 自定义View
---

# Android 自定义View

自定义 View 是中高级 Android 面试常见题，通常会问测量、布局、绘制流程，以及 `onMeasure()`、`onLayout()`、`onDraw()` 的职责区别。

## 1. 为什么要自定义 View？

- 系统控件无法满足特殊视觉或交互需求。
- 需要复用复杂组件。
- 需要更细粒度的绘制和性能控制。

## 2. 自定义 View 的三种常见方式

### 2.1 继承已有控件

- 适合在现有控件基础上小改功能。
- 成本最低。

### 2.2 组合已有控件

- 用自定义布局把多个控件封装成一个组件。
- 适合业务组件化。

### 2.3 直接继承 View / ViewGroup

- 自己处理绘制和布局。
- 灵活度最高，也最考验基础。

## 3. View 绘制流程

核心是三步：

1. `measure`
2. `layout`
3. `draw`

面试里通常简称为 `measure-layout-draw`。

## 4. `onMeasure()` 做什么？

- 负责测量控件宽高。
- 需要结合父容器传下来的 `MeasureSpec` 计算最终尺寸。
- 如果是自定义 ViewGroup，还要测量子 View。

## 5. `MeasureSpec` 有哪三种模式？

- `EXACTLY`：父容器已经明确大小。
- `AT_MOST`：子 View 不能超过某个最大值。
- `UNSPECIFIED`：父容器不限制大小。

## 6. `onLayout()` 做什么？

- 主要用于 ViewGroup 摆放子 View 的位置。
- 普通自定义 View 一般不需要重写。

## 7. `onDraw()` 做什么？

- 负责实际绘制内容。
- 常配合 `Canvas`、`Paint`、`Path` 使用。
- 不要在这里频繁创建对象，否则容易造成抖动和 GC。

## 8. 为什么 `invalidate()` 和 `requestLayout()` 不一样？

- `invalidate()` 触发重绘，主要走 draw。
- `requestLayout()` 触发重新测量和布局，通常会导致 measure/layout/draw 全流程。

## 9. 自定义 View 常见性能问题

- `onDraw()` 里创建大量对象。
- 频繁触发 `requestLayout()`。
- 过度复杂的 Path/Shader 计算。
- 没有处理好硬件加速兼容。

## 10. 常见面试题

### Q1: `wrap_content` 为什么在自定义 View 中常常失效？
A: 因为如果你不在 `onMeasure()` 中处理自己的默认尺寸，系统可能只能按父容器给的约束走，导致表现不符合预期。

### Q2: `invalidate()` 一定会触发 `onMeasure()` 吗？
A: 不一定。它主要是请求重绘；真正涉及尺寸或位置变化时，更关键的是 `requestLayout()`。

### Q3: 自定义 ViewGroup 最关键的方法是什么？
A: `onMeasure()` 和 `onLayout()`。前者负责测量子 View，后者决定子 View 的摆放位置。

### Q4: 为什么不建议在 `onDraw()` 里 new 对象？
A: 因为 `onDraw()` 可能高频执行，频繁分配对象会带来内存抖动和 GC，影响流畅度。

### Q5: 自定义 View 如何支持自定义属性？
A: 通常通过 `attrs.xml` 声明属性，在构造函数中通过 `obtainStyledAttributes()` 读取。

## 11. 小结

自定义 View 的面试核心是流程和职责：`onMeasure` 定大小，`onLayout` 定位置，`onDraw` 负责画。只要这三层边界讲清楚，再补一点性能意识，回答就比较完整。
