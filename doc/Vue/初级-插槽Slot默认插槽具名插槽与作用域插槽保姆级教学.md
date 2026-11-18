# 插槽 Slot 默认插槽具名插槽与作用域插槽保姆级教学

在开发通用的 UI 组件（如弹窗对话框 Dialog、折叠面板 Collapse、通用卡片 Card、数据表格 Table）时，组件的“外壳骨架”（如边框、阴影、头部关闭按钮、加载中遮罩）通常是完全固定通用的，但组件“内部包含的具体内容”（如一段文字、一张图片、一个复杂表单或者一组按钮）却千变万化。如果把所有内容都通过 Props 传字符串，组件的可拓展性将极其恶劣。Vue 提供的 **插槽（Slot）机制**，就是专门为了解决 **“组件内容分发与自定义占位”** 而生的核心武器。

---

## 白话原理解释与生活类比

### 1. 什么是插槽（Slot）？

> **生活类比**：
> - **子组件** 就像是一个已经装修好、带有三间空门面的**标准商场商铺**；
> - 子组件在自己身上挖了几个“预留空间”（`<slot>` 占位标签）；
> - **父组件** 是租户，可以决定在这个预留空间里放什么东西：如果想开咖啡店，就往插槽里塞咖啡机；如果想开书店，就往插槽里塞书架。子组件只负责提供商铺框架，不干涉租户具体的摆设。

### 2. 三大插槽类型与演进

| 插槽类型 | 语法特征 | 解决什么问题 | 典型业务场景 |
| :--- | :--- | :--- | :--- |
| **默认插槽 (Default Slot)** | 子组件只有单个 `<slot></slot>`，父组件标签内的内容自动填充进去 | 单个通用内容区域分发 | 按钮组件中间的文字/图标，基础卡片的主体内容 |
| **具名插槽 (Named Slot)** | 子组件声明 `<slot name="header">`，父组件使用 `<template #header>` 精准投递 | 多个固定区域分别定制 | 模态弹窗（标题区 header、内容区 default、底部操作区 footer） |
| **作用域插槽 (Scoped Slot)** | 子组件在 `<slot :item="data">` 上绑定自身数据，父组件在 `<template #default="{ item }">` 中接收并渲染 | **数据在子组件，但渲染排版权力归父组件** | 通用表格（数据在 Table 内部，父组件决定每列是渲染为文字还是操作按钮） |

---

## 保姆级核心代码演示

### 1. 通用高级卡片子组件（`src/components/CustomCard.vue`）

展示默认插槽、具名插槽、作用域插槽的协同工作：

```vue
<template>
  <div class="custom-card">
    <!-- 1. 具名插槽: header (带备用默认内容) -->
    <header class="card-header">
      <slot name="header">
        <!-- 备用内容（Fallback Content）：如果父组件没传 header，就默认展示这段文字 -->
        <span class="default-title">默认卡片标题</span>
      </slot>
    </header>

    <!-- 2. 默认插槽: default (卡片主体内容) -->
    <main class="card-body">
      <slot>
        <p class="empty-tip">暂无主体内容</p>
      </slot>
    </main>

    <!-- 3. 作用域插槽: footer (将子组件内部的当前时间状态暴露给父组件使用) -->
    <footer class="card-footer">
      <!-- 在 slot 标签上通过属性绑定，将子组件内部数据传回给父组件 -->
      <slot 
        name="footer" 
        :system-time="currentTimestamp" 
        :author="'前端架构组'"
      >
        <!-- 备用默认底部 -->
        <span class="footer-default">默认底部信息 - {{ currentTimestamp }}</span>
      </slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 子组件内部自己持有的状态
const currentTimestamp = ref<string>(new Date().toLocaleTimeString())

// 模拟时间每秒更新
setInterval(() => {
  currentTimestamp.value = new Date().toLocaleTimeString()
}, 1000)
</script>

<style scoped>
.custom-card {
  width: 320px;
  border-radius: 10px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  font-family: sans-serif;
}

.card-header {
  padding: 12px 16px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.default-title { color: #64748b; font-weight: 500; }

.card-body {
  padding: 16px;
  font-size: 13px;
  color: #334155;
  min-height: 60px;
}

.empty-tip { color: #94a3b8; font-style: italic; margin: 0; }

.card-footer {
  padding: 10px 16px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
}
</style>
```

---

### 2. 父组件使用插槽全景（`src/components/ParentSlotDemo.vue`）

```vue
<template>
  <div class="parent-wrapper">
    <h2>插槽（Slot）全类型实战演示</h2>

    <div class="cards-grid">
      <!-- 场景 A：完全不传任何插槽，观察子组件的“备用默认内容”生效 -->
      <CustomCard />

      <!-- 场景 B：使用默认插槽 + 具名插槽 -->
      <CustomCard>
        <!-- 
          使用 v-slot:header 简写为 #header 
          投递到子组件的 name="header" 插槽中 
        -->
        <template #header>
          <div class="custom-header">
            <span class="icon">🔥</span>
            <strong class="title">热门资讯快报</strong>
          </div>
        </template>

        <!-- 默认插槽直接写在组件体内，或包裹在 <template #default> 中 -->
        <p>Vue 3.5 带来更多性能优化，响应式内存占用进一步削减，开发体验全面升级！</p>
      </CustomCard>

      <!-- 场景 C：深度实战作用域插槽 (Scoped Slot) -->
      <CustomCard>
        <template #header>
          <strong>作用域插槽演示</strong>
        </template>

        <p>注意看底部的动态时间和作者信息，这是子组件内部的数据，被暴露到了父组件模板中！</p>

        <!-- 
          作用域插槽核心语法: #footer="slotProps"
          slotProps 是一个包含子组件所有传递属性的对象，直接使用解构语法 { systemTime, author }
        -->
        <template #footer="{ systemTime, author }">
          <div class="scoped-footer">
            <span class="tag">发布者: {{ author }}</span>
            <span class="time-tag">更新于: {{ systemTime }}</span>
          </div>
        </template>
      </CustomCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import CustomCard from './CustomCard.vue'
</script>

<style scoped>
.parent-wrapper {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
}

.cards-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.custom-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.title { color: #dc2626; }

.scoped-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag {
  background-color: #dbeafe;
  color: #1e40af;
  padding: 2px 6px;
  border-radius: 4px;
}

.time-tag {
  color: #059669;
  font-weight: bold;
}
</style>
```

---

## 初学者高频踩坑与排错调试指南

### 踩坑 1：未搞清楚插槽内容的“编译作用域”

- **典型疑问**：
  父组件写了：
  ```vue
  <MyChild>
    <p>{{ userAge }}</p>
  </MyChild>
  ```
  初学者困惑：这里的 `userAge` 是读父组件的，还是读子组件 `MyChild` 的？
- **物理铁律（官方核心法则）**：
  > **父级模板里的所有内容都是在父级作用域中编译的；子级模板里的所有内容都是在子级作用域中编译的。**
- **结论**：
  在父组件模板里写的任何变量（包括普通插槽内容），**默认只能访问父组件自己的 `data` / `ref`**！子组件内部的私有数据，父组件根本看不见。如果父组件非要读取子组件内部的数据来渲染插槽，**唯一的合法途径就是使用“作用域插槽（Scoped Slot）”**！

---

### 踩坑 2：具名插槽未使用 `<template>` 标签包裹直接报错

- **错误写法**：
  ```vue
  <!-- ❌ 错误写法：v-slot 只能直接添加到 <template> 标签或独占默认插槽的组件标签上 -->
  <MyChild>
    <div #header>错误尝试</div>
  </MyChild>
  ```
- **正解**：
  使用简写 `#header` 时，必须写在 `<template>` 容器上：
  ```vue
  <!-- ✅ 正确规范写法 -->
  <MyChild>
    <template #header>
      <div>正确书写</div>
    </template>
  </MyChild>
  ```

---

## 初级必考面试题与标准对标回答

### 面试题 1：请详细说明默认插槽、具名插槽与作用域插槽的区别是什么？

- **标准应答**：
  1. **默认插槽（Default Slot）**：没有名字的通用插槽，子组件中通过单个 `<slot></slot>` 声明，父组件放入组件标签内的任意未打标内容都会自动投递到此插槽中；
  2. **具名插槽（Named Slot）**：拥有特定名称的插槽，子组件通过 `<slot name="xxx">` 声明多个占位区，父组件通过 `<template #xxx>` 精准投递到指定位置，解决组件多个固定区域的定制问题；
  3. **作用域插槽（Scoped Slot）**：**实现了“数据在子组件，结构渲染在父组件”的反向通信能力**。子组件可以在 `<slot>` 标签上像传 Prop 一样将内部数据绑定暴露出来，父组件在 `<template #xxx="slotProps">` 接收这些数据并决定如何渲染展示。

---

### 面试题 2：作用域插槽在底层编译后的物理本质是什么？

- **标准应答**：
  作用域插槽在底层的物理本质是一个 **返回虚拟 DOM（VNode）的 JavaScript 函数**：
  - 在子组件内部编译时，`<slot name="header" :user="user" />` 被编译为对一个函数的调用：`slots.header({ user })`；
  - 在父组件内部编译时，<code>&lt;template #header="{ user }"&gt;&lt;span&gt;&#123;&#123; user.name &#125;&#125;&lt;/span&gt;&lt;/template&gt;</code> 被编译为了该函数具体的实现体：`(props) => h('span', props.user.name)`；
  - 这种函数式设计保证了：子组件在真正执行渲染时，把内部数据作为实参传给该函数，动态产出虚拟 DOM 节点，完全契合闭包与纯函数的物理特性。
