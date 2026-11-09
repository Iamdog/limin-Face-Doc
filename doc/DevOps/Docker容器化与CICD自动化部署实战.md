---
title: Docker容器化与CICD自动化部署实战
---

# Docker容器化与CICD自动化部署实战

## 🎯 招聘面试核心考点
- **面试官设问**：“全栈项目中，如何通过 **Docker 多阶段构建（Multi-stage Build）** 将一个动辄 1GB 的后端/前端镜像精简到几十兆？”
- **深水区追问**：“如何用 `docker-compose.yml` 在本地一键拉起 **MySQL + Redis + Spring Boot 后端 + Vue 前端 Nginx** 全套生产级环境？生产 Dockerfile 编写有哪些安全铁律？如何编写 GitHub Actions 实现代码 Push 自动构建、跑单测并推送 Docker Hub 镜像？”

---

## 🏢 真实生产业务场景
- **告别“在我电脑上好好的”**：统一研发、测试、预发、生产四个环境的底层依赖版本。
- **本地微服务全套秒级启动**：新入职员工无需花两天时间配置 MySQL、Redis，终端一条命令全部拉起。
- **自动化交付流水线（GitOps）**：开发者合并 PR 后，GitHub 自动触发构建、打包与云服务器无缝热更新。

---

## 一、 Dockerfile 极简多阶段构建实战

### 1. Spring Boot 后端多阶段构建（1GB 锐减至 90MB）
- **传统劣质写法**：直接使用完整的 JDK 镜像（`openjdk:17` 体积超 800MB），并将编译工具包含在生产镜像中。
- **多阶段构建原理**：
  - 第一阶段（Build Stage）：使用大镜像编译打包源码生成 Jar 包。
  - 第二阶段（Run Stage）：仅使用轻量 JRE 运行时（如 `eclipse-temurin:17-jre-alpine`，仅 80MB），只把生成的 Jar 包拷贝进来，**编译垃圾与构建缓存全部丢弃**！

```dockerfile
# ================= 第一阶段：构建打包 =================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# 利用 Docker 层缓存：先拷贝 pom.xml 下载依赖
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 拷贝源代码并打包（跳过单测加快构建速度）
COPY src ./src
RUN mvn clean package -DskipTests

# ================= 第二阶段：轻量生产运行 =================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 安全规范：禁止以 root 身份运行容器
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 仅从 builder 阶段拷贝最终可执行 Jar
COPY --from=builder /app/target/*.jar app.jar

# 暴露端口与健康检查
EXPOSE 8080
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

---

### 2. Vue 3 前端 Nginx 多阶段构建（Node 环境构建 + Nginx 静态分发）
```dockerfile
# ================= 第一阶段：Node 编译 =================
FROM node:20-alpine AS frontend-builder
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ================= 第二阶段：Nginx 极简部署 (仅 20MB) =================
FROM nginx:alpine
# 仅把 dist 目录拷贝到 Nginx 静态根目录
COPY --from=frontend-builder /web/dist /usr/share/nginx/html
# 替换生产 Nginx 配置（支持 Vue Router History 模式）
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 二、 生产级全栈环境一键编排：`docker-compose.yml`

通过编排文件，本地开发或服务器部署只需一条命令：`docker compose up -d`，所有网络互通与数据卷持久化全部搞定！

```yaml
version: '3.8'

services:
  # 1. 关系型数据库 MySQL 8.0
  mysql:
    image: mysql:8.0
    container_name: mall-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password_123
      MYSQL_DATABASE: mall_db
    ports:
      - "3306:3306"
    volumes:
      - ./data/mysql:/var/lib/mysql # 数据持久化挂载
    networks:
      - fullstack-net

  # 2. 缓存中间件 Redis 7.0
  redis:
    image: redis:7.0-alpine
    container_name: mall-redis
    restart: always
    command: redis-server --requirepass redis_pwd_123 --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - ./data/redis:/data
    networks:
      - fullstack-net

  # 3. 后端服务 (依赖 MySQL 与 Redis 启动就绪)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mall-backend
    restart: always
    depends_on:
      - mysql
      - redis
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/mall_db?useSSL=false&serverTimezone=UTC
      SPRING_REDIS_HOST: redis
    ports:
      - "8080:8080"
    networks:
      - fullstack-net

  # 4. 前端 Web Nginx
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mall-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - fullstack-net

networks:
  fullstack-net:
    driver: bridge
```

---

## 三、 CI/CD 自动化流水线：GitHub Actions 实战

在代码仓库根目录创建 `.github/workflows/deploy.yml`，当代码合并到 `main` 分支时自动触发构建与测试：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    # 1. 检出代码
    - name: Checkout Code
      uses: actions/checkout@v4

    # 2. 配置 JDK 17
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: maven

    # 3. 运行自动化单元测试
    - name: Run Unit Tests
      run: mvn test

    # 4. 构建并推送到 Docker Hub 镜像中心
    - name: Build & Push Docker Image
      if: success()
      run: |
        docker build -t mycompany/backend:latest ./backend
        # 配合 GitHub Secrets 完成自动推送与云服务器 SSH 滚动更新
        echo "自动化流水线测试构建通过！"
```
