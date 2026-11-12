---
title: Kotlin 与 Java 互操作实战
description: 先处理 Java 返回空值与 Java 调用 Kotlin，再解释平台类型、默认参数、异常和 JVM API 边界。
---

# Kotlin 与 Java 互操作实战

## 一、解决什么问题

Android 和 JVM 后端常在 Kotlin 中调用 Java SDK，或让 Java 调用 Kotlin 的模型/工具方法。语法能调用不代表契约正确：null、集合可变性、默认参数、静态入口和异常都要明确。

先在边界处理数据和调用签名，再看生成的 JVM 类。本文两组混编完整示例分别放入独立目录。

## 二、调用 Java：平台类型先当契约待确认

完整 Java 示例保存为 `LegacyUsers.java`：

```java
// sample-java: platform
public final class LegacyUsers {
    public static String nickname() { return null; }
}
```

完整 Kotlin 示例保存为 `Main.kt`，与上面的 Java 类配合：

```kotlin
// 完整混编示例 sample: platform
fun main() {
    val raw: String? = LegacyUsers.nickname()
    val display = raw?.trim()?.takeIf { it.isNotEmpty() } ?: "未命名"
    check(display == "未命名")
    val failure = runCatching {
        val forced: String = LegacyUsers.nickname()
        forced.length
    }
    check(failure.exceptionOrNull() is NullPointerException)
    println(display)
}
```

编译运行：

```bash
javac -d out LegacyUsers.java
kotlinc Main.kt -classpath out -include-runtime -d main.jar
java -cp main.jar:out MainKt
```

Windows classpath 分隔符使用 `;`。未提供编译器识别的空性信息时，Java 引用类型常以平台类型呈现；`String!` 是工具展示符号，不能直接写在 Kotlin 源码中。显式接收为 String? 可让缺失处理进入类型系统；如果 API 契约要求必需值，应在边界校验并给出明确错误，而非全程默默默认。上面的非空绑定可编译，但 Java 实际返回 null 时会在运行断言失败。

可识别的 Nullable/NonNull/JSpecify 等注解与编译器模式会影响类型增强和诊断，不能说 Kotlin 完全忽略 Java 注解，也不能说“加任何名字为 NonNull 的注解都生效”。新代码选择统一且被工具识别的注解，仍验证 SDK 实际行为。

## 三、集合、数组与 SAM 适配

Java 返回的 List 可能可变，可能含 null，也可能是 Java 不可修改包装。Kotlin 只读接口不阻止 Java 持有者修改；MutableList 接口也不能保证底层实现允许 add，调用可能抛 UnsupportedOperationException。

对外部数据按契约校验元素、转换模型、建立所需快照，不盲目强转。`Array<Int>` 通常涉及装箱，`IntArray` 对应原始 int[]；数组不做 Kotlin 普通泛型那样的协变赋值。

```kotlin
// 完整示例 sample: sam
fun interface Validator { fun valid(value: String): Boolean }

fun main() {
    val task = Runnable { println("Java SAM") }
    task.run()
    val validator = Validator { it.isNotBlank() }
    check(validator.valid("A"))
    check(!validator.valid(" "))
}
```

Java 单抽象方法接口和 Kotlin fun interface 可做 SAM 转换；普通多抽象方法接口仍需实现各方法。不要把 Lambda 适配推论成所有接口都能自动转换。

## 四、让 Java 调用 Kotlin：先设计公开入口

完整 Kotlin 文件保存为 `Labels.kt`，使用 file 注解固定顶层类名：

```kotlin
// 完整混编示例 sample: javaapi
@file:JvmName("Labels")

fun displayLabel(name: String): String = name.trim()

class Greeter {
    companion object {
        @JvmStatic
        @JvmOverloads
        fun greet(name: String, prefix: String = "Hello"): String = "$prefix $name"
    }
}
```

完整 Java 调用保存为 `JavaCaller.java`：

```java
// sample-java: javaapi
public final class JavaCaller {
    public static void main(String[] args) {
        if (!Labels.displayLabel(" A ").equals("A")) throw new AssertionError();
        if (!Greeter.greet("Alice").equals("Hello Alice")) throw new AssertionError();
        System.out.println(Greeter.greet("Bob", "Hi"));
    }
}
```

```bash
kotlinc Labels.kt -include-runtime -d labels.jar
javac -cp labels.jar -d out JavaCaller.java
java -cp labels.jar:out JavaCaller
```

| Kotlin API | Java 看到的常见形式 | 设计建议 |
|---|---|---|
| 顶层函数 | 文件生成类的 static 方法 | 用 JvmName 稳定类名，关注多文件规则 |
| 普通属性 | getter/setter（按属性配置） | 不假设能直接访问 public field |
| object 成员 | 通常经 INSTANCE 访问 | 需要静态入口时考虑 JvmStatic |
| companion 成员 | 通常经 Companion 访问 | JvmStatic 可生成额外静态入口 |
| 默认参数 | Java 默认不会自动省略参数 | JvmOverloads 生成从末尾剥离默认参数的重载，或手工提供 API |
| 公共字段 | 特定条件下 JvmField / const val | 注解有适用限制，先验证产物 |
| suspend 方法 | 额外 Continuation 和 Object 返回形式 | 面向 Java 可提供阻塞/回调/CompletionStage 适配，明确取消语义 |

JvmOverloads 不保证任意默认参数组合都有重载；还要检查签名冲突和 API 体积。Java 调用一般不能使用 Kotlin 命名参数，Kotlin 调 Java 也不能把参数名可用性视为语言默认保证。

## 五、异常、泛型和代理框架边界

Kotlin 不强制受检异常处理，Java 调用方仍需要清晰契约。要在生成方法上声明异常，使用 `@Throws(IOException::class)`；它不是捕获、转换或自动回滚机制。

List 的 out/in 与 JVM 通配符映射会影响 Java 签名；必要时按边界使用 JvmSuppressWildcards/JvmWildcard，而不是全库统一消掉通配符。泛型擦除会导致同擦除签名冲突，部分场景可用 JvmName 区分。

Kotlin 类/方法默认 final，某些 Spring 代理需要可继承成员；选择合适代理方式或官方 kotlin-spring/all-open 插件，并检查编译产物。JPA 无参构造/开放要求应按 ORM 版本和插件配置处理，不要认为所有 data class 都天然适合做实体。

## 六、排错和面试按使用深入

| 现象 | 先看什么 | 再解释什么 |
|---|---|---|
| Java 返回值在 Kotlin 边界 NPE | API 空性契约、返回数据、编译器识别注解 | 平台类型与运行时断言 |
| Java 找不到静态函数/默认重载 | 生成类名、Companion、真实签名 | JvmStatic/JvmOverloads/JvmName |
| 集合不能修改/元素为空 | 实际容器实现与元素契约 | 只读接口、包装与别名 |
| 代理/反射找不到方法 | final、可见性、插件、混淆 | JVM 产物与框架匹配条件 |
| Java 调 suspend 困难 | Java 端需要的异步契约 | Continuation 与适配边界 |

先复现这两组真实混编程序，再用 `javap -p -c -classpath labels.jar Labels Greeter` 看生成类。不能凭 Kotlin 源码调用形式猜 Java API。

官方参考：[调用 Java](https://kotlinlang.org/docs/java-interop.html)、[Java 调用 Kotlin](https://kotlinlang.org/docs/java-to-kotlin-interop.html)。
