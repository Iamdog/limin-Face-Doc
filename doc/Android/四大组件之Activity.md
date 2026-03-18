# Activity



## 是什么？

Android 应用中负责展示界面并与用户进行交互的单一屏幕窗口



## 生命周期（Lifecycle）

**典型生命周期**：`onCreate` -> `onStart` -> `onResume` -> `onPause` -> `onStop` -> `onDestroy`。

**常见场景切换**：

- **A跳转B**：A.onPause -> B.onCreate -> B.onStart -> B.onResume -> A.onStop。

​	（注意：A 的 onPause 先执行，所以 A 里面不能做耗时操作，否则会延迟 B 的启动）

- **按下Back键**：onPause -> onStop -> onDestroy。
- **亮屏/灭屏**：只涉及 onPause -> onStop (灭屏) 和 onStart -> onResume (亮屏)。

**异常销毁与数据恢复**

系统会调用 `onSaveInstanceState()`，你可以将数据存入 Bundle。

 在 `onCreate(Bundle savedInstanceState)` 或 `onRestoreInstanceState()` 中取回数据



## 启动模式（LaunchMode）

决定了Activity在任务栈（Task）中的存在形式：

- **standard**：标准模式，每次启动都创建新实例。
- **singleTop**：栈顶复用。如果Activity已在栈顶，则复用并回调 `onNewIntent`。
- **singleTask**：栈内复用。如果栈内已存在，则将其上方的所有Activity出栈，使其置于栈顶。
- **singleInstance**：单实例模式。Activity独占一个新任务栈。



## 启动流程

- **Instrumentation**: 负责监控 Activity 与系统的交互。
- **AMS (ActivityManagerService)**: 系统运行的服务，负责管理所有 Activity 的生命周期。
- **Zygote**: 负责孵化应用进程。
- **ApplicationThread**: 它是 Binder 对象，用于 AMS 与应用进程跨进程通信（IPC）。



## 传值

`Intent+Bundle`

通过 `Intent` 对象的 `putExtra()` 方法，可以传递基本数据类型（int, String, boolean 等）以及实现了序列化接口的对象。 传递的对象必须实现 `Serializable` 或 `Parcelable` 接口；不建议传递大数据（如大图），容易导致 `TransactionTooLargeException`。



`静态变量/单例模式`

方便快捷，容易造成**内存泄漏**；在系统内存不足回收后，静态变量会被充值，导致空指针异常





`全局 Application 对象`

自定义一个继承自 `Application` 的类，在其中存储全局变量。



`持久化存储 (Database / SharedPreferences)`

通过将数据写入磁盘，由另一个 Activity 读取。如：

**SharedPreferences：** 适合简单的配置信息（Key-Value）。

**Room/SQLite：** 适合结构化的大型数据集。

**DataStore：** 官方推荐替代 SharedPreferences 的现代方案。

**MMKV：**基于 mmap 内存映射的 key-value 组件，底层序列化/反序列化使用 protobuf 实现，性能高，稳定性强，且支持多个平台。



`事件总线（EventBus/Flow）`

使用第三方库如 `EventBus` 或 Kotlin 的 `SharedFlow` 进行发布/订阅式通信。



`数据回传`

**返回数据给上一个 Activity：** 使用最新的 `ActivityResultLauncher` API（替代传统的 `startActivityForResult`）。

## 常见面试题

### Q1: Activity 的完整生命周期是什么？
A: 典型流程是 `onCreate` -> `onStart` -> `onResume` -> `onPause` -> `onStop` -> `onDestroy`。其中 `onCreate` 适合做初始化，`onResume` 表示页面可交互，`onPause` 要尽快返回，避免阻塞下一个页面启动。

### Q2: `onSaveInstanceState()` 和 `onPause()` 有什么区别？
A: `onPause()` 是生命周期回调，页面失去焦点就会执行；`onSaveInstanceState()` 是系统在可能回收页面前用于保存临时状态的回调，不保证每次都会执行。前者适合轻量收尾，后者适合保存 UI 状态。

### Q3: Activity 启动模式有哪些？实际该怎么选？
A: `standard` 每次新建，适合大多数页面；`singleTop` 适合通知点击、搜索页这类可能重复打开栈顶页面的场景；`singleTask` 常用于首页、主容器页；`singleInstance` 现在较少用，因为任务栈行为复杂，维护成本高。

### Q4: `singleTop` 和 `singleTask` 的区别是什么？
A: `singleTop` 只在目标 Activity 已经位于栈顶时复用，否则仍会新建实例；`singleTask` 只要任务栈中存在该 Activity，就会复用并清掉它上面的页面，然后回调 `onNewIntent()`。

### Q5: 横竖屏切换为什么会重建 Activity？
A: 因为配置发生了变化，系统默认会销毁并重建 Activity，以便重新加载资源目录下适配的新资源。面试里要补一句：不要滥用 `configChanges`，多数场景应让系统重建并配合状态恢复。

### Q6: Activity 之间传对象为什么更推荐 `Parcelable`？
A: 因为 `Parcelable` 是 Android 为 IPC 场景设计的高性能序列化方式，避免了 `Serializable` 的大量反射开销。缺点是实现更繁琐，但在页面跳转和 Binder 传输中更常用。

### Q7: 为什么不建议通过 Intent 传大对象？
A: 因为底层走 Binder 事务，数据过大可能触发 `TransactionTooLargeException`。大图、大列表这类数据更适合落磁盘、数据库，或者通过单例缓存加 ID 索引的方式传递。

### Q8: Activity 的启动流程大致是怎样的？
A: 调用 `startActivity()` 后，请求会通过 `Instrumentation` 和 Binder 进入 AMS；如果目标进程不存在，系统会先通过 Zygote 孵化进程；进程启动后由 `ApplicationThread` 回调到应用侧，最终在主线程完成 Activity 创建和生命周期分发。

### Q9: `finish()` 和按返回键的区别是什么？
A: 大多数情况下结果相同，都会结束当前 Activity。但返回键还会走返回栈分发逻辑，现代项目通常通过 `OnBackPressedDispatcher` 统一处理，避免直接重写旧的返回键逻辑导致行为不一致。

### Q10: 页面跳转结果回传为什么不推荐 `startActivityForResult()`？
A: 因为旧 API 与生命周期耦合重、回调分发不直观，在 Fragment 场景下更容易混乱。现在推荐 `registerForActivityResult()`，它具备更清晰的注册和结果处理机制，也更符合生命周期管理。
