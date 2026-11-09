---
title: MQ消息队列与延迟任务实战
---

# MQ消息队列与延迟任务实战

## 🎯 招聘面试核心考点
- **面试官设问**：“电商系统中，用户下单后 30 分钟未付款，订单如何自动取消并回退库存？”
- **深水区追问**：“为什么不能用定时任务 `cron` 轮询数据库扫表？RabbitMQ 如何通过 **TTL + 死信交换机（DLX）** 实现延迟队列？消息消费如何保证**幂等性**（防止重复扣款/重复发货）？如何保证消息在传递中 **100% 不丢失**？”

---

## 🏢 真实生产业务场景
- **外卖/电商订单 30 分钟超时关单**：美团、淘宝超时取消订单释放库存。
- **支付异步回调履约通知**：微信/支付宝异步通知商家服务，如果商家未返回 SUCCESS，按梯度（15s/3m/10m）延迟重试通知。
- **高并发下单秒杀削峰解耦**：将下单请求丢入 MQ，后端平滑限速消费入库。

---

## ⚙️ 为什么不能用定时任务轮询扫表？

1. **时效性差**：若定时任务每 5 分钟执行一次，订单可能在第 34 分钟才被关闭，产生高达 4 分钟的延迟。
2. **数据库灾难**：每次扫表 `WHERE status = 0 AND create_time < NOW() - 30m`，在百万大表下即便建了索引也是高开销的慢查询，持续消耗数据库 CPU。

---

## 💻 最小可运行 MVP 代码：RabbitMQ 延迟队列实现订单自动关闭

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

### 消费者与幂等性消费逻辑
```java
@Component
public class OrderReleaseListener {

    @RabbitListener(queues = RabbitMqDelayConfig.ORDER_RELEASE_QUEUE)
    public void handleOrderRelease(String orderSn) {
        System.out.println("[MQ 收到延迟关单通知] 订单号: " + orderSn);

        // 核心：消费幂等性保证
        // 1. 查询订单当前最新状态
        Order order = mockFindOrder(orderSn);
        
        // 2. 状态机校验：仅当状态依然为“待支付（UNPAID）”时才执行取消与库存回退
        if (order != null && "UNPAID".equals(order.getStatus())) {
            mockCancelOrder(orderSn);
            mockRestoreStock(order.getProductId(), order.getCount());
            System.out.println("订单 " + orderSn + " 超时未支付，已安全关闭并回退库存！");
        } else {
            System.out.println("订单 " + orderSn + " 已支付或已处理，直接幂等忽略。");
        }
    }

    private Order mockFindOrder(String sn) { return new Order(sn, "UNPAID", 101L, 2); }
    private void mockCancelOrder(String sn) {}
    private void mockRestoreStock(Long productId, Integer count) {}

    static class Order {
        String sn; String status; Long productId; Integer count;
        public Order(String s, String st, Long p, Integer c) { sn=s; status=st; productId=p; count=c; }
        public String getStatus() { return status; }
        public Long getProductId() { return productId; }
        public Integer getCount() { return count; }
    }
}
```

---

## ⚠️ 消息 100% 不丢失与幂等性全景图（面试必杀绝招）

1. **生产端不丢消息**：
   - 开启 `confirm-type: correlated` 异步确认回调，感知消息是否到达 Broker。
   - 开启 `returns-callback`，感知无法路由到队列的异常消息。
2. **Broker 队列不丢消息**：
   - 交换机持久化（`durable: true`）、队列持久化、消息实体持久化（`deliveryMode: 2`）。
   - 集群镜像队列（Mirror Queue）或 Quorum 仲裁队列，防单点硬件故障。
3. **消费端不丢消息**：
   - 关闭自动 ACK，开启 **手动 ACK（`acknowledge-mode: manual`）**，只有在业务执行完毕且数据库事务提交后才发送 `basicAck`。
4. **防重复消费（幂等性）**：
   - **方案 1（状态机约束）**：`UPDATE orders SET status = 'CANCEL' WHERE order_sn = ? AND status = 'UNPAID'`，通过受影响行数防重。
   - **方案 2（防重 Token / 唯一键）**：消费前 `setnx order:consumed:sn`，若已存在则直接丢弃。
