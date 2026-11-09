---
title: Spring核心与事务失效实战
---

# Spring核心与事务失效实战

## 1. `@Transactional` 事务失效场景与代码复现

### 核心机制
Spring 声明式事务基于 **AOP 动态代理**。只有外部通过 **代理对象（Proxy）** 调用目标方法时，事务拦截器（`TransactionInterceptor`）才能在目标方法执行前后开启、提交或回滚事务。

如果在同一个类内部，方法 A 直接调用方法 B（`this.methodB()`），此时是**目标对象内部的原生调用**，根本没有经过代理对象，事务拦截器直接被跳过，导致事务失效！

### 实战代码复现与解决方案
```java
@Service
public class OrderService {

    @Autowired
    private OrderMapper orderMapper;
    
    // 方案一：自注入解决（延迟加载防循环依赖）
    @Autowired
    @Lazy
    private OrderService self;

    // 错误调用：直接调用内部事务方法，事务完全失效！
    public void createOrderWrong(Order order) {
        this.saveOrderInternal(order);
    }

    // 正确调用：通过代理对象调用，事务正常生效
    public void createOrderCorrect(Order order) {
        self.saveOrderInternal(order); 
        // 方案二：通过 AopContext.currentProxy() 强转获取当前代理对象
        // ((OrderService) AopContext.currentProxy()).saveOrderInternal(order);
    }

    @Transactional(rollbackFor = Exception.class)
    public void saveOrderInternal(Order order) {
        orderMapper.insert(order);
        if (order.getAmount() < 0) {
            throw new RuntimeException("金额非法，触发事务回滚！");
        }
    }
}
```

---

## 2. 事务失效的其他 4 大高频场景

1. **修饰非 `public` 方法**：
   - Spring 的 `AbstractFallbackTransactionAttributeSource` 源码中默认只支持 `public` 方法上的注解识别。
2. **异常被 `try-catch` 捕获吞噬**：
   - 如果业务逻辑捕获了异常且没有向外抛出，事务拦截器无法感知异常，仍会正常提交事务。
3. **异常类型不匹配（默认只回滚 RuntimeException）**：
   - 默认配置下，Spring 仅在遇到 `RuntimeException` 或 `Error` 时回滚。若抛出受检异常（如 `SQLException`、`IOException`），必须显式指定 `@Transactional(rollbackFor = Exception.class)`。
4. **数据库引擎不支持事务**：
   - 早期 MySQL 表若配置为 `MyISAM` 存储引擎，不支持 ACID 事务，任何事务注解均无效。
