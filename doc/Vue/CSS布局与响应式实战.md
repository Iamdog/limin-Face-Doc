---
title: CSS 布局与响应式实战
description: 从盒模型、Flex、Grid 到移动端适配，建立可维护的 CSS 页面结构。
---

# CSS 布局与响应式实战

CSS 的核心任务是描述元素的尺寸、位置、间距、颜色和响应式变化。页面出现错位时，应先判断属于盒模型、布局上下文、定位还是层叠问题，再修改具体属性。

## 一、盒模型

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

`content-box` 的宽度只包含内容区域，`border-box` 的宽度包含内容、内边距和边框。项目通常统一使用 `border-box`，避免设置 `width: 100%` 后再叠加 `padding` 造成横向溢出。

```css
.card {
  width: 320px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  box-sizing: border-box;
}
```

## 二、Flex：一维布局

Flex 适合处理一行或一列中的对齐和分配：

```css
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

常用属性：

| 属性 | 作用 |
| --- | --- |
| `display: flex` | 创建 Flex 布局上下文 |
| `flex-direction` | 设置主轴方向 |
| `justify-content` | 沿主轴对齐 |
| `align-items` | 沿交叉轴对齐 |
| `gap` | 设置子项间距 |
| `flex: 1` | 允许子项占据剩余空间 |
| `flex-wrap` | 允许子项换行 |

常见问题是子项内容过长导致无法收缩。此时在允许收缩的子项上设置 `min-width: 0`：

```css
.layout__main {
  min-width: 0;
}
```

## 三、Grid：二维布局

Grid 适合后台页面、卡片列表和表单区域：

```css
.dashboard {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100vh;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
```

移动端调整为单列：

```css
@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

`minmax(0, 1fr)` 可以避免长文本把网格列撑出容器。

## 四、页面布局示例

```html
<div class="page">
  <header class="page__header">任务管理</header>
  <main class="page__body">
    <aside class="page__sidebar">菜单</aside>
    <section class="page__content">
      <div class="page__toolbar">筛选和操作按钮</div>
      <div class="task-list">任务列表</div>
    </section>
  </main>
</div>
```

```css
.page {
  min-height: 100vh;
  color: #1f2937;
  background: #f8fafc;
}

.page__header {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.page__body {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: calc(100vh - 56px);
}

.page__sidebar {
  padding: 20px 16px;
  background: #111827;
  color: #ffffff;
}

.page__content {
  min-width: 0;
  padding: 24px;
}

@media (max-width: 768px) {
  .page__body {
    grid-template-columns: 1fr;
  }

  .page__sidebar {
    display: none;
  }

  .page__content {
    padding: 16px;
  }
}
```

## 五、响应式尺寸与间距

优先使用相对单位和 CSS 变量：

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --content-max-width: 1200px;
}

.content {
  width: min(100% - 32px, var(--content-max-width));
  margin-inline: auto;
}

.title {
  font-size: clamp(24px, 4vw, 40px);
  line-height: 1.2;
}
```

`px` 适合边框和精确控件尺寸，`rem` 适合字体和间距，`%`、`fr`、`minmax()` 适合容器分配，`vw` 和 `clamp()` 适合需要随视口变化的尺寸。

## 六、定位与层叠

```css
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 10;
}
```

绝对定位元素应以明确的祖先元素为参照：

```css
.dropdown-wrapper {
  position: relative;
}
```

`z-index` 只在定位元素或 Flex、Grid 子项之间比较有效。`transform`、`filter`、`opacity` 等属性可能创建新的层叠上下文，导致数值更大的 `z-index` 仍然无法覆盖其他元素。

## 七、表单和可访问性

```html
<label class="field">
  <span class="field__label">任务标题</span>
  <input name="title" type="text" aria-describedby="title-error" />
  <span id="title-error" class="field__error" role="alert"></span>
</label>
```

```css
.field__label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

input:focus-visible,
button:focus-visible {
  outline: 3px solid rgb(59 130 246 / 35%);
  outline-offset: 2px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
```

表单控件应具备可见标签、键盘焦点样式、禁用状态和错误提示。不要只使用颜色区分成功与失败。

## 八、CSS 维护规范

- 使用组件或页面范围的命名，避免全局覆盖第三方组件。
- 优先使用类选择器，减少高权重选择器和 `!important`。
- 统一颜色、间距、圆角和阴影变量，避免同一含义出现多个值。
- 组件样式按结构、布局、状态和响应式规则分组。
- 处理长文本、空列表、错误提示和窄屏宽度。
- 在 Chrome DevTools 中检查盒模型、计算样式、Flex/Grid overlay 和层叠上下文。
- 修改布局后至少验证桌面宽度、平板宽度和移动端宽度。

## 九、页面验收清单

- [ ] 页面在 375px、768px、1440px 宽度下没有横向滚动。
- [ ] 长标题、长用户名和空数据状态不会破坏布局。
- [ ] 表单控件具有标签、焦点样式和错误提示。
- [ ] 弹窗、下拉菜单和固定底部按钮的层级正确。
- [ ] 颜色对比度、键盘操作和触摸区域符合使用要求。
- [ ] 页面没有依赖浏览器默认外边距或默认按钮样式。
