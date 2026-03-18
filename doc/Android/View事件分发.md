---
title: Android View事件分发
---

# Android View事件分发

事件分发是 Android 面试的高频考点，核心是搞清楚 `dispatchTouchEvent()`、`onInterceptTouchEvent()`、`onTouchEvent()` 三者关系，以及事件如何在 `Activity`、`ViewGroup`、`View` 之间流转。

## 1. 事件分发的核心方法

### 1.1 `dispatchTouchEvent()`

- 负责分发事件。
- `Activity`、`ViewGroup`、`View` 都有这个方法。
- 事件分发的入口就是它。

### 1.2 `onInterceptTouchEvent()`

- 只有 `ViewGroup` 有。
- 决定是否拦截事件，自己处理而不是继续往子 View 分发。

### 1.3 `onTouchEvent()`

- 负责真正消费事件。
- 返回 `true` 表示当前控件消费了事件。

## 2. 一次点击事件的传递顺序

典型流程：

1. 事件先到 `Activity.dispatchTouchEvent()`。
2. 再传到顶层 `ViewGroup.dispatchTouchEvent()`。
3. `ViewGroup` 判断是否拦截。
4. 如果不拦截，则继续分发给子 `View`。
5. 子 `View` 在 `onTouchEvent()` 中决定是否消费。
6. 如果子 `View` 不消费，事件再向父容器回传。

## 3. `ACTION_DOWN` 为什么特别重要？

- 一组事件以 `ACTION_DOWN` 开始，以 `ACTION_UP` 或 `ACTION_CANCEL` 结束。
- 只有 `DOWN` 被某个 View 消费，后续 `MOVE`、`UP` 才会继续优先分发给它。
- 如果 `DOWN` 没人消费，这组事件后续通常就断了。

## 4. ViewGroup 拦截事件的规则

### 不拦截

- 子 View 有点击、滑动等明确处理需求。
- 常见于按钮点击、列表 item 点击。

### 拦截

- 父容器要处理自己的手势逻辑。
- 典型如外层横向 `ViewPager2` 与内层横向 RecyclerView 的滑动冲突。

## 5. 事件冲突怎么解决？

### 5.1 外部拦截法

- 父容器在 `onInterceptTouchEvent()` 中根据方向、距离、业务判断是否拦截。
- 适合父容器掌控整体手势逻辑。

### 5.2 内部拦截法

- 子 View 在合适时机调用 `requestDisallowInterceptTouchEvent(true)` 请求父容器不要拦截。
- 常用于子控件更清楚自己何时要消费事件的场景。

## 6. `onTouch()`、`onTouchEvent()`、`onClick()` 的关系

执行顺序通常是：

1. `dispatchTouchEvent()`
2. `OnTouchListener.onTouch()`
3. `onTouchEvent()`
4. `OnClickListener.onClick()`

说明：

- 如果 `onTouch()` 返回 `true`，说明已经消费事件，后续 `onTouchEvent()` 和 `onClick()` 可能不会再执行。
- `onClick()` 触发的前提通常是 `DOWN` 和 `UP` 都被正确处理，并且没有滑动中断。

## 7. `requestDisallowInterceptTouchEvent()` 有什么用？

- 子 View 用来告诉父容器“这组后续事件你先别拦截”。
- 常用于嵌套滑动冲突处理。
- 注意它不能影响 `ACTION_DOWN` 的分发，因为 `DOWN` 时父容器还没决定这组事件归属。

## 8. `ACTION_CANCEL` 是什么？

- 表示当前 View 原本在处理这组事件，但中途被父容器拦截或系统取消。
- 收到 `CANCEL` 后，通常要做手势状态重置、动画回滚、资源释放。

## 9. 常见面试题

### Q1: 点击事件为什么先传给 Activity？
A: 因为 PhoneWindow 把 DecorView 挂到 Activity 上，系统输入事件先交给窗口，再从 Activity 往 View 树分发。

### Q2: `dispatchTouchEvent()` 返回值代表什么？
A: 代表这次事件是否被当前层级或其子层级消费。返回 `true` 表示消费，返回 `false` 表示未消费，可能继续向上回传。

### Q3: `onInterceptTouchEvent()` 返回 `true` 会发生什么？
A: 父容器会中断对子 View 的分发，转而自己在 `onTouchEvent()` 里处理事件；如果子 View 已经在处理这组事件，它通常会收到一个 `ACTION_CANCEL`。

### Q4: 为什么 ListView/RecyclerView 里的 Button 有时点不动？
A: 常见原因是父容器或 item 根布局提前消费了事件，或者焦点、点击属性配置不当，导致事件没传到目标按钮。

### Q5: 滑动冲突的本质是什么？
A: 本质是父容器和子控件都认为自己应该消费同一组事件，因此要通过拦截规则或禁止拦截机制来明确归属。

## 10. 小结

事件分发面试不在于死背调用链，而在于能解释清楚“谁分发、谁拦截、谁消费、冲突怎么解”。把 `DOWN`、拦截、回传、`CANCEL` 这几个关键词讲明白，基本就够用了。
