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

