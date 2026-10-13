# Grok Bot Analysis

Grok Bot（`com.anysphere.sand`，内部代号 testAgent / Sand）0.70.2 的客户端、网络协议、Agent 架构与可复刻方案分析归档。

两轮分析：第一轮由 Codex 完成（接口目录、全栈报告、复刻蓝图、动态抓包）；第二轮由 Claude Opus 在此基础上把公开说法落到代码，用 [REA](https://github.com/morluto/rea) 核验，并还原出原团队的技术方案。两轮结论冲突时，以第二轮 [技术方案还原](docs/architecture/design-reconstruction.md) 附录 C 为准。

## 推荐阅读路线

1. [架构总览](docs/architecture/overview.md)：摘要、设计原则、四个平面的总体架构。
2. [技术方案还原](docs/architecture/design-reconstruction.md)：完整设计文档（子系统、流程、部署、安全、演进）。
3. 按需看子系统和接口参考。
4. 想做同类产品：[参考架构](docs/replication/reference-architecture.md) → [复刻蓝图](docs/replication/blueprint.md)。

架构图：[diagram.canvas.tsx](docs/architecture/diagram.canvas.tsx)

## 目录

| 目录 | 内容 |
|---|---|
| [docs/architecture/](docs/architecture/) | 总览、技术方案还原、架构图 |
| [docs/subsystems/](docs/subsystems/) | [Agent 运行时](docs/subsystems/agent.md) · [Box 云桌面](docs/subsystems/box.md) · [客户端控制面](docs/subsystems/client-control.md) · [本机执行与安全](docs/subsystems/local-exec-security.md) · [多 Agent / 记忆 / 敏感操作](docs/subsystems/multiagent-memory-security.md) · [性能与存储](docs/subsystems/performance-and-storage.md) |
| [docs/reference/](docs/reference/) | [中央 API 能力目录（484 路由）](docs/reference/api-capability-catalog.md) · [Gateway Schema](docs/reference/gateway-schema.md) · [客户端接口与信任边界](docs/reference/client-interface-map.md) · [动态 API 矩阵](docs/reference/dynamic-api-matrix.md) |
| [docs/replication/](docs/replication/) | 参考架构、复刻蓝图 |
| [docs/methodology/](docs/methodology/) | [证据等级与观测方法](docs/methodology/evidence-levels.md) · [公开说法清单](docs/methodology/public-claims.md) |
| [docs/appendix/](docs/appendix/) | [第一轮全栈报告](docs/appendix/round1-full-stack-report.md) · [动态观测计划（历史）](docs/appendix/dynamic-observation-plan.md) |
| [evidence/artifacts/](evidence/artifacts/) | 原始产物：`app-asar/` 解包、`formatted/` 格式化源码、`javascript-*.json`、脱敏抓包 `runtime-*.jsonl` |
| [evidence/rea/](evidence/rea/) · [evidence/tools/](evidence/tools/) | REA 核验结果、脱敏 mitmproxy 插件 |

子系统文档原为第二轮 `recon/` 子 Agent 中间报告，个别结论已在技术方案还原中更正（例如本机电脑操控走 `CUCursorService`，`CUGrokBotService` 只负责 iMessage 和通讯录）。

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
