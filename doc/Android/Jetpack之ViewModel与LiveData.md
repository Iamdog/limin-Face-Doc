---
title: Android Jetpack之ViewModel与LiveData
---

# Android Jetpack之ViewModel与LiveData

`ViewModel` 和 `LiveData` 是 Android Jetpack 中最常见的一组组件，核心价值是把页面状态和生命周期解耦，避免 Activity/Fragment 过度臃肿。

## 1. ViewModel 是什么？

- `ViewModel` 用来存储和管理 UI 相关数据。
- 它的生命周期长于 Activity 的视图重建，横竖屏切换后通常不需要重新拉数据。
- 它不应该持有 `Activity`、`Fragment`、`View` 等短生命周期对象。

## 2. ViewModel 解决了什么问题？

- 页面重建时数据丢失。
- Activity/Fragment 既做 UI 又做业务，类过重。
- 异步任务和页面生命周期耦合，容易泄漏或重复请求。

## 3. LiveData 是什么？

- `LiveData` 是可观察的数据持有类。
- 它具备生命周期感知能力，只有在 `STARTED/RESUMED` 等活跃状态时才会回调观察者。
- 常用于 ViewModel 向界面层分发状态。

## 4. 为什么 ViewModel 常和 LiveData 配合使用？

- ViewModel 负责持有状态。
- LiveData 负责把状态安全地通知给 UI。
- 这种搭配能让 Activity/Fragment 更接近“订阅者”，而不是业务实现者。

## 5. 基本使用方式

```kotlin
class UserViewModel : ViewModel() {
    private val _userName = MutableLiveData<String>()
    val userName: LiveData<String> = _userName

    fun loadUser() {
        _userName.value = "Android"
    }
}
```

```kotlin
class MainActivity : AppCompatActivity() {
    private val viewModel by viewModels<UserViewModel>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        viewModel.userName.observe(this) { name ->
            // 更新 UI
        }
    }
}
```

## 6. `setValue()` 和 `postValue()` 的区别

- `setValue()` 必须在主线程调用，值会立即分发。
- `postValue()` 可在子线程调用，最终会切回主线程更新。
- 多次快速 `postValue()` 时，可能只看到最后一次结果，这是常见面试点。

## 7. ViewModel 为什么不会因横竖屏切换而丢失？

- 因为它被 `ViewModelStore` 管理。
- 配置变更时，旧 Activity 销毁，但 `ViewModelStore` 会在新 Activity 重建前保留下来。
- 真正进程被杀时，ViewModel 还是会丢，需要配合 `SavedStateHandle` 或持久化恢复。

## 8. ViewModel 和 `onSaveInstanceState()` 的区别

- ViewModel 适合保存运行期状态、网络数据、列表状态等。
- `onSaveInstanceState()` 更适合少量可序列化的瞬时 UI 状态。
- 两者并不是互斥关系，通常是互补。

## 9. LiveData 的优缺点

### 优点

- 生命周期安全。
- 使用简单，适合中小型状态分发。
- 与 ViewModel、Room 等 Jetpack 组件集成度高。

### 缺点

- 对复杂状态流表达能力一般。
- 粘性、事件消费、组合转换没有 Flow 灵活。
- 现代项目里很多团队逐步迁移到 `StateFlow`/`SharedFlow`。

## 10. 单次事件为什么不适合直接用 LiveData？

常见问题：

- 页面旋转后可能重复收到旧事件。
- 比如 Toast、导航、弹窗这类“一次性事件”容易重复消费。

常见做法：

- 使用事件包装类。
- 或直接改用 `SharedFlow`/Channel。

## 11. 常见面试题

### Q1: ViewModel 可以持有 Context 吗？
A: 普通 ViewModel 不建议持有 Activity/Fragment Context，否则容易泄漏。若确实需要应用级 Context，可使用 `AndroidViewModel` 持有 `Application`。

### Q2: 为什么说 ViewModel 不适合做真正的数据层？
A: 因为它本质仍是表现层状态持有者，负责连接 UI 和仓库层。网络、数据库、缓存逻辑更适合放在 Repository/UseCase 层。

### Q3: LiveData 为什么是生命周期安全的？
A: 因为它内部会感知 `LifecycleOwner` 状态，只在活跃状态下派发数据，避免页面销毁后继续回调 UI。

### Q4: `observeForever()` 为什么要慎用？
A: 因为它不受生命周期管理，必须手动移除观察者，否则容易造成泄漏或无意义回调。

### Q5: 现在都用 Flow 了，为什么面试还问 LiveData？
A: 因为大量存量项目和 Jetpack 基础题仍然围绕 LiveData 展开，而且它能帮助面试官判断你是否理解生命周期感知和状态分发的基本模型。

## 12. 小结

ViewModel 的关键词是“跨配置变更保存状态”，LiveData 的关键词是“生命周期感知观察”。面试里把这两个职责边界说清楚，基本就够了。
