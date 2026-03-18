---
title: Android Jetpack之Room
---

# Android Jetpack之Room

`Room` 是 Jetpack 提供的 SQLite ORM 封装层，目标是让本地数据库访问更安全、更清晰、更容易维护。面试里常和 SQLite、缓存、异步查询、数据层设计一起考。

## 1. Room 是什么？

- Room 不是新的数据库，它底层仍然基于 SQLite。
- 它在 SQLite 之上提供了编译期 SQL 校验、对象映射和 DAO 抽象。
- 核心价值是降低原生 SQLite 的模板代码和易错点。

## 2. Room 的三大核心组成

### 2.1 Entity

- 实体类，对应数据库表。

```kotlin
@Entity(tableName = "user")
data class User(
    @PrimaryKey val id: Long,
    val name: String,
    val age: Int
)
```

### 2.2 Dao

- 定义增删改查接口。

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM user")
    suspend fun getAll(): List<User>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: User)
}
```

### 2.3 Database

- 数据库入口，负责提供 DAO。

```kotlin
@Database(entities = [User::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

## 3. Room 相比原生 SQLite 的优势

- 编译期校验 SQL，减少运行时错误。
- DAO 抽象清晰，代码更易维护。
- 天然支持协程、Flow、LiveData。
- 与 Jetpack 生态集成更完整。

## 4. Room 的基本使用流程

1. 定义 `Entity`。
2. 定义 `Dao`。
3. 定义 `RoomDatabase`。
4. 通过 `Room.databaseBuilder()` 构建实例。
5. 在 Repository 中调用 Dao，对外提供统一数据访问能力。

## 5. 为什么数据库操作不能放主线程？

- 因为磁盘 IO 不确定性高，容易阻塞主线程。
- Room 默认就禁止主线程查询，除非显式开启 `allowMainThreadQueries()`。
- 面试里最好补一句：这个开关只适合 demo，不适合正式项目。

## 6. Room 和 Flow / LiveData 的结合

Room 可以直接返回可观察数据流：

```kotlin
@Query("SELECT * FROM user")
fun observeUsers(): Flow<List<User>>
```

优点：

- 数据变化后自动通知 UI。
- 非常适合本地缓存 + MVVM 的组合。

## 7. 数据库升级怎么处理？

- 通过 `Migration` 明确声明版本迁移逻辑。
- 不能指望线上数据库自动适配表结构变化。
- 如果是本地弱数据、允许丢失，也可以用 `fallbackToDestructiveMigration()`，但要明确风险。

## 8. Room 的线程模型

- 查询、插入、删除本质仍然是数据库 IO。
- 推荐结合协程 `Dispatchers.IO`、Flow、Repository 使用。
- 多线程访问同一个数据库时要关注事务边界和并发一致性。

## 9. 事务怎么保证？

- 可使用 `@Transaction` 标注需要原子执行的方法。
- 适合“先查再改”“多表联动写入”等场景。
- 面试里要强调：事务的价值是保证一组操作要么都成功，要么都失败。

## 10. 常见面试题

### Q1: Room 和 SQLite 的关系是什么？
A: Room 是对 SQLite 的上层封装，不是替代 SQLite 的另一种数据库。底层数据仍然最终落在 SQLite 中。

### Q2: Room 为什么更适合大型项目？
A: 因为它把表结构、查询接口、数据库管理都标准化了，而且有编译期校验和迁移机制，更适合多人协作和长期维护。

### Q3: `@Insert(onConflict = REPLACE)` 有什么含义？
A: 当主键或唯一键冲突时，用新数据替换旧数据。这是本地缓存场景里很常见的策略。

### Q4: 为什么很多项目会把 Room 放在 Repository 后面？
A: 因为 Repository 是数据来源统一入口，它可以协调网络、缓存、数据库，而不是让 ViewModel 直接依赖数据库实现细节。

### Q5: Room 能完全替代 MMKV 或 DataStore 吗？
A: 不能。Room 适合结构化关系数据；MMKV、DataStore 更适合轻量 key-value 配置。三者解决的问题不同。

## 11. 小结

Room 的关键词是“SQLite 封装、编译期校验、DAO、迁移、与 Jetpack 集成”。面试中只要把它和 SQLite、Repository、线程模型的关系讲清楚，基本就能过关。
