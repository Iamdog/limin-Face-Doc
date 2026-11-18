# 四大组件底层机制Service跨进程保活与广播风暴治理

Android 四大组件（Activity、Service、BroadcastReceiver、ContentProvider）构建了整个系统的运行骨架。随着 Android 系统的演进，Google 对系统后台管控、功耗治理与权限防线的收紧愈发严格。过去靠“流氓手段”保活、无序隐式广播监听的粗放式开发早已被淘汰。深入理解 **Service 绑定状态机、广播底层分发、Linux LMK 的 oom_adj 评估体系，以及合规的现代保活与跨进程数据共享**，是大型应用架构设计的基石。

---

## 核心底层机制与全景架构

### 1. Service 启动与绑定的底层架构流转

在 Framework 内部，所有的 Service 均由 `system_server` 中的 **`ActiveServices`** 统一调度：

```mermaid
flowchart TD
    subgraph startService 链路 (独立运行模式)
        S1[startService] --> S2[ActiveServices 检索或创建 ServiceRecord]
        S2 --> S3[若宿主进程未启动, 先通知 Zygote fork 进程]
        S3 --> S4[ActivityThread.handleCreateService -> onCreate]
        S4 --> S5[ActivityThread.handleServiceArgs -> onStartCommand]
        S5 --> S6[可在后台长期独立运行, 直到调用 stopService]
    end

    subgraph bindService 链路 (依附绑定模式)
        B1[bindService] --> B2[ActiveServices 创建 ConnectionRecord]
        B2 --> B3[ActivityThread.handleBindService -> onBind 返回 IBinder]
        B3 --> B4[通过 IServiceConnection 跨进程回传给客户端 onServiceConnected]
        B4 --> B5[生命周期与客户端 Context 强绑定, 所有绑定者解绑后自动销毁]
    end
```

#### 关键源码细节：
- 无论通过 `startService` 还是 `bindService` 调用多少次，**`onCreate()` 在生命周期内仅且仅执行一次**！
- 多次调用 `startService()` 会高频触发 `onStartCommand()`，其返回值（`START_STICKY`、`START_NOT_STICKY`、`START_REDELIVER_INTENT`）直接决定了当 Service 因内存不足被系统杀死后，系统是否应该尝试自动拉起该服务并重传 Intent。

---

## 源码级架构物理拆解

### 1. Linux LMK（Low Memory Killer）与 oom_adj 评分机制

当 Android 手机物理 RAM 不足时，内核的 **LMK（Low Memory Killer）驱动** 会根据进程当前的 **`oom_score_adj` 评分（数值范围 -1000 到 1000）**，按照优先级从大到小依次物理杀死进程回收内存：

```mermaid
flowchart TD
    subgraph oom_adj 物理评分梯度 (数值越小越安全, 越不容易被杀)
        L1["-1000: NATIVE / SYSTEM (内核核心, system_server) 绝不杀!"]
        L2["0: FOREGROUND_APP (前台直接交互中 App) 极高优先级"]
        L3["100: VISIBLE_APP (前台可见但不可触控, 如弹窗覆盖)"]
        L4["200: PERCEPTIBLE_APP (可感知进程: 正在播放音乐的前台服务)"]
        L5["500: SERVICE_APP (普通后台 Service 服务进程)"]
        L6["700: PREVIOUS_APP (上一个刚切走的 App)"]
        L7["900: CACHED_APP (普通后台缓存进程) 缺内存时首先被杀!"]
    end
```

#### 为什么传统“流氓保活手段”在 Android 8.0+ 彻底暴毙？
1. **像素保活（一像素 Activity）**：利用监听锁屏广播启动一像素悬浮 Activity，强行将 `oom_adj` 从 900 提升到 0。Android 8.0+ 严格限制后台启动 Activity，锁屏后系统进入深度休眠（Doze Mode），此招彻底失效；
2. **前台服务“通知栏漏洞”**：在 Android 7.0 之前，启动两个相同 Notification ID 的 Service 并相互 `stopSelf`，可实现“无可见通知栏图标的前台服务”。从 Android 8.0 开始，系统强制前台服务必须挂载可见通知（Notification），且在代码调用 `startForegroundService` 后必须在 **5 秒内调用 `startForeground()`**，否则直接引发系统 ANR 级崩溃（`Context.startForegroundService() did not then call Service.startForeground()`）！

---

### 2. 广播风暴（Broadcast Storm）与无序/有序广播底层

广播机制包含两种注册形式：
- **动态注册（Dynamic）**：通过 `context.registerReceiver()`，在进程内存中生成 `LoadedApk.ReceiverDispatcher`，由 AMS 内部维护在 `mRegisteredReceivers` 列表中。生命周期与宿主组件同步；
- **静态注册（Static）**：在 `AndroidManifest.xml` 中声明，由 PMS 在开机扫描时直接持久化进清单中。

#### 为什么 Android 8.0 强行禁用了绝大部分隐式广播？
- 在早期 Android 中，一个事件（如网络切换 `CONNECTIVITY_ACTION`、电量变化、开机广播）发出后，系统会并发拉起数千个在后台注册了该广播的静态 App 进程，导致 **瞬间大量应用进程疯狂并发 fork，CPU 占用拉满、内存见底，形成严重的“广播风暴（Broadcast Storm）”**。
- **现代化改造**：
  - 应用内事件分发：彻底弃用系统广播，改用 **`LocalBroadcastManager`**（纯应用内 Handler 分发，无跨进程开销与数据泄露风险）或 **Kotlin SharedFlow**；
  - 系统级事件监听：改用官方 **WorkManager** 或 **JobScheduler**，由操作系统按批次统一调度唤醒。

---

## 社招高频硬核连环追问

### Q1: `CursorWindow` 跨进程传输数据时，为什么有时会报 `CursorWindowAllocationException`？
- **考点**：ContentProvider 底层 Binder 限制。
- **解析**：
  - 当通过 ContentProvider 执行大表查询时，底层使用的是 `CursorWindow`；
  - `CursorWindow` 依赖一块由 Ashmem（匿名共享内存）分配的共享缓冲区，**其默认硬编码上限通常为 2MB（在早期版本甚至仅为 1MB）**；
  - 如果一次 SQL 查询返回了成千上万行数据，或者某行包含超大的 BLOB 二进制数据导致单行超过 2MB，在向 CursorWindow 填充数据时就会直接抛出 `CursorWindowAllocationException` 或发生截断；
  - **规避方案**：分页加载（`LIMIT` / `OFFSET`），大图片大文件严禁存入数据库，数据库只记录文件本地路径。

### Q2: 现代 Android 大型商业 App 唯一合法的“后台保活”方案是什么？
- **考点**：合规后台常驻策略与生态对齐。
- **解析**：
  1. **前台服务（Foreground Service）+ 常驻通知栏**：音乐播放、路线导航、电话会议等强业务属性场景，用户明确感知，`oom_adj` 处于 200，系统极难被杀；
  2. **厂商系统级推送通道（Push Channel）**：彻底放弃自建常驻后台 TCP 长连接（耗电会被系统电池白名单严格查杀），深度集成华为、小米、OPPO、vivo、荣耀与 Google FCM 厂商系统级通道，由手机厂商统一维护单长连接，有消息时由系统底层拉起应用；
  3. **WorkManager**：对于日志上报、离线数据同步等非即时任务，交给系统在连接充电器和 Wi-Fi 时空闲执行。

---

## 生产级避坑指南与排障 SOP

### 1. `Context.startForegroundService()` 崩溃排查 SOP

**事故场景**：后台拉起 Service，用户反馈偶发崩溃抛出 `android.app.RemoteServiceException: Context.startForegroundService() did not then call Service.startForeground()`。

#### 生产标准防范模板：
必须确保在 `Service#onCreate()` 的**第一行代码**立即调用 `startForeground`，绝对不能被任何耗时计算或网络延迟阻塞：
```java
public class SafeForegroundService extends Service {
    private static final int NOTIF_ID = 1001;

    @Override
    public void onCreate() {
        super.onCreate();
        // 关键第一步: 立即开启前台通知，满足系统 5 秒契约
        Notification notification = createNotification();
        startForeground(NOTIF_ID, notification);
        
        // 后续再异步执行耗时初始化...
    }
}
```
