# UniApp全阶段面试通关-中级实战50题标准对标

本篇面向 2~4 年中级移动端与全栈开发工程师，系统梳理 Uni-App 在复杂商业项目中的核心实战考点：条件编译多端治理、全链路组件通信、Pinia 跨端持久化状态机、网络层拦截器与 Token 无感刷新、安全持久化存储、自定义胶囊导航栏、高性能分页加载、通用弹窗架构与防滚动穿透、多端文件上传与图片压缩等 50 道高频面试标准真题与对标解析。

---

### Q1: 条件编译（`#ifdef`）如果过度零散地内联在业务代码中，会带来什么严重后果？如何进行架构治理？
**答**：
**后果**：代码可读性极差，逻辑被切得支离破碎；单测覆盖难度成倍上升；多平台回归测试极易漏测。
**治理策略**：
1. **统一适配层封装（Platform Adapter）**：将平台差异 API 封装进统一的基础服务模块（如 `storageAdapter.ts`、`shareAdapter.ts`），对外暴露统一的方法签名；
2. **多端特异性文件后缀拆分**：利用 Uni-App 支持的文件级条件编译，拆分为 `comp.mp-weixin.vue`、`comp.app.vue`、`comp.h5.vue`，实现物理层面的清晰解耦。

---

### Q2: 条件编译在编译期间是如何工作的？它与运行时通过 `uni.getSystemInfoSync().platform` 做 `if-else` 判断有何本质区别？
**答**：
- **条件编译（Compile-Time）**：在 Webpack/Vite 静态分析 AST 阶段执行。非目标平台的代码在预处理阶段直接被**物理删除**，根本不会打包进最终产物，零增加代码包体积，且语法不兼容的代码不会导致报错。
- **运行时判断（Runtime `if-else`）**：所有分支的代码都会被全量打包进代码包中，占用宝贵的代码体积；且如果在小程序中编写了调用 `window` 或 `plus` 的代码，即使处于 `if (false)` 分支中，也可能在部分平台的语法解析阶段直接引发语法错误。

---

### Q3: Vue 3 中跨多层嵌套组件通信，为什么推荐使用 `provide / inject` 代替多层 `props` 逐层透传（Prop Drilling）？
**答**：
- 逐层透传要求中间所有组件必须显式声明并传递并不属于自身的属性，造成中间组件与底层数据严重耦合，重构成本极高。
- `provide / inject` 实现了**依赖注入（Dependency Injection）**，祖先组件声明 `provide('key', reactiveData)`，任何后代组件无论层级多深，只需调用 `inject('key')` 即可获取响应式数据，彻底解耦中间容器。

---

### Q4: 在 Uni-App 中使用 `uni.$emit` 和 `uni.$on` 全局事件总线，最容易发生的内存泄漏问题是什么？如何彻底避免？
**答**：
**问题**：页面或组件销毁后，若未手动移除事件监听器，闭包引用会导致已销毁的页面实例驻留在内存中无法被 GC 回收；且多次进入该页面会重复注册监听器，导致同一个事件被触发多次。
**规避 SOP**：必须成对使用！在 `onLoad` 中注册 `uni.$on('EVENT_NAME', handler)`，必须在 `onUnload` 页面卸载生命周期中显式调用 `uni.$off('EVENT_NAME', handler)` 进行注销。

---

### Q5: 路由通信中，官方推荐的 `EventChannel` 有何独特优势？它的底层机制是怎样的？
**答**：
**优势**：强绑定于本次 `uni.navigateTo` 打开的两个页面实例之间，天然隔离全局命名空间，页面销毁后通信通道自动随之销毁，完全不存在全局事件总线的监听冲突与内存泄漏隐患。
**机制**：`navigateTo` 返回的 `res.eventChannel` 是一个页面实例间的双向消息管道，基于发布订阅模式，直接在当前页面栈的两个 Page 实例上下文中进行事件分发。

---

### Q6: 为什么 Pinia 比 Vuex 更适合作为 Vue 3 + Uni-App 的全局状态管理库？
**答**：
1. **天然支持 TypeScript**：拥有极其完美的类型推导，无需复杂的类型声明包装；
2. **移除 Mutations**：仅保留 `state`、`getters`、`actions`，同步与异步逻辑统一写在 `actions` 中，大幅精简代码；
3. **极佳的代码分割（Code Splitting）**：每个 Store 都是独立的 Store 模块，未使用的 Store 不会被打包，符合小程序极致包体积优化的要求；
4. **零 `this` 困扰**：全面拥抱 Composition API 风格。

---

### Q7: 在小程序和 App 端，Pinia 状态如何在页面刷新或应用重启后保持持久化？
**答**：
由于跨端平台不存在 Web 标准的 `localStorage`，必须使用支持多端适配的持久化插件（如 `pinia-plugin-persistedstate`），并自定义 `storage` 适配器：
```typescript
createPinia().use(
  createPersistedState({
    storage: {
      getItem: (key) => uni.getStorageSync(key),
      setItem: (key, val) => uni.setStorageSync(key, val)
    }
  })
);
```

---

### Q8: 现代化组件库选型中，wot-design-uni 与传统 uview-plus 相比有哪些现代化技术优势？
**答**：
1. **原生支持 TypeScript**：组件属性、事件与方法提供完善的类型定义与智能补全；
2. **纯 Composition API 架构**：内部全面基于 Vue 3 语法重构，性能开销更低；
3. **极速构建与轻量化**：基于 Vite 驱动，天生支持精准组件级 Tree-Shaking 与按需加载，编译体积更小；
4. **主题定制能力更现代化**：支持深色模式（Dark Mode）与 CSS 变量原子化覆盖。

---

### Q9: 为什么直接使用原生 `uni.request` 无法满足企业级项目需求？必须进行二次封装的核心能力有哪些？
**答**：
原生 `uni.request` 仅是一个底层网络传输方法，缺乏企业级生产防护。必须封装的核心能力：
1. **全局统一拦截器（Interceptor）**：统一拼接 BaseURL、超时时间、注入 Token 请求头；
2. **统一响应解包与错误分类**：过滤 HTTP 状态码与业务 Code 错误（如 401、403、500），统一弹窗提示；
3. **防重复提交（Cancel Duplicate Requests）**；
4. **Token 401 自动无感刷新与请求重试队列**；
5. **网络日志上报与埋点集成**。

---

### Q10: 生产级网络层 `luch-request` 拦截器是如何实现请求与响应拦截的？
**答**：
底层通过 Promise 链将请求拦截器、核心请求方法与响应拦截器串联：
- **请求拦截器（Request Interceptor）**：在发送网络包之前修改 `config` 对象（动态读取 Storage 中的 Token 注入 `Authorization` 头，或者在无网状态下直接 `Promise.reject` 阻断）；
- **响应拦截器（Response Interceptor）**：接收服务端原始回包，根据 `response.statusCode` 和业务 `code` 进行状态分支处理，仅将核心 `data.data` 数据解包后返回给业务调用方。

---

### Q11: 详述什么是“Token 无感刷新（Silent Token Refresh）”？其核心逻辑与时序是什么？
**答**：
**定义**：当 AccessToken 过期导致接口返回 401 时，前端在用户完全无感知的情况下，自动使用 RefreshToken 发起换票请求拿到全新 AccessToken，并将此前因 401 失败的所有业务请求自动重新发起并成功返回。
**核心时序**：
1. 收到 401 响应；
2. 判断当前是否正在刷新 Token（`isRefreshing` 标记）；
3. 若否，置 `isRefreshing = true`，发起换票请求；
4. 若是，将并发的其他 401 请求包装为 Promise 放入挂起队列（`requestsQueue`）；
5. 换票成功后，更新本地 Token，遍历执行挂起队列重发请求；置 `isRefreshing = false`。

---

### Q12: 如果页面首次加载时有 10 个业务请求并发发出，且此时 Token 恰好过期，如何防止触发 10 次刷新 Token 接口？
**答**：
**使用互斥锁与挂起队列机制**：
维护一个单例状态 `isRefreshing = false` 和一个等待回调队列 `subscribers = []`。
当第一个 401 到达时，`isRefreshing` 置为 `true` 并调用刷新接口；后续 9 个 401 请求到达时，检测到 `isRefreshing === true`，不再发起刷新请求，而是返回一个全新的 Promise，并将 `(token) => retryRequest(token)` 存入 `subscribers` 队列中。刷新成功后，调用每个等待函数重试请求。

---

### Q13: 在多端环境下，`uni.getStorageInfoSync()` 能返回哪些关键信息？各平台单应用存储上限通常是多少？
**答**：
- **返回信息**：当前占用的空间大小（`currentSize`，单位 KB）、最大限制空间大小（`limitSize`，单位 KB）、以及所有已存的键名列表（`keys`）。
- **平台存储上限**：
  - 微信小程序：单 key 上限 1MB，单个小程序总存储上限为 **10MB**；
  - 支付宝小程序：同样通常限制为 10MB；
  - App 端：依赖原生存储（如 SQLite/文件系统），通常可使用几百 MB 甚至受限于手机整机磁盘容量。

---

### Q14: 为什么说不能无节制地将大 JSON 数据塞入小程序的 Storage 中？
**答**：
小程序的 `setStorageSync` 是同步阻塞调用，且底层需要将 JS 对象进行 JSON 序列化并跨线程写入持久化介质。当写入几十 KB 到几 MB 的大对象时，会导致渲染主线程被严重卡住数十毫秒，直接引发页面丢帧甚至明显的卡死感知。

---

### Q15: 本地缓存如果存储了用户的敏感身份信息（如手机号、实名卡号），如何做安全加固？
**答**：
1. **前端非对称或 AES 加密存储**：在调用 `setStorageSync` 前，通过轻量级 `crypto-js` 使用 AES 结合设备动态指纹加盐加密；
2. **内存级缓存隔离**：时效性极强的敏感凭据仅保存在 Pinia 内存中，不落地到磁盘 Storage；
3. **App 端使用原生高安全加密库**：App 端集成原生 MMKV 或 iOS Keychain / Android Keystore 插件，防止手机越狱或抓包被导出。

---

### Q16: 自定义顶部导航栏（CustomNavBar）在各机型上对齐小程序胶囊按钮的计算公式是什么？
**答**：
1. 获取系统状态栏高度：`statusBarHeight = uni.getWindowInfo().statusBarHeight || 20`；
2. 获取小程序右上角胶囊物理矩形信息：`menu = uni.getMenuButtonBoundingClientRect()`；
3. **导航栏内容高度**：`navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height`；
4. **自定义导航总高度**：`totalHeight = statusBarHeight + navBarHeight`。

---

### Q17: 在 Android 平台某些低端机型上，为什么调用 `uni.getMenuButtonBoundingClientRect()` 会返回全部为 0 的异常结果？如何做防御式兜底？
**答**：
**原因**：Android 客户端在初次冷启动初始化时，原生胶囊控件的尺寸计算时序偶尔晚于小程序的 `onLaunch` / `onLoad`，导致直接调用返回了未就绪的默认 0 值。
**兜底 SOP**：
检测若 `menu.height === 0` 或 `menu.top === 0`，立即触发保底逻辑：
固定预设状态栏为 `24px`，导航栏内容高度固定为 `44px`（iOS）或 `48px`（Android），确保导航条不塌陷。

---

### Q18: 为什么全面屏手机底部需要做“安全区适配（Safe Area Insets）”？如何用纯 CSS 解决？
**答**：
**原因**：iPhone X 及现代全面屏手机底部存在虚拟指示横条（Home Indicator），若页面底部操作栏（如结算按钮、输入框）不避让，会被横条遮挡或导致用户误触系统手势。
**CSS 终极解决方案**：
```css
.bottom-bar {
  padding-bottom: constant(safe-area-inset-bottom); /* 兼容 iOS < 11.2 */
  padding-bottom: env(safe-area-inset-bottom);      /* 标准规范 iOS >= 11.2 */
}
```

---

### Q19: 自定义导航栏页面在页面滚动时，如何实现“随着页面下拉，导航栏背景色由完全透明平滑渐变为纯白色”？
**答**：
1. 页面声明 `onPageScroll(e)` 监听页面滚动距离 `scrollTop`；
2. 计算渐变不透明度系数：`opacity = Math.min(1, Math.max(0, scrollTop / threshold))`（通常 `threshold = 150`）；
3. 将计算出的 `opacity` 动态绑定到导航栏背景层：`background-color: rgba(255, 255, 255, ${opacity})`，同时动态反色标题文字与返回图标颜色。

---

### Q20: 在封装下拉刷新组件时，为什么有了原生 `onPullDownRefresh` 还要使用自定义组件模拟？
**答**：
- **原生 `onPullDownRefresh` 的局限**：动画样式仅有系统默认的三颗小圆点，样式无法深度定制（无法修改为品牌 Logo 动效、无法在局部区域下拉）；
- **自定义组件模拟的应用场景**：如页面上半部是轮播 Banner，中间是 Tab 选项卡，需要针对当前 Tab 的 `<scroll-view>` 单独实现局部吸顶与局部下拉刷新，此时原生页面级下拉刷新无法满足细粒度交互。

---

### Q21: 下拉刷新与触底加载分页组件中，如何定义“分页状态机（Pagination State）”？
**答**：
定义 4 种互斥状态：
1. `INIT`：初始加载态（骨架屏展示）；
2. `LOADING`：正在请求下一页数据（展示底部 Spin 转圈）；
3. `NOMORE`：已加载全部数据（展示“没有更多了~”）；
4. `EMPTY`：首屏请求回包为空（展示空状态缺省插画）；
5. `ERROR`：接口报错异常态（展示点击重新加载按钮）。

---

### Q22: 分页请求中，如何防止用户快速连续下拉触底触发“并发重复请求”导致数据错乱重复？
**答**：
在触发拉取前增加前置状态锁拦截：
```typescript
if (loading.value || isFinished.value) return;
loading.value = true;
try {
  await fetchPageData();
} finally {
  loading.value = false;
}
```

---

### Q23: 什么是“移动端滚动穿透（Scroll Through）”？在弹出 Modal/Popup 弹窗时它如何表现？
**答**：
**表现**：当页面弹出全屏遮罩弹窗（Modal）后，用户用手指在弹窗内部上下滑动时，弹窗背后的页面背景内容依然跟随上下滚动，甚至导致整个页面产生恶心的橡皮筋回弹效果。

---

### Q24: 在 Uni-App 中，彻底根治弹窗“滚动穿透”的三大手段是什么？各自优缺点是什么？
**答**：
1. **手段 A（`@touchmove.stop.prevent`）**：在遮罩层标签上增加触摸事件拦截。
   - *优缺点*：最简单；但若弹窗内部本身有滚动长内容，内部滚动也会被一并误杀失效。
2. **手段 B（动态锁定 `page-meta`）**：
   通过 `<page-meta :page-style="isModalOpen ? 'overflow: hidden;' : ''" />` 在弹窗打开时直接将根页面样式设为不可滚动。
   - *优缺点*：标准彻底，不影响弹窗内部 `<scroll-view>`，但部分旧平台存在兼容延迟。
3. **手段 C（弹窗内使用 `<scroll-view>` 容器）**：遮罩层拦截 Touch，可滑动区域显式放入 `scroll-view` 中。

---

### Q25: 封装通用弹窗体系时，如何实现命令式调用（如 `Dialog.confirm({ title: '确认删除?' })`）？
**答**：
- 在 Web 端可通过动态 `createVNode` + `render` 挂载到 `document.body`；
- 在小程序无 DOM 环境下，无法动态向页面树追加真实 DOM 节点。
- **小程序环境通用架构**：在页面顶层引入全局弹窗组件，内部通过 Pinia 或事件总线监听控制其显隐，将调用封装为返回 Promise 的工具函数：`showDialog(options).then(...)`。

---

### Q26: `uni.chooseImage` 与新版 `uni.chooseMedia` 有何区别？为什么推荐使用 `chooseMedia`？
**答**：
- `uni.chooseImage`：传统 API，仅支持选择图片，功能单一，底层在 Android 高版本机型上偶发内存溢出崩溃。
- `uni.chooseMedia`：微信及现代平台推荐规范，统一支持选择图片与视频，支持直接获取媒体缩略图、压缩率更高、性能更优、且提供了更安全的前端权限生命周期流转。

---

### Q27: 用户在手机端直接用高清相机拍摄的照片体积通常达到 5MB~15MB，直接上传会导致什么生产后果？
**答**：
1. 消耗用户宝贵流量，弱网环境下上传极易超时失败；
2. 企业云对象存储（OSS/COS）带宽成本与存储费用暴增；
3. 移动端直接将超大图片加载进 Canvas 时极易触发内存溢出（OOM）闪退。

---

### Q28: 在前端如何使用 HTML5 / Canvas 对图片进行高质量自适应压缩？
**答**：
1. 利用 `uni.getImageInfo` 获取图片原始物理宽高；
2. 设定最大安全尺寸阈值（如最大宽/高 1920px），按等比缩放计算目标宽高；
3. 创建 2D Canvas，利用 `ctx.drawImage` 将大图绘制到缩小后的画布中；
4. 调用 `uni.canvasToTempFilePath` 并传入压缩质量参数 `quality: 0.8` 导出优化后的 JPG 位图。

---

### Q29: `uni.uploadFile` 默认是一次性上传单个文件还是支持多文件并发批量上传？
**答**：
`uni.uploadFile` 底层规范是单次上传单个文件（参数为 `filePath`）。在 App 端和某些平台虽然提供了 `files` 参数，但在各大主流小程序中存在严重平台不兼容。
**生产级多文件上传方案**：在前端封装并发调度器，利用 `Promise.all` 或并发池控制（如限制最大并发数为 3），循环调用 `uni.uploadFile`。

---

### Q30: 移动端大文件上传时，如果发生网络中断，如何实现“断点续传（Resumable Upload）”？
**答**：
1. **客户端文件切片（Blob.slice / FileSystemManager.readFile）**：将文件按固定尺寸（如 2MB）切分成 N 个数据分片；
2. **计算文件特征哈希**：通过 SparkMD5 计算文件的整体唯一指纹；
3. **握手检查已传分片**：向后端发起检查接口，后端返回已接收成功的分片索引列表；
4. **仅上传未完成的分片**；
5. **全部完毕后发送合并请求**。

---

### Q31: 在微信小程序中，如何在页面中监听用户右上角原生点击“转发分享（onShareAppMessage）”？
**答**：
在页面逻辑中必须显式定义 `onShareAppMessage` 页面生命周期函数：
```typescript
import { onShareAppMessage } from '@dcloudio/uni-app';

onShareAppMessage((res) => {
  // res.from 可以区分是点击页面内 button 还是点击右上角菜单
  return {
    title: '推荐给你这篇社招必考进阶干货！',
    path: '/pages/detail/index?id=123',
    imageUrl: 'https://cdn.corp.com/share.png'
  };
});
```

---

### Q32: 为什么自定义分享的 `path` 路径中，强制要求以斜杠 `/` 开头？漏写会导致什么 Bug？
**答**：
微信底层路由规范规定：小程序的分享跳转绝对路径必须以 `/` 开头（如 `/pages/index/index`）。如果漏写斜杠写成 `pages/index/index`，在 Android 微信中能够容错解析，但在 iOS 微信中会被解析为相对路径导致找不到页面，直接重定向回小程序首页白屏。

---

### Q33: 如何限制某个页面只能通过特定的卡片分享打开，而禁止直接在右上角胶囊菜单中“转发给好友”？
**答**：
在页面 `onLoad` 中调用微信原生隐藏菜单 API：
```typescript
// #ifdef MP-WEIXIN
wx.hideShareMenu({
  menus: ['shareAppMessage', 'shareTimeline']
});
// #endif
```

---

### Q34: 微信小程序中的 `wx.showToast` 与 `wx.showLoading` 有什么互斥陷阱？
**答**：
`showToast` 和 `showLoading` 底层共用同一个原生弹窗宿主视图。
如果在执行 `uni.hideLoading()` 之后立即同步调用 `uni.showToast()`，在部分低版本真机上，`hideLoading` 的异步关闭事件会直接把刚刚弹出的 `showToast` 强行冲刷关闭，导致用户根本看不到 Toast 提示。
**解决**：确保在 `showToast` 前使用 `setTimeout` 延迟 50ms 触发，或封装统一的交互管理器。

---

### Q35: 如何实现跨组件的 `v-model` 双向数据绑定？Vue 3 规范写法是怎样的？
**答**：
在 Vue 3 中，默认的 prop 名称为 `modelValue`，默认触发事件为 `update:modelValue`：
```vue
<!-- 父组件 -->
<MyInput v-model="searchText" />

<!-- 子组件 -->
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{(e: 'update:modelValue', val: string): void}>();

const onInput = (e: any) => {
  emit('update:modelValue', e.detail.value);
};
</script>
```

---

### Q36: 什么是防抖（Debounce）与节流（Throttle）？在移动端交互中各自典型应用场景是什么？
**答**：
- **防抖（Debounce）**：高频触发事件后，只有在设定的延迟时间内没有再次触发，才执行一次。
  *典型场景*：搜索框输入联想（用户停笔 300ms 后再请求接口）。
- **节流（Throttle）**：高频触发事件时，在设定的时间窗口内只允许执行一次。
  *典型场景*：页面滚动监听 `onPageScroll`、按钮防快速连击点击提交。

---

### Q37: 在 Vue 3 组合式 API 中，如何编写一个自定义 Hook（如 `usePagination`）？
**答**：
```typescript
export function usePagination(apiFn: (page: number) => Promise<any[]>) {
  const list = ref<any[]>([]);
  const page = ref(1);
  const finished = ref(false);
  const loading = ref(false);

  const loadMore = async () => {
    if (loading.value || finished.value) return;
    loading.value = true;
    try {
      const res = await apiFn(page.value);
      if (res.length === 0) finished.value = true;
      else {
        list.value.push(...res);
        page.value++;
      }
    } finally {
      loading.value = false;
    }
  };

  return { list, finished, loading, loadMore };
}
```

---

### Q38: 为什么在 CSS 中使用 `transform: translate3d(0, 0, 0)` 或 `will-change: transform` 能提升滚动和动画的流畅度？
**答**：
强制触发了浏览器的**硬件加速（GPU Hardware Acceleration）**机制。排版引擎会将该元素提升为一个独立的**复合层（Compositing Layer）**，后续的位置变换由 GPU 直接进行纹理贴图合成，完全不触发主 CPU 线程的重排（Layout）与重绘（Paint），极大保证 60FPS 满帧运行。

---

### Q39: 在移动端列表中，如果图片没有显式设置固定宽高，为什么会导致严重的滚动掉帧（Jank）？
**答**：
当图片在滚动过程中异步加载完成解码时，原本高度为 0 的节点瞬间被撑大，导致整个页面文档流发生剧烈的**重排（Reflow / Relayout）**，触发所有后续节点重新计算物理坐标。海量重排瞬间堵塞渲染主线程，造成掉帧。必须在加载前预设固定宽高或纵横比占位。

---

### Q40: 为什么使用 `uni.showModal` 时，点击蒙层外部无法关闭弹窗？
**答**：
`uni.showModal` 调起的是操作系统或宿主小程序原生的系统级对话框，遵循严格的确认/取消行为约定，原生未暴露点击蒙层关闭的 API。如果业务需要“点击外部遮罩关闭”，必须使用自定义的 Vue 弹窗组件（如 `<uni-popup>`）。

---

### Q41: 在 Uni-App 中如何实现多语言国际化（i18n）？
**答**：
1. 集成 `vue-i18n`（Vue 3 对应 v9+）；
2. 建立语言包字典（`locales/zh-Hans.json`、`locales/en.json`）；
3. 在 `main.ts` 中注册 i18n 实例；
4. 语言切换时，调用 `uni.setStorageSync('LOCALE', lang)` 并更新 `i18n.global.locale`；
5. 同时调用 `uni.setNavigationBarTitle` 动态刷新当前页面的原生标题文字。

---

### Q42: 页面销毁前，如果有正在进行的网络请求，如何通过 `RequestTask.abort()` 取消？
**答**：
`uni.request` 执行时会返回一个 `RequestTask` 请求任务对象：
```typescript
let task: UniApp.RequestTask | null = null;

onMounted(() => {
  task = uni.request({ url: '/api/data', success: (res) => { ... } });
});

onUnload(() => {
  // 页面离开时直接中断正在进行的 HTTP 连接，节约网络资源
  if (task) task.abort();
});
```

---

### Q43: 移动端点击事件（Click）在移动浏览器历史上存在经典的“300ms 延迟”，Uni-App 是如何消除的？
**答**：
300ms 延迟是早期移动端浏览器为了等待判断用户是否会进行“双击缩放屏幕”而刻意留出的时间窗口。
Uni-App 在编译到各端时：
- 小程序和 App 原生端根本不存在双击缩放行为，直接使用原生 Touch 手势触发；
- 在 H5 端通过在 HTML Viewport Meta 标签中设置 `user-scalable=no` 或 `width=device-width`，浏览器内核会自动禁用双击缩放，彻底消除 300ms 延迟。

---

### Q44: 在组件中，`defineProps` 的默认值如何优雅声明？
**答**：
使用 Vue 3 官方推荐的 `withDefaults` 编译宏：
```typescript
interface Props {
  title?: string;
  count?: number;
}
const props = withDefaults(defineProps<Props>(), {
  title: '默认标题',
  count: 0
});
```

---

### Q45: 为什么在小程序端，不能通过 `window.location.search` 获取页面 URL 参数？
**答**：
小程序双线程逻辑层运行在没有宿主浏览器 BOM/DOM 环境的沙箱中（如 iOS 的 JSCore，Android 的 V8），全局环境中压根不存在 `window` 和 `document` 对象。所有页面路由参数由小程序底层在执行 `onLoad(query)` 生命周期时作为参数显式注入。

---

### Q46: 什么是富文本解析？在 Uni-App 中展示含有 HTML 标签的后台商品详情，推荐什么方案？
**答**：
1. 简单的 HTML 标签可直接使用内置组件 `<rich-text :nodes="htmlString" />`（依赖基础库的原生解析能力，性能极佳，但不支持复杂的交互与内嵌事件）；
2. 含有复杂排版、图片预览、音视频、甚至内嵌样式的场景，推荐使用高星开源跨端组件 **`mp-html`**，支持多端渲染与超链接事件拦截。

---

### Q47: 为什么使用 `uni.reLaunch` 会导致当前所有的页面栈全部清空？
**答**：
`reLaunch` 的底层机制是彻底重置整个客户端的 Navigation Controller / Activity 栈，销毁内存中所有存活的页面实例，并重新以指定的目标 URL 初始化首个页面入栈。常用于退出账号登录态、切换全局重大业务模式（如进入商家版/买家版）。

---

### Q48: 移动端 1px 细线边框在高清视网膜屏幕（Retina Display）上为什么看起来很粗？如何优雅解决？
**答**：
**原因**：在 DPR = 2 或 3 的视网膜屏上，CSS 中的 `1px` 逻辑像素实际对应 2 到 3 个物理像素点。
**优雅方案（CSS 伪元素缩放）**：
```css
.border-1px {
  position: relative;
}
.border-1px::after {
  content: "";
  position: absolute;
  left: 0; bottom: 0; width: 100%; height: 1px;
  background-color: #e5e5e5;
  transform: scaleY(0.5); /* DPR=2 时压缩为 0.5px */
  transform-origin: 0 0;
}
```

---

### Q49: 微信小程序对于本地代码包中直接存放的单张静态图片，有什么不成文的建议上限？
**答**：
建议单张图片大小绝对**不要超过 50KB**。
所有大于 50KB 的 Banner 图、背景图必须全量迁移到 CDN 对象存储上通过网络 URL 访问。因为主包仅有 2MB 预算，几张未压缩的高清切图就会直接将主包撑爆。

---

### Q50: 中级开发者在复杂业务开发中最常忽视的“性能瓶颈点”是什么？
**答**：
1. **未在组件卸载（`onUnmounted`）时清理全局事件监听与 `setInterval` 定时器**，导致严重的内存泄漏与后台无意义 CPU 消耗；
2. **在列表中渲染未压缩的大图**，未做宽高占位引发剧烈回流重排；
3. **在频繁触发的事件（如页面滚动、触摸拖拽）中滥用复杂的双向数据绑定与跨组件通信**，未做节流调度。
