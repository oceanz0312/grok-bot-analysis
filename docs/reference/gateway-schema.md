# testAgent Gateway Schema 摘要

静态 schema 标识为 `sand-gateway` v1，生成源 `sand/src/shared/rpc/gateway.ts`，包含 167 个公开方法、27 个 SSE channel、40 个 host-only 方法和 367 个定义。

证据：[Gateway 压缩 JSON Schema](../../evidence/artifacts/formatted/node-agent-coordinator/main.cjs#L40738)、[Gateway 到中央 RPC 适配器](../../evidence/artifacts/formatted/electron-main/main-app.cjs#L110600)。公开方法走 `POST /api/{method}`，事件走 `GET /events`；动态观察到的 Gateway 方法会标记 capture 行号。本文将它称为 Box-scoped Gateway，表示协议和 credential 与 Box 关联；客户端证据不能确定服务进程是否物理运行在 Box 内。

## 关键调用链

```text
React SandClient
  → preload 白名单 / MessagePort
  → Electron Main / Agent Coordinator
      ├─ 中央 GrokBot/Dashboard ConnectRPC
      └─ Box-scoped Gateway POST /api/{method} + GET /events SSE
```

部分 Gateway 方法在静态适配器中映射到中央 RPC。静态 capability/枚举还表明请求可能被路由到 Box/Temporal-labelled Harness 或 Local Exec Relay，但具体路由、运行位置和启用状态未被本次动态证据完整观察。

- `sendPrompt → SendGrokBotUserMessage`；`promptAcceptanceStatus → GetGrokBotSendStatus`；`interruptAgentRun → InterruptGrokBotAgentRun`。
- `startFreshConversation`、`rollBackConversation`、`respondToWidget`、`submitSecret`、`submitUserForm`、`sendDraft`、各类审批均有中央 GrokBot RPC 适配。
- 本次动态窗口直接观察到中央 `SendGrokBotUserMessage` 请求/200 响应，但无法从脱敏 shape 判断正文、触发者或是否由 Gateway `sendPrompt` 触发。

## 167 个公开方法

### MCP、插件、Workflow 与 Skill（35）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `authenticateMcpServer` | SandMcpAuthenticateRequest(accountKey, forceReauth, oauthRedirectUri, requestingAgentId, serverId, trigger) | SandMcpAuthResult(empty) | 服务端执行 Authenticate Mcp Server 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `callMcpAppTool` | {agentId, argumentsJson, serverIdentifier, toolName, userActivated} | SandMcpAppToolCallResult(empty) | 服务端执行 Call Mcp App Tool 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `completeMcpOAuth` | {code, state} | null | 服务端完成 Mcp O Auth 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `createAgentWorkflow` | {id, spec} | array<SandSkill> | 服务端创建 Agent Workflow 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `deleteAgentWorkflow` | {id, workflowId} | array<SandSkill> | 服务端删除 Agent Workflow 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentWorkflows` | {id} | array<SandSkill> | 服务端读取 Agent Workflows 对应资源或流程；具体内部实现仅能由契约推断。 | [观察 L1360](../../evidence/artifacts/runtime-api-shapes.jsonl#L1360) |
| `getEffectiveMcpPlugins` | {} | array<SandEffectivePlugin> | 服务端读取 Effective Mcp Plugins 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getMcpCatalog` | {} | array<SandMcpCatalogEntryView> | 服务端读取 Mcp Catalog 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getMcpPluginLogo` | {url} | {dataUrl} \| null | 服务端读取 Mcp Plugin Logo 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getMcpState` | {} | SandMcpState(servers) | 服务端读取 Mcp State 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getPluginSyncStatus` | {} | SandPluginSyncStatus(authBlocked) | 服务端读取 Plugin Sync Status 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getSkillPublishTargets` | {} | SandSkillPublishTargets(teams, unavailableReason, unavailableReasonKind) | 服务端读取 Skill Publish Targets 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `hasRestorablePluginListingCopy` | {pluginId} | boolean | 服务端执行 Has Restorable Plugin Listing Copy 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `importAgentWorkflowText` | {id, markdown, name} | SandSkillImportEvent(result, workflows) | 服务端执行 Import Agent Workflow Text 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `importAgentWorkflowUrl` | {id, name, url} | SandSkillImportEvent(result, workflows) | 服务端执行 Import Agent Workflow Url 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `installMcpEntry` | SandInstallEntryRequest(entryId, hasTeamConfiguredVariables, values) | SandMcpState(servers) | 服务端执行 Install Mcp Entry 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `listBoxMcpServers` | {serverIdentifiers} | {servers} | 服务端列举 Box Mcp Servers 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `listMcpServerTools` | {serverId} | array<SandMcpServerTool> | 服务端列举 Mcp Server Tools 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `publishSkill` | {teamId, workflowId} | SandSkillPublishResult(commitSha, pluginId, promotedWorkflowId) | 服务端发布 Skill 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `readMcpAppResource` | SandMcpAppResourceReadArgs(agentId, documentSha256, entryId, resourceUri, serverIdentifier, sessionId) | SandMcpAppDocumentResult(empty) | 服务端读取 Mcp App Resource 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `refreshMcp` | {completion} | null | 服务端执行 Refresh Mcp 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `removeMcpAccount` | SandMcpAccountRef(accountKey, serverId) | SandMcpState(servers) | 服务端移除 Mcp Account 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `removeMcpServer` | {serverId} | SandMcpRemoveResult(reason, removed, state) | 服务端移除 Mcp Server 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `renameMcpAccount` | SandMcpRenameAccountRequest(accountKey, newAccountKey, serverId) | SandMcpState(servers) | 服务端执行 Rename Mcp Account 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `resyncPublishedSkill` | {workflowId} | SandSkillPublishResult(commitSha, pluginId, promotedWorkflowId) | 服务端执行 Resync Published Skill 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `runAgentWorkflowNow` | {id, workflowId} | null | 服务端执行 Agent Workflow Now 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setMcpCustomInstructions` | SandSetMcpInstructionsRequest(instructions, serverId) | SandMcpState(servers) | 服务端设置 Mcp Custom Instructions 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `skillsCatalog` | {} | array<SandSkillCatalogEntry> | 服务端执行 Skills Catalog 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `syncPluginSkills` | {} | array<SandPluginSkillInfo> | 服务端同步 Plugin Skills 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `toggleMcpToolDisabled` | SandToggleMcpToolDisabledRequest(serverId, toolName) | array<SandMcpServerTool> | 服务端执行 Toggle Mcp Tool Disabled 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `uninstallMcpPlugin` | {pluginId} | SandMcpRemoveResult(reason, removed, state) | 服务端卸载 Mcp Plugin 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `unpublishPluginListing` | {pluginId, teamId} | SandSkillUnpublishResult(restoredWorkflowId) | 服务端取消发布 Plugin Listing 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `unpublishSkill` | {workflowId} | SandSkillUnpublishResult(restoredWorkflowId) | 服务端取消发布 Skill 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `updateAgentWorkflow` | {id, spec, workflowId} | array<SandSkill> | 服务端更新 Agent Workflow 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `updateMcpPluginInstall` | SandUpdatePluginInstallRequest(pluginId, values) | SandMcpState(servers) | 服务端更新 Mcp Plugin Install 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

### Secret、凭证、Cookie、WebAuthn 与审批（17）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `awaitCookieOriginApproval` | {requestId, waitMs} | SandCookieOriginApprovalGatewayReply(empty) | 服务端执行 Await Cookie Origin Approval 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `awaitMessagesGrants` | {requestId, waitMs} | SandMessagesGrantsGatewayReply(empty) | 服务端执行 Await Messages Grants 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `cancelCookieOriginApproval` | {requestId} | null | 服务端取消 Cookie Origin Approval 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `cancelMessagesGrants` | {requestId} | null | 服务端取消 Messages Grants 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `carryBoxSecretsToBot` | {names, serverId} | array<GrokBotSecretCarryOverResult> | 服务端执行 Carry Box Secrets To Bot 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAutomationWebhookCredential` | {automationId, id} | SandAutomationWebhookCredential(key, url) | 服务端读取 Automation Webhook Credential 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getBoxSecretsStatus` | {} | SandBoxSecretsStatus(cardKeys, isApplied, keys, lastAppliedAtMs) | 服务端读取 Box Secrets Status 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `injectChromeCookies` | {cookies} | {chromeDebugPorts, injected, monitorsReached, sites} | 服务端执行 Inject Chrome Cookies 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `requestCookieOriginApproval` | {agentId, origins, requestId} | SandCookieOriginApprovalGatewayReply(empty) | 服务端执行 Request Cookie Origin Approval 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `requestMessagesGrants` | {grants, requestId} | SandMessagesGrantsGatewayReply(empty) | 服务端执行 Request Messages Grants 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `requestWebAuthnCeremony` | SandWebAuthnCeremonyRequest(kind, optionsJson, origin) | SandWebAuthnCeremonyResult(empty) | 服务端执行 Request Web Authn Ceremony 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `resolveConnectorGrant` | {agentId, entryId, requestId, resolution, sessionId} | null | 服务端处理 Connector Grant 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `resolveMessagesGrants` | {requestId} | null | 服务端处理 Messages Grants 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `resolveVirtualCardApproval` | {agentId, attestation, entryId, failureReason, paymentMethodId, requestId, resolution, spendRequestId} | null | 服务端处理 Virtual Card Approval 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setBoxSecrets` | {secrets} | SandBoxSecretsStatus(cardKeys, isApplied, keys, lastAppliedAtMs) | 服务端设置 Box Secrets 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `storeSecret` | {agentId, target, value} | boolean | 服务端执行 Store Secret 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `submitSecret` | {agentId, entryId, sessionId, value} | null | 服务端提交 Secret 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

### UI 状态与其他（12）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `clearGeneratedRoomNameStamps` | {rooms} | GeneratedRoomNameStampCleanupOutcome(clearedIds, outcome) | 服务端清理 Generated Room Name Stamps 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `clearTrays` | {} | null | 服务端清理 Trays 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `dismissTray` | {id} | null | 服务端执行 Dismiss Tray 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getTeachRecordingStatus` | {} | SandTeachRecordingStatus(agentId, maxDurationMs, startedAtMs, state) | 服务端读取 Teach Recording Status 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getTrays` | {} | array<SandErrorTray> | 服务端读取 Trays 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `isGlobalSearchEnabled` | {} | boolean | 服务端执行 Is Global Search Enabled 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `promptAcceptanceStatus` | GatewayAcceptanceStatusArgs(accountSlot, agentId, clientNonce, sessionId) | PromptAcceptanceLookup(empty) | 查询某次发送是否被接纳；适配到 GetGrokBotSendStatus。 | 本次未观察；静态 schema |
| `resolveLocalToolPermission` | {agentId, entryId, requestId, resolution, sessionId} | null | 服务端处理 Local Tool Permission 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setWindowFocused` | {isFocused, surface} | null | 上报桌面窗口焦点，供 presence/通知策略使用。 | [观察 L1474](../../evidence/artifacts/runtime-api-shapes.jsonl#L1474) |
| `startTeachRecording` | {agentId, entryPoint} | SandTeachRecordingStatus(agentId, maxDurationMs, startedAtMs, state) | 服务端启动 Teach Recording 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `stopTeachRecording` | {agentId, save} | SandTeachRecordingStatus(agentId, maxDurationMs, startedAtMs, state) | 服务端执行 Stop Teach Recording 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `transcribeAudio` | SandTranscribeAudioArgs(audioBase64, language, mimeType) | SandVoiceTranscription(text, transcriptionTimeMs) | 服务端执行 Transcribe Audio 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

### Channel、Listener 与外部集成（8）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `completeGithubConnect` | {code, error, installationId, setupAction, state} | SandGithubConnectCompletion(outcome) | 服务端完成 Github Connect 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `connectChannel` | {id, platform, token} | SandChannelsView(connections, manifests) | 服务端执行 Connect Channel 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `disconnectChannel` | {id, platform} | SandChannelsView(connections, manifests) | 服务端执行 Disconnect Channel 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `disconnectListenerPlatform` | {platform} | null | 服务端执行 Disconnect Listener Platform 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentChannels` | {id} | SandChannelsView(connections, manifests) | 服务端读取 Agent Channels 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getListenerConnectUrl` | {forceOauth, oauthRedirectUri, platform} | {url} | 服务端读取 Listener Connect Url 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getListenerIntegrations` | {} | SandListenerIntegrationsView(integrations) | 服务端读取 Listener Integrations 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `refreshChannel` | {id, platform} | SandChannelsView(connections, manifests) | 服务端执行 Refresh Channel 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

### 模板、Cloud Agent 与发布（17）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `confirmCloudAgentPublishProposal` | {agentId, bcId, proposalId, requireConfirmationForUpdates, slug, visibility} | SandCloudAgentPublishDecision(empty) | 服务端执行 Confirm Cloud Agent Publish Proposal 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `deleteBotTemplate` | SandBotTemplateDeleteArgs(shareId) | null | 服务端删除 Bot Template 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `dismissCloudAgentPublishProposal` | {agentId, bcId, proposalId} | SandCloudAgentPublishDecision(empty) | 服务端执行 Dismiss Cloud Agent Publish Proposal 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `ensureCloudAgentArtifacts` | {agentId, bcId} | array<SandCloudAgentArtifactSync> | 服务端确保存在或可用 Cloud Agent Artifacts 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `generateAgentAvatarImage` | {description} | SandGeneratedAvatarImage(imageBase64, mimeType) | 服务端执行 Generate Agent Avatar Image 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getBotTemplateExportPolicy` | {} | SandBotTemplateExportPolicyReply(exportPolicy) | 服务端读取 Bot Template Export Policy 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getBotTemplateForSourceAgent` | SandBotTemplateForSourceAgentArgs(sourceAgentId) | RegressionEraBotTemplateWireView \| SandBotTemplateWireView \| null | 服务端读取 Bot Template For Source Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getBotTemplateVersion` | SandBotTemplateVersionArgs(shareId, version) | SandBotTemplateGatewayView(empty) | 服务端读取 Bot Template Version 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getCloudAgentConversation` | {bcId} | SandCloudAgentReadFailure \| {kind} \| {kind, messages} \| null | 服务端读取 Cloud Agent Conversation 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getCloudAgentInfo` | {bcId, includeArtifacts, includeFiles} | SandCloudAgentInfo \| null | 服务端读取 Cloud Agent Info 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getCloudAgentPublishProposals` | {bcId} | SandCloudAgentPublishProposalsRead(empty) | 服务端读取 Cloud Agent Publish Proposals 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `listBotTemplates` | {} | array<SandBotTemplateGatewayView> | 服务端列举 Bot Templates 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `listCloudAgentPublishedApps` | {} | SandCloudAgentPublishedAppsRead(empty) | 服务端列举 Cloud Agent Published Apps 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `publishBotTemplate` | SandBotTemplatePublishArgs(shareId, version) | SandBotTemplateGatewayView(empty) | 服务端发布 Bot Template 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setBotTemplateVisibility` | SandBotTemplateVisibilityArgs(shareId, visibility) | SandBotTemplateView(active, activeVersion, avatarColor, avatarShape, createdAtMs, creatorName, description, memory, name, …+11) | 服务端设置 Bot Template Visibility 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `stopCloudAgent` | {bcId} | null | 服务端执行 Stop Cloud Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `updateCloudAgentPublishApp` | {apex, bcId, muteRedeployPrompts, requireConfirmationForUpdates, slug, visibility} | SandCloudAgentPublishAppUpdate(empty) | 服务端更新 Cloud Agent Publish App 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

### Agent、Group 与配置（20）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `countAgents` | {} | number | 服务端执行 Count Agents 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `createAgent` | SandCreateAgentArgs(avatarColor, avatarPngBase64, avatarShape, clientNonce, creationRoute, description, harness, isAutomatic, isIntroductionSuppressed, …+8) | SandCreateAgentResult(agent, transcript) | 服务端创建 Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `createAgentFromTemplate` | SandCreateAgentFromTemplateArgs(agentId, avatarColor, avatarShape, creatorContext, expectedActiveVersion, importEntry, isAutomatic, language, name, …+1) | SandCreateAgentFromTemplateResult(agent, setup, transcript) | 服务端创建 Agent From Template 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `createGroup` | {clientNonce, creationRoute, description, humanMemberUserIds, memberAgentIds, name, namedBy} | SandCreateAgentResult(agent, transcript) | 服务端创建 Group 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `deleteAgents` | {ids} | SandDeleteAgentResult(failedAgentIds, refusedAgentIds, transcript) | 服务端删除 Agents 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `duplicateAgent` | {id} | SandCreateAgentResult(agent, transcript) | 服务端执行 Duplicate Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentAvatar` | {id} | SandAgentAvatarResult(dataUrl, version) | 服务端读取 Agent Avatar 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentNotificationAvatar` | {id} | SandAgentNotificationAvatar(avatarByteCount, avatarContentType, avatarVersion, color, name, shape) | 服务端读取 Agent Notification Avatar 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `listAgents` | {} | array<SandAgentSummary> | 服务端列举 Agents 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `openAgent` | {id} | array<SandTranscriptEntry> | 服务端打开 Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `openAgentTail` | {id, limit, sessionId, unreadBoundaryAt} | SandTranscriptPage(cloudAgentPeerIds, entries, nextBeforeSeq, precedingTimestampMs, unreadAnchor) | 服务端打开 Agent Tail 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `openAgentWindowed` | {id, limit} | SandTranscriptWindow(entries, nextBeforeSeq, threadCounts) | 服务端打开 Agent Windowed 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `readMainAgentContext` | {id} | SandMainAgentContext(agentId, isWorking) | 服务端读取 Main Agent Context 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `searchAgents` | {limit, query} | array<SandMessageMatch> | 服务端搜索 Agents 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setAgentAvatarBytes` | {id, pngBase64} | SandAgentSummary \| null | 服务端设置 Agent Avatar Bytes 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setAgentHiddenFromSidebar` | {id, isHidden} | null | 服务端设置 Agent Hidden From Sidebar 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setAgentNotifyOnUpdates` | {id, isEnabled} | null | 服务端设置 Agent Notify On Updates 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setAgentUnread` | {atMs, id, isUnread} | null | 服务端设置 Agent Unread 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setGroupMembers` | {id, memberAgentIds, requesterAgentId} | SandAgentSummary \| null | 服务端设置 Group Members 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `updateAgent` | {id, profile} | SandAgentSummary \| null | 服务端更新 Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

### 自动化、Task、Todo 与 Subagent（13）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `createAgentAutomation` | {id, spec} | array<SandAutomation> | 服务端创建 Agent Automation 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `deleteAgentAutomation` | {automationId, id} | array<SandAutomation> | 服务端删除 Agent Automation 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentAutomations` | {id} | array<SandAutomation> | 服务端读取 Agent Automations 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentTasks` | {agentId} | array<SandAgentTask> | 服务端读取 Agent Tasks 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentTodos` | {id} | array<SandAgentTodo> | 服务端读取 Agent Todos 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAsyncTasks` | {id} | array<SandAsyncTaskInfo> | 服务端读取 Async Tasks 对应资源或流程；具体内部实现仅能由契约推断。 | [观察 L1362](../../evidence/artifacts/runtime-api-shapes.jsonl#L1362) |
| `getSubagents` | {id} | array<SandSubagentInfo> | 服务端读取 Subagents 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `listAllAutomations` | {} | array<SandScheduledAutomation> | 服务端列举 All Automations 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `markAgentTaskDone` | {agentId, taskId} | array<SandAgentTask> | 服务端标记 Agent Task Done 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `markAgentTaskRead` | {agentId, entryId, taskId} | array<SandAgentTask> | 服务端标记 Agent Task Read 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `runAgentAutomationNow` | {automationId, id, sessionId} | null | 服务端执行 Agent Automation Now 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setAgentAutomationEnabled` | {automationId, id, isEnabled} | array<SandAutomation> | 服务端设置 Agent Automation Enabled 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `updateAgentAutomation` | {automationId, id, spec} | array<SandAutomation> | 服务端更新 Agent Automation 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

### 对话发送、运行控制与交互（16）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `discardDraft` | {agentId, entryId, sessionId} | SandWidgetAnswerResult(accepted) | 服务端执行 Discard Draft 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `dismissUserForm` | {agentId, entryId, mode, platform} | null | 服务端执行 Dismiss User Form 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `dismissWidget` | {agentId, entryId} | SandWidgetAnswerResult(accepted) | 服务端执行 Dismiss Widget 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `interruptAgentRun` | {id, sessionId} | SandInterruptAgentRunResult(hadActiveRun) | 服务端执行 Interrupt Agent Run 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `kickstartAgent` | {id} | SandKickstartAgentResult \| null | 服务端执行 Kickstart Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `reactToMessage` | {agentId, emoji, entryId} | null | 服务端执行 React To Message 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `resolveAutoReviewApproval` | {agentId, approvalPlatform, approvedCommand, entryId, meetingJoin, requestId, resolution, sessionId} | null | 服务端处理 Auto Review Approval 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `respondToWidget` | {agentId, entryId, value} | SandWidgetAnswerResult \| null | 服务端执行 Respond To Widget 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `rollBackConversation` | {id, sessionId} | null | 服务端执行 Roll Back Conversation 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `seedConversationName` | {id, prompt} | SandConversationNameSeedOutcome(agent, outcome) | 服务端执行 Seed Conversation Name 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `sendDraft` | {agentId, draft, entryId, sessionId, shownSignatureHtml} | SandWidgetAnswerResult(accepted) | 服务端发送 Draft 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `sendPrompt` | SandSendPromptArgs(agentId, attachmentNames, attachmentPaths, automationWriteProvenance, clientNonce, composedAtMs, directAddressedAcceptance, enterEpochMs, initiator, …+12) | SandSendPromptResult \| null | 接收 UI prompt，附带附件、MCP、machine/session 与幂等 nonce；Gateway 适配到中央 SendGrokBotUserMessage。 | 本次未观察；静态 schema |
| `setAgentDraftingDisabled` | {id, isDisabled} | null | 服务端设置 Agent Drafting Disabled 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `startFreshConversation` | {id, sessionId} | null | 服务端启动 Fresh Conversation 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `submitUserForm` | {agentId, entryId, platform, saveToVault, values} | null | 服务端提交 User Form 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `voteFeedback` | {action, agentId, categories, comment, entryId} | null | 服务端执行 Vote Feedback 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

### Box、Host、VNC 与运维（10）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `ensureForeverBox` | {id} | SandForeverBoxStatus \| null | 服务端确保存在或可用 Forever Box 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getForeverBoxStatus` | {id} | SandForeverBoxStatus \| null | 读取持久 Box、VNC、窗口、handoff、升级和磁盘压力状态。 | [观察 L1365](../../evidence/artifacts/runtime-api-shapes.jsonl#L1365) |
| `getHostSettings` | {} | SandHostSettings(autoReviewInstructions, computerUseModel, experimentOverrides, featureFlagOverrides, hasSeenOnboarding, hasSeenOnboardingAccountScope, localToolPermission, localToolPermissionByMachineId, mcpBoxServers, …+16) | 服务端读取 Host Settings 对应资源或流程；具体内部实现仅能由契约推断。 | [观察 L1363](../../evidence/artifacts/runtime-api-shapes.jsonl#L1363) |
| `getHostStatus` | SandHostStatusArgs(includeManagedCapabilities) | SandHostStatus(capabilities, hostUpdateAvailable, hostVersion, isBusy, latestHostVersion) | 服务端读取 Host Status 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `handBackForeverBox` | {id, requestId, trigger} | null | 服务端执行 Hand Back Forever Box 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `isEgressTunnelAvailable` | {} | boolean | 服务端执行 Is Egress Tunnel Available 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `requestDiskSaverAudit` | {id} | SandDiskSaverAuditResult \| null | 服务端执行 Request Disk Saver Audit 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setHostSettings` | SandHostSettingsUpdate(autoReviewInstructions, computerUseModel, experimentOverrides, featureFlagOverrides, hasSeenOnboarding, localToolPermission, localToolPermissionByMachineId, localToolPermissionMachineId, mcpBoxServers, …+14) | SandHostSettings(autoReviewInstructions, computerUseModel, experimentOverrides, featureFlagOverrides, hasSeenOnboarding, hasSeenOnboardingAccountScope, localToolPermission, localToolPermissionByMachineId, mcpBoxServers, …+16) | 服务端设置 Host Settings 对应资源或流程；具体内部实现仅能由契约推断。 | [观察 L1745](../../evidence/artifacts/runtime-api-shapes.jsonl#L1745) |
| `updateForeverBox` | {id} | SandForeverBoxStatus(agentId, diskPressure, handoff, hostUpdateAvailable, hostVersion, imageUpdateAvailable, pull, state, vncUrl, …+1) | 触发持久 Box 更新并返回新状态。 | 本次未观察；静态 schema |
| `updateHostNow` | {force, includeErrorDetail} | SandHostUpdateResult(reason, started, version) | 服务端更新 Host Now 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

### Transcript、附件、文档与搜索（12）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `getAgentThread` | {id, rootId} | SandAgentThread(entries) | 服务端读取 Agent Thread 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentTranscript` | {id} | array<SandTranscriptEntry> | 服务端读取 Agent Transcript 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentTranscriptPage` | {beforeSeq, id, limit, sinceMs, untilMs} | SandRetainedTranscriptPage(entries, nextBeforeSeq) | 服务端读取 Agent Transcript Page 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentTranscriptTail` | {beforeSeq, id, limit, sessionId, unreadBoundaryAt} | SandTranscriptPage(cloudAgentPeerIds, entries, nextBeforeSeq, precedingTimestampMs, unreadAnchor) | 服务端读取 Agent Transcript Tail 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getAgentTranscriptWindow` | {beforeSeq, id, limit} | SandTranscriptWindow(entries, nextBeforeSeq, threadCounts) | 服务端读取 Agent Transcript Window 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `getConversationOutline` | {id} | array<SandConversationOutlineItem> | 服务端读取 Conversation Outline 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `readAttachmentChunk` | SandReadAttachmentChunkArgs(agentId, length, offset, path, videoPlayback) | SandAttachmentChunk \| null | 服务端读取 Attachment Chunk 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `readAttachmentImage` | {fit, path, rendition, tile} | ResolvedImageAttachment \| null | 读取/转换图片附件，支持 rendition、fit 与 tile。 | [观察 L1364](../../evidence/artifacts/runtime-api-shapes.jsonl#L1364) |
| `readAttachmentText` | SandReadAttachmentTextArgs(agentId, path) | {bytes, kind} \| {bytes, kind, text, truncated} \| null | 服务端读取 Attachment Text 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `searchMedia` | {limit, query} | array<SandMediaMatch> | 服务端搜索 Media 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `uploadAttachment` | SandUploadAttachmentArgs(agentId, bytesBase64, filename) | SandUploadAttachmentResult(path) | 服务端上传 Attachment 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `uploadAttachmentChunk` | SandUploadAttachmentChunkArgs(agentId, bytesBase64, filename, offset, totalSize, uploadId) | SandUploadAttachmentChunkResult(committedPath) | 服务端上传 Attachment Chunk 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

### 语音与音频（7）

| 方法 | Args | Reply | 职责 | 动态证据 |
|---|---|---|---|---|
| `getVoiceCall` | {callId, id} | SandVoiceCallWireRecord \| null | 服务端读取 Voice Call 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `nudgeVoiceCall` | {callId, id, request, spokenTurns} | VoiceCallNudgeReply(empty) | 向进行中的 Voice call 注入 nudge/已说轮次。 | 本次未观察；静态 schema |
| `previewVoice` | {greetingId, voiceId} | SandVoicePreviewAudio(audioBase64, mimeType) | 服务端执行 Preview Voice 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `readVoiceCallSentMessages` | {id} | array<SandOutlineWrittenMessage> | 读取 Voice call 已发送给 Agent 的消息摘要。 | 本次未观察；静态 schema |
| `recordVoiceCall` | {record} | null | 保存 Voice call 记录。 | 本次未观察；静态 schema |
| `setAgentVoice` | {id, voiceId, voiceLanguage, voiceSpeed} | null | 服务端设置 Agent Voice 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |
| `setVoiceCallPresence` | {acceptsOverheard, callId, id, isOnTheLine} | null | 服务端设置 Voice Call Presence 对应资源或流程；具体内部实现仅能由契约推断。 | 本次未观察；静态 schema |

## 27 个 SSE Event channel

| Channel | Payload 核心结构 | 用途 |
|---|---|---|
| `agent-activity` | SandAgentActivityEvent(agentId, client, live) | Agent 活跃/运行状态增量 |
| `agent-meetings` | SandAgentMeetingsChangedEvent(agentId) | Agent 会议列表变更 |
| `agent-tasks` | SandAgentTasksChangedEvent(agentId) | Agent task 变更 |
| `agent-upserted` | {activeAgentId, agent, ordered} | 单 Agent roster upsert |
| `agents` | {activeAgentId, agents, coverage, ordered} | 完整或区间覆盖的 Agent roster |
| `async-tasks` | SandAsyncTasksEvent(parentAgentId, tasks) | 异步任务状态 |
| `automations` | AutomationsEvent(agentId, automations) | 自动化规则变更 |
| `bot-secrets` | SandBotSecretsChangedEvent(agentId) | Secret 元数据变更通知 |
| `bot-skills` | SandBotSkillsChangedEvent(agentId) | Agent skill 变更 |
| `box-disk-pressure` | SandBoxDiskPressure \| null | Box 磁盘压力 |
| `cloud-agent-update` | SandCloudAgentUpdateEvent(bcId, status, updatedAtMs) | Cloud Agent 状态/产物更新 |
| `computer-action` | SandComputerActionEvent(agentId, button, count, type, x, y) | 计算机动作状态 |
| `forever-box` | SandForeverBoxStatus(agentId, diskPressure, handoff, hostUpdateAvailable, hostVersion, imageUpdateAvailable, pull, state, vncUrl, …+1) | 持久 Box/VNC 状态 |
| `host-settings` | SandHostSettingsChangedEvent(fields) | Host 设置变更 |
| `mcp-auth` | SandMcpAuthCompletion(accountKey, failureDetail, outcome, requestingAgentId, serverId, serverIdentifier, serverName, serverUrl) | MCP OAuth 完成 |
| `mcp-servers` | SandMcpServersUpdatedEvent(servers) | MCP server 列表/状态更新 |
| `messages-grants` | SandMessagesGrantsRequest(grants, requestId) | Messages 权限请求 |
| `outline` | SandConversationOutlineEvent(empty) | 会话 outline 更新 |
| `server-page-title-changed` | SandPageTitleChange(atMs, page, title) | 服务端页面标题变化 |
| `server-roster-changed` | SandServerRosterChange(empty) | 服务端 roster 变化 |
| `subagents` | SandSubagentsEvent(parentAgentId, subagents) | Subagent 列表更新 |
| `teach-recording` | SandTeachRecordingStatus(agentId, maxDurationMs, startedAtMs, state) | Teach recording 状态 |
| `todos` | SandAgentTodosEvent(agentId, todos) | Todo 更新 |
| `transcript` | {activeAgentId, cloudAgentPeerIds, coverage, entries, ordered, type} \| {agentId, entry, ordered, type} \| {agentId, entry, ordered, type} \| {agentId, id, ordered, seq, type} \| {agentId, ordered, type} | Transcript snapshot/append/update/remove/clear |
| `tray` | TrayEvent(empty) | 错误/提示 tray |
| `voice-call-nudge` | SandVoiceCallInboundNudge(agentId, callId, kind, update) | Voice call 入站 nudge |
| `workflows` | SkillsEvent(agentId, workflows) | Workflow/skill 更新 |

动态已观察 `GET /events` 多次建立连接；schema 表明事件包含 snapshot 与增量两类语义，并用 ordered stamp / coverage / sequence 处理重连、补种和乱序。连接结束或重连本身不等于业务失败。

## 40 个 host-only 方法

这些方法不在 167 个公开 `/api/{method}` schema 中，只允许 Host/Coordinator 内部使用，体现了权限边界。

### 凭证与 Secret Broker

- `acquireCredentialFillAgentHold` — 服务端执行 Acquire Credential Fill Agent Hold 对应资源或流程；具体内部实现仅能由契约推断。
- `awaitBoxSecretsApplied` — 服务端执行 Await Box Secrets Applied 对应资源或流程；具体内部实现仅能由契约推断。
- `awaitBrokeredCredentialAccessRequest` — 服务端执行 Await Brokered Credential Access Request 对应资源或流程；具体内部实现仅能由契约推断。
- `createBrokeredCredentialAccessRequest` — 服务端创建 Brokered Credential Access Request 对应资源或流程；具体内部实现仅能由契约推断。
- `deliverBrokeredCredentialSession` — 服务端执行 Deliver Brokered Credential Session 对应资源或流程；具体内部实现仅能由契约推断。
- `fillBrokeredCredential` — 服务端执行 Fill Brokered Credential 对应资源或流程；具体内部实现仅能由契约推断。
- `fillBrowserCredential` — 服务端执行 Fill Browser Credential 对应资源或流程；具体内部实现仅能由契约推断。
- `fillBrowserCredentialDirect` — 服务端执行 Fill Browser Credential Direct 对应资源或流程；具体内部实现仅能由契约推断。
- `fillBrowserOneTimeCode` — 服务端执行 Fill Browser One Time Code 对应资源或流程；具体内部实现仅能由契约推断。
- `fillBrowserPasswordStep` — 服务端执行 Fill Browser Password Step 对应资源或流程；具体内部实现仅能由契约推断。
- `getOpenCredentialRequest` — 服务端读取 Open Credential Request 对应资源或流程；具体内部实现仅能由契约推断。
- `releaseCredentialFillAgentHold` — 服务端执行 Release Credential Fill Agent Hold 对应资源或流程；具体内部实现仅能由契约推断。
- `resolveCredentialBrowserTarget` — 服务端处理 Credential Browser Target 对应资源或流程；具体内部实现仅能由契约推断。
- `resolveCredentialRequest` — 服务端处理 Credential Request 对应资源或流程；具体内部实现仅能由契约推断。
- `syncUserSecrets` — 服务端同步 User Secrets 对应资源或流程；具体内部实现仅能由契约推断。

### Host 内部桥接

- `appendConnectorCard` — 服务端执行 Append Connector Card 对应资源或流程；具体内部实现仅能由契约推断。
- `deleteAgent` — 服务端删除 Agent 对应资源或流程；具体内部实现仅能由契约推断。
- `exportGrokBotWorkingState` — 服务端执行 Export Grok Bot Working State 对应资源或流程；具体内部实现仅能由契约推断。

### Host UI/身份状态

- `assignAgentToSidebarSection` — 服务端执行 Assign Agent To Sidebar Section 对应资源或流程；具体内部实现仅能由契约推断。
- `getNavigationTelemetryIdentity` — 服务端读取 Navigation Telemetry Identity 对应资源或流程；具体内部实现仅能由契约推断。
- `getPauseState` — 服务端读取 Pause State 对应资源或流程；具体内部实现仅能由契约推断。
- `listSidebarSections` — 服务端列举 Sidebar Sections 对应资源或流程；具体内部实现仅能由契约推断。
- `reconcileAgentIdentity` — 服务端执行 Reconcile Agent Identity 对应资源或流程；具体内部实现仅能由契约推断。

### Box、Store 与迁移

- `autoUpdateBoxNow` — 服务端执行 Auto Update Box Now 对应资源或流程；具体内部实现仅能由契约推断。
- `clearBoxStoreNow` — 服务端清理 Box Store Now 对应资源或流程；具体内部实现仅能由契约推断。
- `getBoxStoreStatus` — 服务端读取 Box Store Status 对应资源或流程；具体内部实现仅能由契约推断。
- `getHarnessMigrationWindow` — 服务端读取 Harness Migration Window 对应资源或流程；具体内部实现仅能由契约推断。
- `prepareBoxForRecreate` — 服务端准备 Box For Recreate 对应资源或流程；具体内部实现仅能由契约推断。
- `resumeBoxAfterRecreate` — 服务端执行 Resume Box After Recreate 对应资源或流程；具体内部实现仅能由契约推断。
- `setBoxMigrating` — 服务端设置 Box Migrating 对应资源或流程；具体内部实现仅能由契约推断。
- `setHttpProxyName` — 服务端设置 Http Proxy Name 对应资源或流程；具体内部实现仅能由契约推断。
- `snapshotBoxStoreNow` — 服务端执行 Snapshot Box Store Now 对应资源或流程；具体内部实现仅能由契约推断。

### 多 Agent Room 与请求生命周期

- `cancelRoomMemberTurn` — 服务端取消 Room Member Turn 对应资源或流程；具体内部实现仅能由契约推断。
- `deliverAgentMessage` — 服务端执行 Deliver Agent Message 对应资源或流程；具体内部实现仅能由契约推断。
- `deliverRoomMemberTurnResult` — 服务端执行 Deliver Room Member Turn Result 对应资源或流程；具体内部实现仅能由契约推断。
- `listPromotableRooms` — 服务端列举 Promotable Rooms 对应资源或流程；具体内部实现仅能由契约推断。
- `markAgentRequestEnded` — 服务端标记 Agent Request Ended 对应资源或流程；具体内部实现仅能由契约推断。
- `markAgentRequestStarted` — 服务端标记 Agent Request Started 对应资源或流程；具体内部实现仅能由契约推断。
- `runRoomMemberTurn` — 服务端执行 Room Member Turn 对应资源或流程；具体内部实现仅能由契约推断。

### Voice Harness

- `readVoiceCallAgentContext` — 服务端读取 Voice Call Agent Context 对应资源或流程；具体内部实现仅能由契约推断。

## Local Exec / 用户设备 Relay

Local Exec 不是“云真机 Farm”，也不是 167 个 Gateway 方法中的普通 RPC。其链路是：Main 注册机器并签发短期 credential → 独立 Local Exec Daemon 建立 `WatchGrokBotUserComputerRequests` 流或 poll/submit 批模式 → 在用户电脑执行 shell/file/messages/mobile 能力 → 回传分帧结果。

- 静态实现：并发 8、backlog 64、poll 64；response batch 最多 256 帧或约 8 MiB；文件帧 4 MiB；35 秒 stall watchdog；submit 最多 3 次重试。
- 设备 credential 与 account generation/ownership 绑定，旧 daemon 在 ownership 丢失时退出，避免跨账号接管。
- 已观察 `/sand-box/local-exec-daemon-credential`、`IssueGrokBotUserComputerCredential` 和 `WatchGrokBotUserComputerRequests`；未观察到 Appium、模拟器池或移动云真机调度接口。
- 证据：[Local Exec](../../evidence/artifacts/formatted/local-exec-daemon/main.cjs#L155180)、[机器流 Proto](../../evidence/artifacts/formatted/electron-main/proto.cjs#L63662)。

## 审批、安全与凭证边界

- 审批类：auto-review、local tool、connector grant、virtual card、cookie origin、Messages grant、Widget/Form。每个请求带 request/entry/session/agent 标识，服务端或 Gateway 只接收结构化 resolution。
- 凭证类：普通 secret、内建 Vault、1Password、brokered credential、WebAuthn/Passkey 分离；浏览器填充放在 host-only 方法中，避免 Renderer 获得明文。
- `contextIsolation=true`、`nodeIntegration=false`、`sandbox=true`，Preload 只暴露白名单能力；新窗口和跨 origin 导航受策略约束。

## 记忆、文档与附件

- Transcript 事件/查询面：已观察实时事件以及 tail/page/window、thread count、unread anchor 和 rollback 契约；语义上可推断存在可回放的有序记录，但客户端不能证明服务端 journal 的存储实现。
- 长期记忆：Agent 私有事实 → promote 到团队；另有 team prose summary、memory folder/profile/log。
- 知识与文件：library docs、agent files、skills/workflows、插件文件、MCP app resource、附件 blob、AgentStore artifact/object store、模板 recipe。
- 未发现可证明的通用 embedding/vector database 选型；可以复刻为关系元数据 + 对象存储 + 可选全文/向量索引，但后者必须标为设计选择。

## Voice 与 VNC

- Voice：Main mint credential / 组装 Harness session，连接 `wss://api.x.ai/` Realtime；PCM16 mono 24kHz、server VAD、流式 ASR/LLM/TTS、tool calls。插话发送 `conversation.item.truncate`，未发现实际调用 `response.cancel`。
- VNC：`EnsureSandBox`/`ensureForeverBox` 返回或维护 VNC 信息，客户端经 noVNC/websockify RFB 连接；6080 为主桌面、6081 为 fork。独立 partition、token 转 header、clipboard sender 校验。stall 只上报遥测，不自动重启。
- 未知：具体 VNC server（TigerVNC/Xvnc/x11vnc）、Box 虚拟化方式和集群编排产品。

