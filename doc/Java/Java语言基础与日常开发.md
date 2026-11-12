---
title: Java 语言基础与日常开发
---

# Java 语言基础与日常开发

## 解决什么问题

Java 基础用于正确表达业务数据、集合处理、异常和资源释放。能用 List、Map、类和接口完成业务后，再进入集合源码、JMM 和 JVM。

## 基本使用：一个可运行的订单汇总

使用 JDK 17 或更高版本，把代码保存为 `OrderSummary.java`，执行 `javac OrderSummary.java` 和 `java OrderSummary`。

```java
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class OrderSummary {
    record Order(String userId, BigDecimal amount) {}
    public static void main(String[] args) {
        List<Order> orders = List.of(
            new Order("u1", new BigDecimal("10.10")),
            new Order("u1", new BigDecimal("2.20")),
            new Order("u2", new BigDecimal("3.00")));
        Map<String, BigDecimal> totals = orders.stream().collect(
            Collectors.toMap(Order::userId, Order::amount, BigDecimal::add));
        if (totals.get("u1").compareTo(new BigDecimal("12.30")) != 0) {
            throw new AssertionError(totals);
        }
        System.out.println(totals); // 遍历次序不作保证
    }
}
```

这里先学习数据建模、集合和金额。record 的组件引用不能重新赋值，里面如果存可变对象仍需防御性复制。金额使用字符串构造 BigDecimal，计算和舍入规则由业务规定。

## 日常开发必须掌握

| 知识 | 基本使用 | 场景与边界 |
|---|---|---|
| 基本类型与包装类 | int / long / Integer | 自动拆箱 null 会 NPE；金额不能用浮点近似 |
| String | equals 比内容；StringBuilder 拼接循环文本 | String 不可变；引用相等不等于业务相等 |
| 类、接口、继承 | 接口描述能力，组合组织实现 | 不为复用几行代码制造复杂继承；理解重载与重写 |
| 泛型 | `List<Order>`、`Map<String, Order>` | 泛型不变性；`? extends` 读、`? super` 写有类型限制 |
| 集合 | List 有序、Set 去重、Map 查找 | HashMap 无顺序保证、非线程安全；键应有稳定 equals/hashCode |
| 异常 | 捕获可处理异常，否则传播并保留 cause | 不吞异常；finally 的 return 会覆盖原结果或异常 |
| 资源 | try-with-resources | 流、连接必须关闭或归还；不要依赖 GC 释放外部资源 |
| 时间 | Instant、LocalDateTime、ZoneId | 本地日期时间不携带时区；跨系统记录明确时区 |
| Stream | map/filter/groupingBy | 惰性操作需终止操作；不能随意 parallelStream 访问共享状态 |
| I/O 与序列化 | 明确编码、大小和格式 | JSON 外部输入要校验；不接受任意不可信 Java 原生反序列化 |

## 常见使用：文件读取与异常

```java
try (var reader = java.nio.file.Files.newBufferedReader(
        java.nio.file.Path.of("orders.csv"), java.nio.charset.StandardCharsets.UTF_8)) {
    String line;
    while ((line = reader.readLine()) != null) {
        // 逐行解析并校验，不把大文件一次性读入内存
    }
} catch (java.io.IOException e) {
    throw new IllegalStateException("读取订单失败", e);
}
```

Java 传递的始终是值；对象参数传递的是引用值的副本，改对象内容能被调用方观察，重绑形参不能替换调用方变量。`==` 对引用比较对象身份，不应解释成可观察的物理内存地址。

## 工程基本使用

先会读 pom.xml、依赖作用域、构建日志和配置。Maven 项目通常使用 Wrapper 执行 `./mvnw test`、`./mvnw package`；没有 Wrapper 时按项目工具链运行 Maven。排错顺序是编译错误 → 启动配置 → 接口行为 → 数据写入 → 性能，避免一看到报错就调 JVM 参数。

## 面试从基础到深入

| 基础题 | 场景追问 | 再深入 |
|---|---|---|
| equals 与 == 区别？ | HashMap 为什么取不到逻辑相同的 key？ | hashCode 契约、可变 key、哈希冲突 |
| ArrayList/HashMap 怎么用？ | 去重、有序、并发分别选什么？ | 扩容和复杂度，再看 [集合源码](/doc/Java/Java基础与集合源码) |
| checked/unchecked 异常怎么处理？ | 服务失败如何保留原因？ | 统一异常映射、日志和事务回滚 |
| 接口与抽象类怎么选？ | 如何替换支付渠道便于测试？ | 多态、组合、依赖注入，而后看 Spring |
| 线程任务怎么等待？ | 怎么处理超时与取消？ | Future、线程池、锁和 [JMM](/doc/Java/JMM并发编程与线程池) |

练习：为订单汇总加空列表、重复用户、非法金额、空值和大文件分批处理测试。随后进入 [Spring Boot 业务开发](/doc/Java/SpringBoot业务开发实战入门)。
