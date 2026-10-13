# Grok Bot 深度分析（第二轮）

在仓库根目录 Codex 分析归档的基础上，用 Claude Opus 再做的一轮分析：先把公开说法逐条落到代码，再按子系统拆开调研，并用 [REA](https://github.com/morluto/rea) 对 `/Applications/Grok Bot.app`（`com.anysphere.sand` 0.70.2）做比对核验，最后整理成一份"还原原团队技术方案"的设计文档。

全程只做静态分析：没有启动应用、没有向其服务发请求、没有修改应用包。

## 推荐阅读顺序

1. [技术方案还原](grok-bot-technical-design-reconstruction.md)：主文档，约 1500 行。
2. [Personal Agent 参考架构](personal-agent-reference-architecture.md)：想做同类产品时参考。
3. 专题笔记和子系统调研报告：需要细节或证据时再查。

## 报告清单

### 主报告

| 文件 | 内容 |
|---|---|
| [grok-bot-technical-design-reconstruction.md](grok-bot-technical-design-reconstruction.md) | **技术方案还原**。按原团队设计文档的结构，自上而下还原整个系统：背景与目标、10 条设计原则；四个平面（Electron 客户端、`api2.cursor.sh` 中央控制面、Box 云桌面、本机执行）的总体架构；客户端、控制面、Agent 运行时、多 Agent 群聊、记忆、Box、本机执行、凭据安全、语音、渠道、"教任务"共 11 个子系统的设计；9 个关键流程、数据模型、接口分类、部署成本、容错、安全评估、性能、灰度演进和已知问题。附录收录关键参数、证据索引、疑点 D1–D11 的核验结论和 REA 结果。 |
| [personal-agent-reference-architecture.md](personal-agent-reference-architecture.md) | **Personal Agent 参考架构**。把官方功能说明和公开用户反馈逐条落到代码机制（为什么快、为什么永远在线、存储怎么自动清理、群聊里的密码怎么处理等），提炼七条架构不变量，并给其他 personal agent 产品一套可直接参考的架构方案和落地顺序。 |

### 专题笔记

| 文件 | 内容 |
|---|---|
| [notes-speed-and-storage.md](notes-speed-and-storage.md) | 为什么"感觉很快"（预热、乐观渲染、本地缓存、连接复用）；存储快满时自动创建清理会话（Disk Saver）的触发链路。 |
| [notes-multiagent-security.md](notes-multiagent-security.md) | 会话存储与记忆模型、跨 Agent 感知与群聊、敏感操作隔离、"教它做任务"、哪些由模型决定哪些由程序固定，以及仍需服务端代码才能确认的未知项。 |
| [public-claims.md](public-claims.md) | 官方说明和公开用户反馈的说法清单，是上面各报告逐条核验的输入。 |

### 子系统调研报告（`recon/`）

由四个并行子 Agent 产出的中间报告，内容最细，主报告据此整理。个别结论已在主报告中更正，以主报告附录 C 为准；例如本机电脑操控走的是 `CUCursorService`，`CUGrokBotService` 只负责 iMessage 和通讯录。

| 文件 | 内容 |
|---|---|
| [recon/client-control.md](recon/client-control.md) | 客户端与控制面：进程模型与冷启动、渲染层、Renderer / Main / Coordinator 通信、网络层、7 个中央服务划分、认证、计费、可观测性与远程配置、更新。 |
| [recon/agent.md](recon/agent.md) | Agent 运行时：一轮对话的完整链路、BOX 与 TEMPORAL 两种运行方式、对话存储、记忆、多 Agent 与群聊编排、命令安全分析、后台任务。 |
| [recon/box.md](recon/box.md) | Box 云桌面：生命周期（预热、休眠、凭据回收）、连接链路与端口、noVNC 显示、出网隧道、存储与 Disk Saver、为什么连接快。 |
| [recon/local-security.md](recon/local-security.md) | 本机执行与安全：local-exec 守护进程、macOS Computer Use、凭据与秘密、窗口隔离、语音、渠道集成与 MCP、信任边界。 |

### REA 核验证据（`rea/`）

| 文件 | 内容 |
|---|---|
| [rea/app-asar-summary.json](rea/app-asar-summary.json) | REA 对 `app.asar` 的分析摘要，包括 6 处完整性不一致（全部在包外的原生二进制上）和统计信息。完整输出约 244MB，超过 GitHub 单文件上限，未提交；文件里附了重新生成的命令。 |
| [rea/sig-main.json](rea/sig-main.json) | 主程序签名检查：Developer ID、Hardened Runtime、entitlements。 |
| [rea/plist.json](rea/plist.json) | `Info.plist` 解析结果。 |
| [rea/time.txt](rea/time.txt) | REA 运行耗时。 |

### 可视化（`canvas/`）

| 文件 | 内容 |
|---|---|
| [canvas/grok-bot-product-architecture.canvas.tsx](canvas/grok-bot-product-architecture.canvas.tsx) | Grok Bot 产品与架构总览的 Cursor Canvas 源码，可在 Cursor 中打开查看。 |

## 证据约定

- 文中的代码位置（如 `main-app.cjs:12345`、`node-agent-coordinator/main.cjs:40738`）都指仓库根目录 `formatted/` 下格式化后的源码；`main-app.cjs`、`main-core.cjs`、`proto.cjs` 在 `formatted/electron-main/` 中。渲染层代码在根目录 `app-asar/dist/renderer/assets/`。
- 结论分三类：观察（直接来自代码或抓包）、推断（由客户端行为推出，服务端看不到）、未知（客户端无法回答）。主报告标为〔观察〕〔推断〕〔未知〕，`recon/` 下标为 `[O]` `[I]` `[U]`。
