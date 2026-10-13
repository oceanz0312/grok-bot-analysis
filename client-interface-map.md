# testAgent 客户端接口与信任边界地图

当前安装目标是 `/Applications/testAgent.app`；本文使用的格式化静态证据位于 `/Users/bytedance/Documents/testAgent-analysis`，它来自此前 `/Users/bytedance/Documents/testAgent.app` 副本的解包结果。现已核验 `/Applications/testAgent.app` 与 `/Applications/Grok Bot.app` 的 `app.asar` SHA-256 均为 `8dd7b6c4a58439d626a9a7b3766982b7c725db2bc1f6ff68a29fc1ec62ca4cf7`，并与本分析摘要记录一致，因此可将当前安装包与该解包证据视为同一静态版本。本附录的 301/12 接口枚举步骤未再次启动应用或触发接口；运行时观察另见 [动态 API 矩阵](dynamic-api-matrix.md)。

核心结论：

- main RPC edge 声明了 301 个唯一方法，下面按 17 个互斥业务域完整枚举，计数之和为 301。
- 这 301 个名字首先都是 Renderer 到 Electron Main 的本地 IPC 白名单，不等于 301 条服务端 HTTP/RPC。
- Preload 实际从 desktop.main 隐藏 stageAttachmentPath，改由 desktop.local.stageAttachmentFile 安全包装；同时 RPC 工厂增加通用 subscribe。因此运行时 desktop.main 是“300 个声明方法 + subscribe”共 301 个可调用属性，而不是原样暴露 301 个声明方法。
- desktopMount 另有 12 个声明方法，与 main edge 分离。
- coordinatorPort 是 Renderer 直连 Node Agent Coordinator 的单消费者 MessagePort 桥；sandRenderTrace 是单向、惰性创建的渲染 trace MessagePort。二者都不是 desktop.main RPC。
- “打包接口存在”只证明该版本具备潜在能力，不证明本次动态会话执行过它。Feature gate、平台、账号、团队策略、登录态、开发/正式构建及服务端开关都会进一步裁剪能力。

## 1. 总体调用关系

~~~mermaid
flowchart LR
    R[React Renderer]
    P[Context-isolated Preload]
    M[Electron Main]
    C[Node Agent Coordinator]
    API[中央 ConnectRPC]
    GW[Box-scoped Gateway\n物理部署位置未知]
    LE[Local Exec Daemon]
    MH[随包 CUGrokBotService\nMessages / Contacts\n已知 Swift]
    CU[外置 CUCursorService\nGUI Computer Use\n实现语言未知]

    R -->|desktop.main| P
    P -->|dune-rpc main IPC| M
    R -->|desktop.local| P
    R -->|coordinatorPort| P
    P -->|renderer-data MessagePort| C
    R -->|sandRenderTrace| P
    P -->|trace MessagePort| M
    M --> API
    M --> C
    C --> API
    C --> GW
    M --> LE
    M --> MH
    LE --> MH
    LE --> CU
~~~

RPC declaration 由 [Ce](formatted/electron-preload/preload.cjs#L518) 构造，Renderer 侧客户端由 [Fe](formatted/electron-preload/preload.cjs#L562) 生成，底层 transport 是 ipcRenderer.invoke/on 的安全包装，见 [fn](formatted/electron-preload/preload.cjs#L352)。Main 侧为每个调用验证可信顶层窗口并分派 handler，见 [Main edge server](formatted/electron-main/main-app.cjs#L109320)。

需要严格区分六类边界：

| 边界 | 实际含义 | 不应误解为 |
|---|---|---|
| 本地 IPC | Renderer → Preload → Electron Main；所有 desktop.main 方法先经过这一层 | 每个方法都是网络接口 |
| 中央 RPC | Main 或 Coordinator 携带认证信息调用 api2.cursor.sh 的 ConnectRPC/Protobuf 服务 | Renderer 直接持有中央 token |
| Box-scoped Gateway | Coordinator 调用与某个 Box 作用域绑定的 POST /api/*、GET /events 等接口；静态客户端证据不能确定 Gateway 的物理部署位置 | 与中央 ConnectRPC 是同一服务，或一定运行在 Box 内 |
| Local Exec Daemon | 用户电脑上的独立 utility process，承接用户设备工具 relay、权限、ownership 和结果分帧 | desktop.local，或普通 Box-scoped Gateway 方法 |
| Messages/Contacts helper | Main 定位随 App 打包的 CUGrokBotService，Local Exec 也将其 client 作为 `messages-op` 默认 executor；当前二进制证据表明它是 Swift | GUI Computer Use 的默认 sidecar |
| Local Exec GUI CUA service | Local Exec 默认寻找外置 Cursor Computer Use.app/Contents/MacOS/CUCursorService，通过 service.json 和 Unix socket newline JSON-RPC 调用；可用 CUA_* 环境变量覆盖 | 已证明与 CUGrokBotService 是同一进程、同一语言或同一发布物 |

## 2. main edge 的精确计数与暴露差异

声明起点见 [preload main schema](formatted/electron-preload/preload.cjs#L4272)。按顶层 method 声明机械提取的结果是：

- 有序条目数：301
- 唯一方法名：301
- 重复方法名：0
- 17 类计数：15 + 24 + 19 + 14 + 18 + 15 + 7 + 19 + 8 + 17 + 2 + 20 + 36 + 32 + 8 + 37 + 10 = 301
- 有序方法名清单的 SHA-256：11180089c9f3bfa678b0d308273ef5f1308bcbab64b3a2faccd4642da55d069e

但暴露阶段存在一个安全变换，见 [preload surface assembly](formatted/electron-preload/preload.cjs#L5014)：

1. Fe(os, Ss) 先生成 301 个声明方法和通用 subscribe。
2. stageAttachmentPath 被解构移出，不进入 desktop.main。
3. desktop.local.stageAttachmentFile 接收浏览器 File，通过 webUtils.getPathForFile 得到可信磁盘路径；拿不到路径时退化为读取 bytes。
4. 最终 desktop.main 为 300 个声明方法加 subscribe，共 301 个 callable property。

这样 Renderer 不能直接向 Main 传任意 sourcePath 字符串，却仍能对用户真实选择的 File 走零拷贝路径 staging。

## 3. 301 个 main RPC 声明：互斥分类总表

“主要后续平面”是基于 Main handler 和相关 manager 的静态归纳。混合表示同一业务域可能同时读本地状态、同步 Box、再访问中央服务；它不是动态执行证据。

| # | 业务域 | 数量 | 声明锚点 | 主要后续平面 | 请求/返回语义摘要 |
|---:|---|---:|---|---|---|
| 1 | 导航、Canvas、Document、Library、反馈 | 15 | [preload:4274](formatted/electron-preload/preload.cjs#L4274) | 本地 Shell + 中央 AgentStore/GrokBot | URL、locator、可见性、文档源码、资源名；返回分享、正文、权限、列表或操作结果 |
| 2 | 窗口、Presence、主题、语言和桌面偏好 | 24 | [preload:4293](formatted/electron-preload/preload.cjs#L4293) | 主要为 Main 本地；Presence 可继续进入 Coordinator | 无参状态读取、布尔偏好、窗口动作、当前 Agent/presence |
| 3 | 网络、更新、Box 状态、Onboarding、时区 | 19 | [preload:4321](formatted/electron-preload/preload.cjs#L4321) | Main 本地 + Box-scoped Gateway + 中央设置 | tunnel/proxy 开关、update track、迁移阶段、onboarding 标记、时区覆盖 |
| 4 | 自动审阅、本机工具策略、审批、头像 | 14 | [preload:4340](formatted/electron-preload/preload.cjs#L4340) | Main policy store + 中央/Box 同步 + Local Exec；头像生成走 AI 服务 | permission、approvalId、action、recipient、machineId、头像描述 |
| 5 | 附件与云电脑生命周期 | 18 | [preload:4375](formatted/electron-preload/preload.cjs#L4375) | 本地 staging + 对象存储/中央 + Coordinator/Box | path/bytes、预上传、提交、caption、重建/升级/重连 |
| 6 | 实验、Feature Flag、RPC trace、Transcript tail | 15 | [preload:4432](formatted/electron-preload/preload.cjs#L4432) | Main experiment/telemetry + 本地 transcript store | gate exposure、override command、trace window、agent tail limit |
| 7 | 公共模板市场与 Slack App 生命周期 | 7 | [preload:4466](formatted/electron-preload/preload.cjs#L4466) | 中央 GrokBot/connector | shareId、agentId、Slack team、安装/重装/卸载 |
| 8 | Agent、Team、Session、Profile、ACL、Meeting | 19 | [preload:4482](formatted/electron-preload/preload.cjs#L4482) | 中央 GrokBot | Agent 元数据、发布状态、成员/经理、meeting 可见性、带 state token 的 ACL 更新 |
| 9 | Agent Plugin、Skill、Memory | 8 | [preload:4533](formatted/electron-preload/preload.cjs#L4533) | 中央 GrokBot + MCP 配置 | plugin 清单/变量、skill 内容和文件、个人 memory、promote 到 team |
| 10 | Vault、Email、Secret、Agent File、Sidebar | 17 | [preload:4573](formatted/electron-preload/preload.cjs#L4573) | 中央 GrokBot/AgentStore + 本地 secret bridge + Box host settings | credential、邮箱、secret、文件 bytes、pin/sidebar sections |
| 11 | STT / TTS | 2 | [preload:4609](formatted/electron-preload/preload.cjs#L4609) | 中央 AI/Voice manager | audio + MIME/language；text + voiceId |
| 12 | Cursor 账号、机器和 Passkey enrollment | 20 | [preload:4611](formatted/electron-preload/preload.cjs#L4611) | Main account manager + 中央 Dashboard + OS WebAuthn | 登录 flight、多账号、头像、machine、六位码、credentialId |
| 13 | Team、Usage、Entitlement、Voice harness、Billing、SCM、Passkey ceremony | 36 | [preload:4631](formatted/electron-preload/preload.cjs#L4631) | 主要为中央 Dashboard/GrokBot；浏览器/OS 完成 OAuth 和 ceremony | teamId、邀请、usage、wallet、voice dial、SCM callback、spend limit |
| 14 | Telemetry、Cloud Agent 跳转、Link metadata、MCP App staging | 32 | [preload:4725](formatted/electron-preload/preload.cjs#L4725) | Main telemetry → Analytics/Sentry/Statsig；少量本地/附件服务 | 结构化 report、bcId、URL preview、HTML/CSP staging |
| 15 | 用户 Secret key 列表与客户端持久化 | 8 | [preload:4764](formatted/electron-preload/preload.cjs#L4764) | Main 本地安全存储/持久化 | key/value、include/exclude、prefix、本地存储迁移 |
| 16 | Credential broker、MCP 管理、Finance、开发 Box 控制 | 37 | [preload:4774](formatted/electron-preload/preload.cjs#L4774) | Main OAuth/MCP manager + 中央 Dashboard/GrokBot；attachProdBox 仅开发构建 | credential approval、OAuth、catalog/install、tool policy、账户/金融连接 |
| 17 | Messages、Chrome Cookie、Cookie grant、离会 | 10 | [preload:4837](formatted/electron-preload/preload.cjs#L4837) | Main 随包 CUGrokBotService + 本地 Chrome/Keychain + Box 注入/中央设置；meeting manager | OS 权限、recipient grant、cookie allow item/origin grant、meetingId |

## 4. 301 个方法完整枚举

### 4.1 导航、Canvas、Document、Library、反馈（15）

~~~text
openExternal, openCanvasLink, getCanvasShare, setCanvasVisibility,
setCanvasPageAddress, renameCanvas, getDocument, getDocumentEditRight,
saveDocument, resolveLibraryPages, listLibraryPages, listLibraryDocs,
setDocumentVisibility, getDocumentAssets, submitFeedback
~~~

### 4.2 窗口、Presence、主题、语言和桌面偏好（24）

~~~text
getWindowState, minimizeWindow, focusWindow, toggleMaximizeWindow,
closeWindow, resizeWindowWidth, setTitleBarOverlayTone, setViewingAgent,
setComposingAgent, setComputerViewOpen, setUnreadFilterMenuChecked,
getThemeState, setThemePreference, getBotColorInChatEnabled,
setBotColorInChatEnabled, getHardwareAcceleration,
setHardwareAccelerationEnabled, getSpellCheckEnabled, setSpellCheckEnabled,
getDesktopNotificationPreferences, setDesktopNotificationPreferences,
relaunchDesktop, getLanguageState, setLanguagePreference
~~~

### 4.3 网络、更新、Box 状态、Onboarding、时区（19）

~~~text
getEgressTunnelEnabled, setEgressTunnelEnabled, getEgressTunnelStatus,
claimEgressTunnel, getWebauthnProxyEnabled, setWebauthnProxyEnabled,
runNetworkDiagnostics, getUpdateStatus, checkForUpdates, setUpdateTrack,
quitAndInstallUpdate, setAutoUpdateWhenIdle, getBoxMigrationStatus,
getBoxHostPhase, markDeepLinksReady, getOnboardingSeen, setOnboardingSeen,
getTimeZone, setTimeZoneOverride
~~~

### 4.4 自动审阅、本机工具策略、审批、头像（14）

~~~text
getAutoReviewInstructions, setAutoReviewInstructions, getLocalToolPermission,
getMessagesAppIcon, getTeamMemberPolicy, setLocalToolPermission,
recordLocalToolApproval, clearLocalToolApprovals,
recordLocalToolStandingGrant, getLocalToolActionGrant,
setLocalToolActionGrant, pickAvatarSource, pickAvatarFile,
generateAgentAvatarImage
~~~

### 4.5 附件与云电脑生命周期（18）

~~~text
resolveAttachmentMedia, readAttachmentText, readAttachmentBytes,
stageAttachmentBytes, stageAttachmentPath, downloadAttachment,
commitStagedAttachments, discardStagedAttachment,
preuploadStagedAttachment, releaseStagedAttachmentPreupload,
precaptionStagedAttachment, forceRecreateComputer, updateComputer,
getComputerUpgradeSchedule, scheduleComputerUpgrade,
rescheduleComputerUpgrade, cancelComputerUpgrade, forceReconnectGateway
~~~

注意：stageAttachmentPath 属于 301 个 main edge 声明，但未原样暴露给 desktop.main；Renderer 应调用 desktop.local.stageAttachmentFile。

### 4.6 实验、Feature Flag、RPC trace、Transcript tail（15）

~~~text
getExperimentsSnapshot, exposeFeatureGate, peekUsageWarningAssignment,
exposeUsageWarningExperiment, logComposerTriggerExperimentExposure,
logGroupChatDiscouragementExperimentExposure,
logInviteTeammatesExperimentExposure,
logOnboardingJobRoleExperimentExposure,
logOnboardingRoleUseCaseBotsExperimentExposure,
logOnboardingNotificationsAskExperimentExposure, applyFeatureFlagOverride,
refreshFeatureFlags, applyExperimentOverride, startRpcTraceWindow,
readTranscriptStoreTail
~~~

### 4.7 公共模板市场与 Slack App 生命周期（7）

~~~text
getPublicBotTemplate, listPublicBotMarketplace,
getGrokBotSlackInstallState, startGrokBotSlackConnect,
installGrokBotSlackApp, reinstallGrokBotSlackApp,
uninstallGrokBotSlackApp
~~~

### 4.8 Agent、Team、Session、Profile、ACL、Meeting（19）

~~~text
listGrokBotTeamAgents, listGrokBotAgentSessions,
setGrokBotAgentVisibility, cloneGrokBotAgentToTeam, setGrokBotAgentVoice,
updateGrokBotAgent, publishGrokBotAgent, unpublishGrokBotAgent,
setGrokBotAgentSidebarHidden, addGrokBotRoomPeople,
removeGrokBotRoomPeople, listGrokBotAgentManagers,
addGrokBotAgentManager, removeGrokBotAgentManager,
setGrokBotAgentMeetingsVisibility, listGrokBotAgentMeetings,
getGrokBotAgentAccess, updateGrokBotAgentAccess,
getGrokBotAgentLinkAccess
~~~

### 4.9 Agent Plugin、Skill、Memory（8）

~~~text
getGrokBotAgentPlugins, setGrokBotAgentPlugins,
setGrokBotAgentPluginVariables, addGrokBotAgentSkill,
updateGrokBotAgentSkill, removeGrokBotAgentSkill,
listGrokBotUserBotMemories, promoteGrokBotMemoriesToTeam
~~~

### 4.10 Vault、Email、Secret、Agent File、Sidebar（17）

~~~text
listGrokBotVaultCredentials, putGrokBotVaultCredential,
deleteGrokBotVaultCredential, listGrokBotEmailInboxes,
createGrokBotEmailInbox, listGrokBotSecrets, putGrokBotSecret,
deleteGrokBotSecret, carryUserSecretsToGrokBot, listGrokBotAgentFiles,
uploadGrokBotAgentFile, deleteGrokBotAgentFile, getHostPinnedAgents,
getServerPinnedAgents, setHostPinnedAgents, getHostSidebarSections,
setHostSidebarSections
~~~

### 4.11 STT / TTS（2）

~~~text
transcribeAudio, synthesizeSpeech
~~~

### 4.12 Cursor 账号、机器和 Passkey enrollment（20）

~~~text
getCursorAuthStatus, loginCursor, getCursorLoginFlight,
cancelCursorLoginFlight, logoutCursor, listCursorAccounts,
addCursorAccount, switchCursorAccount, removeCursorAccount,
updateCursorAccountName, getCursorAvatar, updateCursorProfilePhoto,
getSandMachines, updateSandMachineLabel, removeSandMachine,
startPasskeyEnrollment, verifyPasskeyEnrollmentCode,
beginPasskeyRegistration, listPasskeys, revokePasskey
~~~

### 4.13 Team、Usage、Entitlement、Voice harness、Billing、SCM、Passkey ceremony（36）

~~~text
getCursorSelectedTeam, listCursorTeamMemberships, listCursorTeamMembers,
getCursorTeamInviteEligibility, sendCursorTeamInvites,
getCursorTeamInviteLink, listCursorTeamGroups, ackCursorTeamFallback,
getCursorWeeklyUsage, getCursorUsageSummary, getCursorEnterpriseUsage,
getCursorUsageBreakdown, getCursorPrReviewPreferences,
getCursorOriginPrStatus, getCursorPrivacyModeEnabled, getCursorUnifyCta,
getSandAccess, getSandAccessFresh, getGrokBotTermsRecord,
markGrokBotTermsSeen, clearGrokBotConnectorPreferences,
mintVoiceCallCredential, mintXaiCommerceBearer, getCursorPrepaidSettings,
setCursorPrepaidHardLimit, setCursorPrepaidAutoTopUp,
voiceCallHarnessSession, voiceCallHarnessTool, invokeCursorDashboardAction,
cancelCursorSandTrial, prepareCursorScmConnect, completeCursorScmConnect,
getCursorGithubRepoAccess, runPasskeyCeremony, cancelPasskeyCeremony,
setCursorSpendLimit
~~~

### 4.14 Telemetry、Cloud Agent 跳转、Link metadata、MCP App staging（32）

~~~text
reportAgentLoad, reportAccessBlocked, reportAgentsUnreachable,
reportRecoveryAction, reportRebuildLifecycle, reportReconciliation,
reportBoxVisibility, reportSendLatency, reportSendAck,
reportTurnClientStart, reportTurnClientOutcome, reportReactionAck,
reportRenderTtfr, reportRenderStream, reportVncSession,
reportVncLiveness, reportOpenComputer, reportUpdatePrompt,
reportUsageWarning, reportSidebarAction, reportMarketplaceSearch,
reportArtifactEngagement, reportCloudAgentArtifact, reportSigninGate,
reportOnboardingStep, reportOnboardingCompleted, reportClientFailure,
reportHeapMetrics, noteSentryConversation, openCloudAgent,
getLinkMetadata, stageMcpAppDocument
~~~

### 4.15 用户 Secret key 列表与客户端持久化（8）

~~~text
listSecrets, readClientPersistence, readManyClientPersistence,
writeClientPersistence, removeClientPersistence,
listClientPersistenceKeys, hasMigratedClientPersistence,
migrateClientPersistence
~~~

### 4.16 Credential broker、MCP 管理、Finance、开发 Box 控制（37）

~~~text
getCredentialsState, syncCredentialProvider, disconnectCredentialProvider,
disconnectScmConnection, isSlackLinked, getSlackLinkUrl,
approveCredentialRequest, denyCredentialRequest, detectCredentialMint,
startCredentialMint, connectCredentialProviderOAuth,
cancelCredentialProviderOAuth, getMcpState,
getGrokBotAgentMcpServers, getEffectivePlugins, getMcpCatalog,
refreshMcpCatalog, getMcpTeamPopularity, getSharepointSignIn,
getMcpPluginLogo, installEntry, updatePluginInstall, removeMcpServer,
uninstallPlugin, reconcileUnpublishedPlugin, authenticateMcpServer,
renameMcpAccount, removeMcpAccount, setMcpCustomInstructions,
listMcpServerTools, toggleMcpToolDisabled, setMcpToolPermissions,
adoptServerMcpToolPermissions, getFinanceOverview,
deleteFinanceConnection, startFinanceLink, attachProdBoxStatus
~~~

attachProdBoxStatus 的 Main handler 明确拒绝 packaged build；它存在于 bundle 仍不代表正式用户可调用。

### 4.17 Messages、Chrome Cookie、Cookie grant、离会（10）

~~~text
checkMessagesPermissions, getCurrentMachineMessagesEnabled,
updateCurrentMachineMessagesEnabled, listMessagesAllowedRecipients,
revokeMessagesAllowedRecipient, listChromeCookieAllowItems,
importChromeCookies, listCookieOriginGrants, putCookieOriginGrants,
leaveMeeting
~~~

## 5. desktop.boot

desktop.boot 来自同步 IPC sand:boot-snapshot-sync。Main 返回的原始快照见 [main-core boot snapshot](formatted/electron-main/main-core.cjs#L21425)，字段包括：

| 字段 | 含义 |
|---|---|
| experiments | Renderer 首屏所需的实验/feature flag snapshot |
| theme | 当前主题状态 |
| language | 当前语言状态 |
| isAssistiveTechEnabled | OS 辅助功能状态 |
| isEgressTunnelEnabled | egress tunnel 开关 |
| isWebauthnProxyEnabled | WebAuthn proxy 开关 |
| isBotColorInChatEnabled | 聊天 Agent 颜色开关 |
| egressTunnelStatus | tunnel 当前状态 |
| rosterPhotos | roster photo 的启动访问/引用信息 |
| mainEdge | 仅供 Preload 判断 Main edge 是否已经 served |

Preload 通过解构移除 mainEdge，再把其余字段作为 desktop.boot 暴露。因此 desktop.boot 是一次性、只读的首屏启动快照，不是实时 store；后续变化应由 RPC、domain resource 或事件流获得。

如果 mainEdge 尚未 served，Preload 会等待 sand:main-edge-served，再放行 desktop.main 调用。这个 gate 避免 Renderer 在 Main handler 尚未装配完成时收到“未知方法”或半初始化状态。

## 6. desktop.environment

[environment 暴露](formatted/electron-preload/preload.cjs#L5043) 是无副作用的进程/构建信息：

| 字段 | 静态语义 |
|---|---|
| platform | process.platform |
| isDev | 该字段在此 bundle 中直接由 SAND_RESTART_EXIT_CODE 是否存在计算；仅凭命名不应扩展推断更多开发模式语义 |
| usesProductionBackend | backend URL 未覆盖，或覆盖后的 host 为 api2.cursor.sh |
| devVoiceHarness | backend 或 package |
| hasChromeCookieImport | darwin/linux 为真；实际使用还受 feature gate 和权限约束 |

## 7. desktop.local

[local methods](formatted/electron-preload/preload.cjs#L5054) 共 5 个：

| 方法 | 实现和意义 |
|---|---|
| getZoomFactor | 直接读取 Electron webFrame zoom factor；不进入 Main RPC |
| stageAttachmentFile | 安全包装 File staging：可信真实路径走隐藏的 stageAttachmentPath，否则转 Uint8Array 走 stageAttachmentBytes |
| noteRendererAlive | fire-and-forget 发送 sand:renderer-alive，用于 Renderer 存活/启动诊断 |
| noteBootGateLanded | fire-and-forget 标记启动 gate 已落地 |
| noteBootGateOpened | fire-and-forget 标记 gate 打开，并携带相关 timing/state payload |

desktop.local 只是“Preload 直接提供的少量本地辅助面”，不能与 Local Exec Daemon 混为一谈。Local Exec 是独立 utility process，持有短期 machine credential，承接 shell/file 等用户设备工具 relay；其 GUI Computer Use 客户端默认定位外置 CUCursorService，而 Main 的 Messages/Contacts 调用面默认定位随包 CUGrokBotService，不能把两者合并成一个 native helper。

## 8. coordinatorPort

Preload bridge 见 [single-consumer bridge](formatted/electron-preload/preload.cjs#L4935)，暴露形态为：

~~~text
coordinatorPort.claim(owner) -> null | {
  request(): void,
  release(): void
}
~~~

关键语义：

1. 同一时刻仅允许一个 owner claim；已有 owner 时返回 null。
2. request 通过 sand:coordinator-port-request 请求端口。
3. Main 将 Node Agent Coordinator 的 rendererDataPort 作为 transferable MessagePort 投递到 sand:coordinator-port。
4. release 只解除当前 owner；旧 owner 之后不能再 request。
5. 收到端口后，Preload 只暴露 postMessage、close、start 和受限的 message/close listener，不暴露原始 ipcRenderer。

Main 通过 utilityProcess.fork 启动 Coordinator，并创建 control、renderer-data、main-data 三条 MessagePort，见 [Coordinator launch](formatted/electron-main/main-app.cjs#L100085)。端口请求、重启后的替换和可信 sender 检查见 [renderer port broker](formatted/electron-main/main-app.cjs#L100273)。

这条通道承担 Agent runtime/domain data，不应被描述成中央 RPC 或 Box-scoped Gateway 本身。更准确的链路是：

~~~text
Renderer domain client
  -> coordinatorPort / renderer-data MessagePort
  -> Node Agent Coordinator
  -> 中央 ConnectRPC 或 Box-scoped Gateway
~~~

## 9. sandRenderTrace

[sandRenderTrace implementation](formatted/electron-preload/preload.cjs#L4996) 只暴露 postMessage：

- 第一次 postMessage 时惰性创建 MessageChannel。
- port2 通过 sand:render-trace-port transfer 给 Main。
- 后续 payload 都走保留的 port1，不为每条 trace 创建 IPC invoke。
- 没有业务返回值、重试或 request/response envelope，是单向 telemetry pipe。
- Main 只接受主窗口 mainFrame 投递的端口，其他 frame 的端口直接关闭，见 [render trace receiver](formatted/electron-main/main-core.cjs#L31644)。

因此 startRpcTraceWindow 是“控制是否开启/采样 RPC trace”的 main RPC，而 sandRenderTrace 是高频 trace 数据的独立传输面，两者职责不同。

## 10. desktopMount 的 12 个方法

声明见 [desktop-mount schema](formatted/electron-preload/preload.cjs#L868)，Main 实现与 sender role 校验见 [desktop-mount runtime](formatted/electron-main/main-app.cjs#L101127)。

| 调用方角色 | 方法 | 作用 |
|---|---|---|
| 主窗口 | mount | 挂载一个 Agent 的桌面浮层标记，参数含 agentId、name、markSvgDataUrl |
| 主窗口 | unmount | 关闭当前挂载 |
| 主窗口 | offerChoices | 向浮层提供最多 64 个可切换 Agent |
| 浮层 Panel | read | 读取当前 mount 状态 |
| 浮层 Panel | readChoices | 读取可选 Agent |
| 浮层 Panel | readLayout | 读取 composerSide 等布局状态 |
| 浮层 Panel | submitPrompt | 发出 prompt-submitted 事件并聚焦主窗口；本身不直接请求服务端 |
| 浮层 Panel | switchTo | 切换到 offerChoices 中的 Agent |
| 浮层 Panel | unmountSelf | 浮层主动卸载 |
| 浮层 Panel | reachForMenu | 临时扩展/恢复浮层高度以展示菜单 |
| 浮层 Panel | movePanel | 按 dx/dy 移动，跨屏时重新计算左右布局 |
| 浮层 Panel | endPanelMove | 结束拖动并持久化位置 |

有序方法名：

~~~text
mount, unmount, offerChoices, read, readChoices, readLayout,
submitPrompt, switchTo, unmountSelf, reachForMenu, movePanel,
endPanelMove
~~~

这里的 12 指 schema 中声明的业务方法；RPC 工厂生成的通用 subscribe 不计入这 12 个方法。

这是纯本地 Electron 浮层子系统：独立 sandboxed BrowserWindow、always-on-top、sender 分为 mainWindow 和 panel 两种 trust role。它可产生 prompt-submitted 事件交回主窗口，但不等同于 Agent sendPrompt 网络接口。

## 11. 从声明方法推测后端实现时的证据边界

Main handler 总装配入口见 [p8e](formatted/electron-main/main-app.cjs#L108085)。由此可以可靠判断“Renderer 请求先落到哪个 Main manager”；但仅凭 preload 名字不能把每个方法强行映射成一个服务端 endpoint：

- 纯本地：窗口、主题、语言、客户端持久化、启动 timing 等可能完全不出机。
- 本地后再同步：local-tool permission、host sidebar、Messages enabled 等会先写本地，再尝试同步 Box 或中央状态。
- 中央 RPC：账号、团队、计费、Agent ACL、MCP catalog、Vault、Email 等主要由 Main manager 调用 Dashboard/GrokBot/Ai/AgentStore ConnectRPC。
- Box-scoped Gateway：Host settings、Box 状态、部分附件/电脑操作通常经 Coordinator 或 Main 的 Box access/recovery manager；其作用域属于某个 Box，但物理部署位置未知。
- CUGrokBotService：随 App 打包，Main 以 Messages/Contacts verbs 调用，Local Exec 也将其 client 作为 `messages-op` 默认 executor；见 [Main sidecar selection](formatted/electron-main/main-app.cjs#L79554)、[verb map](formatted/electron-main/main-app.cjs#L79739) 和 [Local Exec default](formatted/local-exec-daemon/main.cjs#L128112)。
- Local Exec CUCursorService：GUI CUA 默认寻找用户目录下的外置 Cursor Computer Use.app，通过 service.json 提供的 Unix socket 做 newline JSON-RPC；见 [service discovery](formatted/local-exec-daemon/main.cjs#L120627) 和 [override variables](formatted/local-exec-daemon/main.cjs#L120801)。当前 App/分析产物未包含该外置 artifact，因此实现语言未知。
- Chrome cookie：由 Main 的 Chrome/Keychain 读取、选择与 Box 注入路径处理，不应归入上述任一 CUA helper。
- 混合事务：一个 desktop.main 方法可能组合本地校验、中央更新、Box mirror、telemetry，不能用一个 URL 代表完整语义。

此外，preload 的 t().args 主要表达请求参数约束；返回值类型和失败语义需要继续查看 Main manager、ConnectRPC proto、Gateway schema 及 native protocol。RPC 失败统一包装成 code/detail envelope，也不能仅从方法名推断全部错误码。

## 12. “存在”与“执行过”的最终判定

本文件的 301 + 12 清单是静态攻击面/能力面，不是动态调用日志。要声称某能力在一次会话中实际执行，至少应补充一种动态证据：

- Electron IPC method 命中；
- 中央 ConnectRPC 路由及状态码；
- Box-scoped Gateway method/SSE channel；
- Coordinator MessagePort frame；
- Local Exec request/response frame；
- Main 或 Local Exec 调用 CUGrokBotService 的 Messages/Contacts verb；
- Local Exec CUCursorService 的 Unix socket request/response；
- 对应的可审计状态变化。

没有这些证据时，应写“客户端打包并声明了该能力”或“Main handler 静态存在”，不应写“本次运行调用了该接口”。
