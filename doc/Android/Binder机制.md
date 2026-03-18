---
title: Android Binder机制
---

# Android Binder机制

`Binder` 是 Android 最核心的 IPC 机制之一。四大组件通信、系统服务调用、AIDL、AMS/WMS/PMS 交互，底层大量依赖 Binder。

## 1. 什么是 Binder？

- 从 Linux 驱动层看，它是一套内核级 IPC 机制。
- 从 Android Framework 看，它是一套远程对象调用模型。
- 从开发者视角看，它让“跨进程调用”看起来像“本地方法调用”。

## 2. 为什么 Android 选择 Binder？

相比传统管道、Socket、消息队列，Binder 的优势主要有：

- 性能较好，适合频繁短消息通信。
- 支持引用计数和对象管理。
- 天然支持服务端身份校验和权限控制。
- Android Framework 全面围绕它构建，生态一致。

## 3. Binder 通信中的几个角色

### Client

- 发起远程调用的一方。

### Server

- 提供远程服务的一方。

### ServiceManager

- Binder 服务注册与查询中心。
- 类似“通讯录”，Client 可以先查到目标服务再发起调用。

### Binder Driver

- 位于内核空间，负责进程间数据转发。

## 4. Binder 调用流程

1. Server 进程启动后向 `ServiceManager` 注册服务。
2. Client 通过服务名从 `ServiceManager` 获取 Binder 引用。
3. Client 发起调用，请求经由 Binder 驱动切换到 Server 进程。
4. Server 在线程池中处理请求并返回结果。
5. Client 收到返回值，表现上像调用了本地方法。

## 5. 为什么说 Binder 是“半同步半异步”？

- 大部分普通 Binder 调用对调用方来说是同步的，要等结果返回。
- 但底层驱动转发和线程池调度又具备异步特征。
- 面试中知道这个表述即可，不必展开内核实现。

## 6. AIDL 和 Binder 的关系

- AIDL 是 Android 提供的接口描述语言。
- 它本身不是 IPC 机制，而是帮助开发者生成 Binder 通信模板代码。
- 你写 `aidl` 接口，编译后会生成 `Stub` 和 `Proxy`，底层仍然是 Binder 在工作。

## 7. `Stub` 和 `Proxy` 是什么？

- `Stub` 位于服务端，负责接收远程请求并分发到真实实现。
- `Proxy` 位于客户端，负责把本地调用封装成远程事务发送出去。
- 这两者共同实现了“像本地调用一样使用远程服务”的体验。

## 8. 为什么不能通过 Intent 传特别大的数据？

- 因为很多跨进程调用底层最终走 Binder。
- Binder 单次事务缓冲区有限，数据过大容易触发 `TransactionTooLargeException`。
- 所以图片、大对象、大列表更适合文件共享、数据库、ContentProvider 或只传 ID。

## 9. Binder 线程池是什么？

- 服务端并不是只靠主线程处理 Binder 请求。
- Binder 默认有自己的线程池来并发处理远程调用。
- 这也是为什么服务端代码要考虑线程安全，而不能默认认为回调都在主线程。

## 10. 常见面试题

### Q1: Binder 和 Socket 的区别是什么？
A: Socket 更通用，适合跨设备网络通信；Binder 更适合 Android 本地跨进程调用，性能、对象模型、权限控制都更贴近系统服务场景。

### Q2: 为什么说 Binder 性能比传统拷贝方式更好？
A: 典型回答是 Binder 在 Android 场景下减少了不必要的数据拷贝和协议封装开销，适合高频小数据 IPC。面试里讲到“性能更适合系统服务调用”就够了。

### Q3: `IBinder` 是什么？
A: 它是 Binder 通信体系中的核心接口，无论本地 Binder 还是远程 Binder，最终都会抽象成 `IBinder` 暴露给调用方。

### Q4: `onBind()` 返回的到底是什么？
A: 返回的是一个 `IBinder` 对象，客户端通过它拿到服务端暴露的能力，之后就能进行进程内或跨进程调用。

### Q5: 为什么系统服务调用看起来像普通 API？
A: 因为 Framework 层把 Binder 通信细节封装掉了。比如调用 `ActivityManager`、`PackageManager` 时，背后通常已经通过代理类完成了远程调用。

## 11. 小结

Binder 的面试重点不是驱动源码，而是明确三件事：它是 Android 的核心 IPC、AIDL 是 Binder 的语法糖、系统服务调用本质上大量依赖 Binder。
