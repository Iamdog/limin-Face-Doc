---
title: Kotlin 语言基础与日常开发
description: 先用 Kotlin 处理输入、空值、业务分支与资源，再理解类型、相等和表达式的边界。
---

# Kotlin 语言基础与日常开发

## 一、解决什么问题，怎样开始

先写“输入解析 → 业务分支 → 返回结果”，掌握日常语法。Kotlin 可以做 JVM 后端、Android、脚本与跨平台开发；本文示例先使用 JVM 标准库，不依赖 Android。

在 [Kotlin Playground](https://play.kotlinlang.org/) 中放入完整示例即可运行。本地已安装 Kotlin 编译器和 JDK 时，将代码存为 `Main.kt`：

```bash
kotlinc Main.kt -include-runtime -d main.jar
java -jar main.jar
```

`-include-runtime` 包含 Kotlin 标准库，不包含协程或其他第三方库。项目中的编译器、JVM target 和 JDK 要与构建工具配置一致；不要把本地能编译当作 Android 版本兼容证明。

## 二、变量和类型：先分清绑定与对象变化

| 写法 | 基本用途 | 边界 |
|---|---|---|
| `val count = 1` | 只赋值一次的局部绑定 | 不代表指向的对象不能修改 |
| `var count = 1` | 后续需要重新赋值 | 不能随意改成其他静态类型 |
| `val ids: List<Long>` | 明确公开 API 的类型 | List 是只读接口，不保证底层不可变 |
| `String?` | 明确表达可缺失 | 调用成员前需处理 null |
| `const val` | 顶层/object/companion 中的编译期常量 | 类型和值受限制，不能用于任意对象或运行时结果 |

```kotlin
// 完整示例 sample: bindings
fun main() {
    val items = mutableListOf("A")
    items.add("B")              // val 绑定不变，对象变了
    val view: List<String> = items
    items.add("C")
    check(view.size == 3)        // 只读视图仍观察到底层变化
    val snapshot = items.toList()
    items.clear()
    check(snapshot == listOf("A", "B", "C"))
    println(snapshot)
}
```

`toList()` 在此处隔离了后续容器增删；元素若是可变对象仍会共享。另一个别名或 Java 代码也可能修改对象，不能把 val/List 当作线程安全机制。

数字不做 Java 那样的普遍隐式扩宽：`val n: Long = intValue.toLong()`。`Int` 有溢出边界；金额采用明确的最小货币单位和溢出检查，或按业务使用 BigDecimal。`1 / 2` 是整数除法。

## 三、空安全：处理缺失，不掩盖非法值

| API | 解决的问题 | 使用边界 |
|---|---|---|
| `?.` | 有值才访问 | 结果可能仍为 null |
| `?:` | 缺失时默认、返回或抛异常 | “缺失”和“非法”应分别处理 |
| `?.let { ... }` | 有值时执行一段逻辑 | 不要为每一层都套 let |
| `requireNotNull` | 校验调用参数 | 失败抛 IllegalArgumentException |
| `checkNotNull` | 验证内部状态 | 失败抛 IllegalStateException |
| `!!` | 强制非空断言 | null 时 NPE；先找可靠不变量再使用 |
| `as?` | 类型不匹配时得到 null | 与直接 `as` 的抛错行为不同 |

```kotlin
// 完整示例 sample: input
fun pageSize(raw: String?): Int {
    if (raw == null) return 20
    val value = raw.trim().toIntOrNull()
        ?: throw IllegalArgumentException("页大小必须是整数")
    require(value in 1..100) { "页大小必须在 1 到 100 之间" }
    return value
}

fun displayName(raw: String?): String =
    raw?.trim()?.takeIf { it.isNotEmpty() } ?: "未命名"

fun main() {
    check(pageSize(null) == 20)
    check(pageSize(" 10 ") == 10)
    check(runCatching { pageSize("abc") }.exceptionOrNull() is IllegalArgumentException)
    check(runCatching { pageSize("0") }.isFailure)
    check(displayName(" ") == "未命名")
    println("输入边界验证通过")
}
```

这里 `runCatching` 只用于同步示例断言。协程中它会捕获 CancellationException，后续要明确重新抛出，见 [协程专题](/doc/Android/协程与Flow实战)。

### 智能转换什么时候有效

`if (value is String) value.length` 可在编译器证明类型稳定的分支中直接使用。可变成员、开放属性、自定义 getter 或被可变闭包捕获的变量未必能智能转换。对不稳定属性先取局部快照 `val current = holder.value`，再检查 current；这只固定一次读取，不解决共享数据的并发一致性。

Kotlin 仍可能出现 NPE：`!!`、Java 平台类型、初始化期间泄漏 this、构造/父类初始化调用尚未初始化的开放成员。`lateinit` 未初始化访问则通常是 UninitializedPropertyAccessException。

## 四、if、when、循环都是日常业务工具

```kotlin
// 完整示例 sample: branches
fun describe(value: Any?): String = when (value) {
    null -> "缺失"
    is String -> if (value.isBlank()) "空字符串" else "文本:${value.length}"
    in 1..3 -> "小整数"
    else -> "其他"
}

fun main() {
    check(describe(null) == "缺失")
    check(describe("ok") == "文本:2")
    check(describe(2) == "小整数")
    val ids = (0 until 3).toList() // 0、1、2，不包含 3
    check(ids == listOf(0, 1, 2))
    for ((index, id) in ids.withIndex()) println("$index:$id")
}
```

if/when 可以返回值；作为表达式时需要覆盖所有分支。enum/sealed 的穷尽分支有利于新增状态时发现遗漏。`1..3` 含两端，`0 until size` 或 `0..<size` 不含右端；Kotlin 1.9+ 可用 `..<`。降序使用 `downTo`，间隔使用 `step`，不要手写容易越界的索引循环。

`return`、`throw`、`break`、`continue` 是不同控制流。Lambda 内返回要区分 `return@forEach` 与非局部 return；普通 for 的 break 往往更清晰，详见 [函数式专题](/doc/Android/Kotlin集合函数式与DSL实战)。

## 五、函数：默认参数、命名参数与 vararg

```kotlin
// 完整示例 sample: functions
fun greet(name: String, prefix: String = "你好"): String = "$prefix，$name"
fun sum(vararg numbers: Int): Int = numbers.sum()

fun main() {
    check(greet(name = "Alice") == "你好，Alice")
    check(greet(prefix = "欢迎", name = "Bob") == "欢迎，Bob")
    val numbers = intArrayOf(1, 2, 3)
    check(sum(*numbers) == 6)
    val length: (String) -> Int = { it.length }
    check(length("abc") == 3)
}
```

命名参数适合多个同类型参数，默认参数降低重载数量；Java 调用有单独规则。`*array` 是展开数组，不是可变参数本身；可能涉及复制，不应在热点盲目使用。

`Unit` 表示正常完成但无有用返回值；`Nothing` 表示正常路径永不返回，如 `fun fail(message: String): Nothing = throw ...`；`Any` 非空，`Any?` 可空。`typealias` 只是已有类型别名，不提供新类型隔离；需要防混传可考虑 value class。

字符串模板 `${expression}` 用于展示，SQL 必须仍用绑定参数。原始三引号字符串能保留换行，`trimIndent()` 清理公共缩进；`"text".toByteArray()`、字符长度与 Unicode 用户可见字符数也不是同一概念。

## 六、相等、数组与解构

| 操作 | 语义 | 示例边界 |
|---|---|---|
| `a == b` | 对普通对象使用可空安全的 equals 语义 | data class 按参与生成的属性比较 |
| `a === b` | 引用是否相同 | 不拿装箱数字/字符串驻留当稳定业务保证 |
| `array.contentEquals(other)` | 数组逐元素比较 | 嵌套数组用 contentDeepEquals |
| `val (a, b) = value` | 调用 component1/component2 | 普通类须提供相应 operator 方法 |

```kotlin
// 完整示例 sample: equality
data class User(val id: Long, val name: String)

fun main() {
    val a = User(1, "A")
    val b = User(1, "A")
    check(a == b && a !== b)
    val first = intArrayOf(1, 2)
    val second = intArrayOf(1, 2)
    check(first != second && first.contentEquals(second))
    val (id, name) = a
    check(id == 1L && name == "A")
    check(1 / 2 == 0)
}
```

浮点相等还受静态类型影响：作为 Float/Double 比较按浮点规则，作为 Any? 使用对象相等语义时 NaN/正负零可能表现不同。业务中的误差与容差判断应有专门规则。

## 七、异常和资源：先写清失败路径

Kotlin 不强制声明/捕获受检异常；异常仍然会在运行时发生。try 可以返回值；不要捕获 Throwable 后全部当成功，也不要用异常作为正常集合查找流程。

```kotlin
// 完整示例 sample: resources
import java.io.StringReader

fun main() {
    val text = StringReader("hello").use { it.readText() }
    check(text == "hello")
    val result = try {
        "abc".toInt()
    } catch (_: NumberFormatException) {
        -1
    }
    check(result == -1)
    println(text)
}
```

`use` 在正常/异常路径关闭资源；不要在 finally 中 return 来覆盖原返回值或异常。文件、网络、数据库调用即使写在 suspend 函数中也可能阻塞线程。

## 八、面试先从行为回答

1. **val 为什么还能修改列表？** 先演示 add；val 限制重新绑定，List 限制当前接口可调用的操作，两者都不是深不可变。
2. **空安全是不是消除了 NPE？** 先给出 Java 返回 null 或 `!!` 的失败，再解释静态类型边界。
3. **when 比 if 好在哪里？** 用状态穷尽分支举例，说明对值、类型和范围的匹配；不是所有条件都要改成 when。
4. **== 和 === 怎么选？** 业务值比较通常用 ==，对象身份判断才用 ===；数组内容需要专用 API。
5. **默认参数代替所有重载吗？** Kotlin 调用方便，Java API 暴露仍要设计和验证。

下一步：[面向对象、泛型与委托](/doc/Android/Kotlin面向对象泛型与委托详解)。官方参考：[基本语法](https://kotlinlang.org/docs/basic-syntax.html)、[空安全](https://kotlinlang.org/docs/null-safety.html)、[相等](https://kotlinlang.org/docs/equality.html)。
