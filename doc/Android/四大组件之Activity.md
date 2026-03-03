# Activity



## 是什么？

Android 应用中负责展示界面并与用户进行交互的单一屏幕窗口



## 生命周期（Lifecycle）

**典型生命周期**：`onCreate` -> `onStart` -> `onResume` -> `onPause` -> `onStop` -> `onDestroy`。

**常见场景切换**：

- **A跳转B**：A.onPause -> B.onCreate -> B.onStart -> B.onResume -> A.onStop。
- **按下Back键**：onPause -> onStop -> onDestroy。
- **亮屏/灭屏**：只涉及 onPause -> onStop (灭屏) 和 onStart -> onResume (亮屏)。



## 启动模式（LaunchMode）

决定了Activity在任务栈（Task）中的存在形式：

- **standard**：标准模式，每次启动都创建新实例。
- **singleTop**：栈顶复用。如果Activity已在栈顶，则复用并回调 `onNewIntent`。
- **singleTask**：栈内复用。如果栈内已存在，则将其上方的所有Activity出栈，使其置于栈顶。
- **singleInstance**：单实例模式。Activity独占一个新任务栈。



