---
title: Android AIDL实战
---

# Android AIDL实战

`AIDL` 是 Binder 相关题里的常见延伸，面试常问：什么是 AIDL、什么时候用、和普通 Service 有什么区别、如何处理多进程并发。

## 1. AIDL 是什么？

- AIDL 是 Android Interface Definition Language。
- 它是一种接口描述语言，用来声明跨进程可调用的方法。
- 本质上是 Binder 的开发辅助工具，不是新的通信机制。

## 2. 什么时候需要 AIDL？

常见场景：

- 应用和独立进程 Service 通信。
- 两个应用之间暴露受控能力。
- 音乐播放、下载、地图、设备控制等长期服务。

## 3. AIDL 和本地 Binder 的区别

- 本地 Binder 常用于同进程绑定服务，调用更简单。
- AIDL 面向跨进程，需要考虑序列化、线程安全、异常和权限。

## 4. AIDL 的基本开发流程

1. 定义 `.aidl` 接口文件。
2. 编译后生成 `Stub` 代码。
3. Service 端实现 `Stub`。
4. Client 端通过 `bindService()` 获取接口代理。
5. 调用远程方法。

## 5. 一个简单示例

### 定义接口

```java
interface IBookManager {
    void addBook(String name);
    List<String> getBooks();
}
```

### 服务端实现

```kotlin
class BookService : Service() {
    private val books = mutableListOf<String>()

    private val binder = object : IBookManager.Stub() {
        override fun addBook(name: String) {
            books.add(name)
        }

        override fun getBooks(): MutableList<String> {
            return books
        }
    }

    override fun onBind(intent: Intent): IBinder {
        return binder
    }
}
```

## 6. AIDL 开发要注意什么？

- 参数类型必须是 AIDL 支持的类型。
- 自定义对象需要实现 `Parcelable`。
- 远程调用可能失败，要处理 `RemoteException`。
- 服务端方法可能跑在 Binder 线程池，不一定是主线程。

## 7. 为什么 AIDL 要考虑线程安全？

- 因为多个客户端可能并发调用同一个服务。
- 服务端方法常常不在主线程执行。
- 如果共享集合、状态对象没有同步控制，就容易出并发问题。

## 8. AIDL 和 Messenger 的区别

- Messenger 基于 Handler，适合串行消息通信。
- AIDL 更灵活，支持直接定义接口方法，更适合复杂跨进程服务。

## 9. 面试高频问题

### Q1: AIDL 和 Binder 是什么关系？
A: Binder 是底层 IPC 机制，AIDL 是基于 Binder 的接口定义方式。

### Q2: 为什么普通对象不能直接跨进程传？
A: 因为跨进程需要序列化和反序列化，AIDL 只支持规定类型，自定义对象一般要实现 `Parcelable`。

### Q3: AIDL 方法运行在主线程吗？
A: 服务端通常不是。很多情况下运行在 Binder 线程池，所以要注意线程安全和耗时控制。

### Q4: 为什么远程调用会抛 `RemoteException`？
A: 因为跨进程通信存在进程死亡、连接中断、序列化失败等风险，和本地方法调用不是一个可靠性级别。

### Q5: AIDL 适合所有 Service 吗？
A: 不适合。只有真正需要跨进程和明确接口协作时才值得用，普通同进程业务没必要增加复杂度。

## 10. 小结

AIDL 面试重点不是背模板，而是知道它解决什么问题、底层依赖什么、开发中为什么要关注线程安全和异常处理。
