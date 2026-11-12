---
title: Dart 与 Flutter 页面基本使用
---

# Dart 与 Flutter 页面基本使用

## 解决什么问题

Flutter 用于复用多端界面和业务代码；Dart 用于描述数据、异步和页面状态。先做一个输入和列表页面，再学习三棵树、布局算法和引擎。

## 基本使用：创建并运行

先安装与项目兼容的 Flutter stable，运行 `flutter doctor` 检查环境，再执行 `flutter create task_demo`、进入目录运行 `flutter run`。设备选择和平台签名按实际环境配置。

将以下代码放入 `lib/main.dart`：

```dart
import 'package:flutter/material.dart';
void main() => runApp(const MaterialApp(home: TaskPage()));

class TaskPage extends StatefulWidget {
  const TaskPage({super.key});
  @override
  State<TaskPage> createState() => _TaskPageState();
}
class _TaskPageState extends State<TaskPage> {
  final input = TextEditingController();
  final tasks = <String>[];
  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('任务')),
    body: Column(children: [
      TextField(controller: input, decoration: const InputDecoration(labelText: '任务名称')),
      ElevatedButton(onPressed: () {
        final text = input.text.trim();
        if (text.isEmpty) return;
        setState(() => tasks.add(text));
        input.clear();
      }, child: const Text('添加')),
      Expanded(child: ListView.builder(
        itemCount: tasks.length,
        itemBuilder: (context, index) => ListTile(title: Text(tasks[index])),
      )),
    ]),
  );
}
```

验证空输入、长列表和返回页面；页面销毁时释放 controller。`setState` 回调保持同步，异步加载完之后再提交状态；修改状态前确认 `mounted`，同时尽量取消已无必要的任务。

## Dart 语言与页面 API

| 知识 | 基本用法 | 易错边界 |
|---|---|---|
| 空安全 | `String?`、`?.`、`??` | `!` 是非空断言，不能让 null 自动变安全 |
| final / const | final 单次赋值，const 编译期常量 | final 集合仍可能可变；const 有使用条件 |
| class / mixin | class 建模，mixin 复用行为 | 区分继承、实现和混入，避免滥用全局单例 |
| Future | async/await + try/catch | await 不自动切换到后台线程 |
| Stream | 订阅连续事件 | 取消 subscription；区分单订阅和广播流 |
| 布局 | Row/Column、Padding、Expanded | 滚动轴无界约束不能直接塞 Expanded |
| 路由 | Navigator push/pop | 返回结果、系统返回、深链需统一设计 |
| 本地状态 | StatefulWidget + setState | 跨页面共享状态出现后才引入状态管理库 |

## 常见场景：接口与持久化

加载页面先设计 loading、data、empty、error 四类状态，用 Dio 发请求并设置超时、取消、错误分类。Token 保存到适合目标平台的安全存储；普通设置可用键值存储，结构化离线数据使用数据库。页面参数和本地缓存不是服务端权限依据。

重计算例如大量解析可以评估 `Isolate.run` 或 `compute`；isolate 不共享普通可变堆对象，传输数据有成本。网络 await 本身无需为每个请求创建 isolate。

## 验证与进阶

运行 `flutter analyze` 和 `flutter test`；至少加入空输入、新增任务和加载失败的 widget 测试。性能在 profile/release 环境和目标真机上测，debug 模式下的卡顿不能直接代表线上表现。

阅读 [状态管理](/doc/flutter/状态管理与架构实战) → [Dio](/doc/flutter/Dio网络请求与企业级封装详解) → [布局](/doc/flutter/布局机制与核心原理) → [渲染专题](/doc/flutter/渲染机制与Widget体系核心解析)。

## 面试递进

| 基础题 | 场景追问 | 深入要点 |
|---|---|---|
| Stateless/Stateful 怎么选？ | 列表局部状态如何保存？ | State 生命周期、key 与 Element 复用 |
| setState 怎么用？ | 异步返回页面已经销毁怎么办？ | mounted、取消和重建范围 |
| Future 与 Stream 区别？ | 多订阅和页面退出怎么处理？ | 事件循环、订阅生命周期 |
| Row/Column 为什么溢出？ | 长列表内嵌如何改？ | 先解释约束，再看布局协议 |
| const 为什么有帮助？ | 所有 widget 加 const 就够了吗？ | 复用配置的边界；性能仍要实测 |
