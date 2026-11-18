# 智能重组Smart-Recomposition机制稳定性推导与布局绘制

在 Jetpack Compose 中，**智能跳过重组（Smart Recomposition / Skipping）** 是保障复杂列表和深层 UI 树维持 60/120fps 极限帧率的核心性能护城河。然而，很多开发者在实际项目中发现：**明明页面上只有某一个计数器变动，整屏几十个子组件却全被无意义地重新执行了一遍，导致严重卡顿**。本文深入剖析 Compose 编译器对 **类型稳定性（Stability：Stable vs Unstable）的推导机制**、**为什么 `List<T>` 默认被判定为不稳定**，以及**如何通过跳过 Composition 阶段直达 Draw 阶段实现极致性能**。

---

## 核心底层机制与全景架构

### 1. 智能跳过重组的核心判定决策树

当一个 Composable 作用域由于状态变动被系统调度触发时，Compose 编译器会执行如下评估：

```mermaid
flowchart TD
    Trigger[某个 State 发生变动, 触发父作用域刷新] --> CheckParam{检查子 Composable 的所有入参}
    
    CheckParam --> IsStable{所有入参的类型是否全部为 Stable / Immutable?}
    
    IsStable -- 否 (存在任意一个 Unstable 参数!) --> ForceRecompose[规则 A: 判定为不可跳过 (Restartable only)!<br/>即便入参值在业务上完全没变, 也必须强制全量重新执行函数体! 性能损耗!]
    
    IsStable -- 是 (所有入参皆为稳定类型) --> ValueCompare{入参当前值与上一次重组的值是否 equals 相等?}
    ValueCompare -- 相等 (无任何变动) --> SmartSkip[规则 B: 智能跳过 (Smart Skip)!<br/>直接跳过当前函数体, 0 CPU 消耗, 完美复用 SlotTable 结果!]
    ValueCompare -- 不相等 --> DoRecompose[执行重组, 更新局部 UI]
```

---

## 源码级架构物理拆解

### 1. 深入推导：编译器对类型的四大分类

Compose 编译器插件（Compiler Plugin）在编译期间会对代码中涉及的每一个 Class 进行 AST 静态分析，并在元数据中打上稳定性标签：

```mermaid
flowchart LR
    subgraph 稳定类型家族 (可享受智能跳过)
        T1[1. 基本物理类型: Int, Float, Boolean, Long...]
        T2[2. 字符串类型: String]
        T3[3. 函数式引用: () -> Unit (Lambda 闭包)]
        T4[4. 被显式标注 @Immutable 或 @Stable 的类/接口]
    end

    subgraph 不稳定类型家族 (Unstable 导致重组全穿透)
        U1[1. 包含可变属性 var 的普通类]
        U2[2. 标准库集合接口: List, Set, Map 等]
        U3[3. 来自未引入 Compose 编译器插件的三方模块类]
    end
```

#### 为什么标准的 `List<String>` 默认被判定为 `Unstable`？
- **这是许多资深 Android 工程师踩坑最深的隐蔽盲区！**
- 在 Kotlin 中，`val list: List<String>` 表面上看起来是一个“只读集合（Read-only）”，但在 JVM 底层，`List` 只是一个接口；
- 它的运行时物理真实实现完全可能是一个可变的 **`java.util.ArrayList`**！外部代码随时可以在另一个线程中调用 `(list as ArrayList).add("Hack")` 篡改数据；
- **编译器的严谨性**：Compose 编译器无法在编译期 100% 保证一个 `List` 对象的底层数据绝对不可变。**出于保守防御，编译器强制将所有标准 `List`、`Map`、`Set` 一律标记为 `Unstable`**！
- **后果**：如果你的 Composable 接收一个 `items: List<Goods>`，**这个 Composable 永远无法享受智能跳过！父页面一动，它就全量陪跑重组！**

---

### 2. 突破 Unstable 的三大工程化解法

#### 方案 1：引入官方不可变集合库（`kotlinx.collections.immutable`）
```kotlin
// 规范：编译器能够严格推导出其绝对不可变，打上 @Immutable 标记
@Composable
fun GoodsList(items: ImmutableList<Goods>) {
    // 此时 items 满足稳定条件，完美享受智能跳过！
}
```

#### 方案 2：使用 `@Immutable` 或 `@Stable` 强行覆盖编译器判定
```kotlin
// 如果是第三方库的类或无法更改的实体，封装一层并显式背书
@Immutable
data class GoodsUiModel(
    val list: List<Goods> // 开发者向编译器承诺：我保证绝不在外部篡改此 list！
)
```

#### 方案 3：开启 Compose 强跳过模式（Strong Skipping Mode）
在最新版本的 Compose 编译器中，可以在 `build.gradle` 中开启强跳过实验特性：
```groovy
composeCompiler {
    enableStrongSkippingMode = true
}
```
开启后，即使参数是 `Unstable` 类型，Compose 也会在运行时通过 `instance.equals()` 浅比对尝试跳过重组。

---

### 3. Compose 三阶段架构与极致性能绕过法则

Compose 将画面渲染严格划分为三大连续阶段：

```mermaid
flowchart LR
    S1[1. Composition 组合阶段<br/>运行 Composable 函数生成/更新 LayoutNode 树<br/>开销最大 (涉及状态机与 SlotTable)] --> S2[2. Layout 布局阶段<br/>测量与放置子节点 (Measure & Place)]
    S2 --> S3[3. Drawing 绘制阶段<br/>调用 Canvas 指令绘制到屏幕<br/>开销最小]
```

#### 极致 120fps 动画避坑法则：
如果实现一个“随手势滚动的位移动画”，很多人的直觉写法是：
```kotlin
// 错误示范：每一帧都触发昂贵的 Composition 阶段！
val offset by animateIntAsState(targetValue)
Box(modifier = Modifier.offset(x = offset.dp)) // 导致整块代码每一帧都全量重组！
```

#### 高性能绕过写法（直达 Layout / Draw 阶段）：
```kotlin
// 规范：使用 Lambda 版本的 Modifier，彻底跳过 Composition 组合阶段！
val offset by animateIntAsState(targetValue)
Box(modifier = Modifier.offset { IntOffset(x = offset, y = 0) })
```
- **原理解密**：接收 Lambda 的 `Modifier.offset { ... }` 内部将状态读取推迟到了 **Layout 测量布局阶段**！Compose 在执行时**完全跳过了第一阶段的函数体重组（Composition）**，实现了零重组开销的极速动画。

---

## 社招高频硬核连环追问

### Q1: `@Stable` 与 `@Immutable` 注解在编译器推导中有何细微差异？
- **考点**：稳定性契约语义。
- **解析**：
  - **`@Immutable`（强不可变）**：表示该类的所有物理字段在对象构造完成后**永久绝对不会发生任何改变**（如同 `String` 或基础整型）；
  - **`@Stable`（稳定可观测）**：表示该类的属性**虽然可能是可变的（Mutable）**，但**一旦发生改变，必须通过某种通知机制（如触发 Snapshot State 写入通知）告知 Compose 调度器**。它为可变但可观测的模型对象提供了合法跳过重组的通道。

### Q2: 为什么在 `@Composable` 的参数中传递 `() -> Unit`（无状态 Lambda）有时也会导致无法跳过重组？
- **考点**：Lambda 闭包捕获外部作用域对象。
- **解析**：
  - 如果传递的是一个纯静态顶层函数引用，或没有捕获任何外部变量的纯 Lambda，编译器会将其优化为全局单例静态实例，跨重组 `equals` 恒成立；
  - **但如果该 Lambda 内部捕获了当前页面中某个 `Unstable` 不稳定变量**（例如读取了外层某个非稳定对象的数据），编译器每次重组都会为该闭包重新 `new` 一个捕获类实例！
  - 导致子 Composable 比对参数时发现 Lambda 实例地址变了，误以为入参更新，从而破坏了智能跳过；
  - **破局**：将事件派发方法下沉到 ViewModel 中以函数引用形式传递，或使用 `rememberUpdatedState` 锁定闭包。

---

## 生产级避坑指南与排障 SOP

### 1. 利用 Compose 编译器报告（Compiler Metrics）全盘诊断重组漏洞

在大型商业项目中，不能靠肉眼猜哪些组件能跳过。可在 Gradle 中配置编译期指标导出：

```groovy
// app/build.gradle
tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
        freeCompilerArgs += [
            "-P",
            "plugin:androidx.compose.compiler.plugins.kotlin:reportsDestination=" + project.buildDir.absolutePath + "/compose_metrics"
        ]
    }
}
```
编译后查看生成的 `app_release-classes.txt`：
```text
restartable skippable fun GoodsCard(
  stable item: GoodsItem
)
restartable fun BadGoodsCard(  <-- 警报！缺少 skippable 标记！
  unstable item: BadGoodsItem  <-- 罪魁祸首：包含 Unstable 字段！
)
```
精准定位所有无法跳过重组的“性能漏网之鱼”。
