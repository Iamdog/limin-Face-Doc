---
title: HTTP 与 DNS 基本使用及排错
---

# HTTP 与 DNS 基本使用及排错

## 解决什么问题

网络基础用于回答接口返回了什么、请求卡在哪、登录凭证有没有带上、域名为什么打不开。先发出并读懂一个 HTTP 请求，再学习握手与加密。

## 基本使用：观察真实请求

```bash
curl -i https://example.com/
curl -I https://example.com/
dig example.com
curl -sS -o /dev/null -w 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} first=%{time_starttransfer} total=%{time_total}
' https://example.com/
```

`-i` 显示响应头与正文，`-I` 发 HEAD；服务器对 HEAD 的支持和行为可能不同。Timing 数值是累计时间，阶段耗时需做差；代理、复用和重定向会影响解释。浏览器同时观察 Network 面板，确认 Request URL、Method、Status、Headers、Payload 和 Timing。

## HTTP 基础先会用

| 项目 | 常见用法 | 需要分清 |
|---|---|---|
| 方法 | GET 查询、POST 创建、PUT 替换、PATCH 局部更新、DELETE 删除 | 协议语义的幂等与业务实现一致性要分别验证 |
| 状态码 | 200/201/204、301/302/307/308、400/401/403/404/409/429、500/502/503/504 | 401 认证、403 授权；200 不代表业务字段一定成功 |
| 请求头 | Content-Type、Accept、Authorization、Cookie | JSON 请求与 HTML form 编码不同 |
| 响应头 | Cache-Control、ETag、Location、Set-Cookie | 缓存、重定向和登录会影响后续请求 |
| 缓存 | max-age、no-cache、no-store | no-cache 要求再验证，no-store 不存储；私有数据避免共享缓存 |
| 条件请求 | If-None-Match 配合 ETag → 304 | 304 通常复用已有正文，不是空资源 |
| 连接与超时 | 连接、读取、整体 deadline | 超时不能证明服务端没有完成操作 |

HTTP 是应用协议，TCP 提供有序字节流，TLS 提供传输机密性、完整性与身份认证。HTTPS 不能代替接口鉴权，也不能防止有权限的用户滥用业务。

## DNS、代理与跨域

DNS 把域名解析成记录：A/AAAA 是地址、CNAME 是别名。TTL 和客户端/递归解析缓存导致修改不会瞬间影响所有用户。用 dig 看当前记录，结合实际请求的远端 IP 判断是否旧缓存、IPv6 路径或 CDN 节点异常。

反向代理接收客户端请求后转发到上游；502 常见于上游连接或协议异常，504 常见于代理等上游超时，但最终要结合对应代理日志。增加超时前先确定服务端是否持续执行、资源是否被占满。

CORS 是浏览器对跨源读取响应的控制。curl 成功不能证明浏览器成功；预检失败时业务请求可能没有发出。带凭证时应配置明确的 Origin，不能把 `Access-Control-Allow-Origin: *` 当作所有场景的解决办法。CORS 不构成认证或防 CSRF 机制。

## 常见故障排查顺序

1. **未发请求**：JS 异常、按钮禁用、校验、路由、CSP 或混合内容。
2. **DNS 失败**：域名、记录、缓存、解析器、网络。
3. **连接失败**：地址、端口、防火墙、路由、服务监听。
4. **TLS 失败**：域名匹配、证书有效期、证书链、系统时间和信任链。
5. **HTTP 失败**：鉴权、限流、代理、上游日志和 TraceId。
6. **200 但结果错误**：响应模型、业务错误码、前端解析、缓存和版本。

## 面试递进

| 基础问题 | 场景追问 | 原理与取舍 |
|---|---|---|
| GET/POST 区别？ | POST 超时能重试吗？ | 幂等键、状态查询、重试预算 |
| 401/403/502/504 如何定位？ | 服务日志没收到请求怎么办？ | DNS/TCP/TLS/代理逐层取证 |
| 缓存怎么配置？ | 发布后旧页面怎么处理？ | 强缓存、协商缓存、资源 hash、版本切换 |
| 跨域为何 curl 正常浏览器失败？ | 为什么 OPTIONS 返回 401？ | 预检与鉴权执行顺序、凭证限制 |
| HTTP/2 有什么收益？ | 丢包下是否完全不阻塞？ | HTTP/2 仍有 TCP 队头阻塞；QUIC 缓解跨流阻塞 |

再读 [TCP、TLS 与协议进阶](/doc/Network/计算机网络与核心通信协议全解)。
