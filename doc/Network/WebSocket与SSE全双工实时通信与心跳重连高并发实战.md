---
title: WebSocket 与 SSE 全双工实时通信与心跳重连高并发实战
---

# WebSocket 与 SSE 全双工实时通信与心跳重连高并发实战

在即时通讯（IM）、股票行情报盘、在线协同文档、客服系统以及大模型流式对话场景中，传统的 HTTP “请求-响应”单向模型由于频繁轮询引发严重的带宽浪费与端到端延迟。

现代长连接技术形成了以 **WebSocket（全双工双向通信）** 与 **SSE（Server-Sent Events，服务端单向流式推送）** 为核心的两大成熟技术路径。

---

## 1. WebSocket vs SSE vs HTTP 短轮询/长轮询对比选型

| 特性维度 | HTTP 短轮询 / 长轮询 | WebSocket | SSE (Server-Sent Events) |
| :--- | :--- | :--- | :--- |
| **通信方向** | 客户端主动拉取 (单向) | **真正全双工 (客户端与服务端任意双向推送)** | **服务端单向流式推送到客户端** |
| **传输协议** | 传统 HTTP | 独立 `ws://` / `wss://` 协议 (基于 TCP) | 纯标准 HTTP 协议 (`text/event-stream`) |
| **握手开销** | 每次新建连接或反复发包 | 仅初次通过 HTTP 升级，后续**帧开销仅 2~10 字节** | 复用单条 HTTP 长连接，零额外协议转换 |
| **断线重连** | 手动重新发起请求 | 需在应用层手动实现心跳重连机制 | **浏览器原生自带自动重连与 `Last-Event-ID` 续传** |
| **典型场景** | 低频数据更新 | 实时聊天、多人在线协作、游戏对战 | **大模型 ChatGPT/DeepSeek 流式打字机**、监控大盘 |

---

## 2. WebSocket 升级握手与数据帧（Frame）底层协议

WebSocket 连接从标准的 HTTP 协议平滑升级而来：

```http
// 1. 客户端发送升级请求
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

// 2. 服务端回复协议切换成功 (101 Switching Protocols)
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```
握手成功后，底层 TCP 套接字保持打开，后续通信直接以极轻量的二进制帧（Frame，包含掩码 Mask、操作码 Opcode 与负载 Payload）传输。

---

## 3. 生产级心跳检测（Heartbeat）与指数退避重连机制

在移动网络或经过企业防火墙、Nginx 代理的环境下，若长时间无数据交互，NAT 网关或代理会在 60 秒内强制静默断开空闲 TCP 连接（半开连接，Half-Open）。必须部署心跳保活与自动重连机制：

```javascript
class ResilientWebSocket {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatTimer = null;
    this.serverTimeoutTimer = null;
    this.init();
  }

  init() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      console.log('WebSocket 连接成功！');
      this.reconnectAttempts = 0; // 重置重试计数
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      // 收到服务端心跳应答或业务数据，重置超时定时器
      this.resetServerTimeout();
      if (event.data === 'PONG') return;
      this.handleBusinessMessage(event.data);
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.reconnect();
    };

    this.ws.onerror = () => {
      this.ws.close();
    };
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('PING');
        // 设定 5 秒内必须收到 PONG，否则判定网络死锁
        this.serverTimeoutTimer = setTimeout(() => {
          console.warn('心跳超时，强制关闭并重连！');
          this.ws.close();
        }, 5000);
      }
    }, 25000); // 25 秒心跳间隔
  }

  resetServerTimeout() {
    if (this.serverTimeoutTimer) {
      clearTimeout(this.serverTimeoutTimer);
      this.serverTimeoutTimer = null;
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连！');
      return;
    }
    // 指数退避算法: 1s, 2s, 4s, 8s, 16s...
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;
    console.log(`${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连...`);
    setTimeout(() => this.init(), delay);
  }
}
```

---

## 4. Nginx 代理 WebSocket 核心配置

在反向代理中，必须显式传递 `Upgrade` 与 `Connection` 头，并调大空闲超时时间，否则连接会在 60 秒后被 Nginx 主动掐断：

```nginx
location /ws/ {
    proxy_pass http://websocket_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    
    # 调大读写超时时间为 1 小时 (根据心跳兜底)
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}
```
