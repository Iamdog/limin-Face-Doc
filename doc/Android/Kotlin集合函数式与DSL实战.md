---
title: Kotlin 集合、函数式与 DSL 实战
description: 从列表清洗、重复键和配置构建开始，掌握集合操作、Sequence、Lambda、作用域函数和 DSL。
---

# Kotlin 集合、函数式与 DSL 实战

## 一、解决什么问题

接口数据要过滤、转换、去重、排序、分组；回调要传递和保存；配置代码要读得清楚。先保证输出和副作用正确，再决定是否用 Sequence、inline 或 DSL。

## 二、选容器和操作符，先确定业务规则

| 需求 | 常用 API | 需要提前决定 |
|---|---|---|
| 保留顺序和重复项 | List | 是否需要可变容器、是否共享引用 |
| 去重 | Set / distinct / distinctBy | 按整个对象还是指定业务键比较 |
| 键值查找 | Map / associateBy | 重复键取前条、后条、报错还是合并 |
| 转换 | map / mapNotNull | null 是过滤掉还是应该报错 |
| 筛选/查找 | filter / firstOrNull / singleOrNull | 允许零条/多条还是必须恰好一条 |
| 分组 | groupBy / groupingBy | 需要每组完整列表还是只需聚合值 |
| 展开 | flatMap | 每项零到多结果，注意数据膨胀 |
| 汇总 | fold / sumOf | 空集、类型和溢出；reduce 不适用于空集 |
| 排序 | sortedBy / sortedWith | 是否需要稳定的第二排序键 |

```kotlin
// 完整示例 sample: collections
data class Row(val id: Long, val group: String, val score: Int)

fun main() {
    val rows = listOf(Row(1, "A", 10), Row(1, "B", 20), Row(2, "A", 30))
    val firstById = rows.distinctBy { it.id }
    val lastById = rows.associateBy { it.id }
    check(firstById.first().score == 10)
    check(lastById.getValue(1).score == 20)
    val groups = rows.groupBy { it.group }
    check(groups.getValue("A").size == 2)
    val counts = rows.groupingBy { it.group }.eachCount()
    check(counts == mapOf("A" to 2, "B" to 1))
    check(rows.filter { it.score >= 20 }.map { it.id } == listOf(1L, 2L))
    check(emptyList<Int>().fold(0) { acc, n -> acc + n } == 0)
    check(listOf(1, 2).singleOrNull() == null)
    val sorted = rows.sortedWith(compareBy<Row> { it.group }.thenByDescending { it.score })
    check(sorted.first().score == 30)
    println(counts)
}
```

`distinctBy` 保留首次出现的项，`associateBy` 的重复键由后项覆盖。`singleOrNull` 对零条和多条都返回 null，不能据此区分“不存在”和“数据重复”。要验证唯一约束时使用明确检查/数据库约束。`first()`、`getValue()`、索引访问在不存在时会抛错，默认值须按业务决定。

List/Set/Map 是只读接口，不自动不可变，也不自动线程安全。扩展 `+` 通常产生新容器，`MutableList.add` 修改原容器；var 的 `+=` 在不同接收类型上可能走 plus 或 plusAssign，热点与状态更新代码应把语义写明确。

## 三、Sequence：惰性处理，不是一定更快

```kotlin
// 完整示例 sample: sequences
fun main() {
    val values = listOf(1, 2, 3, 4)
    var eagerCalls = 0
    val eager = values.map { eagerCalls++; it * 2 }.first { it > 4 }
    var lazyCalls = 0
    val source = values.asSequence().map { lazyCalls++; it * 2 }
    check(lazyCalls == 0)
    val lazy = source.first { it > 4 }
    check(eager == 6 && lazy == 6)
    check(eagerCalls == 4 && lazyCalls == 3)
    source.first { it > 4 }
    check(lazyCalls == 6)
    println("List=$eagerCalls, Sequence=$lazyCalls")
}
```

Sequence 中间操作延后到终端消费，可能减少中间列表并提前停止；迭代器、函数调用、装箱也有成本，小数据可能更慢。sorted 等操作仍可能收集全部数据，不能把所有链条说成常量内存。

Sequence 通常不缓存结果；来源可能只能消费一次，`constrainOnce()` 可明确单次约束。包含副作用或依赖可变外部数据时，重复遍历的结果可能变化。上述来源可重复遍历，所以执行计数会累加。

**再深入**：List 操作一般按阶段处理，Sequence 多按元素穿过链条；Flow 额外支持挂起与异步上下文。Sequence 不会自动多线程，Flow 也不天然并行。

## 四、Lambda、高阶函数与函数引用

```kotlin
// 完整示例 sample: lambdas
fun transform(values: List<Int>, operation: (Int) -> Int): List<Int> = values.map(operation)
fun String.withPrefix(prefix: String): String = "$prefix$this"

fun main() {
    val square: (Int) -> Int = { value -> value * value }
    check(transform(listOf(2, 3), square) == listOf(4, 9))
    check(listOf("a", "bb").map(String::length) == listOf(1, 2))
    val format: String.(String) -> String = String::withPrefix
    check("Alice".format("hello ") == "hello Alice")
    var total = 0
    listOf(1, 2).forEach { total += it }
    check(total == 3)
}
```

`(Input) -> Output` 是函数类型；最后一个函数参数可放括号外，单个参数常用 it；复杂逻辑应显式命名。接收者函数 `Receiver.() -> Result` 让块中可以使用 this，是 DSL 的基础。

闭包可捕获外部变量，但并发修改仍有竞态。函数引用不保证比 Lambda 更快或完全不分配，先选择可读表达。

### return 的三种情况

```kotlin
// 完整示例 sample: returns
fun firstPositive(values: List<Int>): Int? {
    values.forEach { if (it > 0) return it }
    return null
}

fun main() {
    check(firstPositive(listOf(-1, 0, 2)) == 2)
    val visited = mutableListOf<Int>()
    listOf(-1, 1, 2).forEach visit@ { value ->
        if (value < 0) return@visit
        visited.add(value)
    }
    check(visited == listOf(1, 2))
    val positive: (Int) -> Boolean = fun(value: Int): Boolean { return value > 0 }
    check(positive(1))
}
```

第一个 return 从内联 forEach 返回外层函数；标签返回仅结束本次 Lambda；匿名函数的 return 退出匿名函数。普通 Lambda 不能任意 return 外层函数，在满足内联条件的调用处才允许非局部返回。`crossinline` 禁止这种返回，`noinline` 将参数按普通函数值处理，详见 [机制专题](/doc/Android/Kotlin核心机制与高频实战解析)。

## 五、作用域函数：按返回值和接收者选择

| 函数 | 块内对象 | 返回值 | 常用场景 |
|---|---|---|---|
| let | it | 块结果 | 可空值转换、局部命名 |
| run（接收者形式） | this | 块结果 | 基于对象计算结果 |
| with(obj) | this | 块结果 | 已有非空对象的一组操作 |
| apply | this | 原对象 | 初始化/配置 |
| also | it | 原对象 | 日志、校验等旁路副作用 |

`run { ... }` 还有无接收者形式，适合局部计算。作用域函数不自动检测 null：只有 `nullable?.let` 的安全调用跳过 null；直接 `nullable.let` 中的 it 仍可空。

```kotlin
// 完整示例 sample: scopes
data class Request(var path: String = "", var timeoutMs: Long = 1000)

fun main() {
    val request = Request().apply {
        path = "/tasks"
        timeoutMs = 2000
    }.also { check(it.path.startsWith("/")) }
    val description = request.run { "$path:$timeoutMs" }
    val name: String? = null
    check(name?.let { it.length } == null)
    check(name.let { it == null })
    check(description == "/tasks:2000")
}
```

嵌套 this/it 容易访问错接收者，优先提取命名变量或函数。不要用 apply 返回原对象却误以为返回了最后一行的计算结果。

## 六、扩展函数：改善调用形式，保留分派边界

```kotlin
// 完整示例 sample: extensions
open class Animal
class Cat : Animal()
fun Animal.label(): String = "Animal extension"
fun Cat.label(): String = "Cat extension"
class Member { fun label(): String = "member" }
@Suppress("EXTENSION_SHADOWED_BY_MEMBER")
fun Member.label(): String = "extension"
fun String?.orDisplayName(): String = this?.takeIf { it.isNotBlank() } ?: "未命名"

fun main() {
    val animal: Animal = Cat()
    check(animal.label() == "Animal extension")
    check(Cat().label() == "Cat extension")
    check(Member().label() == "member")
    check(null.orDisplayName() == "未命名")
}
```

顶层扩展按编译期接收者类型解析；可用成员优先。扩展不能访问原类 private 成员，也不能给原类增加真实 backing field。声明在类中的成员扩展还有分派接收者：该接收者可以动态分派，扩展接收者仍按静态类型选，不能把两者混为一谈。

## 七、DSL：先把配置对象构建正确

```kotlin
// 完整示例 sample: dsl
@DslMarker
annotation class RequestDsl

data class Options(val path: String, val headers: Map<String, String>)

@RequestDsl
class HeaderBuilder {
    private val values = mutableMapOf<String, String>()
    fun header(name: String, value: String) { values[name] = value }
    fun build(): Map<String, String> = values.toMap()
}

@RequestDsl
class RequestBuilder {
    var path = ""
    private var headers: Map<String, String> = emptyMap()
    fun headers(block: HeaderBuilder.() -> Unit) {
        headers = HeaderBuilder().apply(block).build()
    }
    fun build(): Options {
        require(path.startsWith("/"))
        return Options(path, headers)
    }
}

fun request(block: RequestBuilder.() -> Unit): Options = RequestBuilder().apply(block).build()

fun main() {
    val options = request {
        path = "/tasks"
        headers { header("Accept", "application/json") }
    }
    check(options.path == "/tasks")
    check(options.headers == mapOf("Accept" to "application/json"))
}
```

DSL 是接收者函数与构建器的组合，没有自动生成网络行为。DslMarker 限制同标记的嵌套隐式接收者误用；仍能显式限定访问外层，不能视为权限隔离。需要定义校验、重复配置与输出快照规则。

`operator` 让类型参与 `+`/索引/解构等约定，`infix` 适合受限形式的中缀调用；二者只是表达方式，必须保持业务语义清晰。

## 八、面试与排错

先复现 associateBy 重复键、Sequence 重算、apply 返回对象与扩展静态分派。再回答：为什么 List 链可能分配中间集合？为何 Sequence 的排序仍可能保留全部元素？何时用普通 for？DSL 如何防止访问错外层？

性能问题先记录数据规模、分配量、耗时和结果一致性；没有实测时只说可能减少中间容器，不承诺“Sequence/inline 永远快”。

官方参考：[集合概览](https://kotlinlang.org/docs/collections-overview.html)、[Sequence](https://kotlinlang.org/docs/sequences.html)、[作用域函数](https://kotlinlang.org/docs/scope-functions.html)、[类型安全构建器](https://kotlinlang.org/docs/type-safe-builders.html)。
