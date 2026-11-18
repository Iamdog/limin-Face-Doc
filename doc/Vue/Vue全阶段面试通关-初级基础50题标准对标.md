# Vue全阶段面试通关-初级基础50题标准对标

本套题库针对 **初级前端工程师（0~2年经验 / 校招社招基础筑基）** 深度定制，全面覆盖 Vue 3 核心语法、模板指令、生命周期、基础组件通信与工程踩坑点。每道题均提炼自一线大厂真实高频面试，直击底层机制与防坑要点。

---

## 模块一：模板语法与核心指令（1~15题）

### 01. `v-if` 与 `v-show` 的底层物理区别是什么？在什么业务场景下该如何选型？
- **标杆回答**：
  - `v-if` 是**真正的条件渲染**。在底层，当条件为假时，Vue 根本不会在 DOM 树中创建对应的 VNode 真实节点；条件切换时会伴随完整的组件/DOM 销毁与重建（触发生命周期钩子）。
  - `v-show` 无论初始条件真假，**都会无条件创建真实 DOM 节点并挂载**，底层仅仅是通过操作 DOM 元素的 CSS 样式 `display: none` 来控制视觉显隐。
- **核心考点与避坑**：
  - 高频切换（如 Tab 标签页、下拉折叠面板）选 `v-show`，减少 DOM 重建与重排开销；
  - 很少切换、初始渲染开销大或依赖权限守卫（若无权限则绝对不能把敏感 DOM 暴露在审查元素中）选 `v-if`。

### 02. 为什么在 `v-for` 列表中必须绑定 `:key`？为什么严禁使用 `index` 下标作为 `key`？
- **标杆回答**：
  - `key` 是 VNode 的**唯一身份标识（UID）**。在虚拟 DOM 的 Diff 算法比对阶段，Vue 会首先比较新旧节点的 `key` 与 `tag` 是否一致。
  - 使用 `index` 作为 key 会破坏虚拟节点与其承载状态的身份映射。当在数组头部或中间插入/删除元素时，后续所有节点的 `index` 都会发生位移。导致 Vue 误判为“同一个节点”，触发错误的原地复用（In-place reuse），引发输入框数据错位、勾选框混乱或无意义的全量 DOM 重绘。
- **核心考点与避坑**：
  - 必须绑定稳定唯一的业务 ID（如 `item.id`）。若无 ID，需在数据拉取时使用 `nanoid` 等工具生成唯一标识。

### 03. 在 Vue 2 与 Vue 3 中，`v-if` 和 `v-for` 的优先级有何本质不同？为什么严禁写在同一个标签上？
- **标杆回答**：
  - **Vue 2** 中，`v-for` 的优先级**高于** `v-if`。如果写在同一标签上，会先循环遍历生成所有项，然后再逐个执行 `v-if` 判断，造成巨大的无用循环与性能浪费。
  - **Vue 3** 中，`v-if` 的优先级**高于** `v-for`。若写在同一标签上，`v-if` 会在循环执行前求值，此时循环变量（如 `item`）尚未定义，控制台直接抛出 `ReferenceError: item is not defined`。
- **核心考点与避坑**：
  - 过滤场景：优先通过 `computed` 计算属性在 JS 层面提前过滤列表；
  - 控制外层显隐场景：在 `v-for` 外部套一层 `<template v-if="...">`。

### 04. `v-model` 的本质是什么？在原生表单控件上它是如何做语法糖展开的？
- **标杆回答**：
  - `v-model` 是一个**双向数据绑定的复合语法糖**。
  - 在原生 `<input type="text">` 上，它等价于：
    ```html
    <input :value="searchText" @input="searchText = $event.target.value" />
    ```
  - 对于复选框（Checkbox），它底层绑定的是 `:checked` 属性和 `@change` 事件；对于单选框（Radio）和下拉框（Select），底层绑定的是 `:value` 和 `@change` 事件。
- **核心考点与避坑**：
  - 原生中文输入法（IME 输入法）在输入拼音过程中，`v-model` 默认会监听 `compositionstart` 和 `compositionend` 事件，避免拼音输入中途频繁触发响应式赋值。

### 05. `v-model` 常用修饰符 `.lazy`、`.number`、`.trim` 的实际作用是什么？
- **标杆回答**：
  - `.lazy`：将底层的监听事件从 `@input`（每次击键实时触发）转变为 `@change`（失去焦点或按回车时才同步）；
  - `.number`：自动通过 `parseFloat()` 将用户输入的字符串转换为数字；若无法解析为数字，则保留原值；
  - `.trim`：自动过滤用户在输入框首尾键入的空白字符。

### 06. `v-bind` 的常见缩写是什么？如何动态绑定多个属性对象？
- **标杆回答**：
  - 缩写为 `:`。例如 `v-bind:id="dynamicId"` 等价于 `:id="dynamicId"`。在 Vue 3.4+ 中，同名属性可进一步简写为 `:id`。
  - 动态批量绑定属性：直接使用不带参数的 `v-bind="attrsObject"`，例如 `attrsObject = { id: 'btn', disabled: true }`，Vue 会将该对象的所有键值对自动批量解构成 DOM 属性。

### 07. 事件修饰符 `.stop`、`.prevent`、`.self`、`.capture`、`.once` 的具体含义？
- **标杆回答**：
  - `.stop`：调用 `event.stopPropagation()`，阻止事件向上冒泡；
  - `.prevent`：调用 `event.preventDefault()`，阻止元素默认行为（如表单提交跳转、a 标签跳转）；
  - `.self`：只有当事件是从当前绑定元素本身触发时才执行回调（忽略子元素冒泡上来的事件）；
  - `.capture`：事件在捕获阶段而非冒泡阶段触发处理；
  - `.once`：事件回调仅执行一次，随后自动解绑。

### 08. `v-html` 的作用是什么？为什么使用它存在极高的安全风险？
- **标杆回答**：
  - `v-html` 用于更新元素的 `innerHTML`，将绑定的字符串作为纯 HTML 标签解析渲染，而不是转义为纯文本。
  - **安全风险**：如果渲染的内容来源于用户不可信输入（如富文本评论、用户昵称），未经清洗的输入极易包含恶意脚本（如 `<img src=x onerror=alert(document.cookie)>`），引发严重的**存储型或反射型 XSS（跨站脚本攻击）**。
- **核心考点与避坑**：
  - 渲染富文本必须使用 `DOMPurify` 库进行严格消毒清洗：`DOMPurify.sanitize(dirtyHtml)`。

### 09. `v-once` 与 `v-memo` 指令的物理作用与性能优化原理是什么？
- **标杆回答**：
  - `v-once`：标记的元素或组件仅在初次渲染时计算一次，随后所有数据更新都会跳过该节点树的比对，其 VNode 会被缓存在内存中。
  - `v-memo="[dep1, dep2]"`（Vue 3.2+）：条件记忆指令。只有当依赖数组中的值发生改变时，才会重新比对和渲染子树；若依赖未变，则直接复用旧 VNode，跳过子树的虚拟 DOM Diff。
- **核心考点与避坑**：
  - `v-memo` 在包含 1000+ 条大型 `v-for` 复杂列表中搭配使用时，能大幅提升局部更新性能。

### 10. `v-cloak` 的物理作用是什么？如何解决页面加载瞬间的模板胡子语法 <code>&#123;&#123; &#125;&#125;</code> 闪烁？
- **标杆回答**：
  - 在纯 HTML 静态页面引入 Vue 时，当 JS 尚未完全下载并执行编译前，浏览器会短暂露出未经解析的原始模板双大括号 <code>&#123;&#123; message &#125;&#125;</code>。
  - `v-cloak` 指令会一直保留在 HTML 元素上，直到关联的 Vue 实例编译挂载完成才被移除。
- **核心考点与避坑**：
  - 配合 CSS 规则：`[v-cloak] { display: none; }`，在 Vue 准备就绪前将未编译区域隐藏。

### 11. 动态属性名与动态事件名在模板中该如何书写？
- **标杆回答**：
  - 使用中括号包裹表达式：
    ```html
    <a :[attributeName]="url" @[eventName]="handleClick">链接</a>
    ```
  - 当 `attributeName` 求值为 `'href'` 时，等价于 `:href="url"`；当求值为 `null` 时，该绑定会被显式移除。

### 12. 模板表达式中有哪些语法限制？为什么不能写复杂的 JS 逻辑？
- **标杆回答**：
  - 模板表达式仅支持**单个单一的 JavaScript 表达式**（有明确返回值的单行语句），例如 <code>&#123;&#123; ok ? 'YES' : 'NO' &#125;&#125;</code>、<code>&#123;&#123; list.reverse() &#125;&#125;</code>。
  - 不支持多行声明、变量赋值（`a = 1`）、控制流语句（`if (ok) { ... }`、`for` 循环）。
  - 过度复杂的逻辑破坏了视图与业务的分离原则，且会导致模板每次重新渲染时反复执行，难以做缓存优化。应收敛至 `computed`。

### 13. `class` 和 `style` 在 Vue 中支持哪些高级绑定形式？
- **标杆回答**：
  - `class` 支持**对象语法**（`:class="{ active: isActive, 'text-danger': hasError }"`）与**数组语法**（`:class="[activeClass, errorClass]"`），还支持在数组中嵌套对象。
  - `style` 支持**内联对象语法**（`:style="{ color: activeColor, fontSize: fontSize + 'px' }"`）与**样式对象数组**（`:style="[baseStyles, overridingStyles]"`），Vue 会自动根据当前浏览器内核为特定 CSS 属性补全前缀（如 `-webkit-`）。

### 14. 为什么 Vue 3 模板支持多个根节点（Fragments），而 Vue 2 必须只有一个根标签？
- **标杆回答**：
  - **Vue 2** 的虚拟节点树要求每个组件实例必须对应一个单一的根 DOM 节点（Single Root Node），否则内部渲染器和 Diff 算法无法定位边界。
  - **Vue 3** 引入了 **Fragments（片段）** 特性。在底层，多根节点组件会被编译为一个类型为 `Fragment` 的虚拟节点容器，其实际 DOM 挂载时通过内部维护的起止锚点（Anchor）进行定位，避免了无意义的包裹性 `<div>` 标签层级膨胀。

### 15. `<template>` 标签在 Vue 模板中有什么特殊物理表现？
- **标杆回答**：
  - `<template>` 是一个**不可见的包装容器**。
  - 它在最终渲染为真实 DOM 树时自身**绝对不会被渲染成任何真实的 HTML 标签**。
  - 常用于配合 `v-if` 或 `v-for` 进行多元素分组条件控制，或者在组件中承载具名插槽内容（`<template #header>`）。

---

## 模块二：响应式基础、计算属性与侦听器（16~25题）

### 16. `ref` 和 `reactive` 的底层原理区别是什么？定义普通基础类型为什么必须用 `ref`？
- **标杆回答**：
  - `ref` 底层是通过面向对象中的 **Getter / Setter 属性访问器（RefImpl 类）** 实现的，内部维护了一个私有的 `.value` 属性来做依赖收集（`track`）与触发（`trigger`）。
  - `reactive` 底层直接通过 ES6 原生 `Proxy` 拦截对象的读写操作。
  - 由于 JavaScript 中原始基础类型（`number`、`string`、`boolean`）是按值传递的，无法通过 `Proxy` 直接代理，因此必须使用 `ref` 包裹一层具有引用特性的对象结构。

### 17. 为什么在 `<script setup>` 中访问 `ref` 必须带 `.value`，而在 `<template>` 中却不需要？
- **标杆回答**：
  - 在 JS 运行上下文中，`ref` 本质上是一个普通的 JavaScript 对象（实例包含 `.value` 属性），因此必须显式访问 `.value`。
  - 在模板中，Vue 编译器在将模板编译为渲染函数时，底层会自动通过 `unref()` 辅助函数对顶层声明的 `ref` 进行**自动解包（Automatic Unwrapping）**，从而优化模板可读性。

### 18. `computed` 计算属性与普通 `methods` 方法有何本质物理区别？
- **标杆回答**：
  - `computed` 具备**基于响应式依赖的缓存机制（Caching）**。计算属性只会在它依赖的响应式数据发生物理改变时才重新计算求值；如果依赖没有改变，无论组件被重新渲染多少次，访问计算属性都会立即返回之前缓存好的计算结果。
  - `methods` 方法**完全没有缓存**。只要组件所在的视图发生重新渲染，模板中调用的方法就必定会被完整重新执行一次。

### 19. `computed` 与 `watch` 的使用场景有什么区别？
- **标杆回答**：
  - `computed` 侧重于**基于已有数据派生出新数据**，具有返回值，且必须遵循纯函数原则（无副作用）。
  - `watch` 侧重于**监听某个数据的变化并执行相应的业务副作用（Side Effects）**，例如发起异步网络请求、手动操作外部 DOM、记录用户操作日志等，无需返回值。

### 20. `watch` 和 `watchEffect` 的核心区别是什么？
- **标杆回答**：
  - **依赖收集方式**：`watch` 必须显式声明被监听的目标数据源；`watchEffect` 会在回调执行期间**自动自动收集其函数体内访问到的所有响应式属性**。
  - **初次执行时机**：`watch` 默认是**惰性（lazy）**的，初始挂载时不执行（除非配置 `{ immediate: true }`）；`watchEffect` 在创建时会**立即无条件执行一次**，以完成初始依赖收集。
  - **访问旧值能力**：`watch` 能同时拿到新值（`newValue`）和旧值（`oldValue`）；`watchEffect` 无法获取旧值。

### 21. 使用 `reactive` 定义的对象如果直接整体重新赋值（`state = reactive({...})`），为什么会丢失响应式？
- **标杆回答**：
  - `reactive` 返回的是一个指向底层真实对象的 `Proxy` 代理引用。
  - 如果执行 `state = { ... }`，相当于将局部变量 `state` 的物理内存指针重新指向了一个全新的普通非响应式 JS 对象，之前由 Vue `Proxy` 拦截的响应式关系被彻底切断。
- **核心考点与避坑**：
  - 解决方案一：改用 `ref`（`state.value = { ... }` 触发 setter）；
  - 解决方案二：使用 `Object.assign(state, newData)` 仅修改对象内部属性。

### 22. 对 `reactive` 对象进行解构赋值（`const { name } = state`）为什么会丢失响应式？如何解决？
- **标杆回答**：
  - ES6 解构语法本质上是进行底层**值的浅拷贝**。若 `name` 是基础类型（如字符串），解构后得到的仅仅是一个独立的普通内存变量，脱离了原 `Proxy` 对象的 getter 拦截范围。
  - **解决机制**：使用 Vue 官方提供的 `toRefs(state)` 或 `toRef(state, 'name')` 工具函数，将对象的每个属性都转换为单独的 `ObjectRefImpl` 引用，保持与原对象的响应式物理绑定。

### 23. `watch` 监听一个对象内部属性时，写 `watch(state.user.name, fn)` 为什么会报错或失效？正确的语法是什么？
- **标杆回答**：
  - `state.user.name` 求值后是一个具体的字符串字面量（如 `'Tom'`），而不是响应式对象或 ref，`watch` 无法对一个纯字面量进行依赖追踪。
  - **标准写法**：必须使用**Getter 函数**包装：
    ```typescript
    watch(() => state.user.name, (newVal, oldVal) => {
      console.log('User name changed:', newVal)
    })
    ```

### 24. `watch` 的配置项 `deep: true`、`flush: 'post'` 分别代表什么含义？
- **标杆回答**：
  - `deep: true`：开启深度递归遍历监听。Vue 会深度遍历被监听对象的所有嵌套属性，任何层级发生修改都会触发回调（性能开销大，慎用）。
  - `flush: 'post'`：将侦听器回调的触发时机延迟到**DOM 重新渲染之后**。默认情况下（`flush: 'pre'`），侦听器回调在 DOM 重新渲染前执行，此时在回调内部通过 ref 访问 DOM 拿到的仍然是更新前的旧状态。

### 25. 如何在组件销毁前手动停止一个侦听器？
- **标杆回答**：
  - 调用 `watch` 或 `watchEffect` 时，它会返回一个**停止句柄（Stop Handle）函数**。
  - 仅需显式调用该句柄即可：
    ```typescript
    const unwatch = watch(source, callback)
    // 在特定业务条件下注销
    unwatch()
    ```
  - 注：在 `<script setup>` 同步语句中创建的侦听器，当宿主组件卸载时 Vue 会自动注销，无需手动清理；但在异步回调中创建的侦听器必须手动管理。

---

## 模块三：组件基础与生命周期（26~38题）

### 26. Vue 3 的生命周期钩子相比 Vue 2 有哪些命名变化？
- **标杆回答**：
  - Vue 2 的 `beforeCreate` 与 `created` 在 Vue 3 组合式 API 中**直接被移除**，其代码逻辑直接在 `<script setup>` 的顶层作用域中同步执行。
  - 其余生命周期统一前缀加上 `on`，并采用驼峰命名：
    - `beforeMount` -> `onBeforeMount`
    - `mounted` -> `onMounted`
    - `beforeUpdate` -> `onBeforeUpdate`
    - `updated` -> `onUpdated`
    - `beforeDestroy` -> `onBeforeUnmount`
    - `destroyed` -> `onUnmounted`
    - `activated` -> `onActivated`（搭配 KeepAlive）
    - `deactivated` -> `onDeactivated`（搭配 KeepAlive）

### 27. 组件初次渲染挂载时，父子组件的生命周期执行顺序是怎样的？
- **标杆回答**：
  - 遵循**洋葱模型（嵌套深度优先遍历）**：
  1. 父组件 `setup()` / `onBeforeMount` 执行；
  2. 遇到子组件，开始初始化子组件；
  3. 子组件 `setup()` / `onBeforeMount` 执行；
  4. 子组件挂载完成，执行子组件 `onMounted`；
  5. 所有子组件均挂载完毕后，最后执行父组件 `onMounted`。

### 28. 组件发生数据更新时，父子组件的生命周期更新顺序是怎样的？
- **标杆回答**：
  - 1. 父组件触发状态更新，执行父组件 `onBeforeUpdate`；
  - 2. 子组件接收到新的 props，执行子组件 `onBeforeUpdate`；
  - 3. 子组件完成虚拟 DOM Diff 与真实 DOM 渲染，执行子组件 `onUpdated`；
  - 4. 父组件完成渲染，执行父组件 `onUpdated`。

### 29. 组件销毁卸载时，父子组件的生命周期执行顺序是怎样的？
- **标杆回答**：
  - 1. 父组件准备卸载，执行父组件 `onBeforeUnmount`；
  - 2. 子组件开始销毁，执行子组件 `onBeforeUnmount`；
  - 3. 子组件彻底销毁，执行子组件 `onUnmounted`；
  - 4. 父组件彻底销毁，执行父组件 `onUnmounted`。

### 30. `onMounted` 和 `onUnmounted` 钩子通常用来处理哪些业务逻辑？
- **标杆回答**：
  - `onMounted`：此时真实 DOM 节点已挂载完成，用于获取 DOM 几何尺寸、初始化第三方 SDK（ECharts 图表、高德地图、富文本编辑器）、注册全局事件（`window.addEventListener`）或启动定时器。
  - `onUnmounted`：用于**清理系统资源、防止内存泄漏**。包括注销全局监听器、`clearInterval` 清理定时器、调用第三方实例的 `dispose()` 或 `destroy()` 方法。

### 31. 父组件向子组件传参使用什么 API？子组件如何进行类型约束与默认值定义？
- **标杆回答**：
  - 使用 `defineProps` 宏。
  - TypeScript 规范写法（结合 `withDefaults`）：
    ```vue
    <script setup lang="ts">
    interface Props {
      title: string
      count?: number
    }
    const props = withDefaults(defineProps<Props>(), {
      count: 0
    })
    </script>
    ```

### 32. 什么是单向数据流原则（One-Way Data Flow）？为什么严禁子组件直接修改 `props`？
- **标杆回答**：
  - **核心定义**：所有的 props 都遵循从父组件流向子组件的单向流动。父组件的更新会自动下发至子组件，但反之不允许。
  - **严禁直接修改的原因**：防止子组件意外突变修改父组件的内部状态，导致应用的数据流向变得混乱无序，产生极其隐蔽的调试噩梦。如果子组件直接修改 props，Vue 会在开发控制台抛出警告：`Avoid mutating a prop directly...`。

### 33. 子组件向父组件通信的标准机制是什么？
- **标杆回答**：
  - 使用 `defineEmits` 宏派发自定义事件。
  - 子组件声明事件并通过 `emit` 发送数据，父组件在调用子组件的标签上通过 `@event-name` 监听：
    ```vue
    <!-- 子组件 -->
    <script setup lang="ts">
    const emit = defineEmits<{
      (e: 'change', id: number): void
    }>()
    function handleClick() {
      emit('change', 123)
    }
    </script>
    ```

### 34. 什么是默认插槽（Default Slot）与具名插槽（Named Slot）？
- **标杆回答**：
  - 插槽 `<slot>` 是子组件预留给父组件传入自定义 HTML 结构的**占位符**。
  - **默认插槽**：不带 `name` 属性的 `<slot />`，父组件直接在组件标签内嵌套的内容都会默认填充到此处。
  - **具名插槽**：带有 `name` 属性的插槽（如 `<slot name="header" />`），父组件使用 `<template #header>` 或 `<template v-slot:header>` 进行精准投递。

### 35. 什么是作用域插槽（Scoped Slot）？它解决了什么核心痛点？
- **标杆回答**：
  - **核心痛点**：父组件向插槽提供内容模版，但模版展示的数据却存在于子组件内部（例如：通用表格组件，表头在父组件控制，但每一行的数据在子组件内部遍历）。
  - **物理机制**：子组件在 `<slot :row="item" :index="index">` 标签上像传 props 一样向外透传数据；父组件通过 `<template #default="slotProps">` 接收子组件暴露的数据并在父级渲染。

### 36. 模板引用 `ref` 在组件上和在普通 DOM 元素上有何区别？
- **标杆回答**：
  - 绑定在**普通 DOM 元素**上（如 `<div ref="myDiv">`），获取到的是浏览器原生 HTMLElement 真实 DOM 对象。
  - 绑定在**子组件标签**上（如 `<MyChild ref="childRef">`），在 Vue 3 中获取到的是经过 `defineExpose` 暴露的子组件实例代理对象。

### 37. 为什么在 `<script setup>` 中，父组件通过 `ref` 拿不到子组件内部定义的属性和方法？
- **标杆回答**：
  - 使用 `<script setup>` 语法的组件是**默认完全封闭（Closed by default）**的。
  - 组件内部声明的变量、ref 和函数，均不会自动挂载暴露到组件公共实例（Public Instance）上。
  - **解决方案**：子组件必须显式使用 `defineExpose` 宏将允许外部访问的属性或方法导出：
    ```typescript
    defineExpose({
      resetForm,
      submit
    })
    ```

### 38. `provide` 与 `inject` 适用于什么场景？它们如何保持响应式？
- **标杆回答**：
  - 适用于**深度嵌套的跨层级组件通信**（如祖父组件向孙子组件传值），彻底避免了一层层透传 props 的“属性钻取（Prop Drilling）”痛点。
  - **保持响应式**：父级在 `provide('theme', themeRef)` 时传入一个 `ref` 或 `reactive` 响应式对象，底层组件通过 `inject('theme')` 接收后，当祖先数据更新时子孙组件会自动响应式更新。遵循单向数据流原则，建议提供者同时暴露修改方法供下游调用。

---

## 模块四：样式隔离、工程化与综合避坑（39~50题）

### 39. `<style scoped>` 的底层样式隔离物理原理是什么？
- **标杆回答**：
  - 基于 PostCSS 在编译阶段实施代码转换：
  1. 给当前 SFC 组件模板中的每一个真实 DOM 节点附加一个唯一的、确定性的属性哈希（如 `data-v-7ba5bd90`）；
  2. 给当前 `<style scoped>` 内书写的所有 CSS 选择器末尾附加对应的属性选择器（如 `.title` 编译为 `.title[data-v-7ba5bd90]`）；
  3. 通过属性选择器的特异性（Specificity），保证样式仅对当前组件内的 DOM 生效。

### 40. 深度选择器 `:deep()`（深度作用选择器）的物理作用是什么？在什么场景下必须使用？
- **标杆回答**：
  - **物理作用**：在开启 `scoped` 时，如果想穿透当前组件去修改第三方组件库（如 Element Plus / Ant Design）内部未打上当前组件 `data-v-hash` 的深层子 DOM 样式。
  - **编译推导**：
    - 源码：`.parent :deep(.el-button)`
    - 编译产物：`.parent[data-v-7ba5bd90] .el-button`
    - 将属性哈希前置到父级选择器上，从而使子组件内部的 `.el-button` 成功匹配到样式。

### 41. Vue 3 中如何在 `<style>` 标签中直接使用 JS 变量（CSS 变量驱动）？
- **标杆回答**：
  - 使用单文件组件内置的 `v-bind()` CSS 函数：
    ```vue
    <script setup>
    import { ref } from 'vue'
    const themeColor = ref('#42b883')
    </script>
    <style scoped>
    .header {
      color: v-bind(themeColor);
    }
    </style>
    ```
  - 底层原理：Vue 会将该变量编译为一个挂载在组件根节点上的内联 CSS 自定义属性（CSS Variable，如 `--xxxx: #42b883`），样式表直接引用该 CSS 变量。

### 42. 在 Vue 3 中，直接通过索引修改数组某一项（`list[0] = newItem`），视图会更新吗？为什么？
- **标杆回答**：
  - **Vue 3 会正常响应式更新**。
  - 因为 Vue 3 的 `reactive` 底层采用 ES6 `Proxy`，原生拦截了数组对象的属性写入与下标设置操作（`set` trap）以及数组长度变更。
  - **对比 Vue 2**：Vue 2 底层基于 `Object.defineProperty`，由于性能考量没有对数组每个数字下标设置 getter/setter，直接通过索引赋值（`arr[0] = val`）或直接修改 `arr.length` 无法触发视图更新，必须使用 `Vue.set()` 或数组变异方法（`splice`）。

### 43. 为什么为响应式对象动态添加新属性在 Vue 3 中无需像 Vue 2 那样调用 `$set`？
- **标杆回答**：
  - **Vue 2** 基于 `Object.defineProperty`，只能在初始化时递归遍历对象已有属性并劫持；如果在运行时新增属性，由于未经过拦截器定义，无法触发依赖更新，必须借助 `this.$set()` 手动通知。
  - **Vue 3** 基于 `Proxy`，代理的是整个对象本身而非具体的某个属性，对不存在的属性进行赋值会直接被 `Proxy` 的 `set(target, key, value)` 拦截器捕获并触发响应式更新。

### 44. `<script setup>` 相比传统的组合式 API `setup()` 函数有哪些巨大优势？
- **标杆回答**：
  - 1. **代码大幅精简**：顶层声明的变量、函数、import 导入均可直接在模板中消费，彻底消除了冗余复杂的 `return { ... }` 样板代码；
  - 2. **更好的 TypeScript 深度支持**：使用纯类型声明式宏（`defineProps<Props>()`）极其简洁自然；
  - 3. **更优的运行时编译性能**：模板会被编译为内联在 `setup` 作用域内的渲染函数，减少了作用域链查找和实例代理开销。

### 45. SFC 单文件组件中，为什么组件的名称应该采用 PascalCase 或多单词连字符？
- **标杆回答**：
  - 避免与原生标准 HTML 标签（如 `<header>`、`<footer>`、`<main>`、`<dialog>`）产生命名冲突；
  - 便于构建工具与 IDE 静态分析快速识别这是一个自定义 Vue 组件还是原生 DOM 节点。

### 46. 为什么有时候在 `onMounted` 钩子中通过 ref 获取 DOM 依然会拿到 `null`？
- **标杆回答**：
  - 1. 该 DOM 元素被包裹在初始值为 `false` 的 `v-if` 条件块中，由于 `v-if` 的惰性，DOM 尚未创建；
  - 2. 声明的 `const elRef = ref(null)` 变量名称与模板中的 `ref="elRef"` 拼写不严格一致；
  - 3. DOM 位于异步子组件中，父组件的 `onMounted` 执行时异步子组件尚未加载解析完成。

### 47. 什么是 Teleport 组件？它解决了什么 DOM 层叠上下文痛点？
- **标杆回答**：
  - `<Teleport to="body">` 允许将子组件的内容在物理 DOM 结构上“瞬移”渲染到指定的外部容器（如 `<body>`），而逻辑上该组件依然保持与当前父组件的组件树层级关系。
  - **痛点**：模态弹窗（Modal）、通知气泡（Toast）如果嵌套在深层父组件内部，父组件若设置了 `overflow: hidden` 或 `transform` / `filter`，会导致弹窗被裁剪或 `z-index` 层叠上下文失效。通过 Teleport 可以轻松挂载至根节点。

### 48. 什么是 KeepAlive 组件？它的底层缓存机制是什么？
- **标杆回答**：
  - `<KeepAlive>` 用于在多个组件动态切换（如通过 `<component :is="...">` 或路由切换）时，**将非激活的组件实例保存在内存中，而不是销毁它们**。
  - 当组件被切换隐藏时，不会触发 `onBeforeUnmount` 和 `onUnmounted`，而是触发专属的 `onDeactivated`；重新激活时触发 `onActivated`，从而保留用户的表单输入与滚动位置。

### 49. 控制台报错 `Hydration completed but contains mismatches` 是什么原因引起的？
- **标杆回答**：
  - 这是服务端渲染（SSR）或静态站点生成（SSG）时的典型“水合不一致”警告。
  - 根本原因：**Node 服务端直出的静态 HTML 结构与客户端执行 JavaScript 初次渲染出的虚拟 DOM 树结构不匹配**。
  - 常见诱因：在模板中使用了客户端特有的环境变量（如 `window`、`localStorage`）、动态时间戳（`Date.now()`）或随机数（`Math.random()`）。

### 50. 为什么在 Vue 3 项目开发中，绝不推荐通过 `app.config.globalProperties` 滥用全局挂载？
- **标杆回答**：
  - 1. **隐式依赖破坏可维护性**：在组合式 API 中无法通过 `this` 访问，必须通过 `getCurrentInstance()` 绕路获取，代码极其晦涩；
  - 2. **TypeScript 类型推导困难**：需要对 `ComponentCustomProperties` 进行繁琐的接口合并声明；
  - 3. **Tree-Shaking 失效**：挂载在全局原型上的工具方法无法被 Rollup 静态分析摇除，即使没有页面使用也会被全量打包进生产产物。推荐使用标准 ESM `import` 或 `provide / inject` 方案。
