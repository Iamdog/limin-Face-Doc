---
title: Android JNI与NDK
---

# Android JNI与NDK

`JNI` 和 `NDK` 是 Android 进阶和音视频、图形、性能方向的高频知识点。面试中常问：为什么要用 JNI、Java 如何调用 C++、有哪些风险、什么时候不该用。

## 1. JNI 是什么？

- JNI 全称 Java Native Interface。
- 它是一套让 Java/Kotlin 代码和 C/C++ 代码互相调用的规范。
- 本质是 Java 世界和 Native 世界之间的桥接层。

## 2. NDK 是什么？

- NDK 是 Native Development Kit。
- 它提供了在 Android 上开发、编译、打包 Native 代码所需的工具链。
- 可以理解为“开发 JNI/so 的工具集合”。

## 3. 为什么要使用 JNI / NDK？

常见原因：

- 复用已有 C/C++ 库。
- 音视频编解码、图像处理、游戏引擎等高性能场景。
- 某些系统底层能力需要 Native 支持。
- 提升部分核心算法性能。

## 4. JNI 调用的基本流程

1. Java/Kotlin 声明 `native` 方法。
2. 通过 `System.loadLibrary()` 加载 so。
3. Native 层实现对应方法。
4. 运行时通过 JNI 完成参数转换和调用。

Kotlin 示例：

```kotlin
class NativeBridge {
    external fun stringFromJNI(): String

    companion object {
        init {
            System.loadLibrary("native-lib")
        }
    }
}
```

## 5. 动态注册和静态注册

### 静态注册

- 按固定命名规则实现 JNI 方法。
- 简单直观，但函数名长、维护成本高。

### 动态注册

- 在 `JNI_OnLoad` 中手动注册方法映射。
- 工程里更灵活，也更常见。

## 6. Java 对象和 Native 对象如何交互？

- 基本类型会做直接映射。
- String、数组、对象需要经过 JNI API 转换。
- Local Reference、Global Reference 的生命周期管理是高频坑点。

## 7. JNI 常见问题

### 内存泄漏

- Native 内存不受 Java GC 直接管理。
- 忘记释放引用、缓冲区、指针很容易泄漏。

### 崩溃难排查

- Native 层越界、空指针、野指针会直接导致崩溃。
- 排查难度通常高于 Java 层。

### 线程问题

- Native 线程需要正确 attach 到 JVM 才能安全调用 Java。
- 线程切换和引用管理不当会出错。

## 8. so 文件和 ABI

- 不同 CPU 架构需要不同 ABI 的 so。
- 常见有 `armeabi-v7a`、`arm64-v8a`。
- 打包时要考虑 ABI 兼容和体积控制。

## 9. 面试高频问题

### Q1: JNI 和 NDK 的区别是什么？
A: JNI 是一套调用规范，NDK 是开发工具链。前者回答“怎么调用”，后者回答“怎么开发和编译”。

### Q2: 为什么不是所有性能问题都用 NDK？
A: 因为 Native 开发复杂度更高，调试成本更大，收益未必总是明显。只有在性能瓶颈明确、Java 难以满足时才值得引入。

### Q3: `System.loadLibrary()` 做了什么？
A: 它会把对应的 so 加载进进程，并让运行时建立 Java 与 Native 方法的链接关系。

### Q4: 为什么 JNI 容易出内存问题？
A: 因为 Native 内存不归 Java GC 直接托管，引用和资源释放都需要开发者自己保证。

### Q5: Java 调 Native 快，还是 Native 调 Java 快？
A: 跨语言边界本身就有成本。JNI 并不是“天然更快”，只有真正重计算或底层能力场景，整体收益才可能明显。

## 10. 小结

JNI 的重点是“桥接”，NDK 的重点是“工具链”。面试里最好同时说明收益和代价，不要把 NDK 简单神化成“性能万能药”。
