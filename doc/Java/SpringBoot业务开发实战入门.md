---
title: Spring Boot 业务开发实战入门
description: 以任务管理接口为例，理解 Controller、Service、Mapper、DTO、校验、事务和异常处理的完整协作方式。
---

# Spring Boot 业务开发实战入门

本文以 Java 17+、Spring Boot 3.x、MyBatis、MySQL 为示例，目标是完成一组可维护的任务管理接口。重点是理解每一层的职责和请求如何流动，不要求一次掌握所有 Spring 注解。

## 使用与练习入口

本页按职责拆解代码片段，实体访问器、启动类、依赖和认证配置需由项目补齐。需要直接运行与验证事务/权限时，先使用 [完整练习工程](/examples/java-backend-workshop/README)，再对照本页分层；已经会 CRUD 可直接进入 [补强路线](/doc/Java/CRUD之后的后端补强路线)。

## 一、先看项目结构

```text
src/main/java/com/example/task
├── controller       接收 HTTP 请求，返回 HTTP 响应
├── service          编排业务规则和事务
├── mapper           执行数据库访问
├── domain           数据库实体或领域对象
├── dto              请求对象和响应对象
├── exception        业务异常和全局异常处理
└── config           跨域、序列化、鉴权等配置
```

请求链路如下：

```text
HTTP 请求
  ↓
Controller：解析参数、校验输入
  ↓
Service：执行规则、控制事务
  ↓
Mapper：执行参数化 SQL
  ↓
MySQL
```

Controller 不应直接访问数据库，Mapper 不应决定业务规则。这样拆分后，接口测试、事务管理和后续更换存储方式都会更容易。

## 二、建立最小表结构

```sql
CREATE TABLE task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'TODO',
    due_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 0,
    INDEX idx_task_user_status_created (user_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

设计理由：

- `id` 使用稳定的数值主键，便于关联和分页。
- `user_id` 表示数据归属，所有查询都应带上用户范围或管理员范围。
- `status` 使用有限值，代码中使用枚举约束取值。
- `created_at`、`updated_at` 用于排序、审计和排查问题。
- `version` 为乐观锁预留，避免两个页面同时覆盖更新。
- 联合索引顺序与常见查询条件保持一致。

## 三、请求对象、实体和响应对象

请求对象只接收客户端允许修改的字段：

```java
package com.example.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTaskRequest(
        @NotBlank(message = "标题不能为空")
        @Size(max = 120, message = "标题不能超过 120 个字符")
        String title
) {}
```

实体对象对应数据库字段：

```java
package com.example.task.domain;

import java.time.LocalDateTime;

public class Task {
    private Long id;
    private Long userId;
    private String title;
    private String status;
    private LocalDateTime dueAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer version;

    // getter / setter
}
```

不要直接把数据库实体作为所有接口的响应对象。响应对象应只返回前端需要的字段，避免泄露内部字段和未来的表结构变化。

## 四、Mapper 与参数化 SQL

```java
package com.example.task.mapper;

import com.example.task.domain.Task;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TaskMapper {
    int insert(Task task);

    Task findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    List<Task> findPage(@Param("userId") Long userId,
                        @Param("status") String status,
                        @Param("offset") long offset,
                        @Param("pageSize") int pageSize);

    int updateTitle(@Param("id") Long id,
                    @Param("userId") Long userId,
                    @Param("title") String title,
                    @Param("version") int version);

    int deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
```

对应 XML：

```xml
<mapper namespace="com.example.task.mapper.TaskMapper">
    <insert id="insert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO task (user_id, title, status)
        VALUES (#{userId}, #{title}, 'TODO')
    </insert>

    <select id="findByIdAndUserId" resultType="com.example.task.domain.Task">
        SELECT id, user_id, title, status, due_at, created_at, updated_at, version
        FROM task
        WHERE id = #{id} AND user_id = #{userId}
    </select>

    <select id="findPage" resultType="com.example.task.domain.Task">
        SELECT id, user_id, title, status, due_at, created_at, updated_at, version
        FROM task
        WHERE user_id = #{userId}
        <if test="status != null and status != ''">
            AND status = #{status}
        </if>
        ORDER BY id DESC
        LIMIT #{pageSize} OFFSET #{offset}
    </select>

    <update id="updateTitle">
        UPDATE task
        SET title = #{title}, version = version + 1
        WHERE id = #{id}
          AND user_id = #{userId}
          AND version = #{version}
    </update>

    <delete id="deleteByIdAndUserId">
        DELETE FROM task
        WHERE id = #{id} AND user_id = #{userId}
    </delete>
</mapper>
```

`#{}` 对参数值进行安全绑定；表名、排序列等 SQL 结构仍需白名单。分页参数应验证范围并限制最大 size。不要使用字符串拼接生成 SQL，也不要把客户端传入的排序字段直接拼接到 SQL 中。动态排序必须使用白名单映射。

## 五、Service 负责业务规则

```java
package com.example.task.service;

import com.example.task.domain.Task;
import com.example.task.dto.CreateTaskRequest;
import com.example.task.exception.BizException;
import com.example.task.mapper.TaskMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {
    private final TaskMapper taskMapper;

    public TaskService(TaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Transactional
    public Task create(Long userId, CreateTaskRequest request) {
        Task task = new Task();
        task.setUserId(userId);
        task.setTitle(request.title());
        task.setStatus("TODO");
        task.setVersion(0);
        taskMapper.insert(task);
        return task;
    }

    @Transactional
    public void updateTitle(Long userId, Long taskId, String title, int version) {
        int affected = taskMapper.updateTitle(taskId, userId, title, version);
        if (affected == 0) {
            throw new BizException("任务不存在、无权访问或数据已被其他请求修改");
        }
    }
}
```

事务边界应放在业务操作层。事务中包含数据库读写和必要的业务判断，不应包含长时间的网络请求、文件上传或人工等待。外部服务调用需要可靠投递时，使用本地消息表或消息队列补偿，不要把整个外部调用强行放进数据库事务。

## 六、Controller 负责 HTTP 协议

```java
package com.example.task.controller;

import com.example.task.domain.Task;
import com.example.task.dto.CreateTaskRequest;
import com.example.task.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    public record TaskResponse(Long id, String title, String status, Integer version) {
        static TaskResponse from(Task task) {
            return new TaskResponse(task.getId(), task.getTitle(), task.getStatus(), task.getVersion());
        }
    }
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public TaskResponse create(@RequestAttribute("userId") Long userId,
                               @Valid @RequestBody CreateTaskRequest request) {
        return TaskResponse.from(taskService.create(userId, request));
    }

    @PutMapping("/{id}/title")
    public void updateTitle(@RequestAttribute("userId") Long userId,
                            @PathVariable Long id,
                            @RequestParam int version,
                            @RequestParam String title) {
        taskService.updateTitle(userId, id, title, version);
    }
}
```

Controller 只负责 HTTP 参数、状态码和响应格式。用户身份应由鉴权过滤器或拦截器写入请求上下文，不能信任客户端在请求体中传入的 `userId`。

## 七、统一异常和响应

```java
public class BizException extends RuntimeException {
    public BizException(String message) {
        super(message);
    }
}
```

```java
public record ApiResponse<T>(int code, String message, T data) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, "success", data);
    }
}
```

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BizException.class)
    public ResponseEntity<ApiResponse<Void>> handleBiz(BizException ex) {
        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(400, ex.getMessage(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("请求参数不合法");
        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(400, message, null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception ex) {
        log.error("未处理的系统异常", ex);
        return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(500, "系统暂时不可用", null));
    }
}
```

生产环境应记录完整异常堆栈和请求 ID，但不应将堆栈、SQL、密钥或内部路径返回给客户端。

## 八、配置文件与多环境

```yaml
# application.yml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
  datasource:
    hikari:
      maximum-pool-size: 10
      connection-timeout: 3000

mybatis:
  mapper-locations: classpath:/mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true
```

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/task?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: task_dev
    password: ${TASK_DB_PASSWORD}
```

生产密码应通过环境变量或密钥管理系统注入，不能提交到 Git 仓库。开发、测试、生产数据库必须隔离，不能通过切换配置文件访问生产数据。

## 九、调试顺序

接口出现问题时，按照固定顺序排查：

1. 浏览器或 Postman 是否发出了正确的 URL、方法、请求头和请求体。
2. Controller 是否收到请求，参数校验是否通过。
3. Service 是否进入预期分支，事务是否生效。
4. Mapper 实际执行了什么 SQL，参数值是什么。
5. 数据库是否存在目标数据，索引和锁是否正常。
6. 响应状态码、响应体和日志中的请求 ID 是否一致。

先确认事实，再修改代码。不要根据页面现象直接猜测数据库或网络问题。

## 十、接口完成标准

- 正常请求、空参数、越权请求、重复请求和并发更新均有明确结果。
- Controller、Service、Mapper 职责清晰。
- 所有 SQL 使用参数绑定，修改语句包含完整条件。
- 事务边界经过验证，异常时数据能够回滚。
- 日志包含请求 ID、业务主键、耗时和错误原因。
- 配置按环境隔离，密码和密钥没有进入代码仓库。
- 至少有一组 Controller 测试和一组 Service 测试。


## CRUD 之后的验证

标题更新也应使用经校验的请求 DTO，并区分 404（资源范围）、409（版本冲突）和 400（无效参数）；本页旧式简化 BizException 只演示异常流转。完整权限、CSRF、错误码与真实回滚验证见 [事务、权限与排错实战](/doc/Java/事务权限与排错实战)，不能把用户输入的 userId 当作认证身份。
