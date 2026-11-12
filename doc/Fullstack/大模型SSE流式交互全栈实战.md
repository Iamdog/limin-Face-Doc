---
title: 大模型SSE流式交互全栈实战
---

# 大模型SSE流式交互全栈实战

## 使用入口：先解决问题，再做验证

把服务端增量输出及时显示到客户端。

**先做基本操作**：先建立一个可取消的流，验证断线、完成与错误，再讨论代理缓冲、重连和背压。初次学习可先完成[本模块基础实践](/doc/Fullstack/全栈开发学习路线与实战地图)。

**再逐步深入**：基本 API 与输入输出 → 常见失败和使用边界 → 场景排查与优化 → 本文机制分析与源码。面试先讲用途和自己的操作过程，再回答场景与原理追问。

## 🎯 核心技术原理与实战归纳
- **核心设问与思考**：“在对接 OpenAI / DeepSeek / Claude 或企业本地部署的私有大模型时，为什么不能用传统的 JSON 响应？为什么普遍选用 **SSE (Server-Sent Events)** 而不是 **WebSocket**？”
- **深水区追问**：“前端如何使用流式 `fetch` 逐字解析打字机？如果用户中途点击了‘**停止生成**’，前端如何立刻中断连接并通知服务端停止消耗 Token？遇到 Nginx 代理流式输出变成‘一次性卡顿蹦出一大段’怎么破？”

---

## 🏢 真实生产业务场景
- **企业级 AI 智能问答客服**：智能知识库检索生成回答。
- **大模型代码助手 / 自动化 Copilot**：逐行流式输出高亮代码片段。
- **研报与商业分析长文生成**：动辄生成数千字报告，流式让首字延迟（TTFT, Time To First Token）从 30 秒降到 500 毫秒以内。

---

## ⚙️ 为什么不是 WebSocket？技术选型对比

| 维度 | SSE (Server-Sent Events) | WebSocket | 普通 HTTP POST (轮询) |
| :--- | :--- | :--- | :--- |
| **协议** | 标准 HTTP 协议（`text/event-stream`） | `ws://` / `wss://` 独立协议 | HTTP/1.1 或 HTTP/2 |
| **通信方向** | **单向**（客户端提问一次，服务端持续单向流式推送） | **全双工**（双向高频交互） | 请求-响应单次 |
| **穿透防火墙/网关**| 天然兼容现有 HTTP 基础设施、网关与负载均衡 | 部分老旧企业级防火墙和代理会拦截 WebSocket | 天然兼容 |
| **适用场景** | **大模型文本生成**、股票看板推送、系统告警通知 | 双人在线协同编辑、游戏对战、即时通讯聊天室 | 简单增删改查表单 |

---

## 💻 最小可运行 MVP 实战代码

### 1. 服务端：Spring Boot 实现流式 SSE 接口（打字机模拟）

```java
@RestController
@RequestMapping("/api/chat")
public class SseChatController {

    // 必须设置 MediaType 为 text/event-stream;charset=UTF-8
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAiResponse(@RequestParam String prompt) {
        // 设置 3 分钟超时时间
        SseEmitter emitter = new SseEmitter(180_000L);

        // 异步线程流式吐字，防占用 Web 容器主线程
        CompletableFuture.runAsync(() -> {
            try {
                String fullAnswer = "你好！我是全栈 AI 助手。大模型流式打字机通过 SSE 协议实现，首字响应极快！";
                
                for (int i = 0; i < fullAnswer.length(); i++) {
                    String token = String.valueOf(fullAnswer.charAt(i));
                    
                    // 发送事件流数据，格式为 data: {"text": "字"}\n\n
                    emitter.send(SseEmitter.event()
                        .name("message")
                        .data(Map.of("text", token)));
                    
                    Thread.sleep(80); // 模拟大模型推理延迟
                }
                
                // 结束流
                emitter.send(SseEmitter.event().name("finish").data("[DONE]"));
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        // 客户端断开连接回调（例如用户点击了“停止生成”或关闭网页）
        emitter.onCompletion(() -> System.out.println("[SSE] 连接正常结束"));
        emitter.onTimeout(() -> System.out.println("[SSE] 连接超时"));
        return emitter;
    }
}
```

---

### 2. 前端：Vue 3 + Fetch Stream 消费与 AbortController 中断

```vue
<script setup lang="ts">
import { ref } from 'vue'

const prompt = ref('')
const responseText = ref('')
const isGenerating = ref(false)
let abortController: AbortController | null = null

async function startStream() {
  if (!prompt.value || isGenerating.value) return

  isGenerating.value = true
  responseText.value = ''
  // 1. 创建 AbortController 用于支持手动中断
  abortController = new AbortController()

  try {
    const response = await fetch(`http://localhost:8080/api/chat/stream?prompt=${encodeURIComponent(prompt.value)}`, {
      method: 'GET',
      signal: abortController.signal, // 挂载中断信号
    })

    if (!response.body) throw new Error('流式传输失败')

    // 2. 获取 ReadableStreamDefaultReader 解码器
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      // 解析 SSE 协议内容 (data: {"text":"..."})
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const rawData = line.replace('data:', '').trim()
          if (rawData === '[DONE]') break
          try {
            const parsed = JSON.parse(rawData)
            if (parsed.text) {
              responseText.value += parsed.text // 逐字响应式追加渲染打字机
            }
          } catch (e) {
            // 忽略分片截断的非完整 JSON
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('用户主动中断了大模型流式生成！')
    } else {
      console.error('流式连接异常:', err)
    }
  } finally {
    isGenerating.value = false
    abortController = null
  }
}

// 手动中断流
function stopGeneration() {
  if (abortController) {
    abortController.abort() // 立即中断网络 Fetch 连接
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="chat-container">
    <input v-model="prompt" placeholder="向大模型提问..." />
    <button @click="startStream" :disabled="isGenerating">发送提问</button>
    <button @click="stopGeneration" :disabled="!isGenerating">停止生成</button>

    <div class="output-box">
      <p>{{ responseText }}<span v-if="isGenerating" class="cursor">|</span></p>
    </div>
  </div>
</template>

<style scoped>
.cursor {
  animation: blink 1s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
```

---

## ⚠️ 生产级避坑指南（高频生产踩坑要点）
- **Nginx 反向代理导致打字机失效（变成整块延迟弹出）**：
  - **原因**：Nginx 默认配置了 `proxy_buffering on;`，它会缓存后端响应，等到攒够一个缓冲区大小（如 4k/8k）或连接关闭时才一口气刷给前端。
  - **解决方案**：在 Nginx 配置中针对 SSE 路由增加禁用缓冲的参数：
    ```nginx
    location /api/chat/stream {
        proxy_pass http://backend_server;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding on;
        proxy_buffering off; # 核心！必须关闭缓冲
        proxy_cache off;
    }
    ```
