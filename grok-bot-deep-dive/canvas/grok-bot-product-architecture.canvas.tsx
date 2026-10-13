import {
  Callout,
  H1,
  H2,
  Pill,
  Row,
  Stack,
  Table,
  Text,
} from "cursor/canvas";

const HEADERS = ["公开说法", "为什么能做到", "证据", "状态"];

export default function GrokBotClaimToArchitecture() {
  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>公开说法如何落到 0.70.2 的代码路径（三组审计后修订版）</H1>
        <Text tone="secondary">
          每一行都是：用户原话或官方文档 → 产生这种体感的机制 → 客户端里能钉死的证据 → 核验状态。
          服务端内部（虚拟机调度、模型路由、system prompt）只标推断或未知，不写成拆包事实。
        </Text>
      </Stack>

      <Callout tone="warning" title="先改掉一句营销">
        「每个 Bot 一台电脑」是口号。EnsureSandBox 返回的是账号级 cluster/tenant/pod，官方企业文档写明 /workspace 共享。各 Bot 的「独立屏幕」来自 getForeverBoxStatus 返回的 windows[vncUrl, windowIndex] 列表；fork_vnc_base_url 只负责把 loopback :6081 改写成代理地址。Firecracker 只出现在官方文档里，客户端没有证据。
      </Callout>

      <H2>1. 快</H2>
      <Table
        headers={HEADERS}
        striped
        stickyHeader
        rows={[
          [
            "Nate Esparza: feel like grok bot is fast AF now；Musk: Major speed improvements",
            "感知链路，而不是客户端换模型：乐观行立刻上屏，Watch 流按 cursor 增量推，TTFR 作为指标持续打点。",
            "SendGrokBotUserMessage.enter_epoch_ms；accepted-echo + clientNonce；sand.render_ttfr / sand.send.ack",
            "感知层已观察；模型侧未知",
          ],
          [
            "Lauren Tan：断网重连 60s→0.7s；合盖唤醒 23s→1s",
            "不等退避：powerMonitor 事件 + 每 2s 轮询 net.isOnline 触发 noteNetworkReturn → 对活连接发回声探针，1.5s 内没回就 reconnectGeneration++ 并立即重连，跳过 1s→10s 退避 → 用 cursor 续传。",
            "coord:40961–40968 常量；coord:41209 noteNetworkReturn；main-app:87814 desktop-online-edge",
            "机制已观察；数值为外部实测",
          ],
          [
            "切回电脑画面 868ms→27ms",
            "VNC 热池：最多 3 个 webview 常驻，每个 Agent 至少留 1 个，切走只设 visibility:hidden；每 3s 截一帧 JPEG(q0.7) 兜底，无快照时 300ms 后才显示 Connecting。",
            "sand-box-vnc-pool maxWarm=3；toDataURL(\"image/jpeg\",.7) LRU 3",
            "已观察（上一版归因于持久分区，错误）",
          ],
          [
            "changelog：新窗口跳过 5 秒等待；全屏直接出实时画面",
            "候选机制：新窗口最多等 5s 远端特性开关，超时全部 off；同时把 initialExperimentsSnapshot 注入新窗口。全屏复用池里的 webview。",
            "b1e=5e3；initialExperimentsSnapshot；EnsureSandBoxWindow 客户端零调用",
            "推断（上一版 EnsureSandBoxWindow 归因不成立）",
          ],
          [
            "打字期间电脑已经醒了（用户不感知冷启动）",
            "第一次 composing 上报 TYPING，服务端可回 PRETHAW；命令分 person / background，后台命令不叫醒；读历史不唤醒 Box。",
            "ReportGrokBotClientPresence trigger=TYPING；GrokBotBoxIntentAction.PRETHAW；EnsureSandBox describe/locate/connect",
            "已观察",
          ],
          [
            "Media 标签 137MB→0.7MB",
            "ETag/304 + 三级缓存（字节 64MiB / 渲染 32MiB / 会话磁盘 512MiB）+ 4MiB Range 分块；预签名批量 64 条 / 2.5s。rendition 是下载后在本地生成的，不是省流量的原因。",
            "main-app:84990 起；readsIfAwake 与中央存储竞速",
            "已观察（上一版 rendition 归因不成立）",
          ],
        ]}
      />

      <H2>2. 关电脑还在干活 / 永远在线</H2>
      <Table
        headers={HEADERS}
        striped
        rows={[
          [
            "官方：keep working 24/7；Reddit：关 App 两天 Pinterest 还在跑",
            "执行面在云 Box，调度在服务端。实际是「持久磁盘 + 按需唤醒」：HTTP 417 或 x-anyrun-failure-reason 识别为 pod_hibernated。routine 带 window{early,late} 与 exact/flexible，flexible 能解释延迟。",
            "ListGrokBotAgentAutomations；wake: automation/background-revival；VNC 恢复区间 900–18000s",
            "机制已观察；官方上限数值客户端无常量",
          ],
          [
            "官方：agent 完全跑在云端（Lenny 播客）",
            "桌面是瘦客户端：主窗口 sandbox=true；但 coordinator 和 local-exec 是不受 Chromium 沙箱约束的 utilityProcess。离开时默认保留 Local Exec、撤回 Box 凭据。",
            "away-park 策略表 coord:44682–44704",
            "已观察",
          ],
        ]}
      />

      <H2>3. Disk Saver 自己找上门</H2>
      <Table
        headers={HEADERS}
        striped
        rows={[
          [
            "@techdevnotes：磁盘危急时创建 Disk Saver Bot",
            "检测在 Box 里。Gateway 推 SSE box-disk-pressure → 渲染层自动器 createAgent{purpose:\"disk-saver\"} 或 requestDiskSaverAudit。去重只在内存里，重启后不去重；只有新建 Agent 这一步退避 30s→15 分钟。",
            "SSE box-disk-pressure；bS() 把 purpose 型创建路由到 c(p)，在 nonce 持久化之前",
            "已观察（上一版 nonce 去重不成立）",
          ],
          [
            "官方：必须用户确认才删；bot.ski：不碰 worktree / 登录 / 项目",
            "客户端没有删除专用审批卡、路径白名单或回收站，只有对所有 Bot 生效的 shell 自动审查。「先问再删」靠文案和服务端 prompt。",
            "i18n OlprmX；通用 allow / ask_first / always",
            "客户端无强制；推断为 prompt 约束",
          ],
        ]}
      />

      <H2>4. 群聊、互感知、@</H2>
      <Table
        headers={HEADERS}
        striped
        rows={[
          [
            "官方：群 2–6 人，@ 指定负责人，@everyone 全员",
            "群是 ROOM 类型 Agent。输入框用 TipTap mention，id 随 richText 提交；SendGrokBotUserMessageRequest 没有单独的 mention 字段。",
            "GrokBotAgentKind.ROOM；CreateGrokBotRoom；sand-mention-suggestion",
            "输入端已观察；调度语义未知",
          ],
          [
            "Reddit：Bot 互相发消息 SO cool；HN：agent-to-agent 是一等公民",
            "Bot 间投递是 Box 的 host-only 方法，不是 Renderer P2P。消息作者 kind 含 agent / cloud-agent / group。",
            "host-only deliverAgentMessage；SendToAgent；SandMessageAuthor",
            "已观察；投递语义未知",
          ],
          [
            "官方用量文案：群聊更费，因为每条消息多个 Bot 都处理",
            "协议里有单成员轮次 RequestGrokBotRoomMemberTurn（SENT / PASS / TIMEOUT，nonce / deadline / winding_down / root_parent），但客户端零调用方。「主持人逐个扇出」是推断。房间托管正从 Box 迁到服务端（server_rooms_enabled）。没有 3 轮 / 10 条常量。",
            "proto 59192；box_rooms{members_server_bound}",
            "推断（上一版写成观察）",
          ],
          [
            "「Agent A 能感知 B」",
            "A 看不到 B 的私聊全文。能看到：通讯录、本轮 new_messages、peers 简介、晋升过的团队记忆。记忆 scope 是自由字符串，没有 Project 层、摘要或 JSONL。",
            "PromoteGrokBotMemoriesToTeam；ReadAgentTranscript 存在于协议",
            "已观察",
          ],
        ]}
      />

      <H2>5. 密码 / Take over / 群里回主 Bot</H2>
      <Table
        headers={HEADERS}
        striped
        rows={[
          [
            "官方：The Bot doesn't type credentials and doesn't see your password",
            "值走独立 RPC，transcript 只记 secretProvided:bool。但 Main 会把全部密钥解密成快照推给 Box（resync / 换账号 / 设置同步时），以 shell 环境变量供命令使用。",
            "exportSnapshot → Uxn → setBoxSecrets；i18n 6eckAH「use in shell commands as environment variables」",
            "不进对话成立；「模型看不到」无法证明",
          ],
          [
            "Take over 自己打密码；changelog：结账改 Secure Form",
            "成员 Bot 设 boxReason=auth|captcha|payment，用户接管 Forever Box，完成后 handBack。Secure Form 把值直接填进 liveOrigin 页面。",
            "handBackForeverBox；SandSecureValuesUserFormRequest.secureValues",
            "已观察",
          ],
          [
            "YubiKey 插在 Mac 上，云浏览器借用",
            "随包 Rust 签名器 sand-webauthn-signer（Mozilla authenticator 0.5，CTAP2 / IOHID）。每次签名弹确认，PIN 经 stdin，拒绝后静默 60s。启动不看 webauthnProxyEnabled，路径可被环境变量替换。",
            "dist/native/sand-webauthn-signer；coord:45808；SAND_WEBAUTHN_SIGNER_PATH",
            "已观察",
          ],
          [
            "1Password 批准后自动填，含 OTP",
            "sand-op-launcher 校验 1Password CLI 签名（Team ID 2BUA8C4S2C）后用 seatbelt 启动；填充方法 host-only。",
            "dist/native/sand-op-launcher；fillBrowserOneTimeCode",
            "大体成立；「看不到值」未知",
          ],
          [
            "用户疑惑：群里登录为什么要回主 Bot",
            "客户端没有硬隔离：SWe 是「非目标成员显示等待占位」的白名单，只含连接器和两类审批；secret-request 落到 default，群里所有人都能看到并提交。deliverTo:\"dm\" 无消费方，也没有「回主 Bot」文案。最可能是模型行为：共享 Bot 不持有你的个人密钥和浏览器会话。",
            "SWe switch default；personal_secret_names；getMainAgent / setMainAgent",
            "客户端证据相反（上一版方向错）",
          ],
        ]}
      />

      <H2>6. 教它做一项任务 / 语音 / Cloud Agent / 极简 UI</H2>
      <Table
        headers={HEADERS}
        striped
        rows={[
          [
            "官方：录最长 10 分钟，生成草稿 Skill，不录麦",
            "录的是 Bot 的云桌面（「Recording {agent}'s computer」）。停录后变成 initiator=TEACH_RECORDING 的用户消息，引用 learn-from-demonstration。",
            "start/stopTeachRecording；Wke=600000；initiator 6",
            "已观察；不录麦未知",
          ],
          [
            "Yun-Ta Tsai 走路语音订位",
            "语音 harness 的 prompt 和工具表内联在客户端 Main：只能 send_task 给文本 Bot，结果以 work_landed 回来，并声明 work_landed 不是新指令。",
            "main-app:37714 起；send_task / stay_silent / recall_text_messages / search_conversations",
            "已观察",
          ],
          [
            "Grok Bot 再派 Cursor Cloud Agent 写代码",
            "UI 是审批卡「Allow bot to use a cloud agent?」。复用 Cursor BackgroundComposer 没有直接证据。",
            "i18n n+x4AI；卡片 cursor-agent",
            "卡片已观察；后端推断",
          ],
          [
            "Lenny：不展示工具调用，只显示 active；用户：停不下来",
            "工具调用会下发 SandToolCallEntry，但 transcript 行构建器 g_e() 直接 return null，只当分隔符。Stop 是有的：interruptAgentRun。",
            "SandToolCallEntry；g_e / ZP；interruptAgentRun{id,sessionId}",
            "不展示成立；停不下来不成立",
          ],
          [
            "10 月初 Primary Bot 会主动提议",
            "主 Bot 由 main_agent_id 标识，有专属接口但未见权限差异。GrokBotChangelog 是另一套功能播报机制，不是这条。",
            "SetGrokBotMainAgent；EnsureGrokBotDefaultMainAgent",
            "只有文案；计费豁免无证据",
          ],
          [
            "额度用完只显示 Bot failed to respond",
            "有 USAGE_LIMIT=3 和详情「Your usage limit has been reached」，但标题固定；RATE_LIMIT / TEAM_POLICY_UNAVAILABLE / UNPAID_INVOICE 未映射。",
            "GrokBotTurnFailureCode；i18n szlCF8 / Uq1VXs",
            "部分成立",
          ],
        ]}
      />

      <H2>7. 第三方逆向的安全说法</H2>
      <Table
        headers={["说法", "结论", "证据"]}
        striped
        rows={[
          [
            "渲染进程以 --no-sandbox 启动",
            "不成立（macOS 0.70.2）：只在启动遥测里读一次 hasSwitch，从不 appendSwitch。",
            "main-core:45314 osSandbox",
          ],
          [
            "本机执行无沙箱 insecure_none",
            "基本成立：审批后 policy = Box 下发 ?? insecure_none，根目录缺省 home；文件传输有 realpath containment。",
            "exec:127880–127981；CURSOR_FORCED_SHELL_EGRESS 无人设置",
          ],
          [
            "解密后全部密钥推送到 Box",
            "成立：全量快照；Box 不可达时还会经中央 RPC 上传明文。",
            "main-app:120386–120560；carryUserSecretsToGrokBot",
          ],
          [
            "（新发现）Chrome cookie 导入 Box、Computer Use helper 申请超额权限",
            "登录态整体外移到云端；helper 申请屏幕录制 / 辅助功能 / AppleEvents / 通讯录，当前只用于 Messages。",
            "injectChromeCookies；Grok Bot Computer Use.app Info.plist",
          ],
        ]}
      />

      <Row gap={8}>
        <Pill tone="success" size="sm">
          已观察 = 代码 / 协议
        </Pill>
        <Pill tone="warning" size="sm">
          推断 = 多证据合成
        </Pill>
        <Pill size="sm">官方文档单独标注，不当成拆包事实</Pill>
      </Row>
    </Stack>
  );
}
