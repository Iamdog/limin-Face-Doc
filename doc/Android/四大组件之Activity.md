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
