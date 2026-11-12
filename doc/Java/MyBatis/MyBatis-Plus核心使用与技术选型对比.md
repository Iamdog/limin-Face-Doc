---
title: MyBatis-Plus核心使用与技术选型对比
---

# MyBatis-Plus核心使用与技术选型对比

## 使用入口：先解决问题，再做验证

简化常见 CRUD 并保留复杂 SQL 能力。

**先做基本操作**：先配置 Entity/Mapper 完成查询、更新与分页，验证逻辑删除和多租户条件，再分析增强实现。初次学习可先完成[本模块基础实践](/doc/Java/Java语言基础与日常开发)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

## 基本使用指南与代码实战

### 1. 实体定义与常用注解规范

```java
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_user") // 指定映射的数据表名
public class User {

    // 主键策略：AUTO(数据库自增), ASSIGN_ID(雪花算法生成Long/String), INPUT(手动输入)
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    // 数据库字段映射；若字段名与属性名遵循驼峰转下划线规则，可省略注解
    @TableField("user_name")
    private String userName;

    private Integer age;

    private String email;

    // 逻辑删除注解：默认 0 为未删除，1 为已删除（查询时自动拼接 WHERE deleted = 0）
    @TableLogic
    private Integer deleted;

    // 乐观锁版本号注解：更新时自动比对并在原有版本上 +1
    @Version
    private Integer version;

    // 自动填充字段：在新增或更新时通过拦截器自动赋当前时间
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    // 排除非数据库字段（该字段不参与持久化）
    @TableField(exist = false)
    private String verifyToken;
}
```

---

### 2. Mapper 接口与 Service 层封装

只需继承 `BaseMapper<T>`，即可直接拥有数十种常用单表持久化能力：

```java
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
    // 基础单表增删改查已由 BaseMapper 提供
    // 若有复杂的关联报表查询，依然可以定义自定义方法并编写 XML
}
```

业务层继承 `IService<T>` 和 `ServiceImpl<M, T>`，获得支持事务的批量插入与链式调用能力：

```java
// 1. Service 接口
public interface UserService extends IService<User> {
}

// 2. Service 实现类
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {
}
```

---

### 3. 条件构造器实战（推荐使用 Lambda 表达式）

MP 提供了 `QueryWrapper`、`UpdateWrapper` 以及对应的 `Lambda` 版本。**强烈推荐使用 Lambda 构造器**，能利用 Java 8 的方法引用（`User::getUserName`）保证列名的类型安全与重构安全。

```java
@Service
public class OrderBusinessService {

    @Autowired
    private UserMapper userMapper;
    @Autowired
    private UserService userService;

    public void queryAndModifyExample() {
        // ---------------- 1. 动态条件查询 ----------------
        // 需求：查找年龄 >= 18 岁，且用户名包含 "admin" 的有效用户，按创建时间倒序
        String searchName = "admin";
        List<User> userList = userMapper.selectList(
            new LambdaQueryWrapper<User>()
                .ge(User::getAge, 18)
                // 支持条件生效判断 (condition 参数)：只有当 searchName 不为空时才拼装 like 语句
                .like(StringUtils.hasText(searchName), User::getUserName, searchName)
                .orderByDesc(User::getCreateTime)
        );

        // ---------------- 2. 单独查询特定列 (避免 SELECT *) ----------------
        List<User> usersWithEmailOnly = userMapper.selectList(
            new LambdaQueryWrapper<User>()
                .select(User::getId, User::getUserName, User::getEmail)
                .eq(User::getAge, 20)
        );

        // ---------------- 3. 链式更新 (无需先查出来再 set 更新) ----------------
        // 需求：把姓名为 "Tom" 的用户年龄改为 25
        userService.lambdaUpdate()
            .set(User::getAge, 25)
            .eq(User::getUserName, "Tom")
            .update();

        // ---------------- 4. 批量操作 (Service 层默认按批次提交事务) ----------------
        List<User> newUsers = List.of(new User(), new User());
        userService.saveBatch(newUsers, 1000); // 每次批处理 1000 条
    }
}
```

---

### 4. 生产级必备插件配置

MyBatis-Plus 的插件基于 MyBatis 底层的 Interceptor 拦截器机制实现，通过统一的 `MybatisPlusInterceptor` 注册：

```java
@Configuration
public class MybatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

        // 1. 分页插件 (必须指定数据库方言，MP 会自动替换为对应的物理分页 SQL，如 LIMIT)
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));

        // 2. 乐观锁插件 (执行 update 时自动解析 @Version 字段)
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());

        // 3. 防全表更新/删除插件 (生产救命军规：一旦出现没有 WHERE 条件的 update/delete 则抛异常阻断)
        interceptor.addInnerInterceptor(new BlockAttackInnerInterceptor());

        return interceptor;
    }
}
```

**物理分页调用示例：**
```java
// 分页查询第 1 页，每页 10 条
Page<User> pageRequest = new Page<>(1, 10);
LambdaQueryWrapper<User> query = new LambdaQueryWrapper<User>().gt(User::getAge, 20);

// 执行查询（底层执行一次 COUNT 统计，一次 LIMIT 物理分页）
Page<User> result = userMapper.selectPage(pageRequest, query);

System.out.println("数据总行数: " + result.getTotal());
System.out.println("总页数: " + result.getPages());
System.out.println("当前页记录集合: " + result.getRecords());
```

---

### 5. 自动填充功能（审计字段）

在企业中，`create_time` 和 `update_time` 等通用审计字段通常通过 `MetaObjectHandler` 统一填充，避免业务代码重复编写：

```java
@Component
public class CustomMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        // 插入时自动填充创建时间和更新时间
        this.strictInsertFill(metaObject, "createTime", LocalDateTime::now, LocalDateTime.class);
        this.strictInsertFill(metaObject, "updateTime", LocalDateTime::now, LocalDateTime.class);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        // 更新时自动刷新更新时间
        this.strictUpdateFill(metaObject, "updateTime", LocalDateTime::now, LocalDateTime.class);
    }
}
```

---

在现代 Java 后端研发中，单表基础 CRUD 和简单条件查询占据了业务开发的绝大部分工作量。**MyBatis-Plus（简称 MP）** 作为一个在 MyBatis 基础上的增强工具，坚持**“只做增强不做改变”**的核心设计，为简化开发、提高效率而生。

本文系统梳理 MyBatis-Plus 的核心用法、底层实现逻辑、生产级实用插件，并横向深度对比原生 MyBatis、Spring Data JPA、jOOQ 与 MyBatis-Flex，提供选型决策参考。

---

## 一、 MyBatis-Plus 核心架构与设计理念

```
+-----------------------------------------------------------+
|                      业务调用层                            |
|        IService (增删改查/批量/链式) / BaseMapper<T>        |
+-----------------------------+-----------------------------+
                              |
+-----------------------------v-----------------------------+
|                      MyBatis-Plus 核心增强                 |
|  - Lambda 条件构造器 (QueryWrapper / LambdaQueryWrapper)   |
|  - ISqlInjector (启动期自动注入 MappedStatement)          |
|  - 插件体系 (分页拦截器 / 逻辑删除 / 自动填充 / 防全表更新)   |
+-----------------------------+-----------------------------+
                              |
+-----------------------------v-----------------------------+
|                      原生 MyBatis 底层                     |
|         SqlSession / Executor / StatementHandler          |
+-----------------------------------------------------------+
```

### 1. “只做增强不做改变”
- **零侵入**：完全兼容原生 MyBatis 所有特性。如果现有项目中引入 MP，原有的 Mapper 接口、XML 配置、动态 SQL 不需要改动一行代码。
- **无缝回退**：简单单表直接使用 MP 内置方法；遇到极致调优或复杂报表 SQL，直接退回到手写 XML 即可。

### 2. 底层原理：如何实现“不写 XML 就拥有方法”？
在 Spring 容器启动并加载 Mapper 接口时，MP 通过自定义的 `MybatisSqlSessionFactoryBean` 替换了原生的 `SqlSessionFactoryBean`，在其解析阶段介入：
1. MP 的 **`ISqlInjector`（SQL 注入器）** 会扫描所有继承了 `BaseMapper<T>` 的接口；
2. 提取泛型实体 `T` 上的注解（`@TableName`、`@TableId`、`@TableField`），自动推导出表名和列字段信息；
3. 动态组装成对应的原生 `MappedStatement`（包含 `insert`、`deleteById`、`selectList` 等 17 个通用内置方法），并注册到 MyBatis 全局的 `Configuration` 对象中。
4. **运行时阶段与原生 MyBatis 毫无区别**，没有反射性能损耗。

---

## 三、 对比其他主流持久层框架

Java 生态中有多种数据持久层解决方案。以下对比原生 **MyBatis**、**Spring Data JPA (Hibernate)**、**jOOQ** 与 **MyBatis-Flex**：

| 对比维度 | MyBatis-Plus | 原生 MyBatis | Spring Data JPA (Hibernate) | jOOQ | MyBatis-Flex |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **设计定位** | MyBatis 增强工具，简化单表与常用操作 | SQL 映射框架，SQL 与代码完全解耦 | 全功能 ORM，推崇面向对象与领域模型 | 类型安全 SQL DSL 构建器 | 新一代轻量级 MyBatis 增强框架 |
| **单表 CRUD 效率** | **极高**（内置大量方法，免写 SQL） | **较低**（需手写 XML 或配置 Generator 生成） | **高**（Repository 派生查询开箱即用） | **中等**（需代码生成器生成对应 Table 类） | **极高**（内置方法 + APT 编译期生成） |
| **多表关联（Join）** | **较弱**（单表为主，多表仍需退回 XML） | **极强**（手写原生 SQL，自由度极高） | **中等**（通过实体关联注解映射，易引发 N+1 陷阱） | **极强**（与原生 SQL 1:1 对应的类型安全 DSL） | **强**（框架原生内置链式 Join DSL） |
| **动态 SQL 支持** | **优秀**（Lambda 链式 API 极易编写） | **较繁琐**（需在 XML 中编写 `<if>`、`<choose>`） | **差**（Specification/Criteria 繁琐难懂） | **优秀**（纯 Java 代码动态拼装，类型安全） | **优秀**（基于 APT 生成的 QueryWrapper 体系） |
| **性能透明度** | **高**（本质依然是原生预编译 SQL） | **最高**（完全掌控底层发出的每一条 SQL） | **较低**（复杂的脏检查机制与自动 flush 隐式行为） | **最高**（透明可控） | **高**（透明可控） |
| **学习门槛** | **极低**（只要熟悉 MyBatis 几乎无心智负担） | **低至中**（需要熟悉 XML 映射语法） | **高**（级联加载、一级/二级缓存、懒加载等机制复杂） | **中高**（需要掌握特定 DSL 语法） | **低** |
| **国内社区生态** | **极大**（国内大厂、中小企业、外包主流选型） | **极广** | 中等（在外企与 DDD 团队更普遍） | 较小（极客与金融复杂计算团队推崇） | 快速增长中（新生力量） |

---

## 四、 MyBatis-Plus 的优缺点深度剖析

### 优势 (Pros)
1. **单表效率碾压级提升**：告别海量枯燥的单表 XML 增删改查编写，大幅缩短业务原型迭代周期。
2. **Lambda 表达式杜绝硬编码字符串**：通过 `User::getName` 替代 `"name"`，字段重构（Rename Refactor）时编译器全程护航。
3. **开箱即用的企业级生态插件**：
   - 分页、逻辑删除、租户 ID 自动拼装、雪花算法主键，省去自行编写 MyBatis 拦截器的重复造轮子成本。
4. **与既有资产 100% 兼容**：现有 MyBatis 项目随时可以无侵入引入，原系统中的自定义 XML 依然照常工作。

### 劣势与潜在隐患 (Cons)
1. **多表关联查询存在天然短板**：
   - 官方原生重点维护单表。对于复杂的 3 张表以上关联查询，要么手写 XML，要么引入第三方插件（如 `mybatis-plus-join`）。
2. **容易滋生“Wrapper 越权泄露”架构坏味道**：
   - 部分团队没有分层约束，前端参数直接在 Controller / Service 中拼接 `QueryWrapper`，导致数据访问层的细节泄露到外层，破坏了系统架构的可维护性。
3. **极复杂动态 SQL 难以维护**：
   - 当查询出现多层括号嵌套的 `AND (A OR (B AND C))` 时，使用 Java API 组装的语法树可读性较差，远不如一条格式化的标准 SQL 来的直观。
4. **全表查询隐患**：
   - 若执行 `selectList(null)` 会发起全表扫描，线上数据量过大时容易导致数据库 CPU 飙升或 OOM，必须配合 `BlockAttackInnerInterceptor` 等插件加强防护。

---

## 五、 生产开发最佳实践建议

> [!IMPORTANT] 生产级开发军规
> 1. **分层严格隔离**：严禁在 Controller 层直接实例化并拼接 `QueryWrapper`。所有数据组装必须收敛在 Service 或 Mapper 内部方法中。
> 2. **优先使用 Lambda 构造器**：拒绝使用魔术字符串形式的 `new QueryWrapper<User>().eq("user_name", "xxx")`，全部统一为 `new LambdaQueryWrapper<User>().eq(User::getUserName, "xxx")`。
> 3. **精准声明投影列**：查询长列表时，**坚决避免无脑 `SELECT *`**，务必显式声明 `.select(User::getId, User::getUserName)`，减轻数据库 I/O 与网络带宽开销。
> 4. **多表关联果断退回手写 XML**：一旦涉及 2 表以上的大量字段 JOIN，立即在 Mapper 对应的 XML 中编写清晰的原生 SQL 与 `<resultMap>`，不要在 Java 中强行拼装脆弱的复杂条件。

---

## 六、 选型决策指南

```
                            你的项目核心需求是什么？
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
【国内主流中后台/微服务】        【强面向对象 / DDD 驱动】      【复杂报表与大规模类型安全 DSL】
  - 大量单表与标准 CRUD          - 聚合根、领域实体生命周期      - 频繁复杂多表 Join / 窗口函数
  - 要求上手快、招人成本低        - 多数据库方言屏蔽              - 拒绝 XML、完全由类型安全代码驱动
         │                            │                            │
         ▼                            ▼                            ▼
  MyBatis-Plus / MyBatis-Flex     Spring Data JPA (Hibernate)           jOOQ
```

- **推荐选用 MyBatis-Plus 的场景**：绝大多数传统互联网中后台管理系统、微服务应用、需要快速搭建交付的敏捷项目。
- **推荐选用 Spring Data JPA 的场景**：业务模型极其复杂、严格遵从领域驱动设计（DDD）、核心关注业务实体之间的聚合关系的系统。
- **推荐选用 jOOQ 的场景**：核心系统依赖海量多表 Join、窗口函数、CTE 递归查询，且团队极其注重在编译期排查 SQL 语法错误的金融与大数据分析平台。
