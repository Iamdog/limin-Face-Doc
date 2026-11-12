---
title: Spring 事务基本使用、失败排查与原理
---

# Spring 事务基本使用、失败排查与原理

## 一、解决什么问题

本地事务让一组数据库修改按业务约定一起提交或回滚，例如订单和明细、任务和操作记录。先验证多条 SQL 的最终结果，再讲代理与传播。事务不能自动回滚已经成功的远端 HTTP、消息或文件副作用。

如果已经会 CRUD，先完成 [事务、权限与排错练习](/doc/Java/事务权限与排错实战)，项目说明见 [可运行工程](/examples/java-backend-workshop/README)。

## 二、基本使用：定义并验证业务事务

```java
@Service
public class OrderService {
    private final OrderMapper orders;
    private final DetailMapper details;
    public OrderService(OrderMapper orders, DetailMapper details) {
        this.orders = orders;
        this.details = details;
    }

    @Transactional
    public void create(Order order, Detail detail) {
        orders.insert(order);
        details.insert(detail);
    }
}
```

此片段需要项目定义的实体、Mapper、数据源与事务管理器。外部通过 Spring 管理的 Service 调用公开方法，两次写入使用同一事务资源。先正常调用确认两条数据提交，再在第二次写入完成后抛异常，确认两条都没有残留。

不要只确认方法上“有注解”，也不要在测试外层加事务、测试结束自动回滚后据此声称业务事务正常。练习项目已有不带外围事务的真实回滚测试。

## 三、常见失败：按事实逐项定位

### 1. 同一个类内调用

```java
public void createWrong(Order order) {
    this.saveInternal(order); // saveInternal 的新事务属性不经过通常的代理拦截
}
@Transactional
public void saveInternal(Order order) {
    orders.insert(order);
    throw new IllegalStateException("fail");
}
```

在默认代理模式中，内部调用不应用被调用方法的新增事务属性。**如果入口方法本身已有事务，内部数据库操作仍可能参与外层事务**，不能把任何 this 调用都说成完全无事务。

优先把事务标在被外部调用的完整业务方法，或按职责拆分独立 Service；需要灵活边界时用 TransactionTemplate。自注入代理/AopContext 有额外配置和耦合，适合已有约束下的专项解决，不作为常规首选。AopContext 还要求当前调用已在暴露代理的 AOP 上下文中。

### 2. 捕获异常后正常返回

```java
@Transactional
public void createWrong(Order order) {
    try {
        orders.insert(order);
        details.insert(buildDetail(order));
    } catch (RuntimeException error) {
        log.error("create failed", error);
        // 只有日志，没有继续抛出，也没有按业务标记回滚
    }
}
```

普通情况下异常不离开事务边界且没有 rollback-only 标记，会按正常返回处理。可以传播合适异常，或有明确需要时标记 rollback-only。内层事务或持久层已将事务标成 rollback-only 时，即使 catch，最终仍可能回滚并出现 UnexpectedRollbackException。

日志打印和 Controller 返回错误本身不决定数据库是否回滚，查看事务边界、回滚标记和真实数据。

### 3. 回滚规则与受检异常

默认通常对 RuntimeException/Error 回滚，受检异常未必回滚。确实需要受检异常触发回滚时：

```java
@Transactional(rollbackFor = IOException.class)
public void importData() throws IOException {
    // 同一业务事务的数据库写入
}
```

根据业务制定规则，不是所有场景都强制 `rollbackFor = Exception.class`。更具体规则、noRollbackFor、框架版本/全局设置可能影响行为。文件解析等耗时操作尽量在数据库事务前完成，文件写入也不由数据库事务直接管理。

### 4. 方法是否真的可被代理

公开 Service 方法是便于调用与测试的推荐边界。Spring 6 默认的类代理可以支持可代理的 protected/包可见方法；JDK 接口代理依赖公开接口方法。private 不能通过普通代理拦截，类代理的 final 类/方法也有限制，具体还受事务属性配置影响。

“非 public 一律不生效”是缺少版本/代理类型前提的说法。由容器创建对象、正确调用代理和真实结果，比单看可见性更重要。

### 5. 手动 new 与多线程

手动创建 Service 通常没有容器代理。传统 JDBC 事务资源与线程绑定，新线程/异步任务不会自动继承原线程事务；它可以拥有独立事务，但不能因此期望外层统一回滚。

需要异步写入时设计持久任务/事件、幂等与补偿，避免在一组要求原子的本地修改中随意跨线程。响应式事务使用不同上下文模型，本页的 ThreadLocal 解释限定传统 JDBC/MyBatis 场景。

### 6. 数据源、存储引擎与资源不一致

确认事务管理器、数据源、连接与 Mapper 绑定关系；多数据源不能因为方法上有一个注解就自动组成原子事务。MySQL 表使用支持事务的引擎，DDL 还可能隐式提交，不能把全部数据库语句都当作同一种可回滚修改。

## 四、进阶使用：传播行为按业务结果选择

| 行为 | 基本含义 | 失败结果要验证 |
|---|---|---|
| REQUIRED | 没有事务则创建，有则参与 | 参与同一事务的失败/rollback-only 影响整体 |
| REQUIRES_NEW | 挂起外层，创建独立事务 | 内层已提交不随外层回滚；会额外占用连接 |
| NESTED | 支持时使用保存点等嵌套语义 | 实际支持取决于管理器与资源，不等于独立提交 |
| NOT_SUPPORTED | 挂起事务，以非事务方式执行 | 写入不受外层原子回滚保证 |
| SUPPORTS | 有事务则参与，无则不创建 | 同一方法在不同调用路径下行为不同 |
| MANDATORY / NEVER | 要求已有事务 / 禁止已有事务 | 条件不满足应明确失败 |

先画出想要的提交/回滚结果，再选传播。例如独立保存操作痕迹是否应该在主业务失败后保留，必须是业务决定，不因为“审计”就自动使用 REQUIRES_NEW。

## 五、排错与优化

1. 列出所有必须一起变化的数据和外部副作用。
2. 确认被外部调用的方法、容器 Bean 和代理路径。
3. 查看实际异常、catch、回滚规则与 rollback-only。
4. 确认数据源、管理器、存储引擎和线程。
5. 用异常注入和真实查询验证最终数据，必要时在开发环境打开事务日志。
6. 检查耗时、锁等待、连接池和大批次，缩短事务边界后用相同场景回归。

不要在事务内等待慢 RPC、上传或人工操作。事务 timeout/readOnly 的执行效果受底层支持影响，readOnly 也不能作为安全授权或一律禁止写入的保证。单纯扩大连接池不能修复长事务。

## 六、最后深入：为何代理与连接管理产生这些行为

传统声明式事务通常经过 Spring AOP 的事务拦截器，根据方法属性选择事务管理器、建立或参与事务，将资源与执行上下文关联。业务方法使用相同资源执行；返回或抛异常后，拦截器按规则提交/回滚并清理资源。

这解释了容器代理、调用路径、异常边界、传播与线程的重要性。了解机制前先通过实验确认哪些行已提交、哪些回滚；不要把实现术语当作结果证明。

## 七、面试从使用到深入

| 基础问题 | 场景追问 | 原理和边界 |
|---|---|---|
| Transactional 解决什么问题？ | 两条写入第二条失败怎样验证？ | 同一事务资源和最终数据 |
| 默认什么异常回滚？ | catch 或受检异常呢？ | 规则与 rollback-only，不能给绝对结论 |
| 自调用有什么影响？ | 外层已经有事务呢？ | 不新增被调用方法属性，仍可能参与外层 |
| public 为什么常被推荐？ | protected、private、final 呢？ | Spring 版本和代理类型 |
| REQUIRED/REQUIRES_NEW 怎么选？ | 内层成功外层失败怎么办？ | 同一/独立物理事务与连接代价 |
| 子线程是否参与？ | MQ/HTTP 成功能回滚吗？ | 资源边界、可靠事件与补偿 |
| 接口有注解就可靠吗？ | 两个用户同时编辑呢？ | 事务之外仍需归属、条件更新和业务约束 |

对应数据库行为继续读 [事务隔离与 MVCC 实验](/doc/MySQL/MySQL事务隔离与MVCC原理)，先做双会话观察，再深入版本链与锁。
