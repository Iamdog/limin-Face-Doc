---
title: Kotlin 高频面试题与代码练习
description: 按基本使用、场景排错、机制与取舍组织 55 道问答和可运行代码练习。
---

# Kotlin 高频面试题与代码练习

## 一、这些题怎样用

每题按 **解决的问题 → 常用写法 → 失败案例 → 原理/取舍** 回答。先完成 [语言学习路线](/doc/Android/Kotlin语言使用与面试学习路线)，不要先背 CPS、内联字节码或冷流源码。

下列 55 题覆盖语言、模型、泛型、集合、JVM 混编、内联、协程和 Android 状态流。答案给出核心契约和追问，完整用法通过对应专题继续练习；题目数量不等于掌握程度。

## 二、语言基础：先会写和解释结果（1—12）

### 1. Kotlin 在日常开发中解决什么问题？

可空类型让缺失处理显式，属性/data class/默认参数减少样板，集合和高阶函数组织转换。先用表单解析、页面模型说明收益；协程需要额外库，事务和权限仍需业务设计。追问：Java 混编边界是否仍可能 NPE？

### 2. val、var、const val 有何区别？

局部 val 不重新赋值，var 可重新赋值，类型仍受静态检查；const val 是受限制的编译期常量。val 指向 MutableList 仍能 add。属性 val 还可能有自定义 getter，不保证每次返回同一个对象。追问：常量被编译进入调用方，改库后旧调用方是否需要重编？

### 3. Kotlin 空安全是否完全消灭 NPE？

没有。先说 `String?`、安全调用和边界校验；`!!`、Java 平台类型、初始化泄漏仍有风险。lateinit 未初始化通常是另一种异常。追问：平台值绑定成 String 时断言在哪里发生？

### 4. `?.`、`?:`、`!!` 怎样选择？

有值才操作用 `?.`；缺失时默认、return 或 throw 用 Elvis；`!!` 只在不变量可靠时用。非法数字和“未填写”要分开，不把所有错误都默认成 0。追问：Elvis 右侧什么时候执行？

### 5. 智能转换为什么有时不能使用？

编译器需要证明检查后类型不会变化。可变成员、自定义 getter、开放属性或被修改的捕获变量可能不满足；先读到局部 val 再检查。追问：局部快照是否自动解决跨字段的并发一致性？没有。

### 6. `==`、`===` 与数组比较有什么区别？

普通对象 `==` 使用空安全的 equals，`===` 比引用；数组内容使用 contentEquals/contentDeepEquals。先运行两个内容相同数组仍不 `==` 的例子。追问：装箱数字、NaN 和正负零为什么不能凭记忆判断？需看静态类型与规则。

### 7. if/when 的表达式有什么用途？

直接生成结果，避免可变临时变量；when 支持值/类型/范围和穷尽状态。对 enum/sealed 不写无条件 else 可让新状态触发遗漏检查。追问：语句形式与表达式形式的覆盖要求有何差异？

### 8. Unit、Nothing、Any、Any? 怎样解释？

Unit 表示正常结束但无有用结果；Nothing 没有正常返回值，如一直抛错；Any 是非空对象顶层类型，Any? 包含 null。追问：`value ?: throw ...` 为什么可参与非空类型推断？

### 9. 默认参数、命名参数和 vararg 解决什么问题？

默认参数减少重载，命名参数降低同类型参数传错，vararg 接受多个值，数组用展开运算符传入。先给调用示例，再说 Java 默认不自动省略参数。追问：展开数组是否有复制成本？

### 10. Int、Long 与金额处理需要注意什么？

一般需要显式数字转换，整数除法和溢出必须验证。金额定义货币单位、精度与舍入，选最小单位整数或 BigDecimal。追问：toLong 是转换，是否能补救已经发生的 Int 溢出？不能。

### 11. try、use 和 runCatching 怎样用？

try 可以返回值，use 在成功/异常时关闭资源，runCatching 将异常封装为 Result。先明确可处理的异常；协程取消会被 runCatching 捕获，应重新抛出。追问：finally 中 return 会不会覆盖原异常？会，应避免。

### 12. typealias 是否提供新类型安全？

它只是别名，UserId/OrderId 都别名为 Long 时仍可混传。需要新类型隔离时用封装类/value class。追问：value class 在泛型/可空/接口场景是否仍可能装箱？可能。

使用与验证见 [语言基础](/doc/Android/Kotlin语言基础与日常开发)。

## 三、对象、泛型与委托：先保证模型正确（13—24）

### 13. Kotlin 类和方法为什么默认 final？

继承作为显式设计选择，需要 open/abstract，override 明确重写。使用组合或接口委托复用实现。追问：Spring 代理为何受 final 影响，是否所有代理方式都一样？需看代理类型和插件。

### 14. 构造、init 和属性初始化有什么坑？

主构造先建立参数，类体属性/init 按顺序处理；父初始化早于子类完整初始化。父构造调用 open 成员或提前发布 this 可访问未就绪状态。追问：把 lateinit 加上能否解决提前调用？不能。

### 15. data class 自动生成什么，哪些属性参与？

基于主构造属性生成相等/哈希、展示、解构和 copy（按已有实现规则）。类体属性不参与默认 equals/copy。先给业务模型再解释产物。追问：数组/可变列表作为属性会带来什么问题？

### 16. copy 是深拷贝吗？

是浅拷贝，可变元素/列表可能共享。要隔离容器用新列表，要隔离元素则按业务复制或采用不可变模型。追问：只改类型为 List 为什么不一定够？外部别名仍可修改。

### 17. data class 可以作为 HashMap 的键吗？

可以，但参与 equals/hashCode 的值应稳定；插入后修改键可能破坏查找。不要把可变业务实体直接当稳定键，优先 ID/不可变值对象。追问：copy 出新键能否自动修正旧 map 的索引？不能。

### 18. sealed 与 enum 什么时候选？

enum 表达有限常量，sealed 表达不同载荷的已知子类型。先用 Loading/Content/Error 举例，解释穷尽 when。追问：sealed 对直接子类有何模块/包约束，开放的间接子类是否仍可扩展？

### 19. object、companion、data object 有何区别？

object 是命名单例；companion 是类关联对象，适合工厂；data object 增加相等/展示语义，适合无载荷状态。JVM 初始化安全不保护内部可变状态。追问：Java 通过 INSTANCE、Companion 还是静态方法访问？看生成 API。

### 20. nested 与 inner class 为什么关系到泄漏？

普通嵌套类默认不持有外部实例；inner 持有。若长生命周期任务持有 inner 监听器，可能延长 Activity 寿命。追问：匿名对象捕获外部页面时是否也有相似风险？有。

### 21. out、in 与不变泛型怎么回答？

先给 `Source<out T>` 生产者、`Sink<in T>` 消费者。型变来自类型位置和替代规则；可读写 MutableList 通常不变。追问：`Array<out T>` 是使用处投影，如何限制写入？

### 22. 星投影与 reified 能否检查 `List<String>`？

`List<*>` 可安全处理未知容器，不知道元素具体类型。reified 提供调用点的类型操作，但嵌套泛型参数仍受擦除影响，完整校验需逐元素或专用类型描述。追问：为什么 `is List<*>` 成功不能证明没有 Int？

### 23. 类委托与属性委托有什么区别？

接口 `by repo` 转发行为，属性 `by delegate` 转发 getValue/setValue。先示例再讲 observable 赋值后、vetoable 赋值前回调。追问：被委托对象内部自调用是否会自动走包装类 override？不会。

### 24. lazy 和 lateinit 怎么选？

有可计算值且要延迟时用 lazy；稍后注入且必须存在可用 lateinit；缺失/清空合法时可空属性更合适。lazy 失败可重试、PUBLICATION 可重复 initializer，不保证返回对象线程安全。追问：Fragment View 销毁为何通常要清空 binding？

用法与故障见 [面向对象、泛型与委托](/doc/Android/Kotlin面向对象泛型与委托详解)。

## 四、集合、函数式与 DSL：先判断输出和副作用（25—33）

### 25. List 和 MutableList、val 和不可变有何关系？

List 是只读接口，MutableList 可调用修改方法，val 限制绑定；三者不直接等价于深不可变。Java 不可修改容器仍可能映射为可变接口但操作抛错。追问：toList 是否递归复制所有元素？没有。

### 26. distinctBy、associateBy、groupBy 怎么选？

按键保留首条用 distinctBy，同键映射通常保留后条用 associateBy，需要多条用 groupBy。先约定重复业务键策略，不能任由 API 静默决定。追问：只需分组计数时怎样避免每组都生成列表？groupingBy/eachCount。

### 27. firstOrNull 和 singleOrNull 有何差异？

前者取第一条或 null；后者只在恰好一条时返回，零条/多条都 null。唯一业务规则应区分不存在与重复。追问：emptyList.reduce 为什么失败，fold 如何选择初值？

### 28. Sequence 是否一定比 List 快？

先演示惰性、提前停止和重复计算，再说明迭代/装箱成本和 sorted 全量收集。小数据可能更慢，需要代表负载。追问：Sequence 是否默认缓存或并行？都不是。

### 29. Lambda、闭包与函数引用有什么使用边界？

高阶函数接收函数值，闭包捕获外部状态，函数引用复用已有声明。并发捕获变量仍需同步。追问：不捕获变量的 Lambda 是否必定每次创建对象？不应作此保证。

### 30. let/run/with/apply/also 怎么选择？

先按“this 或 it、原对象或块结果”选：apply 配置返回对象，also 副作用返回对象，let/run/with 计算结果。`x.let` 不自动排除 null。追问：嵌套 this 是否可能用错外层属性？如何命名或拆函数？

### 31. 扩展函数是否真的给原类增加方法？

调用形式像成员，但顶层扩展按静态接收者类型解析，可用成员优先，不能访问 private 或新增 backing field。追问：成员扩展的分派接收者和扩展接收者为什么要分开说明？

### 32. return@label 与普通 return 怎么区别？

标签返回结束指定 Lambda，符合内联条件的普通 return 可退出外层函数，匿名函数 return 退出自身。for 循环的 break/continue 常更直观。追问：crossinline 在编译期限制什么？

### 33. Kotlin DSL 的基础和误用风险是什么？

接收者函数配合构建器，形成声明式配置；DslMarker 限制同标记隐式接收者混用。输出仍需校验和快照。追问：能否显式访问外层接收者，是否等于权限隔离？能显式访问，不等于隔离。

完整示例见 [集合、函数式与 DSL](/doc/Android/Kotlin集合函数式与DSL实战)。

## 五、JVM 混编与机制：使用后再深入（34—41）

### 34. 平台类型是什么，怎么处理？

Java 缺少被识别的空性契约时，Kotlin 允许更宽松调用。显式可空接收并按契约校验；String! 是工具符号。追问：注解、编译器模式与 SDK 实际返回为何都要检查？

### 35. JvmStatic、JvmField、JvmName、JvmOverloads 怎样用？

分别处理静态入口、字段、JVM 名称和默认参数重载，都有条件与兼容边界。先让 Java 编译并调用，再看 javap。追问：JvmOverloads 是否生成任意省略参数组合？不会。

### 36. Kotlin 怎么处理 Java 受检异常和 suspend API？

Kotlin 不强制捕获受检异常，Throws 可声明 Java 端异常契约。suspend 的 Continuation 形式通常需为 Java 提供适配 API。追问：桥接阻塞、回调或 CompletionStage 时取消/超时谁负责？

### 37. inline 解决什么开销，有什么代价？

小型高阶函数可展开函数和 Lambda，减少部分回调对象/间接调用，并支持特定非局部返回。产物膨胀、公开 API 兼容和块内分配仍要考虑。追问：R8/JIT 能否影响最终性能？能，需实测。

### 38. noinline 与 crossinline 有何区别？

需要保存/传递函数值时 noinline；在其他执行上下文调用并禁止非局部 return 时 crossinline。后者不保证没有包装对象。追问：crossinline 是否自动切到后台线程？不是。

### 39. reified 为什么要求 inline？

调用点展开时可带入具体类型用于类型判断/类字面量，避免只剩擦除的 T。它不是通用运行时泛型保留机制。追问：复杂序列化类型为何仍需 TypeToken/serializer？

### 40. suspend 的 JVM 实现怎么解释？

先说明实际调用是否挂起；再解释 Continuation 参数、完成结果或挂起标记、状态保存和恢复。尾调用等可优化，非所有方法同样生成状态机。追问：恢复是否保证同一物理线程？看 Dispatcher 和上下文。

### 41. K2、value class 和反射需要掌握到哪层？

K2 是 Kotlin 2.x 的编译器基础，变化需按版本验证；value class 提供源级类型隔离，使用处可能装箱；完整反射常需 kotlin-reflect，并考虑混淆/成本。追问：什么证据能证明某段代码在目标 release 包中减少分配？

示例和验证见 [Java 混编](/doc/Android/Kotlin与Java互操作实战)、[核心机制](/doc/Android/Kotlin核心机制与高频实战解析)。

## 六、协程与 Flow：先保证任务和页面行为（42—55）

### 42. suspend 是否自动异步、自动切线程或不阻塞？

都不是。它允许挂起调用；Thread.sleep/JDBC 仍可能阻塞，具体 API 决定是否挂起。先按工作类型选调度，再看实现。追问：为什么已有主线程安全挂起 API 不一定需外套 IO？

### 43. launch、async、withContext 如何选择？

无结果任务用 Job，需要并发结果用 Deferred，一段上下文内工作用 withContext 并等待完成。async 默认不等 await 才启动。追问：为何两个 async 各自立刻 await 可能没有实际并发？

### 44. 结构化并发解决什么问题？

子任务寿命、取消、失败和结束受拥有者管理；coroutineScope 等待子任务。GlobalScope 或新 Job 可能绕开原父子关系。追问：同组失败为何取消兄弟，scope 外如何处理？

### 45. supervisorScope 是不是异常万能保护？

只隔离独立子任务失败传播，仍需处理各自结果；scope 块自身抛错会取消子任务。必需结果用共同成功失败的规则，可选结果独立降级。追问：async.await 抛错未处理时是否仍可让块失败？可以。

### 46. CoroutineExceptionHandler 可以替代 try/catch 吗？

不可以。它面向符合条件的未处理异常，不能恢复已失败协程；async 的结果/异常主要由 Deferred/await 消费，普通父子结构还受传播影响。追问：handler 放在每个子协程上为何未必生效？看传播与根处理条件。

### 47. cancel 是否立即停止任务，超时是否回滚？

取消协作完成，cancelAndJoin 等结束；CPU 循环需检查，阻塞 API 需支持取消/中断。withTimeout 的取消不撤销远端写入。追问：怎样确认超时后的最终业务状态并安全重试？

### 48. 为什么不能随意 runCatching 协程调用？

它捕获包括 CancellationException 在内的 Throwable，可能把离开页面变成业务降级。重新抛出取消，仅处理预期失败。追问：finally 的挂起清理何时需短而有界的 NonCancellable？

### 49. Flow 是否都是冷流，为什么重复请求？

flow 构建器通常每次收集执行上游，但 StateFlow/SharedFlow 是热流。多个 collector、生命周期重启或共享停止后再订阅都可能重发。追问：repeatOnLifecycle 是否自动去重？不会。

### 50. flowOn、catch、retryWhen 的范围是什么？

flowOn 改变其上游上下文；catch 处理上游异常而非下游 collect，取消应传播；retryWhen 重收集上游可能重放副作用。追问：catch 放在搜索外层为何可能终止后续输入处理？

### 51. buffer、conflate、collectLatest 有何区别？

buffer 让上下游缓冲协作，conflate 跳过排队中间值，collectLatest 取消旧处理块。先按“每条必须处理还是只要最新”选。追问：取消旧块能否撤销已经完成的外部写入？不能。

### 52. StateFlow 为什么不通知 UI，update 安全到什么范围？

StateFlow 按 equals 合并，原地修改列表/同对象回写可能不发新状态；慢消费者也可跳过。用新模型和容器。update 原子转换，但 lambda 可能重试，不放必须一次的副作用。追问：线程安全容器能否保护其中对象的所有可变字段？不能。

### 53. SharedFlow/Channel 能否保证一次性事件不丢不重？

不能仅凭类型保证。SharedFlow 广播，无订阅者时只保留 replay；Channel 通常分配给单接收者。关键事件需要状态、业务 ID、持久化/确认/去重。追问：extraBufferCapacity 为什么不等于离线队列，tryEmit 成功为何不等于消费？

### 54. viewModelScope、repeatOnLifecycle 与 stateIn 分别解决什么？

前者定义 ViewModel 任务寿命；中者按 UI 生命周期启动/取消订阅；后者在给定 scope 中共享状态上游。WhileSubscribed 的停止与重启仍可能请求。追问：旋转、退后台和进程死亡的行为有什么不同？

### 55. callbackFlow、Mutex 和协程测试怎么用？

回调适配要注册/awaitClose 注销并处理取消竞争；共享计数用 Mutex/原子操作，volatile 不使 ++ 原子。runTest 配合测试 Dispatcher/虚拟时间验证超时与去抖，热流要有结束策略；Android 还需设备验证。追问：锁内长挂起、后台 scope 没清理、热流无限 collect 怎么发现？

完整操作、失败验证与 Android 片段见 [协程与 Flow](/doc/Android/协程与Flow实战)。

## 七、代码题：先预测，再运行验证

每个题块是独立完整 JVM 示例；前三题仅需标准库，第四题额外需协程库。先盖住 check 预测结果，再改动代码寻找边界。

### 练习 A：空值和作用域函数是否自动安全？

```kotlin
// 完整示例 sample: drillscopes
fun main() {
    val name: String? = null
    var executed = false
    name.let { executed = true }
    check(executed)
    check(name?.let { it.length } == null)
    val list = mutableListOf(1).apply { add(2); 100 }
    check(list == listOf(1, 2))
    val result = list.run { sum() }
    check(result == 3)
}
```

追问：如何把“缺失默认”和“输入格式错误”分开？参照语言基础的 pageSize。

### 练习 B：只读类型和 copy 是否隔离了数据？

```kotlin
// 完整示例 sample: drillcopy
data class State(val items: List<String>)

fun main() {
    val source = mutableListOf("A")
    val old = State(source)
    val copied = old.copy()
    source.add("B")
    check(old.items == listOf("A", "B") && old == copied)
    val detached = old.copy(items = old.items.toList())
    source.clear()
    check(detached.items == listOf("A", "B"))
}
```

追问：如果元素是 MutableUser，toList 是否又变成深拷贝？不是，需继续设计元素不可变性。

### 练习 C：reified 是否检查了所有泛型元素？

```kotlin
// 完整示例 sample: drillreified
inline fun <reified T> matches(value: Any): Boolean = value is T

fun main() {
    val mixed: Any = listOf(1, "A")
    check(matches<List<String>>(mixed)) // 容器匹配不代表元素全为 String
    val validElements = (mixed as List<*>).all { it is String }
    check(!validElements)
}
```

追问：如何验证 JSON `List<User>`？使用明确 serializer/类型描述和数据验证，不能盲目 as。

### 练习 D：tryEmit 成功意味着事件已被消费吗？

```kotlin
// 完整示例 sample: drillsharedflow
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    val transient = MutableSharedFlow<Int>(extraBufferCapacity = 2)
    check(transient.tryEmit(1))
    check(transient.replayCache.isEmpty()) // 无订阅者，也没有 replay
    val replayed = MutableSharedFlow<Int>(replay = 1)
    replayed.emit(9)
    check(replayed.first() == 9)
}
```

追问：导航事件允许丢失吗？支付结果允许吗？两类场景的可靠性要求不同，先定义业务规则再选工具。

## 八、面试准备验收

每个主题能完成：写正常用法、预测边界结果、稳定复现失败、说明修复、再解释机制。记录所用 Kotlin/JDK/协程库版本，Android 额外记录 AndroidX 与目标系统。无法给出使用例子的原理题，回到对应专题先练习。
