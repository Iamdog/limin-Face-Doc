# RecyclerView

##  基本实现



### 1. 添加依赖与布局文件

首先，在项目的 build.gradle (Module) 中确保包含了相关库（现代 Android 项目默认已包含），并在 Activity/Fragment 的 XML 布局中放置控件。

**activity_main.xml**

```xml
<androidx.recyclerview.widget.RecyclerView
    android:id="@+id/recyclerView"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```
### 2. 定义列表项布局 (Item Layout)

创建一个名为 item_layout.xml 的布局文件

**item_layout.xml**

```xml
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:padding="16dp">

    <TextView
        android:id="@+id/textView"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textSize="18sp" />
</LinearLayout>
```

### 3. 创建适配器 (Adapter) 与 ViewHolder

```kotlin
class MyAdapter(private val dataList: List<String>) : 
    RecyclerView.Adapter<MyAdapter.MyViewHolder>() {

    // 1. 内部类：持有每个子项的视图引用
    class MyViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val textView: TextView = view.findViewById(R.id.textView)
    }

    // 2. 创建 ViewHolder：负责加载布局文件
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MyViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_layout, parent, false)
        return MyViewHolder(view)
    }

    // 3. 绑定数据：将数据填充到视图中
    override fun onBindViewHolder(holder: MyViewHolder, position: Int) {
        holder.textView.text = dataList[position]
    }

    // 获取列表数量
    override fun getItemCount(): Int = dataList.size
}
```

### 4. 在 Activity 中初始化 RecyclerView

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val recyclerView: RecyclerView = findViewById(R.id.recyclerView)
        
        // 准备数据
        val data = List(20) { "Item $it" }

        // 设置布局管理器（决定是列表、网格还是瀑布流）
        recyclerView.layoutManager = LinearLayoutManager(this)
        
        // 设置适配器
        recyclerView.adapter = MyAdapter(data)
    }
}
```



## 布局管理器 (Layout Manager)


在 RecyclerView 中，LayoutManager 是真正的“幕后推手”。它负责决定子项（Item）如何排列、何时回收以及滑动的方向。



### 1.  LinearLayoutManager (线性布局)

这是最基础的布局，模仿了传统的 `ListView`。它支持**垂直**或**水平**滚动

```kotlin
// 默认垂直排列
recyclerView.layoutManager = LinearLayoutManager(this)

// 设置为水平排列
recyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
```



### 2.  GridLayoutManager (网格布局)

将数据排列成多行多列的网格矩阵

`常用场景：照片墙、电商分类页、应用桌面`

```kotlin
// 设置为 3 列的网格
recyclerView.layoutManager = GridLayoutManager(this, 3)
```



spanSizeLookup

默认情况下，`GridLayoutManager` 中每个 Item 的 `SpanSize` 都是 **1**。 如果你设置 `SpanCount = 3`（即一行有 3 个格子）：

- 如果 Item 的 `SpanSize` 是 **1**，它占 1/3 宽。
- 如果 Item 的 `SpanSize` 是 **3**，它占 满屏宽。
  

`以下是伪代码`

```kotlin
// 定义两种 ViewType
private const val TYPE_HEADER = 0
private const val TYPE_ITEM = 1

// 数据类，简单区分是标题还是内容
data class MyData(val text: String, val isHeader: Boolean)
```

```kotlin
class GridAdapter(private val list: List<MyData>) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    override fun getItemViewType(position: Int): Int {
        return if (list[position].isHeader) TYPE_HEADER else TYPE_ITEM
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == TYPE_HEADER) {
            // 填充标题布局（这里假设你有一个 item_header.xml）
            val view = inflater.inflate(R.layout.item_header, parent, false)
            HeaderViewHolder(view)
        } else {
            // 填充普通项布局
            val view = inflater.inflate(R.layout.item_layout, parent, false)
            ItemViewHolder(view)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val item = list[position]
        if (holder is HeaderViewHolder) {
            holder.tvHeader.text = item.text
        } else if (holder is ItemViewHolder) {
            holder.tvItem.text = item.text
        }
    }

    override fun getItemCount(): Int = list.size

    class HeaderViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvHeader: TextView = view.findViewById(R.id.tvHeader)
    }

    class ItemViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvItem: TextView = view.findViewById(R.id.textView)
    }
}
```

```kotlin
val dataList = mutableListOf(
    MyData("水果类", true),
    MyData("苹果", false), MyData("香蕉", false), MyData("西瓜", false),
    MyData("蔬菜类", true),
    MyData("白菜", false), MyData("萝卜", false)
)

val mAdapter = GridAdapter(dataList)
val mLayoutManager = GridLayoutManager(this, 3) // 设置总列数为 3

// 核心逻辑：设置跨度查找器
mLayoutManager.spanSizeLookup = object : GridLayoutManager.SpanSizeLookup() {
    override fun getSpanSize(position: Int): Int {
        // 根据 position 获取当前项的类型
        return when (mAdapter.getItemViewType(position)) {
            TYPE_HEADER -> 3 // 标题占满 3 格（整行）
            TYPE_ITEM -> 1   // 普通项占 1 格（1/3 行）
            else -> 1
        }
    }
}

recyclerView.layoutManager = mLayoutManager
recyclerView.adapter = mAdapter
```



### 💡 运行效果说明

- **第 0 位（水果类）**：`getSpanSize` 返回 3。因为总 `SpanCount` 是 3，所以它横跨整行。
- **第 1-3 位（苹果、香蕉、西瓜）**：`getSpanSize` 返回 1。由于一行有 3 个单位，这三个 Item 会并排显示在同一行。
- **第 4 位（蔬菜类）**：再次返回 3，由于上一行已满，它会自动换行并再次占满一整行。



### 2.3  StaggeredGridLayoutManager



## 优化



1. **减少布局层级**：使用 `ConstraintLayout` 减少嵌套。层级越深，`onMeasure` 和 `onLayout` 的开销越大。

2. **固定大小 (`setHasFixedSize`)**：如果你能确定 `RecyclerView` 的宽高在内容改变时不会变化（例如填充整个屏幕或有固定高度），请设置为 `true`。

   `recyclerView.setHasFixedSize(true);` 这可以避免每次数据更新时都重新计算整个 `RecyclerView` 的布局。

3. **绑定过程优化 (Binding)**：onBindViewHolder不要在这里创建对象（如 `OnClickListener`），在 `onCreateViewHolder` 中设置监听，通过 `getBindingAdapterPosition()` 获取位置，而不是在 `onBind` 中每次创建新匿名类。

4. **避免过度绘制（Overdraw）**：`移除item根布局中的不必要的android:background`。如果item背景和activity背景一致，没有必要在重新设置item根布局的背景

5. **局部刷新**：千万不要直接调用 `notifyDataSetChanged()`。它会触发整个列表重绘，非常低效。如果只是 Item 内部某个控件（如点赞数）变了，利用 `notifyItemChanged(position, payload)` 进行增量更新，避免重新绑定整个 Item。

6. 使用setItemViewCacheSize(size)来加大RecyclerView缓存数目，用空间换取时间提高流畅度

7. 对于RecyclerView嵌套RecyclerView的布局，可以使用单个RecyclerView进行多类型布局展示，而不是使用嵌套
