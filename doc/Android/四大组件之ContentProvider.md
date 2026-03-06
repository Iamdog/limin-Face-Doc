# ContentProvider



## 是什么?



**ContentProvider 是 Android 系统提供的一种统一数据访问接口，允许不同应用之间通过 URI 的形式，安全地访问、增删改查数据**。



### 核心组成部分

- **URI (Uniform Resource Identifier)**：标识数据集的唯一路径。
  - 标准格式：`content://authority/path/id`
  - `authority`：通常是包名，用于系统定位具体的 Provider。
- **ContentResolver**：外部应用（客户端）不直接调用 Provider，而是通过 `Context.getContentResolver()` 来操作。
- **ContentObserver**：用于监听数据变化，实现类似“发布-订阅”的机制。
- **Cursor：** 数据结果集，类似数据库的游标



`URI组成部分`



| 部分          | 说明                      | 示例            |
| ------------- | ------------------------- | --------------- |
| **scheme**    | 协议，固定为 `content://` | content://      |
| **authority** | 唯一标识符，类似域名      | com.example.app |
| **path**      | 数据表或资源路径          | notes           |
| **id**        | 具体数据项（可选）        | 5               |



### 工作原理

ContentProvider 底层基于 **Binder** 进行进程间通信（IPC）。它采用数据库类似的 CRUD（增删改查）模型。



## 什么时候用 ContentProvider？



- 需要向其他应用暴露数据
- 需要细粒度的权限控制
- 需要数据变化监听（ContentObserver）
- 需要支持标准的 CRUD 操作

 `不推荐用于：`

- 同一应用内的数据访问（用 Room + Repository）
- 简单的配置共享（用 SharedPreferences）
- 频繁的小数据传递（用 Intent 或 EventBus）



## 最小案例实践



### 服务端：MyProviderApp

创建一个名为 `MyProvider` 的类。为了保证你能直接复制运行，这里使用 `MatrixCursor` 模拟内存数据库。

### MyProvider.java

Java

```java
package com.example.provider;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.UriMatcher;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class MyProvider extends ContentProvider {

    private static final String AUTHORITY = "com.example.myprovider";
    private static final int CODE_BOOKS = 1;
    private static final UriMatcher sUriMatcher = new UriMatcher(UriMatcher.NO_MATCH);

    static {
        // 注册匹配规则：content://com.example.myprovider/books
        sUriMatcher.addURI(AUTHORITY, "books", CODE_BOOKS);
    }

    // 模拟内存数据库
    private final String[] columns = {"_id", "name"};
    private MatrixCursor mCursor = new MatrixCursor(columns);

    @Override
    public boolean onCreate() {
        // 初始化两条演示数据
        mCursor.addRow(new Object[]{1, "Android 进阶指南"});
        mCursor.addRow(new Object[]{2, "Kotlin 实战"});
        return true;
    }

    @Nullable
    @Override
    public Cursor query(@NonNull Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        if (sUriMatcher.match(uri) == CODE_BOOKS) {
            return mCursor;
        }
        return null;
    }

    @Nullable
    @Override
    public Uri insert(@NonNull Uri uri, @Nullable ContentValues values) {
        if (sUriMatcher.match(uri) == CODE_BOOKS && values != null) {
            int id = values.getAsInteger("_id");
            String name = values.getAsString("name");
            mCursor.addRow(new Object[]{id, name});
            // 通知数据已改变
            getContext().getContentResolver().notifyChange(uri, null);
            return uri;
        }
        return null;
    }

    // 以下为必须实现但此处可简化的方法
    @Override public int delete(@NonNull Uri uri, String s, String[] sa) { return 0; }
    @Override public int update(@NonNull Uri uri, ContentValues v, String s, String[] sa) { return 0; }
    @Override public String getType(@NonNull Uri uri) { return "vnd.android.cursor.dir/books"; }
}
```

### AndroidManifest.xml (服务端)

**必须配置 `authorities` 和 `exported`。**

XML

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.provider">

    <application>
        <provider
            android:name=".MyProvider"
            android:authorities="com.example.myprovider"
            android:exported="true" /> </application>
</manifest>
```

------

## 2. 客户端：MyClientApp

在另一个 App（或同一个 App 的不同 Activity）中调用。

### MainActivity.java (调用端)

Java

```java
package com.example.client;

import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private static final Uri BOOK_URI = Uri.parse("content://com.example.myprovider/books");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 1. 插入一条数据
        insertData(3, "Java 核心技术");

        // 2. 查询所有数据
        queryData();
    }

    private void insertData(int id, String name) {
        ContentValues values = new ContentValues();
        values.put("_id", id);
        values.put("name", name);
        getContentResolver().insert(BOOK_URI, values);
    }

    private void queryData() {
        Cursor cursor = getContentResolver().query(BOOK_URI, null, null, null, null);
        if (cursor != null) {
            while (cursor.moveToNext()) {
                int id = cursor.getInt(cursor.getColumnIndexOrThrow("_id"));
                String name = cursor.getString(cursor.getColumnIndexOrThrow("name"));
                Log.d("ProviderClient", "ID: " + id + ", Name: " + name);
            }
            cursor.close();
        }
    }
}
```

### AndroidManifest.xml (客户端 - Android 11+ 必填)

**注意：** Android 11 (API 30) 及以上版本增加了软件包可见性限制，客户端必须声明 `<queries>`。

XML

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.client">

    <queries>
        <provider android:authorities="com.example.myprovider" />
    </queries>

    <application> ... </application>
</manifest>
```



## 面试高频考点



### ContentProvider 为什么要在四大组件中占一席之地？

**痛点：** 跨进程传输大批量数据时，如果直接用 AIDL 传递 List 或 Map，由于 Binder 缓冲区限制（通常约 1MB），容易触发 `TransactionTooLargeException`。 **优势：**

- **共享内存**：ContentProvider 在跨进程传输大数据时，通常利用 **Anonymous Shared Memory (Ashmem)** 结合文件描述符传递，效率极高。
- **标准化**：为不同应用间的数据共享提供了统一标准的接口。

### 2. ContentProvider 的生命周期与启动时机

这是一个著名的“坑”。

- **启动时机**：ContentProvider 的 `onCreate()` 在 **Application 的 `onCreate()` 之前**执行。
- **注意点**：千万不要在 ContentProvider 的 `onCreate()` 中执行耗时操作，否则会直接拖慢应用启动速度，甚至导致 ANR。

### 3. 如何保证 ContentProvider 的安全性？

如果你的 Provider 存储了敏感数据，必须考虑：

- **私有化**：在 `AndroidManifest.xml` 中设置 `android:exported="false"`。
- **权限控制**：通过 `android:permission` 设置读写权限。
- **SQL 注入防御**：使用占位符 `?` 而不是直接拼接字符串。

### 4. ContentProvider 是线程安全的吗？

**结论：不是。**

- 多个应用同时通过 ContentResolver 访问时，Provider 的 `query/insert/update/delete` 方法会运行在 Provider 进程的 **Binder 线程池**中。
- **应对方案**：如果底层是 SQLite，因为 SQLite 本身有数据库级锁，通常不需要额外同步；如果是操作文件或内存数据，必须手动加锁（synchronized 或 ReentrantLock）。

### 5. 如何监听 ContentProvider 的数据变化？

这是实现 UI 自动刷新的常用手段：

1. **Provider 端**：在执行完 `insert/update/delete` 后，调用 `getContext().getContentResolver().notifyChange(uri, null)`。
2. **客户端**：使用 `getContentResolver().registerContentObserver(uri, true, observer)` 注册监听。



