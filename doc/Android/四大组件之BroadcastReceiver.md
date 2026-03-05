# BroadcastReceiver



## 是什么？

**BroadcastReceiver（广播接收者）** ，主要用于应用与系统，应用与应用之间传递信息，像是一个**监听器**，采用的是典型的“观察者模式”。



##  生命周期



BroadcastReceiver 的生命周期非常短：

1. **激活状态**：当 `onReceive()` 方法被执行时。
2. **结束状态**：当 `onReceive()` 方法执行完毕。

> **注意：** `onReceive()` 运行在**主线程**。如果你在这里执行耗时操作，会导致 **ANR**（一般限制在 10 秒内）。如果需要长耗时操作，建议开启 `WorkManager` 或 `JobScheduler`。



## 注册方式



| **注册方式** | **配置位置**          | **生命周期**                                           | **优点**                         | **缺点**                                             |
| ------------ | --------------------- | ------------------------------------------------------ | -------------------------------- | ---------------------------------------------------- |
| **静态注册** | `AndroidManifest.xml` | **常驻型**。应用未启动也能接收广播。                   | 适合监听系统事件（如开机自启）。 | 耗电、占用资源。Android 8.0 后大部分隐式广播被禁用。 |
| **动态注册** | Java/Kotlin 代码中    | **跟随组件**。通常在 `onResume` 注册，`onPause` 注销。 | 灵活，省电，安全性高。           | 只有在组件存活时才能收到。                           |



## 类型



### 1. 普通广播 (Normal Broadcast)

- **特点**：完全异步。所有符合条件的接收者几乎会在同一时间收到。
- **发送**：`sendBroadcast()`。
- **效率**：高，但无法被拦截。

### 2. 有序广播 (Ordered Broadcast)

- **特点**：同步执行。按照 `priority`（优先级）由高到低依次传递。
- **发送**：`sendOrderedBroadcast()`。
- **特权**：高优先级的接收者可以修改广播内容，或者拦截广播（`abortBroadcast()`）。

### 3. 本地广播 (Local Broadcast)

- **特点**：仅在应用内部传播。
- **优势**：**更安全**（外部应用拿不到数据），**更高效**（不涉及 IPC）。
- **注意**：`LocalBroadcastManager` 已被官方标记为过时，建议使用 **Flow**代替。



### 4. 粘性广播 (Sticky Broadcast)

​	粘性广播会在发送后滞留在系统中。即使接收者是在广播发送后才注册的，也能收到最后一条广播信号。由于存在安全性和内存问题，已经在 API 21 中被**废弃**。



## Kotlin Flow替代本地广播或EventBus



### 为什么选择 SharedFlow？

在替代广播场景时，我们通常使用 `SharedFlow` 而非 `StateFlow`：

- **无默认值**：广播通常是事件（Event），不需要初始状态。
- **多订阅者**：支持多个 Fragment/Activity 同时监听。
- **事件丢失控制**：可以通过 `replay` 参数决定新订阅者是否能收到旧消息。





### 第一步：定义全局事件中心

Kotlin

```
object AppEventBus {
    // 定义一个私有的 MutableSharedFlow
    private val _events = MutableSharedFlow<AppEvent>()
    
    // 暴露只读的 Flow 给外部订阅
    val events = _events.asSharedFlow()

    // 发送事件的方法（相当于 sendBroadcast）
    suspend fun post(event: AppEvent) {
        _events.emit(event)
    }
}

// 定义事件类型（密封类，类型安全）
sealed class AppEvent {
    object Logout : AppEvent()
    data class UserProfileUpdated(val nickname: String) : AppEvent()
}
```

### 第二步：发送“广播”

在任何协程作用域中调用 `post` 即可。

Kotlin

```
lifecycleScope.launch {
    AppEventBus.post(AppEvent.UserProfileUpdated("吉米"))
}
```

### 第三步：接收“广播” (替代 onReceive)

利用 `repeatOnLifecycle` 自动处理生命周期，这比手动注销广播要安全得多。

Kotlin

```kotlin
class ProfileActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        lifecycleScope.launch {
            // 当 Activity 进入 Started 状态时开始监听，Stopped 时自动挂起
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                AppEventBus.events.collect { event ->
                    when (event) {
                        is AppEvent.UserProfileUpdated -> {
                            updateUI(event.nickname)
                        }
                        AppEvent.Logout -> finish()
                    }
                }
            }
        }
    }
}
```

