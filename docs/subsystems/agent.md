# Grok Bot（Sand / com.anysphere.sand 0.70.2）Agent 子系统技术方案还原

> 静态只读分析。标注：`[O]` 观察（附路径:行号）· `[I]` 推断 · `[U]` 未知  
> 源码根：`../../evidence/artifacts/`（解包与格式化产物）

---

## 1. Agent 运行时：用户消息 → Agent 回复

### 1.1 端到端链路

| 步骤 | 谁负责 | 机制 |
|------|--------|------|
| UI 提交 | 客户端 Renderer → Main | 宿主 RPC `sendPrompt` |
| 上行 | 客户端 Main → 中心服务 | Connect `SendGrokBotUserMessage` |
| 投递分流 | 服务端 | `delivery`：`ACCEPTED_BOX` / `ACCEPTED_TEMPORAL` / `DUPLICATE` / `REFUSED` |
| 模型与工具循环 | **BOX**：用户云端 Linux Box 内 agent 进程；**TEMPORAL**：服务端 Temporal workflow | 客户端不本地跑大模型 |
| 下行 transcript | 服务端 journal + 客户端订阅 | `WatchGrokBotTranscripts` / `ListGrokBotTranscriptEntries` |
| 中断 | 客户端 → 服务端 | `InterruptGrokBotAgentRun`（reason=`user_interrupt`） |

**[O]** `sendPrompt` → `sendGrokBotUserMessage`，按 `delivery` 判 accepted：`formatted/electron-main/main-app.cjs:110630-110681`  
**[O]** 请求字段含 agent_id、message_id、text、session_id、attachments、initiator、send_source 等：`formatted/electron-main/proto.cjs:55726-55730`  
**[O]** 响应含 `dispatched`、`mode`（TemporalHarnessMode）、`workflow_id?`、`delivery`、`refusal?`：`proto.cjs:55778`  
**[O]** `interruptAgentRun` → `interruptGrokBotAgentRun`：`main-app.cjs:110691-110707`  
**[O]** TemporalHarnessMode：OFF / SHADOW / LIVE / BOX：`proto.cjs:46124-46131`

**[I]** 中心服务是编排与权威 journal；模型推理与工具执行在 Box 进程或 Temporal worker，不在 Electron 本机。  
**[I]** `workflow_id` 出现在 Send/RoomTurn 响应中，表明 TEMPORAL 路径用 Temporal 工作流承载 turn。

### 1.2 流式协议

**[O]** `WatchGrokBotTranscriptsRequest`：cursors（agent_id + generation + after_updated_seq + session_id）、`include_unlisted_agents`、`inline_body_max_bytes`：`proto.cjs:48193`  
**[O]** 下行帧含 rows / deletes / replay / cleared / cursor_too_old：`proto.cjs:48249-48303`  
**[O]** Coordinator「server transcript tail」订阅 watch，失败时 fallback「gateway for BOX agents」：`node-agent-coordinator/main.cjs:35837`  
**[O]** inline body 上限 `UV = 256 * 1024`：`node-agent-coordinator/main.cjs:35590,36543`  
**[O]** 省略 body 时可 `listGrokBotTranscriptEntries` 补读：`node-agent-coordinator/main.cjs:35920+`

**[I]** 流式语义是「服务端 transcript 行增量 watch」，不是客户端直接挂 LLM token SSE。

### 1.3 工具调用循环在哪里执行

**[O]** `local-exec-daemon` 实现 `ExecServerMessage`：shell / write / delete / grep / read / ls / mcp / fetch / computer_use / subagent / conversation_search / agent_store…：`local-exec-daemon/main.cjs:96569`（proto 同构）  
**[O]** Main 有 harness `callTool` facade：`main-app.cjs:48484-48485`  
**[O]** 后端 MCP：`ExecuteSandMcpToolRequest`：`proto.cjs:33259`  
**[O]** 渲染层对 `tool-call` **直接 `return null`（不画卡片）**：`app-asar/dist/renderer/assets/index-CjjO5fU0.js`（`case"tool-call":return null`，折叠函数 `g_e`）

**[I]** 工具循环在 **Box/exec-daemon（或 Temporal worker 侧同类执行面）** 执行；客户端主要展示消息/审批卡，工具调用 UI 被丢弃。  
**[U]** TEMPORAL 路径是否复用同一 exec 协议，静态未见完整 worker 代码。

### 1.4 卡片 / 审批：打断与恢复

| 卡片类型 | 解析 RPC | 客户端方法 |
|----------|----------|------------|
| auto-review-approval | `ResolveGrokBotAutoReviewApproval` | `resolveAutoReviewApproval` |
| connector-grant | `ResolveGrokBotConnectorGrant` | `resolveConnectorGrant` |
| local-tool-permission | `ResolveGrokBotLocalToolPermission` | `resolveLocalToolPermission` |
| virtual-card / spend | `ResolveGrokBotVirtualCardApproval` / `BeginGrokBotSpendApproval` | 同左 |
| credential / secret | `ResolveGrokBotCredentialRequest` / `SubmitGrokBotSecret` | 同左 |

**[O]** 解析实现：`main-app.cjs:110851-110933`  
**[O]** stale token：`auto-review/stale`、`connector-grant/stale`：`main-app.cjs:41680-41681`  
**[O]** 角色标签 `resolveAutoReviewApproval: "person"`（需真人）：`main-app.cjs:87561`  
**[O]** 审批后服务端继续 workflow；客户端只提交 resolution，不本地续跑模型：`[I]`

### 1.5 中断 / 取消 / 重试 / 用量

**[O]** 中断：`InterruptGrokBotAgentRun`：`proto.cjs:64691`；客户端 `reason: "user_interrupt"`：`main-app.cjs:110696-110699`  
**[O]** 新鲜会话 / 回滚：`StartFreshGrokBotConversation` / `RollBackGrokBotConversation`：`main-app.cjs:110709-110733`  
**[O]** 用量错误码：`USAGE_LIMIT_EXCEEDED`：`main-app.cjs:47906`；proto `FREE_USER_USAGE_LIMIT` / `PRO_USER_USAGE_LIMIT` / `USAGE_LIMIT`：`proto.cjs:5638-5639,45592`  
**[O]** Connect `ResourceExhausted` 映射为 network 类失败：`main-app.cjs:110615-110616`  
**[O]** UI `errorKind==="usage_limit"`（买额度 / 升级 CTA）：renderer index  
**[U]** 自动重试退避策略的完整矩阵（除 rate_limited 文案配置外）未完全展开。

---

## 2. BOX vs TEMPORAL harness（疑点 D3）

### 2.1 定义

**[O]** `GrokBotAgentHarnessKind`：UNSPECIFIED / **BOX** / **TEMPORAL**：`proto.cjs:45812-45817`  
**[O]** BOX：依赖用户 Box；transcript 可由 Box 直推或经 gateway fallback。  
**[O]** TEMPORAL：`CreateGrokBotTemporalAgent`、响应带 `workflow_id`；群聊房间强制 Temporal 创建身份：`main-app.cjs:100646-100672,100702-100707`

### 2.2 默认与开关

**[O]** Feature flag `grok_bot_temporal_harness`：**client: true, default: false**：`main-app.cjs:56178`  
**[O]** 创建路由 `resolve()`：能力开启 → `{kind:"temporal", scope}`，否则 `{kind:"box"}`：`main-app.cjs:100605-100608`  
**[O]** `temporalCreationEnabled` 等运行时能力：`proto.cjs:60178`  
**[O]** `grok_bot_box_harness_turns_blocked` default false：`main-app.cjs:56234`  
**[O]** Temporal 专属 RPC 路径在 `isEnabled()` 关闭时拒绝：`main-app.cjs:100627-100630`

**[I] 当前客户端默认 harness = BOX**（temporal flag 默认关；resolve 回落 box）。  
**[I]** 产品正迁移到 TEMPORAL（存在 `EnsureGrokBotBoxHarnessMigrationPass`、`GrokBotHarnessMigrationRolloutStatus`、`CreateGrokBotTemporalAgent`）。  
**[O]** 群聊 / server room：**只走 Temporal 创建**：`main-app.cjs:100702-100707`  
**[O]** `grok_bot_temporal_harness_rollout.autoReviewEnforce` fallback true：`main-app.cjs:59742-59744`

### 2.3 迁移

**[O]** RPC `EnsureGrokBotBoxHarnessMigrationPass`：`proto.cjs:64305`  
**[O]** 状态字段含 `migration_gate_enabled`、`temporal_harness_mode`、`room_promotion_enabled` 等：`proto.cjs:60288`  
**[U]** 单 Agent 从 BOX 翻 TEMPORAL 的逐步条件在服务端，客户端只读能力位。

---

## 3. 会话与 transcript 存储

### 3.1 权威源 vs 客户端副本

**[O]** 服务端权威：`CommitGrokBotTranscriptEntries` / `ListGrokBotTranscriptEntries` / `WatchGrokBotTranscripts`：`proto.cjs:64004-64016`  
**[O]** 客户端磁盘分类名 `transcript.replicas` / `transcript-replicas`：`main-app.cjs:42238,42256`；coordinator 同：`node-agent-coordinator/main.cjs:5067,5085`  
**[O]** 内存尾：`replicaKey`（`transcript:{agentId}` 或带 session）、`epoch`、`sequence`：`node-agent-coordinator/main.cjs:5139-5148,35857-35858`  
**[O]** 热集最多 **256** 个 agent 状态（`_I = 256`），空闲 **10 min**（`GV = 10 * 6e4`）可驱逐：`node-agent-coordinator/main.cjs:35589-35593,36428-36475`  
**[O]** 分页：`ListGrokBotTranscriptEntriesRequest` 含 `before_seq`、`limit`、`generation`、`session_id`：`proto.cjs:51610`

### 3.2 「200 条 / 768KiB」核实

**[U]** 在格式化源中 **未找到** `transcript.replicas = 200 条 / 768KiB` 的硬编码。  
相近数字：
- `UV = 256 KiB` inline body（非 768）：`node-agent-coordinator/main.cjs:35590`
- `_I = 256` 热 agent 数：同文件 `35589`
- `JA = 200` / `fJ = 200` 为标题截断或其它用途，非 replica：`5616`、`42512`
- Checkpoint records **max 1000** 与 **1 MiB** spill：见下

**[I]** 线索中的 200/768KiB 可能来自旧版本、服务端策略或误读；应以 256 agents / 256KiB inline 为准，直至服务端配置可见。

### 3.3 Checkpoint（易混淆）

**[O]** `checkpoint.records` **最多 1000**（`go.z.array(fMn).max(1e3)`）：`main-app.cjs:121528`  
**[O]** Spill 字节预算 `Tmt = 1024 * 1024`：`main-app.cjs:121434`；超出记 `overflow_evicted`：`121568-121595`  
**[O]** `captureCheckpoint` 来自 **accountTransport 遥测缓冲**（level/message/metadata），不是对话 transcript：`main-app.cjs:83160-83165,122171`

**[I]** 「main-app checkpoint 1000」= **客户端日志/遥测 checkpoint**，不是会话消息上限。

---

## 4. 记忆与知识（疑点 D2）

### 4.1 `user_intent_config` / speculative summarization

**[O]** 仅出现在 Statsig dynamic config schema + fallback：  
- speculative：70% / 5% / 5min / 5min — `main-app.cjs:57999-58004,59880-59887`  
- user_intent：`maxChatsToRead: 100`，两步 prompt 写 `index.md` — `59253-59258,60502-60561`  
**[O]** Prompt 文案明确是 **Cursor IDE** 语境（`{{agentTranscriptsPath}}/*.txt`、`<user_query>`、developer profile、terminal/lint/build）：`60508-60549`  
**[O]** 全仓 `rg`：**无** `tokenUsageThresholdPercentage` / `userIntentDirPath` / `agentTranscriptsPath` 的运行时调用点（除配置定义外）

**[I] 疑点 D2 结论：二者是共享 Cursor 代码树中的远程配置壳，Grok Bot 主路径未接线；不是 Grok Bot 真实记忆管线。**  
**[U]** 服务端 Statsig 若远程强制开启且某处动态 `getConfig` 反射调用，静态可能漏检——但当前无符号级调用链。

### 4.2 Grok Bot 真实记忆 / 知识路径

**[O]** `ListGrokBotUserBotMemories` / `PromoteGrokBotMemoriesToTeam`：`proto.cjs:64577-64583`  
**[O]** `GetGrokBotTeamContextSummary`（summary/skills/learned/memory_count）：`proto.cjs:54689`  
**[O]** Agent 文件：`ListGrokBotAgentFiles` / Upload / Delete：`proto.cjs:64547-64565`  
**[O]** Recipe 含 `memory` / `skills` / `routines` / `plugins`：`main-app.cjs:87243-87369`  
**[O]** Box 可见路径模板：`${SAND_BOX_MODEL_VISIBLE_DATA_ROOT}/agents/${e}/${t}/${n}.${r}`：`main-app.cjs:84798`  
**[O]** Flag `grok_bot_files_in_agent_store` default **false**：`main-app.cjs:56133`

**[I]** Agent「记忆文件」在服务端 bot memories + agent files（及可选 AgentStore），不是客户端 `user_intent` 那套 index.md 流水线。

---

## 5. 多 Agent

### 5.1 感知什么

**[O]** 注册表：`ListGrokBotAgents` / `ListGrokBotTeamAgents`：`proto.cjs:64281-64287`  
**[O]** 群轮次 peers：**仅** `id` / `name` / `description`：`proto.cjs:59096`（`GrokBotRoomMemberTurnPeer`）  
**[O]** 跨 Agent 消息：`SendGrokBotAgentMessage`（from/to/message_id/text/reply_to）：`proto.cjs:56672,64764`  
**[O]** 系统文案强调：**私聊 transcript 不含其他 Agent**，查他人要用工具：`main-app.cjs:37730-37732,40252`  
**[O]** Sidebar / roster 有 `other-bots`：`main-app.cjs:34150`

**[I]** Agent A 默认感知 B：**简介（name/description）+ 显式消息/群 new_messages**；不共享私有 transcript；文件/记忆需经 AgentStore 或服务端 API 另授。

### 5.2 创建与注册

**[O]** `CreateGrokBotAgent` / `CreateGrokBotTemporalAgent` / `CreateGrokBotAgentFromTemplate`：`proto.cjs:64269-64275,64661`  
**[O]** CreateIntent：FRESH / REGISTER_EXISTING_LOCAL；CreateCaller 含 ROOM_MEMBERS / MINT / PRODUCT_CREATE 等：`proto.cjs:45823-45842`  
**[O]** 客户端 `createAgent` 在 Temporal 启用时走 `createGrokBotTemporalAgent`：`main-app.cjs:100610-100668`  
**[O]** Agent 可建 Agent：宿主方法 `createAgent`（person 角色）：`main-app.cjs:87594`

---

## 6. 群聊编排

### 6.1 谁调度

**[O]** 服务端发起 `RequestGrokBotRoomMemberTurn`（定义在 GrokBotService）：`proto.cjs:64940`  
**[O]** 成员侧回传 `DeliverGrokBotRoomMemberTurnResult`；可 `CancelGrokBotRoomMemberTurn`：`proto.cjs:64952,59247`  
**[O]** Dispatch：`ACCEPTED`：`proto.cjs:46399-46402`  
**[O]** 房间创建要求 Temporal：`main-app.cjs:100702-100707`；`serverRoomsEnabled` 能力位：`proto.cjs:60161,60178`

**[I]** **服务端调度器**决定谁发言；客户端/Box 执行 turn 并回报 outcome。非纯客户端轮询。

### 6.2 一轮生命周期

1. 服务端选 member，带 `nonce`  
2. 下发：`room`、`member_agent_id`、`peers[]`、`new_messages[]`、`is_winding_down`、`deadline_ms`、`parent_request_id?`、`root_parent_request_id?`：`proto.cjs:59192`  
3. 成员生成回复 → `Deliver…Result`（outcome + messages + posts）  
4. Outcome：`SENT` / `PASS` / `SKIPPED` / `TIMEOUT` / `CANCELLED` / `ERROR`：`proto.cjs:46413-46421`  
5. Intake：`ACCEPTED` / `UNKNOWN_NONCE` / `HOST_UNAVAILABLE`：`proto.cjs:46428-46433`

### 6.3 防无限对话

**[O]** `is_winding_down` 显式收束：`proto.cjs:59192`  
**[O]** `deadline_ms` 硬截止  
**[O]** 因果链 `parent_request_id` / `root_parent_request_id`（深度/溯源）  
**[O]** `PASS`/`SKIPPED` 允许不开口  
**[O]** `grok_bot_loop_detection` mode default **off**：`main-app.cjs:59746-59748`  
**[U]** 具体深度上限 / token 预算数值在服务端，客户端未见常量。

### 6.4 @ 提及

**[O]** Renderer 有 `everyone`/`all` 集合与 group chats flag：`index-CjjO5fU0.js`（`IPe=new Set(["everyone","all"])`）  
**[I]** @ 路由由服务端结合 new_messages / 提及解析后选 member turn；客户端负责展示。  
**[U]** 精确 mention 解析实现位置（服务端）不可见。

### 6.5 群里密码 / 登录卡

**[O]** 敏感 send-message 类型在 `Uwe` 中一律标为 `"card"`（credential-request、secret-request、onepassword-connect、virtual-card…）：renderer `Uwe`  
**[O]** 群聊 elevated 表面用 `$_e(..., groupChatViewer)` 折叠；`Xy` 默认 `{authId:undefined,isGroupChatsEnabled:false}`  
**[O]** `lCe` 集合列出一批「交互卡」类型（含 credential/secret/onepassword）用于布局度量  

**[I]** 敏感交互设计为 **真人审批卡**；群聊场景用 elevated/viewer 上下文，但 **未找到**「仅主 Bot 渲染、群内完全剥离」的硬过滤函数。  
**[U]** 「群里不能做密码/登录」若成立，更可能是 **服务端不对 ROOM 下发此类 widget** 或产品策略；客户端证据不足，标为部分证实。

---

## 7. tree-sitter-bash（疑点 D7）

**[O]** `local-exec-daemon` 加载 `tree-sitter` + `tree-sitter-bash`：`local-exec-daemon/main.cjs:98653-98672`  
**[O]** 解析产出：`executableCommands[]`、`hasRedirects`、`hasCommandSubstitution`、`redirects`、legacy simpleCommands：`98684-98712`  
**[O]** 用于：
- 沙箱策略选择 `Gg()`（解析失败则收紧策略）：`105629-105642`
- 管理员 denylist 匹配（fail-closed）：`105821-105961`
- `ShellAllowlistPrecheck` / `classifier_result` / `smart_mode_approval` 管线：`87238,94062,97624`

**[I] 是：用于命令安全分析与自动审批/放行预检，不只是语法高亮。**  
**[O]** natives 缺失时 degrade `parsingFailed`：`98669`

---

## 8. 后台任务 / BackgroundComposer / AgentStore

### 8.1 Grok Bot Automations / Tasks

**[O]** `ListGrokBotAgentAutomations`（`automation_id` + `record_json`）：`proto.cjs:49911-49954`  
**[O]** Enable/Delete；账户级 `ListGrokBotAccountAutomations`：`proto.cjs:64124-64197`  
**[O]** `ListGrokBotAgentTasks` / MarkDone / MarkRead：`proto.cjs:64142-64165`  
**[O]** 宿主 RPC 有 `type: "cron"` 字面量：`main-app.cjs:47177`  
**[I]** Grok Bot「定时/后台」= **Agent Automations（cron/webhook 等，细节在 record_json）+ Tasks**，由服务端调度唤醒 Agent。

### 8.2 BackgroundComposer

**[O]** 完整 `BackgroundComposerService`（VM、PR、repo、status CREATING/RUNNING/FINISHED…）：`proto.cjs:39650` 等  
**[O]** Main 有 getInfo / listArtifacts / turnSummary：`main-app.cjs:106386+,111986+`  
**[I]** 这是 **Cursor Cloud Agent / Background Composer** 共享栈；Grok Bot UI 可嵌「cursor-agent」卡（`message.type==="cursor-agent"`），但是独立产品面，不是 Box Agent 主路径。

### 8.3 AgentStore

**[O]** 服务：`ListAgentStores`、`ListAgentStoreDirectory`、`Read/Write`、`PresignAgentStoreReads`、`ListAgentStoreFiles`（含 tombstones）、multipart 上传、版本 `CheckAgentStoreVersions`：`proto.cjs:2826-3653`  
**[O]** Tombstone 同步配置默认：full_refresh_rounds=2880、interval=1440min、prune_slack=4320min：`main-app.cjs:60308-60310`  
**[O]** Presign 并发等：`presign_concurrency: 4`：`60276`  
**[O]** Grok Bot 侧 `presignAgentStoreReads` 调用：`main-app.cjs:94525`  
**[O]** `grok_bot_files_in_agent_store` 默认关：`56133`

**[I]** AgentStore = 云端 Agent 文件仓库（S3 风格 presign + tombstone 删除同步 + 可选锁/冲突写）；可挂到 Box `mounted_agent_stores`（RequestContextEnv）。

---

## 9. 系统 prompt / 工具清单（客户端可见类别）

### 9.1 执行面工具类别（Exec / ClientSideToolV2）

**[O]** `ClientSideToolV2`（proto：`9099-9156`）可归类为：

1. **文件系统**：READ/EDIT/DELETE/LIST/GLOB/FILE_SEARCH、READ/EDIT_V2  
2. **搜索**：RIPGREP、SEMANTIC_SEARCH、SEARCH_SYMBOLS、DEEP_SEARCH、READ_SEMSEARCH  
3. **终端**：RUN_TERMINAL_COMMAND_V2、WRITE_SHELL_STDIN  
4. **Web**：WEB_SEARCH、WEB_FETCH  
5. **MCP**：MCP、CALL_MCP_TOOL、LIST/READ_MCP_RESOURCE、GET_MCP_TOOLS、MCP_AUTH  
6. **任务/Todo**：TASK、TASK_V2、AWAIT_TASK、TODO_READ/WRITE、AWAIT  
7. **计算机使用**：COMPUTER_USE、RECORD_SCREEN  
8. **协作/产品**：ASK_QUESTION、SEND_TO_USER、CONNECT_SCM、BACKGROUND_COMPOSER_FOLLOWUP  
9. **其它**：CREATE_DIAGRAM、GENERATE_IMAGE、KNOWLEDGE_BASE、PLAN、PROJECT、LINT、REFLECT、AI_ATTRIBUTION…

**[O]** ExecServerMessage 额外：diagnostics、hooks、smart_mode_classifier、shell/mcp/web_fetch **allowlist precheck**、agent_store_conflict、conversation_search、canvas_diagnostics：`local-exec-daemon/main.cjs:96569`

### 9.2 Grok Bot 权限模型

**[O]** `GrokBotToolPermission`：ALWAYS_ALLOW / NEEDS_APPROVAL / BLOCKED：`proto.cjs:45771-45776`  
**[O]** Policy：`tools` map + reads/writes：`proto.cjs:51068`  
**[O]** User computer capabilities：messages / shell / mobile_local_tools / ai_tool_setup：`proto.cjs:58176`  
**[O]** 外部发送标注工具样例：slack_send_message、gmail send_*、place_phone_call、SendIMessage：`main-app.cjs:59754-59819`

### 9.3 System prompt

**[O]** 可远程覆盖：`grok_bot_system_prompt_override.basePrompt`：`main-app.cjs:57945-57946`  
**[O]** 语音/通话等专用 prompt 片段在 main-app 大量字符串（如 descriptionHoldLine）：`40378+`  
**[U]** Box 内完整 system prompt 模板文件不在解包客户端中。

---

## 10. Coordinator = facade

**[O]** Main `utilityProcess.fork` 拉起 `sand-node-agent-coordinator`：`main-app.cjs:100084,107362,100140`  
**[O]** Coordinator 聚合：server transcript tail、roster、agent 方法路由（含 interrupt/kickstart/room members）、向 Box/gateway 转发：`node-agent-coordinator/main.cjs:42525+`  
**[I]** Coordinator 是 **本机多 Agent 会话门面 + transcript 尾缓存**，不是模型执行引擎。

---

## 附录：关键数字速查

| 项 | 值 | 位置 |
|----|-----|------|
| Temporal harness flag 默认 | false | main-app:56178 |
| Speculative（Cursor 共享配置） | 70% / 5% / 5min / 5min | main-app:59883-59886 |
| user_intent maxChats | 100 | main-app:60505 |
| Transcript inline body | 256 KiB | coordinator:35590 |
| Transcript 热 agent 数 | 256 | coordinator:35589 |
| Transcript 空闲驱逐 | 10 min | coordinator:35593 |
| Checkpoint records | ≤1000 | main-app:121528 |
| Checkpoint spill | 1 MiB | main-app:121434 |
| JSON 对象串上限 | 64 KiB | coordinator:38320 |
| Room turn outcomes | SENT/PASS/SKIPPED/TIMEOUT/CANCELLED/ERROR | proto:46416-46421 |
| Tool permission | ALWAYS_ALLOW/NEEDS_APPROVAL/BLOCKED | proto:45774-45776 |
| loop_detection 默认 | off | main-app:59748 |
| AgentStore tombstone prune | 4320 min | main-app:60310 |

