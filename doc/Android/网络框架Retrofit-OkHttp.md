---
title: Android 网络框架Retrofit-OkHttp
---

# Android 网络框架 Retrofit / OkHttp

## 使用入口：先解决问题，再做验证

声明业务接口并统一超时、取消和错误。

**先做基本操作**：先创建单例 OkHttpClient 和 Retrofit 接口完成一次请求，检查非 2xx、解析错误和页面取消。初次学习可先完成[本模块基础实践](/doc/Android/Android应用基本开发与验证)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

### 基本代码：声明与创建接口

```kotlin
interface ProductApi {
    @GET("products/{id}")
    suspend fun getProduct(@Path("id") id: Long): ProductDto
}
val client = OkHttpClient.Builder()
    .connectTimeout(10, TimeUnit.SECONDS)
    .callTimeout(20, TimeUnit.SECONDS)
    .build()
val api = Retrofit.Builder()
    .baseUrl("https://api.example.com/")
    .client(client)
    .addConverterFactory(GsonConverterFactory.create())
    .build().create(ProductApi::class.java)
```

需要 Retrofit、OkHttp、对应 Converter 依赖，以及项目定义的 ProductDto。放在受控协程作用域调用，分类处理 HTTP/IO/解析错误，保留取消语义；baseUrl、响应模型和 TLS 配置按实际服务设置。

这套组合是 Android 网络层的核心骨干。核心归纳框架：分层职责、请求链路、拦截器、缓存、超时与重试。

## 1. 职责分工

### OkHttp

- 真正执行 HTTP 请求。
- 负责连接池、复用、拦截器、缓存、超时、重试等底层能力。

### Retrofit

- 面向接口声明的上层封装。
- 把 API 接口转换为可执行请求，并做数据转换（JSON/Proto 等）。

## 2. 一次请求链路

1. 调用 Retrofit 接口方法。
2. Retrofit 组装请求并交给 OkHttp。
3. OkHttp 经过拦截器链、连接复用和网络执行。
4. 响应返回后由 Converter 解析成业务对象。

## 3. 拦截器类型

- 应用拦截器：适合通用业务逻辑（鉴权、日志、统一 header）。
- 网络拦截器：更接近网络层，可观察重定向与真实网络交互。

## 4. 常见工程实践

- 统一超时配置（连接、读、写）。
- 请求失败做可控重试，避免重试风暴。
- 明确错误分类（网络错误、业务错误、解析错误）。
- 对 GET/静态资源配置缓存策略。
- 敏感接口加证书校验策略。

## 5. 为什么 Retrofit + OkHttp 常一起用？

- Retrofit 提升接口开发效率。
- OkHttp 提供可靠底层能力。
- 分层清晰，便于测试、扩展和治理。

## 6. 核心高频问题

### Q1: Retrofit 本身能发网络请求吗？
A: 不能独立完成。它通常依赖 OkHttp 作为 `Call.Factory` 执行请求。

### Q2: 拦截器和网络适配器有什么区别？
A: 拦截器处理请求/响应链路；适配器（CallAdapter）处理返回形态（如协程、RxJava）。

### Q3: 为什么要配置连接池？
A: 连接复用能减少 TLS 和 TCP 建连成本，显著降低延迟和耗电。

### Q4: OkHttp 缓存能缓存所有请求吗？
A: 不能。是否缓存由响应头和请求策略决定，不是无条件缓存。

### Q5: 线上如何避免“弱网下重试雪崩”？
A: 需要指数退避、重试上限、幂等约束和熔断降级，而不是固定间隔无限重试。

## 7. 小结

把 Retrofit 和 OkHttp 的边界理清，再深入掌握拦截器、缓存和超时重试策略，便能彻底攻克网络层技术难点。
