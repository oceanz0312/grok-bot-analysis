# Grok Bot / testAgent.app 动态被动观测方案（历史计划）

> 此文件记录执行前方案，状态说明已过时。实际观测范围、真实 profile 边界和最终结果以 [主报告](full-stack-architecture-report.md) 与 [动态 API 矩阵](dynamic-api-matrix.md) 为准。

> 计划撰写时状态：仅完成离线可行性与工具协议核验；当时尚未启动应用。后续已经执行动态观测。
>
> REA 版本：`rea-agents@6.4.0`。

## 结论

REA 可以安全完成三类观测：

1. Electron `file://` renderer 的页面、DOM 结构、资源和脚本清单。
2. Node/Electron V8 Inspector 的已加载脚本与 execution context 元数据。
3. REA 自己启动的 Electron 实验中的 Electron IPC、生命周期与进程边界；IPC 只保留值类型，不保留值。

REA 6.4 **不能通过上述 Electron 工具捕获主进程、utility process 和 renderer 的完整 HTTP/Connect RPC 请求与响应**：

- `inspect-electron-page` 不启用 CDP `Network` domain。
- `observe-javascript-runtime` 只发送 `Runtime.enable` 与 `Debugger.enable`。
- `capture-electron-scenario` 记录 IPC/生命周期，但不记录网络请求；且网络与普通文件系统行为没有被沙箱化。

因此，完整接口拆解应分两条采集链：

- Electron/JS 运行时：REA 的被动 CDP + Inspector。
- 全进程网络：应用内置代理支持 + 一个“只保存结构、不保存值”的本地代理采集器；远程 HTTP(S) webview 目标可额外使用 REA `inspect-web-page`。

## 应用自身提供的隔离与代理入口

静态代码确认应用会解析 `--user-data-dir` 或 `SAND_USER_DATA_DIR`，并同时重定向 Electron 的 `userData` 与 `sessionData`：

- `main-core.cjs:19246-19272`
- `main-core.cjs:31279-31288`

因此动态分析必须使用新建的绝对路径，绝不能直接使用真实 `~/.grokbot`。

静态代码还确认应用支持：

- `SAND_HTTPS_PROXY`
- `SAND_NO_PROXY`
- `SAND_SYSTEM_PROXY`
- `NODE_USE_ENV_PROXY`

显式的 `SAND_HTTPS_PROXY` 会转换成 `HTTP_PROXY` / `HTTPS_PROXY` 并应用到 Node 全局代理逻辑，见 `main-core.cjs:22463-22489`。这为 main/utility/child 的流量观测提供了入口，但是否覆盖每一种 native socket 仍需动态验证。

## 建议的阶段边界

### 阶段 0：隔离、断网、只确认可观测性

目标：确认应用能在独立 profile 下启动，并确认 CDP/Inspector target；不允许访问后台。

推荐直接启动 packaged app，并启用：

- 新建 user-data 目录。
- 仅绑定 `127.0.0.1` 的 CDP 与 Inspector 端口。
- 可选用 macOS `sandbox-exec` 的 `(deny network-outbound)` 做首次硬断网烟测。它已被 Apple 标记 deprecated，且可能改变应用行为或破坏某些 helper；必须先当作实验条件记录，不能把结果当正常运行事实。

```bash
umask 077
TESTAGENT_OBS_ROOT="$(mktemp -d /private/tmp/testagent-observe.XXXXXX)"
TESTAGENT_CDP_PORT=29323
TESTAGENT_INSPECT_PORT=29324

/usr/bin/sandbox-exec \
  -p '(version 1)(allow default)(deny network-outbound)' \
  /usr/bin/env SAND_USER_DATA_DIR="$TESTAGENT_OBS_ROOT" \
  '/Users/bytedance/Documents/testAgent.app/Contents/MacOS/Grok Bot' \
  --user-data-dir="$TESTAGENT_OBS_ROOT" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port="$TESTAGENT_CDP_PORT" \
  --inspect="127.0.0.1:$TESTAGENT_INSPECT_PORT" \
  --disable-background-networking
```

启动前应先检查端口未被占用：

```bash
lsof -nP -iTCP:29323 -sTCP:LISTEN
lsof -nP -iTCP:29324 -sTCP:LISTEN
```

注意：`sandbox-exec` 方案尚未对该目标运行验证；若其阻断 Electron 内部协作，应退回“本地黑洞代理 + 独立 profile”，但该方案不是严格的全进程网络隔离。

### 阶段 1：无登录、允许网络、采集公开启动流量

目标：分析启动、配置、能力发现、feature gate、版本、匿名 telemetry 等无账户流量。

仍使用全新 user-data。Chromium 流量用 `--proxy-server`，Node 侧用应用自身的 `SAND_HTTPS_PROXY`：

```bash
SAND_HTTPS_PROXY='http://127.0.0.1:18080' \
SAND_NO_PROXY='localhost,127.0.0.1,::1' \
SAND_USER_DATA_DIR="$TESTAGENT_OBS_ROOT" \
'/Users/bytedance/Documents/testAgent.app/Contents/MacOS/Grok Bot' \
  --user-data-dir="$TESTAGENT_OBS_ROOT" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port="$TESTAGENT_CDP_PORT" \
  --inspect="127.0.0.1:$TESTAGENT_INSPECT_PORT" \
  --proxy-server='http://127.0.0.1:18080'
```

代理采集器必须在内存里把 body 转换为结构后立即丢弃原值，落盘只允许：

- scheme、host、path；query 只保留参数名。
- method、status、content-type、byte length、duration。
- header 只保留名称；最多保留经过固定 allowlist 的无敏感枚举值。
- JSON：property path + value type + array/object 结构，不保存值。
- Protobuf/Connect/gRPC：service/method path、frame flags、消息长度、wire field number/type；不保存字段值。
- WebSocket：方向、opcode、长度、JSON shape；不保存 payload。

### 阶段 2：用户监督下登录并逐能力操作

目标：将每一个 UI 操作与请求、响应、IPC、服务端状态变化关联。

这一阶段会真实调用后台并可能创建 Agent、Box、会话、云环境或持久数据，必须单独记录动作清单。建议只执行可回滚、最小化动作，并为每个动作分配 correlation window：

1. 操作前清空采集窗口。
2. 用户/自动化执行一个动作。
3. 等待网络静默。
4. 保存结构化事件与时间戳。
5. 对照客户端 handler、Connect RPC descriptor、状态 store 和 transcript 代码。

## REA 6.4 精确调用协议

REA MCP 当前未注册，但 CLI 与 MCP 输入一一对应。下面 JSON 是 MCP 风格输入；CLI 命令可直接运行。

### `list_electron_targets`

```json
{
  "cdp_endpoint": "http://127.0.0.1:29323"
}
```

```bash
npx -y rea-agents@6.4.0 list-electron-targets \
  http://127.0.0.1:29323 \
  --format json
```

只列 `file://` page target；其他 scheme 和非 page target 会被排除。

### `inspect_electron_page`

```json
{
  "cdp_endpoint": "http://127.0.0.1:29323",
  "target_id": "TARGET_ID",
  "observation_ms": 3000,
  "include_script_sources": false
}
```

```bash
npx -y rea-agents@6.4.0 inspect-electron-page \
  http://127.0.0.1:29323 TARGET_ID \
  --observation-ms 3000 \
  --format json
```

它只启用 `Page`、`Runtime`、`Debugger`，返回 frames、DOM 结构、资源、scripts、workers；不会点击、导航、evaluate JavaScript 或捕获网络。

### `list_javascript_runtime_targets`

Main process Inspector：

```json
{
  "inspector_endpoint": "http://127.0.0.1:29324"
}
```

Renderer 也可对 CDP endpoint 调用同一工具：

```json
{
  "inspector_endpoint": "http://127.0.0.1:29323"
}
```

```bash
npx -y rea-agents@6.4.0 list-javascript-runtime-targets \
  http://127.0.0.1:29324 \
  --format json
```

### `observe_javascript_runtime`

Main process：

```json
{
  "inspector_endpoint": "http://127.0.0.1:29324",
  "target_id": "TARGET_ID",
  "runtime_kind": "electron-main",
  "observation_ms": 3000
}
```

Renderer：

```json
{
  "inspector_endpoint": "http://127.0.0.1:29323",
  "target_id": "TARGET_ID",
  "runtime_kind": "electron-renderer",
  "observation_ms": 3000
}
```

```bash
npx -y rea-agents@6.4.0 observe-javascript-runtime \
  http://127.0.0.1:29324 TARGET_ID \
  --runtime-kind electron-main \
  --observation-ms 3000 \
  --format json
```

该 provider 是 attach-only，只发送 `Runtime.enable` 与 `Debugger.enable`；只保留 script/context 元数据，不取变量、heap、cookie 或 storage。`runtime_kind` 是调用者声明，REA 不能证明 Electron role。

不要同时打开 DevTools 或让多个客户端附着：REA 会拒绝已经 attached 的 Inspector target。按“list → observe → detach → 下一个工具”顺序串行执行。

### `capture_electron_scenario`

输入 schema：

```json
{
  "executable_path": "/Applications/Electron.app/Contents/MacOS/Electron",
  "application_path": "/Users/bytedance/Documents/testAgent.app/Contents/Resources/app.asar",
  "application_root": "/Users/bytedance/Documents/testAgent.app/Contents/Resources",
  "args": [
    "--user-data-dir=/private/tmp/testagent-observe.EXAMPLE"
  ],
  "actions": [
    {
      "step_id": "settle",
      "kind": "wait",
      "duration_ms": 3000
    }
  ]
}
```

支持的 action：

- `click`: `selector`, `window_index`
- `wait`: `duration_ms`, optional `window_index`
- `renderer-reload`
- `renderer-crash`
- `deep-link`: `delivery` 为 `open-url` 或 `second-instance`

CLI：

```bash
npx -y rea-agents@6.4.0 capture-electron-scenario \
  /absolute/path/to/scenario.json \
  --format json
```

重要边界：

- 这是 provider-owned 主动运行，不是被动附着。
- REA 通过 Playwright 启动 `executable -r hook application_path ...args`，结束后会终止它拥有的进程。
- 仅 main-process `-r` hook；renderer/preload 没有完整注入。
- IPC 只保留 `string/number/object/array/...` 等 shape，不保留 payload 值。
- 会阻止 external shell、external navigation、permission grant、download、popup、updater relaunch 和若干 OS integration。
- **其他网络与普通文件系统行为不受沙箱保护。**
- 启动环境只保留 `HOME/LANG/PATH/TMP/TMPDIR/USER/DISPLAY/WAYLAND_DISPLAY`，因此不能依赖 `SAND_HTTPS_PROXY` 传入此工具；必须另设网络边界。
- 当前机器没有匹配的通用 `Electron.app`。直接把 packaged `Grok Bot` 可执行文件作为 `executable_path` 是否能被 Playwright 正确当作 generic Electron runtime 尚未验证；额外的 `application_path` 还可能被应用当作普通 argv。首次尝试前应准备匹配 Electron `42.1.0` 的 generic runtime，或先做无网络、空 profile 的兼容性烟测。

## REA 对 HTTP(S) 页面能提供的网络形状

如果 CDP target 本身是 HTTP(S) 页面（例如远程 VNC/webview，而不是主 `file://` renderer），可以使用：

```bash
npx -y rea-agents@6.4.0 list-browser-targets \
  http://127.0.0.1:29323 \
  --format json

npx -y rea-agents@6.4.0 inspect-web-page \
  http://127.0.0.1:29323 TARGET_ID \
  --allowed-origins https://expected-origin.example \
  --observation-ms 15000 \
  --include-json-body-shapes \
  --include-websocket-shapes \
  --format json
```

多个 `--allowed-origins` 可以重复传入。

它会保留 URL、method、status、mime、size、initiator，以及可选 JSON/WebSocket value-free shape；不会保留原始 header/body/cookie/storage value。

但有一个关键风险：REA 只自动删除 URL userinfo，**普通 query value 和 fragment 会原样保留**。因此：

- 首轮只对无登录的新 profile 使用。
- 使用 exact `allowed_origins`。
- 若目标 URL 可能携带 signed URL、`token`、`network_token`、`port_token` 等 query，禁止直接保存完整 REA 输出；应在写盘前把 query value 统一替换为占位符。

## HAR / mitmproxy 历史捕获的边界

`inspect-web-network-capture` 可以离线读取 HAR；macOS 上不能使用 REA 的 native mitmproxy decoder，因为该 adapter 明确要求 Linux + caller-supplied mitmdump 12.2.3。

```bash
npx -y rea-agents@6.4.0 inspect-web-network-capture \
  /absolute/path/to/capture.har har \
  --sensitive-value 'KNOWN_LITERAL' \
  --format json
```

REA 会自动去掉 `Authorization`、`Proxy-Authorization`、`Cookie`、`Set-Cookie` 和 HAR cookie value，并支持显式 literal redaction；但它不会猜测未知扩展字段、query token、JSON body 内任意 secret 或用户内容。因此原始 HAR 仍是高敏感制品，不能把“REA 后处理会脱敏”当作安全采集策略。

首选是源头只保存结构；如果不得不产生原始 HAR：

1. 放在 `0700` 临时目录，文件 `0600`。
2. 不回显、不提交、不上传。
3. 先离线生成结构化脱敏版本。
4. 验证脱敏版本后，将原始文件移入废纸篓并报告删除情况。

## macOS Computer Use / Chrome DevTools 工具边界

当前环境存在通过 Node REPL 调用 macOS Computer Use 的入口，也存在 Chrome DevTools MCP。它们可用于用户监督下执行 UI 动作，但不应作为首轮被动采集器：

- UI 自动化会改变应用状态，应在阶段 2 按一动作一窗口执行。
- Chrome DevTools 的 `get_network_request` 明确可返回 `Cookie`、`Set-Cookie` 和 request/response body，容易把凭证注入模型上下文；默认禁止调用。
- 若需要网络列表，优先 REA value-free capture 或自建 sanitizer，只在本地保存结构。

## 最小验证清单

在任何登录或真实后台动作之前，依次验证：

1. `--user-data-dir` 日志确认命中隔离目录。
2. `~/.grokbot` 的 mtime/内容没有变化。
3. CDP/Inspector 仅监听 `127.0.0.1`。
4. `list-electron-targets` 能看到主 `file://` page。
5. `inspect-electron-page` 能拿到 renderer bundle digest/path。
6. main Inspector 能列出并观察 `main.cjs/main-core.cjs/main-app.cjs`。
7. renderer Inspector 能列出主 renderer scripts。
8. 断网启动时没有外部连接成功。
9. 代理模式下 Node/Chromium/utility 各自的测试请求是否都能被观察；未覆盖的进程/协议必须明确列为 unknown。
10. 捕获输出中不存在 authorization/cookie/query value/body value。

