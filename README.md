# Grok Bot Analysis

Grok Bot（`com.anysphere.sand`，内部代号 testAgent / Sand）0.70.2 的完整客户端、网络协议、Agent 架构与可复刻实现分析归档。

仓库包含两轮分析：

- **第一轮**（根目录）：Codex 产出的接口目录、全栈架构报告和复刻蓝图，以及解包产物、格式化源码、脱敏抓包等原始证据。
- **第二轮**（[`grok-bot-deep-dive/`](grok-bot-deep-dive/)）：Claude Opus 在第一轮基础上的深度分析，把公开说法落到代码，用 REA 对应用包做比对核验，最后还原出原团队的技术方案文档。

## 第一轮：接口与架构归档（根目录）

| 报告 | 内容 |
|---|---|
| [全栈架构报告](full-stack-architecture-report.md) | 客户端、中央控制面、Box、本机执行的整体架构，以及动态观察结论。 |
| [客户端接口地图](client-interface-map.md) | 渲染层调用主进程的 301 个方法、preload 暴露面和信任边界。 |
| [中央 API 完整目录](api-capability-catalog.md) | `api2.cursor.sh` 上 7 个 ConnectRPC 服务、484 条路由的出入参和职责。 |
| [中央 API 能力矩阵](api-capability-matrix.md) | 同一批接口的能力矩阵视图。 |
| [Box Gateway Schema](gateway-schema-summary.md) | Box 网关 167 个公开方法、27 个 SSE 事件通道、40 个只给宿主进程调用的方法。 |
| [动态 API 矩阵](dynamic-api-matrix.md) | 抓包中实际出现过的接口（51 个中央 RPC、11 个网关接口）。 |
| [复刻实现蓝图](replication-blueprint-draft.md) | 按服务边界拆分的复刻实现方案。 |
| [动态观察方案](dynamic-observation-plan.md) | 抓包与运行时观察的方法、范围和脱敏规则。 |

## 第二轮：深度分析（`grok-bot-deep-dive/`）

完整清单和阅读顺序见 [grok-bot-deep-dive/README.md](grok-bot-deep-dive/README.md)。

| 报告 | 内容 |
|---|---|
| [技术方案还原](grok-bot-deep-dive/grok-bot-technical-design-reconstruction.md) | **主报告**。按原团队设计文档的结构自上而下还原：设计原则、四个平面、11 个子系统、9 个关键流程、数据模型、容错、安全、性能、演进和已知问题。 |
| [Personal Agent 参考架构](grok-bot-deep-dive/personal-agent-reference-architecture.md) | 公开说法逐条落到代码机制，提炼可供其他 personal agent 产品直接参考的架构方案。 |
| [速度与存储笔记](grok-bot-deep-dive/notes-speed-and-storage.md) | 为什么感觉快；存储快满时自动清理（Disk Saver）的触发链路。 |
| [多 Agent 与安全笔记](grok-bot-deep-dive/notes-multiagent-security.md) | 记忆模型、群聊、敏感操作隔离、"教任务"。 |
| [公开说法清单](grok-bot-deep-dive/public-claims.md) | 官方说明和用户反馈的说法清单，是逐条核验的输入。 |
| [子系统调研报告](grok-bot-deep-dive/recon/) | 客户端与控制面、Agent 运行时、Box 云桌面、本机执行与安全四份详细报告。 |
| [REA 核验证据](grok-bot-deep-dive/rea/) | 应用包完整性、签名、`Info.plist` 的 REA 分析结果。 |
| [架构总览画布](grok-bot-deep-dive/canvas/grok-bot-product-architecture.canvas.tsx) | Cursor Canvas 源码。 |

## 覆盖范围

- 中央 ConnectRPC：484 条路由声明，429 个唯一 operation。
- Box-scoped Gateway：167 个公开 JSON 方法、27 个 SSE channel、40 个 host-only 方法。
- 动态窗口：51 个中央 RPC、11 个 Gateway endpoint。
- Electron Main/Preload/Coordinator/Local Exec、Harness、记忆分层、Linux GUI Box、VNC、macOS Computer Use 与 User Device Relay。
- 第二轮补充：BOX / TEMPORAL 两种运行方式及迁移、送达与去重、Box 预热休眠与凭据回收、出网隧道、秘密下发路径、群聊敏感卡片、REA 完整性核验，以及疑点 D1–D11 的结论。

## 证据说明

仓库保留完整分析目录，包括解包后的应用资源、格式化代码、REA 中间证据、脱敏网络 shape 和采集脚本。动态记录只保存协议结构、字段编号、状态和时序，不保存 token、cookie、账号值或消息正文。

结论分为“观察、推断、未知、推荐”。客户端证据无法直接证明服务端数据库、消息总线、虚拟化平台、模型路由或工作流引擎的具体产品选型。

## 使用边界

本仓库用于内部研究、竞品架构分析和兼容性验证。其中包含第三方应用的解包产物，不授予对原始软件的再分发权。
