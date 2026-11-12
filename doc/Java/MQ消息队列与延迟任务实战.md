---
title: MQ消息队列与延迟任务实战
---

# MQ消息队列与延迟任务实战

## 使用入口：先解决问题，再做验证

异步处理和到期关单，让前台请求不必等待所有后续工作。

**先做基本操作**：先运行 Broker、声明队列并完成发送/消费，验证重复消息与业务回滚，再选择 TTL/DLX 和可靠性策略。完整前置实践见[基础入口](/doc/Java/Kafka与RocketMQ生产级接入实战)。

**再逐步深入**：用途与基本 API → 场景与失败 → 原理/源码 → 取舍与验证。

## 🎯 核心技术原理与实战归纳
- **核心设问与思考**：“电商系统中，用户下单后 30 分钟未付款，订单如何自动取消并回退库存？”
- **深水区追问**：“什么时候选择定时扫描，什么时候引入延迟消息？RabbitMQ 如何通过 **TTL + 死信交换机（DLX）** 实现延迟队列？消息消费如何保证**幂等性**（防止重复扣款/重复发货）？如何在明确故障模型下提高消息可靠性并处理补偿？”

---

## 🏢 真实生产业务场景
- **外卖/电商订单 30 分钟超时关单**：美团、淘宝超时取消订单释放库存。
- **支付异步回调履约通知**：微信/支付宝异步通知商家服务，如果商家未返回 SUCCESS，按梯度（15s/3m/10m）延迟重试通知。
- **高并发下单秒杀削峰解耦**：将下单请求丢入 MQ，后端平滑限速消费入库。

---

## ⚙️ 先选择：定时扫描还是延迟消息？

低吞吐、允许一定延迟的任务可以用到期时间索引、有限批次和条件更新扫描；不应把所有轮询都说成数据库灾难。需要更多异步解耦或统一重试时再评估延迟消息。TTL/DLX 的触发不是精确时钟，混合消息 TTL 还可能遇到队头处理延迟，关单消费者仍需检查真实到期时间、支付状态和幂等。

---

## 💻 Spring AMQP 配置与关单流程示例

### 架构设计原理：TTL + 死信交换机（DLX）
- 订单生成后，投递到 **延迟队列（无消费者监听）**，设置消息存活时间（TTL）为 30 分钟。
- 30 分钟到期后，消息变成“死信（Dead Letter）”。
- RabbitMQ 自动将死信路由到绑定的 **死信交换机（DLX）**，最终进入 **取消订单真实队列**，被取消订单消费者监听处理。

```java
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMqDelayConfig {

    public static final String ORDER_DELAY_QUEUE = "order.delay.queue";
    public static final String ORDER_EVENT_EXCHANGE = "order.event.exchange";
    public static final String ORDER_RELEASE_QUEUE = "order.release.queue";
    public static final String ORDER_RELEASE_KEY = "order.release.key";

    // 1. 延迟队列（死信发生地：不配置消费者）
    @Bean
    public Queue orderDelayQueue() {
        Map<String, Object> args = new HashMap<>();
        // 绑定死信交换机
        args.put("x-dead-letter-exchange", ORDER_EVENT_EXCHANGE);
        // 绑定死信 RoutingKey
        args.put("x-dead-letter-routing-key", ORDER_RELEASE_KEY);
        // 设置消息 TTL 为 10 秒（测试演示设为 10s，生产为 30 * 60 * 1000）
        args.put("x-message-ttl", 10000);
        return new Queue(ORDER_DELAY_QUEUE, true, false, false, args);
    }

    // 2. 真实死信消费队列（有消费者）
    @Bean
    public Queue orderReleaseQueue() {
        return new Queue(ORDER_RELEASE_QUEUE, true, false, false);
    }

    // 3. 事件交换机
    @Bean
    public DirectExchange orderEventExchange() {
        return new DirectExchange(ORDER_EVENT_EXCHANGE, true, false);
    }

    // 4. 绑定死信路由
    @Bean
    public Binding orderReleaseBinding() {
        return BindingBuilder.bind(orderReleaseQueue()).to(orderEventExchange()).with(ORDER_RELEASE_KEY);
    }
}
```

### 基本使用：投递与幂等关单

前面的配置片段需要 Spring Boot AMQP 依赖、RabbitMQ 连接和正常运行的 Broker。可以使用 `RabbitTemplate.convertAndSend(ORDER_DELAY_QUEUE, orderSn)` 经默认交换机投递到已存在的延迟队列；使用 exchange/routingKey 时需配置相应绑定。

消费者的业务不能只“查未支付 → 取消 → 退库存”，因为并发消费者和支付回调可能交错。业务流程应为：

```text
接收 orderSn
→ 在业务事务中按状态和到期时间条件更新订单
→ 影响行数为 1 才执行同事务的库存恢复
→ 提交成功后确认消息
→ 异常回滚并按策略重试/进入死信
```

跨服务库存不在同一事务时，改为可靠事件和幂等库存接口，并补偿对账。Redis 中提前写“已消费”后业务失败，会让重试误以为已经完成，不能作为单独的可靠幂等方案。

---

## ⚠️ 可靠投递、幂等与补偿

1. **生产端可靠投递**：
   - 开启 `confirm-type: correlated` 异步确认回调，感知消息是否到达 Broker。
   - 配置 publisher returns，并启用 mandatory，感知无法路由的消息；生产库和消息之间仍需 outbox 等解决事务间隙。
2. **Broker 持久化与副本保障**：
   - 交换机持久化（`durable: true`）、队列持久化、消息实体持久化（`deliveryMode: 2`）。
   - 按受支持版本评估 Quorum 仲裁队列及其可靠性设置；经典镜像队列属于旧方案，RabbitMQ 4.x 已移除。默认死信转发不能直接当作可靠投递保证，需要核对队列类型与相关策略。
3. **消费成功确认与失败恢复**：
   - 关闭自动 ACK，开启 **手动 ACK（`acknowledge-mode: manual`）**，只有在业务执行完毕且数据库事务提交后才发送 `basicAck`。
4. **防重复消费（幂等性）**：
   - **方案 1（状态机约束）**：`UPDATE orders SET status = 'CANCEL' WHERE order_sn = ? AND status = 'UNPAID'`，通过受影响行数防重。
   - **方案 2（消费记录唯一键）**：业务修改和消费记录在同一数据库事务提交；唯一键冲突时判断已完成结果，不仅依赖消费前的 Redis 标记。


## 面试从使用到原理

先讲生产者、队列、消费者如何接入并验证，再讲订单到期与支付竞争、失败重试和幂等，最后解释 confirm、ACK、持久化和死信边界。至少测试重复消息、业务回滚、支付同时到达、Broker 不可用和消费积压；“消息已发送”不等于“业务已完成”。
