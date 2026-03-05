# Service



## 是什么？

Service 是 Android 中一个重要的组件，主要用于在后台执行长时间运行的操作。它可以在没有用户界面的情况下运行，并且可以在应用程序被关闭后继续执行任务。Service 可以用于处理网络请求、播放音乐、执行定时任务等。



## 主要分类

Service 的分类主要有两种维度：**运行地点**（是否可见）和**使用方式**（启动/绑定）。



### 1. 按运行地点/能见度分类

| **类型**                   | **特点**                                                     | **场景举例**                   |
| -------------------------- | ------------------------------------------------------------ | ------------------------------ |
| **Foreground（前台服务）** | 必须在通知栏显示一个**不可移除**的通知。优先级最高，系统内存不足时最晚被回收。 | 音乐播放、导航、运动计步。     |
| **Background（后台服务）** | 用户无感知。在 Android 8.0 以后受到严格限制，应用处于后台时，系统随时可能杀死它。 | 数据同步（旧版）、日志上传。   |
| **Bound（绑定服务）**      | 允许其他组件（如 Activity）与其交互（IPC）。只有当有组件绑定时才运行。 | 与 Activity 进行复杂数据交互。 |





### 2. 按使用方式分类（生命周期差异）

- **Started Service (`startService`)**: 一旦启动，其生命周期与启动它的组件**无关**。必须手动调用 `stopSelf()` 或 `stopService()` 停止。
- **Bound Service (`bindService`)**: 提供客户端-服务器接口。生命周期与绑定的组件**绑定**。当所有客户端取消绑定时，Service 自动销毁。



## 核心生命周期方法



- `onCreate()`: 首次创建服务时调用。
- `onStartCommand(Intent, int, int)`: 每次调用 `startService()` 都会触发。
- **返回值含义**：
  - `START_STICKY`: 被杀后自动重启，但 Intent 为 null。
  - `START_NOT_STICKY`: 被杀后不重启。
  - `START_REDELIVER_INTENT`: 被杀后重启并重传 Intent。
- `onBind(Intent)`: `bindService()` 时调用，返回一个 `IBinder`。
- `onUnbind(Intent)`: 所有客户端断开连接时调用。
- `onDestroy()`: 服务销毁前清理资源。



## Service如何保活



*注意：在现代 Android 系统（12/13/14+）中，过度保活违反 Google Play 政策，且会被系统极力压制。*

1. **提高优先级**：使用前台服务（Foreground Service）。
2. **onStartCommand 返回值**：设置为 `START_STICKY`。
3. **系统广播拉起**：监听 `BOOT_COMPLETED`（开机广播）等，但限制越来越多。
4. **WorkManager**：虽然不是保活，但是它是目前官方推荐的、在系统约束下保证任务执行的最优方案。



## WorkManager



随着 Android 对后台限制（Background Execution Limits）越来越严，普通的 Service 在应用切到后台后很快会被杀死。**WorkManager** 是官方用来取代大多数后台 Service 的方案。



#### 为什么它是 Service 的终结者？

- **持久性**：即使 App 重启或手机开机，任务也能继续（存入 Room 数据库）。
- **约束条件**：可以指定“仅在充电时”、“仅在有 WiFi 时”执行。
- **兼容性**：根据系统版本自动切换 `JobScheduler`、`AlarmManager` 或 `Service`。



#### 最小代码实践

```java
// 1. 定义任务 (Worker)
public class MyWorker extends Worker {
    @NonNull
    @Override
    public Result doWork() {
        // 在这里执行耗时操作，它运行在子线程！
        return Result.success();
    }
}

// 2. 配置约束并加入队列
Constraints constraints = new Constraints.Builder()
    .setRequiresCharging(true) // 必须充电时
    .build();

OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(MyWorker.class)
    .setConstraints(constraints)
    .build();

WorkManager.getInstance(context).enqueue(request);
```







##  面试高频必问



### Q1: Service 和 Thread 有什么区别？

这是最经典的陷阱题。

- **本质不同**：Service 是 Android 的一个**组件**，是系统的运行机制；Thread 是 Java 的**最小执行单元**。
- **运行位置**：**Service 默认运行在主线程**（Main Thread）。如果在 Service 里做耗时操作，依然会 ANR！
- **关系**：Service 只是一个后台容器，为了不阻塞主线程，我们通常在 Service 内部开启子线程。

### Q2: 为什么有了 Service 还要有 IntentService？（或现在的 WorkManager）

- **IntentService**（已弃用，但面试常问）：它是 Service 的子类，内置了 `HandlerThread`。它会自动开启子线程处理任务，且在任务完成后**自动停止**。
- **现代方案**：Android 8.0+ 推荐使用 `WorkManager`（处理持久性任务）或 `JobIntentService`。

### Q3: Activity 怎么和 Service 交互？

1. **Binder 机制**：最常用。通过 `onBind` 返回 Binder 对象，Activity 在 `ServiceConnection` 中获取该对象直接调用方法。
2. **广播（Broadcast）**：Service 发送广播，Activity 注册接收器。
3. **Messenger/AIDL**：用于跨进程通信（IPC）。
4. **EventBus**

### Q4: 前台服务（Foreground Service）在 Android 14+ 的变化？

- **类型声明**：必须在 Manifest 中声明 `android:foregroundServiceType`（如 `location`, `mediaPlayback`）。
- **权限**：除了常规权限，还需申请对应的运行时权限。
- **5秒限制**：调用 `startForegroundService` 后，必须在 5 秒内调用 `startForeground()` 弹出通知，否则系统抛出异常。









