---
title: Kotlin 面向对象、泛型与委托详解
description: 从业务对象与页面状态开始，理解继承、data class、sealed、型变、委托和初始化边界。
---

# Kotlin 面向对象、泛型与委托详解

## 一、解决什么问题

对象组织行为，data class 表达数据，sealed 限定状态种类，泛型复用算法而不丢失类型约束，委托复用实现。先设计一个能正确表示业务的模型，再分析生成方法、型变和属性访问。

本文完整示例只依赖 Kotlin/JVM 标准库；互不依赖，分别保存运行。

## 二、class、属性、构造与可见性

```kotlin
// 完整示例 sample: account
class Account(val id: Long, initialName: String) {
    var name: String = initialName
        private set

    init { require(initialName.isNotBlank()) }

    fun rename(value: String) {
        require(value.isNotBlank())
        name = value.trim()
    }

    val label: String get() = "$id:$name"
}

fun main() {
    val account = Account(1, "Alice")
    account.rename(" Bob ")
    check(account.label == "1:Bob")
    check(runCatching { account.rename(" ") }.isFailure)
}
```

主构造参数带 val/var 才直接成为属性；init 与属性初始化按类体出现顺序运行，次构造最终委托主构造。`private set` 让外部读、内部控制写，避免绕开校验。

自定义 getter 每次访问都可能重新计算；使用 `field` 可在访问器内操作 backing field，只有满足条件的属性才有 backing field。接口可声明属性契约，但不能据此直接拥有实例 backing field。

| 可见性 | 基本用途 | 边界 |
|---|---|---|
| public | 默认公开 | 公共 API 需要兼容设计 |
| private | 类内或顶层文件内使用 | 顶层 private 是文件范围 |
| protected | 类及子类可见 | 顶层声明不能使用 |
| internal | 同一 Kotlin 编译模块内使用 | 不等同 Java 的包可见，也不是安全隔离 |

### 继承先确认是否需要扩展

class 和成员默认 final，允许继承/重写要用 open；abstract 用于未完成实现，override 表示重写。接口可提供默认实现，多接口冲突时显式选择 `super<Interface>.method()`。优先按业务选择组合，不为少写几行就开放所有类。

父构造/init 中调用 open 成员可能访问尚未初始化的子类状态。构造期间不要发布 this 或启动依赖完整对象的异步工作。

## 三、data class：让数据参与相等、解构和复制

```kotlin
// 完整示例 sample: shallowcopy
data class Draft(val id: Long, val tags: MutableList<String>) {
    var localNote: String = ""
}

fun main() {
    val original = Draft(1, mutableListOf("A"))
    val copied = original.copy()
    copied.tags.add("B")
    check(original.tags == listOf("A", "B")) // copy 是浅拷贝
    original.localNote = "原稿备注"
    check(original == copied)                // 类体属性不参与默认 equals
    check(copied.localNote == "")           // 类体属性也未由 copy 拷贝
    val detached = original.copy(tags = original.tags.toMutableList())
    detached.tags.clear()
    check(original.tags.size == 2)
    println(original)
}
```

编译器根据**主构造中的属性**生成 equals/hashCode、toString、componentN、copy（具体生成规则还受已有实现影响）。主构造至少一个参数且都为 val/var；data class 不能同时是 abstract/open/sealed/inner。

copy 不递归复制引用；数组作为属性也不会自动拥有你期望的内容 equals。参与 hashCode 的可变属性改变后，放入 HashSet/HashMap 的对象可能无法按原查找路径找到，应保持键稳定。

页面状态通常优先 `data class State(val tags: List<String>)`，更新时生成新容器 `old.copy(tags = old.tags + "B")`。必须同时保证没有外部可变别名；仅把 MutableList 改写成 List 类型不够。

## 四、sealed、enum、object 与 companion

```kotlin
// 完整示例 sample: sealedstate
sealed interface LoadState {
    data object Loading : LoadState
    data class Content(val names: List<String>) : LoadState
    data class Failure(val message: String) : LoadState
}

fun render(state: LoadState): String = when (state) {
    LoadState.Loading -> "加载中"
    is LoadState.Content -> state.names.joinToString()
    is LoadState.Failure -> "失败:${state.message}"
}

fun main() {
    check(render(LoadState.Loading) == "加载中")
    check(render(LoadState.Content(listOf("A", "B"))) == "A, B")
    check(render(LoadState.Failure("网络不可用")) == "失败:网络不可用")
}
```

| 结构 | 适合 | 使用边界 |
|---|---|---|
| enum class | 有限常量，如排序方向 | 常量可带参数/方法，但不适合各状态携带不同数据模型 |
| sealed class/interface | 已知子类型、穷尽状态 | 直接子类受模块/包约束，跨平台另有规则；不是所有间接子类都封闭 |
| object | 命名单例、无须多实例的策略 | JVM 初始化安全不代表单例内可变状态线程安全 |
| companion object | 挂在类名上的工厂/常量入口 | 自身也是对象；Java 静态调用取决于注解/生成 API |
| data object | 状态单例的稳定展示/相等语义 | Kotlin 1.9+；按 == 使用，不依赖反射场景中的引用身份 |

嵌套 class 默认不持有外部类实例；inner class 会持有，Android 中要注意生命周期和泄漏。`object : Listener { ... }` 是对象表达式，适合临时实现接口。

## 五、泛型：先做可复用且安全的接口

```kotlin
// 完整示例 sample: variance
open class Animal
class Cat : Animal()

interface Source<out T> { fun next(): T }
interface Sink<in T> { fun accept(value: T) }

class CatSource : Source<Cat> { override fun next() = Cat() }
class AnimalSink : Sink<Animal> {
    var count = 0
    override fun accept(value: Animal) { count++ }
}

fun <T : Comparable<T>> maximum(a: T, b: T): T = if (a >= b) a else b

fun main() {
    val source: Source<Animal> = CatSource() // 生产 Cat 也能当作生产 Animal
    check(source.next() is Cat)
    val actual = AnimalSink()
    val catSink: Sink<Cat> = actual          // 接收所有 Animal 当然能接收 Cat
    catSink.accept(Cat())
    check(actual.count == 1)
    check(maximum(3, 5) == 5)
}
```

`out T` 允许协变，通常用于生产者；`in T` 允许逆变，通常用于消费者。限制是类型位置规则，涉及函数参数/返回、属性 getter/setter 等，不能简单背“有 out 就没有任何方法参数”。普通 `MutableList<T>` 需要读写，通常保持不变。

使用处投影 `Array<out Animal>` 限制通过此引用写入；`Array<in Cat>` 允许写 Cat，但读取只能依赖其安全上界。`List<*>` 表示未知类型的安全读取，不等于 `MutableList<Any?>`，不能随便往未知集合里添加元素。

`T : Any` 排除 null；多个约束使用 `where T : InterfaceA, T : InterfaceB`。JVM 大部分泛型参数被擦除，不能用 `value is List<String>` 检查元素类型；`is List<*>` 后仍要逐元素校验。

inline reified 支持在调用点使用类型参数做 `is T`/`T::class`，但 `is List<String>` 的嵌套参数不会因此自动完整验证，详见 [机制专题](/doc/Android/Kotlin核心机制与高频实战解析)。

## 六、类委托与属性委托分别解决什么

类委托 `class Service(repo: Repo) : Repo by repo` 转发接口实现；属性委托 `var name by delegate` 转发 getValue/setValue。名字相同，不是同一层行为。

```kotlin
// 完整示例 sample: delegates
import kotlin.properties.Delegates
import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

class TrimmedText(initial: String) : ReadWriteProperty<Any?, String> {
    private var value = initial.trim()
    override fun getValue(thisRef: Any?, property: KProperty<*>): String = value
    override fun setValue(thisRef: Any?, property: KProperty<*>, value: String) {
        this.value = value.trim()
    }
}

interface Greeting { fun greet(): String }
class DefaultGreeting : Greeting { override fun greet() = "hello" }
class GreetingService(base: Greeting) : Greeting by base

fun main() {
    var name by TrimmedText(" Alice ")
    name = " Bob "
    check(name == "Bob")
    val changes = mutableListOf<String>()
    var status by Delegates.observable("idle") { _, old, new -> changes.add("$old->$new") }
    status = "ready"
    check(changes == listOf("idle->ready"))
    check(GreetingService(DefaultGreeting()).greet() == "hello")
}
```

observable 在赋值后通知，vetoable 在赋值前决定是否允许；二者都不自动实现同步或持久化。自定义存储委托仍需定义读写失败、序列化、缓存、线程、密钥与生命周期，不能只包 get/put 就称生产方案。

类委托中，被委托对象内部调用自己的成员仍使用其自身实现；包装类 override 不会自动截获所有内部自调用。

## 七、lazy、lateinit 与初始化选择

| 方式 | 先怎么用 | 边界 |
|---|---|---|
| 直接初始化 | 值已可获得时优先 | 初始化顺序和开销要清楚 |
| `val x by lazy { ... }` | 首次访问才计算并缓存 | 失败后后续访问可再次尝试；不保护返回对象后续修改 |
| `lateinit var x: Service` | 值稍后注入且应存在 | 非可空、非基础类型的 var；未初始化访问抛错 |
| `var x: Service? = null` | 尚未存在是合法状态 | 使用方明确处理 null，支持清空 |

lazy 在 JVM 默认 SYNCHRONIZED；PUBLICATION 允许 initializer 被并发执行多次，但发布一个值；NONE 要求线程约束成立。不要依赖重复 initializer 的外部副作用。

Android Fragment 的 View 有独立于 Fragment 的生命周期。binding 需要在 onDestroyView 清理时，通常使用可空 backing 属性，而不是用永不清理的 lazy 或 lateinit 隐藏失效引用。ViewModel 使用生命周期组件提供的工厂/委托。

## 八、value class、反射与类型安全扩展

`@JvmInline value class UserId(val value: Long)` 能在源代码中区分 UserId/OrderId，减少同为 Long 的误传。它只允许一个主构造属性，不支持普通类继承；可空、泛型、接口等使用处可能装箱，不能保证“零分配”。Java 方法名修饰/调用入口需另做 API 设计。

`::property`、`Type::class`、`obj::method` 是属性/类/函数引用。基础类字面量不代表可以完成所有反射操作；完整 Kotlin/JVM 反射常需要 `kotlin-reflect`，还要考虑混淆、性能和运行时元数据。

## 九、面试递进与练习

先解释用途，再运行浅拷贝、sealed 状态和型变示例。随后回答：为什么类体属性不参与默认 equals？为何 MutableList 不能像 List 一样协变？PUBLICATION 能否执行两次扣款？inner 为什么容易延长外部对象寿命？

练习：将 Draft 的 tags 改成受控不可变快照；为加载状态加 Empty 分支并检查所有 when；给 Source/Sink 加一个非法类型位置，观察编译器拒绝理由。

官方参考：[类与继承](https://kotlinlang.org/docs/classes.html)、[data class](https://kotlinlang.org/docs/data-classes.html)、[泛型](https://kotlinlang.org/docs/generics.html)、[属性委托](https://kotlinlang.org/docs/delegated-properties.html)。
