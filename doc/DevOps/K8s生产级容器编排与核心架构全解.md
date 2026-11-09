---
title: K8s生产级容器编排与核心架构全解
---

# K8s生产级容器编排与核心架构全解

## 🎯 招聘面试核心考点
- **面试官设问**：“Kubernetes (K8s) 的整体架构由哪些核心组件构成？**Control Plane（控制平面）与 Worker Node（工作节点）** 是如何协同调度的？”
- **深水区追问**：“Deployment 为什么能做到**零停机滚动更新（Rolling Update）**？**LivenessProbe（存活探针）与 ReadinessProbe（就绪探针）** 的区别是什么，为什么刚启动的 Spring Boot 容器经常被流量打死？**Docker-Compose 与 K8s** 的本质分水岭在哪里？生产级 Deployment YAML 清单有哪些必须配置的安全与资源限制项？”

---

## 一、 K8s 控制面与节点架构全景图

```text
┌────────────────────────────────────────────────────────┐
│               Control Plane (Master 控制平面)           │
│                                                        │
│   ┌───────────────┐     ┌───────────────┐              │
│   │  API Server   │<───>│  etcd 集群    │ (一致性元数据)│
│   │ (统一网关入口) │     │ (Raft 强一致) │              │
│   └───────▲───────┘     └───────────────┘              │
│           │                                            │
│   ┌───────┴───────┐     ┌───────────────┐              │
│   │   Scheduler   │     │  Controller   │ (状态自愈/    │
│   │ (智能调度选点) │     │    Manager    │  副本数维持)  │
│   └───────────────┘     └───────────────┘              │
└───────────┬────────────────────────────────────────────┘
            │ 声明式指令下发
┌───────────▼────────────────────────────────────────────┐
│                    Worker Node (工作节点)               │
│                                                        │
│  ┌──────────────────┐           ┌──────────────────┐   │
│  │     kubelet      │           │    kube-proxy    │   │
│  │ (节点保姆: 与 CRI│           │ (网络转发代理:    │   │
│  │  交互，拉起容器) │           │  iptables/IPVS)  │   │
│  └────────┬─────────┘           └────────┬─────────┘   │
│           │                              │             │
│           ▼                              ▼             │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Pod (最小调度执行单元)              │  │
│  │   ┌─────────────────────┐┌────────────────────┐  │  │
│  │   │ App 业务主容器       ││ Sidecar 辅助容器   │  │  │
│  │   └─────────────────────┘└────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 1. Control Plane 核心组件职责
- **kube-apiserver**：整个集群的唯一暴露入口，负责所有资源对象的认证、鉴权、访问控制与 API 请求分发。
- **etcd**：高可用强一致性（基于 Raft 协议）的键值数据库，保存整个 K8s 集群的所有状态元数据。
- **kube-scheduler**：调度器，根据节点的 CPU/内存空闲余量、亲和性/反亲和性（Affinity）、污点与容忍度（Taints/Tolerations），为新创建的 Pod 选择最佳的工作节点。
- **kube-controller-manager**：控制器管理器，负责维护集群的预期期望状态（如副本数控制器、节点故障检测控制器）。

### 2. Worker Node 核心组件职责
- **kubelet**：运行在每个工作节点上的“节点 Agent”，监听 API Server 的指令，调用底层容器运行时（Containerd / CRI-O）拉起、监控、销毁容器。
- **kube-proxy**：负责维护节点上的网络规则（基于 Linux **iptables** 或性能更高的 **IPVS**），实现 Service 虚拟 IP 的流量负载分发。

---

## 二、 核心对象全景剖析

| K8s 核心对象 | 核心定位与使用场景 |
| :--- | :--- |
| **Pod** | K8s 的**最小调度与管理单元**。一个 Pod 内部共享相同的网络命名空间（同一个 IP 与 localhost）和存储卷 |
| **Deployment** | 管理**无状态应用（如 Spring Boot、Vue Nginx）**的最佳实践。支持声明式扩缩容、滚动更新与秒级版本回滚 |
| **StatefulSet** | 管理**有状态应用（如 MySQL 集群、Redis、Kafka）**。提供固定的 Pod 网络标识（Pod-0, Pod-1）与独立绑定的持久卷（PVC） |
| **Service (SVC)** | 定义一组 Pod 的访问策略与固定抽象域名。提供 **ClusterIP**（集群内访问）、**NodePort**（节点端口暴露） |
| **Ingress** | **集群 7 层网络反向代理入口**。支持域名绑定、URL 路径分发与 SSL 证书卸载（通常底层由 Ingress-Nginx 实现） |

---

## 三、 生产级生命周期保障：探针机制（Probes）

### 生产重大事故：Spring Boot 冷启动被流量打崩
- **事故回放**：Spring Boot 启动通常需要 15~30 秒（加载 Bean、初始化连接池）。如果容器刚启动，K8s 就立刻把外部高并发流量路由进来，此时应用尚未完全就绪，导致**大量用户请求直接返回 502/Connection Refused**，CPU 瞬间被占满引发宕机！
- **K8s 三大探针完美防护**：
  1. **StartupProbe（启动探针）**：专门保护初始化耗时长的重型应用。在启动探针成功之前，禁用其他探针，避免启动较慢被误杀。
  2. **ReadinessProbe（就绪探针）**：**决定 Pod 是否能接入外部流量**。只有就绪探针返回 200，K8s 才会将该 Pod 挂载到 Service 的负载均衡端点列表中；探针失败时自动将 Pod 从流量列表中摘除，**实现零错误引流**！
  3. **LivenessProbe（存活探针）**：**决定 Pod 是否需要被杀掉重启**。当应用发生死锁或 OOM 无响应时，探针超时失败，K8s 会自动重启容器执行自愈。

---

## 四、 生产级 Spring Boot 微服务 Deployment & Service YAML 清单（MVP）

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mall-order-service
  namespace: production
  labels:
    app: mall-order
spec:
  replicas: 3 # 维持 3 个副本
  strategy:
    type: RollingUpdate # 滚动更新策略
    rollingUpdate:
      maxSurge: 1       # 更新过程中最多多创建 1 个 Pod (允许 4 个)
      maxUnavailable: 0 # 严格保证更新期间 0 个副本不可用 (零停机升级)
  selector:
    matchLabels:
      app: mall-order
  template:
    metadata:
      labels:
        app: mall-order
    spec:
      containers:
      - name: order-app
        image: registry.example.com/mall/order-service:v1.2.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
        # 1. 严格配置容器资源上下限 (防单容器内存泄露拖垮物理机)
        resources:
          requests:
            cpu: "500m"     # 保证分配 0.5 核
            memory: "512Mi"  # 保证分配 512MB
          limits:
            cpu: "2000m"    # 封顶使用 2 核
            memory: "1024Mi" # 封顶 1GB，超出触发 OOMKilled
        # 2. 存活探针：死锁检测
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 40 # 启动 40 秒后开始检查
          periodSeconds: 10
        # 3. 就绪探针：流量准入检查
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 25
          periodSeconds: 5
        # 4. 环境变量解耦
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password

---
# 对应的内部 Service 负载均衡抽象
apiVersion: v1
kind: Service
metadata:
  name: mall-order-service
  namespace: production
spec:
  type: ClusterIP # 仅在 K8s 集群内部网络可访问
  selector:
    app: mall-order
  ports:
  - port: 8080
    targetPort: 8080
```

---

## 五、 Docker-Compose vs Kubernetes 技术选型分水岭

```text
单机/本地开发/极小团队 ──────> 单台云服务器 ──────> 中大型分布式微服务集群
      │                              │                           │
  【Docker-Compose】           【Docker-Compose】              【Kubernetes】
  • 单节点本地一键拉起           • 维护 5~10 个静态容器          • 多主机集群自动调度
  • 配置文件极简直观             • 无需复杂调度与高可用          • 容器自动故障自愈与重启
  • 零集群部署运维门槛           • 资源利用率适中                • HPA 自动水平弹性伸缩
                                                               • 细粒度 RBAC 权限与服务网格
```
