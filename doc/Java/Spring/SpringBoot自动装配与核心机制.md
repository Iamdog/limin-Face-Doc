---
title: SpringBoot自动装配与核心机制
---

# SpringBoot自动装配与核心机制

## 1. 自动装配全流程剖析

### 核心三步
1. **注解入口**：启动类上的 `@SpringBootApplication` 组合了核心注解 **`@EnableAutoConfiguration`**。
2. **扫描与导入**：
   - `@EnableAutoConfiguration` 内部通过 `@Import(AutoConfigurationImportSelector.class)` 注入选择器。
   - 读取配置文件：
     - **Spring Boot 2.x**：扫描所有依赖 Jar 包中的 `META-INF/spring.factories`。
     - **Spring Boot 3.x**：扫描 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`。
3. **条件装配过滤（按需加载）**：
   - 读取到的几百个自动配置类不会全部加载，而是通过 `@Conditional` 系列注解决定是否真正生效。

---

## 2. 常用条件注解（Conditional）

- **`@ConditionalOnClass`**：当前 Classpath 类路径下存在指定类时才装配（例如引入了 Redis 客户端依赖，才开启 RedisAutoConfiguration）。
- **`@ConditionalOnMissingBean`**：容器中不存在该类型的 Bean 时才生效（**开箱即用 + 允许开发者无缝覆盖**）。
- **`@ConditionalOnProperty`**：配置文件中配置了指定属性且值符合预期才生效。

---

## 3. 手写一个自定义 Starter 实战

### 结构
1. **`starter-autoconfig` 模块**：编写配置属性类 `@ConfigurationProperties` 和配置类 `@AutoConfiguration`。
2. **注册自动配置**：在 `resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 中填入你的配置类全类名。
3. 其他工程只需引入此 Starter 的 Maven 依赖，即可零配置直接使用注入的 Service 服务。
