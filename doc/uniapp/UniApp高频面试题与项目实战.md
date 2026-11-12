---
title: Uni-App 高频面试题与项目实战
---

# Uni-App 高频面试题与项目实战

## 使用入口：先解决问题，再做验证

从项目操作到场景处理组织跨端回答。

**先做基本操作**：先做页面、登录、分页和上传练习，保留失败验证，再回答生命周期、分包和运行模型。初次学习可先完成[本模块基础实践](/doc/uniapp/页面开发登录与支付基本实践)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

> **适用范围**：以传统 uni-app（Vue 3）为主，结合微信小程序、H5 和 App 说明差异；具体 API、基础库和发行限制以目标平台及版本的官方文档为准。回答跨端问题时先说清平台、渲染模式和版本。

## 一、架构与跨端基础

### 1. uni-app 是什么？适合什么项目？

uni-app 以 Vue 语法、统一组件和 `uni` API 开发，经编译适配小程序、Web 和 App 等目标。适合业务表单、内容展示、会员商城等多端共享较多的应用；高度依赖原生能力、复杂动画或特定平台能力的项目应先做原型验证，评估原生开发、Flutter 等方案。**代码复用不等于运行行为完全一致**：登录、支付、权限、样式及审核都需要逐端验证。

### 2. 一套代码如何运行在不同平台？

编译器把页面、组件、样式和配置转换为各目标平台可识别的产物；运行时通过统一 API 和组件适配平台能力。无法抹平的差异通过条件编译、平台专属实现或插件处理。回答时分别讲**编译转换、运行时适配、差异兜底**，不要说所有端都运行同一份产物。

### 3. 所有端都是双线程吗？

不是。微信小程序等环境中逻辑层和视图层分离，数据更新存在跨层通信成本；H5 在浏览器中运行，不能照搬小程序的模型；App 还要区分 vue 页面和 nvue 等渲染方式。优化前先确定运行环境，再测量脚本、通信和渲染成本。[官方性能专题](https://uniapp.dcloud.net.cn/tutorial/performance.html)

### 4. 条件编译与运行时判断有什么区别？

条件编译在构建时保留目标平台代码，适合平台专属 API、组件、样式和依赖；运行时判断适合操作系统、设备能力、用户状态等构建时无法确定的条件。条件编译要覆盖降级分支，并分别构建目标端验证；不能用它代替运行时能力检测。

```js
// #ifdef MP-WEIXIN
console.log('微信小程序专属逻辑')
// #endif
```

### 5. `pages.json`、`manifest.json`、`App.vue` 各管什么？

`pages.json` 配置页面、导航、tabBar 和分包等；`manifest.json` 配置应用标识及各平台发行能力；`App.vue` 处理应用生命周期和全局样式等。新增页面先检查页面注册和路径大小写，发行问题再检查目标平台配置。

## 二、生命周期、路由与通信

### 6. 应用、页面和组件生命周期如何区分？

应用生命周期在 `App.vue` 中监听：`onLaunch` 用于应用初始化，`onShow` / `onHide` 对应前后台切换。页面的 `onLoad` 接收路由参数，`onShow` 每次页面显示都会触发，`onReady` 对应首次渲染完成，`onHide` 和 `onUnload` 分别对应隐藏和卸载。普通组件使用 Vue 组件生命周期，不应假设它拥有页面 `onLoad`。不同端和渲染模式的细节应查兼容表。[页面生命周期](https://uniapp.dcloud.net.cn/tutorial/page.html)、[应用生命周期](https://uniapp.dcloud.net.cn/collocation/App.html)

### 7. 为什么从详情页返回列表后数据没有刷新？

返回通常让已有列表页重新显示，而不是重新创建，因此 `onLoad` 不一定再次执行。可在 `onShow` 根据脏标记刷新，或通过事件通知更新指定条目；避免每次显示都无条件请求。事件监听应在适当生命周期解除，防止重复订阅。

### 8. 五种路由 API 如何选择？

| API | 页面栈行为 | 常见用途 |
|---|---|---|
| `navigateTo` | 新页面入栈 | 列表进入非 tabBar 详情 |
| `redirectTo` | 替换当前页 | 中间页完成后跳转非 tabBar 页 |
| `navigateBack` | 返回并移除上层页面 | 详情返回列表 |
| `switchTab` | 切换 tabBar 页面并关闭其他非 tabBar 页面 | 切换主栏目 |
| `reLaunch` | 关闭所有页面并打开目标页 | 登录状态切换后重建入口 |

`navigateTo`、`redirectTo` 不能打开 tabBar 页面；栈深上限及细节以目标平台为准。不要直接修改 `getCurrentPages()` 返回的页面栈。[官方页面路由](https://uniapp.dcloud.net.cn/tutorial/page.html)

### 9. 页面之间怎么传值？

少量非敏感参数可放 URL，使用 `encodeURIComponent` 编码、接收时按约定解码；复杂临时数据可用 `eventChannel`（先核对目标端支持），共享状态可用 Pinia，跨重启数据可用本地存储或服务端。URL 长度受限且可能出现在日志中，不应放 Token 或隐私数据；传递 ID 后重新查询通常更可靠。

### 10. 组件之间怎么通信？

父传子用 props，子传父用 emits；跨多层可用 provide/inject，共享业务状态用 Pinia。事件总线适合少量解耦通知，但要保存回调并及时取消订阅；避免用全局状态承载所有一次性事件。

### 11. `onReady`、`nextTick` 能保证什么？

`onReady` 表示页面首次渲染完成；`nextTick` 等待 Vue 的下一次更新刷新。它们不保证网络图片已加载，也不保证所有平台的原生视图或异步布局已完成。需要尺寸时，在合适时机用 `uni.createSelectorQuery()` 并处理查询结果为空或尺寸尚未稳定的情况。

## 三、网络、登录与状态

### 12. 如何封装 `uni.request`？

统一处理 baseURL、超时、认证头、HTTP 状态与业务错误码，向调用方返回一致的结果或错误；上传下载按各自 API 单独适配。错误要区分网络失败、HTTP 失败和业务失败，保留可排查的信息但避免记录敏感数据；不要把所有失败都提示为「网络错误」。

### 13. 多个请求同时遇到 Token 过期，如何无感刷新？

使用单飞机制：第一个过期请求发起刷新，其他请求等待同一个刷新 Promise；成功后更新凭证并各自重试一次，失败则清理登录状态并统一引导登录。刷新接口排除自身拦截，限制重试次数，避免递归；非幂等操作的重试需要服务端幂等保障。退出登录期间还要防止旧刷新结果覆盖新状态。

### 14. 小程序登录与 H5 登录有什么差异？

小程序通常通过平台登录能力获取临时凭证，由服务端向平台换取用户标识，再签发自己的会话；H5 可采用服务端支持的 Cookie 或 Token 等方案。平台凭证不是业务系统长期登录态，应用密钥应保留在服务端。授权范围、有效期和流程以目标平台最新规则为准。

### 15. Pinia 和本地存储分别适合什么？

Pinia 保存运行期共享状态；`uni.setStorage` / `uni.getStorage` 等用于持久化，跨端存储实现和配额不同。只持久化必要字段，做好版本迁移、过期处理与退出清理；本地存储并非天然安全，敏感凭证要结合平台能力与业务威胁模型设计。

### 16. 网络请求成功就一定是业务成功吗？

不是。先判断请求是否发出并收到响应，再判断 HTTP 状态，最后按接口约定判断业务码；例如 HTTP 200 也可能返回业务失败。重试只针对可恢复错误，设置次数、退避和超时，并确保写操作具备幂等性。

## 四、性能与多端适配

### 17. 小程序长列表卡顿怎么排查？

先在目标真机复现，区分网络慢、逻辑计算、跨层数据更新、图片解码和节点渲染。再按瓶颈分页加载、减少每次更新的数据量和频率、控制节点数量、压缩图片、避免滚动事件触发大量响应式更新；必要时选用适配目标端的虚拟列表。优化前后记录首屏时间、滚动帧率和内存，验证交互及回收是否正常。

### 18. 如何减少逻辑层与视图层通信？

在存在分层通信的目标端，只把展示所需数据放入响应式状态，合并或节流高频更新，避免频繁传递大对象及无关字段。不要机械地认为所有赋值都会触发同样的通信；结合具体框架版本与性能工具观察实际更新。

### 19. 首屏慢如何优化？

先拆解启动、包下载、页面初始化、首屏接口、图片和渲染耗时。关键内容优先，非首屏请求延迟或并行，减少主包和首屏资源，合理缓存并提供骨架屏；在弱网和低端机测量真实可交互时间。骨架屏改善感知，不能代替实际耗时优化。

### 20. 分包解决什么问题？有哪些边界？

分包把非首屏页面及其资源拆离主包，降低首次加载内容；按业务访问路径拆分并检查公共依赖是否仍被主包引用。预下载会消耗网络和存储，应按场景启用。主包、分包大小和数量限制随平台及版本变化，不应把某个历史数字当成所有端的统一限制。

### 21. `rpx`、安全区和不同屏幕如何适配？

`rpx` 适合随屏幕宽度缩放的布局，文字、最大宽度和复杂容器仍需按设计验证；底部固定按钮还要考虑安全区、键盘和横屏。对刘海屏、平板、不同字体缩放和目标平台真机分别测试；不要假定相同 `rpx` 在所有设备视觉效果完全一致。

### 22. 为什么不能直接依赖 `window`、`document` 或任意 npm 包？

小程序逻辑环境不是完整浏览器，依赖 DOM、Node 原生模块或特定浏览器 API 的库可能无法使用。先查目标端兼容性，再选择跨端库、条件编译隔离或平台实现；能安装不代表能在各端运行，必须构建并真机验证。

### 23. `onReachBottom` 不触发怎么办？

先确认滚动的是页面还是内部 `scroll-view`：页面 `onReachBottom` 不等于容器滚动触底，后者应使用对应组件事件。再检查内容高度、阈值及平台差异；分页逻辑增加 `loading`、`hasMore` 防重，失败允许重试，并避免旧请求覆盖新查询结果。

### 24. 微信开发工具正常，真机白屏或请求失败怎么排查？

记录平台、系统、基础库和版本，查看真机日志、发布包与 source map；排查条件编译、路径大小写、运行时 API 兼容、域名白名单、HTTPS 和证书、权限及接口响应。开发工具的校验选项可能掩盖问题，需在真实发布配置和网络环境复测。

## 五、项目场景与追问

### 25. 下拉刷新和分页同时发生，如何避免数据错乱？

刷新时递增请求版本、重置游标和 `hasMore`，仅允许当前版本的响应写入列表；加载下一页加锁，失败不推进游标。刷新结束无论成功失败都要停止刷新动画。服务端数据变动较频繁时优先评估游标分页和稳定排序，避免重复或漏项。

### 26. 登录过期时，用户正在提交订单怎么办？

先判断请求是否已经到达服务端，不能简单重复提交。使用业务唯一请求号和服务端幂等记录，刷新登录后查询订单状态或按幂等协议安全重试；刷新失败时保存必要的草稿并引导登录，避免重复扣款。支付最终状态以服务端异步通知及主动查询为准。

### 27. 如何设计多端支付？

前端按平台选择受支持的支付能力，服务端创建订单并生成对应平台的支付参数；客户端唤起支付后展示处理中，服务端验证回调、幂等更新订单，客户端查询最终结果。取消、超时、重复回调和网络中断都需要处理；密钥与签名校验放在服务端，具体能力和审核要求按平台核验。

### 28. 定位或相机权限被拒绝后怎么办？

先说明业务用途并按平台规则请求权限；用户拒绝时提供可理解的降级方案，必要时引导到平台支持的设置页。区分未授权、已拒绝、系统开关关闭和设备不支持，不要无限弹窗；权限配置、隐私声明和审核要求逐端核对。

### 29. 如何讲一个性能优化项目？

按「**场景与指标 → 定位证据 → 改动与取舍 → 对照结果 → 回归**」回答。例如：某机型长列表滚动卡顿，通过性能工具发现图片解码与大量节点是主要成本；采用分页、缩略图和列表复用后，在同一设备与数据量下对比帧率、内存及首屏耗时。具体数字必须使用自己的真实测量值。

### 30. uni-app 与 uni-app x 有什么区别？

传统 uni-app 主要使用 JavaScript/Vue 生态；uni-app x 引入 UTS、uvue 等技术，目标平台的运行和渲染机制及 API 支持存在差异。两者不能简单视为配置切换：迁移前应按实际目标端核对组件、插件、API、语言约束及成熟度，并用核心业务做验证。本文不展开 uni-app x 的原生实现。

## 面试前快速串讲

1. 用一个实际项目说明目标端、共享比例、平台差异和选型原因。
2. 串起页面注册、生命周期、路由栈与页面通信，说明返回刷新如何处理。
3. 讲清请求封装、登录态、并发刷新和服务端幂等的边界。
4. 选一个首屏或长列表问题，用指标说明定位、优化和回归。
5. 补充真机、弱网、权限、分包、发布与回滚的验证过程。

深入阅读：[跨端架构与生命周期](/doc/uniapp/UniApp核心架构与跨端开发体系) · [网络与状态管理](/doc/uniapp/企业级网络封装与状态管理实战) · [性能与多端避坑](/doc/uniapp/性能优化与多端避坑全景指南)

参考：[条件编译](https://uniapp.dcloud.net.cn/tutorial/platform.html) · [页面与路由](https://uniapp.dcloud.net.cn/tutorial/page.html) · [性能优化](https://uniapp.dcloud.net.cn/tutorial/performance.html)

## 六、一个能跑起来的 Uni-App MVP

前面的答案解决“怎么解释”，下面用一个极小的商品列表示例解决“怎么落地”。这个 MVP 包含：首页列表、详情跳转、下拉刷新、触底分页、统一请求、Token 失效刷新和 Pinia 用户状态。它不是生产模板，但每段代码都对应一个面试考点。

### 31. 先画出最小目录

```text
├─ App.vue
├─ pages.json
├─ pages/
│  ├─ home/home.vue       # 商品列表
│  └─ detail/detail.vue   # 商品详情
├─ stores/user.js         # 登录态
└─ utils/request.js       # 请求封装与 Token 刷新
```

页面只负责展示和交互，`request.js` 负责网络协议，`user.js` 负责登录态。这样面试时可以明确说明：**页面不拼接 Token、不处理刷新细节，也不把所有数据塞进全局状态**。

### 32. `pages.json`：注册页面和分包

```json
{
  "pages": [
    {
      "path": "pages/home/home",
      "style": {
        "navigationBarTitleText": "商品列表",
        "enablePullDownRefresh": true
      }
    }
  ],
  "subPackages": [
    {
      "root": "pages-sub",
      "pages": [
        {
          "path": "detail/detail",
          "style": { "navigationBarTitleText": "商品详情" }
        }
      ]
    }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/home/home", "text": "首页" }
    ]
  }
}
```

这里有两个容易被追问的点：`pagePath` 必须与 `pages` 中注册的路径一致；`tabBar` 页面只能用 `switchTab` 打开。若详情是首屏高频页面，不要为了“分包”而强行放入低频包，要按访问路径和包体积测量后决定。

### 33. `App.vue`：应用级初始化

```vue
<script>
export default {
  onLaunch() {
    // 只做一次的初始化：读取本地登录态、埋点初始化等
    console.log('应用启动')
  },
  onShow(options) {
    // 从后台回到前台；可在这里检查会话是否过期
    console.log('应用进入前台', options)
  },
  onHide() {
    console.log('应用进入后台')
  }
}
</script>

<style>
page { background: #f7f8fa; }
</style>
```

不要在 `onLaunch` 里请求所有页面的数据。应用启动只负责全局初始化，页面数据放到页面自己的生命周期里，才能避免启动阻塞和无关请求。

### 34. `utils/request.js`：从最小请求封装开始

下面的代码使用“一个刷新 Promise”实现并发请求的单飞刷新。真实项目还应补充日志脱敏、请求取消、错误上报和更严格的重试策略。

```js
const BASE_URL = 'https://api.example.com'
let refreshPromise = null

function getToken() {
  return uni.getStorageSync('access_token') || ''
}

function saveToken(token) {
  uni.setStorageSync('access_token', token)
}

function clearToken() {
  uni.removeStorageSync('access_token')
  uni.removeStorageSync('refresh_token')
}

function requestRaw({ url, method = 'GET', data, header = {} }) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      timeout: 10000,
      header: { ...header, Authorization: `Bearer ${getToken()}` },
      success: resolve,
      fail: reject
    })
  })
}

async function refreshTokenOnce() {
  // 已经有刷新请求时，所有调用方共享它
  if (!refreshPromise) {
    refreshPromise = requestRaw({
      url: '/auth/refresh',
      method: 'POST',
      data: { refreshToken: uni.getStorageSync('refresh_token') }
    }).then(res => {
      if (res.statusCode !== 200 || !res.data?.accessToken) {
        throw new Error('刷新 Token 失败')
      }
      saveToken(res.data.accessToken)
      return res.data.accessToken
    }).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function request(options, retry = true) {
  const res = await requestRaw(options)

  if (res.statusCode === 401 && retry && options.url !== '/auth/refresh') {
    try {
      await refreshTokenOnce()
      // 只重试一次，避免 401 -> 刷新 -> 401 的无限递归
      return request(options, false)
    } catch (error) {
      clearToken()
      uni.reLaunch({ url: '/pages/login/login' })
      throw error
    }
  }

  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error(`HTTP ${res.statusCode}`)
  }
  if (res.data?.code && res.data.code !== 0) {
    throw new Error(res.data.message || '业务请求失败')
  }
  return res.data
}
```

**面试解释**：401 是“凭证失效”，网络超时是“请求没有得到可靠响应”，业务码失败是“服务端正常响应但业务不接受”。三者不能都包装成同一个错误；只有可安全重试的请求才应重试，创建订单等写请求必须依赖服务端幂等键。

> 如果后端把 Token 放在 Cookie，封装方式会改成 `withCredentials` 和 Cookie 管理；不要背诵某一种写法，要先对齐前后端认证协议。

### 35. `stores/user.js`：Pinia 加本地持久化

```js
import { defineStore } from 'pinia'
import { request } from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: uni.getStorageSync('user_profile') || null
  }),
  getters: {
    isLogin: state => Boolean(state.profile)
  },
  actions: {
    async login(form) {
      const data = await request({
        url: '/auth/login',
        method: 'POST',
        data: form
      })
      uni.setStorageSync('access_token', data.accessToken)
      uni.setStorageSync('refresh_token', data.refreshToken)
      this.profile = data.profile
      uni.setStorageSync('user_profile', data.profile)
    },
    logout() {
      this.$reset()
      uni.removeStorageSync('access_token')
      uni.removeStorageSync('refresh_token')
      uni.removeStorageSync('user_profile')
    }
  }
})
```

Pinia 解决“当前页面能读到最新状态”，Storage 解决“应用重启后还能恢复”。两者职责不同；退出登录必须同时清理内存和持久化数据。

### 36. `pages/home/home.vue`：列表、刷新和分页

```vue
<template>
  <view class="page">
    <view v-for="item in list" :key="item.id" class="card" @click="openDetail(item.id)">
      <image class="cover" :src="item.cover" mode="aspectFill" />
      <view class="name">{{ item.name }}</view>
      <view class="price">¥{{ item.price }}</view>
    </view>
    <view v-if="loading" class="status">加载中...</view>
    <view v-else-if="!hasMore" class="status">没有更多了</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { request } from '@/utils/request'

const list = ref([])
const page = ref(1)
const pageSize = 10
const loading = ref(false)
const hasMore = ref(true)
let requestVersion = 0

async function loadList({ refresh = false } = {}) {
  if (loading.value || (!hasMore.value && !refresh)) return
  const version = ++requestVersion
  if (refresh) {
    page.value = 1
    hasMore.value = true
  }
  loading.value = true
  try {
    const data = await request({
      url: '/products',
      data: { page: page.value, pageSize }
    })
    // 刷新后旧分页请求回来，不能覆盖新列表
    if (version !== requestVersion) return
    list.value = refresh ? data.items : [...list.value, ...data.items]
    hasMore.value = data.items.length === pageSize
    if (hasMore.value) page.value += 1
  } finally {
    if (version === requestVersion) loading.value = false
    if (refresh) uni.stopPullDownRefresh()
  }
}

function openDetail(id) {
  uni.navigateTo({ url: `/pages-sub/detail/detail?id=${encodeURIComponent(id)}` })
}

onShow(() => {
  // 首次进入加载；从详情返回时可根据 dirty 标记决定是否刷新
  if (!list.value.length) loadList()
})
onPullDownRefresh(() => loadList({ refresh: true }))
onReachBottom(() => loadList())
</script>

<style>
.page { padding: 24rpx; }
.card { display: flex; align-items: center; margin-bottom: 20rpx; padding: 20rpx; background: #fff; border-radius: 12rpx; }
.cover { width: 160rpx; height: 160rpx; margin-right: 20rpx; border-radius: 8rpx; }
.name { flex: 1; }
.price { color: #e64340; }
.status { padding: 24rpx; color: #999; text-align: center; }
</style>
```

这个页面体现了四个常见考点：

- `onReachBottom` 只负责触发分页，真正请求由 `loadList` 统一控制。
- `loading` 防止连续触底造成重复请求，`hasMore` 防止无意义请求。
- `requestVersion` 防止“刷新请求”和“旧分页请求”乱序覆盖数据。
- 详情页返回后是否刷新，应根据业务变更设置脏标记，而不是每次 `onShow` 都全量请求。

### 37. 详情页如何接收参数

```vue
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'

const detail = ref(null)

onLoad(async (query) => {
  const id = decodeURIComponent(query.id || '')
  if (!id) return
  detail.value = await request({ url: `/products/${id}` })
})
</script>
```

路由参数只放商品 ID，不放完整商品对象，更不放 Token。详情页重新请求可以获得最新数据，也避免 URL 过长；如果需要返回列表并更新价格，可使用共享状态或约定一个页面事件。

### 38. 条件编译的最小示例

```js
export function chooseLogin() {
  // #ifdef MP-WEIXIN
  return uni.login({ provider: 'weixin' })
  // #endif

  // #ifdef H5
  return Promise.resolve({ code: 'h5-code' })
  // #endif

  // #ifdef APP-PLUS
  return new Promise(resolve => {
    plus.oauth.getServices(services => resolve(services[0]))
  })
  // #endif
}
```

条件编译解决“构建时就知道的平台差异”；如果要判断用户是否开启定位，则仍应在运行时请求权限并处理拒绝分支。平台专属代码最好集中在 `platform/` 目录，避免业务页面到处散落 `#ifdef`。

## 七、把 MVP 讲成一段面试答案

> “我会先按页面、网络和状态拆层。页面用 `onLoad` 读取参数、`onShow` 处理回到前台后的刷新，用 `onReachBottom` 触发分页；请求层统一注入 Token、区分 HTTP 错误和业务错误，并用共享 Promise 处理并发刷新，重试只做一次。列表用 loading、hasMore 和请求版本号避免重复请求与乱序覆盖。Pinia 保存运行期用户状态，Storage 只持久化必要信息。最后按微信小程序、H5、App 分别做条件编译、真机、弱网和发布包验证。”

这段话比单独背 API 更容易获得追问空间：面试官通常会继续问为什么 `onShow`、为什么只能重试一次、刷新和分页冲突怎么办，以及哪些代码不能在小程序运行。回答时始终把**平台差异、失败路径、指标和验证方式**说出来。
