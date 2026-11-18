---
title: Compose 单 Activity 导航路由 Navigation-Compose 实战
---

# Compose 单 Activity 导航路由 Navigation-Compose 实战

在现代 Android 架构演进中，**单 Activity 架构（Single-Activity Architecture）**已成为绝对主流。Google 官方推出了 `androidx.navigation:navigation-compose` 框架，使页面的跳转、传参、返回栈管理与深色链接（DeepLink）完全脱离 Fragment，直接在 Composable 函数级别实现声明式路由。

---

## 1. Navigation-Compose 核心架构图

```mermaid
flowchart TD
    NavHost["NavHost (路由容器与路径路由表)"]
    NavController["rememberNavController() (路由控制器，驱动路由跳转与返回栈)"]

    NavController -->|navigate("detail/1001")| NavHost
    NavHost --> R1["composable('home') -> HomeScreen()"]
    NavHost --> R2["composable('detail/{id}') -> DetailScreen()"]
    NavHost --> R3["composable('profile') -> ProfileScreen()"]
```

---

## 2. 生产级路由搭建实战

### 2.1 依赖引入与类型安全路由定义

```kotlin
// 密封类统一管理页面路由与参数规范
sealed class ScreenRoute(val route: String) {
    object Home : ScreenRoute("home")
    object UserDetail : ScreenRoute("user_detail/{userId}") {
        fun createRoute(userId: String) = "user_detail/$userId"
    }
}
```

### 2.2 NavHost 路由表配置与参数解析

```kotlin
@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = ScreenRoute.Home.route
    ) {
        // 1. 首页
        composable(ScreenRoute.Home.route) {
            HomeScreen(
                onNavigateToDetail = { userId ->
                    navController.navigate(ScreenRoute.UserDetail.createRoute(userId))
                }
            )
        }

        // 2. 详情页（携带参数与类型校验）
        composable(
            route = ScreenRoute.UserDetail.route,
            arguments = listOf(
                navArgument("userId") {
                    type = NavType.StringType
                    nullable = false
                }
            )
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: ""
            UserDetailScreen(
                userId = userId,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
```

---

## 3. 返回栈管理与防连击跳转

### 3.1 底部导航栏切换防重入优化
在切换底部导航 Tab 时，若直接调用 `navigate`，会反复在返回栈中压入大量相同的页面实例：

```kotlin
navController.navigate(ScreenRoute.Home.route) {
    // 弹出到导航图起始节点，避免栈无限制膨胀
    popUpTo(navController.graph.findStartDestination().id) {
        saveState = true // 保留页面状态
    }
    launchSingleTop = true // 栈顶单例，防止重复点击生成多个页面
    restoreState = true // 重新进入时恢复滚动状态
}
```

---

## 4. 面试核心考察点

1. **Navigation-Compose 的 ViewModel 生命周期范围是怎样的？**
   在 `composable(...)` 作用域内使用 `viewModel()`，返回的 ViewModel 实例是与当前路由 `NavBackStackEntry` 绑定的。当当前 Composable 页面从返回栈中弹出销毁时，该 ViewModel 的 `onCleared()` 自动触发，保证了内存及时回收。
2. **如何实现多模块间的路由解耦？**
   可通过扩展函数将每个模块的路由注册拆解为 `NavGraphBuilder.registerFeatureGraph()`，主工程仅负责装配子模块的路由扩展。
