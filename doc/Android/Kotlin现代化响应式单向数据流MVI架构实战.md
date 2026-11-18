---
title: Kotlin 现代化响应式单向数据流 MVI 架构实战
---

# Kotlin 现代化响应式单向数据流 MVI 架构实战

从 MVC、MVP 到 MVVM，移动端架构持续演进。然而随着业务复杂度激增，传统的 MVVM 常常演化为拥有数十个分散 `LiveData` / `StateFlow` 的臃肿架构，极易出现状态与视图不一致的难以复现的 Bug。

**MVI（Model-View-Intent）** 依托 Kotlin 的密封接口（`sealed interface`）、不可变数据类（`data class`）以及协程 `StateFlow`，构建了严密的**单向数据流（Unidirectional Data Flow，UDF）**闭环，已成为现代 Android 与跨端工程的标配架构。

---

## 1. MVI 核心三要素与闭环运转模型

```mermaid
flowchart TD
    User["用户交互 (点击、输入、下拉刷新)"] -->|发出单一意图| Intent["Intent (用户意图 / 行为事件)"]
    Intent -->|被接收分发| Reducer["ViewModel / Reducer (业务处理与状态生成)"]
    Reducer -->|状态复制生成新 State| State["ViewState (单一且唯一不可变状态源)"]
    State -->|驱动重绘与渲染| View["UI / Composable (无状态纯展示层)"]
    View -.->|触发新交互| User
    Reducer -.->|非粘性一次性事件 (如 Toast / 路由)| Effect["Single Effect (单播通道)"]
    Effect -.-> View
```

### 核心要素定义
- **ViewState（界面状态）**：包含当前界面展示所需的一切数据字段，必须是不可变的数据类；
- **ViewIntent（用户意图）**：密封接口统一枚举当前页面支持的用户操作；
- **ViewEffect（副作用事件）**：弹出 Toast、对话框或跳转路由等“一次性、不可重放”的副作用。

---

## 2. 生产级 MVI 架构标准实现范例

### 2.1 契约类定义
```kotlin
// 1. 界面唯一状态
data class UserListViewState(
    val isLoading: Boolean = false,
    val users: List<UserVo> = emptyList(),
    val errorMessage: String? = null
)

// 2. 用户交互意图
sealed interface UserListIntent {
    object Refresh : UserListIntent
    data class Search(val query: String) : UserListIntent
    data class DeleteUser(val userId: String) : UserListIntent
}

// 3. 一次性副作用
sealed interface UserListEffect {
    data class ShowToast(val message: String) : UserListEffect
    data class NavigateToDetail(val userId: String) : UserListEffect
}
```

### 2.2 核心 ViewModel 与状态归约器（Reducer）
```kotlin
class UserListViewModel(
    private val userRepository: UserRepository = UserRepository()
) : ViewModel() {

    // 内部可变状态
    private val _viewState = MutableStateFlow(UserListViewState())
    // 外部只读暴露
    val viewState: StateFlow<UserListViewState> = _viewState.asStateFlow()

    // 一次性事件管道 (防重入与旋转重建重复弹出)
    private val _effectChannel = Channel<UserListEffect>(Channel.BUFFERED)
    val effectFlow = _effectChannel.receiveAsFlow()

    // 统一意图分发入口
    fun sendIntent(intent: UserListIntent) {
        viewModelScope.launch {
            when (intent) {
                is UserListIntent.Refresh -> handleRefresh()
                is UserListIntent.Search -> handleSearch(intent.query)
                is UserListIntent.DeleteUser -> handleDelete(intent.userId)
            }
        }
    }

    private suspend fun handleRefresh() {
        _viewState.update { it.copy(isLoading = true, errorMessage = null) }
        try {
            val list = userRepository.getUsers()
            _viewState.update { it.copy(isLoading = false, users = list) }
        } catch (e: Exception) {
            _viewState.update { it.copy(isLoading = false, errorMessage = e.message) }
            _effectChannel.send(UserListEffect.ShowToast("网络加载失败，请检查网络！"))
        }
    }
}
```

### 2.3 UI / Compose 层简洁接入
```kotlin
@Composable
fun UserListScreen(viewModel: UserListViewModel = viewModel()) {
    val state by viewModel.viewState.collectAsState()
    val context = LocalContext.current

    // 收集一次性副作用
    LaunchedEffect(Unit) {
        viewModel.effectFlow.collect { effect ->
            when (effect) {
                is UserListEffect.ShowToast -> Toast.makeText(context, effect.message, Toast.LENGTH_SHORT).show()
                is UserListEffect.NavigateToDetail -> { /* 路由跳转 */ }
            }
        }
    }

    if (state.isLoading) {
        CircularProgressIndicator()
    } else {
        LazyColumn {
            items(state.users, key = { it.id }) { user ->
                UserCard(user = user, onDelete = {
                    viewModel.sendIntent(UserListIntent.DeleteUser(user.id))
                })
            }
        }
    }
}
```

---

## 3. MVI 对比传统 MVVM 的核心压制点

1. **彻底消除状态撕裂（State Inconsistency）**：所有属性集中在单个不可变的 `ViewState` 内，通过 `copy()` 进行原子状态替换，杜绝了“列表已更新但加载中菊花仍在转”的竞态 Bug；
2. **极佳的可测试性与日志回放（Time Travel Debugging）**：由于用户每一步交互都有明确的 `Intent`，且每个状态都是纯数据切片，可在测试中轻松模拟用户操作序列并进行确定性断言。
