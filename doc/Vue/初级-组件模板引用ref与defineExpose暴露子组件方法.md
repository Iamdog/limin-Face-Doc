# 组件模板引用 ref 与 defineExpose 暴露子组件方法

虽然 Vue 推崇“以数据驱动视图”的声明式理念，但在日常真实业务中，我们依然不可避免地需要**直接触碰底层的真实 DOM 元素**（例如让输入框自动聚焦 `focus()`、测量某个元素的物理高度 `clientHeight`、控制视频标签 `video.play()`），或者**命令式调用子组件的内部方法**（例如直接调用弹窗子组件的 `open()` 方法打开弹窗、调用表单组件的 `validate()` 方法触发校验）。Vue 3 通过 **模板引用（Template Refs）** 与 **`defineExpose` 编译宏** 提供了安全优雅的机制。

---

## 白话原理解释与设计哲学

### 1. 什么是模板引用（Template Ref）？

- 在原生 JavaScript 中，如果要找一个 DOM 元素，通常调用 `document.getElementById('my-input')`。在大型组件化工程中，硬编码 ID 极容易发生全局命名冲突；
- 在 Vue 3 中，只需要在目标 DOM 标签或子组件标签上打一个属性 `ref="myRef"`，然后在 `<script setup>` 中声明一个**同名的响应式变量** `const myRef = ref(null)`，挂载完成后 Vue 会自动将真实 DOM 或组件实例注入到该变量中。

### 2. 为什么 `<script setup>` 必须使用 `defineExpose`？

> **设计哲学生活类比**：
> - **Vue 2 时代（全开放式）**：每个组件就像是**毫无隐私的露天帐篷**。父组件通过 `$refs.child` 可以毫无阻碍地偷看并篡改子组件里的任意一个 `data` 和内部函数。这破坏了组件封装的独立性，代码维护极其脆弱；
> - **Vue 3 `<script setup>` 时代（默认封闭式）**：每个组件升级为了**带有智能门锁的私人保险库**。组件内部声明的变量和函数默认全部被私有化封装，外部父组件即使拿到引用也一无所获；
> - **`defineExpose` 的角色**：就像是**在门上安装了一个服务窗口**。子组件通过 `defineExpose({ open, reset })` 明确宣布：“我自愿把 `open` 和 `reset` 这两个方法借给外界调用，其余所有私有数据一律保密！”

---

## 保姆级核心代码演示

### 1. 通用模态弹窗子组件（`src/components/MyDialog.vue`）

展示 `defineExpose` 的显式暴露机制：

```vue
<template>
  <!-- 当 isVisible 为 true 时渲染模态框遮罩 -->
  <div v-if="isVisible" class="dialog-mask">
    <div class="dialog-box">
      <div class="dialog-header">
        <h4>{{ dialogTitle }}</h4>
        <button class="close-x-btn" @click="close">×</button>
      </div>

      <div class="dialog-content">
        <p>这是一个完全受控的子组件弹窗！</p>
        <!-- 内部原生输入框，演示模板引用自动聚焦 -->
        <input 
          ref="internalInputRef" 
          v-model="feedbackText" 
          type="text" 
          placeholder="弹窗打开时将自动聚焦于此" 
          class="dialog-input"
        />
      </div>

      <div class="dialog-footer">
        <button class="btn btn-cancel" @click="close">取消</button>
        <button class="btn btn-confirm" @click="handleConfirm">确定并提交</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

// 1. 子组件内部私有状态
const isVisible = ref<boolean>(false)
const dialogTitle = ref<string>('默认弹窗标题')
const feedbackText = ref<string>('')

// 2. 获取子组件内部原生 DOM input 的引用
const internalInputRef = ref<HTMLInputElement | null>(null)

// 3. 子组件内部方法：打开弹窗并自动聚焦
function open(customTitle?: string): void {
  if (customTitle) {
    dialogTitle.value = customTitle
  }
  isVisible.value = true
  feedbackText.value = ''

  // 必须等待 DOM 挂载完成后（nextTick），再调用原生 focus()
  nextTick(() => {
    if (internalInputRef.value) {
      internalInputRef.value.focus()
    }
  })
}

// 4. 关闭弹窗方法
function close(): void {
  isVisible.value = false
}

// 5. 确认提交逻辑
function handleConfirm(): void {
  alert(`提交成功，内容为: "${feedbackText.value}"`)
  close()
}

// ===================== 核心要点 =====================
// 使用 defineExpose 将指定的方法和属性暴露给父组件
// 未在此处列出的变量（如 feedbackText），父组件完全无法直接访问！
defineExpose({
  open,
  close
})
</script>

<style scoped>
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog-box {
  width: 360px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  font-family: sans-serif;
}

.dialog-header {
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h4 { margin: 0; font-size: 15px; color: #1f2937; }
.close-x-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #9ca3af; }

.dialog-content { padding: 18px; font-size: 13px; color: #4b5563; }
.dialog-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  margin-top: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
}
.dialog-input:focus { border-color: #3b82f6; }

.dialog-footer {
  padding: 12px 18px;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn { padding: 7px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; font-weight: 500; }
.btn-cancel { background: #e5e7eb; color: #374151; }
.btn-confirm { background: #3b82f6; color: white; }
</style>
```

---

### 2. 父组件调用实战（`src/components/ParentController.vue`）

```vue
<template>
  <div class="parent-panel">
    <h2>父组件命令式控制子组件弹窗</h2>
    <p class="desc">点击下方按钮，父组件将直接通过 Ref 调用子组件内部暴露的 open() 方法：</p>

    <div class="actions">
      <button class="trigger-btn" @click="handleOpenCustomModal">
        打开弹窗：用户信息登记
      </button>

      <button class="trigger-btn warning-btn" @click="handleOpenFeedbackModal">
        打开弹窗：提交故障反馈
      </button>
    </div>

    <!-- 
      1. 在子组件标签上声明 ref="dialogRef"
      2. 变量名 dialogRef 必须与 script 中的 const dialogRef 完全一致！
    -->
    <MyDialog ref="dialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MyDialog from './MyDialog.vue'

// 1. 获取子组件类型定义（使用 InstanceType 获取 MyDialog 组件的导出类型）
type MyDialogInstance = InstanceType<typeof MyDialog>

// 2. 声明同名 ref，初始值必须设为 null
const dialogRef = ref<MyDialogInstance | null>(null)

// 3. 父组件调用子组件暴露的方法
function handleOpenCustomModal(): void {
  // 安全链式调用：确保在 mounted 后存在实例才调用
  dialogRef.value?.open('登记新员工档案')
}

function handleOpenFeedbackModal(): void {
  dialogRef.value?.open('系统严重故障反馈')
}
</script>

<style scoped>
.parent-panel {
  max-width: 500px;
  margin: 30px auto;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  font-family: sans-serif;
}

.desc { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
.actions { display: flex; gap: 12px; }

.trigger-btn {
  padding: 10px 16px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.warning-btn {
  background-color: #f59e0b;
}
</style>
```

---

## 初学者高频踩坑与排错调试指南

### 踩坑 1：子组件漏写 `defineExpose`，父组件调用报错 `is not a function`

- **典型现象**：
  父组件写了 `dialogRef.value.open()`，结果控制台直接崩出致命红字：
  `Uncaught TypeError: dialogRef.value.open is not a function`。
- **物理成因**：
  在 `<script setup>` 语法下，组件实例是默认**封闭（Closed）**的。如果没有在子组件内显式调用 `defineExpose({ open })`，父组件拿到的实例对象仅仅是一个空对象 `{}`，自然找不到任何方法。
- **排错 SOP**：
  检查子组件代码，确保已经将需要暴露给父组件的方法写入 `defineExpose({ ... })`。

---

### 踩坑 2：在 `setup` 顶层直接访问 `dialogRef.value` 报 `null`

- **物理成因**：
  模板引用的赋值是在 **DOM 挂载完成后（Mounting）** 才由 Vue 运行时自动填写的。在 `<script setup>` 刚开始执行时，组件尚未渲染，此时 `dialogRef.value` 必定为 `null`！
- **铁律**：
  如果需要在页面一进入时就调用子组件方法，**必须将其包裹在 `onMounted(() => { dialogRef.value?.open() })` 钩子中执行！**

---

## 初级必考面试题与标准对标回答

### 面试题 1：Vue 3 中如何通过 Ref 获取 DOM 元素或子组件实例？

- **标准应答**：
  1. 在 `<template>` 中的目标标签上声明属性 `ref="xxx"`；
  2. 在 `<script setup>` 中声明一个**同名**的响应式变量：`const xxx = ref(null)`；
  3. 当组件完成挂载（`onMounted`）后，Vue 运行时会自动将真实的 DOM 节点（或组件实例）赋值给 `xxx.value`；
  4. 如果是 TypeScript 项目，可以通过泛型约束其类型，如 `const inputRef = ref<HTMLInputElement | null>(null)` 或 `const childRef = ref<InstanceType<typeof ChildComponent> | null>(null)`。

---

### 面试题 2：为什么 Vue 3 的 `<script setup>` 需要引入 `defineExpose`？它与 Vue 2 的 `$refs` 有何区别？

- **标准应答**：
  1. **封装性与安全性**：Vue 2 中的 `$refs` 能够直接无限制访问子组件的所有私有 `data` 和任意内部方法，破坏了面向对象的“封装原则”，导致父子组件产生隐式紧密耦合，组件重构时极易引发连带破坏。
  2. **显式契约设计**：Vue 3 的 `<script setup>` 默认对外部完全封闭。如果需要对外暴露能力，必须通过 `defineExpose` 进行**显式暴露（Explicit Opt-in）**。只有被暴露的方法和属性才作为公开 API 被外部父组件访问，未暴露的内容保持安全私有，代码维护性与工程健壮性显著提高。
