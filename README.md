# Grok Bot Analysis

`testAgent.app` 0.70.2 的完整客户端、网络协议、Agent 架构与可复刻实现分析归档。

## 核心报告

- [全栈架构报告](full-stack-architecture-report.md)
- [客户端接口地图](client-interface-map.md)
- [中央 API 完整目录](api-capability-catalog.md)
- [中央 API 能力矩阵](api-capability-matrix.md)
- [Box Gateway Schema](gateway-schema-summary.md)
- [动态 API 矩阵](dynamic-api-matrix.md)
- [复刻实现蓝图](replication-blueprint-draft.md)
- [动态观察方案](dynamic-observation-plan.md)

## 覆盖范围

- 中央 ConnectRPC：484 条路由声明，429 个唯一 operation。
- Box-scoped Gateway：167 个公开 JSON 方法、27 个 SSE channel、40 个 host-only 方法。
- 动态窗口：51 个中央 RPC、11 个 Gateway endpoint。
- Electron Main/Preload/Coordinator/Local Exec、Harness、记忆分层、Linux GUI Box、VNC、macOS Computer Use 与 User Device Relay。

## 证据说明

仓库保留完整分析目录，包括解包后的应用资源、格式化代码、REA 中间证据、脱敏网络 shape 和采集脚本。动态记录只保存协议结构、字段编号、状态和时序，不保存 token、cookie、账号值或消息正文。

结论分为“观察、推断、未知、推荐”。客户端证据无法直接证明服务端数据库、消息总线、虚拟化平台、模型路由或工作流引擎的具体产品选型。

## 使用边界

本仓库用于内部研究、竞品架构分析和兼容性验证。其中包含第三方应用的解包产物，不授予对原始软件的再分发权。
