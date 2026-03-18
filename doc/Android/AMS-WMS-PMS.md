---
title: Android AMS-WMS-PMS
---

# Android AMS-WMS-PMS

AMS、WMS、PMS 是 Android Framework 面试里最常见的三大系统服务。即使不深入源码，也要知道它们各自管什么、和四大组件或 UI 系统怎么关联。

## 1. AMS 是什么？

AMS 全称 `ActivityManagerService`。

主要职责：

- 管理 Activity 生命周期。
- 管理应用进程和任务栈。
- 协调 Service、Broadcast 等组件启动。
- 参与 ANR、前后台切换、进程优先级管理。

## 2. WMS 是什么？

WMS 全称 `WindowManagerService`。

主要职责：

- 管理系统中的窗口。
- 控制窗口层级、大小、显示和动画。
- 协调输入法、状态栏、浮窗等窗口行为。

## 3. PMS 是什么？

PMS 全称 `PackageManagerService`。

主要职责：

- 负责应用安装、卸载、更新。
- 解析 APK 和 Manifest。
- 管理包信息、权限、组件声明。

## 4. 它们分别和什么场景最相关？

### AMS

- 打开页面
- 进程创建
- 任务栈管理
- Service/Broadcast 调度

### WMS

- Activity 界面显示
- Dialog / PopupWindow / Toast
- 窗口层级和焦点
- 转场动画与布局变化

### PMS

- 安装包解析
- 包名、签名、权限
- 查询应用信息
- 组件可见性

## 5. 点击桌面图标启动应用时，谁在参与？

简化理解：

1. Launcher 发起启动请求。
2. AMS 负责启动 Activity、必要时拉起进程。
3. 进程起来后，页面通过 Window 体系接入 WMS。
4. 如果涉及包信息、组件解析，则会查 PMS 中的安装和配置数据。

## 6. 为什么说 WMS 和 Window 体系关系最密切？

- 因为 Activity、Dialog、Toast 等最终都要变成系统可管理的窗口。
- WMS 负责这些窗口在系统中的组织和显示规则。
- 面试中如果能把 WMS、Window、DecorView 串起来，回答会更完整。

## 7. PMS 在面试中常见问法

- 安装流程谁负责？
- 包名和签名信息从哪来？
- `PackageManager` 调用背后是谁？

标准思路：

- `PackageManager` 是应用侧 API。
- 真正做包管理工作的核心服务是 PMS。

## 8. AMS 在面试中常见问法

- Activity 启动流程谁调度？
- 应用进程谁管理？
- 任务栈和前后台切换谁负责？

答案核心：

- 都离不开 AMS。

## 9. 常见面试题

### Q1: `ActivityManager` 和 AMS 是什么关系？
A: `ActivityManager` 是应用层可调用的管理类或接口封装，AMS 是系统服务本体，前者很多能力最终都通过 Binder 调到后者。

### Q2: `WindowManager` 和 WMS 是什么关系？
A: `WindowManager` 是应用层管理窗口的入口，WMS 是系统服务端实现。应用侧添加窗口，最终要交给 WMS 管理。

### Q3: `PackageManager` 和 PMS 是什么关系？
A: 和上面类似，`PackageManager` 是客户端 API，PMS 是服务端真正执行安装、解析、权限管理的核心服务。

### Q4: 启动一个 Activity 一定会经过 AMS 吗？
A: 是的。无论是普通跳转还是桌面启动，生命周期调度和任务栈管理都绕不开 AMS。

### Q5: 为什么系统服务题里经常会提 Binder？
A: 因为应用进程调用 AMS/WMS/PMS 这类系统服务时，本质上通常都是跨进程 Binder 通信。

## 10. 小结

AMS 管组件和进程，WMS 管窗口和显示，PMS 管安装包和权限。把这三者的职责边界讲清楚，再和 Binder、Window、四大组件串起来，系统服务基础题就够用了。
