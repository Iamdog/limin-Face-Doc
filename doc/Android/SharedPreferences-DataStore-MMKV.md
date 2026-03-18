---
title: Android SharedPreferences-DataStore-MMKV
---

# Android SharedPreferences / DataStore / MMKV

本地轻量存储是 Android 高频题。面试里常问 `SharedPreferences` 的缺点、`DataStore` 为什么出现、`MMKV` 为什么快。

## 1. SharedPreferences 是什么？

- 经典的 key-value 存储方案。
- 适合轻量配置项，比如登录态、开关、简单缓存标记。

## 2. SharedPreferences 的常见问题

- API 相对老旧。
- 并发和一致性体验一般。
- 大量读写时性能一般。
- 类型安全和异常处理能力有限。

## 3. `apply()` 和 `commit()` 的区别

- `commit()` 同步提交，立即返回是否成功。
- `apply()` 异步落盘，不阻塞主线程，通常更推荐。

## 4. DataStore 是什么？

- Jetpack 推出的现代数据存储方案。
- 用来替代 SharedPreferences 的多数场景。
- 基于协程和 Flow，异步、安全性更好。

## 5. DataStore 分哪两种？

### Preferences DataStore

- 类似 key-value。
- 使用方式接近 SharedPreferences。

### Proto DataStore

- 使用 protobuf 定义结构化数据。
- 类型更安全。

## 6. MMKV 是什么？

- 腾讯开源的高性能 key-value 存储组件。
- 基于 mmap 内存映射。
- 通常比 SharedPreferences 更快。

## 7. 为什么 MMKV 快？

- 使用内存映射减少传统文件读写开销。
- 编码解码效率较高。
- 工程上做了较多性能优化。

## 8. 三者如何选型？

### SharedPreferences

- 老项目兼容维护。
- 简单配置项场景。

### DataStore

- 新项目首选的 Jetpack 方案。
- 需要协程、Flow、类型安全时更合适。

### MMKV

- 更关注性能。
- 已有团队技术栈或存量项目普遍使用。

## 9. 面试高频问题

### Q1: SharedPreferences 为什么不适合大量高频写入？
A: 因为它本质还是文件型持久化，频繁写入会带来性能和阻塞风险，不适合作为重度缓存或数据库替代品。

### Q2: 为什么现在很多项目推荐 DataStore？
A: 因为它异步、支持 Flow、API 更现代，能更自然地融入协程体系。

### Q3: MMKV 和 SharedPreferences 的本质区别是什么？
A: 都是 key-value，但 MMKV 在底层实现和性能优化上更激进，尤其适合对读写性能敏感的场景。

### Q4: DataStore 能替代 Room 吗？
A: 不能。DataStore 适合轻量配置，Room 适合结构化关系数据，两者解决的问题不同。

### Q5: `apply()` 一定比 `commit()` 好吗？
A: 大多数 UI 场景下更合适，但如果业务强依赖立即成功结果，`commit()` 仍有使用价值。

## 10. 小结

这类题回答时重点是选型思路：轻量配置看 SharedPreferences/DataStore/MMKV，结构化数据看 Room，不要混用概念。
