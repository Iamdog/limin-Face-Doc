---
title: AOP底层原理与三级缓存
---

# AOP底层原理与三级缓存

## 1. JDK 动态代理 vs CGLIB 深度比对

### 底层差异
- **JDK 动态代理**：
  - 生成类 `$Proxy0`，直接继承了 `java.lang.reflect.Proxy`。
  - 由于 Java 单继承限制，JDK 动态代理**必须基于接口**。
- **CGLIB 动态代理**：
  - 使用底层 ASM 字节码技术生成目标类的**子类**。
  - **局限**：不能代理 `final` 类（无法继承）和 `final` 方法（无法重写）。

### 原生 JDK 动态代理验证代码
```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

interface PaymentService {
    void pay(double amount);
}

class PaymentServiceImpl implements PaymentService {
    @Override
    public void pay(double amount) {
        System.out.println("-> 执行支付扣款: " + amount);
    }
}

public class ProxyVerify {
    public static void main(String[] args) {
        PaymentService target = new PaymentServiceImpl();

        PaymentService proxy = (PaymentService) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            new InvocationHandler() {
                @Override
                public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                    System.out.println("[前置通知] 校验账户余额与风控规则");
                    Object result = method.invoke(target, args);
                    System.out.println("[后置通知] 记录账单日志并发送消息通知");
                    return result;
                }
            }
        );

        proxy.pay(100.0);
        System.out.println("代理类 Class: " + proxy.getClass().getName()); // 输出: com.sun.proxy.$Proxy0
    }
}
```

---

## 2. Spring 单例 Bean 循环依赖与三级缓存

### 三级缓存定位
1. **`singletonObjects`（一级缓存）**：存放完全初始化好的成熟 Bean。
2. **`earlySingletonObjects`（二级缓存）**：存放提前暴露的半成品 Bean（属性尚未注入完成）。
3. **`singletonFactories`（三级缓存）**：存放 `ObjectFactory<?>` 函数式接口，用于延迟生成 **AOP 动态代理对象**。

### 为什么二级缓存不够，必须有第三级缓存？
如果只使用二级缓存，Spring 在创建 Bean 实例后就必须**立刻**为所有对象生成 AOP 代理。
这破坏了 Spring 标准的生命周期设计原则（**在属性填充完成后、在初始化最后阶段通过 `BeanPostProcessor` 生成代理**）。
三级缓存通过暴露函数工厂实现了**惰性求值**：只有真正发生循环依赖时，才通过三级缓存提前生成代理并放入二级缓存；若没有循环依赖，对象依然遵循原生的标准生命周期流程。
