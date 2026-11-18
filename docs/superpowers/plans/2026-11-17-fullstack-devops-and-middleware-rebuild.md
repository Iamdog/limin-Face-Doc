# 全栈服务器运维与核心中间件实操指南 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构并扩建 `limin-Face-Doc` 的 `🚀 网络与运维工程化` 模块，淘汰空洞浅显的旧文件，落地 20 篇高含金量全栈核心运维与中间件实操专题（覆盖 Linux 命令、Nginx 网关、Docker 编排、MySQL 容器化运维、MinIO 私有化对象存储、Redis、PM2 与线上排障 SOP），并保留优质进阶网络协议与 K8s 专栏。

**Architecture:** 采用分层结构设计，将运维工程化拆解为 Linux 命令行、Nginx 网关反代、Docker 容器编排、全栈中间件（MySQL/MinIO/Redis/PM2）与生产排障 SOP 5 大核心实战模块 + 2 个进阶专栏（网络协议/K8s）。每篇文档严格遵循“核心设问 -> 生产场景 -> 核心配置/命令实战 -> 避坑反思与排障 SOP -> 面试连环追问”四维闭环结构。

**Tech Stack:** VitePress 1.6.4, Linux (Ubuntu/Debian/CentOS), Nginx 1.24+, Docker 26+, Docker Compose v2, MySQL 8.0, MinIO S3 API, Redis 7+, PM2, GitHub Actions CI/CD.

**Spec:** 用户要求针对全栈开发服务器运维与常用中间件（Linux常用命令、Nginx、Docker、MySQL Docker容器化运维、MinIO私有化对象存储搭建、Redis、PM2等）进行系统化重构落地，删除不符合实际全栈条件的旧文件，重新排版规划并保障 VitePress 编译零死链。

## Global Constraints

- 严禁空洞理论罗列，所有配置、命令必须为真实生产环境可运行的代码块（Docker run/compose yaml/Nginx conf/Linux shell）。
- 格式规范：表格单元格内严禁出现三重反引号代码块（使用单反引号或 HTML 标签）；模板语法双花括号需转义为 `<code>&#123;&#123; ... &#125;&#125;</code>`。
- 保留现存的优质进阶专栏文件（`doc/Network/` 3篇与 `doc/DevOps/` K8s 4篇），无缝嵌入进阶专栏。
- 最终必须在 `/Users/laoliu/Documents/limin-Face-Doc` 下执行 `npm run docs:build` 验证通过，Exit Code 0，死链数 0。

## Review Focus

- Nginx `try_files` SPA 路由配置是否解决 History 模式刷新 404
- Nginx `proxy_pass` 尾部斜杠 `/` 路径替换是否讲解清晰，无歧义
- MySQL 容器化运维中数据卷挂载（`/var/lib/mysql`）与定时备份脚本是否可执行
- MinIO 容器化部署中 API 端口（9000）与 Console 端口（9001）以及 S3 签名配置是否准确
- Docker Compose 编排前后端与数据库时 `depends_on` 与跨容器网络 DNS 解析是否自洽

---

### Task 1: 基础设施清理与全新阅读地图编写

**Files:**
- Delete: `doc/DevOps/部署运维基本使用与故障排查.md`
- Overwrite: `doc/DevOps/前言.md`

- [ ] **Step 1: 删除空洞无用的旧文件 `部署运维基本使用与故障排查.md`**
- [ ] **Step 2: 重写 `doc/DevOps/前言.md`，构建全栈运维与中间件全新 5 级梯队导航地图与 Mermaid 图谱**
- [ ] **Step 3: 验证前言中的 Markdown 链接和排版规范**

---

### Task 2: 模块一·Linux 命令行与服务器排障实战 (01~05)

**Files:**
- Create: `doc/DevOps/Linux-文件目录权限管理与SSH免密登录全解.md`
- Create: `doc/DevOps/Linux-文本三剑客grep-awk-sed生产日志过滤实战.md`
- Create: `doc/DevOps/Linux-系统监控top-htop-free-df-iostat性能分析.md`
- Create: `doc/DevOps/Linux-网络排障netstat-ss-lsof-curl网络调试.md`
- Create: `doc/DevOps/Linux-进程管理nohup-tmux与Systemd服务守护实战.md`

- [ ] **Step 1: 编写 `Linux-文件目录权限管理与SSH免密登录全解.md`**
  - 核心：常用文件目录操作、`chmod` 755/644 权限模型、`chown`、SSH 密钥对生成与跳板机免密端口转发。
- [ ] **Step 2: 编写 `Linux-文本三剑客grep-awk-sed生产日志过滤实战.md`**
  - 核心：`grep -rn` 多行上下文捕获、`awk` 统计 Top 访问 IP 与状态码聚合、`sed` 批量原地替换与正则匹配。
- [ ] **Step 3: 编写 `Linux-系统监控top-htop-free-df-iostat性能分析.md`**
  - 核心：`top`/`htop` Load Average 三个指标、`free -m` 区分 Buffer/Cache、`df -h` 与 `du -sh *` 查大文件、`iostat` 查磁盘饱和度。
- [ ] **Step 4: 编写 `Linux-网络排障netstat-ss-lsof-curl网络调试.md`**
  - 核心：`ss -tlnp` / `netstat -tulnp`、`lsof -i:端口` 快速杀僵死进程、`curl -Iv` 测试 HTTP 延迟分布、`tcpdump` 基础抓包。
- [ ] **Step 5: 编写 `Linux-进程管理nohup-tmux与Systemd服务守护实战.md`**
  - 核心：`nohup ... &`、终端复用器 `tmux` 会话持久化、手写 `systemd.service` 开机自启服务配置与日志查看。

---

### Task 3: 模块二·Nginx 高性能网关与反向代理实战 (06~10)

**Files:**
- Create: `doc/DevOps/Nginx-核心配置结构与location路径匹配优先级.md`
- Create: `doc/DevOps/Nginx-前端SPA托管try_files防404与静态缓存.md`
- Create: `doc/DevOps/Nginx-反向代理proxy_pass路径截断与跨域CORS.md`
- Create: `doc/DevOps/Nginx-负载均衡upstream算法与高可用配置.md`
- Create: `doc/DevOps/Nginx-SSL证书自动化Let's-Encrypt与限流防刷.md`

- [ ] **Step 1: 编写 `Nginx-核心配置结构与location路径匹配优先级.md`**
  - 核心：Master-Worker 多进程物理模型、核心配置块拆解、`location` 匹配优先级（`=` > `^~` > `~*` > `/`）。
- [ ] **Step 2: 编写 `Nginx-前端SPA托管try_files防404与静态缓存.md`**
  - 核心：Vue/React/UniApp H5 单页静态托管、`try_files $uri $uri/ /index.html` 根除 404、强缓存与协商缓存配置。
- [ ] **Step 3: 编写 `Nginx-反向代理proxy_pass路径截断与跨域CORS.md`**
  - 核心：`proxy_pass` 末尾带斜杠与不带斜杠的路径替换玄机、CORS 跨域响应头配置、WebSocket 升级连接代理。
- [ ] **Step 4: 编写 `Nginx-负载均衡upstream算法与高可用配置.md`**
  - 核心：`upstream` 块、`round-robin`、`weight`、`ip_hash`、`least_conn` 算法、健康检查与超时重试机制。
- [ ] **Step 5: 编写 `Nginx-SSL证书自动化Let's-Encrypt与限流防刷.md`**
  - 核心：Certbot 自动申请与 Crontab 自动续签免费 SSL 证书、强制 301 重定向、Gzip 压缩优化、`limit_req` 令牌桶限流防刷。

---

### Task 4: 模块三·Docker 容器与全栈编排工程化 (11~14)

**Files:**
- Create: `doc/DevOps/Docker-核心架构镜像容器操作与常用命令速查.md`
- Create: `doc/DevOps/Docker-生产级Dockerfile编写规范与多阶段瘦身.md`
- Create: `doc/DevOps/Docker-数据卷Volume持久化与自定义网络通信.md`
- Create: `doc/DevOps/Docker-Compose全栈一键编排前后端与数据库.md`

- [ ] **Step 1: 编写 `Docker-核心架构镜像容器操作与常用命令速查.md`**
  - 核心：Namespace 隔离与 Cgroups 资源限制、联合文件系统 UnionFS 分层模型、常用生命周期命令速查与清理技巧。
- [ ] **Step 2: 编写 `Docker-生产级Dockerfile编写规范与多阶段瘦身.md`**
  - 核心：多阶段构建原理（Node 前端 + Spring Boot/Go 后端）、基础镜像对比瘦身、`.dockerignore` 规约。
- [ ] **Step 3: 编写 `Docker-数据卷Volume持久化与自定义网络通信.md`**
  - 核心：数据持久化（Named Volume vs Bind Mount 差异与陷阱）、容器互联 Network（默认 bridge vs 自定义 bridge 自动域名解析）。
- [ ] **Step 4: 编写 `Docker-Compose全栈一键编排前后端与数据库.md`**
  - 核心：编写完整 `docker-compose.yml`、一键编排 Nginx + Vue + API + MySQL + Redis、服务健康依赖 `depends_on` 机制。

---

### Task 5: 模块四·全栈核心中间件私有化与容器化运维 (15~18, 重点专项)

**Files:**
- Create: `doc/DevOps/MySQL-Docker容器化运维数据持久化与自动备份.md`
- Create: `doc/DevOps/MinIO-高性能对象存储私有化搭建与全栈S3直传.md`
- Create: `doc/DevOps/Redis-生产级容器化运维持久化落盘与安全加固.md`
- Create: `doc/DevOps/PM2-全栈Node进程守护集群模式与日志管理.md`

- [ ] **Step 1: 编写 `MySQL-Docker容器化运维数据持久化与自动备份.md`**
  - 核心：官方镜像部署最佳实践、挂载数据目录 `/var/lib/mysql`、自定义 `my.cnf`（utf8mb4、时区、连接数）、宿主机 Crontab + `docker exec mysqldump` 定时备份恢复 SOP。
- [ ] **Step 2: 编写 `MinIO-高性能对象存储私有化搭建与全栈S3直传.md`**
  - 核心：MinIO 单机 Docker 部署（API 端口 9000 与控制台端口 9001）、存储桶策略配置（Public/Private）、AK/SK 凭证管理、全栈前后端基于 S3 协议的大文件直传与预签名临时下载。
- [ ] **Step 3: 编写 `Redis-生产级容器化运维持久化落盘与安全加固.md`**
  - 核心：Docker 部署与 `redis.conf` 挂载、配置强密码、禁用高危命令、内存上限 `maxmemory` 与逐出策略、AOF 与 RDB 双写持久化机制。
- [ ] **Step 4: 编写 `PM2-全栈Node进程守护集群模式与日志管理.md`**
  - 核心：`ecosystem.config.js` 最佳配置、多核 `cluster` 模式、零停机热重载、内存超限重启 `max_memory_restart`、`pm2-logrotate` 日志分割与开机自启动。

---

### Task 6: 模块五·全栈突发排障与性能监控 SOP (19~20)

**Files:**
- Create: `doc/DevOps/全栈排障SOP-CPU飙升100磁盘打爆与502-504根治.md`
- Create: `doc/DevOps/生产级容器日志治理滚动轮转与防爆盘实战.md`

- [ ] **Step 1: 编写 `全栈排障SOP-CPU飙升100磁盘打爆与502-504根治.md`**
  - 核心：三大概率最高故障排查 SOP：CPU 100% 线程定位代码、磁盘满 `No space left on device`（大文件与已删除未释放句柄 `lsof | grep deleted`）、502 Bad Gateway 与 504 Gateway Timeout 全链路排查。
- [ ] **Step 2: 编写 `生产级容器日志治理滚动轮转与防爆盘实战.md`**
  - 核心：容器资源配额限制（CPU/Memory 防止单个容器撑爆服务器）、Docker 全局与单容器 `json-file` 日志滚动（`max-size: 10m`, `max-file: 3`）、Linux 日志轮转 `logrotate` 配置。

---

### Task 7: 侧边栏重构与 VitePress 构建验证

**Files:**
- Modify: `.vitepress/config.mts`

- [ ] **Step 1: 更新 `.vitepress/config.mts` 中 `🚀 网络与运维工程化` 侧边栏配置**
  - 模块一：Linux 命令行与服务器排障实战 (01~05)
  - 模块二：Nginx 高性能网关与反向代理实战 (06~10)
  - 模块三：Docker 容器与全栈编排工程化 (11~14)
  - 模块四：全栈核心中间件私有化与容器化运维 (15~18)
  - 模块五：全栈突发排障与性能监控 SOP (19~20)
  - 进阶专栏一：网络与通信协议全解 (3篇)
  - 进阶专栏二：Kubernetes 容器编排架构 (4篇)
- [ ] **Step 2: 执行 `cd /Users/laoliu/Documents/limin-Face-Doc && npm run docs:build`**
  - 验证构建退出码为 0，且无任何死链或 Markdown 语法断裂。
