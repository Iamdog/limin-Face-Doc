---
title: v-model 的原理与面试题
---

# v-model 的原理与面试题

## 知识点

- 在组件上，`v-model` 默认展开为：
  - 传入 `:modelValue="xxx"`
  - 监听 `@update:modelValue="val => xxx = val"`
- 支持多个 `v-model`，例如 `v-model:title` 对应 `title` 与 `update:title`。
- 修饰符（如 `.trim`、`.number`）可在输入处理阶段生效。

## 代码示例

```vue
<script setup>
const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])

function onInput(e) {
  emit('update:modelValue', e.target.value)
}
</script>

<template>
  <input :value="props.modelValue" @input="onInput" />
</template>
```

## 高频面试题

### 1. Vue3 的 `v-model` 和 Vue2 有何变化？
答：Vue3 统一为 `modelValue/update:modelValue`，并原生支持多个 `v-model` 绑定。

### 2. 为什么说 `v-model` 不是“双向绑定黑盒”？
答：本质还是单向数据流 + 事件回传，只是语法更简洁。

### 3. 如何自定义 `v-model` 字段名？
答：使用参数形式，如 `v-model:title`，组件端定义 `title` 与 `update:title`。
