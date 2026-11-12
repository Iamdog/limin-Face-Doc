---
title: Dio网络请求与企业级封装详解
---

# Dio网络请求与企业级封装详解

## 使用入口：先解决问题，再做验证

统一 Flutter 请求、鉴权、超时与取消。

**先做基本操作**：先创建 Dio 完成一个 GET 并处理错误，测试取消和 401，再组织拦截器与刷新协调。初次学习可先完成[本模块基础实践](/doc/flutter/Dart与Flutter页面基本使用)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

## 基础使用与核心 API 实战

安装依赖（以 `dio: ^5.7.0` 为例）：

```yaml
dependencies:
  dio: ^5.7.0
```

### 1. 基础请求（GET / POST）

```dart
import 'package:dio/dio.dart';

final dio = Dio(
  BaseOptions(
    baseUrl: 'https://api.example.com/v1',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ),
);

// 1. GET 请求带 Query 参数
Future<void> fetchUserList() async {
  try {
    final response = await dio.get(
      '/users',
      queryParameters: {'page': 1, 'size': 20, 'keyword': 'flutter'},
    );
    print('返回数据: ${response.data}');
  } on DioException catch (e) {
    print('请求异常: ${e.message}');
  }
}

// 2. POST 请求提交 JSON Payload
Future<void> createUser() async {
  try {
    final response = await dio.post(
      '/users',
      data: {
        'name': 'LiMin',
        'role': 'FullStack Developer',
      }, // Dio 默认会自动将 Map 序列化为 JSON 字符串，并附带 Content-Type: application/json
    );
    print('创建成功: ${response.statusCode}');
  } on DioException catch (e) {
    print('创建失败: ${e.message}');
  }
}
```

---

### 2. 文件上传与发送进度监听 (FormData)

文件上传必须使用 `FormData` 与 `MultipartFile`：

```dart
Future<void> uploadAvatar(String filePath) async {
  // 组装 FormData
  final formData = FormData.fromMap({
    'userId': '10086',
    'avatar': await MultipartFile.fromFile(
      filePath,
      filename: 'user_avatar.jpg',
    ),
  });

  final response = await dio.post(
    '/upload/avatar',
    data: formData,
    // 进度回调: count 为已发送字节，total 为总字节
    onSendProgress: (int count, int total) {
      final double progress = count / total;
      print('上传进度: ${(progress * 100).toStringAsFixed(1)}%');
    },
  );
}
```

> [!WARNING]
> 绝不要在上传 `FormData` 时手动在请求头中指定 `headers: {'Content-Type': 'multipart/form-data'}`！  
> 因为真实的请求头必须包含随机生成的 `boundary`（形如 `multipart/form-data; boundary=--dio-boundary-123456`），Dio 会自动计算并设置。如果手动写死，服务端将无法拆包解析文件。

---

### 3. 文件下载与断点接收进度 (download)

```dart
Future<void> downloadApk(String url, String savePath) async {
  try {
    final response = await dio.download(
      url,
      savePath,
      onReceiveProgress: (int received, int total) {
        if (total != -1) {
          final double progress = received / total;
          print('下载进度: ${(progress * 100).toStringAsFixed(1)}%');
        }
      },
    );
    print('文件下载完成并保存至: $savePath');
  } on DioException catch (e) {
    print('下载失败: ${e.message}');
  }
}
```

---

### 4. 请求取消机制 (CancelToken)

当用户在界面中退出了页面、或者快速切换 Tab、或者防抖搜索连续输入时，未完成的请求应当立即被取消，以避免浪费网络带宽、CPU 解码以及引发页面已卸载导致的状态错乱（内存泄漏）。

```dart
class SearchController {
  CancelToken? _cancelToken;

  void onKeywordChanged(String keyword) async {
    // 1. 如果上一次搜索请求尚未完成，先取消
    if (_cancelToken != null && !_cancelToken!.isCancelled) {
      _cancelToken!.cancel('用户输入了新关键字，取消旧请求');
    }

    // 2. 每次请求必须实例化新的 CancelToken（不可复用同一个）
    _cancelToken = CancelToken();

    try {
      final response = await dio.get(
        '/search',
        queryParameters: {'q': keyword},
        cancelToken: _cancelToken,
      );
      print('搜索结果: ${response.data}');
    } on DioException catch (e) {
      if (CancelToken.isCancel(e)) {
        print('请求被正常取消: ${e.message}');
      } else {
        print('真实网络异常: ${e.message}');
      }
    }
  }

  void dispose() {
    _cancelToken?.cancel('页面销毁，取消网络请求');
  }
}
```

---

在 Flutter 跨平台开发中，网络请求是任何商业级 App 的核心命脉。虽然 Dart 官方提供了 `dart:io` 的 `HttpClient` 以及官方维护的 `package:http`，但 **Dio**（目前主流版本为 5.x）凭借其模块化设计、全功能拦截器链、可插拔网络适配器和丰富的高级特性，成为了 Flutter 生态中事实上的**网络层行业标准**。

本文从 **底层架构原理**、**全场景 API 实战**、**企业级工业封装（含401无感刷新Token并发队列）**、**抓包与证书锁定** 到 **高频避坑与面试题** 进行全景深度剖析。

---

## 一、 Dio 核心架构与核心设计思想

### 1. 为什么弃用官方 HttpClient / http 包而选择 Dio？

| 核心维度 | 官方 `dart:io` HttpClient | 官方 `http` 包 | Dio (5.x) |
| :--- | :--- | :--- | :--- |
| **易用性与抽象度** | 低级 API，需手动读写 Stream、组装 Byte | 简单封装，轻量，适合小型 CLI 工具 | 高级全功能 API，开箱即用 |
| **拦截器 (Interceptors)**| ❌ 无原生支持，需自行包装包装器 | ❌ 仅支持基础的 Client 包装 | ✅ 强大三向拦截器 (`onRequest`、`onResponse`、`onError`) |
| **请求取消机制** | ❌ 难以优雅取消 | ❌ 无法中断进行中的连接 | ✅ 支持 `CancelToken` 颗粒度取消与批量取消 |
| **文件流上传与下载** | 繁琐，需手动组装 Multipart 字节流 | 仅支持基础 MultipartRequest | ✅ 原生 `FormData`、`MultipartFile`，内置断点/进度监听 |
| **底层适配层解耦** | 绑定 dart:io（Web 端不可用） | 平台分支实现 | ✅ `HttpClientAdapter`，跨平台无缝支持（IO/Web/Cronet/Http2） |

---

### 2. Dio 核心分层执行流程图

Dio 内部采用了类似洋葱模型与管道流结合的处理架构：

```mermaid
flowchart TD
    App[Flutter UI / ViewModel] -->|发起请求| DioClient[Dio 实例]
    DioClient --> InterceptorReq[1. 请求拦截器: AuthInterceptor / Token注入 / Headers补充]
    InterceptorReq --> TransformerReq[2. Transformer: 请求数据序列化 (Map -> JSON/FormData)]
    TransformerReq --> Adapter[3. HttpClientAdapter: 适配底层 (IO Client / Browser Fetch / HTTP2)]
    Adapter --> Server[(远程服务器 Remote Server)]
    Server -->|返回原始字节流| Adapter
    Adapter --> TransformerRes[4. Transformer: 响应数据反序列化 (JSON/String/Stream)]
    TransformerRes --> InterceptorRes[5. 响应拦截器: 统一提取业务Code / 解密]
    InterceptorRes -->|成功| App
    InterceptorRes -->|失败/异常| InterceptorErr[6. 错误拦截器: DioException / 401无感刷新重试]
    InterceptorErr -->|重试成功| App
    InterceptorErr -->|最终异常| App
```

---

## 三、 企业级生产封装架构实战

在真实商业化工程中，零散调用 `dio.get` 是极度不可取的。我们需要构建一套具备 **单例生命周期**、**统一业务响应包装**、**401 无感刷新 Token 重试队列**、**网络异常分类映射** 的健壮网络层。

### 1. 统一接口业务实体封装 `ApiResponse<T>`

服务端通常有标准的统一 JSON 格式（如 `{ code: 200, message: "ok", data: { ... } }`）：

```dart
// lib/core/network/api_response.dart
class ApiResponse<T> {
  final int code;
  final String message;
  final T? data;

  ApiResponse({
    required this.code,
    required this.message,
    this.data,
  });

  bool get isSuccess => code == 200 || code == 0;

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic json)? fromJsonT,
  ) {
    return ApiResponse<T>(
      code: json['code'] as int? ?? -1,
      message: json['message'] as String? ?? '',
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'] as T?,
    );
  }
}
```

---

### 2. 核心：401 无感刷新 Token 拦截器（并发锁队列机制）

> [!IMPORTANT]
> **生产核心考点**：当 Access Token 过期时，若当前界面同时并发了 5 个接口，这 5 个接口都会收到 401 响应。若不做防重并发控制，就会同时向鉴权服务发出 5 次 Refresh Token 请求，导致 Token 紊乱并被服务器安全风控机制拉黑。  
> 必须使用 **队列暂存 + 并发锁 (Lock / Completer)** 机制，保证仅发起 1 次刷新请求，其余请求挂起排队，待新 Token 就绪后自动带上新 Token 重发。

```dart
// lib/core/network/auth_interceptor.dart
import 'dart:async';
import 'package:dio/dio.dart';

class AuthInterceptor extends QueuedInterceptor {
  final Dio dio;
  AuthInterceptor(this.dio);

  // 本地存储 Token 模拟（实际应从 secure_storage 或 Hive 读取）
  static String? accessToken = 'OLD_EXPIRED_TOKEN';
  static String? refreshToken = 'VALID_REFRESH_TOKEN';

  // 1. 请求拦截：自动注入 Authorization Header
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (accessToken != null && accessToken!.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    return handler.next(options);
  }

  // 2. 错误拦截：捕获 401 并执行无感刷新重试
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // 检查是否为 401 Unauthorized
    if (err.response?.statusCode == 401) {
      final requestOptions = err.requestOptions;

      // 如果当前发生 401 的接口本身就是刷新 Token 的接口，说明 Refresh Token 也过期了，直接登出
      if (requestOptions.path.contains('/auth/refresh-token')) {
        _handleForceLogout();
        return handler.next(err);
      }

      try {
        // 调用刷新 Token 方法
        final success = await _refreshToken();
        if (success) {
          // 刷新成功：更新请求头并用新 Token 重新发送原始请求
          requestOptions.headers['Authorization'] = 'Bearer $accessToken';
          
          // 使用同实例重放请求
          final response = await dio.fetch(requestOptions);
          // 将重试成功的结果交还给调用方，对上层业务完全透明无感知！
          return handler.resolve(response);
        } else {
          _handleForceLogout();
          return handler.next(err);
        }
      } catch (e) {
        _handleForceLogout();
        return handler.next(err);
      }
    }

    return handler.next(err);
  }

  // 刷新 Token 逻辑（由于继承了 QueuedInterceptor，Dio 已经帮我们把请求串行化队列处理）
  Future<bool> _refreshToken() async {
    try {
      // 必须新建一个纯净的 Dio，防止被当前拦截器再次拦截造成死循环
      final tokenDio = Dio(BaseOptions(baseUrl: dio.options.baseUrl));
      final res = await tokenDio.post(
        '/auth/refresh-token',
        data: {'refreshToken': refreshToken},
      );

      if (res.statusCode == 200 && res.data['code'] == 200) {
        accessToken = res.data['data']['accessToken'];
        refreshToken = res.data['data']['refreshToken'];
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  void _handleForceLogout() {
    accessToken = null;
    refreshToken = null;
    print('[Auth] Token 刷新失败，强制清空并跳转登录页');
  }
}
```

> [!TIP]
> **Dio 5.x 的 `QueuedInterceptor`**：  
> Dio 内部提供了 `QueuedInterceptor` 基类。当进入 `onError` 或 `onRequest` 时，后续的其它网络请求会自动进入阻塞队列等待当前任务调用 `handler.next/resolve/reject`，天然免除了在应用层编写复杂的 `Completer` 或加锁代码！

---

### 3. 全局异常拦截器与错误格式化 `AppException`

```dart
// lib/core/network/app_exception.dart
import 'package:dio/dio.dart';

class AppException implements Exception {
  final int code;
  final String message;

  AppException({required this.code, required this.message});

  @override
  String toString() => '[$code] $message';

  factory AppException.fromDioException(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
        return AppException(code: -1, message: '网络连接超时，请检查网络设置');
      case DioExceptionType.sendTimeout:
        return AppException(code: -2, message: '请求发送超时');
      case DioExceptionType.receiveTimeout:
        return AppException(code: -3, message: '服务器响应超时');
      case DioExceptionType.badCertificate:
        return AppException(code: -4, message: 'SSL 证书不受信任，通信中断');
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode ?? -1;
        switch (statusCode) {
          case 400:
            return AppException(code: 400, message: '请求参数有误');
          case 401:
            return AppException(code: 401, message: '登录状态已失效，请重新登录');
          case 403:
            return AppException(code: 403, message: '拒绝访问，权限不足');
          case 404:
            return AppException(code: 404, message: '请求接口不存在');
          case 500:
          case 502:
          case 503:
            return AppException(code: statusCode, message: '服务端异常，正在紧急抢修中');
          default:
            return AppException(code: statusCode, message: '网络响应异常: $statusCode');
        }
      case DioExceptionType.cancel:
        return AppException(code: -5, message: '请求已取消');
      case DioExceptionType.connectionError:
        return AppException(code: -6, message: '无法连接到服务器，请检查蜂窝数据或 Wi-Fi');
      case DioExceptionType.unknown:
      default:
        return AppException(code: -7, message: '未知网络错误，请稍后重试');
    }
  }
}
```

---

### 4. 工业级网络管理器单例完整代码 (`HttpService`)

```dart
// lib/core/network/http_service.dart
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'api_response.dart';
import 'app_exception.dart';
import 'auth_interceptor.dart';

class HttpService {
  static final HttpService _instance = HttpService._internal();
  factory HttpService() => _instance;

  late final Dio _dio;
  Dio get dio => _dio;

  HttpService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: 'https://api.example.com/v1',
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 15),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8',
        },
      ),
    );

    // 注册核心拦截器链
    _dio.interceptors.addAll([
      // 1. 鉴权与 401 无感刷新拦截器
      AuthInterceptor(_dio),

      // 2. 调试日志拦截器（仅在 Debug 模式开启）
      if (kDebugMode)
        LogInterceptor(
          request: true,
          requestHeader: false,
          requestBody: true,
          responseHeader: false,
          responseBody: true,
          error: true,
        ),
    ]);
  }

  /// 统一通用的 GET 请求
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? fromJsonT,
  }) async {
    return _request<T>(
      path,
      method: 'GET',
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      fromJsonT: fromJsonT,
    );
  }

  /// 统一通用的 POST 请求
  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? fromJsonT,
  }) async {
    return _request<T>(
      path,
      method: 'POST',
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      fromJsonT: fromJsonT,
    );
  }

  /// 核心内部调度方法
  Future<ApiResponse<T>> _request<T>(
    String path, {
    required String method,
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? fromJsonT,
  }) async {
    try {
      final response = await _dio.request(
        path,
        data: data,
        queryParameters: queryParameters,
        options: (options ?? Options()).copyWith(method: method),
        cancelToken: cancelToken,
      );

      // 解析服务端通用结构
      if (response.data is Map<String, dynamic>) {
        final apiResponse = ApiResponse<T>.fromJson(
          response.data as Map<String, dynamic>,
          fromJsonT,
        );

        if (!apiResponse.isSuccess) {
          // 业务逻辑错误（例如：账号密码错误、验证码失效）
          throw AppException(
            code: apiResponse.code,
            message: apiResponse.message,
          );
        }

        return apiResponse;
      } else {
        throw AppException(code: -8, message: '返回数据格式不符合规范');
      }
    } on DioException catch (e) {
      throw AppException.fromDioException(e);
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException(code: -9, message: e.toString());
    }
  }
}
```

---

## 四、 进阶实战：抓包、HTTPS 证书与底层适配器

### 1. Charles / Fiddler 抓包配置（设置 HTTP 代理与绕过自签名证书）

在开发调试过程中，经常需要通过抓包工具分析接口。在移动端原生层抓包往往因为系统根证书信任问题导致报错，Dio 允许通过配置 `IOHttpClientAdapter` 轻松打通代理：

```dart
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';

void setupProxy(Dio dio, {required String proxyIp, required int proxyPort}) {
  dio.httpClientAdapter = IOHttpClientAdapter(
    createHttpClient: () {
      final client = HttpClient();
      // 1. 设置抓包代理机器的 IP 和 端口
      client.findProxy = (uri) {
        return 'PROXY $proxyIp:$proxyPort';
      };
      // 2. 绕过 Charles 自签名根证书校验（生产环境严禁开启！）
      client.badCertificateCallback = (X509Certificate cert, String host, int port) {
        return true;
      };
      return client;
    },
  );
}
```

---

### 2. SSL Pinning（证书锁定 / 公钥锁定防中间人攻击）

在银行金融或高安全等级应用中，为了防止手机被安装恶意根证书从而进行中间人劫持（MITM），需使用 SSL Pinning：

```dart
import 'dart:io';
import 'package:dio/io.dart';

void setupSslPinning(Dio dio, String expectedFingerprint) {
  dio.httpClientAdapter = IOHttpClientAdapter(
    createHttpClient: () {
      final client = HttpClient(context: SecurityContext(withTrustedRoots: true));
      client.badCertificateCallback = (X509Certificate cert, String host, int port) {
        // 计算并比对证书的 SHA-256 指纹
        final certFingerprint = cert.sha256.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
        return certFingerprint.toLowerCase() == expectedFingerprint.toLowerCase();
      };
      return client;
    },
  );
}
```

---

## 五、 高频大坑总结与经典面试题

### 1. Dio 4 到 Dio 5 的重大 Breaking Changes
- `DioError` 被全面重命名为 **`DioException`**。
- `DioErrorType` 改为 **`DioExceptionType`**。
- 超时时间从 `int` 毫秒（`connectTimeout = 5000`）改为了 **`Duration`**（`connectTimeout = const Duration(seconds: 5)`）。
- 原生适配层从 `DefaultHttpClientAdapter` 拆分为 `IOHttpClientAdapter`（面向非 Web 端）和 `BrowserHttpClientAdapter`。

### 2. 面试高频题：为什么上传文件不能手动设置 Content-Type？
- **答**：文件上传使用的是 `multipart/form-data` 协议。该协议在网络传输时必须依赖一段由客户端随机生成的边界分割字符串（`boundary`）。Dio 在处理 `FormData` 时会自动生成此 boundary 并追加至请求头中（如 `multipart/form-data; boundary=dart-dio-xyz`）。如果开发者手动设置了 `Content-Type: multipart/form-data`，会覆盖掉带有 boundary 的标准头，导致服务端解析器无法识别各字段分界，直接报 400 或上传失败。

### 3. 面试高频题：CancelToken 是如何做到请求取消的？能重复用吗？
- **答**：
  1. `CancelToken` 内部持有 `Completer<DioException>`。当调用 `cancelToken.cancel()` 时，它会触发该 Completer，底层 `HttpClientAdapter` 捕获到取消信号后，会直接调用底层 Socket 的 `destroy()` 或中断流传输，并向外抛出 `DioExceptionType.cancel`。
  2. **不可复用**：`CancelToken` 是一次性的，一旦其状态变更为 `isCancelled == true`，再次传给下一个请求会导致该请求立刻被中断。每次发起新的独立请求都必须重新 `new CancelToken()`。

### 4. 面试高频题：并发网络请求下，Token 过期如何保证只刷新一次？
- **答**：
  1. **方案一（推荐）**：使用 Dio 5 的 `QueuedInterceptor`。当进入 `onError` 并执行异步刷新 Token 期间，后续并行的所有请求都会在 Dio 内部队列排队被挂起，刷新成功后直接调用 `handler.resolve(await dio.fetch(newRequest))` 重试，无需在外部手动写并发锁。
  2. **方案二**：使用 `Completer<bool>` 互斥锁。维护一个全局静态变量 `Completer? _refreshCompleter`。第一个进入 401 的请求实例化 Completer 并发起刷新网络请求；其余并发的 401 请求判断 `_refreshCompleter != null`，则直接 `await _refreshCompleter.future` 等待其完成，然后再批量重发。
