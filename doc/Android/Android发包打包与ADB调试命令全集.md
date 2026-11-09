---
title: Android发包打包与ADB调试命令全集
---

# Android发包打包与ADB调试命令全集

Android 原生开发中，CI/CD 流水线构建、自动化压测、内存开销诊断与帧率监测离不开 **Gradle 命令行与 ADB 诊断工具箱**。

---

## 1. Gradle 命令行生产发包构建全集

日常在 Android Studio 中点击 Run 只是调用了本地 Gradle 任务。在服务端自动化流水线中，必须熟练掌握终端构建命令。

| 构建命令 | 作用与输出产物 |
| :--- | :--- |
| `./gradlew clean` | 清除 `build/` 目录，防止增量编译引起的诡异 Class 冲突 |
| `./gradlew assembleRelease` | 编译正式签名版本 APK（产物：`app/build/outputs/apk/release/app-release.apk`） |
| `./gradlew bundleRelease` | 构建 Google Play 官方推荐的 AAB（`app-release.aab`） |
| `./gradlew assembleProdRelease` | 指定构建特定 Flavor 渠道正式包（如生产渠道 `prod`） |
| `./gradlew app:dependencies` | **排查依赖冲突神器**：输出完整的组件依赖树，定位重复库冲突 |

---

## 2. 生产级 R8 / ProGuard 混淆保护配置

代码混淆能够防止反编译偷取源码，同时缩减无用 Class 字节码。但混淆规则配置不当会导致**反射崩溃、JSON 解析字段为 null、JNI 调用失败**。

### `proguard-rules.pro` 核心实战模板
```properties
# 1. 代码混淆与优化基本配置
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose

# 2. 保留所有注解、异常签名、内部类
-keepattributes *Annotation*,InnerClasses,Signature,EnclosingMethod

# 3. 严格保护所有数据模型实体（防止 JSON 解析空指针）
-keep class com.example.app.model.** { *; }
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
}

# 4. 保留所有与 JNI C/C++ 交互的方法
-keepclasseswithmembernames class * {
    native <methods>;
}

# 5. 保留 WebView 与 JS 交互接口（防止混淆后 H5 无法调用原生方法）
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
```

---

## 3. ADB 调试与性能排查神器全集

### 设备连接与安装控制
```bash
# 查看已连接设备与模拟器
adb devices

# 覆盖安装 APK，保留应用历史缓存数据
adb install -r -d app-release.apk

# 强制卸载应用
adb uninstall com.example.app

# 杀掉并强制冷启动指定页面
adb shell am force-stop com.example.app
adb shell am start -n com.example.app/.ui.MainActivity
```

### 日志精准过滤与性能分析
```bash
# 1. 抓取仅包含当前应用 Error 级别的日志并带时间戳
adb logcat -v time *:E | grep "com.example.app"

# 2. 内存诊断：查看当前应用的 Java 堆、Native 堆与整体 PSS 占用
adb shell dumpsys meminfo com.example.app

# 3. 掉帧卡顿分析：查看最近 120 帧的渲染耗时统计（定位 UI 掉帧）
adb shell dumpsys gfxinfo com.example.app framestats
```

### 自动化压力测试：Monkey 测试
线上发布前必须通过 Monkey 测试排查隐藏的空指针、内存泄露与死锁：
```bash
# 针对指定包名，事件间隔 100 毫秒，随机注入 5000 次触摸、滑动与物理按键事件
adb shell monkey -p com.example.app --throttle 100 --ignore-crashes --ignore-timeouts -v -v 5000
```
