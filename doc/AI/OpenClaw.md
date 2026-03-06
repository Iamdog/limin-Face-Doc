# OpenClaw部署





## 是什么？

OpenClaw（原名 Moltbot 或 Clawdbot）是一款现象级的开源 AI Agent（智能代理）。

它与 ChatGPT 等传统聊天机器人有本质区别：它不只是陪你聊天，而是拥有**“系统级权限”**，能真正控制你的电脑、操作软件并自主完成任务。



[官方文档](https://docs.openclaw.ai/start/getting-started#getting-started)



## 安装

`node.js  22+`  

nvm install 22 & nvm use 22



`安装openclaw` 

``` bash
curl -fsSL https://openclaw.ai/install.sh | bash
```



`开启配置向导`
openclaw onboard

自行选择配置，本人选择的模型是 google/gemini-3.0.flash





`打开网关`

openclaw gateway

`关闭网关`

openclaw gateway stop



`添加密钥`

openclaw onboard --auth-choice gemini-api-key  



## 常用问题

在Web聊天会话时一直报错


在该目前修改模型版本使用你的token所支持的
/Users/laoliu/.openclaw/openclaw.json

```json
{
  "meta": {
    "lastTouchedVersion": "2026.3.2",
    "lastTouchedAt": "2026-03-06T05:28:54.166Z"
  },
  "wizard": {
    "lastRunAt": "2026-03-06T05:22:48.064Z",
    "lastRunVersion": "2026.3.2",
    "lastRunCommand": "onboard",
    "lastRunMode": "local"
  },
  "auth": {
    "profiles": {
      "google:default": {
        "provider": "google",
        "mode": "api_key"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "google/gemini-3-flash"
      },
      "workspace": "/Users/laoliu/.openclaw/workspace",
      "compaction": {
        "mode": "safeguard"
      },
      "maxConcurrent": 4,
      "subagents": {
        "maxConcurrent": 8
      }
    },
    "list": [
      {
        "id": "main"
      },
      {
        "id": "google",
        "name": "google",
        "workspace": "/Users/laoliu/.openclaw/workspace-google",
        "agentDir": "/Users/laoliu/.openclaw/agents/google/agent",
        "model": "google/gemini-3-flash"
      }
    ]
  },
  "tools": {
    "profile": "messaging"
  },
  "messages": {
    "ackReactionScope": "group-mentions"
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto",
    "restart": true,
    "ownerDisplay": "raw"
  },
  "session": {
    "dmScope": "per-channel-peer"
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "openclaw666"
    },
    "tailscale": {
      "mode": "off",
      "resetOnExit": false
    }
  }
}

```



如果chat报错404找不到请删除以下的文件，再重新chat

**❌06:30:10 [agent/embedded] embedded run agent end: runId=d08776ad-4801-4f32-a612-93e8c8fb9fc7 isError=true error=LLM error: {**

 **"error": {**

  **"code": 404,**

  **"message": "models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.",**

  **"status": "NOT_FOUND"**

 **}**

**}**


/Users/laoliu/.openclaw/agents/main/sessions/sessions.json 