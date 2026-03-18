---
title: Android RecyclerView源码与缓存深挖
---

# Android RecyclerView源码与缓存深挖

这篇是 `RecyclerView` 文档的深入版，面向中高级面试常问的缓存命中路径和性能细节。

## 1. 核心角色

- `RecyclerView`：容器与调度入口。
- `Adapter`：数据绑定。
- `LayoutManager`：布局与回收策略。
- `Recycler`：缓存管理核心。
- `RecycledViewPool`：跨列表复用池。

## 2. 缓存层级回顾

- `mAttachedScrap` / `mChangedScrap`
- `mCachedViews`
- `ViewCacheExtension`
- `RecycledViewPool`

面试重点：命中越靠前，复用成本越低。

## 3. 典型取 ViewHolder 路径

1. 先查 Scrap（屏幕内/变更缓存）。
2. 再查 `mCachedViews`。
3. 再查 `RecycledViewPool`（按 `viewType`）。
4. 最后才 `onCreateViewHolder` 新建。

## 4. 为什么 `notifyDataSetChanged()` 代价高

- 失去细粒度更新信息。
- 容易触发全量重绑定与动画退化。
- 对复杂列表会显著放大主线程压力。

## 5. 优化抓手

- `DiffUtil` 做增量更新。
- `setHasStableIds(true)` 提升条目识别稳定性。
- 嵌套列表共享 `RecycledViewPool`。
- 控制 `onBindViewHolder` 逻辑重量。

## 6. 常见面试题

### Q1: RecyclerView 为什么滑动更流畅？
A: 因为它通过多级缓存和按需复用降低了创建和绑定开销。

### Q2: `mCachedViews` 和 `RecycledViewPool` 的区别？
A: 前者是当前 RecyclerView 私有近场缓存，后者可按类型跨 RecyclerView 复用。

### Q3: 为什么有时复用了 ViewHolder 仍会卡？
A: 复用只减少创建成本，若绑定阶段做重逻辑仍会卡顿。

### Q4: 共享池一定有效吗？
A: 不一定。只有 `viewType` 分布和场景匹配时才有明显收益。

### Q5: 列表优化第一优先级是什么？
A: 先减少全量刷新和重绑定，再谈更细节的缓存参数调整。

## 7. 小结

源码题回答要落到“命中路径 + 成本模型 + 可量化优化”，不要只背四级缓存名词。
