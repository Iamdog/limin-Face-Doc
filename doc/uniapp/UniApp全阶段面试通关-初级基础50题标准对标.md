# UniApp全阶段面试通关-初级基础50题标准对标

本篇面向 0~2 年初级移动端与前端工程师，系统梳理 Uni-App 核心基础、Vue 3 组合式 API 在跨端工程中的适配、目录规范、全局配置、三套生命周期执行时序、响应式单位物理计算、内置核心组件、路由跳转与基础网络请求等 50 道高频面试标准真题与对标解析。

---

### Q1: 什么是 Uni-App？它的核心价值与底层跨端愿景是什么？
**答**：
Uni-App 是由 DCloud 推出的基于 Vue.js 的跨平台应用前端开发框架。开发者编写一套基于 Vue 规范的代码，通过编译器和运行时，可直接编译打包为 iOS、Android 原生应用、Web（H5/SPA/SSR）以及各大厂商小程序（微信、支付宝、百度、字节跳动、QQ、快手等）。核心价值在于降低企业多端研发门槛与人力成本，统一团队技术栈。

---

### Q2: Uni-App 采用 Vue 3 相比 Vue 2 有哪些核心优势？
**答**：
1. **组合式 API（Composition API）**：逻辑复用与代码组织更灵活，告别 Options API 庞大的 this 隐式绑定。
2. **底层响应式升级**：由 `Object.defineProperty` 切换为基于 ES6 `Proxy`，原生支持深层属性与动态属性添加拦截，无需使用 `$set`。
3. **构建性能飞跃**：全面拥抱 Vite 构建工具链，冷启动与 HMR（热更新）耗时从分钟级下降到毫秒级。
4. **编译优化与体积**：更强的 Tree-Shaking 机制，无用代码完全不打入小程序包，大幅减小代码包体积。

---

### Q3: Uni-App 的工程目录中，`pages.json` 和 `manifest.json` 各自承担什么职责？
**答**：
- `pages.json`：全局页面路由与窗口外观配置文件。用于声明页面路径（`pages`）、页面窗口表现（`style` / `window`）、底部导航栏（`tabBar`）、分包规则（`subPackages`）与预下载拓扑（`preloadRule`）。
- `manifest.json`：应用全平台打包配置文件。用于指定应用名称、版本号、AppID、模块权限配置、SDK 鉴权凭证以及多端特异性平台参数（如 App 原生权限、微信小程序基础库版本等）。

---

### Q4: 简述 `App.vue`、页面 Vue 组件与普通自定义 Vue 组件的角色定位差异。
**答**：
- `App.vue`：应用级根入口组件，无 `<template>` 视图结构，仅配置应用全局生命周期（`onLaunch`, `onShow`, `onHide`）与全局公共样式。
- 页面 Vue 组件：在 `pages.json` 中配置了具体 `path` 的视图页面，享有完整的页面级生命周期（如 `onLoad`, `onShow`, `onPullDownRefresh`）。
- 普通自定义组件：被页面引入的局部积木组件，仅遵循 Vue 3 组件生命周期（`onMounted`, `onUpdated`, `onUnmounted` 等），不触发页面级生命周期。

---

### Q5: Uni-App 存在哪三套生命周期？它们的触发归属分别是什么？
**答**：
1. **应用生命周期**：作用于 `App.vue`（`onLaunch`, `onShow`, `onHide`, `onError`）。
2. **页面生命周期**：作用于配置在 `pages.json` 中的页面组件（`onLoad`, `onShow`, `onReady`, `onHide`, `onUnload`, `onPullDownRefresh`, `onReachBottom` 等）。
3. **Vue 组件生命周期**：作用于任意 Vue 组件实例（`onBeforeMount`, `onMounted`, `onBeforeUpdate`, `onUpdated`, `onBeforeUnmount`, `onUnmounted`）。

---

### Q6: 页面首次加载进入时，`onLoad`、`onShow`、`onReady` 和 `onMounted` 的触发先后顺序是怎样的？
**答**：
标准执行时序为：
1. `onLoad`（页面生命周期：拿到路由传递的 query 参数，数据初始化）；
2. `onShow`（页面生命周期：页面进入前台可见）；
3. `onMounted`（Vue 3 组件挂载完成）；
4. `onReady`（页面生命周期：页面初次渲染完成，视图层与逻辑层完成初始通信，此时可安全执行节点查询与 Canvas 初始化）。

---

### Q7: 在页面跳转时，从 PageA 跳转到 PageB，两个页面的生命周期如何流转？
**答**：
- 若使用 `uni.navigateTo`（保留当前页）：
  PageA 触发 `onHide` $\to$ PageB 触发 `onLoad` $\to$ PageB 触发 `onShow` $\to$ PageB 触发 `onReady`。
- 若使用 `uni.redirectTo`（关闭当前页）：
  PageA 触发 `onUnload`（组件销毁） $\to$ PageB 触发 `onLoad` $\to$ PageB 触发 `onShow` $\to$ PageB 触发 `onReady`。

---

### Q8: `onLoad` 与 `onShow` 的核心区别与应用场景是什么？
**答**：
- `onLoad`：仅在页面初次创建加载时触发一次，参数包含跳转携带的 query。常用于接收传参、拉取详情数据、初始化页面不变配置。
- `onShow`：每次页面进入前台可见时都会触发（例如首次进入、从二级页面返回、后台切回前台）。常用于刷新具有时效性的数据（如重新核验登录态、刷新订单支付状态、轮询消息通知）。

---

### Q9: 为什么很多开发者在自定义子组件内写 `onLoad` 却发现永远无法执行？
**答**：
`onLoad` 是页面特异性生命周期，小程序与 Uni-App 底层仅将其分发给 `pages.json` 中注册的**顶层页面实例**。普通子组件不是独立页面实体，底层不会派发页面生命周期，子组件初始化逻辑必须写在 Vue 标准的 `onMounted` 钩子中。

---

### Q10: 什么是 `rpx`？它的物理换算基准是什么？
**答**：
`rpx`（Responsive Pixel）是跨端屏幕自适应响应式长度单位。它的物理换算基准为：**规定任何移动端屏幕的横向物理总宽度恒等于 750rpx**。
换算公式：
$$1\text{rpx} = \frac{\text{屏幕物理像素宽度}}{750}\text{px}$$
在 iPhone 6（屏幕宽 375px）基准设计稿下：$750\text{rpx} = 375\text{px}$，即 $1\text{px} = 2\text{rpx}$。

---

### Q11: 为什么在 iPad 或大屏折叠屏设备上，使用 `rpx` 会导致按钮与字体被无限放大变形？如何解决？
**答**：
**原因**：`rpx` 严格以屏幕总宽等比缩放。大屏设备宽度成倍增加，`rpx` 计算出的绝对像素也成倍放大。
**解决方案**：在 `pages.json` 的 `globalStyle` 中配置 `rpxCalcMaxDeviceWidth`，限制最大计算屏幕宽度（如 960px）。超过此宽度后停止放大，改用居中定宽展示。

---

### Q12: Uni-App 中为什么不能随意使用 HTML 传统的 `div`、`span`、`img` 标签？
**答**：
因为 Uni-App 需要编译到非 Web 环境（如小程序与 App 原生引擎）。小程序的底座没有浏览器的标准 DOM 树，App 原生端更是依赖系统原生控件。Uni-App 提供了跨端抽象基础组件（如 `<view>`、`<text>`、`<image>`），编译器在编译时根据目标平台将其分别编译为 Web 的 `<div>`、小程序的 `<view>` 或原生的原生排版节点。

---

### Q13: `<view>` 组件与 HTML 中的 `<div>` 有何区别与特性？
**答**：
`<view>` 是通用的视图容器组件，具备跨端通用性。除具备类似 `div` 的块级容器特征外，还原生内置了按压触摸态反馈属性，如 `hover-class`（手指按压时的样式类）与 `hover-stay-time`（松开后保留样式时长），大幅提升移动端点击质感。

---

### Q14: `<text>` 组件的特性是什么？为什么行内文本必须放在 `<text>` 中？
**答**：
1. `<text>` 是行内文本容器，支持嵌套；
2. 只有被 `<text>` 包裹的文本，在小程序和 App 端才能长按选中（需显式声明 `selectable` 或 `user-select` 属性）；
3. `<text>` 原生支持解码实体字符（`decode` 属性，如 `&nbsp;`、`&lt;`）。

---

### Q15: `<image>` 组件的 `mode` 属性最常用的三个取值及其表现是什么？
**答**：
1. `scaleToFill`（默认）：不保持宽高比，拉伸图片填满容器。
2. `aspectFit`：保持纵横比，缩放图片使长边完全显示在容器内，可能留白。
3. `aspectFill`：保持纵横比，缩放图片使短边填满容器，超出部分被裁切（最常用于电商商品卡片）。

---

### Q16: `<button>` 组件在小程序端拥有哪些专属的开放能力（`open-type`）？
**答**：
- `open-type="share"`：唤起当前小程序页面分享菜单；
- `open-type="getPhoneNumber"`：调起用户手机号授权弹窗；
- `open-type="chooseAvatar"`：唤起用户头像快速选择；
- `open-type="contact"`：打开客服会话窗口；
- `open-type="openSetting"`：打开授权设置页。

---

### Q17: 在移动端使用 `<input>` 组件时，为什么经常发生软键盘弹出将页面顶部顶起或输入框被遮挡？
**答**：
**原因**：移动端输入法弹起会压缩 Webview 视口或触发默认推挤行为。
**解决**：使用 `adjust-position` 属性（设置是否在键盘弹起时自动上推页面，默认 true）；若自定义了固定底部输入条，建议设置 `:adjust-position="false"`，并监听 `@keyboardheightchange` 事件动态修改底部容器的 `padding-bottom` 偏移量。

---

### Q18: `<textarea>` 在旧版小程序真机上常被称作“原生层级组件钉子户”，表现出什么缺陷？
**答**：
在旧版渲染机制下，`<textarea>` 是由操作系统原生层控件实现的，层级始终高于 Webview 的标准 DOM 节点，导致自定义的底部弹窗、Picker 或固定导航栏无论设置多大的 `z-index` 都会被 `<textarea>` 穿透显示。现代小程序基础库已支持同层渲染（Same Layer Rendering），在 Uni-App 中需确保基础库版本支持并避免多余的 absolute 嵌套。

---

### Q19: `<scroll-view>` 无法触发横向或纵向滚动的最常见原因是什么？
**答**：
1. **纵向滚动（`scroll-y`）**：必须给 `<scroll-view>` 容器设置一个**显式固定的物理高度**（如 `height: 100vh` 或具体 `px`），未设高度则高度被内容撑开，无法产生溢出滚动。
2. **横向滚动（`scroll-x`）**：容器样式必须设置 `white-space: nowrap`，子项必须设置为 `display: inline-block`，且子项总宽度超出容器宽度。

---

### Q20: 什么是页面路由跳转的五大核心 API？各自应用场景是什么？
**答**：
1. `uni.navigateTo`：保留当前页面，跳转到应用内的某个页面，新页面入栈（不可跳转到 tabBar 页面）。
2. `uni.redirectTo`：关闭当前页面，跳转到应用内某个页面，原页面出栈，新页面替换入栈。
3. `uni.reLaunch`：关闭所有页面，重新打开应用内的某个页面（常用于退出登录后重定向到登录页）。
4. `uni.switchTab`：专用于跳转到 `tabBar` 页面，并关闭所有非 tabBar 页面。
5. `uni.navigateBack`：关闭当前页面，返回上一页面或多级页面（参数 `delta` 指定返回层数）。

---

### Q21: 微信小程序对页面路由栈最大深度限制是多少？超出限制会怎样？
**答**：
微信小程序路由栈的最大深度限制为 **10 层**。
如果连续调用 `uni.navigateTo` 超过 10 次，跳转将直接静默失败或在控制台抛出 `fail: navigateTo:fail webview count limit exceed`。对于深层流程（如填表、商品购买向导），必须适时采用 `uni.redirectTo` 替换或设计向导式状态机。

---

### Q22: `uni.navigateTo` 如何传递复杂对象或长数组？直接拼在 URL 后会有什么隐患？
**答**：
**隐患**：URL 参数有长度限制，且特殊字符（如 `?`、`&`、`=`、空格、中文、JSON 引号）会导致参数解析截断破损。
**规范写法**：
- 发送方：`encodeURIComponent(JSON.stringify(object))`
- 接收方（`onLoad(query)`）：`JSON.parse(decodeURIComponent(query.data))`。

---

### Q23: 页面返回上一页时，如何向上一页反向传递数据？
**答**：
1. **方案 A（官方推荐 EventChannel）**：
   在 `navigateTo` 成功回调中通过 `res.eventChannel.on('acceptData', fn)` 监听，在子页面通过 `getOpenerEventChannel().emit('acceptData', data)` 派发。
2. **方案 B（页面栈直接获取）**：
   通过 `getCurrentPages()` 获取页面栈，取 `pages[pages.length - 2]` 直接修改上一页实例数据或调用其方法。
3. **方案 C（全局事件总线）**：
   使用 `uni.$emit('refresh', data)` 发送，上一页在 `onLoad` 中通过 `uni.$on` 监听并在 `onUnload` 中销毁。

---

### Q24: `uni.request` 基础配置包含哪些核心字段？
**答**：
- `url`：开发者服务器接口地址；
- `data`：请求的参数（Object / String / ArrayBuffer）；
- `header`：请求头（如设置 `Content-Type`, `Authorization`）；
- `method`：HTTP 方法（GET, POST, PUT, DELETE 等）；
- `timeout`：超时时间（毫秒）；
- `dataType`：返回数据类型（默认 json）；
- `responseType`：响应数据类型（text / arraybuffer）。

---

### Q25: 在微信小程序真机运行时，为什么 `uni.request` 经常报错 `url not in domain list`？
**答**：
微信小程序存在严格的安全沙箱机制。所有网络请求的合法域名必须在**微信公众平台后台 -> 开发管理 -> 开发设置 -> 服务器域名**中配置合法的 HTTPS 白名单。开发阶段可在微信开发者工具中临时勾选“不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书”，但真机发布前必须完成配置。

---

### Q26: 微信小程序对网络请求有哪些底层强制协议限制？
**答**：
1. 必须使用 **HTTPS** 协议，全面封禁 HTTP 明文传输；
2. 域名端口必须为标准 443 端口（不能携带自定义端口号如 `:8080`）；
3. TLS 协议版本必须为 1.2 或更高版本；
4. 域名必须经过 ICP 备案；
5. 禁止直接使用 IP 地址发起请求。

---

### Q27: H5 端开发时遭遇的跨域（CORS）报错，在小程序和 App 端会发生吗？为什么？
**答**：
**不会**。
跨域（Same-Origin Policy）是**浏览器宿主特有的安全同源策略**。小程序逻辑层运行在 JSCore/V8 沙箱环境中，App 端运行在原生沙箱中，它们由操作系统底层网络库（如 Android OkHttp、iOS NSURLSession）直接发起 Socket 连接，不存在浏览器的 DOM/BOM 限制，因此绝对不会产生跨域错误。

---

### Q28: 在 H5 本地开发环境中，如何解决跨域问题？
**答**：
在工程根目录的 `vite.config.ts` 中配置 DevServer 代理（Proxy）：
```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://backend.corp.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

---

### Q29: HBuilderX 可视化创建工程与 Vue CLI / Vite 命令行创建工程有何本质区别？
**答**：
- **HBuilderX 工程**：依赖 HBuilderX 内置的编译工具链，插件配置图形化，开箱即用，适合快速迭代，但不利于深度集成企业私有 CI/CD 流水线。
- **CLI / Vite 工程**：完全基于标准 Node.js 与 NPM 生态管理依赖，拥有标准的 `package.json`，可在 Linux 无头服务器与 CI/CD 容器中一键执行 `npm run build`，适合大型工程化团队。

---

### Q30: 什么是条件编译？它的注释语法格式是怎样的？
**答**：
条件编译是在编译期根据不同平台目标，动态保留或剔除特定代码块的技术。
语法格式：
```vue
<!-- #ifdef 平台名称 -->
仅在特定平台编译的代码
<!-- #endif -->

<!-- #ifndef 平台名称 -->
除特定平台外均编译的代码
<!-- #endif -->
```
常用平台代号：`H5`、`MP-WEIXIN`、`MP-ALIPAY`、`APP-PLUS`。

---

### Q31: 条件编译可以应用在哪些文件与代码结构中？
**答**：
1. **API / JS 代码块**：`// #ifdef MP-WEIXIN`；
2. **组件模板 HTML**：`<!-- #ifdef APP-PLUS -->`；
3. **CSS 样式规则**：`/* #ifdef H5 */`；
4. **`pages.json` 页面路由与窗口配置**；
5. **静态文件与组件目录**：如声明 `components/my-comp.h5.vue`。

---

### Q32: 为什么在 Vue 3 中推荐全面使用 `<script setup>` 语法糖？
**答**：
1. **更少样板代码**：声明的顶级变量、函数、响应式引用直接对模板开放，无需手动 `return`；
2. **纯正 TypeScript 体验**：使用 `defineProps<T>()` 与 `defineEmits<T>()` 进行纯类型声明；
3. **更好的运行时性能**：模板会被编译为与其处于同一作用域的内联渲染函数，无需通过 Proxy 实例进行多层上下文属性寻址。

---

### Q33: Vue 3 中 `ref` 与 `reactive` 的本质区别是什么？在 Uni-App 中如何选用？
**答**：
- `ref`：接收任意基础类型或对象，底层封装为一个具有 `.value` 属性的 `RefImpl` 实例；在模板中自动解包（无需写 `.value`）。
- `reactive`：基于 Proxy 实现的深层对象响应式，仅接收 Object、Array、Map 等引用类型；存在若直接解构赋值会导致响应式丢失的物理缺陷。
- **选用建议**：绝大多数业务场景统一推荐使用 `ref`，保持一致的心智模型；仅在处理复杂的不可解构的表单大对象时使用 `reactive`。

---

### Q34: `computed` 与 `watch` 的使用场景有什么核心差异？
**答**：
- `computed`：基于依赖的响应式变量进行惰性求值与结果缓存。仅当依赖项发生变更时才会重新计算，用于推导新状态（无副作用）。
- `watch`：监听某个特定响应式变量的变化，并在变化时执行特定的异步或高开销副作用逻辑（如发起网络请求、存入本地缓存、弹窗提示）。

---

### Q35: 在 Uni-App 页面中，`ref="myComp"` 绑定在子组件上，什么时候能安全拿到该组件的实例？
**答**：
在 `onReady`（页面初次渲染完成）或 `onMounted` 钩子中，才能安全获取到 `myComp.value`。在 `onLoad` 时子组件尚未挂载完成，直接访问 `myComp.value` 必定为 `undefined`。

---

### Q36: 为什么小程序的组件无法直接使用浏览器的本地存储 `localStorage`？Uni-App 是如何抹平的？
**答**：
小程序的逻辑层与视图层均运行在宿主 App 提供的原生沙箱中，缺乏 Web 标准的全局 `window` 与 `localStorage` 对象。Uni-App 提供了统一的抽象 API：`uni.setStorageSync` / `uni.getStorageSync`，在小程序端转译为 `wx.setStorageSync`，在 App 端转译为基于原生 SQLite 或 MMKV 的持久化存储，在 H5 端转译为 Web `localStorage`。

---

### Q37: `uni.setStorage`（异步）与 `uni.setStorageSync`（同步）应该如何选择？
**答**：
- `uni.setStorageSync`：同步阻塞式写入，简单直观，适合写入小型数据（如 Token、用户 ID、轻量开关配置）。
- `uni.setStorage`：异步非阻塞式写入，底层通过工作线程执行磁盘 I/O。当写入数据量较大（如几十 KB 的离线草稿、大 JSON 缓存）时，必须使用异步存储，防止同步 I/O 阻塞主线程导致界面掉帧卡顿。

---

### Q38: 在 Uni-App 中如何引入和使用第三方字体（IconFont 图标库）？
**答**：
1. 将图标库生成的 `iconfont.css` 引入工程（如 `main.ts` 或 `App.vue`）；
2. 字体文件如果直接使用本地文件（`.ttf` / `.woff`），在小程序和 App 端受限于本地路径机制极易报错；
3. **最佳实践**：在 CSS 中将字体文件转换为 **Base64 字符串内联**，或者将字体文件上传至企业 CDN，在代码中调用 `uni.loadFontFace()` 动态异步加载。

---

### Q39: 在 `pages.json` 中配置自定义导航栏（`navigationStyle: "custom"`）后，页面会发生什么物理变化？
**答**：
系统默认的顶部原生导航栏（TitleBar）会被彻底移除隐藏，页面的视图内容会直接顶到手机屏幕的最顶端（与操作系统状态栏重叠）。开发者必须自行编写自定义导航栏组件，并动态计算状态栏高度与小程序胶囊按钮边界进行避让排版。

---

### Q40: 什么是页面下拉刷新？如何通过标准生命周期实现？
**答**：
1. 在 `pages.json` 对应页面配置中开启 `"enablePullDownRefresh": true`；
2. 在页面中声明 `onPullDownRefresh` 页面生命周期钩子，执行数据重新拉取逻辑；
3. **关键点**：数据刷新完毕后，必须手动显式调用 `uni.stopPullDownRefresh()`，否则页面顶部的加载动画会一直处于挂起状态。

---

### Q41: 什么是上拉触底加载更多？其判定阈值如何配置？
**答**：
当页面滚动到底部时触发分页加载。
1. 在 `pages.json` 中配置 `"onReachBottomDistance": 100`（单位 px，表示距离页面底部多少距离时提前触发）；
2. 在页面组件中实现 `onReachBottom` 页面生命周期钩子，执行当前页码 `pageIndex++` 并拉取下一页追加到数组。

---

### Q42: 为什么在 Vue 3 中使用 `v-for` 循环列表时，强制要求绑定 `:key`？
**答**：
Vue 的虚拟 DOM 算法使用 `key` 作为节点的唯一身份标识。在数据发生变动时，Diff 算法通过 `key` 快速比对新旧虚拟 DOM 树，精准识别节点是否被移动、添加或删除，极大复用现有真实 DOM 节点。若不加 `key` 或使用 `index` 作为 `key`，在进行列表反转或中间插入删除时，会导致大量节点不必要的重排重绘，甚至引发内部输入框状态错乱。

---

### Q43: 常见的 `v-if` 与 `v-show` 在跨端性能上有什么本质区别？
**答**：
- `v-if`：真正的条件渲染，条件为假时节点不会被创建挂载；切换过程中伴随真实的组件销毁与重新初始化，初始渲染开销小，切换开销大。
- `v-show`：无论条件真假，节点都会被无条件渲染，仅通过 CSS 的 `display: none` 控制显示与隐藏；初始渲染开销大，但切换开销极小。
- **建议**：在小程序端，频繁切换显隐的高频交互节点（如 Tab 选项卡、弹窗遮罩）建议使用 `v-show` 避免频繁销毁重建物件。

---

### Q44: 在 HBuilderX 中点击“运行到微信开发者工具”经常提示“请在微信开发者工具中打开服务端口”，如何解决？
**答**：
微信开发者工具为了安全防护，默认关闭了外部 CLI 调用端口。
**解决 SOP**：打开微信开发者工具 $\to$ 点击顶部菜单栏“设置” $\to$ 选择“安全设置” $\to$ 将**“服务端口”**开关手动切换为**开启（绿色状态）**，再次在 HBuilderX 中点击运行即可秒级调起。

---

### Q45: 在真机调试时，页面图片偶发加载失败，常见排查思路是什么？
**答**：
1. **协议问题**：图片 URL 是否为 HTTP 明文协议？（真机小程序强制必须为 HTTPS）；
2. **防盗链拦截**：企业 CDN 是否配置了 Referer 白名单校验，拦截了小程序的请求源；
3. **大写后缀兼容**：部分 Linux 服务器对扩展名大小写敏感（如 `.PNG` 与 `.png`）；
4. **域名白名单**：是否配置了图片源域名的 `downloadFile` 白名单。

---

### Q46: 什么是 `scoped` 样式？在 Uni-App 自定义组件中使用它有什么注意事项？
**答**：
`scoped` 会在当前组件的所有标签上自动添加独一无二的属性哈希（如 `data-v-7ba5bd90`），并将 CSS 转换为属性选择器，实现组件样式的局部作用域封装，防止样式全局污染。
**注意事项**：在带有 `scoped` 的组件内，无法直接修改引入的第三方 UI 库（如 uView）的内部深层节点样式，必须使用 `:deep()` 深度选择器进行样式穿透。

---

### Q47: 解释 `:deep()` 深度选择器的原理与写法。
**答**：
在 Vue 3 中，传统的 `>>>` 和 `/deep/` 语法已被废弃，统一使用 `:deep()`。
原理：编译时将属性选择器挂载在 `:deep()` 前面的父级选择器上，从而使子选择器能够匹配到子组件内部的孙子节点：
```css
/* 编译前 */
.my-dialog :deep(.u-button) {
  background-color: red;
}
/* 编译后产物 */
.my-dialog[data-v-xxxx] .u-button {
  background-color: red;
}
```

---

### Q48: Uni-App 中如何统一处理全局未捕获异常？
**答**：
在 `App.vue` 中监听全局错误：
1. `onError(err: string)`：捕获全端未捕获的运行时脚本异常；
2. `onUnhandledRejection(res)`：捕获未处理的 Promise 拒绝事件。
通过统一封装的 APM 监控模块将错误堆栈与设备信息上报至后台。

---

### Q49: 微信小程序编译产物中，主包体积上限是多少？超出后如何直观感知？
**答**：
单主包体积上限为 **2MB**（整包上限为 20MB）。
在微信开发者工具中点击“上传”或“代码依赖分析”，若主包体积超出 2048KB，控制台会直接飘红报错并阻断上传体验版。

---

### Q50: 初级开发者在 Uni-App 中最容易犯的 3 个“致命初级错误”是什么？
**答**：
1. **在子组件中编写 `onLoad`**，导致初始化逻辑无法执行；
2. **在网络请求中直接使用 `http://` 明文协议**，导致真机发布时请求全量失败；
3. **在 `static/` 目录下放置大量高清原始大图**，导致主包体积瞬间突破 2MB 编译红线。
