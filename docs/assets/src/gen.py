CSS="""
*{margin:0;padding:0;box-sizing:border-box}
body{width:1600px;height:var(--h);background:#f4efe6;color:#1d1b18;font-family:'Noto Sans CJK SC',sans-serif;padding:72px 88px;position:relative;text-wrap:pretty}
.k{font-size:20px;letter-spacing:.18em;color:#b8412a;font-weight:700}
h1{font-family:'Noto Serif CJK SC',serif;font-weight:900;font-size:68px;line-height:1.2;margin:18px 0 0}
h1 em{font-style:normal;color:#b8412a}
.sub{font-size:24px;color:#5a544b;margin-top:18px;line-height:1.6;max-width:1200px}
.rule{border-top:2px solid #1d1b18;margin:36px 0 0}
.thin{border-top:1px solid #1d1b18}
.foot{position:absolute;left:88px;right:88px;bottom:40px;display:flex;justify-content:space-between;font-size:16px;color:#7a7368;border-top:1px solid #c9c0b2;padding-top:14px}
.num{font-family:'Noto Serif CJK SC',serif;font-weight:900;color:#b8412a;line-height:1}
.slate{color:#3d5a73}
code{font-family:'DejaVu Sans Mono',monospace;font-size:.86em;background:#e8e0d2;padding:1px 6px}
"""
def page(name,h,body,src):
    open(name+'.html','w').write(f"<html><head><meta charset=utf-8><style>{CSS}</style></head><body style='--h:{h}px'>{body}<div class=foot><span>grok-bot-analysis · Grok Bot 0.70.2 客户端逆向</span><span>来源：{src}</span></div></body></html>")

# 1 hero
page('01-hero',900,"""
<div class=k>REVERSE ENGINEERING · GROK BOT 0.70.2</div>
<h1>拆开 Grok Bot：<br>一个<em>“自己有电脑”</em>的 Personal Agent<br>是怎么造出来的</h1>
<div class=rule></div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);margin-top:34px">
""" + "".join(f"<div style='border-left:{'0' if i==0 else '1px solid #1d1b18'};padding:0 28px'><div class=num style='font-size:96px'>{n}</div><div style='font-size:22px;margin-top:12px;line-height:1.5'>{t}</div></div>" for i,(n,t) in enumerate([("484","条中央 RPC 路由<br><span class=slate>429 个唯一 operation</span>"),("167","个 Box Gateway 公开方法<br><span class=slate>+27 SSE · 40 host-only</span>"),("4","个平面<br><span class=slate>客户端 · 控制面 · Box · 本机</span>"),("7","条架构不变量<br><span class=slate>解释“快、稳、安全”</span>")])) + "</div>",
"docs/reference · docs/architecture/overview.md · docs/replication")

# 2 architecture
planes=[("客户端平面","用户 Mac 上的 Electron 应用","显示、输入、本地快照、连接管理"),("中央控制面","api2.cursor.sh 后的服务集群","记账：账号、Agent 注册表、对话日志、调度、密钥、计费、配置"),("Box 执行面","每账号一台 *.cursorvm.com 云桌面","干活：模型工具循环、浏览器、终端、文件、云端 Computer Use"),("本机执行面","客户端拉起的独立守护进程，只向外连","代办：在用户 Mac 上跑命令、传文件、发 iMessage")]
cells="".join(f"<div style='padding:30px 28px;border-top:{'6px solid #b8412a' if i in(1,2) else '6px solid #3d5a73'}'><div style='font-size:15px;color:#7a7368;letter-spacing:.1em'>PLANE 0{i+1}</div><div style='font-family:Noto Serif CJK SC;font-weight:900;font-size:38px;margin:10px 0 14px'>{a}</div><div style='font-size:19px;color:#3d5a73;margin-bottom:14px'>{b}</div><div style='font-size:21px;line-height:1.65'>{c}</div></div>" for i,(a,b,c) in enumerate(planes))
page('02-architecture',900,f"""<div class=k>ARCHITECTURE</div><h1><em>Box 干活，中心记账</em>：四个平面</h1>
<div class=sub>模型和工具在 Box 里跑；对话日志、Agent 身份、调度、计费的权威在中央。客户端订阅的是中央日志，不是 Box。</div>
<div style='display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-top:44px'>{cells}</div>
<div style='margin-top:34px;font-size:20px;color:#5a544b'>通道：客户端 ⇄ 中央 <b>ConnectRPC</b>　·　客户端 ⇄ Box <b>Gateway</b> <code>POST /api/{{method}}</code> + <code>GET /events</code></div>""","docs/architecture/overview.md · docs/reference/gateway-schema.md")

# 3 findings
F=[("快不靠服务器","断网重连 60s→0.7s、合盖唤醒 23s→1s：本地快照先画 + “已发送≠已完成” + 事件驱动探针。"),("秒开不靠预热池","默认让 Box 睡着，打字/聚焦上报 presence 触发 PRETHAW；后台命令不唤醒。未发现 warm pool 证据。"),("群聊也是一个 Agent","GrokBotAgentKind 只有 AGENT=1 与 ROOM=2；程序逐个成员编排轮次，模型决定发言或 PASS。"),("密码隔离只做了一半","值走独立通道、transcript 只留标记；但全量密钥仍以环境变量进入 Box，群 secret 卡片客户端未隔离。"),("484 ≠ 484 种能力","GrokBotService 复用 SandBoxService 全部 55 条同名同 schema 路由，唯一 operation 只有 429 个。")]
rows="".join(f"<div style='display:grid;grid-template-columns:110px 380px 1fr;align-items:baseline;padding:22px 0;border-top:1px solid #1d1b18'><div class=num style='font-size:60px'>0{i+1}</div><div style='font-family:Noto Serif CJK SC;font-weight:900;font-size:34px'>{a}</div><div style='font-size:22px;line-height:1.6;color:#2f2b26'>{b}</div></div>" for i,(a,b) in enumerate(F))
page('03-findings',1080,f"<div class=k>FIVE COUNTERINTUITIVE FINDINGS</div><h1>五个最<em>反直觉</em>的发现</h1><div style='margin-top:30px;border-bottom:1px solid #1d1b18'>{rows}</div>","docs/replication/reference-architecture.md · docs/subsystems/* · docs/reference/api-capability-catalog.md")

# 4 fast
M=[("断网重连","60s","0.7s"),("合盖唤醒","23s","1s"),("切回 Bot 电脑画面","868ms","27ms"),("Media 标签重复下载","137MB","0.7MB")]
bars="".join(f"<div style='display:grid;grid-template-columns:290px 1fr 240px;align-items:center;padding:20px 0;border-top:1px solid #1d1b18'><div style='font-size:24px;font-weight:700'>{a}</div><div style='font-size:24px;color:#7a7368'><s>{b}</s>　→</div><div class=num style='font-size:58px;text-align:right'>{c}</div></div>" for a,b,c in M)
mech=[("本地先画","切片落盘，启动先渲染快照，网络只校验增量"),("已接纳 ≠ 已完成","乐观行 + clientNonce 对账 + send-journal 续传"),("按意图唤醒","presence → PRETHAW；读历史永不唤醒 Box"),("事件驱动恢复","唤醒/联网边沿 → 回声探针 → 失败立即重连")]
mc="".join(f"<div style='padding:22px 0;border-top:1px solid #1d1b18'><div style='font-family:Noto Serif CJK SC;font-weight:900;font-size:30px;color:#3d5a73'>{a}</div><div style='font-size:20px;line-height:1.6;margin-top:8px'>{b}</div></div>" for a,b in mech)
page('04-why-fast',1000,f"<div class=k>WHY IT FEELS FAST</div><h1>“快”是<em>架构</em>，不是算力</h1><div style='display:grid;grid-template-columns:1.15fr 1fr;gap:80px;margin-top:40px'><div><div style='font-size:18px;color:#7a7368;margin-bottom:10px'>官方/工程师公开的性能数字（待解释的现象）</div>{bars}</div><div><div style='font-size:18px;color:#7a7368;margin-bottom:10px'>代码里找到的机制</div>{mc}</div></div>","public-claims A1 · reference-architecture · performance-and-storage")

# 5 room
outs="".join(f"<span style='display:inline-block;border:1px solid #1d1b18;padding:6px 14px;margin:0 10px 10px 0;font-family:DejaVu Sans Mono;font-size:18px;{'background:#b8412a;color:#f4efe6;border-color:#b8412a' if o=='PASS' else ''}'>{o}</span>" for o in "SENT PASS SKIPPED TIMEOUT CANCELLED ERROR".split())
mem="".join(f"<div style='border:2px solid #3d5a73;padding:18px 20px;text-align:center'><div style='font-family:Noto Serif CJK SC;font-weight:900;font-size:26px'>成员 Bot {x}</div><div style='font-size:17px;color:#5a544b;margin-top:6px'>模型决定：说 or PASS</div></div>" for x in "ABC")
page('05-multiagent-room',1000,f"""<div class=k>MULTI-AGENT · ROOM</div><h1>群聊本身<em>也是一个 Agent</em></h1>
<div class=sub><code>GrokBotAgentKind</code> 只有 <code>AGENT=1</code> 和 <code>ROOM=2</code>。程序决定“谁、何时、在哪、是否安全”，LLM 决定“做什么、说不说”。</div>
<div style='display:grid;grid-template-columns:1fr 1fr;gap:72px;margin-top:40px'>
<div><div style='border:3px solid #b8412a;padding:22px;text-align:center'><div style='font-family:Noto Serif CJK SC;font-weight:900;font-size:32px'>Room（AgentKind.ROOM）</div><div style='font-size:18px;margin-top:8px;color:#5a544b'>member_agent_ids · human_member_user_ids</div></div>
<div style='text-align:center;font-size:20px;padding:14px 0'>↓ 宿主程序逐个调用 <code>RequestGrokBotRoomMemberTurn</code><br><span style='font-size:17px;color:#7a7368'>nonce · peers · new_messages · deadline_ms · is_winding_down</span></div>
<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:16px'>{mem}</div>
<div style='margin-top:24px;font-size:18px;color:#7a7368'>每轮 Outcome</div><div style='margin-top:10px'>{outs}</div></div>
<div><div style='font-family:Noto Serif CJK SC;font-weight:900;font-size:32px'>敏感操作为什么“回主 Bot”</div>
<div style='font-size:21px;line-height:1.75;margin-top:16px'>
<div class=thin style='padding:12px 0'>只有已共享的 Bot 能进群</div>
<div class=thin style='padding:12px 0'>个人密钥“永不向队友显示”</div>
<div class=thin style='padding:12px 0'>敏感卡片绑定具体用户与会话（<code>targeted.forUser</code>）</div>
<div class=thin style='padding:12px 0'>密钥、表单、凭据走独立 RPC，不进 transcript 与模型上下文</div>
<div class=thin style='padding:12px 0;color:#b8412a'><b>缺口：</b>全量密钥仍以环境变量进入 Box；群 secret 卡片客户端未隔离</div></div></div></div>""","docs/subsystems/multiagent-memory-security.md · docs/replication/reference-architecture.md")

# 6 numbers
N=[("484","中央 RPC 路由声明","7 个 ConnectRPC 服务"),("429","唯一 operation","GrokBot 复用 SandBox 55 条"),("167","Gateway 公开 JSON 方法","POST /api/{method}"),("27","SSE event channel","GET /events"),("40","host-only 方法","只在 Box 宿主可调"),("51","动态窗口观察到的中央 RPC","1972 条脱敏有效记录")]
cells="".join(f"<div style='padding:30px 30px 30px 0;border-top:2px solid #1d1b18'><div class=num style='font-size:120px;{'color:#3d5a73' if i>=2 else ''}'>{a}</div><div style='font-family:Noto Serif CJK SC;font-weight:900;font-size:28px;margin-top:14px'>{b}</div><div style='font-size:19px;color:#5a544b;margin-top:6px'>{c}</div></div>" for i,(a,b,c) in enumerate(N))
page('06-numbers',1000,f"<div class=k>BY THE NUMBERS</div><h1>协议面有多大：<em>484</em> 条路由，只有 <em>429</em> 种操作</h1><div style='display:grid;grid-template-columns:repeat(3,1fr);column-gap:48px;margin-top:40px'>{cells}</div>","docs/reference/api-capability-catalog.md · gateway-schema.md · dynamic-api-matrix.md")
