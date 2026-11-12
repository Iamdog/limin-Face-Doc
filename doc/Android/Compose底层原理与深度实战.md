---
title: Compose底层原理与深度实战
---

# Compose底层原理与深度实战

## 使用入口：先解决问题，再做验证

解释状态改变后哪些界面重组以及如何控制代价。

**先做基本操作**：先用 remember 和 mutableStateOf 写计数按钮，观察状态变化，再用工具检查重组范围。初次学习可先完成[本模块基础实践](/doc/Android/Android应用基本开发与验证)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

## 🎯 核心技术原理与实战归纳
- **核心设问与思考**：“Compose 的重组（Recomposition）底层是如何判断是否需要重新执行的？什么是**智能跳过（Smart Recomposition）**？”
- **深水区追问**：“为什么明明传入的数据没有变，组件依然发生了频繁重组？**Compose 稳定性系统（Stability）**是如何判定 `@Stable` 与 `@Immutable` 的？`derivedStateOf` 与 `remember` 的性能分水岭在哪里？**Compose 三大执行阶段**中，如何通过 `Modifier.graphicsLayer` 跳过重组阶段实现 120 帧丝滑动画？”

---

## 🏢 真实生产业务场景
- **电商大促 Feed 流与复杂吸顶列表**：列表高速滑动时监听 Offset 避免全屏高频重组掉帧。
- **动态手势与拖拽粒子动画**：在 Draw 阶段直接完成图形位移与透明度变化，绕过布局测量。
- **音视频播放器组件**：与页面生命周期联动，精准在离开页面时停止解码并释放 Surface（`DisposableEffect`）。

---

## 一、 重组底层原理与编译器幕后（Slot Table 与 Composer）

### 1. `@Composable` 注解背后的真相
Compose 并不是纯运行时反射，而是由 **Compose 编译器插件（Kotlin Compiler Plugin）** 在编译阶段对 AST（抽象语法树）进行代码重写：
- 每一个被 `@Composable` 标记的函数，编译后其参数列表末尾都会被隐式注入两个参数：
  - **`$composer: Composer`**：负责调度与记录 UI 树节点。
  - **`$changed: Int`**：一个 32 位的整型位掩码，用于高效记录每个传入参数是否发生了变化。

```kotlin
// 编写的代码：
@Composable
fun UserBadge(name: String, level: Int)

// 编译器转换后的真实 Java 签名：
void UserBadge(String name, int level, Composer $composer, int $changed)
```

---

### 2. 状态存储的核心：Slot Table（插槽表）
Compose 底层使用了一种高效的内存数据结构 —— **Slot Table（插槽表）**。
- 它是一块连续的内存数组，记录了每一个 Composable 函数的执行位置、`remember` 缓存的状态对象、以及依赖的参数值。
- 当执行函数前，编译器通过比较当前传入的值与 Slot Table 中存储的上一轮旧值（位运算 `$changed`）：
  - **若所有参数均未改变，且参数均为“稳定类型（Stable）”**：直接执行**智能跳过（Smart Skip）**，函数体根本不会执行！

---

## 二、 稳定性系统（Stability）与重组大坑（核心深度关键点）

### 1. 为什么你的组件无法触发智能跳过？
Compose 编译器根据参数的类型将其分为：
- **Stable（稳定类型）**：基础类型（`Int`, `String`）、不可变类（所有字段均为 `val` 且字段类型也均为 Stable）。
- **Unstable（不稳定类型）**：包含 `var` 可变字段的类，或者由第三方库提供、Compose 编译器无法保证其内部不可变的类。

#### 生产最隐蔽大坑：`java.util.List`
```kotlin
data class UserListUiState(
    val users: List<User> // 致命陷阱！
)
```
- **原因**：在 Kotlin 中，`List` 虽然是只读接口，但其实际运行时实现往往是 `ArrayList`（可变的）。Compose 编译器为了绝对安全，**默认将所有的标准 `List`、`Set`、`Map` 标记为 Unstable（不稳定的）**！
- **后果**：只要父组件重组，哪怕 `users` 列表内容完全一样，该子组件**也必须强制重新执行重组，智能跳过彻底失效！**

### 2. 解决方案实战
1. **方案 A（官方推荐）**：使用不可变集合库 `kotlinx.collections.immutable.ImmutableList`。
2. **方案 B（类级别强声明）**：使用 `@Immutable` 或 `@Stable` 注解强制向编译器承诺不可变性：
```kotlin
import androidx.compose.runtime.Immutable

@Immutable
data class UserListUiState(
    val users: List<User> // 告诉编译器：该列表在生命周期内绝不会被修改！
)
```

---

## 三、 性能调优：`remember` vs `derivedStateOf` 削峰防掉帧

### 业务场景：监听列表滑动显示“回到顶部”按钮
- `LazyListState.firstVisibleItemIndex` 在用户滑动列表时，每秒钟会高频变化几十甚至上百次。
- **掉帧自杀写法**：
  ```kotlin
  // 随着滑动每像素的改变，showButton 都会被反复求值并触发父组件疯狂重组！
  val showButton = scrollState.firstVisibleItemIndex > 5
  ```
- **生产级优化写法：`derivedStateOf`**：
  ```kotlin
  // 核心：频率削峰！只有当计算结果从 false 变成 true（或相反）的那一瞬间才触发重组！
  val showButton by remember {
      derivedStateOf { scrollState.firstVisibleItemIndex > 5 }
  }
  ```

---

## 四、 Compose 三大阶段与跳过重组绘制动画

### 1. Compose 树运行的三大阶段
```text
  Phase 1: Composition ───> Phase 2: Layout ───> Phase 3: Draw
   (创建/执行可组合函数)     (测量 Measure 与放置 Place)   (Canvas 绘制像素)
```

### 2. 丝滑 120 帧动画法则：能用 Draw 阶段就绝不触发 Composition！
- **低效写法（触发前两阶段，引发全组件重组与重新布局测量）**：
  ```kotlin
  Box(modifier = Modifier.offset(y = offsetY.dp)) // 触发 Composition + Layout + Draw
  ```
- **极致高性能写法（跳过重组和布局阶段，直达 GPU Draw 绘制）**：
  ```kotlin
  Box(
      modifier = Modifier.graphicsLayer {
          // 在 Lambda 闭包中读取状态，跳过 Composition 和 Layout 阶段！
          translationY = offsetY
          alpha = alphaValue
      }
  )
  ```

---

## 五、 副作用 API（Side-Effect APIs）全家桶最小 MVP 实战

```kotlin
@Composable
fun VideoPlayerScreen(
    videoId: String,
    lifecycleOwner: LifecycleOwner = LocalLifecycleOwner.current
) {
    val coroutineScope = rememberCoroutineScope()
    var isPlaying by remember { mutableStateOf(false) }

    // 1. LaunchedEffect：Key 发生变化时自动取消上一次协程并重启（用于网络异步加载）
    LaunchedEffect(videoId) {
        println("[LaunchedEffect] 开始加载视频元数据: $videoId")
        mockLoadVideoApi(videoId)
    }

    // 2. DisposableEffect：包含 onDispose 清理钩子（注册与注销监听器）
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_PAUSE) {
                isPlaying = false // 进入后台自动暂停
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        
        onDispose {
            println("[DisposableEffect] 组件销毁，反注册监听并释放播放器句柄")
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    // 3. rememberCoroutineScope：脱离组合生命周期，在用户点击事件中触发协程
    Button(onClick = {
        coroutineScope.launch {
            postLikeEventToServer(videoId)
        }
    }) {
        Text("点赞")
    }
}
```
