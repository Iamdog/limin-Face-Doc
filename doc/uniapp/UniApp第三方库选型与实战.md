---
title: Uni-App 第三方库选型与实战
---

# Uni-App 第三方库选型与实战

## 使用入口：先解决问题，再做验证

选择兼容目标端的请求、UI 与分页库。

**先做基本操作**：先固定目标端与版本，跑通最小功能和错误状态，再比较维护、包体积与平台支持。初次学习可先完成[本模块基础实践](/doc/uniapp/页面开发登录与支付基本实践)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

> **一句话理解**：第三方库不是“装得越多越专业”，而是把重复、容易出错、跨端差异明显的工作交给经过验证的组件，同时保留平台兜底方案。选库时先看目标端、维护状态、包体积、TypeScript 支持、是否依赖 DOM，以及出现问题时能否回到 `uni.*` 原生 API。

本文以传统 uni-app（Vue 3）为主，示例中的 `luch-request` 按当前仓库 README 的 v4 API 编写。老项目可能仍使用 v3 写法，升级前要阅读项目自己的 lock 文件和迁移说明。

## 一、常用第三方库地图

| 能力 | 常见选择 | 适合解决的问题 | 选型提醒 |
|---|---|---|---|
| 网络请求 | [luch-request](https://github.com/lei-mu/luch-request)、[Alova](https://alova.js.org/) | 请求封装、拦截器、状态管理、缓存、分页和请求策略 | luch-request 偏底层请求客户端；Alova 偏请求策略与数据交互，均需确认 Vue 版本和适配器 |
| UI 组件 | [uni-ui](https://github.com/dcloudio/uni-ui)、[uview-plus](https://github.com/ijry/uview-plus)、[wot-design-uni](https://github.com/Moonofweisheng/wot-design-uni) | 表单、弹窗、选择器、列表、空状态等 | 看设计一致性、按需引入、平台差异和维护活跃度 |
| 长列表/分页 | [z-paging](https://github.com/SmileZXLee/uni-z-paging) | 下拉刷新、上拉分页、虚拟列表、空状态 | 先确认是否与项目页面滚动模式和自定义列表结构兼容 |
| 状态管理 | [Pinia](https://pinia.vuejs.org/) | 用户、权限、购物车等跨页面状态 | 持久化要接 `uni.setStorage`，不要直接假设存在 `localStorage` |
| 日期处理 | [Day.js](https://github.com/iamkun/dayjs) | 格式化、相对时间、时区处理 | 避免在列表渲染中反复创建对象；按需加载插件 |
| 图标 | `uni-icons`、UI 库内置图标 | 常用操作图标 | 统一图标风格，检查字体图标在小程序和 App 的渲染差异 |

### 怎么回答“你项目用了哪些库？”

不要只报包名，可以按下面四句话回答：

1. **业务问题**：项目需要统一请求、上传、取消和错误处理，所以选网络库。
2. **关键能力**：使用实例默认配置和拦截器注入 Token，业务层只调用 `api` 方法。
3. **风险控制**：锁定版本，检查 ESM/构建兼容性，给关键接口保留 `uni.request` 降级路径。
4. **结果验证**：在 H5、微信小程序和 App 真机分别验证登录、超时、取消、上传和弱网行为。

## 二、luch-request 是什么？

[luch-request](https://github.com/lei-mu/luch-request) 是面向传统 uni-app 的 Promise 请求库。当前仓库 README 的 v4 版本提供 `request`、常用 HTTP 方法、`upload`、`download`、实例默认配置、请求/响应拦截器、统一 `LuchRequestError`、请求取消和 `nativeOptions` 等能力。

它的价值可以用一条链理解：

```text
页面调用 http.get
        ↓
请求拦截器：补 baseURL、Token、追踪信息
        ↓
uni.request / uni.uploadFile / uni.downloadFile
        ↓
响应拦截器：统一日志、错误分类和业务处理
        ↓
页面只接收 data，减少重复 try/catch
```

它仍然依赖底层 uni API，所以不会自动解决平台限制：H5 仍受 CORS 影响，小程序仍需配置合法域名，上传、下载、超时和取消能力也要按目标平台验证。

## 三、安装和最小调用

### 1. 安装

```bash
npm install luch-request
```

v4 使用 ESM 导入，并以 ES2017 语法构建；如果是很老的构建链，不能只看 npm 安装成功，还要实际构建 H5、小程序和 App。仓库 README 还提供了 v3 到 v4 的迁移入口，老项目升级前应先对照迁移文档。

### 2. 第一个请求

```ts
// src/utils/http.ts
import { createLuchRequest } from 'luch-request'

export const http = createLuchRequest({
  baseURL: 'https://api.example.com',
  timeout: 10_000,
  header: {
    Accept: 'application/json'
  },
  validateStatus: status => status >= 200 && status < 300
})

export async function getUser(id: number) {
  const response = await http.get<{ id: number; name: string }>(`/users/${id}`)
  return response.data
}
```

`createLuchRequest` 创建的是独立实例。可以为业务 API、文件服务、监控服务创建不同实例，各自配置 baseURL 和拦截器，避免一个全局实例承载所有规则。

### 3. `response.data` 和完整响应有什么区别？

```ts
const response = await http.get<User[]>('/users', {
  params: { page: 1, pageSize: 20 }
})

console.log(response.data)       // 接口业务数据
console.log(response.statusCode) // HTTP 状态码
console.log(response.config)     // 最终请求配置
console.log(response.raw)        // 原始平台响应
```

服务层通常只返回 `response.data`；需要分页头、链路信息或原始平台字段时再保留完整响应。不要在页面里依赖库内部字段拼接 URL，业务参数放在 `params`，平台专有参数放在 `nativeOptions`。

## 四、用拦截器做统一鉴权

### 1. 请求拦截器注入 Token

```ts
// src/utils/http.ts
import { createLuchRequest } from 'luch-request'

export const http = createLuchRequest({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  timeout: 15_000
})

http.interceptors.request.use((config) => {
  const token = uni.getStorageSync('access_token')
  const requiresAuth = config.luchMeta?.requiresAuth !== false

  if (!requiresAuth || !token) return config

  return {
    ...config,
    header: {
      ...config.header,
      Authorization: `Bearer ${token}`
    }
  }
})
```

这里用 `luchMeta` 表示业务元数据。它不会被发送给后端，适合表达“这个接口是否需要登录”“日志应该使用什么业务名”等信息：

```ts
await http.get('/profile', {
  luchMeta: { requiresAuth: true, traceName: 'profile' }
})

await http.get('/health', {
  luchMeta: { requiresAuth: false, traceName: 'health-check' }
})
```

### 2. 响应拦截器统一记录错误

```ts
import {
  isLuchRequestError,
  LuchRequestError
} from 'luch-request'

http.interceptors.response.use(
  response => response,
  error => {
    if (isLuchRequestError(error)) {
      switch (error.code) {
        case LuchRequestError.ERR_NETWORK:
          console.warn('网络不可用', error.raw)
          break
        case LuchRequestError.ERR_BAD_STATUS:
          console.warn('HTTP 状态异常', error.response?.statusCode)
          break
        case LuchRequestError.ERR_CANCELED:
          // 页面离开导致的取消通常不应该弹 Toast
          break
      }
    }
    throw error
  }
)
```

错误判断应使用 `error.code`，不要依赖 `message` 的英文文案。常见分类包括网络失败、HTTP 状态失败、响应解析失败、主动取消和拦截器失败。最终展示给用户的中文提示由业务层映射，日志中保留稳定的错误码。

## 五、luch-request + Token 无感刷新 MVP

库负责请求管线和拦截器，Token 刷新仍应由业务层决定。最简单可靠的方式是让业务函数传入一个“如何发起原请求”的闭包，并用一个共享 Promise 保证同时只有一次刷新。

```ts
import {
  isLuchRequestError,
  LuchRequestError
} from 'luch-request'
import { http } from './http'

let refreshing: Promise<string> | null = null

async function refreshAccessToken() {
  if (!refreshing) {
    refreshing = http.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken: uni.getStorageSync('refresh_token')
    }).then(response => {
      const token = response.data.accessToken
      if (!token) throw new Error('刷新接口没有返回 accessToken')
      uni.setStorageSync('access_token', token)
      return token
    }).finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

export async function requestWithAuth<T>(send: () => Promise<T>): Promise<T> {
  try {
    return await send()
  } catch (error) {
    const is401 = isLuchRequestError(error)
      && error.code === LuchRequestError.ERR_BAD_STATUS
      && error.response?.statusCode === 401

    if (!is401) throw error

    try {
      await refreshAccessToken()
      // 只重放一次；send 内部仍使用同一个业务参数
      return await send()
    } catch (refreshError) {
      uni.removeStorageSync('access_token')
      uni.removeStorageSync('refresh_token')
      uni.reLaunch({ url: '/pages/login/login' })
      throw refreshError
    }
  }
}

export function getProfile() {
  return requestWithAuth(() =>
    http.get<{ id: number; nickname: string }>('/profile', {
      luchMeta: { requiresAuth: true, traceName: 'profile' }
    }).then(response => response.data)
  )
}
```

### 这段代码面试怎么讲？

- `refreshing` 是共享 Promise，多个请求同时 401 时会等待同一次刷新。
- 刷新接口本身不走 `requestWithAuth`，因此不会出现递归刷新。
- 原请求只重试一次，避免无限循环。
- 订单、支付等写请求不能只依赖客户端重试，必须配合服务端幂等键和订单状态查询。
- 刷新失败要清理两份 Token，并通过 `reLaunch` 回到登录入口。

## 六、取消请求：搜索框和页面卸载场景

搜索建议和详情页请求经常需要取消：用户输入新关键词时，旧搜索结果已经没有意义；页面离开时，未完成请求也不应继续更新页面。luch-request v4 支持 `signal` 和跨平台的 `createCancelSource()`。

```ts
import { createCancelSource } from 'luch-request'
import { http } from '@/utils/http'

let searchSource: ReturnType<typeof createCancelSource> | null = null

export async function searchUsers(keyword: string) {
  searchSource?.cancel('开始新的搜索')
  searchSource = createCancelSource()

  const response = await http.get<User[]>('/users/search', {
    params: { keyword },
    signal: searchSource.signal
  })
  return response.data
}
```

同一个 `signal` 可以绑定多个请求。取消源一旦取消就不能复用，下次搜索必须创建新的 source。页面生命周期中使用时，应在页面离开或组件卸载时调用 `cancel`，并把主动取消当成正常控制流处理，不要弹出“网络异常”。

## 七、上传、下载与文件接口

```ts
const response = await http.upload<{ id: string }>({
  url: '/files',
  filePath: tempFilePath,
  name: 'file',
  formData: { folder: 'avatar' }
})

if (typeof response.data === 'string') {
  // 服务端返回的不是有效 JSON
  console.warn('上传响应仍是字符串', response.data)
} else {
  console.log('文件 ID', response.data.id)
}
```

`uni.uploadFile` 的响应数据通常是字符串，因此上传响应要考虑 `T | string`；不要直接假定 `response.data.id` 一定存在。目标端的文件路径、权限、文件数量和进度事件也要分别验证。大文件上传还要结合分片、断点续传和服务端校验，不能仅靠请求库解决。

## 八、Alova：把请求“策略”也抽出来

[Alova](https://alova.js.org/) 和 `luch-request` 的定位不完全相同。`luch-request` 更像一个增强版请求客户端，重点是实例、拦截器、错误和文件操作；Alova 位于传输层之上，通过适配器接入 `uni.request`，再提供 `useRequest`、`useWatcher`、缓存、请求共享、分页、表单提交和 Token 认证等请求策略。简单说：

```text
luch-request：我怎样把一个请求发出去、拦截、取消和归一化？
Alova：这个请求什么时候发、是否复用、如何监听状态和更新页面？
```

Alova 官方的 uni-app 适配器是 `@alova/adapter-uniapp`，当前文档注明它面向 Vue 3 uni-app；接入时由适配器提供请求、存储和 Vue 状态适配。使用前要确认项目不是 Vue 2，也要按目标端构建验证。

### 1. 安装和创建实例

```bash
npm install alova @alova/adapter-uniapp
```

```ts
// src/api/alova.ts
import { createAlova } from 'alova'
import AdapterUniapp from '@alova/adapter-uniapp'

export const alova = createAlova({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  ...AdapterUniapp()
})

export function getProductList(page: number, keyword = '') {
  return alova.Get('/products', {
    params: { page, pageSize: 10, keyword }
  })
}

export function createOrder(data: { productId: number; count: number }) {
  return alova.Post('/orders', data)
}
```

Alova 先创建 `Method` 实例，再由 hook 或 `send` 触发。把接口定义集中在 `api` 目录，页面就不需要拼 URL 和请求参数。

### 2. `useRequest`：页面第一次加载和按钮请求

```vue
<script setup lang="ts">
import { useRequest } from 'alova/client'
import { getProductList, createOrder } from '@/api/alova'

// 进入页面立即加载
const listRequest = useRequest(
  () => getProductList(1),
  { immediate: true }
)

// 点击按钮才发送；hook 必须在 setup 顶层创建
const orderRequest = useRequest(
  form => createOrder(form),
  { immediate: false }
)

function submit(form: { productId: number; count: number }) {
  return orderRequest.send(form)
}
</script>
```

`useRequest` 会维护 `loading`、`data`、`error` 等状态，适合“进入页面请求一次”或“点击按钮才请求”的场景。它减少了页面里手动维护 `try/catch/loading` 的重复代码，但业务错误码仍应在全局响应处理或服务层统一归一。

### 3. `useWatcher`：搜索、筛选和分页

```vue
<template>
  <view>
    <input v-model="keyword" placeholder="搜索商品" />
    <view v-if="loading">加载中...</view>
    <view v-else-if="error">加载失败，请重试</view>
    <view v-else v-for="item in data || []" :key="item.id">
      {{ item.name }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWatcher } from 'alova/client'
import { getProductList } from '@/api/alova'

const keyword = ref('')
const page = ref(1)

const { loading, data, error } = useWatcher(
  () => getProductList(page.value, keyword.value),
  [keyword, page],
  {
    immediate: true,
    debounce: 400,
    abortLast: true
  }
)
</script>
```

这里有三个重要行为：

- `keyword` 或 `page` 改变时自动重新请求。
- `debounce` 避免每次输入都立刻发请求。
- `abortLast: true` 让新请求取消仍未完成的旧请求，避免旧响应覆盖新关键词结果。

这和手写 `watch + loading + requestVersion + cancel` 的目标相同，但请求策略被库统一管理。若项目已有一套成熟的请求状态封装，再引入 Alova 之前要评估重复抽象和团队学习成本。

### 4. 文件上传和下载

Alova 的 uni-app 适配器可以根据 `requestType` 转为 `uni.uploadFile` 或 `uni.downloadFile`：

```ts
export function uploadAvatar(name: string, filePath: string) {
  return alova.Post(
    '/files/avatar',
    {
      name,
      filePath,
      folder: 'avatar' // 其他字段会作为 formData 传递
    },
    {
      requestType: 'upload',
      fileType: 'image',
      enableUpload: true
    }
  )
}

export function downloadReport(filePath: string) {
  return alova.Get('/reports/latest.xlsx', {
    requestType: 'download',
    filePath,
    enableDownload: true
  })
}
```

文件路径、进度回调、权限和平台支持仍由 uni-app 宿主决定；请求策略库不会替代真机验证。

### 5. Alova 适合什么项目？

适合以下情况：

- 页面中有大量“请求状态 + 自动重请求 + 依赖状态变化”的逻辑。
- 需要请求缓存、请求共享、预加载或跨组件刷新。
- 列表、表单、搜索和分页策略重复出现，希望统一实现。
- 团队愿意使用 Method 实例和 hook，而不是所有接口都直接返回 Promise。

如果项目只需要简单的 baseURL、Token、拦截器和上传下载，`luch-request` 或自定义 `uni.request` 封装更直接。Alova 的优势是请求策略，不是把每个简单 GET 都包装得更复杂。

## 九、与直接封装 `uni.request` 的区别

| 维度 | 直接封装 `uni.request` | luch-request |
|---|---|---|
| 上手成本 | 最低，项目自己定义 Promise | 需要理解实例、配置和错误类型 |
| 统一拦截 | 自己维护拦截器协议 | 内置 request/response interceptor |
| 错误分类 | 需要自行约定 | 提供统一错误码和类型守卫 |
| 上传下载 | 需要再次封装 | 提供对应方法 |
| 取消请求 | 依赖平台 Task，自行管理 | 提供 Promise 控制和 signal 抽象 |
| 迁移成本 | 无第三方依赖 | 需要评估 v4 ESM 与项目构建兼容 |
| 平台边界 | 直接面对 uni API | 仍然受 H5 CORS、小程序域名等限制 |

小项目或接口很少时，直接封装 `uni.request` 足够；多个业务域、上传下载、统一错误分类和取消需求明显时，luch-request 能减少基础设施代码。最终选择应由团队熟悉度、构建兼容性和维护成本决定。

## 十、其他库怎么选

### 1. UI 组件库

- **uni-ui**：与 uni-app 生态结合紧，适合希望依赖少、风格可控的项目。
- **uview-plus**：组件覆盖较广，适合中后台、表单和常见业务页面；引入前检查按需构建和主题定制方式。
- **wot-design-uni**：偏移动端设计体系，适合需要较完整交互组件的项目；要验证目标平台和 Vue 版本支持。

不要同时引入多个重量级 UI 库。可以用一个主库覆盖 80% 场景，剩余少数组件自己封装或使用原生组件，避免样式、弹窗和主题系统互相覆盖。

### 2. z-paging 与自己写分页

当列表都有下拉刷新、上拉加载、空状态和加载失败重试时，z-paging 可以减少重复模板代码；但如果项目需要高度定制的滚动容器、复杂瀑布流或特殊埋点，自己写分页状态更容易掌控。无论使用哪种方式，都必须保留 `loading`、`hasMore`、刷新重置、请求乱序保护和错误重试。

### 3. Pinia 持久化

Pinia 只解决响应式状态，不自动解决小程序和 App 的持久化。持久化插件要接入：

```ts
const uniStorage = {
  getItem: (key: string) => uni.getStorageSync(key) || null,
  setItem: (key: string, value: string) => uni.setStorageSync(key, value),
  removeItem: (key: string) => uni.removeStorageSync(key)
}
```

敏感 Token 不应因为“用了插件”就被认为安全；要考虑失窃、过期、退出清理和设备共享场景。

## 十一、第三方库接入检查清单

1. 查看仓库 README、CHANGELOG 和兼容性说明，确认当前 API 不是旧版本写法。
2. 检查是否依赖 `window`、`document`、Node 模块或浏览器专属能力。
3. 以真实目标端构建：H5、微信小程序、App 至少各跑一次核心链路。
4. 检查包体积、分包位置、按需引入和重复依赖。
5. 覆盖失败路径：超时、断网、401、取消、空数据、权限拒绝和接口慢。
6. 锁定版本并记录升级原因，升级前先读迁移文档。
7. 为关键功能保留平台原生兜底，避免第三方库成为单点故障。

## 参考链接

- [luch-request GitHub 仓库](https://github.com/lei-mu/luch-request)
- [luch-request 在线文档](https://luch-request.quanzhan.co/)
- [Alova 官方文档](https://alova.js.org/)
- [Alova Uni-App 适配器](https://alova.js.org/resource/request-adapter/)
- [uni-ui](https://github.com/dcloudio/uni-ui)
- [uview-plus](https://github.com/ijry/uview-plus)
- [wot-design-uni](https://github.com/Moonofweisheng/wot-design-uni)
- [z-paging](https://github.com/SmileZXLee/uni-z-paging)
- [Pinia](https://pinia.vuejs.org/)
- [Day.js](https://day.js.org/)
