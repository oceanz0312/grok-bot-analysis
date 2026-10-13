# Grok Bot 0.70.2 — Box / 云桌面子系统技术方案（静态逆向）

> 范围：只读分析已解包源码与既有抓包统计；不运行应用、不发网络请求。  
> 标注：`[O]` 观察（附文件:行号或 minified 关键字）、`[I]` 推断、`[U]` 未知。  
> 路径简写：`main-app` = `formatted/electron-main/main-app.cjs`；`proto` = `formatted/electron-main/proto.cjs`；`coord` = `formatted/node-agent-coordinator/main.cjs`；`daemon` = `formatted/local-exec-daemon/main.cjs`；`eager-app` = `app-asar/dist/renderer/assets/index.eager-app-fbmFpqqH.js`；`index` = `index-CjjO5fU0.js`。

---

## 0. 总体模型

[O] Box 是**账号级**持久 Linux GUI 环境（一家一“电脑”），Agent 是其上的逻辑身份；连接控制信息由中央 RPC `EnsureSandBox` 签发后，客户端**直连** `*.{cluster}.cursorvm.com` 上的 Box Gateway / VNC / exec，而不是长期经中央 API 代理数据面。证据：`EnsureSandBoxResponse` schema（`proto:43439`）；连接组装 `g7`/`Nze`（`main-app:92369–92400`）。

[O] 动态抓包主机形如 `*.us10.cursorvm.com`（既有动态观察）；客户端 DNS 诊断白名单仅硬编码 `dev4`/`us8`（`coord:40548–40571` `FK`/`fx`），说明集群名会演进，**静态白名单落后于线上集群**。

[I] 底层编排（K8s/Kata/Firecracker）仅能由 `pod_id`/`cluster`/`tenant_id`/`node_id` 字段名与 hibernation 失败码推断，客户端无法证明。

---

## 1. Box 生命周期

### 1.1 状态机（运行态）

[O] Proto 枚举 `SandBoxRunState`：`UNSPECIFIED | ABSENT | HIBERNATED | RUNNING | STARTING`（`proto:41981–41988`）。

[O] 客户端对外相位映射（`B3t`，`main-app:91956–91964`）：

| 服务端 run_state | 客户端 connect phase |
|---|---|
| ABSENT | `creating` |
| HIBERNATED | `waking` |
| 其他 | `connecting` |
|（ensure 结束后）| `settled` |

[O] `describe()` 四态：`running | hibernated | starting | absent`（`main-app:92054–92066`）。  
[O] `locate()`：`supportsAsleepBox:true` 时休眠返回 `{kind:"asleep"}`，不强制唤醒（`main-app:92035–92039`）。

### 1.2 Ensure / 唤醒 / 连接（谁驱动）

[O] `EnsureSandBoxRequest` 字段：`wake?`、`supports_asleep_box?`（`proto:43385`）。客户端三种语义：

1. **describe** = `ensureBox({wake:false})` — 全仓库唯一字面量 `wake:!1`（`main-app:92056`）；只读轮询，不唤醒。  
2. **locate** = `{supportsAsleepBox:true}` — 可返回睡着（`main-app:92036`）。  
3. **connect** = 空 body `ensureBoxPublishingPhase({})` — 真正要拿到 gateway/vnc 等连接描述符（`main-app:92032–92033`）。

[O] 动态观测：`GrokBot.EnsureSandBox` 出现 **42 次**（`full-stack-architecture-report.md` / `dynamic-api-matrix`）；其中启动约 +2.0s 并发 **×4 describe**，活跃期约每 10–30s 轮询，真正 connect 较少（`notes-speed-and-storage.md` A0/A2）。绝大多数是 describe，不是冷启动。

[O] **意图预解冻**：`ReportGrokBotClientPresence` + trigger（含 `TYPING`）；服务端动作枚举含 `PRETHAW`（`proto` GrokBotBoxIntent / IntentAction，见 notes A2）。0.70.2 客户端主要发 trigger，未填 intent 字段。

[O] **Park 状态机**（客户端驱动休眠策略）：gates `sand_desktop_away_park` / `sand_desktop_present_park`（默认 true，`main-app:56245–56246`）。  
- 失焦 ≥ **10 min**（`$Zt=10*6e4`，`main-app:88048`）视为离开。  
- 意图窗口 **60s**（`HZt`）。  
- parkMode 头随 ensure 下发（`Cq` / parkMode，`main-app:92115–92117`）。  
- 命令分 `person` / `background`：仅 person 需求会登记 box intent 并可能唤醒（coord dispatch；`requestDiskSaverAudit:"person"`）。

### 1.3 创建 / 分配 / 销毁 / 迁移 / 升级

[O] 首次 ABSENT → ensure 时服务端分配；响应含 `cluster, tenant_id, pod_id`（`proto:43439`）。客户端不实现调度算法。

[O] 重建：`recreateSandBox` / `forceRecreateSandBox`（`main-app:92163–92186`），返回 `operationId` 或 rejected reason。

[O] 迁移相位 `SandBoxMigrationPhase`：`BACKING_UP → CREATING → MOVING → CLEANING_UP → WIPING → DONE|FAILED`（`proto:41965–41975`）；客户端 `watchSandBoxMigration`（`main-app:92431–92452`）。

[O] 升级调度态 `SandBoxUpgradeScheduleState`：`SCHEDULED|CLAIMED|RUNNING|WAITING_FOR_IMAGE|COMPLETED|MISSED|FAILED|CANCELLED`（`proto:41991–42006`）。

[O] 管理侧：`AdminBreakGlassDeleteSandBoxPod`、`KillTeamMemberSandBox`、`AdminRefreshSandBoxEgress`（`proto` / api-capability-catalog）。

### 1.4 超时与重试（关键数字）

| 项 | 值 | 出处 | 标注 |
|---|---|---|---|
| Box kill-switch / access 缓存 | `O3t=60s`；`Bze=15min` | `main-app:91954–91955` | [O] |
| retry-after 上限 | `min(秒*1000, 15min)` | `D3t` `main-app:91966–91969` | [O] |
| 失焦→away | 10 min | `$Zt` | [O] |
| 意图窗口 | 60 s | `HZt` | [O] |
| VNC 休眠恢复区间默认 | `resume_lower_s=900`（15min）、`resume_upper_s=18000`（5h） | `coord:40368` | [O] |
| Hibernation 失败码 | HTTP 417 或 `x-anyrun-failure-reason ∈ {pod_hibernated, pod_hibernated_during_request, pod_not_found_on_node}` | coord notes | [O] |
| Harness recovery | jitter 30s；probe base 5min；max 1h；policy `recover` | `main-app:60315–60318` | [O] |
| Disk Saver mint 退避 | 30s → 15min | eager-app `yXe` | [O] |
| Egress reconnect | initial 2s → max 30s；standby 45s；liveness idle 45s；silence reset 25s；claim 新鲜度 30s | `main-app:93172–93179` | [O] |
| Egress policy 刷新 | 5 min；连续失败 3 次丢策略 | `W8t/K8t` `main-app:93726–93728` | [O] |

[U] 服务端冷启动 SLA、磁盘配额字节数、pressure 轮询频率、跨区迁移触发条件。

---

## 2. 连接链路

### 2.1 路径：中央鉴权 → 直连 Box

```
Desktop ──ConnectRPC EnsureSandBox──▶ api2.cursor.sh（中央）
         ◀── gateway_url / gateway_token / network_token /
              exec_daemon_url / auth_token / vnc_url / fork_vnc_base_url / run_state
Desktop ──HTTPS/WSS 直连──▶ *.{cluster}.cursorvm.com（Box edge）
```

[O] `gateway_url` 为空则抛 `SandBoxHostConnectError`（`main-app:92370–92372`）——**不走中央转发数据面**。  
[O] 可选环境直连：`SAND_HOST_GATEWAY_URL/TOKEN/NETWORK_TOKEN`（`main-core:29356–29359`，dev/attach 路径 `y7`）。  
[O] 凭证：`gateway_token` → Bearer；`network_token` → 请求头 `x-anyrun-network-token`（`m1e`，`main-app:88547`，`Nze`）。  
[O] Local-exec 另走 `POST {backend}/sand-box/local-exec-daemon-credential`（`main-app:91951,92250–92284`）及 `IssueGrokBotUserComputerCredential`。

[I] Token 续期：再次 `EnsureSandBox` / credential mint；无独立 refresh RPC 在客户端可见。过期后走 access gate / kill-switch 缓存（`Bze=15min`）。

### 2.2 端口布局（Box 内 / edge 映射）

[O] 常量（`main-app:93095–93103`）：

| 端口 | 名称 | 承载（机制） |
|---:|---|---|
| 1337 | primaryExecDaemon | Box 内 Agent 工具执行守护（shell/文件/computer-use 等 Connect/二进制帧） |
| 1338 | primaryPty | 交互式终端 PTY |
| 1339 | windowRouter | 多窗口/屏幕路由（与 fork VNC / windowIndex 配合） |
| 1340 | hostGateway | Box 内 Sand Gateway（HTTP `/health`、`/events` SSE、`/api/*`、local-exec 桥） |
| 6080 | primaryNovncWebsockify | 主桌面 noVNC/websockify |
| 6081 | forkNovncWebsockify | fork/次窗口 noVNC |
| 8790 | egressTunnelWebSocket | 出网隧道 **WebSocket 控制面**（客户端侧实现完整） |
| 8791 | egressConnectProxy | 命名为 CONNECT 代理；客户端端口表列出，**中继实现主要挂在 8790** |

[O] Hostname 端口嵌入：`J3t` 把 `host-1337.xxx` 类后缀或显式 port 改写为目标服务端口（egress 用 `tqe=8790`，`main-app:93117–93135`）。公网 edge 常把多服务嵌在子域端口号里，而非开放全部裸端口。

### 2.3 协议形态

| 通道 | 形态 | 证据 |
|---|---|---|
| EnsureSandBox | ConnectRPC Unary（中央） | `proto:63664` |
| Gateway `/events` | SSE 长连接 | 动态观察；事件含 `forever-box`、`box-disk-pressure` 等（`coord:42187`） |
| Gateway `/health` | HTTP | `main-app:101549` |
| VNC | HTTPS 页 `vnc.html` + WS websockify（RFB） | `coord:40383–40395`；`main-app:125733` |
| Exec | Box 侧 daemon + `ExecServerMessage`/`ExecClientMessage` protobuf 消息联合体 | `daemon:96569+` |
| PTY | 独立端口 1338 | 端口表；细节实现多在 Box 镜像 |
| Egress | WSS + 自研二进制帧（open-stream / data / close） | `main-app:93280–93715` |
| Local-exec（本机） | Gateway SSE `GET /local-exec/requests` + `POST /local-exec/responses`，或中央 UserComputer watch | full-stack §12 |

[U] 1337/1338/1339 在公网 edge 上的确切 HTTP 路径与鉴权头组合（响应体抓包未解压）。

### 2.4 Window Router vs Host Gateway

[O] **Host Gateway（1340）**：Box 内“控制面 HTTP 服务”——健康检查、SSE 事件、agent workflows、forever-box status、snapshotBoxStore、local-exec 请求桥等。客户端拿到的 `gateway_url` 即此 edge 入口（`g7`）。

[O] **Window Router（1339）**：与多窗口桌面路由相关的端口常量；forever-box status 返回 `windows[{vncUrl, windowIndex}]`，coordinator 用 `fork_vnc_base_url` 把 loopback `:6081` 改写成代理 URL（`coord:40397–40431`）。

[O] Proto 有 `EnsureSandBoxWindow(window_index)`，但 **main/coord/daemon/renderer 无调用方**（personal-agent-ref §3.6 更正）——多窗主要靠 Gateway status + fork VNC，而非该 RPC。

---

## 3. 显示（noVNC / 多窗 / 截图）

### 3.1 VNC 窗口与安全

[O] Electron session partition：`persist:sand-forever-box`（`main-app:125719`）。  
[O] Token 从 URL query（`port_token`/`network_token`）提升为 Header：`x-anyrun-port-token` / `x-anyrun-network-token`（`main-app:125745–125748`）；hibernation 边界头 `x-anyrun-hibernation-*-s`（`125762–125770`），仅 `mayViewerWakeBox` 允许时注入。  
[O] Clipboard 桥仅信任 `boxDesktopWebview`（`main-app:125696–125716`）；webview sandbox/contextIsolation。  
[O] noVNC URL 组装：`…/vnc.html?…&path=websockify?token=…`（`coord:40383–40395`）。

### 3.2 多窗口 / 热池 / 分辨率

[O] 渲染层 `sand-box-vnc-pool`：`maxWarm=3`；隐藏用 visibility/opacity 而非卸载；每 3s JPEG q0.7 快照帧 LRU=3（`chunk-teach-recording-controls-*`，关键字 `maxWarm`）。  
[O] 人眼显示默认 **1920×1200**，模型 API 截图宽 **1280**（高按比例，≈800）（`daemon:119980–119987` `Ife/kfe/Ofe`）。  
[O] Computer Use 用 `xrandr` 读真实分辨率（`daemon:119996–120008`）。  
[O] Desktop Mount 面板：`sand_desktop_mount` gate 默认 false；面板 HTML `desktop-mount/panel`（`main-app:100874+`）。  
[U] 录屏完整管线（`record_screen` 在 Exec 消息联合体中有字段）；产品级“屏幕录像”存储位置未知。

---

## 4. Egress Tunnel 8790/8791（疑点 D8）

### 4.1 结论（机制）

[O] **这是让 Box 的出站 TCP 经当前用户桌面中继**，不是浏览器代理，也不是给 noVNC 用的。

证据链：

1. 客户端把 egress URL 指到 Box 的 **8790** WebSocket（`J3t`/`nqe`，`main-app:93116–93147`），用 `Bearer` + `x-sand-egress-attach: if-free|claim` 等头连接。  
2. 连接确认后，**Box 发来 open-stream(host,port)** 帧；客户端 `createConnection` 连到目标，双向泵送 payload（`openStream`，`main-app:93641–93705`）。  
3. `allowPrivateTargets: false`（`nqe`）——默认拒绝私网目标，即代连公网。  
4. 所有权：`egressTunnelOwnership` 来自 Ensure/RunState；多机争用时 409/4002 → standby（`main-app:93513–93532`）。用户可 `claimEgressTunnel`。  
5. 网络策略本地刷新（5min），拒绝违规 stream。  
6. Admin API `AdminRefreshSandBoxEgress` 响应含 `http_proxy_rule_count` / `http_proxy_name`（`proto:44160`）——服务端还有 HTTP 代理规则面。  
7. Gate `sand_box_egress_tunnel` 默认 **false**（`main-app:57052`）——功能存在但默认关闭，需开关/所有权。

[I] 产品意图：Box 出网可呈现为**用户家庭/公司出口 IP**（合规、访问内网 SaaS、绕过数据中心 IP 封锁），由“当前认领隧道的电脑”提供。  
[I] **8791 egressConnectProxy**：命名暗示标准 HTTP CONNECT 代理入口；客户端中继逻辑写在 8790 WS 上，8791 可能供 Box 内进程直接使用或未来路径——客户端未实现对 8791 的完整 CONNECT 客户端。  
[U] Box 内谁把流量导入隧道（透明 iptables / 显式 HTTP_PROXY / 应用级）、默认策略内容、与 Cilium/Envoy 的关系。

---

## 5. 存储与 Disk Saver

### 5.1 配额与压力检测

[O] 压力等级：`NONE | SOFT | HARD`（`proto` / `daemon:132803–132809`）。  
[O] **检测在云 Box host**：`ReportSandBoxHostState(disk_pressure)`（`proto:136959` 等价定义）；main/coord/daemon **均无调用方** → 调用在 Box 镜像内（notes B1）。  
[O] 本机不扫磁盘（仅 `os.freemem` 等）。  
[O] 下发：Gateway SSE `box-disk-pressure` → 渲染层 `ingestBoxDiskPressure`；中央 `GrokBotBoxState.disk_pressure` 存在但 coord `onBoxState` **不消费**该字段。  
[U] 软/硬阈值百分比、检测周期、磁盘总配额 GB。

### 5.2 Disk Saver 流程

```
Box host ReportSandBoxHostState(SOFT|HARD)
  → Gateway SSE box-disk-pressure
  → foreverBox.diskPressureSnapshots
  → SXe 自动器（每轮压力只触发一次）
       ├ 无 Disk Saver → createAgent({name:"Disk Saver", purpose:"disk-saver",
       │     origin:"user", isKickstartRequested:true, creationRoute:{kind:"box"}})
       └ 已有未运行 → requestDiskSaverAudit({id})  // demand=person，会唤醒
```

[O] 名称/描述常量：`Disk Saver` / `Audits disk usage…`（eager-app `DE/Yu/LE`）；文案 “Nothing is deleted without confirmation.”  
[O] **清理 prompt 不在客户端**——靠 `purpose=disk-saver` + kickstart 由服务端/Box 注入（[I] 文本内容）。  
[O] 退避 30s–15min；失败重建会退避，re-audit 不退避。  
[O] 手动条：soft “low on disk space” / hard “critically low…”。  
[I] “必须确认才删”依赖通用 shell 审批 + Bot prompt，无专用删除强制门。

### 5.3 文件同步 / 预签名

[O] `PresignSandBoxStoreReads/Writes`、`PresignAgentStoreReads/Writes`、`PresignGrokBotAttachmentUploadParts`（`proto:63696+` 等）。  
[O] Media：中央 store 与 `readsIfAwake` 竞速，优先不唤醒；`ResolveGrokBotAttachmentReads` 批量 64、超时 2.5s（personal-agent-ref §3.6b）。  
[O] Dev flush：`POST {gateway}/api/snapshotBoxStoreNow`（`main-app:101571`）。  
[O] Working-state warming（harness 迁移预拷贝）配置：maxClosure 1GiB、5e4 blobs、putConcurrency 16 等（`main-app:59727–59740`）——**不是** Disk Saver。

---

## 6. BOX vs TEMPORAL harness（疑点 D3）

### 6.1 分别是什么

[O] 枚举 `GrokBotAgentHarnessKind = BOX | TEMPORAL`（`proto:45812–45816`）。

| | BOX | TEMPORAL |
|---|---|---|
| 运行面 | 绑定用户持久 Linux Box / Gateway | 服务端托管创建与 roster（`createGrokBotTemporalAgent`） |
| 典型能力 | VNC、PTY、exec、computer-use、桌面文件 | durable identity、server transcript、房间/自动化友好 |
| 创建路由 | `creationRoute:{kind:"box"}` | `{kind:"temporal", scope}` + clientNonce |

### 6.2 当前主路径？TEMPORAL 是否真实在用？

[O] Feature gates **默认关闭**：

- `grok_bot_temporal_harness` default **false**（`main-app:56178`）  
- `sand_create_temporal_agents` default **false**（`main-app:56242`）  

[O] 启用条件还需服务端 `GetGrokBotRuntimeCapabilities`：`temporalCreationEnabled` + durable identity 读写（`HYe`/`Ann`，`main-app:100458–100520`）。  
[O] 另有 stub：`isTemporalCreationEnabled: async () => !1`（`main-app:112530`）——部分 wiring 写死关闭。  
[O] Disk Saver / purpose helper **强制** host-mediated box 创建（`u0e` + `creationRoute:{kind:"box"}`）。  
[O] Coordinator `supportsTemporalHarness: true`（`coord:41548`）表示协议能力，不表示默认开。  
[O] 消息投递枚举含 `ACCEPTED_BOX` / `ACCEPTED_TEMPORAL`、`BOX_UNREACHABLE` / `TEMPORAL_UNAVAILABLE`（`proto:46114+`）——双路径真实存在于协议。

**结论 [O]+[I]**：代码与协议中 TEMPORAL **是真实实现的第二 harness**，可通过 Statsig + 服务端 capabilities 打开；**0.70.2 默认客户端主路径仍是 BOX**。不能因名字证明后端用 Temporal.io（无 `@temporalio` SDK）。

---

## 7. Box 内 Agent 能力

| 能力 | 机制 | 标注 |
|---|---|---|
| 终端 / Shell | Exec daemon + PTY 1338；Exec 消息含 shell/background_shell | [O] |
| 文件 R/W/grep/ls | Exec 消息联合体 | [O] |
| Computer Use | Linux：`xdotool` + `xprop` + 可选 `native_x11`；截图坐标换算 1920×1200↔1280×?（`daemon:120024,120184+`） | [O] |
| 浏览器 | 产品文案/能力含 Chrome；daemon 有 playwright/puppeteer 路径环境变量；**未见**打包内嵌完整 Chrome CDP 驱动证明 | [O] 环境 / [U] 镜像内浏览器版本与自动化方式 |
| 录屏 | `record_screen_args` 在 Exec schema | [O] 字段 / [U] 编码器 |
| 秘密注入 | `setBoxSecrets({secrets})`；客户端 keychain 导出后 push（`main-app:120533–120561`）；`carryBoxSecretsToBot`、`getBoxSecretsStatus` | [O] |
| MCP / 子 Agent / fetch | Exec 消息多种 args | [O] |
| Desktop mount | 可选把本机目录挂到 Box（gate 默认 off） | [O] |

---

## 8. 性能：为何“云桌面连接很快”

| 设计点 | 机制 | 标注 |
|---|---|---|
| 延迟连 Box | 启动只打中央 API；首次 pod CONNECT 可延迟到用户意图后（抓包 ~15min 后） | [O] |
| 意图 PRETHAW | TYPING/焦点等 presence → 服务端预解冻，盖住冷启动 | [O]/[I] |
| describe 不唤醒 | `wake:false` 轮询 | [O] |
| Park 默认可睡 | away/present park；人走算力睡 | [O] |
| 连接 single-flight | `o1e` 合并并发 ensure | [O] |
| 网关描述符缓存 | store + refresh；away 时可不 serve stored | [O] `Lze`/`kze` |
| VNC 热池 maxWarm=3 + 快照帧 | 切 Bot 不重连；27ms 级可见性切换 | [O] |
| 无 Box warm pool | `composer_send_prewarm` 默认 false 且无读取点；warming 配置属 harness 迁移 | [O] |
| 媒体竞速不唤醒 | store vs readsIfAwake | [O] |
| 并发扇出 | 启动 +2s 内 ~20 RPC 并行含 EnsureSandBox×4 | [O] |

[I] 用户体感“秒开”≈ 预解冻 overlapping 打字时间 + VNC 热池；真实 cold pod 仍约十余秒量级（抓包 presence→CONNECT）。

---

## 9. 疑点收口

| ID | 问题 | 结论 |
|---|---|---|
| D3 | TEMPORAL 是否真实在用？ | 协议与创建路径真实；**默认关闭**；主交互仍是 BOX。服务端可通过 capabilities 打开。不等于 Temporal.io。 |
| D8 | 8790/8791 是否 Box 出网经本机？ | **是（经桌面 WSS 中继 TCP）**；非浏览器代理。8791 命名为 CONNECT proxy，客户端实现重心在 8790。默认 gate off。 |

---

## 10. 关键源锚点速查

- 端口表：`main-app:93095–93103`  
- Ensure 客户端：`main-app:92003–92162`  
- 连接描述符：`main-app:92369–92400`  
- Egress 中继：`main-app:93306–93715`  
- VNC token→header：`main-app:125719–125790`  
- Proto Ensure 响应：`proto:43439`  
- RunState：`proto:41981–41988`  
- xdotool 分辨率：`daemon:119980–120008`  
- Temporal gates：`main-app:56178,56242,100458–100680`  
- Disk Saver：eager-app `SXe`/`yXe`/`purpose:"disk-saver"`；压力枚举 `daemon:132803`  
- EnsureSandBox×42：动态矩阵 / runtime-api-shapes 统计  
