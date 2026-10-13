# Grok Bot 公开说法清单（待用源码核验）

来源均为 2026-08~10 的官方文档、changelog、员工推文、Reddit/HN/论坛。编号供核验报告引用。

## A. 速度
- A1 Lauren Tan（工程师）：桌面端 53 项性能修复；断网重连 60s→0.7s；笔记本唤醒 23s→1s；切回 Bot 电脑画面 868ms→27ms；Media 标签每次重新下载 137MB→0.7MB。
- A2 9-07：冷启动到可用界面快 247ms（18%），LCP 快 425ms。
- A3 用户："feel like grok bot is fast AF now"、"Replies and small tasks feel lightning fast"、"used to wait a second and now it just snaps back"；官方称 "3x faster"。
- A4 0.68.x changelog："Bots work faster on their computer… new windows skip a five-second wait"；云电脑分辨率 1280×800→1920×1200；全屏打开电脑直接显示实时画面，不再出现第二个 Connecting 界面。
- A5 0.70.2 修复"用户离开后约 10 分钟 Mac 断连"。

## B. 永远在线 / 云电脑
- B1 官方："always-on agents… have their own computer… keep working 24/7"。
- B2 官方文档：每个用户一台持久 Firecracker microVM，所有 Bot 共享文件、浏览器会话、CLI 凭证，共享 /workspace；各 Bot 有独立"屏幕"。
- B3 Reddit：关掉 App 和电脑两天，Pinterest routine 仍在运行。
- B4 Routines：每 Bot 最多 50 条，最短 5 分钟，云端执行；用户反馈常延迟 10–20 分钟；Bot 自己设的 cron 在电脑更新后被清掉。
- B5 V2EX：环境和对话回滚十几个小时，官方承认部分用户被误分配重复电脑。

## C. Disk Saver
- C1 官方帮助页：磁盘不足时自动出现 Disk Saver Bot，审计并提出清理方案，必须用户确认才删，聊天记录不受影响。
- C2 bot.ski 博客：只清可再生/重复内容，不碰 worktree、agent 数据、routines、浏览器登录、项目目录；清后 19GB→49GB/126GB，主动提议每周清理。

## D. 多 Agent / 群聊 / 记忆
- D1 官方：Bot 之间可以独立发消息；群聊 2–6 个 Bot；@某个 Bot 指定负责人，@everyone 全员。
- D2 HN："each one owns its own routines, context, and domain, and they can communicate between each other"；"Agent-to-Agent comms are clearly a first-class citizen"。
- D3 Reddit："Group chats of agents and them messaging one another is just SO cool, and the animations are incredibly charming."
- D4 第三方逆向博客 alex908 称：Bot 间私聊用 SendToAgent 异步投递；群聊由 Host 代码调度，没有 Supervisor 模型；每条用户消息最多 3 轮、共 10 条公开回复；Computer/Browser Use 放在独立 subagent。
- D5 产品页记忆示例："Noted for next time: they only sign annual, and Dana is the one who approves."
- D6 alex908 称记忆分三层：Agent memory、User memory、Project memory，外加摘要压缩和可检索 JSONL 对话记录。
- D7 事故：CEO Shane Mac 的私人 CFO Bot 把银行余额发进公司 Slack；官方查明是群聊名与 Slack 频道同名（都叫 "Exec team"）导致误投，24 小时修复。
- D8 Primary Bot（10 月初）主动发现可接手的事并提建议，建议不计额度；有用户抱怨它 "front running the other bots"。

## E. 敏感操作
- E1 官方："The Bot doesn't type credentials and doesn't see your password"；遇到密码/passkey/2FA/CAPTCHA/支付时 Take over，完成后点 I'm done。
- E2 部分连接器支持 secure secret request：输入遮蔽、不进聊天记录、模型看不到。
- E3 云端浏览器可借用插在桌面电脑上的 YubiKey，每次确认。第三方逆向称由 Rust 写的 CTAP2 签名器代理实现。
- E4 changelog：接入 1Password 后自动填密码和 OTP；登录弹出带网站名和图标的 Secure Form；结账卡号改用 Secure Form，不再整屏交接。
- E5 用户：群聊里涉及密码/登录时，会被要求回主 Grok Bot 操作，不能直接在群里回复。
- E6 第三方逆向 shadown：本机 ExternalShell 默认需审批但执行无沙箱（insecure_none）；渲染进程以 --no-sandbox 启动；解密后的全部 secrets 会推送到云端 box。

## F. 教任务 / 语音 / 其他
- F1 官方：Teach a task 录制最长 10 分钟可见屏幕，不录麦克风，生成草稿 Skill；移动端不支持。YouTube："It's actually watching it like a video… then it will write a skill"。
- F2 Yun-Ta Tsai 走路时中英混杂语音让 Bot 查日历并完成网站预订。
- F3 Grok Bot 可以拉起 Cursor Cloud Agent 写代码。
- F4 Lenny 播客：不展示工具调用和思维链，只显示 Slack 式 "active" 状态；99% 自动化由一句自然语言创建；"each agent gets its own computer"。
- F5 官方 10 月论坛：本机只能审批后跑命令、传文件，看不到屏幕，不能点击或输入。
- F6 用户：周额度用完后只显示 "Bot failed to respond" 或 "Can't reach your computer"，不提示额度。
- F7 用户：一个 Bot 花一小时发 X 文章，看不到它在调什么工具、为什么卡住，也停不下来。
- F8 用户：三个 Bot 都只返回自己电脑上的文件路径，用户本机打不开。
- F9 从 X 上 @bot 即可派活。

## G. 上一版分析中需要被重点挑错的论断
- G1 "切回电脑画面 868ms→27ms 是因为 VNC 用 persist:sand-forever-box 持久分区，切走不卸会话"——是否有代码证据表明切换时 webview 不重建？还是纯推断？
- G2 "新窗口跳过 5 秒 = fork_vnc_base_url + EnsureSandBoxWindow(window_index)"——是否有证据？
- G3 "Media 137MB→0.7MB = readAttachmentImage rendition/tile"——Media 标签实际调用什么？
- G4 "断网重连 60s→0.7s = Coordinator 事件循环 + cursor 重放"——退避参数、网络恢复探针具体是什么？0.7s 从哪来？
- G5 "0.70.2 修复 10 分钟断连 ↔ away-park 失焦 10 分钟视为离开（$Zt）"——away-park 是否会影响本机 Local Exec 的连接？
- G6 "群聊默认全员扇出"——是否有证据表明只有被 @ 的成员被调度？alex908 说的"最多 3 轮/10 条"能否在客户端找到常量？
- G7 "密码不能在群里回" 的四条边界——SWe 列表是否真的排除 secret-request？群里出现 secret-request 时 UI 实际怎么渲染？deliverTo:"dm" 是否有消费方？
- G8 "每个 Bot 的独立屏幕是 window_index"——每个 Agent 和 window 的映射在哪？
- G9 E6 第三方说法（insecure_none、--no-sandbox、secrets 全推 box）是否在 0.70.2 成立？与我们观察到的 Renderer sandbox=true 是否矛盾？
- G10 "F6 额度用完显示连不上电脑"——客户端错误码映射是什么，是否有专门的 usage-exhausted 错误码却没被渲染？
