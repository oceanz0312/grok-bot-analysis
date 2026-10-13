# Grok Bot 0.70.2（Sand）补充笔记：为什么"感觉很快" & 存储快满自动建清理会话

> 范围：只读静态分析 + 已有抓包回放统计；未启动应用、未发网络请求。
> 本文只补充已有报告（full-stack-architecture-report / replication-blueprint-draft / client-interface-map / gateway-schema-summary / api-capability-catalog / dynamic-api-matrix）**没有给出的证据**，已有结论只引用不复述。
> 标注：**[已观察]** = 代码/抓包直接可见；**[推断]** = 由多处证据推理；**[未知]** = 客户端不可见。
> 路径简写：`proto` = `formatted/electron-main/proto.cjs`，`main-app` = `formatted/electron-main/main-app.cjs`，`coord` = `formatted/node-agent-coordinator/main.cjs`，`eager-app` = `app-asar/dist/renderer/assets/index.eager-app-fbmFpqqH.js`，`index` = `app-asar/dist/renderer/assets/index-CjjO5fU0.js`（压缩单行，用关键片段定位）。
> Gateway schema 引用自内嵌在 coord 中的 base64+deflate-raw 压缩 JSON（解压到 /tmp，未写入本目录）。

---

## TL;DR

1. **云电脑"秒开"的核心不是预热池，而是"意图驱动的提前解冻 + 默认让 Box 睡着"。** 客户端把 `TYPING`/聚焦等信号通过 `ReportGrokBotClientPresence` 上报，proto 中服务端动作枚举含 `PRETHAW`；本地还有 present-park/away-park 状态机，只有"人需要"的命令才唤醒 Box，后台命令不唤醒。抓包可见：闲置 15 分钟后，第一次 presence 到 Box pod CONNECT 约 15 秒，其中 connect→pod 约 10 秒。**没有发现 warm pool 证据。**
2. **LLM"回复快"主要是感知层面的：** 乐观行 + clientNonce 回显对账、send-journal 断点续传、增量 transcript 流（内联正文 ≤256KiB，超出单独拉）、离线快照先渲染。客户端有完整的 TTFR（从回车到首块渲染）埋点链，但**没有客户端模型路由/投机执行**。首 token 超时 fallback 为 150 秒，**是兜底参数，不是加速手段**。
3. **存储快满自动建会话：检测在云 Box 端，触发逻辑在桌面渲染层。** Box host 上报磁盘压力 → Gateway SSE `box-disk-pressure` → 渲染层自动器 `SXe` → `roster.createAgent({purpose:"disk-saver", origin:"user", isKickstartRequested:true})`；如果 Agent 已存在，则 `requestDiskSaverAudit` 重新审计。**清理 prompt 不在客户端**，由 Box host 或服务端按 purpose 加 kickstart 注入。会话的 `origin` 被标为 `"user"`，系统来源只能通过 `purpose` 区分。

---

## A. 为什么"感觉很快"

### A0. 启动请求时序（runtime-api-shapes.jsonl，从 L255 起，以首个 CONNECT 为 t=0）[已观察]

| 偏移 | 首次出现的请求 | 说明 |
|---|---|---|
| +0.00s / +0.09s | CONNECT api2 / api3 | 两条 HTTP/2 连接几乎同时建立 |
| +0.49–0.60s | Statsig rgstr、SubmitLogs、GetUserPrivacyMode、BootstrapStatsig | 特性开关最先拉取（park、warming 等行为都受开关控制） |
| +0.90s | ListMarketplacePlugins、**GetMe** | 身份 |
| +1.37–1.99s | RegisterSandMachine、ListSandMachines、GetGrokBotUserRuntimeSettings、GetSandAccessStatus、WatchSandBoxMigration | 本机注册与 Box 迁移监听 |
| **+2.00–2.25s** | GetTeams、GetAvailableMcpServers、**EnsureSandBox ×4**、GetOnePasswordState、GetEffectiveUserPlugins、ListGrokBotAgentAutomations、ListGrokBotSubagents、ResolveGrokBotAttachmentReads、ListGrokBotTranscriptEntries、**WatchGrokBotTranscripts**、GetGrokBotRuntimeCapabilities | **约 250ms 内并发扇出 20 多个 RPC**，没有串行瀑布 |
| +2.59–2.91s | ListSandMcpTools、ReadAttachmentChunk、local-exec-daemon-credential、ListGrokBotAgents、IssueUserComputerCredential | 本机执行守护进程凭证 |
| +3.2–4.5s | 用量/计费、metrics、WatchGrokBotUserComputerRequests、ListGrokBotTeamAgents | 非关键路径排在后面 |
| +176s 起 | ListFinancial*、GetSandBoxUpgradeSchedule、Vault、EmailInbox、McpSettings | **按需懒加载**（打开对应页面时才请求） |
| **+910.8s** | 首次 ReportGrokBotClientPresence → +911.6s GetSandBoxRunState → +911.9s EnsureSandBox(f3) → +915.6s EnsureSandBox(空 body) | 用户回到窗口后的意图唤醒 |
| **+926.0s** | CONNECT `…-pod-….cursorvm.com`（Box 网关） → cookie-origin-approval / webauthn / getAgentWorkflows / `/events` / getForeverBoxStatus / `/health` | **启动阶段完全没有连 Box 网关**，到真正需要时才连 |

结论 [推断]：首屏只依赖中央 API 和本地快照，Box 网关连接被推迟到用户产生意图之后，所以启动不会被冷 Box 阻塞。

### A1. LLM 回复"快"

| # | 机制 | 证据 | 标注 |
|---|---|---|---|
| 1 | **增量流 + 大正文分离**：watch 请求带 `inlineBodyMaxBytes=256KiB`，超出的行进入 `pendingBodies` 单独补拉，按 `updatedSeq` 增量合并、按 `streamAckUpdatedSeq` 确认 | `proto:48193` `WatchGrokBotTranscriptsRequest\|…\|3 inline_body_max_bytes 13`；`coord:36543` `watch({cursors:_n(),includeUnlistedAgents:!0,inlineBodyMaxBytes:UV})`；`coord:35590` 起 `UV=256*1024`，rehydrate 上限 `YV=500` | 已观察 |
| 2 | **乐观发送 + 回显对账**：本地先插入乐观行；服务端 `accepted-echo` 后用 clientNonce 对账（兼容 echoedNonce≠nonce 的改写情况）；失败时移除乐观行并恢复草稿 | eager-app：`onResolved:h=>{…if(S==="accepted-echo"){c.resolveAcked(g),u.arm(g),…m!==g&&(c.resolveAcked(m)…`；`outcome:"flush_failed"…s.removeOptimistic(D(B)),De&&n.recoverDraft(Ui(B),B.draftRecovery)` | 已观察 |
| 3 | **send-journal 持久化**（崩溃或断网后补发） | eager-app `N3={slice:"send-journal",schemaVersion:3,scope:"client-persisted",accountSensitive:!0}`；`sand.send.queued_flush`（`main-app:82921`） | 已观察 |
| 4 | **端到端时延埋点**：`enter_epoch_ms`、`composed_at_ms` 随消息上行；渲染层 TTFR 追踪器从 `enterPerfMs` 算到第一个 assistant 块渲染，只在 accepted-echo 后开始计时；另有 `sand.send.ack` span 记录 ack_ms 和 outcome | `proto:55726` `SendGrokBotUserMessageRequest\|…11 enter_epoch_ms 3?\|12 composed_at_ms 3?`；eager-app `class dye{…emitTtfr(t,n,s,r){this.reportTtfr({ttfrMs:Math.max(0,Math.round(s-t.enterPerfMs)),outcome:n,chunkType:r…`；`main-app:82920–82929` 常量 `sand.send_ack / sand.turn.client_start / sand.render_ttfr / sand.render_stream / sand.transcript.first_layout`；`main-app:107261` `"sand.send.ack"` span | 已观察（说明团队把"感知快"作为可度量指标持续优化） |
| 5 | **首 token 截止时间**：`sand_stream_deadline_config` fallback 为 `{firstTokenDeadlineMs:15e4, idleDeadlineMs:9e4}`；超时归类为 `SAND-E0402 firstTokenStall`（retryable） | `main-app:60451`；eager-app `"SAND-E0402":{name:"firstTokenStall",…retryable:!0…}`；开发者专用开关 `show_dev_only_ttft_warning`（`main-app:56907`） | 已观察；**是兜底，不是加速** |
| 6 | 输入时信号：每个 Agent 在一次输入会话里，第一次进入 composing 时上报一次 `trigger=TYPING`（用 `hinted` 集合去重） | `main-app:115880–115980` `noteComposingAgent` → `R(D,!0,"typing")`；`Ddt.report` 中 `trigger: y.GrokBotClientPresenceTrigger.TYPING` | 已观察；**作用是唤醒 Box（见 A2），不是 LLM 预测** |
| 7 | `composer_send_prewarm` 开关 | `main-app:56401` 默认 false，**全仓库无读取点** | 已观察：死开关或预留 |
| 8 | 模型路由、快模型、客户端投机执行 | 客户端只透传 model 设置；没有找到客户端侧路由或投机逻辑。已有报告中的 70% speculative summarization 属于上下文压缩 | 未知（在服务端） |

### A2. 云电脑（Box）连接"快"

**核心：Box 默认可以睡着，由意图驱动提前解冻，只在真正需要时连接。**

1. **服务端提前解冻协议** [已观察]
   - `proto:45656` `GrokBotBoxIntent = {APP_FOREGROUND, APP_BACKGROUND, CHAT_OPEN, COMPOSER_FOCUS, TYPING, UPLOAD_START, FILE_OPEN, COMPUTER_OPEN}`
   - `proto:45673` `GrokBotBoxIntentAction = {NONE, IN_FLIGHT, PRETHAW, REFUSED}`
   - 载体：`ReportGrokBotClientPresenceRequest|1 agent_id|2 viewing|3 surface|4 trigger #TYPING|5 intent #GrokBotBoxIntent?`，响应 `|1 presence_ttl_ms|2 intent_action #0?|3 intent_reason 9?`
   - 0.70.2 客户端**只发 trigger，没有填 intent 字段**（`Ddt.report`，`main-app:~115968`）。[推断] 服务端把 TYPING 当作 prethaw 信号；更细的 intent 枚举是后续版本或移动端在用。
   - 抓包佐证：+938.7s 和 +939.3s 两次 presence 的字段为 `[1,2,3,4]`，确实带了 field 4 trigger。

2. **本地 park 状态机（只有人需要才唤醒）** [已观察]
   - 命令需求分为 `person` / `background`：`coord:41500–41535` `dispatchCommand` → `PM(e,o?.demand)` 判断为 person 时走 `dispatchPersonCall`：开启 presentPark 时先 `requestBoxIntent({})`；如果发现 Box 睡着，就 `requestBoxIntent({boxFoundAsleep:!0})` 后重试。
   - 后台命令不唤醒的例子：`main-app:113460` `listMcpServerTools(L){ L.demand!=="background" && (await e.noteBoxIntent()) … }`
   - `main-app:88420` `noteBoxIntent` 只在 `parksUntilNeeded()` 时登记意图并 `pushSettled()`；常量：失焦 10 分钟视为离开（`$Zt`），意图唤醒窗口 60 秒（`HZt`）。
   - 抓包佐证：启动后 15 分钟内**完全没有连 Box pod**，第一次 presence 后才 locate（f3）→ connect（空 body）→ +10.4s pod CONNECT。

3. **EnsureSandBox 的三种语义，字段号与抓包对齐** [已观察]
   - `proto:43385` `EnsureSandBoxRequest|2 wake 8?|3 supports_asleep_box 8?`
   - describe = `ensureBox({wake:!1})`（`main-app:92056`，**全仓库唯一一处 wake 字面量**），抓包中为 field 2：启动时 4 次，活跃使用中约每 10–30 秒一次，**只读查询运行状态，不唤醒**。
   - locate = `{supportsAsleepBox:!0}`，即 field 3，HIBERNATED 时返回 asleep，不强制唤醒。
   - connect = 空 body（`ensureBoxPublishingPhase({})`），抓包 L1336 出现在 pod CONNECT 之前。
   - [推断] 默认不带 wake 的 connect 由服务端决定是否唤醒；EnsureSandBox 动态出现 42 次中，绝大多数是 describe 轮询。

4. **网关直连 + 单飞去重** [已观察]：响应自带 `gateway_url/gateway_token/network_token/vnc_url/fork_vnc_base_url/exec_daemon_url`（`proto:43439`），客户端拿到后直连 pod 子域（`main-app:92369` `g7`/`Nze`）；connect 由 `o1e` 做 single-flight，并发调用共享同一个 promise。
5. **预热池 / Forever Box warm pool：没有证据**。所有 "warm/prewarm" 命中都与 Box 预热无关：`sand_working_state_warming`（harness 迁移时的 blob 预拷贝，`main-app:56229/57887`）、语音备忘录 warmth/ttfa（`main-app:89023`）、麦克风 `prewarm()`（eager-app）、egress tunnel standby（`main-app:93346`）。[推断] 冷启动成本靠"打字即解冻"来隐藏，而不是常驻热机。
6. **可能的体验代价** [推断]：从 presence 到 pod 可连接约 15 秒；用户从开始打字到按回车通常也要几秒到十几秒，正好把唤醒时间盖住。

### A3. 客户端"快"

| 机制 | 证据 | 标注 |
|---|---|---|
| **eager 四件套 modulepreload + 大量懒加载 chunk**：539 个 JS；入口 index(2.1MB) 与 eager-common/vendor/platform/app 并行预加载；mermaid、cpp、cynefin 等重型渲染器按需加载 | `dist/renderer/index.html`：`<link rel="modulepreload" … index.eager-{common,vendor,platform,app}…>` 加上 `chunk-prompt-editor`；最大的懒加载 chunk 是 chunk-index(1.0MB)、cynefin(673KB)、cpp(612KB)、mermaid.core(604KB) | 已观察 |
| **离线快照先渲染（SWR）**：`roster.last-roster v4`、`transcript.replicas`、`sidebar.last-sections`、`connection.last-host-capabilities` 都是 host-durable，启动时先从本地恢复；roster 写入防抖 250ms，单条上限 512KiB | eager-app `R1={slice:"roster.last-roster",schemaVersion:4,scope:"host-durable"…},U_e=256,G_e=512*1024,V_e={name:"roster-last-roster-write",delayMs:250}`；启动阶段打点 `onRestoreStage:t=>{performance.mark(\`sand.boot.restore.${t}\`)}`（index） | 已观察（"先渲染后校验"属推断） |
| **启动性能打点**：`sand.boot.entry → client-created → start → restore.* → root-populated`（root 由 MutationObserver 捕获首次挂载） | index `performance.mark("sand.boot.entry")`…`performance.mark("sand.boot.start");On.start()`；eager-app `new MutationObserver(…performance.mark("sand.boot.root-populated")…)` | 已观察 |
| **虚拟列表 / 窗口化**：transcript 用 `rows, initialViewport, overscanRows, overscanPx, forcedRowIds`；菜单用 `rowHeight + overscanCount=5`；CSS 使用 `content-visibility:auto` 和 `contain-intrinsic-size` | index 中 `{rows:F.models,epoch:u,initialViewport:Z,config:wFe,overscanRows:_Fe,overscanPx:CFe,…forcedRowIds:H}`；`index-Dve5Ol5U.css` 中 `.ui-b5mbof{content-visibility:auto}` | 已观察 |
| **图片 rendition/tile**：`readAttachmentImage{path,rendition,tile}` 按尺寸档和分块读取 | dynamic-api-matrix（已有报告），此处不复述 | 已有 |
| 进程分工（main / coordinator / local-exec）、Resource Store、Gateway SSE watchdog | 已有报告已覆盖 | 已有 |

---

## B. 存储快满自动创建清理会话

### B1. 磁盘压力在哪里检测

| 结论 | 证据 | 标注 |
|---|---|---|
| **在云 Box 端检测**，由 Box host 上报 | `proto:49869` `ReportSandBoxHostStateRequest\|1 disk_pressure #0?\|2 host_version\|3 host_update_available`；服务方法 `reportSandBoxHostState`（`proto:64117`）；main、coord、local-exec **三个进程都只有定义、没有调用**，说明调用方在 Box 镜像内 | 已观察（调用方为推断） |
| 本机不检测磁盘 | 本机只用 `os.freemem` 采集内存（`main-core:40308/40358`）；没有 statfs、df 或 `navigator.storage.estimate` | 已观察 |
| 等级只有 soft/hard 两档，阈值未知 | `proto:45713` `GrokBotBoxDiskPressureLevel {UNSPECIFIED,NONE,SOFT,HARD}`；Gateway `SandBoxDiskPressure {level:"hard"\|"soft"}` | 已观察；阈值未知 |
| 两条下发通道，客户端只消费 Gateway 那条 | (a) 中央：`GrokBotBoxState\|6 disk_pressure`（`proto:49798`），由 transcript watch 的 `box_state` 帧（`proto:51490`）下发，但 `coord:46012 onBoxState` 只读 `runState===3`，**不读 disk_pressure**；(b) Gateway：SSE 事件 `box-disk-pressure: SandBoxDiskPressure\|null`，加上 `SandForeverBoxStatus.diskPressure` | 已观察 |
| getForeverBoxStatus 动态响应里没有 diskPressure | dynamic-api-matrix 中该响应只有 7 个字段 | 已观察；[推断] 无压力时可选字段被省略 |

### B2. 谁创建会话（完整链路）[已观察]

```
Box host ──ReportSandBoxHostState──▶ 中央（推断）
Box Gateway ──SSE "box-disk-pressure" / forever-box status──▶ coord（main.cjs:42187 事件映射）
  ──▶ 渲染层 "box-disk-pressure":X=>Rn.ingestBoxDiskPressure(X)
       foreverBox.diskPressureSnapshots（diskPressureFactSeq 防乱序；null 表示解除）
  ──▶ 启动时注册的自动器 whe(=SXe)(On.diskSaver, {hasDiskPressure, subscribe, launchNewAgent, requestReAudit, mintRetry})
       ├─ 没有 Disk Saver：roster.createAgent({name:"Disk Saver", purpose:"disk-saver", origin:"user", isKickstartRequested:true})
       └─ 已有但未运行：requestDiskSaverAudit({id}) → {isAuditInFlight}
  ──▶ helper 必须走 Box host-mediated 创建（creationRoute:{kind:"box"}）
```

关键片段：
- 自动器（eager-app）：`const yXe={name:"disk-saver-mint-hold",mode:"until-signal",initialDelayMs:3e4,maxDelayMs:15*6e4}`；`i=()=>{if(!t.hasDiskPressure()){n=!1,s+=1;return}if(n)return;…e.ensureAuditing(…)==="handled"&&(n=!0)}`。**每轮压力只触发一次**，压力解除后复位；失败从 30 秒起退避，最长 15 分钟。roster 未加载完时返回 `"deferred"`。
- 接线（index）：`launchNewAgent:async t=>(await On.roster.createAgent({name:t.name,description:t.description,purpose:t.purpose,origin:"user",isKickstartRequested:!0})).agent.id`
- 幂等（eager-app `agent-creations` 持久切片）：`create(p){const h=p.clientNonce===void 0&&p.purpose==="disk-saver",g=p.clientNonce??(h?s:null)…`，持久化 `automaticPurpose:"disk-saver"`，**跨重启复用同一个 clientNonce**，不会重复创建。
- 服务端约束：`main-app:42287` `u0e(e){return e.origin==="dev"||e.purpose!==void 0}`，temporal 路径遇到这种情况会抛 "Dev and helper agents require host-mediated creation"。
- 命令需求等级：`coord:37334–37390` `requestDiskSaverAudit:"person"`，**会唤醒 Box**。
- 手动入口：警告条 `wV`。hard 时标题为 "Computer is critically low on disk space"，soft 时为 "Computer is low on disk space"；正文 "Disk Saver is auditing usage and will propose safe cleanup. Nothing is deleted without confirmation."；按钮 "Go to Disk Saver"，点击走 `diskSaver.launch`，遥测为 `disk_saver_launch`。

### B3. Prompt / 模板在哪里

| 结论 | 证据 | 标注 |
|---|---|---|
| **Disk Saver 的清理 prompt 不在客户端** | 只有名称和描述常量：`DE="Disk Saver",Yu="disk-saver",LE="Audits disk usage on Grok Bot's computer and proposes safe cleanup for approval."`；创建时不 `sendPrompt`，只传 `isKickstartRequested:true` | 已观察 |
| 首轮由 Box host 或服务端按 `purpose="disk-saver"` + `kickstart_requested` 注入 | `proto:52127` `CreateGrokBotAgentRequest\|…10 kickstart_requested 8?\|11 introduction_suppressed 8?\|12 purpose 9?\|13 origin 9?\|…17 created_automatically` | 推断；具体文本未知 |
| 对照：**Plugin Setup（purpose="plugin-auth"）的 prompt 打包在客户端**，并作为第一人称用户消息发出 | `chunk-marketplace-browse-model-DSg3YYjD.js`：`he="Some of my installed plugins can't be fetched… run \`gh auth login\` there, then \`gh auth setup-git\`… hand your computer over with request_box_help… verify with a read-only \`git ls-remote\`… Don't change my repositories or any other credentials."`；`createAgent({…purpose,isIntroductionSuppressed:!0})` 后执行 `sendPrompt({agentId,prompt:e.request,initiator:"plugin_setup"})` | 已观察 |

可复刻的结论：helper 会话有两种模板投递方式：**服务端 kickstart（prompt 不可见，可热更新）** 和 **客户端代发首条用户消息（prompt 写在包里，用 initiator 标记）**。

### B4. 会话类型与来源字段

| 层 | 字段 | 取值 | 标注 |
|---|---|---|---|
| 创建 Agent（Gateway `SandCreateAgentArgs`） | `purpose` | `disk-saver` / `plugin-auth` / null（`main-app` `nWt=["disk-saver","plugin-auth"]`） | 已观察 |
| | `origin` | `dev` / `user` / null。**Disk Saver 也标为 `user`** | 已观察 |
| | `isAutomatic` / `created_automatically`、`isKickstartRequested`、`isIntroductionSuppressed`、`creationRoute`、`clientNonce`、`templateId` | — | 已观察 |
| 创建 Agent（中央 proto） | `create_caller` | `ROOM_MEMBERS, ENSURE_SERVER_BACKED, MINT, BACKFILL, PRODUCT_CREATE` | 已观察；含义按名称推断 |
| | `create_intent` | `FRESH, REGISTER_EXISTING_LOCAL` | 已观察 |
| 发消息（`SendGrokBotUserMessageRequest`） | `initiator` | `USER, TEMPLATE_IMPORT, TEMPLATE_SHARE, CARD_ACTION, PLUGIN_SETUP, TEACH_RECORDING` | 已观察 |
| | `send_source` | `CHAT, PUSH, APP_INTENT, ACTION_BUTTON_DICTATION` | 已观察 |
| | `source` | desktop / mobile；`automationWriteProvenance`：`template_import` / `untrusted` | 已观察 |
| 会话 | `GrokBotAgentSessionKind` | `MAIN, SLACK_DM, SLACK_THREAD, DM, GROUP, TEAMS_DM, TEAMS_THREAD, TEAMS_GROUP_CHAT` | 已观察 |
| — | 名为 "system"、"proactive"、"automatic" 的 initiator 或 origin | **不存在**（Gateway schema 全文出现 0 次） | 已观察 |

### B5. 所有"系统主动发起会话/消息"的场景清单

| 场景 | 触发方 | 创建/发送方式 | 来源标记 | 标注 |
|---|---|---|---|---|
| **Disk Saver** | 渲染层自动器（订阅磁盘压力） | createAgent + kickstart；已存在时 requestDiskSaverAudit | purpose=disk-saver，origin=user | 已观察 |
| **Plugin Setup** | 用户点击（`launch()` 是唯一入口，**没有订阅式自动器**） | createAgent（抑制自我介绍）+ 客户端代发 prompt | purpose=plugin-auth，initiator=plugin_setup | 已观察 |
| **Onboarding 模板批量建 Bot** | 首次引导流程 | `chunk-onboarding-flow-DmTWlitk.js`：`pa()` 生成 `{…isKickstartRequested:!0,isAutomatic:!0,templateId}` | isAutomatic、templateId | 已观察 |
| **Onboarding Bot 预置** | `onboarding-bot-provisioner`（超时 45s，最多重试 3 次） | eager-app：`roster.createAgentFromTemplate({shareId:yL,agentId,name:Up,…,isAutomatic:!0,creatorContext})` | isAutomatic | 已观察 |
| 卡片按钮动作 | 用户点击消息卡片 | sendPrompt | initiator=card_action | 已观察（枚举）/ 推断（UI） |
| Teach 录制完成 | 录制结束 | sendPrompt | initiator=teach_recording | 已观察（枚举） |
| 模板导入 / 分享 | 导入或分享流程 | sendPrompt | initiator=template_import/template_share，automationWriteProvenance | 已观察（枚举） |
| 推送 / 系统意图回复 | 移动端推送、App Intent、动作键听写 | sendUserMessage | send_source=PUSH/APP_INTENT/ACTION_BUTTON_DICTATION | 已观察（枚举） |
| 定时 Routines / Automations | 服务端调度 | ListGrokBotAgentAutomations；文案 "Routines paused while you were away"（eager-app i18n `OlsE6e`） | 不经客户端 | 已观察（文案）/ 未知（实现） |
| 服务端补建 / 镜像 Agent | 服务端 | create_caller=BACKFILL/MINT/ENSURE_SERVER_BACKED | 不经客户端 | 推断 |
| Box 升级 / 迁移通知 | 服务端 | GetSandBoxUpgradeSchedule（+207s 首次）、WatchSandBoxMigration | 通知或状态，不是会话 | 已观察（RPC） |

---

## C. 复刻建议（基于上述证据）

1. **用"意图提前解冻 + 默认休眠"代替 warm pool**：presence 上报带 TYPING/COMPOSER_FOCUS，服务端返回 PRETHAW；本地命令分 person/background 两个需求等级，只有 person 唤醒。
2. **EnsureBox 拆成 describe / locate / connect 三种语义**：轮询只用 describe，不唤醒，避免轮询本身把 Box 叫醒。
3. **把磁盘检测放到 Box host**，以 soft/hard 两档经 SSE 推送；客户端自动器做到"每轮压力只触发一次 + 持久化 nonce 幂等 + 退避 30 秒到 15 分钟"。
4. **helper 会话用 `purpose` 标识，不新增 system origin**；prompt 放服务端 kickstart，方便热更新。需要可审计、可本地化的场景，再用"客户端代发 + initiator"。
5. **把感知时延做成指标**：enter_epoch_ms → send_ack → TTFR → first_layout，全链路带 traceparent。
