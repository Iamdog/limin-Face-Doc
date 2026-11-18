# Java 后端文档信息架构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Java 后端文档的统一学习地图、阶段化导航和文章阅读闭环。

**Architecture:** 保留现有专题文件与 URL，在 `doc/Java/后端学习地图.md` 增加信息架构层；精简 `doc/Java/前言.md` 作为入口说明；更新 VitePress Java 侧边栏按学习阶段组织内容，并在关键专题增加统一阅读卡片。

**Tech Stack:** Markdown, VitePress, TypeScript 配置。

**Spec:** `docs/superpowers/specs/2026-11-16-java-backend-docs-design.md`

## Global Constraints

- 不迁移现有专题文件，不改变已有文章 URL。
- 不改 Java 示例工程业务逻辑。
- 只使用仓库现有文档和示例工程信息。
- 构建必须通过，新增链接必须可解析。

## Review Focus

- 总览页是否能让不同目标读者快速找到入口。
- 阶段顺序是否与实际前置关系一致。
- 文章卡片是否给出可执行的验证和下一步。
- VitePress 侧边栏嵌套是否可读、链接是否正确。
- 示例工程命令是否与仓库实际 README 一致。

### Task 1: 创建 Java 后端学习地图

**Files:**
- Create: `doc/Java/后端学习地图.md`

- [ ] 写出目标入口、六个学习阶段、阶段产出、完成标准和专题选择表。
- [ ] 加入示例工程启动、测试、接口验证链接。
- [ ] 加入跨模块边界和统一文章阅读约定。
- [ ] 检查所有站内链接与现有文件路径一致。

### Task 2: 精简 Java 前言并指向学习地图

**Files:**
- Modify: `doc/Java/前言.md`

- [ ] 保留模块定位、适用人群和边界。
- [ ] 将详细路线收敛为入口卡片，指向学习地图、示例工程和关键路线。
- [ ] 删除与学习地图重复的大段目录说明。

### Task 3: 重排 VitePress Java 侧边栏

**Files:**
- Modify: `.vitepress/config.mts:351-419`

- [ ] 将学习地图放在 Java 后端分组首项。
- [ ] 按“基础底座、业务开发、框架与持久层、中间件与分布式、生产治理与面试”重组已有链接。
- [ ] 保留所有现有 Java 文章入口与示例工程入口。

### Task 4: 为关键文章补阅读卡片

**Files:**
- Modify: `doc/Java/SpringBoot业务开发实战入门.md`
- Modify: `doc/Java/事务权限与排错实战.md`
- Modify: `doc/Java/Redis高并发缓存与一致性实战.md`
- Modify: `doc/Java/Kafka与RocketMQ生产级接入实战.md`

- [ ] 在正文开头补充适合读者、前置、完成产出、验证方式和下一步链接。
- [ ] 保持原有技术正文不做结构性重写。

### Task 5: 构建与链接验证

**Files:**
- Modify: none

- [ ] 运行仓库 package scripts 中对应的 VitePress 构建命令。
- [ ] 检查构建输出中的 broken link 或 Markdown 解析错误。
- [ ] 复查 `git diff --check` 和改动范围。
