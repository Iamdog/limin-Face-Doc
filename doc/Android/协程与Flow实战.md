---
title: Kotlin 协程与 Flow 实战
description: 从可取消请求、冷流和页面状态使用开始，逐步学习异常、共享、生命周期、背压与调试。
---

# Kotlin 协程与 Flow 实战

## 一、解决什么问题

协程帮助用顺序代码组织等待、并发、取消和资源释放；Flow 表达随时间产生的多个值。Android 再通过 ViewModel 和 Lifecycle 管理任务/订阅寿命。先把请求结果、失败和退出行为写对，再解释状态机。

需要先掌握函数、Lambda、可空类型、sealed 状态，入口见 [Kotlin 学习路线](/doc/Android/Kotlin语言使用与面试学习路线)。suspend 是语言能力，launch/async/Flow 是 kotlinx.coroutines 库，viewModelScope 是 AndroidX，不能混作同一个关键字。

## 二、先运行一个成功请求

纯 JVM 完整示例可使用以下 Gradle Kotlin DSL 配置。版本用于固定练习环境，不代表所有 Android 项目的推荐升级组合：

```kotlin
// build.gradle.kts 配置片段；项目需已有 Gradle Wrapper 和仓库配置
plugins { kotlin("jvm") version "2.2.21" }
repositories { mavenCentral() }
dependencies { implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2") }
kotlin { jvmToolchain(17) }
```

下面是完整程序；本篇标有 sample 的 JVM 示例均需上述协程依赖：

```kotlin
// 完整示例 sample: coroutinesbasic
import kotlinx.coroutines.*

suspend fun fetchName(): String {
    delay(20)
    return "Alice"
}

fun main() = runBlocking {
    val result = async { fetchName() }
    check(result.await() == "Alice")
    val job = launch { println("请求完成") }
    job.join()
}
```

runBlocking 在控制台入口桥接同步与挂起，并阻塞调用线程直到完成；不要用它阻塞 Android 主线程或普通请求线程来“实现异步”。delay 模拟可取消等待，实际 SDK 是否支持挂起/取消需要看其契约。

| API | 基本用途 | 边界 |
|---|---|---|
| launch → Job | 发起无业务返回值任务 | join 等完成，不直接返回业务结果 |
| async → `Deferred<T>` | 需要结果的并发任务 | 默认立即调度，不等 await 才启动；async 后立刻 await 两次可能仍顺序 |
| withContext | 在指定上下文执行一段并等待结果 | 不是额外独立的长期任务；不一定发生线程切换 |
| coroutineScope | 当前操作的结构化子任务 | 等所有子任务结束；失败通常取消同组任务 |
| supervisorScope | 独立子任务的故障隔离 | 仍要处理失败；scope 块自身抛错仍取消子任务 |

## 三、调度与作用域：先约定任务在哪活、工作是什么

| 情况 | 基本选择 | 使用边界 |
|---|---|---|
| Android UI 操作 | Main / Main.immediate | Main 依赖平台提供；纯 JVM 不天然有 Main |
| 阻塞文件/JDBC/旧 SDK | 适当放入 IO | suspend 关键字不会把阻塞调用变非阻塞 |
| CPU 密集计算 | Default，并提供取消检查 | 长循环不挂起会延迟取消 |
| 已提供主线程安全的挂起网络/Room API | 按 API 契约调用 | 不必为所有网络函数再套 IO；库可能已内部调度 |
| 页面状态加载 | viewModelScope | 跟随 ViewModel，不等于页面不可见就取消 |
| UI 收集 | viewLifecycleOwner + repeatOnLifecycle | 随 View 生命周期和可见状态启动/停止 |
| 持久后台任务 | 结合 WorkManager 等 | 普通 CoroutineScope 不保证进程死亡后继续 |

注入 Dispatcher/外部 scope 便于测试和定义拥有者。避免无边界 GlobalScope；自建 `CoroutineScope(SupervisorJob() + dispatcher)` 必须有明确 cancel 时机。不要给内部 launch 随意塞新 Job，切断原有父子关系。

## 四、先验证必需请求失败会取消同组工作

```kotlin
// 完整示例 sample: structured
import java.io.IOException
import kotlinx.coroutines.*

fun main() = runBlocking {
    val started = CompletableDeferred<Unit>()
    var siblingCleaned = false
    val failure = runCatching {
        coroutineScope {
            launch {
                try {
                    started.complete(Unit)
                    awaitCancellation()
                } finally {
                    siblingCleaned = true
                }
            }
            async<Int> {
                started.await()
                throw IOException("必需请求失败")
            }.await()
        }
    }
    check(failure.exceptionOrNull() is IOException)
    check(siblingCleaned)

    val result = supervisorScope {
        val required = async { 42 }
        val optional = async<Int?> {
            try {
                throw IOException("可选请求失败")
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: IOException) {
                null
            }
        }
        required.await() to optional.await()
    }
    check(result == (42 to null))
    println("必需失败取消同组；可选失败独立降级")
}
```

这里 runCatching 只包住刻意制造的 IOException，并在断言中确认异常种类；生产挂起流程需要保留取消。可选降级只捕获可处理的 IOException，不能吞掉所有异常。

**先确定需求**：两个数据都必需时用 coroutineScope；各自可独立展示时可用 supervisorScope 并分别处理结果。SupervisorJob 不自动替你恢复请求，也不能保护当前 scope 块自己抛出的异常。

**再解释异常**：普通父子结构中，非取消异常会导致同组取消；async 持有结果/异常，但在普通父子结构下失败仍可取消父任务，不是只有 await 时才影响外部。CoroutineExceptionHandler 主要处理未被消费的、符合条件的顶层 launch 等异常，不是 try/catch、不会自动重试，对 async 的 Deferred 结果也不能替代 await。

## 五、取消、超时和资源：先验证任务真的结束

```kotlin
// 完整示例 sample: cancellation
import kotlinx.coroutines.*

fun main() = runBlocking {
    val entered = CompletableDeferred<Unit>()
    var cleaned = false
    val job = launch {
        try {
            entered.complete(Unit)
            awaitCancellation()
        } finally {
            cleaned = true
        }
    }
    entered.await()
    job.cancelAndJoin()
    check(cleaned && job.isCancelled)
    val timedOut = withTimeoutOrNull(20) { awaitCancellation() }
    check(timedOut == null)
    println("取消和超时均已结束任务")
}
```

cancel 发出取消，不表示目标已立即停止；cancelAndJoin 等其结束。delay、常见挂起 API 会检查取消，CPU 循环需 ensureActive/yield 或主动检查 isActive；Thread.sleep/普通阻塞 IO 未必协作取消，可中断调用可按契约使用 runInterruptible。

CancellationException 应重新抛出。runCatching 捕获 Throwable，因此下面是业务挂起调用的**边界片段**：

```kotlin
// 片段：load 是调用方的 suspend 函数
try {
    load()
} catch (cancelled: kotlinx.coroutines.CancellationException) {
    throw cancelled
} catch (failure: java.io.IOException) {
    showRetry(failure) // 调用方提供的错误展示
}
```

清理通常放 finally/use。已取消上下文中需挂起清理时，仅将必要、短且有界的清理放 `withContext(NonCancellable)`，不要包住整个业务。超时取消不是数据库/HTTP 外部副作用的回滚，重试前仍要判断幂等和最终状态。

## 六、Flow 基本使用：先观察冷流被执行几次

```kotlin
// 完整示例 sample: coldflow
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    var starts = 0
    val numbers = flow {
        starts++
        emit(1)
        delay(10)
        emit(2)
    }.map { it * 10 }
    check(starts == 0)
    check(numbers.toList() == listOf(10, 20))
    check(numbers.toList() == listOf(10, 20))
    check(starts == 2)
    println("收集两次，上游执行两次")
}
```

flow 构建器通常是冷流：每次 collect 执行上游，默认顺序 emit/处理。Flow 接口也可以是 StateFlow/SharedFlow 等热流，不能说所有 Flow 都是冷流。collect 是挂起终端操作，热流通常不自然完成，取消订阅或用 take 等限制。

| 需求 | 操作符 | 失败/性能边界 |
|---|---|---|
| 转换/筛选 | map/filter | 默认不自动并行 |
| 输入去抖/去重 | debounce/distinctUntilChanged | 某些 API 需版本对应的 opt-in；要定义空输入/重试触发 |
| 多源状态合成 | combine | 通常等每源至少一个值，再用最新值组合 |
| 一一配对 | zip | 与 combine 不同，结束/等待行为要明确 |
| 新请求替代旧请求 | flatMapLatest | 取消旧内层流；旧 SDK 必须配合取消 |
| 转换流并发 | flatMapMerge | 结果顺序与并发度必须设计 |
| 切换上游上下文 | flowOn | 影响它前面的上游，不直接改变 collect 所在上下文 |

不要在 flow 构建器内随意 `withContext(IO) { emit(...) }` 打破发射上下文约束。使用 flowOn，或在确实需要多协程发送时选择 channelFlow。

## 七、错误、重试与背压：先限定哪些失败能处理

```kotlin
// 完整示例 sample: flowretry
import java.io.IOException
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    var attempts = 0
    val results = flow {
        attempts++
        if (attempts == 1) throw IOException("首次失败")
        emit(42)
    }.retryWhen { cause, attempt ->
        cause is IOException && attempt < 1
    }.catch { cause ->
        if (cause is IOException) emit(-1) else throw cause
    }.toList()
    check(attempts == 2 && results == listOf(42))
}
```

catch 处理其上游异常，不捕获下游 collect 内异常，也不应吞掉取消。retry/retryWhen 重新收集上游，可能重放已发出的值和写入副作用；限定异常、次数、退避与幂等。本例只演示一次重试，真实网络需增加合适退避并避免无限风暴。

| 操作符 | 先解决的问题 | 代价 |
|---|---|---|
| buffer | 让生产和消费分段协作，缓冲有限数量 | 缓冲/溢出策略影响内存、顺序和丢失 |
| conflate | 消费较慢时保留更新的值 | 跳过中间值，不适用于每条都必须处理 |
| collectLatest | 新值到达取消前一个处理块 | 不撤销已完成的外部写入 |

这三者不同：conflate 跳过排队中间值，collectLatest 取消正在处理的旧值。订单/扣款等可靠流程不能因为 UI 的“只要最新”语义丢步骤。

## 八、StateFlow 与 SharedFlow：状态和事件先约定消费规则

```kotlin
// 完整示例 sample: stateflow
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    val mutable = MutableStateFlow(0)
    val state: StateFlow<Int> = mutable.asStateFlow()
    val observed = mutableListOf<Int>()
    val collector = launch(start = CoroutineStart.UNDISPATCHED) {
        state.take(2).toList(observed)
    }
    mutable.value = 0
    mutable.update { it + 1 }
    collector.join()
    check(observed == listOf(0, 1))
    println(observed)
}
```

StateFlow 必须有初始值，保存当前值，向新订阅者提供最新状态，按 equals 合并相同状态；慢消费者可能跳过中间变化。通过只读 StateFlow 暴露，内部持有 MutableStateFlow。

就地修改 MutableList 再把同一对象放回，可能由于相等合并不通知 UI；使用不可变属性、新容器和 copy，并消除外部别名。update 是原子更新，lambda 可能因竞争重试执行多次，不能在其中发请求、扣款或生成必须恰好一次的审计记录。

SharedFlow 用于多订阅广播：replay 决定给新订阅者回放多少，extraBufferCapacity 用于已有慢订阅者的额外缓冲。**没有订阅者时只保留 replay 所允许的值**，extraBufferCapacity 不是离线事件仓库。默认 MutableSharedFlow 无 replay，没订阅者时发出的事件会丢失；tryEmit 成功也不等于有人消费。

关键业务事件应有业务 ID、持久状态、确认/去重规则。Channel 是队列通信，一个元素通常给一个接收者，与广播不同；也不能仅凭 Channel 宣称 UI 事件恰好消费一次或进程死亡后可靠。

## 九、Android 页面实战：先按生命周期收集，再共享上游

下面为 Android 集成片段，依赖 AndroidX ViewModel/Lifecycle、协程库，以及项目自己的 Repository 和 UI。JVM 示例编译不能代替 Android 工程/设备验证。

```kotlin
// Android ViewModel 片段；Repository 应提供主线程安全的挂起实现
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import java.io.IOException
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

interface SearchRepository { suspend fun search(query: String): List<String> }
sealed interface SearchState {
    data object Empty : SearchState
    data object Loading : SearchState
    data class Content(val items: List<String>) : SearchState
    data class Failure(val message: String) : SearchState
}

@OptIn(FlowPreview::class, ExperimentalCoroutinesApi::class)
class SearchViewModel(private val repo: SearchRepository) : ViewModel() {
    private val query = MutableStateFlow("")
    val uiState: StateFlow<SearchState> = query
        .map { it.trim() }
        .distinctUntilChanged()
        .debounce(300)
        .flatMapLatest { text ->
            if (text.isEmpty()) flowOf<SearchState>(SearchState.Empty)
            else flow<SearchState> {
                emit(SearchState.Loading)
                emit(SearchState.Content(repo.search(text)))
            }.catch { failure ->
                if (failure is IOException) emit(SearchState.Failure("请求失败，请重试"))
                else throw failure
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SearchState.Empty)

    fun setQuery(value: String) { query.value = value }
}
```

先观察 Empty → Loading → Content/Failure，快速切换输入时旧查询被取消。错误处理在内层，后续新输入还能启动新查询；如果在整个输入流外 catch 后结束上游，后续输入可能不再处理。这里相同 query 被合并，失败重试按钮需另加刷新触发或请求状态设计，不能只再次 setQuery 相同字符串。

Fragment 在 onViewCreated 中收集的**接入片段**：

```kotlin
// 需 lifecycle-runtime-ktx；viewModel/render 由页面提供
// 文件顶部导入，下面的收集代码放在 onViewCreated 中
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle

viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(androidx.lifecycle.Lifecycle.State.STARTED) {
        viewModel.uiState.collect { state -> render(state) }
    }
}
```

repeatOnLifecycle 在离开 STARTED 后取消块，回来重新启动；多个长期流应各自在子 launch 收集，避免第一个 collect 阻塞第二个。Compose 可用 lifecycle-runtime-compose 的 `collectAsStateWithLifecycle()` 收集状态。

stateIn/shareIn 共享上游，不只是让 UI 看起来“生命周期安全”。WhileSubscribed(5000) 给短暂重建留停止延迟；超时无订阅后上游停止，重新订阅仍可能重发冷流请求。共享范围、replay 保留、缓存失效和业务去重必须另行设计。

ViewModel 能跨常规配置变化保存实例，但不自动跨进程死亡保存数据，且不可见时可能仍在运行。需要恢复的 query/筛选条件可通过 SavedStateHandle 或持久化；viewModelScope 在 ViewModel 清理时取消。

## 十、回调转 Flow 与并发安全

callbackFlow 适配外部回调，通常在 awaitClose 中注销监听；trySend 失败意味着关闭/缓冲策略等情况，需要按 SDK 契约处理。channelFlow 适合多子协程发送，普通 flow 保持上下文约束。注册抛错、取消竞争、重复注销和资源清理必须测试，不能只包一个 emit。

下面用内存回调源验证“收集两条后注销”，不是特定传感器 SDK 的接入实现：

```kotlin
// 完整示例 sample: callbackflow
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.*

class CallbackSource {
    val registered = CompletableDeferred<Unit>()
    private var listener: ((Int) -> Unit)? = null
    val active: Boolean get() = listener != null
    fun register(callback: (Int) -> Unit) {
        check(listener == null)
        listener = callback
        registered.complete(Unit)
    }
    fun unregister(callback: (Int) -> Unit) {
        if (listener === callback) listener = null
    }
    fun fire(value: Int) { listener?.invoke(value) }
}

fun CallbackSource.events(): Flow<Int> = callbackFlow {
    val callback: (Int) -> Unit = { value ->
        if (trySend(value).isFailure) println("当前无法接收:$value")
    }
    register(callback)
    awaitClose { unregister(callback) }
}

fun main() = runBlocking {
    val source = CallbackSource()
    val values = mutableListOf<Int>()
    val collector = launch { source.events().take(2).toList(values) }
    source.registered.await()
    source.fire(1)
    source.fire(2)
    collector.join()
    check(values == listOf(1, 2) && !source.active)
}
```

本例的回调与收集在同一线程协作，默认缓冲足以容纳这两条值；真实跨线程 SDK 要保证注册/注销线程安全，并为缓冲失败定义丢弃、背压或可靠队列策略。

共享可变计数即使放在协程中仍需同步：

```kotlin
// 完整示例 sample: mutex
import kotlinx.coroutines.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

fun main() = runBlocking {
    val mutex = Mutex()
    var count = 0
    List(20) {
        launch(Dispatchers.Default) { repeat(100) { mutex.withLock { count++ } } }
    }.joinAll()
    check(count == 2000)
}
```

Mutex 等待使用挂起，不代表锁内能无限持有或安全重入。状态更新可用 StateFlow.update；volatile 不能把 count++ 变原子，Default/IO 也不是业务同步机制。

## 十一、排错证据与面试追问

| 现象 | 先验证 | 再分析 |
|---|---|---|
| 页面卡住 | 是否在 Main 调 Thread.sleep/阻塞 SDK/runBlocking | 调度、取消合作和工作类型 |
| 一个失败全取消 | 父子 Job、必需/可选规则、异常位置 | coroutineScope 与 supervisorScope |
| 请求重复 | 收集次数、生命周期重启、共享 scope/策略 | 冷流、stateIn/shareIn 与缓存 |
| 状态没刷新 | equals、同对象修改、合并与消费者速度 | StateFlow 状态模型 |
| 事件丢失/重放 | 当时订阅数、replay、确认/持久规则 | SharedFlow/Channel 的边界 |
| 无法停止 | 取消异常是否吞掉、阻塞调用是否可中断 | ensureActive、SDK 取消契约与清理 |

本地单元测试可用 kotlinx-coroutines-test 的 runTest、测试 Dispatcher 和虚拟时间验证超时/去抖；热流用 take 或 backgroundScope 限定寿命，避免无限等待。Android 中需额外验证旋转、前后台、销毁/进程重建和 release。

面试先说一次“任务为什么结束、失败为什么隔离、页面为什么重发”的实测，再深入 Continuation、调度和 Flow 上下文。题目见 [分层面试题](/doc/Android/Kotlin高频面试题与代码练习)，原理见 [核心机制](/doc/Android/Kotlin核心机制与高频实战解析)。

官方参考：[协程指南](https://kotlinlang.org/docs/coroutines-guide.html)、[Flow 指南](https://kotlinlang.org/docs/flow.html)、[Android Flow](https://developer.android.com/kotlin/flow)、[生命周期协程](https://developer.android.com/topic/libraries/architecture/coroutines)。
