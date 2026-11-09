---
title: MyBatis核心原理与插件实战
---

# MyBatis核心原理与插件实战

## 1. Mapper 接口没有实现类，调用时如何执行？

### 调用链路剖析
1. **启动注册**：Spring 容器启动解析 `@MapperScan`，为每个 Mapper 接口生成一个 `MapperFactoryBean`。
2. **动态代理**：MyBatis 底层通过 **JDK 动态代理** 创建出 `MapperProxy` 实例注入到 Spring 容器中。
3. **方法调用**：当执行 `userMapper.selectById(1)` 时，进入 `MapperProxy.invoke()`。
4. **定位 Statement**：根据“接口全类名 + 方法名”（如 `com.example.mapper.UserMapper.selectById`），到全局配置中定位对应的 `MappedStatement` 对象。
5. **底层执行**：委派给核心 `SqlSession` / `Executor`，通过 JDBC `PreparedStatement` 与数据库进行网络通信。

---

## 2. 插件拦截器（Interceptor）四大核心对象

MyBatis 允许使用插件织入拦截以下四大对象：
1. **`Executor`**：内部调度器，负责更新、查询、事务、缓存调度。
2. **`StatementHandler`**：负责 SQL 语句的预编译与设置。
3. **`ParameterHandler`**：负责将 Java 对象参数绑定映射到 PreparedStatement 的占位符。
4. **`ResultSetHandler`**：负责将 JDBC 返回的 `ResultSet` 结果集转换为 Java 领域模型实体。

---

## 3. 实战开发：慢 SQL 监控告警插件

### 代码实现
```java
import org.apache.ibatis.executor.statement.StatementHandler;
import org.apache.ibatis.plugin.*;
import java.sql.Connection;
import java.util.Properties;

// 拦截 StatementHandler 的 prepare 预编译阶段
@Intercepts({
    @Signature(
        type = StatementHandler.class,
        method = "prepare",
        args = {Connection.class, Integer.class}
    )
})
public class SlowSqlMonitorInterceptor implements Interceptor {

    private long slowThresholdMs = 1000; // 慢 SQL 阈值 1 秒

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long startTime = System.currentTimeMillis();
        try {
            return invocation.proceed(); // 放行执行
        } finally {
            long cost = System.currentTimeMillis() - startTime;
            if (cost > slowThresholdMs) {
                StatementHandler statementHandler = (StatementHandler) invocation.getTarget();
                String rawSql = statementHandler.getBoundSql().getSql();
                String cleanSql = rawSql.replaceAll("\\s+", " ");
                System.err.println(String.format("[慢SQL告警] 耗时: %d ms | 目标SQL: %s", cost, cleanSql));
            }
        }
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {}
}
```
