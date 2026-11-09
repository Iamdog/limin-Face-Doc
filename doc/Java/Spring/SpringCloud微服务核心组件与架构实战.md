---
title: SpringCloud微服务核心组件与架构实战
---

# SpringCloud微服务核心组件与架构实战

## 🎯 招聘面试核心考点
- **面试官设问**：“主流微服务架构（Spring Cloud Alibaba）的核心五大组件是什么？Nacos 是如何实现**服务注册、健康检查与 AP / CP 动态切换**的？”
- **深水区追问**：“使用 **OpenFeign** 进行微服务内部调用时，**前端传过来的 Authorization Token 是如何透传给下游服务的**？**Spring Cloud Gateway** 为什么比 Zuul 性能高数倍？如何编写全局 JWT 鉴权 Filter？高并发下微服务发生**级联雪崩**如何用 **Sentinel** 熔断隔离？**分布式事务 Seata 的 AT 模式**底层是如何通过 Undo Log 自动生成反向回滚补偿的？”

---

## 一、 Spring Cloud Alibaba 工业级微服务架构全景

```text
                                [客户端 / 移动端 / Web]
                                          │ HTTPS
                                          ▼
                      ┌──────────────────────────────────────┐
                      │    Spring Cloud Gateway (统一网关)    │
                      │    (Netty 反应式 / 鉴权 / 动态路由分发) │
                      └──────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼ OpenFeign 负载均衡    ▼                       ▼
        ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
        │  用户服务 (User)  │    │  订单服务 (Order) │    │  库存服务 (Stock)│
        └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
                 │                       │                       │
                 └───────────────────────┴───────────────────────┘
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        │                        微服务基础支撑中枢                        │
        │  • 注册与配置中心: Nacos (服务发现 + 动态刷新)                   │
        │  • 分布式流控与容错: Sentinel (熔断降级 + QPS限流)               │
        │  • 分布式事务协调器: Seata TC (AT 模式两阶段提交)                 │
        │  • 分布式链路追踪: SkyWalking / OpenTelemetry (全链路 TraceId)  │
        └─────────────────────────────────────────────────────────────────┘
```

---

## 二、 核心组件深度机制与选型对比

### 1. 注册与配置中心：Nacos（AP 与 CP 模型剖析）

| 注册中心 | 默认模式 | CAP 定位 | 心跳与健康检查机制 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **Nacos** | **AP 模式（临时实例）**<br>可动态切换为 CP | **AP / CP 双模型支持** | 客户端主动每 5 秒发送一次心跳，15 秒无响应标记异常，30 秒剔除 | **现代微服务首选**（高可用与配置一体化） |
| **Eureka** | AP 模式 | **AP**（保可用性） | 客户端定时心跳续约，具备自我保护机制 | 早期 Netflix 体系（现已停止迭代） |
| **ZooKeeper** | CP 模式 | **CP**（保一致性） | 基于 ZAB 协议，Leader 选举期间集群对外不可用 | 强一致性协调服务（不适合万级微服务） |

- **为什么微服务注册中心必须偏向 AP？**
  - 服务实例的暂时状态不一致，不会直接阻断业务访问（客户端有缓存负载均衡兜底）；若为了强一致性（CP）在节点网络分区时暂停服务发现，会导致全网级业务瘫痪。

---

### 2. 跨微服务调用：OpenFeign 请求头 Token 透传拦截器（MVP）

#### 生产深坑：Feign 内部调用丢失用户上下文
- **现象**：网关在验证完用户 Token 后，将请求转发给订单服务 A；订单服务 A 通过 OpenFeign 调用库存服务 B，库存服务 B 从 Request Header 中拿不到 Authorization，直接返回 401 未登录！
- **原因**：OpenFeign 底层发起的是全新的 HTTP 请求，**默认不会继承上一级的 RequestContext**！

#### 生产解决方案：实现 `RequestInterceptor` 请求拦截器
```java
import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import javax.servlet.http.HttpServletRequest;

@Component
public class FeignAuthRequestInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        // 从当前线程的 ThreadLocal 中抓取主请求的 Servlet 属性
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String token = request.getHeader("Authorization");
            if (token != null) {
                // 将原始请求头传递给即将发起的 Feign 内部请求
                template.header("Authorization", token);
                template.header("X-Trace-Id", request.getHeader("X-Trace-Id"));
            }
        }
    }
}
```

---

### 3. 微服务网关：Spring Cloud Gateway 全局鉴权 Filter（MVP）

Spring Cloud Gateway 底层基于 **Spring WebFlux 与 Netty 异步反应式编程**，单机吞吐量远超基于传统 Servlet 阻塞模型的 Zuul 1.x。

```java
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class GlobalAuthFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. 白名单直接放行
        if (path.startsWith("/api/auth/login") || path.startsWith("/public/")) {
            return chain.filter(exchange);
        }

        // 2. 检查 Header 中的 Token
        String token = request.getHeaders().getFirst("Authorization");
        if (token == null || !isValidJwt(token)) {
            // 401 拦截拒绝
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // 3. 将解析出的用户 ID 注入微服务内部专属请求头
        ServerHttpRequest mutatedRequest = request.mutate()
            .header("X-User-Id", parseUserIdFromToken(token))
            .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() { return -1; } // 优先级最高

    private boolean isValidJwt(String t) { return true; }
    private String parseUserIdFromToken(String t) { return "1001"; }
}
```

---

### 4. 分布式事务：Seata AT 模式底层运行原理（2PC）

#### 为什么不需要业务手写两阶段确认？
Seata AT 模式是无侵入式分布式事务：
1. **阶段一（准备阶段）**：
   - 业务 SQL 执行前，Seata 自动拦截并查询记录并保存为 **Before Image（前镜像）**。
   - 执行业务更新 SQL。
   - 查询更新后的记录保存为 **After Image（后镜像）**。
   - 生成 **Undo Log 记录** 并随业务 SQL 在同一个本地事务中提交入库。
2. **阶段二（提交/回滚阶段）**：
   - **全局提交**：分布式事务协调器（TC）下发 Commit 命令，各分支服务仅需**异步批量删除 Undo Log 记录**，极度迅速。
   - **全局回滚**：TC 下发 Rollback 命令，分支服务通过对比 After Image 与当前数据库数据（防止脏写），直接利用 Before Image **自动生成反向回滚补偿 SQL**，还原数据！

```java
// 生产业务使用：零侵入代码
@GlobalTransactional(name = "create-order-tx", rollbackFor = Exception.class)
public void createOrder(OrderParam param) {
    orderService.saveOrder(param);         // 1. 本地生成订单
    storageFeignClient.deductStock(param);  // 2. 远程扣减库存
    accountFeignClient.deductBalance(param);// 3. 远程扣减余额
    // 任意一步抛出异常，Seata 协调器自动全量反向补偿回滚！
}
```
