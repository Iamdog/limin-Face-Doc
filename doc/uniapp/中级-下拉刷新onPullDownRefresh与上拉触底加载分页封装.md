# 中级-下拉刷新onPullDownRefresh与上拉触底加载分页封装

在电商流、资讯聚合、社交动态与用户订单列表等 90% 以上的数据驱动场景中，**“下拉刷新（Pull-to-Refresh）” 与 “上拉无限触底加载（Infinite Scroll Pagination）”** 是移动端最具代表性的基础交互范式。

尽管业务逻辑看似简单（重置第一页 vs 页码递增追加列表），但在真实的生产级项目中，常常充斥着各种隐蔽的体验陷阱：**用户快速连续上滑导致 `onReachBottom` 高频并发触发多次、页码乱序错乱、下拉刷新动画在请求结束后死活不缩回、以及网络异常时未做状态回滚导致分页卡死**。

在社招中级技术面试中，面试官将重点考查：**分页状态机的严格原子锁流转、`pages.json` 底层触底距离阈值（`onReachBottomDistance`）的物理调度原理、以及如何将分页逻辑高度抽象为一个即插即用的 Vue 3 组合式 Hook（`usePagination`）？**

---

## 1. 核心底层机制与全景架构

### 1.1 分页状态机核心生命周期时序全景

```mermaid
stateDiagram-v2
    [*] --> Idle: 页面初始挂载 (page=1, list=[])
    
    Idle --> PullRefreshing: 用户下拉触发 onPullDownRefresh()
    PullRefreshing --> FetchingPage1: 重置 page=1, hasMore=true, 清空锁
    FetchingPage1 --> Idle: 接口响应, 更新 list, 显式调用 uni.stopPullDownRefresh()
    
    Idle --> LoadingMore: 滚动触底触发 onReachBottom()
    note right of LoadingMore: 必须前置校验: if (!hasMore || isLoading) return!
    LoadingMore --> FetchingNext: 上锁 isLoading=true, page++
    
    FetchingNext --> Idle: 请求成功, list.push(...newData), 释放锁 isLoading=false
    FetchingNext --> NoMore: 判定 list.length >= total, 标记 hasMore=false
    FetchingNext --> ErrorRollback: 网络异常! 必须回滚 page--, 释放锁
    ErrorRollback --> Idle
```

### 1.2 `pages.json` 核心配置参数矩阵

| 配置属性 | 作用域 | 默认值 | 物理生效机制 |
| :--- | :--- | :--- | :--- |
| **`enablePullDownRefresh`** | 页面 `style` | `false` | **必须显式设为 `true`**。通知原生宿主 WebView 开启顶部下拉弹性阻尼手势与刷新动画。 |
| **`onReachBottomDistance`** | 页面 `style` / 全局 | `50`（单位 px） | **触底距离阈值**。指定页面滚动到底部距离屏幕下方多少距离时触发 `onReachBottom`。建议调整为 **`150`** 实现丝滑无感预加载。 |

---

## 2. 源码级/算法物理推导

### 2.1 触底防暴击并发锁与状态机推导

当用户在手机屏幕上快速用力上滑（Fling 手势）时，惯性滑动会在极短的 100ms 内连续越过多次触底阈值线：
- **无锁灾难现场**：若没有互斥锁，`onReachBottom` 会被**连续调用 3 次**。
  - 请求 1 发送：`page = 2`
  - 请求 2 发送：`page = 3`
  - 请求 3 发送：`page = 4`
- 由于网络波动，`page = 4` 的数据可能最先返回并被拼接到数组中，紧接着 `page = 2` 的数据返回被塞在最后，造成**严重的列表数据乱序与商品重复展示**！

#### 状态机防并发原子方程：
```typescript
async function loadMore() {
  // 核心第一防线：已无更多数据或正在加载中，坚决拦截！
  if (!hasMore.value || isLoading.value) {
    return;
  }
  
  // 核心第二防线：立即上锁
  isLoading.value = true;
  page.value++;

  try {
    const res = await fetchApi({ page: page.value, pageSize: pageSize.value });
    list.value = [...list.value, ...res.records];
    hasMore.value = list.value.length < res.total;
  } catch (err) {
    // 关键第三防线：请求失败必须回滚页码！
    page.value--;
    uni.showToast({ title: '加载失败，请重试', icon: 'none' });
  } finally {
    // 核心第四防线：无论成功失败，在 finally 中安全释放锁
    isLoading.value = false;
  }
}
```

---

## 3. 社招/阶段必考高频硬核连环追问

### 追问 1：为什么在下拉刷新时，有的页面如果遇到接口 500 报错，顶部的加载中圆环就永久悬浮在页面上方不缩回去？

> **答辩深度闭环**：
> 1. **未在 `finally` 中保证复位**：微信小程序和 App 的下拉刷新是**受控原生状态**。当触发 `onPullDownRefresh` 时，原生系统会展开并展示加载动画，**必须由前端显式调用 `uni.stopPullDownRefresh()`，系统才会播放回弹动画并关闭刷新态**。
> 2. **语法疏漏**：很多开发者把 `uni.stopPullDownRefresh()` 仅仅写在接口请求的 `try` 代码块或 `.then()` 中。一旦网络超时或接口抛出 500 异常，执行流跳转到 `catch`，`stopPullDownRefresh` 被完全跳过，导致下拉圆环永久卡死。
> 3. **规避原则**：必须将 `uni.stopPullDownRefresh()` 严格写在 **`finally` 代码块** 中，确保 100% 必定被执行。

---

### 追问 2：为什么很多大厂建议将 `onReachBottomDistance` 默认的 50px 适当调大到 150px 甚至 200px？

> **答辩深度闭环**：
> 1. **默认 50px 的停顿感（Jank）**：如果触底阈值只有 50px，当用户滑到真正贴近底部时系统才开始发起请求。从发包到数据返回（通常耗时 200~400ms），用户会明显滑到底部并停顿等待，破坏了无限滚动的沉浸式流畅感。
> 2. **预加载机制（Pre-fetching）**：将距离调大至 150px~200px 后，当用户浏览到距离底部还剩约 1~2 张卡片的高度时，后台静默网络请求已经提前发射出去。在用户刚好滑到底部的那一瞬间，新数据已经返回并拼装完毕，实现**用户完全无感知的丝滑连续浏览**。

---

### 追问 3：下拉刷新时，究竟应该“先清空旧列表 `list = []` 再发请求”，还是“等新数据返回后再覆盖 `list = res.records`”？为什么？

> **答辩深度闭环**：
> 1. **先清空的灾难体验**：若在下拉瞬间就把 `list.value = []` 清空，屏幕上的所有卡片会瞬间消失，整个页面产生严重的“闪烁与高度瞬间塌陷（Flash of Empty State）”，此时若网络恰好较慢，用户面对的是一片苍白的空白屏幕。
> 2. **生产级标准方案（新数据就绪后直接原子覆盖）**：
>    下拉刷新触发时，**旧数据原封不动继续展示在屏幕上**。当接口成功返回第一页最新数据后，**直接执行原子覆盖赋值**（`list.value = res.records`）。这样既消除了页面白屏闪烁，又能在网络异常失败时保留旧数据供用户继续查看，容灾性最强。

---

## 4. 生产级避坑指南与排障 SOP

### 4.1 生产级企业通用分页 Hook 封装（`usePagination`）

将复杂的状态机与锁逻辑抽离为高内聚、零依赖的通用组合式函数：

```typescript
// composables/usePagination.ts
import { ref } from 'vue';
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';

interface PaginationOptions<T> {
  fetcher: (params: { page: number; pageSize: number }) => Promise<{
    records: T[];
    total: number;
  }>;
  pageSize?: number;
}

export function usePagination<T>(options: PaginationOptions<T>) {
  const list = ref<T[]>([]) as any;
  const page = ref(1);
  const pageSize = ref(options.pageSize || 10);
  const total = ref(0);
  const isLoading = ref(false);
  const hasMore = ref(true);

  // 核心：拉取数据方法
  async function loadData(isRefresh = false) {
    if (isLoading.value) return;
    if (!isRefresh && !hasMore.value) return;

    isLoading.value = true;
    const targetPage = isRefresh ? 1 : page.value + 1;

    try {
      const res = await options.fetcher({
        page: targetPage,
        pageSize: pageSize.value,
      });

      if (isRefresh) {
        // 下拉刷新：原子替换
        list.value = res.records;
        page.value = 1;
      } else {
        // 上拉加载：追加列表
        list.value = [...list.value, ...res.records];
        page.value = targetPage;
      }

      total.value = res.total;
      hasMore.value = list.value.length < total.value;
    } catch (err) {
      console.error('[Pagination Error]:', err);
    } finally {
      isLoading.value = false;
      if (isRefresh) {
        // 确保 100% 安全停止原生下拉刷新动画
        uni.stopPullDownRefresh();
      }
    }
  }

  // 绑定页面级生命周期
  onPullDownRefresh(() => {
    loadData(true);
  });

  onReachBottom(() => {
    loadData(false);
  });

  // 初始加载第一页
  loadData(true);

  return {
    list,
    isLoading,
    hasMore,
    total,
    refresh: () => loadData(true),
    loadMore: () => loadData(false),
  };
}
```

#### 页面中消费（仅需 5 行核心代码！）：
```vue
<template>
  <view class="order-list-page">
    <view v-for="item in list" :key="item.id" class="order-card">
      <text>{{ item.orderNo }}</text>
    </view>

    <!-- 底部状态条 -->
    <view class="footer-status">
      <text v-if="isLoading">正在加载更多数据...</text>
      <text v-else-if="!hasMore && list.length > 0">没有更多了~</text>
      <text v-else-if="list.length === 0 && !isLoading">暂无相关订单</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { usePagination } from '@/composables/usePagination';
import { fetchOrderListApi } from '@/api/order';

// 一行代码挂载全套分页能力
const { list, isLoading, hasMore } = usePagination({
  fetcher: fetchOrderListApi,
  pageSize: 15,
});
</script>
```

### 4.2 分页排错速查表

| 故障现象 | 物理根因 | 生产排查与根治 SOP |
| :--- | :--- | :--- |
| **下拉手势完全拉不动** | 忘记在 `pages.json` 的目标页面 `style` 中配置 `"enablePullDownRefresh": true`。 | 检查 `pages.json`，确保目标页面已显式开启该配置项。 |
| **滑到底部毫无反应** | 页面外层包裹了带有 `height: 100vh; overflow: hidden;` 的死宽容器，阻断了页面级滚动。 | 检查容器 CSS，全屏页面滚动必须允许 `body` / `page` 自然延伸。 |
| **数据被重复加载展示** | 上拉加载未加 `isLoading` 状态锁防重。 | 强制引入上述 `usePagination` 互斥锁模型。 |
