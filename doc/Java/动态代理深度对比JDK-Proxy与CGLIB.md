---
title: 动态代理深度对比：JDK Proxy 与 CGLIB
description: 拆解 JDK 动态代理 $Proxy0 字节码生成机制与单继承限制，剖析 CGLIB 的 ASM 字节码生成与 FastClass 机制，分析 Spring 默认选型演进。
---

# 动态代理深度对比：JDK Proxy 与 CGLIB

动态代理（Dynamic Proxy）是 Spring AOP、RPC 远程调用、声明式事务（`@Transactional`）、监控告警框架（如 SkyWalking、Arthas）的灵魂所在。

而在社招面试中，“JDK 动态代理与 CGLIB 有什么区别？为什么 JDK 动态代理只能代理接口？CGLIB 是如何避免反射调用的？Spring Boot 为什么在 2.x 之后默认切换为了 CGLIB？”是必须彻底答透的核心高频问题。

---

## 1. JDK 动态代理底层架构与 `$Proxy0` 字节码拆解

JDK 动态代理是 Java 官方内置的机制，核心由 `java.lang.reflect.Proxy` 和 `InvocationHandler` 协同实现。

### 1.1 核心调用代码
```java
UserService target = new UserServiceImpl();
UserService proxyInstance = (UserService) Proxy.newProxyInstance(
    target.getClass().getClassLoader(),
    target.getClass().getInterfaces(), // 必须提供目标接口
    new InvocationHandler() {
        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            System.out.println("--- 前置增强 ---");
            Object result = method.invoke(target, args);
            System.out.println("--- 后置增强 ---");
            return result;
        }
    }
);
```

### 1.2 核心深水区：为什么 JDK 动态代理只能代理接口，不能代理普通类？
很多同学只能背出“规范规定只能传接口”，但底层原因在字节码层面是一清二楚的：

通过设置系统属性 `saveGeneratedFiles=true`，将 JVM 在内存中动态生成的字节码保存并反编译后，可以看到生成的代理类真实面貌：
```java
// 动态生成的代理类 $Proxy0 源码反编译伪代码：
public final class $Proxy0 extends Proxy implements UserService {
    private static Method m3; // 缓存的 doSomething 方法

    public $Proxy0(InvocationHandler h) {
        super(h); // 将 InvocationHandler 传递给父类 Proxy
    }

    @Override
    public final void doSomething() {
        try {
            // 所有方法调用，统统委托给 InvocationHandler.invoke()!
            super.h.invoke(this, m3, null);
        } catch (Throwable t) { ... }
    }
}
```

#### 答案彻底浮出水面：
- Java 语言规定：**类只支持单继承，但可以实现多个接口**。
- JVM 动态生成代理类时，**已经强制显式继承了 `java.lang.reflect.Proxy` 基类**！
- 由于单继承法则，该代理类**绝对无法再继承任何其他业务类**，它唯一能够与目标业务类型产生多态关联的途径，就是**实现目标类的业务接口**！

---

## 2. CGLIB 动态代理底层架构与 FastClass 机制

针对没有接口的普通类，第三方库 **CGLIB（Code Generation Library）** 提供了基于**类继承**的动态代理方案。

### 2.1 CGLIB 核心机制
- CGLIB 底层基于极其强大的轻量级 Java 字节码操作框架 **ASM**。
- 它在运行期间动态构建目标类的一个**子类**（如 `UserService$$EnhancerByCGLIB$$...`），并重写其中的非 `final` 方法。
- **限制**：被 `final` 修饰的类无法被继承，被 `final` 修饰的方法无法被重写，因此 **CGLIB 无法代理任何 `final` 类或 `final` 方法**！

---

### 2.2 CGLIB 的性能杀手锏：FastClass 机制（避免反射）
在 CGLIB 的拦截器 `MethodInterceptor` 中：
```java
public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
    // 推荐做法：调用 proxy.invokeSuper()
    return proxy.invokeSuper(obj, args); 
}
```

#### 为什么 `proxy.invokeSuper()` 效率极高？
JDK 动态代理在拦截器中最终还是通过 `Method.invoke()` 反射调用目标方法。而 CGLIB 引入了 **FastClass 机制**：
- CGLIB 在生成代理子类的同时，还会为目标类和代理类分别生成一个 `FastClass` 索引类（例如 `UserService$$FastClassByCGLIB$$...`）。
- 该索引类内部维护了一个 `switch-case` 表，**为目标类的每个方法分配一个唯一的整型索引编号（Index）**：
  ```java
  // FastClass 内部伪代码：
  public Object invoke(int index, Object obj, Object[] args) {
      switch (index) {
          case 0: return ((UserService)obj).doSomething();
          case 1: return ((UserService)obj).anotherMethod((String)args[0]);
      }
      throw new IllegalArgumentException();
  }
  ```
- **核心飞跃**：当执行 `proxy.invokeSuper()` 时，CGLIB 直接通过整数索引在 `switch-case` 中**直接发起原生的 Java 方法调用，完全彻底规避了反射开销**！

---

## 3. 全维度对比与 Spring Boot 默认选型演进

| 对比维度 | JDK 动态代理 | CGLIB 动态代理 |
|:---|:---|:---|
| **技术基石** | Java 官方反射机制与 `$Proxy0` 动态类加载 | 第三方 ASM 字节码操作框架 |
| **代理目标要求** | **必须有接口**（只能代理接口中的方法） | **代理目标类本身**（不能为 `final` 类/方法） |
| **代理类生成速度** | 较快（生成结构简单的轻量类） | 较慢（需要生成子类及两个 FastClass 索引类） |
| **运行期调用性能** | 早期依赖反射调用较慢，现代 JDK 优化后大幅拉近 | **依靠 FastClass 直接调用，调用性能极佳** |
| **内存占用** | 极小 | 稍大（生成的类文件较多） |

---

### 3.3 为什么 Spring Boot 2.x 将 AOP 默认代理策略从 JDK 切换为 CGLIB？
在 Spring 早期（Spring 5.x 之前 / Spring Boot 1.x 中）：
- 如果目标类实现了接口，默认走 JDK 动态代理；如果没有实现接口，才退化为 CGLIB。
- **痛点与 Bug**：
  许多业务开发人员习惯在 Controller 或 Service 中使用具体实现类进行 `@Autowired` 依赖注入：
  ```java
  @Autowired
  private UserServiceImpl userService; // 依赖具体实现类注入
  ```
  如果 Spring 默认采用 JDK 动态代理，容器中生成的代理对象类型是 `$Proxy0`（实现了 `UserService` 接口，但与 `UserServiceImpl` 是平级兄弟关系，毫无继承关系！）。这会导致 Spring 在启动时直接抛出极其让人头疼的 **`BeanNotOfRequiredTypeException`**！
- **Spring Boot 2.x 的决断**：
  官方直接将配置 `spring.aop.proxy-target-class` 默认设为 **`true`**，**统一强制使用 CGLIB 生成基于目标实现类的子类代理**！无论是注入接口还是注入具体类，全部可以通用注入成功，极大降低了团队心智负担与排错成本。
