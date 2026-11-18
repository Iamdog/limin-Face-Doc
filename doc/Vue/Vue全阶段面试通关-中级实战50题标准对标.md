# Vue全阶段面试通关-中级实战50题标准对标

本套题库针对 **中级前端工程师（2~4年经验 / 独立主导业务开发）** 深度定制，重点考核组合式 API 架构模式（Custom Hooks）、响应式进阶避坑、Vue Router 4 路由全链路守卫、Pinia 企业级状态管理、`nextTick` 异步更新时序及 Axios 网络层工程化实战。

---

## 模块一：组合式 API 与响应式进阶（1~12题）

### 01. 什么是组合式函数（Custom Hooks）？它相比 Vue 2 的 Mixins 有哪些决定性优势？
- **标杆回答**：
  - Custom Hooks 是利用 Vue 3 组合式 API（`ref`、`reactive`、`computed`、生命周期）封装的高内聚、可复用的有状态业务逻辑函数。
  - **对比 Mixins 的三大优势**：
  1. **数据来源清晰可溯**：Hooks 显式解构返回变量（如 `const { list, loading } = useTable()`），而 Mixins 的属性是隐式合并到 `this` 上的，难以判断属性属于哪个 Mixin；
  2. **绝对杜绝命名冲突**：Hooks 支持 ES6 解构重命名（`const { list: userList } = useTable()`），而多个 Mixins 声明同名变量或方法会发生无声覆盖；
  3. **参数传递与动态交互极其灵活**：Hooks 本质是纯 JS 函数，支持入参和返回值动态闭包交互，而 Mixins 无法灵活传参。

### 02. `shallowRef` 与 `ref` 的区别是什么？在什么场景下应该使用 `shallowRef`？
- **标杆回答**：
  - `ref` 会对传入的复杂对象进行深层递归响应式转换（底层调用 `reactive` 深度代理每一个嵌套属性）。
  - `shallowRef` **仅拦截 `.value` 属性本身的修改**，不会对对象内部的嵌套属性做深层代理。
  - **最佳实践场景**：当处理大型数据集合（如数万条只读表格数据）、第三方庞大复杂实例（如 Three.js 场景对象、ECharts 实例、Monaco Editor 实例）时，使用 `shallowRef` 能规避巨大的深层 Proxy 递归代理开销，大幅提升首屏加载性能。

### 03. `triggerRef` 的作用是什么？它通常与哪个 API 配合使用？
- **标杆回答**：
  - `triggerRef(shallowRefInstance)` 用于**强制手动触发**与一个 `shallowRef` 关联的全部副作用更新（依赖重新执行与 DOM 渲染）。
  - 通常在对 `shallowRef` 内部深层属性进行原地修改后调用：
    ```typescript
    const shallowData = shallowRef({ count: 1 })
    shallowData.value.count++ // 默认不会触发 DOM 更新
    triggerRef(shallowData)   // 强制通知视图更新
    ```

### 04. `readonly` 与 `shallowReadonly` 的核心机制是什么？在组件设计中有什么用？
- **标杆回答**：
  - `readonly` 接收一个对象并返回一个深层只读的代理对象，任何对属性的修改操作都会被拦截并在控制台发出警告。
  - `shallowReadonly` 仅在对象根层级是只读的，嵌套深层属性依然可以修改。
  - **组件架构用途**：在通过 `provide` 向下游子孙组件注入全局状态时，若要遵循“单向数据流”原则，通常使用 `readonly` 进行安全包裹，防止深层子组件误改全局共享状态。

### 05. `watch` 的第二个参数回调中，第三个参数 `onCleanup` 的物理作用是什么？如何解决异步请求竞态问题？
- **标杆回答**：
  - `onCleanup` 是一个用于**注册失效回调**的函数。当被监听的响应式数据再次发生改变、或者该侦听器被注销时，上一次注册的 `onCleanup` 回调会被首先执行。
  - **解决竞态（Race Condition）**：在用户高频输入触发搜索时，利用 `onCleanup` 取消上一次未完成的 Axios 请求（通过 `AbortController`），确保先发出的慢请求不会覆盖后发出的快请求返回的结果：
    ```typescript
    watch(keyword, (newVal, oldVal, onCleanup) => {
      const controller = new AbortController()
      fetchSearchResults(newVal, controller.signal)
      onCleanup(() => controller.abort()) // 取消上一次飞行中的请求
    })
    ```

### 06. 如何实现一个具有防抖（Debounce）功能的自定义 ref？
- **标杆回答**：
  - 使用 Vue 3 官方提供的 `customRef` API。
  - 示例实现：
    ```typescript
    import { customRef } from 'vue'

    export function useDebouncedRef<T>(value: T, delay = 300) {
      let timeoutId: number
      return customRef((track, trigger) => ({
        get() {
          track() // 收集依赖
          return value
        },
        set(newValue: T) {
          clearTimeout(timeoutId)
          timeoutId = window.setTimeout(() => {
            value = newValue
            trigger() // 延时触发更新
          }, delay)
        }
      }))
    }
    ```

### 07. `toRaw` 与 `markRaw` 的区别是什么？
- **标杆回答**：
  - `toRaw(proxy)`：用于从一个由 `reactive` 或 `readonly` 创建的 Proxy 代理中提取并返回其**底层的原始普通对象**。通常用于临时读取数据或执行外部非响应式运算，避免触发多余的响应式收集。
  - `markRaw(obj)`：显式为某个普通对象打上 `__v_skip` 标记，**使其永远无法被转换为响应式代理**。常用于跳过组件配置对象、第三方 SDK 实例的响应式劫持。

### 08. `computed` 计算属性可以被赋值修改吗？如何实现一个可写的计算属性？
- **标杆回答**：
  - 默认情况下传入单个函数创建的 `computed` 是只读的，尝试赋值会抛出控制台警告。
  - **可写计算属性**：通过传入一个包含 `get` 和 `set` 选项的对象即可实现：
    ```typescript
    const firstName = ref('John')
    const lastName = ref('Doe')

    const fullName = computed({
      get() {
        return `${firstName.value} ${lastName.value}`
      },
      set(newVal: string) {
        ;[firstName.value, lastName.value] = newVal.split(' ')
      }
    })
    ```

### 09. 为什么说在 `computed` 的 getter 中执行异步请求或修改外部响应式状态是严重的反模式（Anti-Pattern）？
- **标杆回答**：
  - 1. **计算属性必须是纯函数（Pure Function）**：`computed` 的职责是派生数据，其内部 getter 必须在同步调用时立即返回一个确定的值，无法等待异步 Promise；
  - 2. **破坏渲染纯净性与死循环风险**：若在 getter 内部修改其他响应式状态，会触发连锁的依赖更新，甚至与自身的重新求值形成**死循环循环依赖（Infinite Loop）**。

### 10. 如何检测一个变量是否为响应式对象？Vue 3 提供了哪些工具函数？
- **标杆回答**：
  - `isRef(val)`：检查是否为一个 ref 对象；
  - `isReactive(val)`：检查是否由 `reactive` 创建的代理；
  - `isReadonly(val)`：检查是否由 `readonly` 创建的代理；
  - `isProxy(val)`：检查对象是否由 `reactive` 或 `readonly` 创建的任意代理。

### 11. 在 `<script setup>` 中如何动态监听窗口 `resize` 并保持封装独立？
- **标杆回答**：
  - 封装为独立的组合式 Hook（`useWindowSize`）：
    ```typescript
    // composables/useWindowSize.ts
    import { ref, onMounted, onUnmounted } from 'vue'

    export function useWindowSize() {
      const width = ref(window.innerWidth)
      const height = ref(window.innerHeight)

      const update = () => {
        width.value = window.innerWidth
        height.value = window.innerHeight
      }

      onMounted(() => window.addEventListener('resize', update))
      onUnmounted(() => window.removeEventListener('resize', update))

      return { width, height }
    }
    ```

### 12. Vue 3 中为什么引入了 `EffectScope` API？它解决了组合式函数中的什么核心痛点？
- **标杆回答**：
  - **核心痛点**：在组件外部（如 Pinia 插件、独立状态管理服务或单例 Hook）创建的多个 `computed`、`watch`，不受组件生命周期约束，无法随组件销毁统一自动注销，极易造成游离的内存泄漏。
  - **EffectScope 物理机制**：提供了一个集中式的副作用作用域容器，使用 `scope = effectScope()` 包裹创建的全部计算和侦听器，当业务结束时只需调用 `scope.stop()`，即可一键批量注销容器内的所有响应式副作用。

---

## 模块二：高级组件通信与架构设计（13~25题）

### 13. Vue 3.4+ 引入的 `defineModel()` 宏有什么革命性意义？相比传统 `v-model` 代码减少了多少？
- **标杆回答**：
  - **传统模式**：子组件需要显式声明 `defineProps<{ modelValue: string }>()`，再声明 `defineEmits<{ (e: 'update:modelValue', val: string): void }>()`，并在数据修改时手动 `emit`。
  - **`defineModel()` 模式**：子组件仅需单行代码：
    ```typescript
    const model = defineModel<string>()
    ```
    它返回一个可直接在子组件内部双向读写的 `ref`。当子组件修改 `model.value = 'abc'` 时，底层会自动同步触发父组件的数据更新并派发对应事件。

### 14. 如何在一个自定义组件上绑定多个 `v-model`（Multi-v-model）？
- **标杆回答**：
  - 在 `v-model` 后附加具体的参数名：
    ```html
    <!-- 父组件 -->
    <UserProfile
      v-model:first-name="first"
      v-model:last-name="last"
    />
    ```
  - 子组件在 Vue 3.4+ 中使用：
    ```typescript
    const firstName = defineModel<string>('firstName')
    const lastName = defineModel<string>('lastName')
    ```

### 15. 什么是属性继承（Attribute Inheritance）？什么是 `$attrs`？
- **标杆回答**：
  - 当向子组件传递了属性或事件监听器，但子组件并没有在 `defineProps` 或 `defineEmits` 中显式声明时，这些多余的属性被称为**透传属性（Fallthrough Attributes）**（例如 `class`、`style`、`id`、`@click`）。
  - 在单根节点组件中，Vue 默认会自动将这些属性透传并应用到子组件的根 DOM 元素上。在 JS 中可以通过 `useAttrs()` 或模板中通过 `$attrs` 访问。

### 16. 什么时候必须设置 `inheritAttrs: false`？如何手动指定透传属性绑定的目标节点？
- **标杆回答**：
  - **场景**：当组件是多根节点组件，或者子组件内部包含复杂的包装容器，而开发者希望将外部传入的 `class`、`placeholder` 绑定到内部真正的原生 `<input>` 而非外层容器 `<div>` 时。
  - **处理 SOP**：
    1. 在 `<script setup>` 中声明禁用默认继承：
       ```vue
       <script setup>
       defineOptions({ inheritAttrs: false })
       </script>
       ```
    2. 在模板目标节点上通过 `v-bind="$attrs"` 手动显式绑定。

### 17. 动态组件 `<component :is="...">` 的 `:is` 属性支持传入哪些类型的值？
- **标杆回答**：
  - 1. **已注册的组件名称字符串**（如 `'UserTab'`）；
  - 2. **直接传入组件的定义对象（Component Definition）**（在 `<script setup>` 中直接 import 进来的组件变量）；
  - 3. **原生的标准 HTML 标签名**（如 `'button'`、`'div'`）。

### 18. `<KeepAlive>` 的 `include` 和 `exclude` 属性依据的是什么名称进行匹配的？开发时最容易踩的坑是什么？
- **标杆回答**：
  - 依据的是组件自身的**显式组件名称（`name` 属性）**，而不是路由的名称或引入时的变量名。
  - **高频避坑**：在 `<script setup>` 语法中，默认组件名会由文件名推断。如果文件名与配置不一致，或者路由切换时组件未显式声明匹配的 `name`（需使用 `defineOptions({ name: 'UserList' })`），会导致 `<KeepAlive>` 缓存完全失效。

### 19. `<KeepAlive>` 的 `max` 属性底层采用了什么缓存淘汰算法？
- **标杆回答**：
  - 底层采用的是 **LRU（Least Recently Used，最近最少使用）** 缓存淘汰算法。
  - 当缓存的组件实例数量达到 `max` 上限时，Vue 会在内部找到当前最久未被激活访问的组件实例，调用其销毁钩子将其物理卸载并移出内存，为新组件腾出缓存空间。

### 20. 路由切换结合 `<KeepAlive>` 时，正确的模板结构该怎么写？为什么不能把 `<KeepAlive>` 放在 `<router-view>` 外面？
- **标杆回答**：
  - 在 Vue Router 4 中，必须使用**作用域插槽写法**：
    ```vue
    <router-view v-slot="{ Component, route }">
      <keep-alive :include="['UserList']">
        <component :is="Component" :key="route.fullPath" />
      </keep-alive>
    </router-view>
    ```
  - 严禁将 `<keep-alive>` 直接包裹在 `<router-view>` 外部（Vue 2 老写法），否则会导致组件过渡动画与路由匹配链路错乱失效。

### 21. 什么是异步组件？在 Vue 3 中如何定义一个异步组件？
- **标杆回答**：
  - 异步组件是只有在组件真正需要呈现在屏幕上时才从网络端按需加载对应 JS 代码的机制。
  - 使用 `defineAsyncComponent` 定义：
    ```typescript
    import { defineAsyncComponent } from 'vue'

    const AsyncModal = defineAsyncComponent(() =>
      import('./components/HeavyModal.vue')
    )
    ```

### 22. `defineAsyncComponent` 支持哪些高级配置选项？
- **标杆回答**：
  - 支持配置骨架屏加载状态、超时时间与加载失败降级组件：
    ```typescript
    const AsyncComp = defineAsyncComponent({
      loader: () => import('./Foo.vue'),
      loadingComponent: LoadingSkeleton, // 加载中展示的组件
      delay: 200,                        // 延迟 200ms 展示 loading，避免闪烁
      errorComponent: ErrorNotice,       // 加载失败展示的组件
      timeout: 3000                      // 超过 3000ms 判定为超时
    })
    ```

### 23. `<Suspense>` 组件的核心作用是什么？它有两个什么关键插槽？
- **标杆回答**：
  - `<Suspense>` 用于在组件树中统一协调异步依赖（如子组件顶层包含 `await` 异步调用、或异步组件加载）的加载状态。
  - 两个核心插槽：
    1. `#default`：渲染异步依赖加载完毕后的正常内容；
    2. `#fallback`：在异步任务未完成期间展示的骨架屏或 Loading 占位。

### 24. 为什么说在没有 `<Suspense>` 时，子组件顶层书写 `await` 会导致控制台报错？
- **标杆回答**：
  - 如果在 `<script setup>` 中顶层直接书写 `await fetchUser()`，该组件会被 Vue 编译器标记为一个**异步组件（Async Component）**。
  - 在标准的 Vue 渲染流中，同步渲染器无法挂载未完成解析的异步组件，必须在其外层祖先节点中包裹 `<Suspense>` 提供加载边界，否则控制台直接报出组件挂载挂起异常。

### 25. 如何实现类似 Element Plus 的全局指令式弹窗调用（如 `ElMessage.success('成功')`）？
- **标杆回答**：
  - 使用底层渲染 API `createVNode` 与 `render`：
    ```typescript
    import { createVNode, render } from 'vue'
    import ToastComponent from './Toast.vue'

    export function showToast(message: string) {
      // 1. 创建挂载容器
      const container = document.createElement('div')
      document.body.appendChild(container)

      // 2. 创建虚拟节点
      const vnode = createVNode(ToastComponent, { message })

      // 3. 将虚拟节点渲染为真实 DOM 挂载
      render(vnode, container)

      // 4. 定时销毁
      setTimeout(() => {
        render(null, container) // 卸载组件
        container.remove()
      }, 3000)
    }
    ```

---

## 模块三：Vue Router 4 与 Pinia 现代化状态管理（26~37题）

### 26. Vue Router 4 的路由跳转中，`params` 和 `query` 传参有什么本质物理区别？
- **标杆回答**：
  - `query`：参数拼装在 URL 查询字符串中（形如 `/user?id=123`），刷新页面数据依然存在，类似 GET 请求传参；
  - `params`：用于动态路由匹配路径段（如路由配置 `/user/:id`，访问 `/user/123`）。
  - **重要升级避坑**：Vue Router 4 **正式废弃了未在路径声明的隐式 params 传参（即纯内存传参）**。若未在 `path` 中定义 `:paramName`，直接通过 `router.push({ name: 'User', params: { data } })` 会被直接忽略或在刷新后丢失。

### 27. 简述 Vue Router 4 一次完整路由导航的守卫执行顺序（从页面 A 跳转至页面 B）。
- **标杆回答**：
  - 1. 触发导航，在即将离开的原组件中执行 `beforeRouteLeave`；
  - 2. 执行全局前置守卫 `router.beforeEach`；
  - 3. 在重用的组件里执行 `beforeRouteUpdate`（若组件未被重用则不触发）；
  - 4. 在目标路由配置中执行路由独享守卫 `beforeEnter`；
  - 5. 解析异步路由组件；
  - 6. 在目标组件中执行 `beforeRouteEnter`；
  - 7. 执行全局解析守卫 `router.beforeResolve`；
  - 8. 导航确认通过；
  - 9. 执行全局后置钩子 `router.afterEach`；
  - 10. 触发 DOM 更新；
  - 11. 执行目标组件 `beforeRouteEnter` 守卫中传给 `next` 的回调（此时可访问组件实例 `vm`）。

### 28. 在 `router.beforeEach` 中做权限控制时，如果不写判断直接调用 `next('/login')`，为什么会导致浏览器报死循环堆栈溢出？
- **标杆回答**：
  - `next('/login')` 的物理实质是中断当前的导航，并**发起一次全新的导航进入 `/login` 路由**。
  - 进入全新的导航后，会重新从头触发 `router.beforeEach`。如果没有 `if (to.path !== '/login')` 的放行判断，代码会再次执行 `next('/login')`，形成无限死循环重定向，最终导致浏览器抛出 `Maximum call stack size exceeded`。

### 29. Vue Router 4 中如何配置 404 Not Found 通配符页面？
- **标杆回答**：
  - 必须使用自定义的正则语法（参数后跟 `(.*)*`）：
    ```typescript
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue')
    }
    ```

### 30. 什么是动态路由？如何使用 `router.addRoute` 实现基于 RBAC 的动态菜单权限挂载？
- **标杆回答**：
  - **动态路由**：应用初始只加载公共基础路由（如 Login、404），待用户登录获取到权限 Token 和菜单列表后，在运行时动态将具备访问权限的路由节点注册到路由表中。
  - **实现 SOP**：
    1. 在登录成功后请求后端接口获取权限标识列表；
    2. 过滤本地异步路由全集（AsyncRoutes）；
    3. 遍历匹配结果，循环调用 `router.addRoute(routeItem)` 或向父路由添加子路由 `router.addRoute('ParentName', childRoute)`；
    4. 若在导航守卫中执行添加，必须使用 `return to.fullPath` 进行重定向放行，确保新路由被完整识别。

### 31. Pinia 相比 Vuex 4 有哪些颠覆性改变？为什么去掉了 `mutations`？
- **标杆回答**：
  - 1. **全面废除 Mutations**：Vuex 区分 mutation（同步）与 action（异步）是为了在 DevTools 中追踪状态变更。Pinia 底层重构了追踪机制，直接允许在 `actions` 中书写同步或异步逻辑，代码复杂度直降 50%；
  - 2. **极致的 TypeScript 自动推导**：无需手写大量繁琐复杂的泛型接口映射，自动推断 state、getters 与 actions 类型；
  - 3. **扁平化多 Store 设计**：摒弃了 Vuex 晦涩庞大的单一状态树与嵌套命名空间（Namespaced Modules），每个 Store 都是一个独立的扁平化文件；
  - 4. **支持组合式 Store（Setup Store）**：支持使用类似 `<script setup>` 的函数语法组织 Store。

### 32. Pinia 的 Option Store 与 Setup Store 有什么区别？
- **标杆回答**：
  - **Option Store**：采用类似选项式的结构，包含 `state: () => ({})`、`getters: {}`、`actions: {}`。
  - **Setup Store**：直接传入一个函数，语法极其贴合 Vue 3 组合式语法：
    ```typescript
    export const useCounterStore = defineStore('counter', () => {
      const count = ref(0)                   // 对应 state
      const doubleCount = computed(() => count.value * 2) // 对应 getter
      function increment() { count.value++ } // 对应 action
      return { count, doubleCount, increment }
    })
    ```

### 33. 直接解构 Pinia 的 Store 状态（`const { count } = store`）会导致响应式丢失吗？该如何正确解构？
- **标杆回答**：
  - **会导致响应式彻底丢失**。因为 store 本质是一个被 `reactive` 包装的对象，直接解构会破坏 Proxy 代理关系。
  - **正确方式**：使用 Pinia 专属提供的 `storeToRefs()` 工具函数：
    ```typescript
    import { storeToRefs } from 'pinia'
    const store = useCounterStore()
    // 属性提取为 ref，保持响应式连接；方法可直接从 store 原型直接解构
    const { count, doubleCount } = storeToRefs(store)
    const { increment } = store
    ```

### 34. Pinia 的 `$patch` 方法有什么物理性能优势？
- **标杆回答**：
  - 若直接连续修改多个属性：`store.a = 1; store.b = 2; store.c = 3`，在底层可能会触发多次侦听器分发与响应式更新。
  - 使用 `store.$patch({ a: 1, b: 2, c: 3 })` 或传入补丁函数，Pinia 会将所有状态合并在一次批处理中原子性完成，**将多次渲染合并为单次通知**，大幅优化性能。

### 35. 如何实现 Pinia 状态的持久化（刷新页面不丢失）？手写一个简易持久化插件。
- **标杆回答**：
  - 利用 Pinia 提供的 `pinia.use()` 插件钩子：
    ```typescript
    export function piniaPersistPlugin({ store }: { store: any }) {
      // 1. 初始化时从 localStorage 恢复状态
      const savedState = localStorage.getItem(`pinia_${store.$id}`)
      if (savedState) {
        store.$patch(JSON.parse(savedState))
      }

      // 2. 状态改变时自动同步到本地存储
      store.$subscribe((mutation, state) => {
        localStorage.setItem(`pinia_${store.$id}`, JSON.stringify(state))
      })
    }

    // 注册插件
    // pinia.use(piniaPersistPlugin)
    ```

### 36. Pinia 中如何实现跨 Store 的相互调用？会导致死循环吗？
- **标杆回答**：
  - 可以直接在一个 Store 的 action 中通过 `const otherStore = useOtherStore()` 实例化并调用其属性或方法。
  - **避免循环死锁**：只要避免在两者的根初始化逻辑中相互同步调用即可，Pinia 的单例管理机制天然支持按需解耦调用。

### 37. 在组件卸载或用户退出登录时，如何快速重置整个 Pinia Store 到初始状态？
- **标杆回答**：
  - 对于 Option Store，直接调用内置方法：`store.$reset()`；
  - 对于 Setup Store，由于没有保留初始状态模板，`$reset()` 默认不可用，需在 Store 内部手动定义并暴露一个 `reset()` 函数将变量重置为其初始值。

---

## 模块四：异步更新时序、网络请求与业务工程化（38~50题）

### 38. `nextTick` 的底层物理机制是什么？为什么在 Vue 3 中改为了直接基于 `Promise.resolve()`？
- **标杆回答**：
  - **物理机制**：Vue 的响应式数据更新是**异步微任务批处理（Batched Updates）**的。当状态改变时，DOM 不会立刻同步更新，而是将 Watcher/Effect 推入异步队列。`nextTick` 将开发者传入的回调包裹为一个微任务，排在当前 DOM 渲染更新微任务的后面执行。
  - **Vue 3 简化**：现代浏览器已全面普及对 ES6 `Promise` 的支持，Vue 3 摒弃了 Vue 2 中复杂的 `setImmediate` / `MessageChannel` / `setTimeout` 降级逻辑，底层直接基于统一的 `Promise.resolve().then(...)` 派发微任务。

### 39. 遇到什么业务场景必须使用 `nextTick`？请列举两个典型案例。
- **标杆回答**：
  - **案例一：输入框显示并自动聚焦（Focus）**：点击“编辑”按钮将 `isEdit` 置为 `true`，此时 `<input v-if="isEdit" ref="inputRef">` 尚未在物理 DOM 中生成，必须在 `nextTick` 之后才能调用 `inputRef.value.focus()`；
  - **案例二：获取动态列表撑开后的最新高度**：向列表中 push 了 10 条数据后，立即读取容器的 `scrollHeight` 滚到底部，必须在 `nextTick` 之后获取，否则拿到的是未渲染新数据前的旧高度。

### 40. Axios 企业级封装中，请求拦截器和响应拦截器分别承担什么核心职责？
- **标杆回答**：
  - **请求拦截器（Request Interceptor）**：
    1. 自动在 HTTP Headers 中注入 JWT 认证信息（`Authorization: Bearer <token>`）；
    2. 生成请求指纹，拦截重复发起的相同请求；
    3. 携带客户端时区、语言（i18n）及全局 RequestId 追踪链标记。
  - **响应拦截器（Response Interceptor）**：
    1. 统一解构业务返回体（将 Axios 外层包裹的 `{ data, status }` 剥离，直接返回业务数据）；
    2. 统一处理全局 HTTP 状态码（401 未登录、403 权限不足、500 服务端故障）并弹出通知；
    3. 拦截 401 状态，无感调度刷新 Token 流程。

### 41. 如何利用 Axios 拦截器与 `AbortController` 彻底杜绝页面的“重复请求”？
- **标杆回答**：
  - **SOP 机制**：
  1. 定义全局 `Map` 存储飞行中的请求；
  2. 请求指纹计算：根据 `method + url + JSON.stringify(params) + JSON.stringify(data)` 计算唯一 Hash 作为 Map 的 Key；
  3. 请求发起前：检查 Map 中是否存在该 Key，若存在则调用 `controller.abort()` 取消前一个请求，并在 Map 中删除；
  4. 为当前请求创建新 `AbortController` 并存入 Map，将 `controller.signal` 传给 Axios 请求配置；
  5. 请求响应后（无论是成功还是失败）：从 Map 中清除对应的 Key。

### 42. 如何实现 JWT 双 Token（Access Token + Refresh Token）的无感静默刷新？
- **标杆回答**：
  - **核心链路**：
  1. 当接口返回 `401 Unauthorized` 时，暂存该失败请求到内部重试队列中；
  2. 检查全局是否正在刷新 Token（`isRefreshing` 锁标志位）；
  3. 若未在刷新，立马上锁，并调用 `/auth/refresh-token` 接口换取新 Access Token；
  4. 若此时有其他接口也返回 401，则将它们的回调作为 Promise 挂起收集在数组中；
  5. 刷新成功后，更新本地 Token，遍历重试队列中的全部挂起请求，重新携带新 Token 并重发；
  6. 若 Refresh Token 也已过期，则清除本地登录态，强制重定向跳转至登录页。

### 43. 现代前端复杂表单校验（如 Element Plus 表单）的校验原理是什么？
- **标杆回答**：
  - 核心基于开源库 **`async-validator`**。
  - 在 `<el-form :model="formData" :rules="formRules">` 中：
    - `el-form-item` 监听绑定的 `prop` 字段；
    - 当表单项触发 `blur` 或 `change` 事件时，提取对应字段的验证规则（Rules，包含 `required`、`pattern` 正则、`validator` 自定义异步函数）；
    - 实例化 `new AsyncValidator(descriptor)` 执行校验，并根据校验结果更新 `validateState`（error/success）及错误文案展示。

### 44. 如何手写一个 Vue 3 自定义按钮权限指令 `v-permission`？
- **标杆回答**：
  - 实现生命周期 `mounted`：
    ```typescript
    // directives/permission.ts
    import { Directive } from 'vue'
    import { useUserStore } from '@/stores/user'

    export const permissionDirective: Directive = {
      mounted(el, binding) {
        const { value: requiredPermission } = binding
        const userStore = useUserStore()
        const userPermissions = userStore.permissions

        if (requiredPermission && Array.isArray(requiredPermission)) {
          const hasPermission = userPermissions.some((perm) =>
            requiredPermission.includes(perm)
          )
          // 若无权限，直接在 DOM 树中移除该元素
          if (!hasPermission) {
            el.parentNode && el.parentNode.removeChild(el)
          }
        } else {
          throw new Error('v-permission 需要绑定权限数组，例如: v-permission="[\'admin\']"')
        }
      }
    }
    ```

### 45. 为什么自定义权限指令直接从 DOM 中 `removeChild` 存在安全漏洞？如何彻底防御？
- **标杆回答**：
  - **安全漏洞**：前端所有的 DOM 移除和按钮置灰本质上都是“防君子不防小人”。具有一定黑客技巧的用户完全可以通过 Chrome 开发者工具篡改内存，或者绕过前端 UI 直接通过 Postman / Curl 向后端接口发送恶意 HTTP 请求。
  - **防御原则**：**前端权限控制仅用于优化用户交互界面，核心业务与数据安全必须全部在后端网关与服务端接口层进行强制鉴权（RBAC / 权限拦截器）**。

### 46. 企业级中后台应用如何实现深色主题（Dark Mode）与动态换肤？
- **标杆回答**：
  - **基于 CSS 自定义属性（CSS Variables）与 HTML 属性标记**：
  1. 在根标签 `html` 上定义全局 CSS 变量：
     ```css
     :root { --bg-color: #ffffff; --text-color: #333333; }
     html.dark { --bg-color: #1a1a1a; --text-color: #ffffff; }
     ```
  2. 业务组件样式统一引用 CSS 变量：`background: var(--bg-color)`；
  3. 切换主题时，仅需通过 JS 在 `document.documentElement.classList.toggle('dark')` 动态增删类名，无需重新加载样式表，性能极高。

### 47. 在 Vite / Vue 3 中如何配置全局 SCSS 变量与 Mixins 自动注入？
- **标杆回答**：
  - 在 `vite.config.ts` 中配置 CSS 预处理器选项，避免在每个 SFC 文件手动 `@import`：
    ```typescript
    // vite.config.ts
    export default defineConfig({
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: `@use "@/styles/variables.scss" as *;`
          }
        }
      }
    })
    ```

### 48. 生产环境中静态资源加载 404（通常是发版后旧 Hash 资源被覆盖）导致页面崩溃，如何平滑治理？
- **标杆回答**：
  - 1. **CDN 增量发布保留机制**：发版时严禁全量清空 CDN 目录，必须保留至少最近 2~3 个版本的静态 Hash 资源，确保正在使用旧版本的用户不会因按需加载找不到 chunk 导致崩溃；
  - 2. **全局 Chunk 加载错误拦截**：在路由错误捕获 `router.onError` 中拦截 `Loading chunk failed`，弹窗提示或自动执行一次静默刷新（`window.location.reload()`）拉取最新入口。

### 49. 单页应用部署在 Nginx 后，刷新页面报 404 Not Found 的根本原因是什么？如何配置？
- **标杆回答**：
  - **根本原因**：在 HTML5 History 模式下，路由路径（如 `/dashboard/profile`）是纯前端虚拟路径，服务端物理磁盘上根本不存在对应的真实目录或静态文件。当刷新时，浏览器向 Nginx 发起该路径的 GET 请求，Nginx 找不到对应文件直接返回 404。
  - **Nginx 修复配置**：
    ```nginx
    location / {
        root   /usr/share/nginx/html;
        index  index.html;
        # 找不到真实物理资源时，统一回退重定向到 index.html
        try_files $uri $uri/ /index.html;
    }
    ```

### 50. 现代前端应用中，有哪些常用的首屏性能优化手段？请列出至少 5 点。
- **标杆回答**：
  - 1. **路由懒加载（Route Lazy Loading）**：结合动态 `import()` 将不同页面切片打包，避免首屏加载全部代码；
  - 2. **第三方依赖按需引入与 Tree-Shaking**：如 Element Plus 组件与样式的自动按需导入；
  - 3. **静态资源 Gzip / Brotli 压缩**：减小网络传输体积 60%~80%；
  - 4. **图片资源现代格式化与懒加载**：使用 WebP/AVIF 格式，配合 `loading="lazy"`；
  - 5. **CDN 分发与长期强缓存**：将第三方稳定库通过 CDN 加载，并配置静态资源 `Cache-Control: max-age=31536000, immutable`。
