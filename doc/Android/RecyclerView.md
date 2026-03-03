# RecyclerView

## 是什么？

Android开发中的列表组件，**Recycle**（回收）+ **View**（视图）。

- **极速流畅：** 拥有四级缓存机制，即便是快速滑动也几乎不掉帧。
- **高度灵活：** 想把竖排列表改成网格？改一行代码换个 `LayoutManager` 就行，不需要改数据逻辑。
- **自带动画：** 默认支持 Item 添加、删除、移动时的丝滑动画效果。
- **局部刷新：** 配合 `Payload` 或 `DiffUtil`，可以只刷新一个点赞图标，而不必刷新整个页面。

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



## 缓存机制

**当一个item移除屏幕时，它并不会被销毁，而是根据状态进入以下四个缓存池**

| <span style="display:inline-block;width:80px">层级</span> | <span style="display:inline-block;width:80px">名称</span> | <span style="display:inline-block;width:80px">作用</span> | 特点                                                         |
| :-------------------------------------------------------- | :-------------------------------------------------------- | :-------------------------------------------------------- | ------------------------------------------------------------ |
| **第一级**                                                | **ScrapList**                                             | 屏幕内缓存                                                | 存储当前正在显示的ViewHolder,仅用于布局计算                  |
| **第二级**                                                | **Cache Views**                                           | 离屏缓存                                                  | 默认大小为2。存储刚移除屏幕的ViewHolder,保留属性             |
| **第三级**                                                | **ViewCacheExtension**                                    | 自定义缓存                                                | 开发者自行实现，基本很少使用。                               |
| **第四级**                                                | **RecycledViewPool**                                      | 复用池                                                    | 按viewType 分类存储。每个viewType最大容量为5,超过数据会被抹除，复用时找到了同类型的ViewHolder，将其取出，无需创建View，但必须执行`onBindViewHolder`来更新数据 |

`核心工作原理`

##### 回收流程（以向上滑动为例）

1. **移出屏幕：** 当 Item A 移出屏幕上方，它首先进入 **Cache Views**。
2. **缓存溢出：** 如果 Cache Views 已满（默认 2 个），最先进入的 Item A 会被“踢出”，并移动到 **RecycledViewPool** 中。
3. **抹除状态：** 进入 RecycledViewPool 后，ViewHolder 的数据标签通常被视为无效，等待重新绑定。

##### 复用流程（以向下滑动为例）

1. **检查 Cache Views：** 优先检查离屏缓存。如果命中了（比如你刚滑上去又滑回来），直接显示，连 `onBindViewHolder` 都不用跑。
2. **检查 RecycledViewPool：** 如果第一步没中，去复用池找。如果找到了同类型的 ViewHolder，将其取出，但必须执行 `onBindViewHolder` 来更新数据。
3. **彻底重建：** 如果所有缓存都落空，才会调用 `onCreateViewHolder` 创建全新的对象。

## 优化



1. **减少布局层级**：使用 `ConstraintLayout` 减少嵌套。层级越深，`onMeasure` 和 `onLayout` 的开销越大。

2. **固定大小 (`setHasFixedSize`)**：如果你能确定 `RecyclerView` 的宽高在内容改变时不会变化（例如填充整个屏幕或有固定高度），请设置为 `true`。

   `recyclerView.setHasFixedSize(true);` 这可以避免每次数据更新时都重新计算整个 `RecyclerView` 的布局。

3. **绑定过程优化 (Binding)**：onBindViewHolder不要在这里创建对象（如 `OnClickListener`），在 `onCreateViewHolder` 中设置监听，通过 `getBindingAdapterPosition()` 获取位置，而不是在 `onBind` 中每次创建新匿名类。

4. **避免过度绘制（Overdraw）**：`移除item根布局中的不必要的android:background`。如果item背景和activity背景一致，没有必要在重新设置item根布局的背景

5. **局部刷新**：千万不要直接调用 `notifyDataSetChanged()`。它会触发整个列表重绘，非常低效。如果只是 Item 内部某个控件（如点赞数）变了，利用 `notifyItemChanged(position, payload)` 进行增量更新，避免重新绑定整个 Item。

6. **使用setItemViewCacheSize(size)** 来加大RecyclerView缓存数目，用空间换取时间提高流畅度，特别是列表动画复杂或数据量大，可适当调整

7. **开启** `setHasStableIds(true)`   ，RecyclerView 会根据 ID 进行更精准的复用，进一步提升性能。

8. 对于RecyclerView嵌套RecyclerView的布局，使用**单个RecyclerView进行多类型布局展示**，而不是使用嵌套

9. **共享** `RecycledViewPool` 单列表二级缓存就已经足够无需共享，viewType不同，只要重复就可以使用共享，多个RecycledView情况下共享



## RecycledViewPool 使用场景

1. **场景1：**嵌套滑动列表，外层是竖向滑动的`RecyclerView`，每一行又是横向滑动的`RecyclerView`，让所有横向内层列表共用一个`RecycledViewPool`,如果横向列表的item很大且各不相同时，`onCreateViewHolder` 的开销很大。除了共享池，你**必须**配合预取机制：

   ```java
   // 在内层 RecyclerView 初始化时
   LinearLayoutManager layout = (LinearLayoutManager) innerRv.getLayoutManager();
   // 告诉 RecyclerView：当这一行即将进入屏幕时，提前帮我创建并绑定好 4 个子 Item
   layout.setInitialPrefetchItemCount(4);
   ```

   

2. **场景2：**多Tab切换布局相同，如一个页面三个 Tab（如：全部、已付款、待发货），每个 Tab 都是一个 Fragment，且每个 Fragment 里列表的 Item 布局完全一模一样，在 Activity 级别创建一个 `RecycledViewPool`，并传给这三个 Fragment 的 RecyclerView。

3. **场景3：**爆款Item类型（极端优化）

   列表中某种类型的 Item 出现频率极高（例如：朋友圈里的纯文字动态），一屏能显示 10 个。

   可手动调类型的存储上限

   ```java
   // 将文字类型的缓存池扩大到 15 个
   recyclerView.getRecycledViewPool().setMaxRecycledViews(TYPE_TEXT, 15);
   ```

   

## 第三方库



**[BaseRecyclerViewAdapterHelper](https://github.com/CymChad/BaseRecyclerViewAdapterHelper)** 

- **减少样板代码**

- **多布局支持：** 处理不同类型的 Item（如文字+图片、纯文字）变得非常简单，只需实现 `BaseMultiItemAdapter`。
- **空布局（Empty View）：** 一行代码设置数据为空时的显示界面。
- **加载动画：** 内置了多种滑入、缩放动画，提升用户体验。
- **头布局与尾布局：** 提供 `addHeaderView` 和 `addFooterView`，不需要自己去复杂的逻辑里判断 `viewType`。

### 

**基本实现**

```kotlin
class LoanAdapter : BaseQuickAdapter<Loan, LoanAdapter.VH>() {
    class VH(
        parent: ViewGroup,
        val binding: LoanItemBinding = LoanItemBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        ),
    ) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(context: Context, parent: ViewGroup, viewType: Int): VH {
        // 返回一个 ViewHolder
        return VH(parent)
    }
  
    override fun onBindViewHolder(holder: VH, position: Int, item: Loan?) {
        holder.binding.tvHyDj.text = hyDj.descResource
    }
}
```



[SmartRefreshLayout](https://github.com/scwang90/SmartRefreshLayout)  下拉刷新、上拉加载、二级刷新、淘宝二楼、RefreshLayout、OverScroll，Android智能下拉刷新框架，支持越界回弹、越界拖动，具有极强的扩展性，集成了几十种炫酷的Header和 Footer。

