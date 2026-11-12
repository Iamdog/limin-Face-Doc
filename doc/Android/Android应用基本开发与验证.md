---
title: Android 应用基本开发与验证
---

# Android 应用基本开发与验证

## 解决什么问题

Android 应用需要完成页面、导航、请求、存储和系统能力调用，并在旋转、后台、进程重建与弱网下保持正确行为。先实现这些功能，再学习 Handler、Binder 和系统服务。

## 基本使用：完成第一条业务链路

1. 用 Android Studio 创建 Kotlin 项目，固定 JDK、AGP、Gradle 与 compileSdk 版本，确认模拟器和真机都能运行。
2. 做一个列表和详情页：加载态、空数据、错误、重试都要有。
3. 用 ViewModel 管理页面状态，Repository 隔离网络与本地数据；简单状态先用 StateFlow。
4. 用 Retrofit 声明接口、OkHttp 执行请求；Manifest 声明 INTERNET，不在 UI 线程执行阻塞网络调用。
5. 用 Room 保存结构化数据，DataStore 保存普通偏好；密钥和敏感凭证采用适合场景的安全存储。
6. 加入返回、旋转、后台恢复、请求超时和重复点击验证，再讨论缓存和性能。

## 基本代码：按生命周期观察状态

下面片段需要 AndroidX Activity、Lifecycle、ViewModel 和协程依赖。`uiState` 是 ViewModel 暴露的 StateFlow，`render` 是页面自己的渲染方法。

```kotlin
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { state -> render(state) }
    }
}
```

Fragment 应使用 `viewLifecycleOwner.lifecycleScope` 和视图生命周期收集，避免视图销毁后继续更新旧 binding。`repeatOnLifecycle` 会停止、重新启动收集；如果上游是发起网络请求的冷流，重新收集可能重新请求，应在 ViewModel 层明确共享和缓存策略。

## 必备能力与边界

| 能力 | 基本用法 | 场景追问 |
|---|---|---|
| Activity / Fragment | 注册入口、导航、参数 | 旋转和进程重建后数据从哪里恢复？ |
| Compose / XML | 先选项目既有 UI 体系 | 状态放哪里、列表如何复用、如何处理窗口 Insets？ |
| 生命周期 | onCreate 初始化、按生命周期订阅 | ViewModel 不保证跨进程死亡保存；SavedStateHandle 保存小型可恢复状态 |
| 权限 | 按需申请，处理拒绝与永久拒绝 | 权限和平台行为随 API/targetSdk 改变；存储访问优先系统选择器 |
| 后台任务 | 可延期持久任务用 WorkManager | WorkManager 不保证精确触发时间；前台服务需满足平台类型与启动限制 |
| 网络 | 超时、取消、错误分类 | POST 超时可能已经成功，不能盲目重试 |
| 依赖注入 | 构造注入，按项目选择 Hilt 等 | 可测试性、作用域和持有 Activity 的泄漏风险 |
| 构建 | Gradle task、variant、签名、R8 | debug 正常而 release 失败先检查混淆和环境配置 |

## 测试与验证先落地

本地单元测试验证纯业务、状态转换和错误处理；仪器测试验证 Android 环境中的数据库、组件和权限；UI 测试验证列表、导航和表单。先给 Repository 设计接口，注入假实现，使失败和超时能够稳定复现。

推荐运行项目中的 `./gradlew test`、`./gradlew lint`、需要设备时运行 `./gradlew connectedAndroidTest`，任务名称以项目 variant 为准。上线验证 release 包，而不是只装 debug 包。

## 再深入与面试顺序

| 先会使用 | 再解释场景 | 最后深入 |
|---|---|---|
| 页面请求与更新 UI | 离开页面后请求如何取消？ | [协程与 Flow](/doc/Android/协程与Flow实战)、[Handler](/doc/Android/Handler消息机制) |
| 配置变化与状态恢复 | 旋转、后台、进程死亡有什么区别？ | [Activity](/doc/Android/四大组件之Activity)、[ViewModel](/doc/Android/Jetpack之ViewModel与LiveData) |
| 持久后台工作 | 为什么不是起一个无限线程？ | [WorkManager 对比](/doc/Android/HandlerThread-IntentService-WorkManager对比) |
| 调用系统或跨进程服务 | 数据大小和进程死亡如何处理？ | [AIDL](/doc/Android/AIDL实战)、[Binder](/doc/Android/Binder机制) |
| 收集崩溃并还原堆栈 | release 特有异常怎么复现？ | [崩溃治理](/doc/Android/崩溃治理专题)、[R8](/doc/Android/Android代码混淆与R8高级实战全解) |

Android 版本适配还应逐项检查权限、后台执行、前台服务、通知、edge-to-edge、组件 exported 和 Native 库兼容性；以目标 API 和官方行为变更为准。
