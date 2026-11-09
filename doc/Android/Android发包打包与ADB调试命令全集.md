---
title: Android发包打包、签名与ADB调试命令全集
---

# Android 发包打包、签名与 ADB 调试命令全集

Android 原生工程化开发与 CI/CD 自动化流水线中，**签名凭据管理、多渠道构建、APK 重命名、命令行打包与 ADB 诊断**是每个开发者必须打通的核心链路。

---

## 一、 Keystore 签名文件生成与验签命令全集

在 Android 系统中，签名文件是应用的唯一数字身份标识。发布 Release 包前必须创建正式的签名证书（`.jks` 或 `.keystore`）。

### 1. keytool 生成数字签名证书

使用 JDK 自带的 `keytool` 工具生成密钥对（推荐采用标准的 RSA 算法与 2048 位以上密钥长度）：

```bash
keytool -genkeypair -v \
  -keystore release.jks \
  -alias my-app-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype JKS
```

::: tip 关键参数详解
- `-genkeypair`：生成密钥对（包括公钥与私钥）。
- `-keystore release.jks`：指定生成的密钥库文件名称与路径。
- `-alias my-app-alias`：证书别名（一个 Keystore 内可存放多个别名，通常每个 App 对应一个）。
- `-keyalg RSA`：加密算法，推荐 RSA。
- `-keysize 2048`：密钥长度（2048 位是目前兼顾兼容与安全的主流标准）。
- `-validity 10000`：证书有效期（单位：天）。Google Play 要求应用证书有效期必须覆盖至 2033 年 10 月 22 日以后（通常设置 25 年以上即 10000+ 天）。
- `-storetype JKS`：密钥库类型，支持 `JKS` 或工业标准 `PKCS12`。
:::

### 2. 查看签名证书指纹（MD5 / SHA1 / SHA256）

接入微信开放平台、高德/百度地图、极光推送等第三方 SDK 时，必须提交签名的 MD5 或 SHA256 证书指纹：

```bash
# 1. 直接读取 Keystore 签名文件指纹信息
keytool -list -v -keystore release.jks -alias my-app-alias

# 2. 从已打包签名的 APK 文件中反查签名指纹
keytool -printcert -jarfile app-release.apk
```

### 3. 提取公钥证书（.cer / .pem）

用于后端验签或配置 HTTPS 双向证书绑定：

```bash
keytool -exportcert -keystore release.jks -alias my-app-alias -file public_cert.cer
```

### 4. 4字节对齐（zipalign）

在对 APK 进行 v2/v3 签名之前，**必须先执行 4 字节对齐**，确保所有未压缩数据相对于文件开头的起始偏移量是 4 字节的整数倍，大幅提升运行时系统 `mmap` 读取内存性能。

```bash
# 执行 4 字节对齐（zipalign 位于 Android SDK build-tools 目录下）
zipalign -v -p 4 app-unsigned.apk app-aligned.apk

# 校验 APK 是否已满足 4 字节对齐
zipalign -c -v 4 app-aligned.apk
```

### 5. apksigner 官方签名与校验

Google 从 Android 7.0 引入 `apksigner`，支持 v1、v2、v3、v4 签名全方案，**取代老旧的 jarsigner**：

```bash
# 1. 对已对齐的 APK 执行签名
apksigner sign \
  --ks release.jks \
  --ks-key-alias my-app-alias \
  --ks-pass pass:StorePassword \
  --key-pass pass:KeyPassword \
  --out app-release-signed.apk \
  app-aligned.apk

# 2. 深度验证 APK 签名完整性与签名版本
apksigner verify -v --print-certs app-release-signed.apk
```

> [!WARNING] 避坑指南：执行顺序绝对不能错！
> - **使用 apksigner（推荐）**：必须 **先 zipalign 对齐，后 apksigner 签名**。因为 v2 签名会对整个 ZIP 文件的字节块进行哈希校验，如果签完名再去 zipalign，会破坏签名块完整性导致校验失败！
> - **使用老旧 jarsigner（淘汰）**：则是先 jarsigner 签名，再 zipalign 对齐（jarsigner 仅对文件项做签名，不校验 zip 整体）。

---

## 二、 Gradle 签名自动化配置与安全防泄漏实践

将密码与密钥库直接写在版本控制（Git）的代码中存在重大安全隐患。推荐通过环境变量或私有配置文件进行动态注入。

### 1. `app/build.gradle` 生产签名配置

```groovy
android {
    ...
    signingConfigs {
        debug {
            storeFile file("debug.keystore")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
        release {
            // 优先从环境变量或 local.properties 读取，防止硬编码入库
            storeFile file(System.getenv("KEYSTORE_PATH") ?: project.findProperty("RELEASE_STORE_FILE") ?: "release.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: project.findProperty("RELEASE_STORE_PASSWORD") ?: ""
            keyAlias System.getenv("KEY_ALIAS") ?: project.findProperty("RELEASE_KEY_ALIAS") ?: ""
            keyPassword System.getenv("KEY_PASSWORD") ?: project.findProperty("RELEASE_KEY_PASSWORD") ?: ""

            // 显式开启签名版本保护
            v1SigningEnabled true
            v2SigningEnabled true
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
        debug {
            signingConfig signingConfigs.debug
        }
    }
}
```

### 2. 推荐：在 `local.properties`（受 `.gitignore` 保护）中存储密码

```properties
# 放在本地工程根目录的 local.properties，严禁提交到 Git
RELEASE_STORE_FILE=../keystores/release.jks
RELEASE_STORE_PASSWORD=YourSecureStorePass
RELEASE_KEY_ALIAS=my-app-alias
RELEASE_KEY_PASSWORD=YourSecureKeyPass
```

---

## 三、 多渠道打包（Product Flavors 与 Walle 方案）

国内应用市场众多（华为、小米、OPPO、vivo、应用宝等），需要为不同渠道包注入特定的渠道号。

### 方案 1：官方原生 `productFlavors`（适用渠道少、有渠道差异化定制代码）

在 `app/build.gradle` 中声明 `flavorDimensions` 与渠道列表：

```groovy
android {
    ...
    flavorDimensions "channel"

    productFlavors {
        huawei {
            dimension "channel"
            manifestPlaceholders = [UMENG_CHANNEL_VALUE: "huawei", APP_NAME_EXTRA: ""]
        }
        xiaomi {
            dimension "channel"
            manifestPlaceholders = [UMENG_CHANNEL_VALUE: "xiaomi", APP_NAME_EXTRA: ""]
        }
        oppo {
            dimension "channel"
            manifestPlaceholders = [UMENG_CHANNEL_VALUE: "oppo", APP_NAME_EXTRA: ""]
        }
        vivo {
            dimension "channel"
            manifestPlaceholders = [UMENG_CHANNEL_VALUE: "vivo", APP_NAME_EXTRA: ""]
        }
        official {
            dimension "channel"
            manifestPlaceholders = [UMENG_CHANNEL_VALUE: "official", APP_NAME_EXTRA: "-官网版"]
        }
    }
}
```

在 `AndroidManifest.xml` 中动态消费占位符：

```xml
<application>
    <!-- 统计分析 SDK 渠道占位符注入 -->
    <meta-data
        android:name="CHANNEL"
        android:value="${UMENG_CHANNEL_VALUE}" />
</application>
```

### 方案 2：美团 Walle / 腾讯 VasDolly 极速打包（适用几十上百个渠道）

原生 Gradle 多渠道打几十个渠道包时，每个渠道都会重复经历一遍编译、DEX、资源压缩与签名，CI 构建长达几十分钟。

- **核心原理**：利用 Android 7.0 引入的 **APK Signature Scheme v2 协议**中未被校验的 `APK Signing Block` 扩展区块，直接将渠道信息写入签名块中。
- **性能优势**：**无需重新编译代码，无需解压重打包，无需重新签名**，1 秒内可打出上千个渠道包。

```bash
# 使用 walle-cli 批量生成渠道包命令示例
java -jar walle-cli-all.jar batch -c huawei,xiaomi,oppo,vivo app-release.apk output/
```

---

## 四、 APK 产物自动化重命名（APK 自定义命名规范）

自动化构建产出的安装包绝不能叫千篇一律的 `app-release.apk`。良好的命名规范包含：**应用名称、版本名称、版本号、打包时间、渠道名、编译类型**。

### 1. Groovy DSL 配置写法（`app/build.gradle`）

在 `android` 闭包底部加入产物拦截逻辑（适配 AGP 7.x 及以上）：

```groovy
android {
    ...
    // 自动化自定义导出 APK 命名
    applicationVariants.all { variant ->
        variant.outputs.all { output ->
            if (buildType.name == 'release') {
                def appName = "FaceDoc"
                def versionName = variant.versionName
                def versionCode = variant.versionCode
                def buildTime = new Date().format("yyyyMMdd_HHmm")
                def channel = variant.flavorName ?: "official"

                // 最终命名格式：FaceDoc_v1.0.0_100_20261109_1430_huawei_release.apk
                def newApkName = "${appName}_v${versionName}_${versionCode}_${buildTime}_${channel}_release.apk"
                outputFileName = newApkName
            }
        }
    }
}
```

### 2. Kotlin DSL 配置写法（`app/build.gradle.kts`）

如果是现代 Kotlin 脚本构建配置：

```kotlin
android {
    ...
    applicationVariants.all {
        val variant = this
        outputs.all {
            val output = this as? com.android.build.gradle.internal.api.BaseVariantOutputImpl
            if (variant.buildType.name == "release") {
                val appName = "FaceDoc"
                val date = java.text.SimpleDateFormat("yyyyMMdd_HHmm").format(java.util.Date())
                val channel = variant.flavorName.ifEmpty { "official" }
                output?.outputFileName = "${appName}_v${variant.versionName}_${variant.versionCode}_${date}_${channel}_release.apk"
            }
        }
    }
}
```

---

## 五、 Gradle 命令行发包构建全集

日常在 Android Studio 中点击 Run 只是触发本地构建。在 CI/CD 服务端流水线中必须使用终端命令：

| 构建命令 | 适用场景与产物说明 |
| :--- | :--- |
| `./gradlew clean` | 清除构建缓存 `build/` 目录，杜绝增量编译引起的依赖与 Class 冲突 |
| `./gradlew assembleRelease` | 编译**所有渠道**的正式签名版 APK |
| `./gradlew assembleOfficialRelease` | 仅编译指定渠道（如 `official` 官方渠道）的正式包，速度最快 |
| `./gradlew bundleRelease` | 构建 Google Play 官方分发格式 AAB（`app-release.aab`） |
| `./gradlew assembleDebug` | 构建本地调试包，不进行深度混淆优化 |
| `./gradlew app:dependencies` | **依赖树排查神器**：输出完整依赖层级，快速排查重复库冲突 |

---

## 六、 Android App Bundle (AAB / Bundle 包) 打包与 bundletool 工具实战

从 2021 年 8 月起，Google Play 已强制所有新上架应用必须使用 **AAB（Android App Bundle）** 格式。国内出海项目或外销设备必备此技术。

### 1. 命令行构建 AAB 包

```bash
# 1. 构建默认 Release 渠道的 AAB 包
./gradlew bundleRelease

# 2. 如果配置了 Product Flavors 渠道（如 global），构建指定渠道的 AAB
./gradlew bundleGlobalRelease

# 默认生成产物路径：
# app/build/outputs/bundle/release/app-release.aab
```

### 2. 本地测试与安装：bundletool 工具实战

> [!CAUTION] 痛点说明
> `.aab` 文件是代码与资源的发布归档文件，**不能直接通过 `adb install app.aab` 安装到手机上**。  
> 本地开发调试与 QA 验收时，必须使用 Google 官方提供的 `bundletool.jar` 将 AAB 转换为安装包集合（`.apks`）。

#### 步骤 1：从 AAB 生成全量机型 APKS 归档集
```bash
# 下载 bundletool.jar（可从 Google 官方 GitHub release 获取）
java -jar bundletool-all.jar build-apks \
  --bundle=app-release.aab \
  --output=app.apks \
  --ks=release.jks \
  --ks-pass=pass:YourStorePassword \
  --ks-key-alias=my-app-alias \
  --key-pass=pass:YourKeyPassword \
  --mode=default
```

#### 步骤 2：自动识别已连接设备，一键提取并安装适配的 Split APK
```bash
# 手机打开 USB 调试并连上电脑，一行命令提取适配当前设备的 Split APK 并推送到手机安装：
java -jar bundletool-all.jar install-apks --apks=app.apks
```

#### 步骤 3：仅针对当前连接设备极速构建（推荐本地测试）
如果不需要生成全量机型的 APKS，可加入 `--connected-device` 参数，只为当前真机生成需要的分包，速度极快：
```bash
java -jar bundletool-all.jar build-apks \
  --connected-device \
  --bundle=app-release.aab \
  --output=current_device.apks \
  --ks=release.jks \
  --ks-pass=pass:YourStorePassword \
  --ks-key-alias=my-app-alias \
  --key-pass=pass:YourKeyPassword
```

#### 步骤 4：预估设备实际下载大小（衡量瘦身成效）
在发版前，可以通过命令查看用户手机在 Google Play 下载该应用时的预估体积：
```bash
java -jar bundletool-all.jar get-size total \
  --apks=app.apks \
  --human-readable-sizes
```

---

## 七、 生产级 R8 / ProGuard 混淆保护配置

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

## 八、 ADB 调试与性能排查神器全集

### 1. 设备连接与安装控制
```bash
# 查看已连接物理设备与模拟器列表
adb devices

# 覆盖安装指定 APK，保留应用历史缓存数据
adb install -r -d app-release.apk

# 强制卸载应用
adb uninstall com.example.app

# 杀掉并强制冷启动指定页面
adb shell am force-stop com.example.app
adb shell am start -n com.example.app/.ui.MainActivity
```

### 2. 日志精准过滤与性能分析
```bash
# 1. 抓取仅包含当前应用 Error 级别的日志并带时间戳
adb logcat -v time *:E | grep "com.example.app"

# 2. 内存诊断：查看当前应用的 Java 堆、Native 堆与整体 PSS 占用
adb shell dumpsys meminfo com.example.app

# 3. 掉帧卡顿分析：查看最近 120 帧的渲染耗时统计（定位 UI 掉帧）
adb shell dumpsys gfxinfo com.example.app framestats
```

### 3. 自动化压力测试：Monkey 测试
线上发布前必须通过 Monkey 测试排查隐藏的空指针、内存泄露与死锁：
```bash
# 针对指定包名，事件间隔 100 毫秒，随机注入 5000 次触摸、滑动与物理按键事件
adb shell monkey -p com.example.app --throttle 100 --ignore-crashes --ignore-timeouts -v -v 5000
```
