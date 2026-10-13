# Grok Bot（0.70.2）本机安全与执行平面静态逆向

> 只读分析；标注约定：[O] 观察（文件:行号） / [I] 推断 / [U] 未知  
> 源码根：仓库根目录（`../../`）  
> 安装包：`/Applications/Grok Bot.app`

---

## 1. 本机执行平面（local-exec）

### 1.1 职责与进程模型

- **[O]** Electron 主进程将 `local-exec-daemon` 作为**独立守护进程**拉起：入口 `../local-exec-daemon/main.cjs`，服务名 `sand-local-exec-daemon`；可通过 utility fork 或 `detached` 子进程 + IPC handoff。  
  `formatted/electron-main/main-core.cjs:33324–33521, 33561–33600, uR@33357`
- **[O]** 启动时注入 env：`SAND_LOCAL_EXEC_GENERATION`、`NODE_USE_SYSTEM_CA`；通过 IPC 下发 `fileKey`（密封本地状态文件）与 `computerId`。  
  `main-core.cjs:32242, 33490–33521`；`local-exec-daemon/main.cjs:163873+, 164008+`
- **[O]** Daemon 启动日志写明默认「over the gateway」服务本地执行。  
  `local-exec-daemon/main.cjs` 尾部 `Tyr()`：`"serving local exec over the gateway"`
- **[I]** Daemon 是「用户机器上的反向执行器」：云端 Agent（Box）下发请求 → 本机审批/执行 → 回传结果；不是 Agent 推理引擎本身。

### 1.2 能力清单（协议帧）

**请求帧（云→本机）** `[O]` `local-exec-daemon/main.cjs:81906–81960` / proto `GrokBotUserComputerRequestFrame`：

| kind | 含义 |
|------|------|
| `exec` | 通用执行（含 shell 流 / 读文件等 serverMessage） |
| `upload` / `download` | 文件上下传（有单文件大小上限） |
| `retire-approval` / `cancel` | 审批作废 / 取消 |
| `messages-op` | iMessage/Messages 操作 |
| `discover-ai-tool` | 发现本机 AI 工具配置 |
| `local_tool`（proto） | 本机工具调用 |
| `welcome` | provider 注册欢迎 |

**工具名（Agent 侧）** `[O]` `Bt.Shell/Read/Screenshot/Computer/AwaitShell/CopyToBox/CopyFromBox/ListMachines/PhoneEcho/MobileReadCalendar` 等：`local-exec-daemon/main.cjs:79641–79681, 81896–81920`

**Computer Use / 截图** `[O]` 另有 `computerUseArgs` 执行器；未注册时明确报错「No computer-use handler is registered」：`97216–97219, 97596–97773`

**浏览器** `[I]` 本机 daemon 不直接跑 Playwright 控制用户 Chrome；Chrome cookie 导入是独立 worker。Box 侧可有浏览器能力，与 User Device Relay 分离。

**Shell 沙箱** `[O]` 策略类型含 `insecure_none` / `workspace_readwrite` / `workspace_readonly`；缺省解析落到 `insecure_none`：`37399+, 38266, 38368, 105728–105780, 106110`

### 1.3 权限审批模型

- **[O]** 用户设置枚举：`localToolPermission ∈ {"always","ask","never"}`，默认 **`"ask"`**；可有 ceiling 与按 `machineId` 覆盖。  
  `local-exec-daemon/main.cjs:79446, 81137–81145`；settings 字段 `80224–80227`
- **[O]** 决策：`authorizedByStanding` / `authorizedByApproval` / 无授权；standing 读 `standingGrants` 文件；approval 匹配 action+target（及 terminal 附件路径）。  
  `79880–79930, Obe/K6/fQ`
- **[O]** `serverAuthoritative === true` 时信任服务端携带的 standing/approval 标志，本地 permission 语义弱化。  
  `79895–79930, 156255–156256`
- **[O]** 拒绝对话文案指向 Settings → Bot → Execution on Local Computer：`79685–79694`
- **[I]** 「Always allow」= standing；单次批准写入 approvals 文件；精确重复 action 可复用；retire 后失效。

### 1.4 与云端握手：两种传输

**A. Gateway SSE（Box 侧反向通道）** `[O]`

- 路径常量：`Dve="/local-exec/requests"`，`Lve="/local-exec/responses"`：`81896–81897`
- 拉取：`fetch(baseUrl + /local-exec/requests, Accept: text/event-stream)`，首包 post `hello`，周期 `ping`：`streamRequests` 约 `128680–128780` 段（见上文摘录）
- 连接交换：`POST /sand-box/local-exec-connection`，body `{credential}`，回 `baseUrl/token/networkToken`：`isr` `155629+` 段 `nsr="/sand-box/local-exec-connection"`

**B. 中心 User Computer Connect RPC** `[O]` proto / coordinator：

- `IssueGrokBotUserComputerCredential`
- `WatchGrokBotUserComputerRequests`（stream：connected/notify/heartbeat）
- `PollGrokBotUserComputerRequests` + `SubmitGrokBotUserComputerResponses`
- `OpenGrokBotUserComputerRequest` / `Cancel...` / `ListGrokBotUserComputers`  
  `proto.cjs:58283+`；`node-agent-coordinator/main.cjs:31709–31776`

**何时用哪种** `[O]+[I]`：

- `[O]` 若 credential 文件中存在 **serverAuthoritative 的 userComputer(s)**，则 **禁止** 走 gateway dial（抛错：`tsr`「box dial stays idle while the server credential is present」）：`155900+` 段 `Y()` / `resolveConnection`
- `[O]` 无上述凭据时，daemon 用 connection 文件里的 gateway `baseUrl` 开 SSE：`ee = new JM({ resolveConnection... })`，且 `ee.start()` 始终启动 box 通道
- `[I]` **桌面默认路径**：Electron 签发/缓存 userComputer 凭据 → Watch/Poll 中心通道；**Gateway SSE** 作为 Box 直连/回退（credential 交换后写入 `local-exec-daemon-connection.json`）
- `[U]` 产品上「始终优先中心」还是「有 Box gateway 优先」的产品策略未在客户端写死为单一枚举；代码以「是否持有 server-authoritative userComputer」为门闩

### 1.5 generation / ownership / 多实例

- **[O]** 账户 generation 文件 `local-exec-account-generation.json`；spawn 时写入 env `SAND_LOCAL_EXEC_GENERATION`；账号 retire 时 `generation + 1`。  
  `main-core.cjs:32240–32242, 33557, 33625–33628`
- **[O]** Discovery：`local-exec-daemon.json` 含 `pid/startedAt/servingAt/inflightCount/filesKeyId/generation/rejectedAccountScopes/proxyFingerprint`：`32262–32300`
- **[O]** Ownership 轮询间隔 `AV=10000` ms；丢失则 `onOwnershipLost("superseded"|"unsupervised")` 退出。  
  `local-exec-daemon/main.cjs:78395, 156278–156279, 164008`
- **[O]** 若 discovery 记录指向**其他 pid** 且本进程非 owner，会触发 supersede / 关闭。  
  ownership 循环：`Cwe(... supersededForMs ...)` → `onOwnershipLost`
- **[I]** 同机多窗口：共享一个 daemon（由主进程 supervisor 保证）；generation/retire 防止**换号后旧 daemon**继续收请求；`rejectedAccountScopes` 拒绝未授权账号作用域。

### 1.6 账号切换清理

- **[O]** `retireLocalExecDaemonForAccountChange`：写 retire marker `local-exec-account-retire.json`、bump generation、SIGTERM/SIGKILL 旧 daemon、清 discovery/credential/connection。  
  `main-core.cjs:33568–33651, 44320`
- **[O]** retire marker 存在时 **拒绝再次 spawn**。  
  `33568, 33580`
- **[O]** park 时可 `parkRetiresLocalExec`：`main-app.cjs` gateway pause args `47800+`

---

## 2. macOS Computer Use

### 2.1 Helper 如何被调用

- **[O]** 安装包内：`/Applications/Grok Bot.app/Contents/Helpers/Grok Bot Computer Use.app`，可执行文件 **`CUGrokBotService`**（非 XPC 服务名）。  
  Info.plist：`CFBundleExecutable=CUGrokBotService`，`LSUIElement=1`
- **[O]** 调用方式：  
  1. `open -g <sidecar.app>`（或 `CUA_DIRECT_LAUNCH=1` 时直接 spawn executable）  
  2. 读 `~/Library/Application Support/<appSupportDir>/service.json` 获取 **`rpcSocketPath`**  
  3. **Unix domain socket** 上行 JSON-RPC（`tools/call`、`control/start`、`ping` 等）  
  `local-exec-daemon/main.cjs:120580–120694, 83900–83920, 84076 HRe/Ivt`
- **[O]** Grok Bot 变体表：prod `CUGrokBotService` / lab / dev；环境变量 `GROK_BOT_SIDECAR_APP` 可覆盖路径：`83920, 83900–83917`
- **[O]** 另有一套 **Cursor 遗产路径**：`~/.cursor/cursor-computer-use/Cursor Computer Use.app`，可执行名硬编码 **`CUCursorService`**，env `CUA_SERVICE_APP` / `CUA_DIRECT_LAUNCH`：`120655–120803`
- **[I]** 通信是 **本地 UDS + JSON 行协议**，不是 Mach XPC、不是 HTTP。Messages 相关 verb 也走同一 sidecar socket（`messages/send` 等）：`84076+`

### 2.2 TCC 权限

- **[O]** Helper Info.plist：  
  - `NSAccessibilityUsageDescription`  
  - `NSScreenCaptureUsageDescription`  
  - `NSAppleEventsUsageDescription`  
  - `NSContactsUsageDescription`（找联系人发 iMessage）  
- **[O]** RPC 回报 `accessibilityTrusted` / `screenRecordingGranted`：`120283–120284, checkPermissions`

### 2.3 CUCursorService 是否接线 / feature flag（疑点 D1）

- **[O]** 代码里 **两套** sidecar：`CUGrokBotService`（Helpers 包内）与 `CUCursorService`（`~/.cursor/...`）。两者均通过同一「读 service.json → UDS」模式接线。
- **[O]** Feature flags 默认值：  
  - `local_computer_use: { default: false }`  
  - `mac_computer_use: { default: false }`  
  - `glass_computer_use_pip / windows_computer_use_batch / computer_use_next_action` 亦默认 false  
  `main-app.cjs:56841–56845`
- **[O]** 若 exec daemon **未 register** computer-use handler，工具调用被硬拒绝：`97216–97219`
- **[I]** 默认关闭：需服务端/Statsig 打开 `mac_computer_use`（或相关门）才会在 daemon 注册执行器；静态包内 helper **存在且可被路径发现**，但不等于默认启用。
- **[U]** 0.70.2 线上 Statsig 实际门控值未知（需运行时/抓包，本次不做）。

---

## 3. 移动设备（疑点 D9）

- **[O]** 机器列表规范化：`kind === "ios" || "android" ? kind : "desktop"`：`main-app.cjs:48643`（`NF` / `ListSandMachines`）
- **[O]** 对手机的硬限制文案：`is a phone: no Shell, Read, AwaitShell, or file transfers. Pick a desktop...`：`local-exec-daemon/main.cjs:81906–81908`
- **[O]** Capabilities proto 含 `shell?` 与 `mobile_local_tools*`：`145273`；flag `sand_mobile_local_tools` **default false**：`main-app.cjs:56162`
- **[O]** 移动侧工具名仍有 `PhoneEcho`、`MobileReadCalendar` 等：`81918–81920`
- **[I]** **角色 = 被控/传感端（User Device）**，不是控制桌面的遥控端：Agent 在 Box 跑，手机注册为 machine，提供受限本地能力（日历等），**故意关掉 shell/读写/传文件**以降低高危面。
- **[U]** iOS/Android App 内是否另有独立 daemon 二进制：本 Electron 解包内未见；能力裁剪由服务端 hello/capabilities + 客户端 kind 分支共同完成。

---

## 4. 凭据与秘密

### 4.1 全链路（输入 → 存储 → Box → Agent）

1. **用户输入** `[O]`  
   - UI RPC：`submitSecret({entryId,value,agentId})`、`storeSecret`（`box-env` / `channel-credential`）、`submitUserForm(..., saveToVault?)`  
   `main-app.cjs:47394–47420, 110748+`  
   - 能力分级：`submitSecret: "person"`（需人在主窗口操作）：`87574`

2. **本机存储** `[O]`  
   - `UserSecretsStore`：按 `accountScope`；优先 **Electron `safeStorage.encryptString`** 落盘（base64）；keychain 不可用时退到 **进程内 session Map**。  
   `exportSnapshot/upsert`：`120386–120430`  
   - local-exec file key 也走 encrypted secret store：`main-core.cjs:33239, Ug/qie`

3. **下发 Box** `[O]`  
   - `exportSnapshot()` 解密全部秘密 → `setBoxSecrets({secrets})`；telemetry 记 `secretCount/applied`。  
   `120517–120551`；触发 resync/account_scope：`126120, 126374`  
   - **[I]** Agent 在 Box 内通过 vault API 使用；桌面渲染层不应长期持有明文（snapshot 仅推送瞬间明文）。

4. **Agent 使用** `[O]+[I]`  
   - `carryBoxSecretsToBot` / `carryUserSecretsToGrokBot` / team clone 时携带 `personalSecretNames`：`108429–108500`  
   - `[U]` 服务端 `LeaseSecret` 名称在本次检索中**未**在桌面 proto 命中强符号；更接近客户端 `setBoxSecrets` + Bot 侧 vault put。名称「LeaseSecret」可能属服务端/Box 内部 API（待服务端 IDL 确认）。

### 4.2 WebAuthn / Passkey 签名器

- **[O]** 原生二进制 `dist/native/sand-webauthn-signer`（Windows 为 `.exe`）；`process.env.SAND_WEBAUTHN_SIGNER_PATH` 可覆盖。  
  `node-agent-coordinator/main.cjs:3977–3978, 45812`
- **[O]** 桌面有 passkey ceremony 路径 `/grok-bot/passkey/`、consent/pin UI、proxy socket `/run/sand-webauthn-proxy`：`90448, 97649+, Y3t`
- **[I]** 用途：在**用户本机**完成 CTAP2 断言/注册（硬件密钥/平台密钥），把结果交给云端登录/敏感审批，**私钥不出本机**。

### 4.3 1Password

- **[O]** 扩展资源：`onepassword-extension` / update xml：`main-app.cjs:867–869`  
- **[O]** OAuth 窗口 `partition: "onepassword-oauth"` + sandbox 三联：`118294–118298`  
- **[O]** RPC：`startOnePasswordOAuth` / `storeOnePasswordIntegrationKey` / `beginOnePasswordConnection` / sync：`117765–117917`  
- **[I]** 桌面做 OAuth 与 broker 配对；秘密检索由 1Password 扩展/连接态提供，而非把保险库明文导入 Electron。

### 4.4 Chrome Cookie 导入

- **[O]** Worker：`chrome-import-worker.cjs`；读 Chrome cookies SQLite + **Chrome Safe Storage**（`security find-generic-password -ws "Chrome Safe Storage"`）。  
  `79920–80450, 80226+`  
- **[O]** 权限阶梯：Finder Automation、Full Disk Access、Chrome Safe Storage；失败映射 `finder-automation|full-disk-access|chrome-safe-storage`。  
- **[O]** 导入后 `injectChromeCookies` 推到 Box：`47768, 47838`  
- **[I]** 目的：让 Box 内浏览器会话复用用户已登录站点，减少 Agent「登录接管」频率。

### 4.5 登录接管（需用户在主 Bot 操作）

- **[O]** `submitSecret` / `resolveCredentialRequest` / WebAuthn consent / cookie origin approval / local tool permission resolve 均标为 person/foreground 交互：`87572–87574, 110748+`  
- **[I]** 流程：Agent 在会话中发出 credential/widget → 主窗口弹卡 → 用户粘贴/批准/Passkey → 结果经 Connect RPC 回服务端；用户不在场则 blocked。

---

## 5. 窗口与渲染隔离（疑点 D4）

### 5.1 BrowserWindow / View 一览

| 表面 | webPreferences（观察） | 用途 |
|------|------------------------|------|
| 主窗口 | `sandbox:true, contextIsolation:true, nodeIntegration:false, webviewTag:true` + preload | 主 UI  
  `main-core.cjs:32093–32103` |
| Desktop mount panel | 同上三联 + `preload-desktop-mount-panel` | 浮动面板  
  `main-app.cjs:101040–101052` |
| Avatar `WebContentsView` | 三联 + `preload-avatar-source`；`about:blank` | 头像生成隔离  
  `114271–114275` |
| 1Password OAuth | 三联 + `partition:"onepassword-oauth"` | OAuth  
  `118294–118298` |
| WebAuthn consent | `nodeIntegration:false, contextIsolation:true`（**未显式 sandbox**） | 同意对话框  
  `98099` |
| `<webview>` attach | `will-attach-webview` **强制** `nodeIntegration=false, contextIsolation=true, sandbox=true`；preload 在 VNC partition 与普通 webview 间切换 | Box VNC / 内嵌页  
  `125864–125900` |

- **[O]** OS sandbox 遥测：`commandLine.hasSwitch("no-sandbox") ? "false" : "true"` → 默认 **未**加 `--no-sandbox`（即 os_sandbox 报告为 true）。  
  `main-core.cjs:45314`
- **[O]** IPC 发送方校验：`trustedContents`/`trustedMainFrame`/`senderFrame`；桌面挂载命令要求 `isMainWindow` / `isPanel`：`98243–98259, 101075, Onn@101040+`
- **[I]** 信任边界：渲染进程无 Node；敏感能力经 preload RPC；webview 强制沙箱；主窗口与 panel 分角色授权。

---

## 6. 语音（疑点 D10）

### 6.1 凭据

- **[O]** 服务端 RPC：`MintSandVoiceCallSecret` → `client_secret` + `expires_at_unix_seconds` + `model` + `websocket_url`。  
  `proto.cjs:45419–45480`；客户端 `mintSandVoiceCallSecret`：`main-app.cjs:48569–48590`
- **[O]** 桌面暴露 `mintVoiceCallCredential`：`81960+, 91376, 108892`
- **[I]** **是服务端签发的 ephemeral secret**，不是长期用户 JWT 直连。

### 6.2 客户端直连

- **[O]** 仅允许 `wss://api.x.ai/` 前缀：`DIALABLE_ORIGIN`；WebSocket 子协议 `xai-client-secret.${clientSecret}`。  
  `main-app.cjs:114959–114970`；renderer `index.eager-app-*.js` 同类实现
- **[O]** 网络调试白名单含 `voice-realtime`：`chunk-network-debugger-*.js`

### 6.3 音频管线与 prompt

- **[O]** PCM/`audio/pcm`、采样相关常量 24000；事件 `caller-speech-started/stopped`、`agent-speech-*`；麦克风权限 prompt。  
  renderer + `main-app.cjs:47046–47050, 40824`
- **[O]** 语音系统指令大段在 `main-app.cjs` ~37674+（何时用 tool、禁止复读等）；另有 ephemeral 单问 prompt：`60601`
- **[O]** Feature：`glass_realtime_voice` / `web_realtime_voice` / `mobile_realtime_voice` 默认 false：`56651–56657`
- **[I]** 采集在渲染进程 → WS 二进制上行；播放下行；VAD/turn 由 realtime 会话事件驱动。

---

## 7. 渠道集成与 MCP

### 7.1 Connectors / OAuth

- **[O]** 静态 provider 表：Google Workspace MCP（gmail/drive/calendar/docs/sheets/slides/bigquery）、X API、x-money、HubSpot、Shopify、`connectors-gateway.grok.com`。  
  `main-app.cjs:390–560`
- **[O]** 回调：`https://grok.com/connectors-oauth-exchange-code/`、`https://x.com/i/connectors/oauth_callback`、`grokbot://mcp/oauth/callback`、`cursor://anysphere.cursor-mcp/oauth/return`、localhost loopback 端口集。  
- **[O]** Slack：`GetSlackInstallUrl`（服务端出安装 URL）：`proto` + `main-app` 符号 `7735+`
- **[O]** `completeMcpOAuth({code,state})`；`storeSecret` 可存 `channel-credential`：`47773, 47394+`
- **[I]** OAuth **多数在系统浏览器/专用窗完成，token 交换偏 backendOnly**（如 x-money/hubspot）；桌面只拿 code/state 完成回传。Token 权威存服务端；本机可能缓存 channel 字段密文于 userSecrets。

### 7.2 iMessage / 邮件 / 日历 / GitHub

- **[O]** iMessage：本机 Messages sidecar verbs + 用户 Messages 开关；非云 OAuth。  
- **[O]** 日历：Google calendarmcp + 移动 `MobileReadCalendar`。  
- **[O]** 邮件：gmailmcp scopes compose/modify/readonly。  
- **[O]** GitHub：SCM 错误码与 org IP allowlist 文案；连接态由 Cursor/GitHub OAuth 管线（`scm_*`）：`188–191, 37475`
- **[U]** Telegram 专用安装 RPC 未在本次主路径强命中（可能归入通用 channel connect）；需再扫 channel platform 枚举。

### 7.3 MCP

- **[O]** Box MCP：`refreshMcp` / `listBoxMcpServers` / inline MCP config 策略错误码：`47773–47881`  
- **[O]** 自定义 instructions / disabled tools / box servers 存 host settings：`46959–46967`

---

## 8. 信任边界总图（推断）

```
用户 Mac 主窗口 (sandbox+CI)
    │ preload RPC（校验 sender）
    ▼
Electron 主进程 ──spawn──► local-exec-daemon
    │                         │
    │ safeStorage 秘密         ├─ Gateway SSE ◄──► Box gateway
    │ setBoxSecrets            └─ Connect Watch/Poll ◄──► 中心 UserComputer
    ▼
云端 Box Agent ──工具调用──►（审批后）本机 shell/files/CUA/Messages
                              │
                              └─ open Helpers/…/CUGrokBotService
                                   └─ UDS RPC（TCC 保护）
```

---

## 9. 关键默认值速查

| 项 | 默认 | 位置 |
|----|------|------|
| `localToolPermission` | `ask` | daemon settings `81142` |
| `mac_computer_use` / `local_computer_use` | `false` | `main-app.cjs:56841–56842` |
| `sand_mobile_local_tools` | `false` | `56162` |
| realtime voice flags | `false` | `56651+` |
| shell sandbox 缺省类型 | `insecure_none` | `105728+` |
| 主窗口 sandbox | `true` | `main-core.cjs:32101` |
| `--no-sandbox` | 未默认开启 | `45314` |
| Voice dial origin | 仅 `wss://api.x.ai/` | `114965` |

---

## 10. 残留未知（[U]）

1. 线上 Statsig 对 `mac_computer_use` 的实际开启比例。  
2. `LeaseSecret` 是否为 Box 内独立 RPC（桌面包未见对称符号）。  
3. Telegram 渠道的具体 OAuth/Bot token 存取路径。  
4. 手机 App 侧注册 hello 时 `capabilities.shell` 的精确置位代码（仅见桌面侧拒绝文案与 flag）。  
5. Gateway 与中心通道的产品级优先级是否随「Forever Box / 休眠」状态切换（有 `noteBoxAsleep` 等钩子，细节未展）。
