# 计算属性 computed 与侦听器 watch 及 methods 全方位对比

在 Vue 应用开发中，处理响应式数据的变化与衍生计算有三把核心武器：**计算属性（`computed`）**、**侦听器（`watch` / `watchEffect`）** 以及 **普通方法（`methods`）**。初学者在面临具体业务场景时，经常纠结到底该选哪一个，甚至在 `computed` 内部发起异步网络请求引发严重性能倒退。本专题通过详尽的对比矩阵、底层机制分析与真实业务代码，彻底为你理顺这三者的边界与最佳实践。

---

## 白话原理解释与核心对比矩阵

### 三者核心差异全景对照

| 维度 | 计算属性（`computed`） | 侦听器（`watch`） | 普通方法（`methods` / 函数） |
| :--- | :--- | :--- | :--- |
| **物理机制** | **基于响应式依赖进行缓存**。只有依赖的数据变了才重新计算，否则直接取内存缓存 | **监听指定数据的变化并执行副作用**。数据变动时立即触发自定义回调 | **无任何缓存机制**。只要所在组件触发重新渲染，函数必被全量重新执行 |
| **是否支持异步** | **绝对不支持**。内部必须是纯同步计算并返回结果，严禁异步请求与延时操作 | **完美支持**。专门用于在数据变化时发起异步接口请求、操作本地存储或执行耗时运算 | **支持**。可自由定义为 async 函数 |
| **必须有返回值吗** | **必须有**（必须通过 `return` 产生一个值供模板或代码消费） | **通常没有**（核心是执行业务逻辑副作用） | 视业务而定 |
| **生活通俗类比** | **带记忆功能的计算器**：如果输入的商品单价和数量没变，直接看之前写好的总价，不按键盘重算 | **尽职尽责的保安**：一旦发现监控里某扇门被打开了，立刻拉响警报并向指挥中心报告 | **随叫随到的搬砖工**：只要有人喊一声开工，不管砖头有没有变化，从头到尾再搬一遍 |

---

## 保姆级核心代码演示

### 购物车总价计算与搜索防抖侦听演示组件（`src/components/ComputedWatchDemo.vue`）

```vue
<template>
  <div class="demo-wrapper">
    <h2>1. computed 计算属性与缓存机制实战</h2>
    
    <div class="cart-box">
      <div class="item-row">
        <span>商品单价: ¥{{ price }}</span>
        <div class="stepper">
          <button @click="quantity > 1 ? quantity-- : null">-</button>
          <span class="qty-text">{{ quantity }}</span>
          <button @click="quantity++">+</button>
        </div>
      </div>

      <!-- 
        1. 使用 computed 计算总价：
        依赖不变时，无论页面其他无关状态怎么变，totalPrice 绝对不会重新计算！ 
      -->
      <div class="result-row">
        <span>【computed 缓存总价】: <strong class="price-text">¥{{ totalPrice }}</strong></span>
      </div>

      <!-- 
        2. 使用普通方法计算总价：
        每次模板重新渲染，calculateTotalMethod() 都会被强行调用一次 
      -->
      <div class="result-row">
        <span>【methods 实时总价】: ¥{{ calculateTotalMethod() }}</span>
        <span class="call-badge">方法被调用次数: {{ methodCallCount }}</span>
      </div>

      <!-- 放置一个与价格、数量无关的计数器，用于检验 methods 的多余重复执行 -->
      <button class="unrelated-btn" @click="unrelatedCounter++">
        触发无关渲染 (计数: {{ unrelatedCounter }})
      </button>
    </div>

    <hr class="divider" />

    <h2>2. watch 与 watchEffect 侦听副作用实战</h2>

    <!-- 搜索输入框：演示 watch 监听输入并发起模拟网络请求 -->
    <div class="search-box">
      <label for="search-input">商品关键词搜索 (watch 监听输入并发起接口请求):</label>
      <input 
        id="search-input"
        v-model="searchKeyword" 
        type="text" 
        placeholder="输入关键词 (如: vue, phone)" 
        class="search-input"
      />
      
      <p class="status-tip">
        网络状态: <span :class="{ 'loading-text': isSearching }">{{ searchStatus }}</span>
      </p>

      <ul v-if="searchResultList.length" class="result-list">
        <li v-for="(item, index) in searchResultList" :key="index">{{ item }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue'

// ===================== 1. computed 相关逻辑 =====================
const price = ref<number>(99)
const quantity = ref<number>(2)
const unrelatedCounter = ref<number>(0)
const methodCallCount = ref<number>(0)

// 基础计算属性：只读
const totalPrice = computed<number>(() => {
  console.log('>>> [computed 触发执行] 重新计算了 totalPrice')
  return price.value * quantity.value
})

// 普通方法计算
function calculateTotalMethod(): number {
  methodCallCount.value++
  console.log('>>> [methods 触发执行] calculateTotalMethod 被调用！')
  return price.value * quantity.value
}

// 可写计算属性（高级用法：通过 get 和 set 实现完整双向计算）
const firstName = ref<string>('张')
const lastName = ref<string>('三')
const fullName = computed<string>({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(newVal: string) {
    const parts = newVal.split(' ')
    firstName.value = parts[0] || ''
    lastName.value = parts[1] || ''
  }
})

// ===================== 2. watch 相关逻辑 =====================
const searchKeyword = ref<string>('')
const searchStatus = ref<string>('空闲中')
const isSearching = ref<boolean>(false)
const searchResultList = ref<string[]>([])

let timer: ReturnType<typeof setTimeout> | null = null

// 使用 watch 监听 searchKeyword 的变化
watch(
  searchKeyword,
  (newVal, oldVal) => {
    console.log(`watch 捕获到变化: "${oldVal}" -> "${newVal}"`)
    
    if (!newVal.trim()) {
      searchResultList.value = []
      searchStatus.value = '空闲中'
      return
    }

    // 防抖处理：清除上一次未完成的定时器
    if (timer) clearTimeout(timer)
    
    searchStatus.value = '正在搜索中...'
    isSearching.value = true

    // 模拟 500ms 后发起异步接口请求
    timer = setTimeout(() => {
      searchResultList.value = [
        `${newVal} - 热门推荐商品 A`,
        `${newVal} - 热卖数码设备 B`,
        `${newVal} - 官方特惠配件 C`
      ]
      searchStatus.value = `搜索完成，找到 3 条结果 (关键词: ${newVal})`
      isSearching.value = false
    }, 500)
  },
  {
    immediate: false, // 是否在组件初次挂载时立即执行一次回调
    deep: false      // 是否深度监听对象内部的嵌套属性
  }
)

// ===================== 3. watchEffect 自动依赖收集演示 =====================
// watchEffect 会立即自动执行一次，并自动追踪其内部访问到的所有响应式变量
watchEffect(() => {
  console.log(`[watchEffect 自动记录日志] 当前购物车结算总金额已变为: ¥${totalPrice.value}`)
})
</script>

<style scoped>
.demo-wrapper {
  max-width: 600px;
  margin: 20px auto;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.cart-box {
  padding: 16px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stepper button {
  width: 28px;
  height: 28px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.qty-text {
  min-width: 24px;
  text-align: center;
  font-weight: bold;
}

.result-row {
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-text {
  color: #ef4444;
  font-size: 16px;
}

.call-badge {
  font-size: 12px;
  color: #f59e0b;
  background: #fef3c7;
  padding: 2px 8px;
  border-radius: 12px;
}

.unrelated-btn {
  margin-top: 8px;
  padding: 8px;
  background-color: #e2e8f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 24px 0;
}

.search-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #3b82f6;
}

.status-tip {
  font-size: 13px;
  color: #4b5563;
  margin: 4px 0;
}

.loading-text {
  color: #3b82f6;
  font-weight: bold;
}

.result-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-list li {
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 13px;
  color: #1e293b;
}
</style>
```

---

## 初学者高频踩坑与排错调试指南

### 踩坑 1：在 `computed` 的 getter 函数里执行异步网络请求或修改外界状态

- **灾难写法**：
  ```typescript
  // ❌ 极其致命的错误写法！
  const userList = computed(async () => {
    const res = await axios.get('/api/users')
    return res.data // 返回的是一个 Promise 挂起对象，模板直接白屏或显示 [object Promise]
  })
  ```
- **物理成因**：
  `computed` 被设计为**纯函数（Pure Function）**：它的唯一职责是同步接收依赖输入，并产出计算结果。如果返回 `async` 函数，计算属性的值将永远是一个未决议的 `Promise` 实例，无法用于正常模板渲染。
- **正解**：任何需要发起网络请求、修改外界变量、调用 `localStorage`、操作真实 DOM 的动作，**必须使用 `watch` 或在组件挂载生命周期中执行**。

---

### 踩坑 2：监听直接读取对象某个属性时语法错误导致无法触发

- **典型现象**：
  有一个响应式对象 `const userInfo = reactive({ age: 20 })`。
  很多初学者直接写：
  ```typescript
  // ❌ 监听失败！控制台抛出警告：A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these.
  watch(userInfo.age, (newVal) => {
    console.log('年龄变了', newVal)
  })
  ```
- **物理成因**：
  `userInfo.age` 表达式求值后直接退化为了一个普通的数字 `20`，数字字面量根本不具备响应式连接。
- **正规工程写法**：
  若要监听响应式对象身上的某一个基本属性，**必须包装为一个 Getter 函数（即写成箭头函数）**：
  ```typescript
  // ✅ 正确写法：使用 getter 函数包装
  watch(
    () => userInfo.age,
    (newVal) => {
      console.log('年龄变了', newVal)
    }
  )
  ```

---

## 初级必考面试题与标准对标回答

### 面试题 1：请详细说明 `computed` 与 `methods` 的核心区别？为什么不能全部用 `methods` 替代？

- **标准应答**：
  1. **缓存机制（核心物理区别）**：`computed` 是**基于响应式依赖进行缓存的**。只要其依赖的响应式变量没有发生改变，多次访问 `computed` 属性会直接纳秒级返回之前的内存缓存值，绝不重复执行函数体。而 `methods` **没有任何缓存机制**，只要页面所在组件发生重新渲染，模板中调用的方法无论入参是否改变，都会被无差别全量执行一遍。
  2. **性能影响与选型**：在涉及大数组遍历、排序、复杂字符串格式化等计算密集型场景下，使用 `computed` 能大幅降低 CPU 算力开销，杜绝不必要的页面卡顿；普通方法 `methods` 则应严格局限在用户交互事件的回调函数中（如点击按钮提交）。

---

### 面试题 2：`watch` 与 `watchEffect` 的区别是什么？各自适用什么场景？

- **标准应答**：
  1. **依赖收集方式不同**：
     - `watch` 需要**显式指定**要监听的目标数据源（如某一个 ref 或 getter 函数）；
     - `watchEffect` **无需手动指定**，它在执行时会自动追踪其回调函数体内部访问到的所有响应式属性作为依赖。
  2. **执行时机不同**：
     - `watch` 默认是惰性的（Lazy），只有当被监听的数据**第一次发生真实变动时**才执行回调（除非显式配置 `{ immediate: true }`）；
     - `watchEffect` 在组件初始化挂载时**必定会自动立即执行一次**，以便收集初始依赖。
  3. **数据感知能力不同**：
     - `watch` 能同时获取到变更前的旧值（`oldVal`）和变更后的新值（`newVal`）；
     - `watchEffect` 只能感知当前最新运行状态，无法直接对比新旧历史值。
