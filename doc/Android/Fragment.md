# Android Fragment

## 概述
Fragment 是 Android 中表示用户界面的一部分，可以在 Activity 中组合多个 Fragment 来构建多窗格 UI，并在 Activity 运行时对其进行管理。

## 知识点

### 1. Fragment 的生命周期
- `onAttach()` - Fragment 与 Activity 建立关联
- `onCreate()` - Fragment 被创建
- `onCreateView()` - 创建 Fragment 的视图
- `onActivityCreated()` - Activity 创建完成
- `onStart()` - Fragment 启动
- `onResume()` - Fragment 恢复到前台
- `onPause()` - Fragment 暂停
- `onStop()` - Fragment 停止
- `onDestroyView()` - 销毁视图
- `onDestroy()` - Fragment 销毁
- `onDetach()` - Fragment 与 Activity 解除关联

### 2. Fragment 创建和使用
- 继承 `Fragment` 或 `DialogFragment`
- 实现 `onCreateView()` 返回视图
- 通过 `FragmentManager` 进行事务管理
- 使用 `FragmentTransaction` 进行 add、replace、remove 操作

### 3. Fragment 通信
- 通过接口回调与 Activity 通信
- 使用 `ViewModel` 和 `LiveData` 共享数据
- 使用 `Bundle` 传递参数
- Fragment 之间通过 shared ViewModel 通信

### 4. Fragment 栈管理
- `addToBackStack()` 将事务加入返回栈
- Fragment 支持返回栈操作
- 可控制返回键行为

## 常见面试题

### Q1: Fragment 与 Activity 的区别是什么？
A: Fragment 是 Activity 的一部分，是轻量级的 UI 组件。Activity 是应用的组成单位，Fragment 依赖于 Activity 存在。Fragment 有自己的生命周期，可以被重用。

### Q2: Fragment 如何与 Activity 通信？
A: 可以通过接口回调、ViewModel、LiveData、EventBus 等方式进行通信。推荐使用 ViewModel + LiveData。

### Q3: add() 和 replace() 的区别是什么？
A: `add()` 将 Fragment 添加到容器，原有的 Fragment 保留；`replace()` 替换容器中的 Fragment，原有的会被销毁。

### Q4: Fragment 的懒加载如何实现？
A: 在 `onCreateView()` 中检查数据是否已加载，或在 `setUserVisibleHint()` 中判断 Fragment 是否可见，然后加载数据。

### Q5: 如何保存 Fragment 的状态？
A: 通过 `onSaveInstanceState()` 保存状态到 Bundle，在 `onCreate()` 中恢复。Fragment 会自动保存视图状态。

### Q6: Fragment 重叠问题如何解决？
A: 使用 `showHide()` 代替 `add()/replace()`；检查 `findFragmentByTag()` 判断 Fragment 是否已存在；使用 `FragmentManager.saveBackStack()` 管理栈。

### Q7: Fragment 是否可以不依赖 Activity？
A: 实际上不能。Fragment 必须运行在 Activity 中，但可以在 Fragment 中进行更多业务逻辑处理。

### Q8: 如何处理 Fragment 中的返回键？
A: 在 Fragment 中监听返回键，通过 `requireActivity().onBackPressed()` 或 `ViewCompat.setOnApplyWindowInsetsListener()` 处理。