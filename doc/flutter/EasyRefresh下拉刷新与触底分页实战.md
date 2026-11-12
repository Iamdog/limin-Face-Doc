---
title: EasyRefresh 下拉刷新与触底分页实战 (easy_refresh)
---

# EasyRefresh 下拉刷新与触底分页实战 (easy_refresh)

## 使用入口：先解决问题，再做验证

组织列表刷新与分页状态。

**先做基本操作**：先完成第一页、刷新和加载更多，验证无更多/错误/重复触发，再整合组件与并发保护。初次学习可先完成[本模块基础实践](/doc/flutter/Dart与Flutter页面基本使用)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

在 Flutter 官方组件库中，`RefreshIndicator` 仅支持简单的顶部下拉刷新，**没有原生的上拉加载更多、没有「没有更多了」到底状态、且动画与 Header/Footer 高度高度受限**。`easy_refresh` 是 Flutter 生态中最成熟可控的刷新与分页框架。

---

## 一、 核心依赖与版本

```yaml
dependencies:
  # 下拉刷新 + 上拉加载：EasyRefresh 的 header/footer 比 RefreshIndicator 可控，
  # 也支持「没有更多了」这种到底提示。
  easy_refresh: ^3.5.1
```

---

## 二、 企业级分页列表封装 MVP

```dart
// lib/ui/widgets/paged_refresh_view.dart
import 'package:easy_refresh/easy_refresh.dart';
import 'package:flutter/material.dart';

class PagedRefreshView<T> extends StatefulWidget {
  final Future<List<T>> Function(int page) onRequestData;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final int pageSize;

  const PagedRefreshView({
    super.key,
    required this.onRequestData,
    required this.itemBuilder,
    this.pageSize = 20,
  });

  @override
  State<PagedRefreshView<T>> createState() => _PagedRefreshViewState<T>();
}

class _PagedRefreshViewState<T> extends State<PagedRefreshView<T>> {
  final List<T> _items = [];
  int _currentPage = 1;
  late final EasyRefreshController _controller;

  @override
  void initState() {
    super.initState();
    _controller = EasyRefreshController(
      controlFinishRefresh: true,
      controlFinishLoad: true,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// 执行下拉刷新
  Future<void> _onRefresh() async {
    _currentPage = 1;
    try {
      final newData = await widget.onRequestData(_currentPage);
      setState(() {
        _items.clear();
        _items.addAll(newData);
      });
      // 成功完成刷新，若第一页数据量小于页大小则直接锁定为无更多状态
      _controller.finishRefresh(IndicatorResult.success);
      _controller.resetFooter();
    } catch (e) {
      _controller.finishRefresh(IndicatorResult.fail);
    }
  }

  /// 执行上拉加载更多
  Future<void> _onLoad() async {
    try {
      final nextPage = _currentPage + 1;
      final nextPageData = await widget.onRequestData(nextPage);

      setState(() {
        _items.addAll(nextPageData);
        _currentPage = nextPage;
      });

      // 核心：若拉回来的数量小于一页请求数，说明已经到底了
      if (nextPageData.length < widget.pageSize) {
        _controller.finishLoad(IndicatorResult.noMore);
      } else {
        _controller.finishLoad(IndicatorResult.success);
      }
    } catch (e) {
      _controller.finishLoad(IndicatorResult.fail);
    }
  }

  @override
  Widget build(BuildContext context) {
    return EasyRefresh(
      controller: _controller,
      header: const ClassicHeader(
        dragText: '下拉刷新相册',
        armedText: '释放立即刷新',
        readyText: '正在刷新中...',
        processingText: '数据加载中...',
        processedText: '刷新成功',
        noMoreText: '没有更多照片了',
        failedText: '网络刷新失败',
      ),
      footer: const ClassicFooter(
        dragText: '上拉加载更多',
        armedText: '释放加载更多',
        processingText: '努力加载中...',
        processedText: '加载完成',
        noMoreText: '—— 已经触碰到底线了 ——',
        failedText: '加载失败，请重试',
      ),
      onRefresh: _onRefresh,
      onLoad: _onLoad,
      child: ListView.builder(
        itemCount: _items.length,
        itemBuilder: (context, index) => widget.itemBuilder(context, _items[index], index),
      ),
    );
  }
}
```

---

## 三、 高频避坑指南

1. **`controlFinishRefresh / controlFinishLoad` 必须开启**：当需要手动控制网络请求失败（`IndicatorResult.fail`）或没有更多（`IndicatorResult.noMore`）时，必须将 Controller 的 `controlFinish` 设为 `true`，否则组件会在异步回调返回前自动重置。
2. **空数据占位与刷新手势共存**：当相册为空时，若直接渲染一个空的 `Container()`，用户将无法触发下拉手势。建议使用 `CustomScrollView` 搭配 `SliverFillRemaining`，保证即使列表为 0 项时也能正常下拉刷新。
