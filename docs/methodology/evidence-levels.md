# 证据等级与观测方法

全仓库统一的证据标注约定，以及第一轮动态观测的范围与结论。

## 标注约定

| 标记 | 含义 |
|---|---|
| O / [O] / 已观察 | 客户端代码、协议 schema 或脱敏抓包直接可见（附文件:行号） |
| I / [I] / 推断 | 由多处观察共同支持，但无法直接证明 |
| R / 推荐 | 我方建议的实现，不代表原产品做法 |
| U / [U] / 未知 | 客户端不可见，需要服务端或 Box 内部代码才能确认 |

## 证据来源

- 解包与格式化源码：[evidence/artifacts/app-asar](../../evidence/artifacts/app-asar/)、[evidence/artifacts/formatted](../../evidence/artifacts/formatted/)
- 脱敏动态 shape：[runtime-api-shapes.jsonl](../../evidence/artifacts/runtime-api-shapes.jsonl)（有效窗口自 L255 起）
- REA 核验结果：[evidence/rea](../../evidence/rea/)；脱敏抓包插件：[redacted_mitm_addon.py](../../evidence/tools/redacted_mitm_addon.py)
- 公开说法清单：[public-claims.md](public-claims.md)；历史观测计划：[dynamic-observation-plan.md](../appendix/dynamic-observation-plan.md)

## 第一轮：证据等级与边界

> 摘自 [第一轮全栈报告](../appendix/round1-full-stack-report.md) 第 2 节。


本文采用四个标签：

- **观察**：打包代码、二进制、Proto、运行进程或脱敏网络记录直接支持。
- **推断**：由多个观察组合得到的高概率解释，但客户端不能证明服务端内部实现。
- **未知**：当前证据无法确定，不能当作竞品事实。
- **推荐**：本文给出的复刻设计选择，不代表竞品真实采用。

#### 2.1 静态覆盖

REA 对历史 ASAR 的 SHA-256 为 `8dd7b6c4a58439d626a9a7b3766982b7c725db2bc1f6ff68a29fc1ec62ca4cf7`。分析了 616 个相关文件、600 个 JavaScript 文件、约 41.16 MB 文本、约 707 万 AST 节点，得到 5220 条 finding。

- Summary Evidence：`ev_37ab48fa94e1a4a125600eb8e827ddbf3c13773acedb6dfd9cea62e1d80f0e99`
- Parent application Evidence：`ev_b16bd6c5d19ac247f6013a27ed6b819ed335bd9faecc8ddacbee814a54ea8c98`
- 原始摘要：[javascript-summary.json](../../evidence/artifacts/javascript-summary.json)

**限制**：应用 inventory 完成，但语义关系图是部分覆盖；若某关系未被 REA 图捕获，不能据此宣称它不存在。若结论来自静态代码，只能说明“实现被打包”，不能自动证明该路径在本次运行中被执行。部分 native 文件的 ASAR integrity metadata 与抽取字节不一致，因此本文不基于这些冲突文件做 native 行为断言。

#### 2.2 动态覆盖

动态采集只落盘 host/path、header 名、字段类型、Protobuf field number/wire type、状态码与时间顺序，不保存 token、cookie、消息正文、账号值或响应值。冻结窗口包含 1972 条有效记录，动态命中 51 个唯一中央 ConnectRPC 路由和 11 个 Box Gateway endpoint。

**覆盖限制**：这些数字是本次时间窗口的下界，不是“所有线上接口都已执行”。代理覆盖了已观察到的 Chromium/Electron/Node 请求，但无法证明不存在绕过代理的 native socket、未启用 feature、其他账号权限或未触发业务路径。

脱敏原始记录：[runtime-api-shapes.jsonl](../../evidence/artifacts/runtime-api-shapes.jsonl)

动态测试有一个重要边界：实际启动时使用了真实的 `~/Library/Application Support/Grok Bot`，不是隔离 profile。因此：

- 窗口内观察到一次 `SendGrokBotUserMessage` 写调用，以及机器注册、1Password 同步等写调用。
- 因为正文和值都被即时丢弃，无法知道是谁触发、发送了什么、是否由某次 UI 操作导致。
- 后续没有继续触发可能计费、创建资源或改变状态的动作。


## 第一轮：动态接口观察结果

> 摘自第一轮报告第 13 节，完整矩阵见 [dynamic-api-matrix.md](../reference/dynamic-api-matrix.md)。


#### 13.1 已确认的关键调用

| 调用 | 次数 | 结论 |
|---|---:|---|
| `Dashboard.RegisterSandMachine` | 1 | 实际注册本机与 local-tool permission；写调用 |
| `GrokBot.SyncOnePasswordConnections` | 2 | 实际同步 1Password 连接目录；触发者未知 |
| `GrokBot.SendGrokBotUserMessage` | 1 | 实际出现消息写请求并返回 HTTP 200；正文、发起者和最终结果未知 |
| `GrokBot.SetGrokBotAgentClientState` | 3 | 实际更新客户端侧 Agent/read state；具体值未知 |
| `GrokBot.EnsureSandBox` | 42 | 持续确保/唤醒 Box；gzip 响应未解压，不能把误读 wire type 当字段 |
| `GrokBot.WatchGrokBotTranscripts` | 19 | 中央 Transcript server stream 确实使用 |
| `GrokBot.WatchGrokBotUserComputerRequests` | 21 | 用户设备 Relay server stream 确实使用 |
| Gateway `/health` | 高频 | Box Gateway liveness/readiness 确实存在 |
| Gateway `/events` | 长连接 | Box SSE event plane 确实存在 |

`forum.cursor.com` 的 GET 比消息写请求早约 34 秒，但没有 trace、request ID 或代码链能建立因果关系，不能说该消息一定由论坛页面触发。

#### 13.2 动态 host

- `api2.cursor.sh`：中央 ConnectRPC、更新、trace 等。
- `api3.cursor.sh`：遥测注册/事件。
- `metrics.cursor.sh`：Sentry envelope。
- `*.us10.cursorvm.com`：Box/Gateway/VNC 周边。
- `api.x.ai`：客户端静态 Voice Realtime 目标；本次未形成完整 Voice 场景验证。

