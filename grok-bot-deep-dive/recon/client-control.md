# Grok Bot 0.70.2 客户端控制面技术方案还原

> 产物：静态只读分析（不运行应用、不发网络请求）  
> 证据根：仓库根目录（`../../`）  
> 版本：`0.70.2` / `productName: Grok Bot` / `name: sand` / Electron 入口 `dist/electron-main/main.cjs`  
> 证据标签：`[O]` 观察（附路径:行号）· `[I]` 推断 · `[U]` 未知  

路径简写：
- `main.cjs` = `app-asar/dist/electron-main/main.cjs`（未格式化，约 5 行打包入口）
- `main-core` = `formatted/electron-main/main-core.cjs`
- `main-app` = `formatted/electron-main/main-app.cjs`
- `proto` = `formatted/electron-main/proto.cjs`
- `preload` = `formatted/electron-preload/preload.cjs`
- `coord` = `formatted/node-agent-coordinator/main.cjs`
- `exec` = `formatted/local-exec-daemon/main.cjs`
- `eager-app` = `app-asar/dist/renderer/assets/index.eager-app-fbmFpqqH.js`（压缩单行，行号均视为 1；用偏移/片段定位）
- `eager-platform` = `app-asar/dist/renderer/assets/index.eager-platform-DUN5VkaE.js`
- `index.html` = `app-asar/dist/renderer/index.html`

---

## 1. 进程模型与冷启动

### 1.1 职责划分

| 进程/层 | 职责 | 证据 |
|---|---|---|
| Electron Main（main.cjs → main-core → main-app） | 单实例、协议注册、窗口、账号/token、自动更新、desktop.main IPC、启动 Coordinator/Local Exec、telemetry/Sentry/Statsig、native helper 加载 | [O] `main.cjs` 用 V8 code cache 先跑 `main-core`，`remainderDue` 后再跑 `main-app`；buildId=`2b69539c-…` |
| Renderer（React） | UI、乐观更新、本地持久切片、经 preload 调 Main、经 `coordinatorPort` 直连 Coordinator | [O] `index.html:19-28`；`preload:5068-5077` |
| Preload（contextIsolation） | 白名单暴露 `desktop` / `coordinatorPort` / `sandRenderTrace` / `desktopMount`；不暴露裸 `ipcRenderer` | [O] `preload:5068-5075` |
| Node Agent Coordinator（utilityProcess） | Agent/Transcript/Box Gateway 状态机、ConnectRPC 客户端、SSE 重连、Local Exec 监督 | [O] `main-app:100084-100140` `serviceName: sand-node-agent-coordinator`；三条 MessagePort：control / renderer-data / main-data |
| Local Exec Daemon（utilityProcess） | 本机 Shell/文件/Messages/Computer Use/MCP 工具执行与权限 | [O] `coord:37516-37524` 发现与凭证文件；架构报告交叉验证 |
| chrome-import-worker.cjs | Chrome Cookie 导入 worker | [O] `main-app:80275` |
| Native：`sand_notification_settings.node` | 读 OS 通知权限 | [O] `deps/sand-notification-settings` |
| Native：`cursor_proclist.node` | 异步扫描本机进程列表（堆/遥测相关） | [O] `main-app:118929-118950`；与 heap-metrics 同区 |
| Helper：随包 CUGrokBotService（Swift）/ 外置 CUCursorService | Messages/Contacts；GUI Computer Use | [I] 既有接口地图与二进制布局；本轮未复扫 Mach-O |

### 1.2 启动顺序（冷启动关键路径）

1. **[O]** `main.cjs`：解析 `--user-data-dir` / `SAND_USER_DATA_DIR` → 在 `userData/v8-code-cache` 用 `vm.Script`+cachedData 加载 `main-core.cjs` → 等待 `remainderDue` → 再加载 `main-app.cjs` 并 `reportMainCodeCache`（并行：代码缓存命中可缩短二次启动）。
2. **[O]** `main-core:45381`：`requestSingleInstanceLock()`；失败则 `app.quit()`。
3. **[O]** `main-core:45501+`：`app.whenReady()` 后：语言、数据根结算、深链、settings、硬件加速、遥测 sink；非主实例直接 cancel。
4. **[I]** `main-app` 在 remainder 阶段创建窗口、fork Coordinator、装挂 IPC；Local Exec 由 Coordinator 监督发现而非 UI 线程直接起。
5. **[O]** Renderer：`index.html` 对 `eager-common / eager-vendor / eager-platform / eager-app` 与 `chunk-prompt-editor` 做 `modulepreload`，入口 `index-CjjO5fU0.js` 再懒加载重型 chunk（mermaid/cpp 等）。

### 1.3 eager 分包意义

| Bundle | 意义 | 证据 |
|---|---|---|
| eager-vendor | React/第三方稳定层 | [O] `index.html:21`；`package.json` React Query/Lingui/StyleX/TipTap |
| eager-platform | 平台 UI 原语 + **自研列表虚拟化**（`@anysphere/virtual`，overscanRows/Px） | [O] `eager-platform` overscan；`package.json:@anysphere/virtual` |
| eager-app | SandClient、Coordinator 桥、持久切片、乐观发送 | [O] `eager-app` 含 `send-journal`/`roster`/`AMe=256` |
| eager-common | 极小公共引导 | [O] ~12KB |
| index + lazy chunks | 路由后能力与重型渲染器 | [O] notes-speed 交叉：539 JS |

**[I]** 目的：首屏只拉“壳+状态机+虚拟列表”，把图表/语法高亮推迟，降低 TTI。

### 1.4 单实例与协议唤起

- **[O]** 单实例：`main-core:45381` `$d = !isPackaged \|\| requestSingleInstanceLock()`。
- **[O]** 协议 schemes：`["grokbot","sand"]`（`main-core:19898`）；主实例 `setAsDefaultProtocolClient`（`16989`）。
- **[O]** `open-url` / `second-instance` 汇入统一 deep-link dispatcher（`main-core:16972-16983`）；深链 outcome 打日志（`main-core:45450` 附近）。
- **[O]** MCP OAuth 回调示例：`grokbot://mcp/oauth/callback`（`main-app:546`）；登录 deep control：`/loginDeepControl?redirectTarget=sand`（`main-app:32516+`）。

---

## 2. 渲染层架构

### 2.1 UI / 状态 / 路由

- **[O]** React 19 + React DOM；StyleX；Lingui i18n；TipTap 3；`@tanstack/react-query` 5；`@base-ui/react`（`app-asar/package.json`）。
- **[O]** 核心状态：**自研 Resource/SandClient 图 + `useSyncExternalStore`**（既有架构报告与代码切片名一致）；React Query 作辅助查询，不是 Agent 权威状态。
- **[U]** 具体路由库名（是否 React Router）未在本轮压缩包中直接抽出；存在 surface/pane/history 导航语义。

### 2.2 本地持久化

**不是 SQLite/IndexedDB 主路径**（本轮未观察到 renderer 使用 IndexedDB/SQLite 作为主存储）。

观察到的是 **Main/客户端切片 registry**，按 `scope`：

| scope | 典型切片 | 存什么 |
|---|---|---|
| `client-persisted` | `send-journal`、`composer-drafts`、`selection.last-agent`、`ui-layout`、`usage-warning.dismissal`、`weekly-usage.cache` | 账号敏感草稿/发送日志/UI |
| `host-durable` | `roster.last-roster`（debounce 250ms，≤512KiB）、`transcript.replicas`（≤200 entries / 768KiB）、`sidebar.last-sections`、`connection.last-host-capabilities` | 启动可先渲染的快照 |
| 安全存储 | Electron `safeStorage` 加解密 token/敏感串 | [O] `main-app:94009+`、`111144+` |

**[I]** 物理落盘为 userData 下 JSON/加密 blob（经 Main IPC），非浏览器 IndexedDB。

### 2.3 让客户端显得快的设计

| 机制 | 要点 | 证据 |
|---|---|---|
| 乐观发送 | 先插乐观行；`accepted-echo` + `clientNonce` 对账；失败 `removeOptimistic` 并恢复草稿 | [O] notes + eager-app 片段 |
| send-journal | schemaVersion 3，崩溃/断网补发 | [O] `N3={slice:"send-journal"...}` |
| 增量 transcript | `inlineBodyMaxBytes=256KiB`；更大 body → `pendingBodies` 另拉 | [O] `coord:35590 UV=256*1024`；`proto` Watch 请求 |
| 离线快照 SWR | roster/transcript/sidebar 先 restore 再校验 | [O] eager-app slices |
| 列表虚拟化 | `@anysphere/virtual`，pinned-bottom + overscan | [O] eager-platform |
| TTFR 埋点 | `sand.render_ttfr` / `enter_epoch_ms` / `composed_at_ms` | [O] proto Send 字段；main-app 常量 |
| 首 token 兜底 | fallback `firstTokenDeadlineMs:150000`，`idleDeadlineMs:90000` | [O] notes → `main-app:60451` |
| V8 code cache | Main 层二次启动加速 | [O] `main.cjs` |

---

## 3. Renderer ↔ Main ↔ Coordinator 通信

### 3.1 通道

```
Renderer --ipc invoke/on--> Preload desktop.main (≈301 methods)
Renderer --MessagePort--> Coordinator (coordinatorPort / renderer-data)
Main     --MessagePort x3--> Coordinator (control, renderer-data, main-data)
Renderer --MessagePort--> Main (sandRenderTrace，懒创建)
```

- **[O]** Preload 组装：`preload:5014-5077`；`sand:coordinator-port-request` → Main 投递 port → `sand:coordinator-port`。
- **[O]** Coordinator 启动：`main-app:100084-100200`；broker 支持请求/撤销/重启与 generation 过滤（`100140+` `mnn`）。

### 3.2 Pending calls 上限 256 与端口原子替换

- **[O]** `eager-app`：`const AMe=256`；端口未 adopt 前，预端口调用队列 `t.length>=AMe` → reject `"pre-port call queue is at its bound"`。
- **[O]** `Dp()` 占位 source → 真正 MessagePort 到来后 `settle()` 拒绝残留队列；`kMe.swap(...,{replacesPort})` 发 `connected`/`port-replacement`，避免旧 reply 污染。
- **[O]** Preload `ss()`：单消费者 `claim`；`deliver` 只转给当前 claimer（`preload:4935-4955`）。
- **[O]** Main broker：`requestRendererPort` 若已服务则 `_()` 先 dispose 旧 launch 再 fork 新进程并 `g()` 再次交付（原子替换语义）。
- **[I]** “背压”：预端口队列硬上限 256；Gateway/Local Exec 另有 backlog（报告称并发 8 / backlog 64 / 响应最多 256 帧或约 8MiB）——属执行面参数，控制面以队列拒绝代替无限堆积。

---

## 4. 网络层（中央控制面）

### 4.1 协议与主机

- **[O]** **ConnectRPC**：`application/connect+proto` / `application/connect+json`；头 `Connect-Protocol-Version`、`Connect-Timeout-Ms`（`main-app:14377+`、`14574`；`coord:33422+`）。
- **[O]** 传输：**Node HTTP/2 session 池**（`main-app:15585+`；`coord:34361+`）；非 gRPC-web 浏览器路径为主。
- **[O]** 默认 API：`https://api2.cursor.sh`（`main-app:666`、`32495`；preload `Tp="api2.cursor.sh"`）。
- **[O]** 遥测/Statsig 日志代理：`https://api3.cursor.sh/tev1/v1`（`main-app:61654`）。
- **[O]** Sentry DSN host：`metrics.cursor.sh`（`main-core:21023`；eager-app 同 DSN）。
- **[I]** 经 Envoy/网关终止 Connect——动态矩阵有记载；静态包仅见客户端主机名。

### 4.2 请求头

常见组合（[O] `main-app:16604-16633`、`61541+`、`34100`）：

- `Authorization: Bearer <accessToken>`
- `x-cursor-team-id`、`x-cursor-checksum`（机器指纹）
- `x-cursor-client-type` / `x-cursor-client-version`（如 `sand-desktop`）
- `connect-protocol-version: 1`
- `traceparent`（W3C；Coordinator/Gateway 广泛携带，`coord:40322+`）
- 可选 workload / traffic-type / timezone / ghost-mode / request-id

### 4.3 流式订阅、心跳、重连

**中央 Transcript watch（Coordinator）** [O] `coord:35590-35730`、`18354` 帧类型含 `heartbeat` / `cursor_too_old` / `rows`：

| 参数 | 值 |
|---|---|
| inlineBodyMaxBytes | 256 KiB |
| stall watchdog idleMs | 60s (`t9`) |
| retry backoff | initial 1s → max 60s，factor 2 |
| backend watch pace | initial 4s → max 60s |
| body retry | maxAttempts 5；2s→30s |
| clean reconnect | 单次 3s |
| network-return reconnect | 单次 250ms |

**Box Gateway SSE** [O] `coord:40957-41082`：

| 参数 | 值 |
|---|---|
| reconnect backoff | 1s → 10s，factor 2 |
| connect timeout | 15s (`pE`) |
| stall watchdog | 35s (`uE`) |
| health/network probe | 1.5s |
| send POST / roster / transcript read | 默认 15s |
| createAgent retry | 3 次，1s→4s |

**[I]** 增量游标：请求带 `cursors` / `before_seq` / `updatedSeq` / `streamAckUpdatedSeq`；`cursor_too_old` 触发重种。

### 4.4 超时

- Connect 层：`Connect-Timeout-Ms` + per-call `defaultTimeoutMs`（具体默认值随 transport 构造，[U] 未钉死单一全局毫秒）。
- 业务 DeadlinePolicy 命名如上表。

---

## 5. 控制面服务划分（proto.cjs）

**[O]** 7 个 `aiserver.v1.*Service`；`name`+`I:` 方法条目 **484**（唯一名 **429**），与既有目录一致：

| 服务 | 方法数 | 职责概述 |
|---|---:|---|
| GrokBotService | 309 | 个人 Agent 产品主 API：Agent/Box/消息/附件/密钥/连接器/模板等 |
| DashboardService | 73 | Cursor 账号/团队/计费/用量/机器/MCP OAuth/GitHub |
| SandBoxService | 55 | 与 GrokBot 重叠的 Box 生命周期子集（复用） |
| AgentStoreService | 24 | Agent 文件仓读写/可见性/multipart |
| AiService | 8 | 模型列表、生图、进程/数值 metrics |
| AnalyticsService | 8 | Track/Batch/SubmitLogs/**BootstrapStatsig** |
| BackgroundComposerService | 7 | Cloud/Background Composer 元数据 |

### 5.1 GrokBotService 领域分组（机械关键字，允许交叉）

| 领域 | ≈数 | 代表接口 |
|---|---:|---|
| agent/roster | 61 | `ListGrokBotAgentStatuses`、`SetGrokBotAgentClientState`、`NotifySandAgentTurnFinished` |
| admin | 40 | `AdminRecreateSandBox`、`AdminWatchSandBoxMigration` |
| template/marketplace | 32 | `ListGrokBotTemplates`、`ListGrokBotLibraryDocs` |
| box/computer | 30 | `EnsureSandBox`、`RecreateSandBox`、`PresignSandBoxStoreWrites` |
| mcp/connector | 22 | `GetGrokBotUserMcpSettings`、`ResolveGrokBotConnectorGrant` |
| secret/vault | 15 | `ListGrokBotSecrets`、`PutGrokBotSecret` |
| watch/stream | 11 | `WatchGrokBotTranscripts`、`CommitGrokBotTranscriptEntries` |
| auth/passkey | 11 | `StartPasskeyEnrollment`、`FinishPasskeyRegistration` |
| room/group | 9 | `ReadGrokBotGroupChatDocument` |
| onepassword | 9 | `BeginOnePasswordConnection`、`SyncOnePasswordConnections` |
| attachment/file | 8 | `BeginGrokBotAttachmentUpload`、`CompleteGrokBotAttachmentUpload` |
| email | 7 | `SendGrokBotEmail`、`SearchGrokBotEmailThreads` |
| message/chat | 7 | `SendGrokBotUserMessage`、`ReactToGrokBotMessage` |
| settings/runtime | 5 | `GetGrokBotRuntimeCapabilities`、`UpdateGrokBotUserRuntimeSettings` |
| task / skill-memory / meeting | 4 each | `ListGrokBotTasks`、`PublishGrokBotUserSkillsSnapshot`、`LeaveGrokBotServerMeeting` |
| billing/spend | 2 | `BeginGrokBotSpendApproval`、`FinishGrokBotSpendApprovalAssertion` |
| other | ~22 | presence、conversation rollback、widget 等 |

**Dashboard 用量/计费代表** [O]：`GetCurrentPeriodUsage`、`GetSandUsageStatus`、`GetTeamPrepaidBilling`、`GetHardLimit`、`RegisterSandMachine`、`ListSandMachines`。

---

## 6. 账号 / 认证

### 6.1 登录流程

1. **[O]** 生成 PKCE：`uuid` + `verifier`/`challenge`（`main-app:32516-32523`）。
2. **[O]** 打开浏览器：`https://cursor.com/loginDeepControl?mode=login&redirectTarget=sand&supportsSelectedTeamLogin=true`（可覆盖 website URL）。
3. **[O]** 客户端轮询 `GET {api2}/auth/poll?uuid=&verifier=`：最多 **150** 次；初始延迟 1s、上限 10s、backoff **1.2**；连续非 404 错误 ≥3 放弃（`r1t` / `s1t`）。
4. **[O]** 成功返回 `accessToken` + `refreshToken`；亦可 `loginWithApiKey` → `/auth/exchange_user_api_key`。
5. **[I]** 深链 `grokbot://` / `sand://` 用于 MCP OAuth/激活，登录主路径是 **外置浏览器 + poll**，不是纯应用内 WebView 表单。

### 6.2 Token 存储与刷新

- **[O]** Electron `safeStorage.encryptString/decryptString` 持久化（`main-app:94009+`）。
- **[O]** `refreshAccessToken` + DeadlinePolicy `cursor-auth-refresh-access-token`；失败上报 `cursor-auth` edge。
- **[O]** `loginFlight` 状态机对外暴露 `getLoginFlight` / `cancelLoginFlight`。

### 6.3 多账号

- **[O]** IPC：`login` / `addAccount` / `switchAccount` / `listAccounts` / `removeAccount`（`main-app:81997+`）；`accountSlot` 贯穿请求作用域。
- **[O]** 切换前 `releaseClientPresence`，后再 `resume`；`switchToSavedAccount`。
- **[I]** Coordinator 端口替换与 accountSlot 绑定，防止串号。

---

## 7. 计费 / 用量

- **[O]** `DashboardService.GetCurrentPeriodUsage`：周期、`plan_usage`、`spend_limit_usage`、`display_message`、阈值字段（`proto:36366-36452`）。
- **[O]** `GetSandUsageStatus`：Sand/Grok 试用、upgrade 推荐、unified billing、team seat、`cursor_plan_name`（`proto:37063`）。
- **[O]** 错误枚举：`FREE_USER_USAGE_LIMIT` / `PRO_USER_USAGE_LIMIT`；`USAGE_LIMIT`；客户端 `USAGE_LIMIT_EXCEEDED`（`proto:5638+`、`main-app:47906`）。
- **[O]** ErrorButton 可走 `upgrade` / `configure_spend_limit` / `dashboard_action`（`proto:5782`）。
- **[O]** 本地 `usage-warning.dismissal`、`weekly-usage.cache` 切片；prepaid hard limit / auto top-up IPC（`main-app:81983+`）。
- **[O]** Feature gate 例：`grok_bot_check_subscription_usage`（default false）、`service_account_spend_limit_enforcement`。

---

## 8. 可观测性与远程配置

| 通道 | 用途 | 证据 |
|---|---|---|
| Sentry（`@sentry/electron`）→ `metrics.cursor.sh` | 崩溃/错误；环境 `sand`/`sand-nightly`/`sand-dogfood`/`sand-lab` | [O] `main-core:21296`、`21023` |
| AnalyticsService.SubmitLogs / TrackEvents | 结构化日志与事件 | [O] proto + `main-app:83448` |
| OpenTelemetry | span 导出；`traceparent` 传播 | [O] package + coord |
| Statsig（`@statsig/js-client`） | Feature gate / 动态配置 | [O] `BootstrapStatsig`；缓存 `sand-statsig-bootstrap.json`；log proxy `api3.../tev1/v1` |
| 桌面 telemetry report | `desktopLog`、大量 `sand.*` 指标名 | [O] main-core / main-app |
| proclist native | 进程列表扫描 → heap-metrics 路径 | [O] `main-app:118941+` |

**[O]** 实验服务：`SandExperimentService`，bootstrap 拉取后本地缓存，轮询带 jitter（`c9e`）；大量 gate 默认值写在 `main-app:56xxx` schema（如 `sand_notification_sounds` default false）。

---

## 9. 更新

- **[O]** macOS **Squirrel**；其它平台 `iupdate`/`nsis`/`appimage`（`main-core:30757`、`30909`）。
- **[O]** 渠道/track：`sandTrack` → Sentry env `nightly`/`dogfood`/默认 `sand`；`setFeedURL` + `checkForUpdates`（`main-app:125003+`）。
- **[O]** 触发：`startup`（默认延迟 **30s** `NPn=3e4`）、`periodic`、`explicit`、`track_change`、`min_version`、`backend_gate`、空闲 `quitAndInstall`。
- **[O]** 远程可配 periodic retry：base 5min / max 30min（fallback `60384`）。
- **[U]** 具体 CDN feed URL 字符串未在本轮完整抽出（由 track + setFeedURL 决定）。

---

## 10. 通知与 native 模块

### 10.1 系统通知

- **[O]** Electron Notification API 路径存在；声音受 gate `sand_notification_sounds`（员工/Anysphere）控制（`main-core:27121`、`main-app:56197`、`108040`）。
- **[O]** `ReportGrokBotNotificationPermission` 上报权限。

### 10.2 `sand_notification_settings`

- **[O]** Native addon：`notification_settings_async()` 读 **本应用** 在 macOS/Windows 的 OS 通知权限；映射 `authorized/provisional/ephemeral→granted`，`denied`，`notDetermined→undetermined`（Win：`enabled/appDisabled/...`）（`main-app:115508-115580`；`index.js` 注释）。

### 10.3 `cursor_proclist`

- **[O]** `cursor_proclist_scan_async(t)` 返回进程行数组；失败分类 `addon-missing` / `malformed-result` / `scan-failed`。
- **[I]** 用于本机进程清单类遥测/heap-metrics（与 `heap-metrics` flush 代码相邻），**不是**用户可见“任务管理器 UI”。

---

## 11. 关键数字速查

| 项 | 数字 |
|---|---|
| 中央服务 | 7 |
| RPC 方法条目 / 唯一名 | 484 / 429 |
| GrokBot / SandBox 复用 | 309 / 55 |
| Main IPC 声明方法 | 301 |
| Coordinator 预端口 pending 上限 | 256 |
| Transcript 内联正文上限 | 256 KiB |
| Transcript stall | 60 s |
| Gateway SSE stall | 35 s |
| Gateway reconnect | 1s→10s ×2 |
| 登录 poll | ≤150 次，1s→10s ×1.2 |
| 更新首次检查延迟 | 30 s |
| roster 快照 | ≤512 KiB，debounce 250 ms |
| transcript replicas | ≤200 / 768 KiB |
| Electron / 产品版本 | package `0.70.2`；架构报告称 Electron `42.1.0`（[O] 报告；本轮未再读 Electron 二进制） |

---

## 12. 明确未知

- Gateway 物理部署位置（Box 内 vs 边缘）— 客户端无法证明。  
- Renderer 路由库的确切包名。  
- Connect `defaultTimeoutMs` 的单一全局默认值。  
- 更新 feed 的完整 URL 模板。  
- proclist 扫描结果的最终后端字段 schema。  
