---
title: JavaScript 与浏览器基础实战
---

# JavaScript 与浏览器基础实战

## 先解决什么问题

Vue 页面最终运行在浏览器中。表单值为什么不对、请求为什么乱序、页面为什么卡、登录为何刷新后失效，都需要 JavaScript 和浏览器基础。先实现一个能查询、能取消、能展示错误的页面，再学习响应式和 Diff。

## 基本使用：先做一个搜索页面

先使用普通 HTML 与 JavaScript 跑通输入 → 请求 → 展示。在项目中把下面内容保存为 HTML，用本地开发服务器打开；`/api/search` 需要由你的后端或开发代理提供。

```html
<input id="keyword" aria-label="搜索关键词">
<button id="search">搜索</button>
<p id="status" role="status"></p>
<ul id="results"></ul>
<script type="module">
  const input = document.querySelector('#keyword')
  const status = document.querySelector('#status')
  const results = document.querySelector('#results')
  let controller
  let version = 0
  document.querySelector('#search').addEventListener('click', async () => {
    const current = ++version
    controller?.abort()
    controller = new AbortController()
    status.textContent = '加载中'
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(input.value.trim())}`, {
        signal: controller.signal
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (current !== version) return
      results.replaceChildren(...data.items.map(item => {
        const li = document.createElement('li')
        li.textContent = item.name
        return li
      }))
      status.textContent = data.items.length ? '查询完成' : '没有结果'
    } catch (error) {
      if (current !== version || error.name === 'AbortError') return
      status.textContent = '查询失败，请重试'
    }
  })
</script>
```

验证三件事：中文和特殊字符能查询；断网后出现错误；连续搜索时旧响应不会覆盖新响应。真实接口还要校验 JSON 的字段和类型。`fetch` 收到 404/500 通常仍然兑现 Promise，因此必须判断 `response.ok`。

## 开发前必须掌握的语言基础

| 知识 | 基本用法 | 易错边界 |
|---|---|---|
| `const` / `let` | 默认 const，需要重新赋值才用 let | const 限制绑定，不能阻止对象属性改变 |
| 类型与比较 | 用 `===`；显式转换输入字符串 | `NaN !== NaN`；用 `Number.isNaN`；`??` 只处理 null/undefined |
| 对象与数组 | 解构、map/filter、展开语法 | 展开是浅拷贝；嵌套对象仍共享引用 |
| 函数与闭包 | 用闭包保存模块状态 | 长期监听器闭包可能保留页面对象；及时移除 |
| `this` | 看调用方式；回调优先明确参数 | 箭头函数继承词法 this，不能用 bind 改它 |
| Promise 与 async | await 等待结果；try/catch 捕获失败 | async 不会自动开线程；CPU 重计算仍阻塞当前线程 |
| ES Modules | export/import 分离模块 | 构建工具负责解析依赖；浏览器不能直接理解任意 npm 包名 |
| 原型与 class | 用 class 表达对象行为和共享方法 | class 仍基于原型；别在读懂调用关系前背原型链图 |

## 浏览器基本使用与排错

1. Elements 看 DOM、盒模型、布局和可访问性；Console 看异常。
2. Network 看 URL、方法、状态码、请求头、响应和 Timing，先判断是否发出了请求。
3. Application 看 Cookie、Storage、缓存；存储可被脚本读取时不能当作安全保险箱。
4. Performance 看长任务、布局和绘制；Memory 看对象保留关系。

Cookie 可以随请求发送；localStorage 是同步的持久键值存储；sessionStorage 通常按标签页隔离。HttpOnly 防止脚本读取 Cookie，SameSite 限制跨站携带，Secure 要求安全传输，仍需要正确的服务端鉴权和 CSRF 防护。

## 常见场景：事件、异步与页面性能

- **事件委托**：父节点监听冒泡事件，适合动态列表；区分 `target` 与 `currentTarget`。不是所有事件都冒泡。
- **防抖**：输入停止后执行一次；**节流**：一段时间最多执行一次。二者都是客户端优化，服务端仍要限流。
- **请求并行**：独立请求使用 `Promise.all`；需要逐项得到成功/失败结果用 `allSettled`；取消和最大并发数要另行控制。
- **CPU 重任务**：先拆小任务；适合时放入 Web Worker。Worker 不能直接操作 DOM。
- **安全展示**：不可信文本优先 `textContent`；确需 HTML 时做可信消毒，不能直接塞进 `innerHTML`。

## 再深入：事件循环与渲染

```js
console.log('A')
setTimeout(() => console.log('B'), 0)
Promise.resolve().then(() => console.log('C'))
console.log('D') // A D C B
```

当前任务执行完后浏览器清空微任务队列，再在合适的时机更新渲染并执行后续任务。持续追加微任务可能饿死渲染。`requestAnimationFrame` 在下一次重绘前运行，不能保证任务执行完成后屏幕已呈现；DOM 写入和几何信息读取交替进行可能触发反复同步布局。

## 面试从使用逐步追问

| 基础题 | 场景追问 | 深入追问与回答边界 |
|---|---|---|
| const 能修改对象吗？ | 如何避免修改共享对象？ | 浅拷贝与深拷贝；JSON 拷贝不能保留所有类型 |
| async/await 怎么处理失败？ | 多个请求部分失败怎么办？ | Promise 状态、微任务；await 不等于线程阻塞 |
| 如何避免搜索结果乱序？ | abort 失败或响应已返回怎么办？ | 取消加版本校验；服务端副作用不由 abort 撤销 |
| 如何保存登录态？ | XSS 与 CSRF 分别怎么防？ | Cookie 属性、服务端会话、撤销与权限校验 |
| 页面为什么卡？ | 如何用工具证明？ | 长任务、布局、绘制、内存；先测量再改 |

掌握后阅读 [Vue 组件与页面基本使用](/doc/Vue/Vue组件与页面基本使用)，再进入 [响应式专题](/doc/Vue/响应式原理与实战解析)。
