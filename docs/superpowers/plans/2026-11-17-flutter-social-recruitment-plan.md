# Flutter 阶梯式全景知识库实施计划（43 篇专题）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打造业界最完整、阶梯最平滑的 Flutter 跨平台知识库，涵盖从初学者核心语法/实战避坑（梯队一 10 篇），中级组件架构/工程实战（梯队二 10 篇），高级源码底层/三棵树与编译（梯队三 10 篇），资深混合工程/Impeller/APM 性能治理（梯队四 10 篇），到初中高三级 150 题通关题库（梯队五 3 篇），全量 43 篇高品质文档。

**Architecture:** 严格遵循 4 维度规范（架构图谱 + 源码/算法推导 + 面试连环追问 + 生产排障 SOP），针对初级专题强化“通俗机制、保姆级代码示例、新手避坑排错”。

**Tech Stack:** Flutter 3.19/3.22+, Dart 3.x, Impeller, Skia, go_router, Riverpod, Bloc, Provider, GetX, Dio, Hive, Isar, FlutterBoost, DevTools, VitePress.

**Spec:** `docs/superpowers/specs/2026-11-17-flutter-social-recruitment-design.md`

---

## 任务拆解清单

- [ ] **Task 1: 梯队一 初级筑基·Dart语言与Flutter核心组件实战 (10 篇)**
  - `doc/flutter/初级-Dart基础核心语法空安全与异步编程Future-Stream.md`
  - `doc/flutter/初级-Flutter工程目录结构与Widget声明式UI编程思想.md`
  - `doc/flutter/初级-StatelessWidget与StatefulWidget核心生命周期与setState.md`
  - `doc/flutter/初级-基础排版布局Row-Column与Flex-Expanded自适应实战.md`
  - `doc/flutter/初级-层叠布局Stack与Positioned及层级覆盖实战.md`
  - `doc/flutter/初级-基础表单输入TextField与Form表单校验体系.md`
  - `doc/flutter/初级-滚动容器ListView与GridView基础用法与列表分割线.md`
  - `doc/flutter/初级-手势识别GestureDetector与InkWell水波纹点击交互.md`
  - `doc/flutter/初级-图片组件Image全场景加载资产网络与缓存策略.md`
  - `doc/flutter/初级-新手常见报错排查指南与控制台Error根治SOP.md`

- [ ] **Task 2: 梯队二 中级进阶·组件架构、导航路由与状态管理实战 (10 篇)**
  - `doc/flutter/中级-BuildContext本质作用域链与Theme-MediaQuery查找机制.md`
  - `doc/flutter/中级-Flutter中的Key机制ValueKey-ObjectKey与GlobalKey物理应用.md`
  - `doc/flutter/中级-CustomScrollView与Sliver视口系统高级折叠滑动实战.md`
  - `doc/flutter/中级-路由体系Navigator1.0对比Navigator2.0与go_router实战.md`
  - `doc/flutter/中级-InheritedWidget底层数据共享机制与updateShouldNotify.md`
  - `doc/flutter/中级-状态管理选型对比Provider-Riverpod-Bloc-GetX深度实战.md`
  - `doc/flutter/中级-动画体系核心AnimationController-Tween与CurvedAnimation.md`
  - `doc/flutter/中级-Dio企业级网络层封装拦截器Token无感刷新与取消请求.md`
  - `doc/flutter/中级-本地数据持久化Hive与SharedPreferences及Isar选型实战.md`
  - `doc/flutter/中级-通用弹窗体系Dialog-BottomSheet与SnackBars优雅封装.md`

- [ ] **Task 3: 梯队三 高级深水·渲染三棵树、事件机制与底层编译源码 (10 篇)**
  - `doc/flutter/高级-渲染核心Widget-Element-RenderObject三棵树全生命周期.md`
  - `doc/flutter/高级-布局核心Constraints物理传递向下约束向上确定尺寸.md`
  - `doc/flutter/高级-绘制管道Layer图层树与RepaintBoundary重绘隔离.md`
  - `doc/flutter/高级-手势竞技场GestureArena机制与多手势滑动冲突解决.md`
  - `doc/flutter/高级-自定义绘制CustomPainter与Canvas画笔贝塞尔曲线实战.md`
  - `doc/flutter/高级-Dart多线程并发Isolate机制与compute轻量调度.md`
  - `doc/flutter/高级-Dart编译模式JIT与AOT及底层虚拟机DDC与Snapshot.md`
  - `doc/flutter/高级-Flutter启动全时序从Native引导到首帧RenderView挂载.md`
  - `doc/flutter/高级-热重载HotReload物理原理与状态保留机制源码推导.md`
  - `doc/flutter/高级-原生平台通道PlatformChannel编解码源码与二进制流.md`

- [ ] **Task 4: 梯队四 资深架构·混合工程、渲染引擎Impeller/Skia、APM监控与Native通信 (10 篇)**
  - `doc/flutter/资深-混合开发架构FlutterBoost与多引擎多Activity栈管理.md`
  - `doc/flutter/资深-新一代渲染引擎Impeller架构对比Skia与着色器预编译.md`
  - `doc/flutter/资深-Dart-FFI高性能原生C-C++绑定与内存指针交互.md`
  - `doc/flutter/资深-APM全链路性能监控卡顿掉帧FPS采集与卡顿堆栈还原.md`
  - `doc/flutter/资深-Flutter内存泄露排查DevTools-Memory分析与ImageCache调优.md`
  - `doc/flutter/资深-线上异常崩溃监控与Zone沙箱捕获及符号表解析.md`
  - `doc/flutter/资深-无头渲染与自动化测试单元测试Widget测试集成测试.md`
  - `doc/flutter/资深-CI-CD持续集成流水线Fastlane自动化打包与多渠道风味Flavor.md`
  - `doc/flutter/资深-包体积深度优化产物瘦身代码混淆与动态资产拆包.md`
  - `doc/flutter/资深-跨平台桌面端与Web适配大屏响应式与键盘鼠标交互.md`

- [ ] **Task 5: 梯队五 阶梯式全通关真题库·150 道硬核连环炮 (3 篇)**
  - `doc/flutter/Flutter全阶段面试通关-初级基础50题标准对标.md`
  - `doc/flutter/Flutter全阶段面试通关-中级实战50题标准对标.md`
  - `doc/flutter/Flutter全阶段面试通关-高级资深架构50道连环炮全景通关.md`

- [ ] **Task 6: 侧边栏编排与全站构建验证**
  - 重构 `doc/flutter/前言.md`
  - 更新 `.vitepress/config.mts` 侧边栏 Flutter 五级折叠分组
  - 执行 `npm run docs:build` 验证通过（Exit Code 0，0 坏链，0 编译错误）
