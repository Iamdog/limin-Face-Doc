---
title: SQL与MyBatis映射实战全景对照
---

# SQL与MyBatis映射实战全景对照

在真实全栈开发中，单纯会写原生 SQL 还远远不够，**将 SQL 准确、优雅、无 Bug 地翻译为 MyBatis XML 动态模板** 是后端与数据库交互的基本功。

本篇采用 **“原生 SQL ➔ Java 实体类/Mapper 接口 ➔ MyBatis XML 模板 ➔ 避坑要点”** 逐一对照呈现，拿来即用！

---

## 对照 1：单表插入与主键自增自动回填

### 业务场景
创建新用户后，需要**立刻拿到数据库生成的自增主键 `id`**，以便继续生成用户配置记录或发送消息。

| 原生 SQL 语句 | MyBatis XML 映射写法 |
| :--- | :--- |
| ```sql<br>INSERT INTO `sys_user` (<br>  `username`, `email`, `created_time`<br>) VALUES (<br>  'zhangsan', 'test@qq.com', NOW()<br>);<br>``` | ```xml<br><!-- 核心：useGeneratedKeys="true" keyProperty="id" --><br><insert id="insertUser" <br>        useGeneratedKeys="true" <br>        keyProperty="id"><br>  INSERT INTO `sys_user` (<br>    `username`, `email`, `created_time`<br>  ) VALUES (<br>    #{username}, #{email}, NOW()<br>  )<br></insert><br>``` |

- **Java 调用端效果**：
  ```java
  User user = new User("zhangsan", "test@qq.com");
  userMapper.insertUser(user);
  // 执行完毕后，MyBatis 会自动把自增主键赋值给 user.id
  System.out.println("成功生成的数据库主键 ID: " + user.getId()); // 输出例如 1001
  ```

---

## 对照 2：批量插入（Batch Insert）

### 业务场景
数据同步或批量导入 500 条数据，单条循环插入耗时 10 秒，改成批量单条 SQL 仅需 100 毫秒。

### 1. 原生 SQL 语句
```sql
INSERT INTO `sys_user` (`username`, `email`, `status`)
VALUES 
  ('user_1', 'u1@test.com', 1),
  ('user_2', 'u2@test.com', 1),
  ('user_3', 'u3@test.com', 0);
```

### 2. MyBatis XML 映射写法
```xml
<insert id="batchInsertUsers">
  INSERT INTO `sys_user` (`username`, `email`, `status`)
  VALUES 
  <foreach collection="userList" item="item" separator=",">
    (#{item.username}, #{item.email}, #{item.status})
  </foreach>
</insert>
```
> **⚠️ 生产避坑军规**：单次 `foreach` 批量插入的数据量**建议控制在 500~1000 条**以内。如果一次性拼入数万条，会导致拼装出的 SQL 超出 MySQL 的 `max_allowed_packet`（默认通常 4MB/16MB）而直接报错崩溃。

---

## 对照 3：选择性动态更新（只更新非空字段）

### 业务场景
用户编辑资料时只修改了手机号，其他字段为 `null`。不能把数据库原有的头像、邮箱等字段给清空或覆盖掉。

### 1. 原生 SQL 期望结果
```sql
-- 当只有 phone 和 nickname 有值时：
UPDATE `sys_user` 
SET `phone` = '13800000000', `nickname` = '小张', `updated_time` = NOW() 
WHERE `id` = 1001;
```

### 2. MyBatis XML `<set>` 标签写法
```xml
<update id="updateUserSelective">
  UPDATE `sys_user`
  <!-- <set> 标签两大神效：自动拼接 SET 关键字，且自动去除尾部多余的逗号 ',' -->
  <set>
    <if test="username != null and username != ''">
      `username` = #{username},
    </if>
    <if test="nickname != null and nickname != ''">
      `nickname` = #{nickname},
    </if>
    <if test="phone != null and phone != ''">
      `phone` = #{phone},
    </if>
    `updated_time` = NOW()
  </set>
  WHERE `id` = #{id}
</update>
```

---

## 对照 4：管理后台多条件动态组合检索（模糊查询防注入）

### 业务场景
后台用户管理列表：前端可以传用户名关键字（支持模糊）、可以传状态下拉筛选、可以传注册开始时间与结束时间。条件均可选传。

### 1. 原生 SQL 期望结果
```sql
SELECT * FROM `sys_user`
WHERE `status` = 1 
  AND `username` LIKE CONCAT('%', '张', '%')
  AND `created_time` >= '2026-01-01'
ORDER BY `id` DESC;
```

### 2. MyBatis XML `<where>` 标签写法
```xml
<select id="queryUsersByCondition" resultType="com.example.entity.User">
  SELECT * FROM `sys_user`
  <!-- <where> 标签神效：有条件时自动插入 WHERE，并且自动剥离第一个条件最前面的 'AND' 或 'OR' -->
  <where>
    <if test="status != null">
      AND `status` = #{status}
    </if>
    <if test="keyword != null and keyword != ''">
      <!-- 严禁使用 '%${keyword}%' 字符串拼接，会导致 SQL 注入！必须使用 CONCAT 结合 #{} 预编译！ -->
      AND `username` LIKE CONCAT('%', #{keyword}, '%')
    </if>
    <if test="startTime != null">
      <!-- 特殊符号 < 和 <= 必须使用转义字符 &lt; 或 CDATA 包裹 -->
      AND `created_time` &gt;= #{startTime}
    </if>
    <if test="endTime != null">
      AND `created_time` &lt;= #{endTime}
    </if>
  </where>
  ORDER BY `id` DESC
</select>
```

---

## 对照 5：批量 IN 查询（批量主键获取）

### 1. 原生 SQL 语句
```sql
SELECT * FROM `sys_user` WHERE `id` IN (1001, 1002, 1003);
```

### 2. MyBatis XML 映射写法
```xml
<select id="selectUsersByIds" resultType="com.example.entity.User">
  SELECT * FROM `sys_user`
  WHERE `id` IN
  <foreach collection="ids" item="id" open="(" separator="," close=")">
    #{id}
  </foreach>
</select>
```

---

## 对照 6：复杂关联映射（1 对 1 与 1 对多全家桶）

### 业务场景：查询订单信息，同时关联查询出买家用户信息（1对1）和订单下的商品明细列表（1对多）

#### 1. 原生连表 SQL
```sql
SELECT 
  o.`id` AS order_id, o.`order_sn`, o.`total_amount`,
  u.`id` AS user_id, u.`username`, u.`phone`,
  i.`id` AS item_id, i.`product_name`, i.`price`, i.`count`
FROM `mall_order` o
LEFT JOIN `sys_user` u ON o.`user_id` = u.`id`
LEFT JOIN `mall_order_item` i ON o.`id` = i.`order_id`
WHERE o.`id` = 2001;
```

#### 2. Java 领域模型结构（DDD 实体嵌套）
```java
public class OrderVO {
    private Long orderId;
    private String orderSn;
    private BigDecimal totalAmount;

    // 1对1 关联：买家信息
    private UserVO buyer;

    // 1对多 关联：商品清单
    private List<OrderItemVO> items;
}
```

#### 3. MyBatis XML 高级 `ResultMap` 嵌套映射
```xml
<!-- 定义复合映射规则 -->
<resultMap id="OrderDetailMap" type="com.example.vo.OrderVO">
  <!-- 主表字段映射 -->
  <id property="orderId" column="order_id" />
  <result property="orderSn" column="order_sn" />
  <result property="totalAmount" column="total_amount" />

  <!-- 1对1 关联映射：使用 <association> -->
  <association property="buyer" javaType="com.example.vo.UserVO">
    <id property="id" column="user_id" />
    <result property="username" column="username" />
    <result property="phone" column="phone" />
  </association>

  <!-- 1对多 集合映射：使用 <collection> ofType 指定列表中元素的类 -->
  <collection property="items" ofType="com.example.vo.OrderItemVO">
    <id property="id" column="item_id" />
    <result property="productName" column="product_name" />
    <result property="price" column="price" />
    <result property="count" column="count" />
  </collection>
</resultMap>

<select id="getOrderDetailById" resultMap="OrderDetailMap">
  SELECT 
    o.`id` AS order_id, o.`order_sn`, o.`total_amount`,
    u.`id` AS user_id, u.`username`, u.`phone`,
    i.`id` AS item_id, i.`product_name`, i.`price`, i.`count`
  FROM `mall_order` o
  LEFT JOIN `sys_user` u ON o.`user_id` = u.`id`
  LEFT JOIN `mall_order_item` i ON o.`id` = i.`order_id`
  WHERE o.`id` = #{id}
</select>
```

---

## ⚠️ MyBatis 生产 4 大经典踩坑速查宝典

### 1. 致命大坑：整型字段值为 `0` 时被误判为空字符串
- **错误写法（生产高频 Bug）**：
  ```xml
  <!-- 假设 status 是 Integer 类型，值为 0 (表示已禁用) -->
  <if test="status != null and status != ''">
    AND `status` = #{status}
  </if>
  ```
  > **根因**：OGNL 表达式在判断 `status != ''` 时，若 `status == 0`，MyBatis 会将其与空字符串等价判定为 `false`，导致这个 `status = 0` 的条件**被直接吞掉，没有拼进 SQL**！
- **正确写法**：对于数值类型（`Integer`, `Long`, `BigDecimal`），**只需要判断 `status != null`，千万不要加 `and status != ''`**！

### 2. 特殊字符解析报错（`<` 和 `>`）
XML 语法中 `<` 会被当成 XML 标签开始符号直接报错：
- 方案 A（实体字符替换）：`<` 改写为 `&lt;`，`<=` 改写为 `&lt;=`，`>` 改写为 `&gt;`。
- 方案 B（CDATA 区块包裹）：
  ```xml
  <![CDATA[
    AND `created_time` >= #{startTime} AND `created_time` < #{endTime}
  ]]>
  ```

### 3. 动态排序 `ORDER BY` 的防注入
- **必须使用 `${}`**：因为预编译占位符 `#{}` 无法用于列名和 `ASC/DESC` 关键字。
- **但必须做代码层白名单校验**：防止前端传 `sortField = "id; DROP TABLE users;"`：
  ```java
  // Java 代码层严格校验白名单
  private static final Set<String> ALLOWED_COLUMNS = Set.of("id", "created_time", "price");
  if (!ALLOWED_COLUMNS.contains(sortField)) {
      throw new IllegalArgumentException("非法的排序列！");
  }
  ```

### 4. 下划线与驼峰自动映射
避免在 XML 里繁琐地手写几十行 `<result column="user_name" property="userName" />`，在 Spring Boot 配置文件中开启全局驼峰映射：
```yaml
mybatis:
  configuration:
    map-underscore-to-camel-case: true # 自动将 user_name 映射给 userName
```
