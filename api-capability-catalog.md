# testAgent 中央 API 能力目录

本目录静态枚举 7 个 ConnectRPC/protobuf 服务、484 条 RPC 路由、429 个唯一 operation 名；AgentStore 24、Ai 8、Analytics 8、BackgroundComposer 7、Dashboard 73、GrokBot 309、SandBox 55。GrokBotService 复用了 SandBoxService 的全部 55 条同名同 schema 路由，因此“484”不是 484 个互不相同的业务能力。

动态证据来自脱敏 shape 采集的冻结窗口 L255–L2226（1972 条有效记录，观察到 51 条中央 RPC 路由）；只记录字段、协议、状态和行号，不记录 token、账号值、消息正文或响应内容。

证据标记：`动态+静态` 表示抓包确实出现该路由且静态 Proto 可对齐；`静态` 表示客户端打包的服务契约中存在，但本次窗口未观察到。职责描述中未由客户端证明的内部实现均按“推断”处理。

## 总体协议与部署边界

- 中央 API：`https://api2.cursor.sh/aiserver.v1.<Service>/<Method>`，Unary 使用 `application/proto`，流式使用 `application/connect+proto`。动态窗口同时出现 HTTP/1.1 与 HTTP/2。
- 动态响应普遍带 `x-envoy-upstream-service-time`，高置信存在 Envoy 类边缘代理；不能由此确定内部微服务、集群或容器实现。
- 客户端请求头静态/动态可见授权、校验、客户端版本/OS/source/type、request ID、ghost mode、Box namespace；本文不记录任何值。
- 关键未知：Kubernetes、Firecracker、具体数据库、向量库、Temporal.io SDK、VNC server 产品均无法由客户端直接证明。

## AgentStoreService（24 路由）

Agent 资料库与对象存储控制面：目录、文档、版本、预签名上传下载、锁、软删除和分享。

推断可复刻为 PostgreSQL 元数据 + S3 兼容对象存储 + multipart upload + Redis/数据库租约锁 + tombstone 回收任务。

### Store、目录与文档

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ListAgentStores` / Unary | ListAgentStoresRequest(n, page_token?) | ListAgentStoresResponse(stores[], has_more, next_page_token?) | 服务端列举 Agent Stores 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4829) |
| `ListAgentStoreEntries` / Unary | ListAgentStoreEntriesRequest(store_id, relative_path, share_id?) | ListAgentStoreEntriesResponse(normalized_relative_path, entries[]) | 服务端列举 Agent Store Entries 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4831) |
| `ReadAgentStoreFile` / Unary | ReadAgentStoreFileRequest(store_id, relative_path, share_id?) | ReadAgentStoreFileResponse(content, document_owner_view?) | 服务端读取 Agent Store File 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4837) |
| `WriteAgentStoreDocument` / Unary | WriteAgentStoreDocumentRequest(store_id, document_id, source) | WriteAgentStoreDocumentResponse(etag, title, url) | 服务端执行 Write Agent Store Document 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4843) |
| `SetAgentStoreDocumentVisibility` / Unary | SetAgentStoreDocumentVisibilityRequest(store_id, document_id, visibility) | SetAgentStoreDocumentVisibilityResponse(visibility, url) | 服务端设置 Agent Store Document Visibility 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4849) |
| `ListAgentStoreFiles` / Unary | ListAgentStoreFilesRequest(agent_id, share_id?, store_id?, tombstone_mode, tombstones_since_ms) | ListAgentStoreFilesResponse(files[], tombstones[], listing_complete, tombstone_watermark_ms, tombstone_floor_ms) | 服务端列举 Agent Store Files 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4861) |
| `ListAgentStoreDirectory` / Unary | ListAgentStoreDirectoryRequest(store_id?, share_id?, relative_path, page_size, page_token, prefer_complete_flat_store, tombstone_mode, …+2) | ListAgentStoreDirectoryResponse(files[], subdirs[], next_page_token, mode, tombstones[], removed_subdirs[], listing_complete, …+4) | 服务端列举 Agent Store Directory 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4867) |
| `CheckAgentStoreVersions` / Unary | CheckAgentStoreVersionsRequest(entries[]) | CheckAgentStoreVersionsResponse(results[]) | 服务端校验 Agent Store Versions 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4873) |

### 传输、令牌与对象存储

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `MintAgentStoreToken` / Unary | MintAgentStoreTokenRequest(agent_id, share_id?, store_id?, source) | MintAgentStoreTokenResponse(token, expires_at_ms, agent_ids[], store_ids[]) | 服务端签发短期凭证 Agent Store Token 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4855) |
| `PresignAgentStoreReads` / Unary | PresignAgentStoreReadsRequest(agent_id, rel_paths[], share_id?, store_id?) | PresignAgentStoreReadsResponse(instructions[]) | 为对象存储读取签发短期预签名 URL。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4879) |
| `PresignAgentStoreWrites` / Unary | PresignAgentStoreWritesRequest(agent_id, files[], store_id?, lock_token?, lock_client_uuid?, supports_signed_content_length) | PresignAgentStoreWritesResponse(instructions[]) | 为对象存储上传签发短期预签名 URL 或 multipart 信息。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4885) |
| `CompleteAgentStoreMultipartWrites` / Unary | CompleteAgentStoreMultipartWritesRequest(store_id, completions[]) | CompleteAgentStoreMultipartWritesResponse(results[]) | 服务端完成 Agent Store Multipart Writes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4891) |
| `AbortAgentStoreMultipartWrites` / Unary | AbortAgentStoreMultipartWritesRequest(store_id, uploads[]) | AbortAgentStoreMultipartWritesResponse(results[]) | 服务端中止 Agent Store Multipart Writes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4897) |

### 并发锁与租约

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `AcquireAgentStoreFileLock` / Unary | AcquireAgentStoreFileLockRequest(store_id, rel_path, holder, acquisition_id, ttl_seconds?) | AcquireAgentStoreFileLockResponse(acquired, lock_token?, current_holder?, expires_at_ms) | 服务端执行 Acquire Agent Store File Lock 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4903) |
| `RenewAgentStoreFileLock` / Unary | RenewAgentStoreFileLockRequest(store_id, rel_path, lock_token) | RenewAgentStoreFileLockResponse(renewed, expires_at_ms) | 服务端执行 Renew Agent Store File Lock 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4909) |
| `ReleaseAgentStoreFileLock` / Unary | ReleaseAgentStoreFileLockRequest(store_id, rel_path, lock_token) | ReleaseAgentStoreFileLockResponse(released) | 服务端执行 Release Agent Store File Lock 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4915) |
| `GetAgentStoreFileLock` / Unary | GetAgentStoreFileLockRequest(store_id, rel_path) | GetAgentStoreFileLockResponse(held, holder?, expires_at_ms) | 服务端读取 Agent Store File Lock 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4921) |

### 删除、恢复与回收

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `DeleteAgentStoreFiles` / Unary | DeleteAgentStoreFilesRequest(store_id?, files[]) | DeleteAgentStoreFilesResponse(results[]) | 服务端删除 Agent Store Files 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4927) |
| `RmdirAgentStore` / Unary | RmdirAgentStoreRequest(store_id?, share_id?, rel_path) | RmdirAgentStoreResponse(empty) | 服务端删除目录 Agent Store 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4932) |
| `UndeleteAgentStoreFiles` / Unary | UndeleteAgentStoreFilesRequest(store_id?, files[]) | UndeleteAgentStoreFilesResponse(results[]) | 服务端执行 Undelete Agent Store Files 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4934) |
| `ListAgentStoreTombstones` / Unary | ListAgentStoreTombstonesRequest(store_id, page_size, page_token) | ListAgentStoreTombstonesResponse(tombstones[], next_page_token) | 服务端列举 Agent Store Tombstones 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4940) |

### 共享与可见性

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ShareAgentStore` / Unary | ShareAgentStoreRequest(agent_id, path_prefix, store_id?, source) | ShareAgentStoreResponse(share_id, share_url) | 服务端执行 Share Agent Store 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4945) |
| `UnshareAgentStore` / Unary | UnshareAgentStoreRequest(share_id) | UnshareAgentStoreResponse(empty) | 服务端执行 Unshare Agent Store 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4947) |
| `ListSharedAgentStores` / Unary | ListSharedAgentStoresRequest(limit, created_before_ms?, owning_user_id?, search_query?, scope?, created_before_share_id?) | ListSharedAgentStoresResponse(listings[], has_more, next_created_before_ms?, next_created_before_share_id?) | 服务端列举 Shared Agent Stores 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L4953) |

## AiService（8 路由）

通用 AI 能力：模型目录、图像生成、命名、STT/TTS，以及进程/数值指标。

推断可复刻为模型路由层 + provider adapter + 流式音频网关 + GPU/异步生成队列 + 指标入口。

### 模型与生成

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `AvailableModels` / Unary | AvailableModelsRequest(is_nightly, include_long_context_models, exclude_max_named_models, additional_model_names[], use_model_parameters?, include_hidden_models?, do_not_use_markdown?, …+11) | AvailableModelsResponse(models[], model_names[], composer_model_config?, cmd_k_model_config?, background_composer_model_config?, plan_execution_model_config?, spec_model_config?, …+10) | 服务端执行 Available Models 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L31516) |
| `RunGenerateImage` / Unary | RunGenerateImageRequest(description, reference_images[], model_id, max_mode, aspect_ratio?) | RunGenerateImageResponse(success, error) | 服务端执行 Generate Image 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L31517) |
| `NameTab` / Unary | NameTabRequest(messages[], is_project, api_key_credentials, azure_credentials, bedrock_credentials, conversation_id, is_side_chat) | NameTabResponse(name, reason, icon) | 服务端执行 Name Tab 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L31518) |

### 运行指标

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ReportSandProcessMetrics` / Unary | ReportSandProcessMetricsRequest(sample_start, sample_end, num_subsamples, sample_seqno, session_id, rows[], os, …+4) | ReportSandProcessMetricsResponse(empty) | 服务端上报 Sand Process Metrics 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L31520) |
| `ReportClientNumericMetrics` / Unary | ReportClientNumericMetricsRequest(metrics[]) | ReportClientNumericMetricsResponse(empty) | 服务端上报 Client Numeric Metrics 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L31526) |

### 语音与音频

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `StreamStt` / BiDiStreaming | SttClientMessage(config, audio, control) | SttServerMessage(text, is_final, kind) | 以双向流接收音频/控制帧并返回增量或最终转写。 | 静态：[Proto](formatted/electron-main/proto.cjs#L31531) |
| `TranscribeAudio` / Unary | TranscribeAudioRequest(audio, mime_type, language?) | TranscribeAudioResponse(text, transcription_time_ms) | 服务端执行 Transcribe Audio 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L31532) |
| `TextToSpeech` / Unary | TextToSpeechRequest(text, voice_id?, language?, speed?, with_timestamps?) | TextToSpeechResponse(audio, mime_type, synthesis_time_ms, char_start_ms[], char_end_ms[]) | 服务端执行 Text To Speech 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L31533) |

## AnalyticsService（8 路由）

事件、日志、会话摄取、Feature Flag bootstrap 与问题追踪包上传下载。

推断可复刻为事件网关 + Kafka/PubSub + OLAP/日志存储 + Feature Flag 服务 + trace 对象存储；具体产品未证实。

### 事件与日志

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `TrackEvents` / Unary | TrackEventsRequest(events[]) | TrackEventsResponse(empty) | 服务端采集 Events 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L426](runtime-api-shapes.jsonl#L426)；[Proto](formatted/electron-main/proto.cjs#L41759) |
| `Batch` / Unary | BatchRequest(events[]) | BatchResponse(empty) | 服务端执行 Batch 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41760) |
| `SubmitLogs` / Unary | SubmitLogsRequest(logs[]) | SubmitLogsResponse(success, error_message?, logs_processed, logs_dropped) | 服务端提交 Logs 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L267](runtime-api-shapes.jsonl#L267)；[Proto](formatted/electron-main/proto.cjs#L41768) |

### Feature Flag

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `BootstrapStatsig` / Unary | BootstrapStatsigRequest(ignore_dev_status?, operating_system?, device_model?, os_version?, form_factor?, stable_id?, client_channel?, …+6) | BootstrapStatsigResponse(config, generated_at_ms) | 服务端执行 Bootstrap Statsig 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L270](runtime-api-shapes.jsonl#L270)；[Proto](formatted/electron-main/proto.cjs#L41761) |
| `GetFirstWindowStatsigDecision` / Unary | GetFirstWindowStatsigDecisionRequest(operating_system?) | GetFirstWindowStatsigDecisionResponse(variant, reason) | 服务端读取 First Window Statsig Decision 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41763) |

### 会话摄取

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `IngestConversation` / Unary | IngestConversationRequest(conversation_id, transcript, transcript_json?, mode?, model?, last_updated_at) | IngestConversationResponse(success, summary?, detailed_summary?, error_message?) | 服务端摄取 Conversation 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41770) |

### 问题追踪包

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `UploadIssueTrace` / Unary | UploadIssueTraceRequest(token, payload, payload_hash) | UploadIssueTraceResponse(event_id, size) | 服务端上传 Issue Trace 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41775) |
| `DownloadIssueTraces` / Unary | DownloadIssueTracesRequest(token, limit) | DownloadIssueTracesResponse(data, total_traces, total_bytes) | 服务端下载 Issue Traces 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41777) |

## BackgroundComposerService（7 路由）

后台代码 Agent/Composer 的状态、diff、worker、turn summary、artifact、用户设置与 PR 合并状态。

推断可复刻为任务编排器 + Git checkout/diff worker pool + artifact store + Git provider webhook/polling；不能据此断言具体工作流引擎。

### 后台 Agent 状态

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetBackgroundComposerInfo` / Unary | GetBackgroundComposerInfoRequest(bc_id, include_diff, do_not_throw_if_setup_not_finished, expected_scope, descendant_prs_as_refs?) | GetBackgroundComposerInfoResponse(composer) | 服务端读取 Background Composer Info 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40846) |

### 执行结果与产物

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetOptimizedDiffDetails` / Unary | GetOptimizedDiffDetailsRequest(bc_id, exclude_before_after_diffs, committed_only, branch_name?, repo_url?) | GetOptimizedDiffDetailsResponse(diff, submodule_diffs[]) | 服务端读取 Optimized Diff Details 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40852) |
| `GetTurnSummaryBackgroundComposer` / Unary | GetTurnSummaryBackgroundComposerRequest(bc_id, source_type?) | GetTurnSummaryBackgroundComposerResponse(summary) | 服务端读取 Turn Summary Background Composer 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40864) |
| `ListBackgroundComposerArtifacts` / Unary | ListBackgroundComposerArtifactsRequest(bc_id) | ListBackgroundComposerArtifactsResponse(artifacts[]) | 服务端列举 Background Composer Artifacts 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40870) |

### Worker 管理

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ListWorkersForManager` / Unary | ListWorkersForManagerRequest(manager_bc_id) | ListWorkersForManagerResponse(memberships[]) | 服务端列举 Workers For Manager 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40858) |

### 用户运行设置

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetBackgroundComposerUserSettings` / Unary | GetBackgroundComposerUserSettingsRequest(expected_scope) | GetBackgroundComposerUserSettingsResponse(model_name?, slack_notifications_for_web_enabled?, ci_failure_followup_enabled?, browser_use_enabled?, auto_create_pr_setting?, pr_review_open_destination?, github_artifact_posting?, …+13) | 服务端读取 Background Composer User Settings 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L358](runtime-api-shapes.jsonl#L358)；[Proto](formatted/electron-main/proto.cjs#L40876) |

### 代码托管与 PR

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetPullRequestMergeStatus` / Unary | GetPullRequestMergeStatusRequest(pr_url, include_behind_count?) | GetPullRequestMergeStatusResponse(is_merged, is_closed, mergeable_state, state, is_draft, title, base_branch, …+4) | 服务端读取 Pull Request Merge Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40882) |

## DashboardService（73 路由）

账号、团队、政策、计费、准入、MCP/插件、设备登记、Canvas、集成和金融连接。

推断可复刻为 Identity/Policy 服务 + entitlement/metering ledger + OAuth broker + plugin registry + machine registry + relational metadata store。

### 身份、团队、GitHub、预付费与限额

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetTeams` / Unary | GetTeamsRequest(active_only?) | GetTeamsResponse(teams[]) | 服务端读取 Teams 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L338](runtime-api-shapes.jsonl#L338)；[Proto](formatted/electron-main/proto.cjs#L40892) |
| `GetMe` / Unary | GetMeRequest(team_id?, source_site_hostname?, include_mobile_app_status?) | GetMeResponse(auth_id, user_id, email?, first_name?, last_name?, workos_id?, team_id?, …+13) | 服务端读取 Me 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L283](runtime-api-shapes.jsonl#L283)；[Proto](formatted/electron-main/proto.cjs#L40893) |
| `GetUnifyCta` / Unary | GetUnifyCtaRequest(empty) | GetUnifyCtaResponse(show, audience, href?) | 服务端读取 Unify Cta 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L351](runtime-api-shapes.jsonl#L351)；[Proto](formatted/electron-main/proto.cjs#L40894) |
| `GetTeamGroups` / Unary | GetTeamGroupsRequest(team_id, page?, page_size?, search_term?) | GetTeamGroupsResponse(groups[], total_groups, total_pages) | 服务端读取 Team Groups 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40895) |
| `GetTeamPrepaidBilling` / Unary | GetTeamPrepaidBillingRequest(team_id, limit?, skip_balance_cache?) | GetTeamPrepaidBillingResponse(billing_mode, eligible, available_cents, funded_cents, spent_cents, auto_top_up?, top_ups[], …+4) | 服务端读取 Team Prepaid Billing 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40897) |
| `SetTeamPrepaidAutoTopUp` / Unary | SetTeamPrepaidAutoTopUpRequest(team_id, rule?) | SetTeamPrepaidAutoTopUpResponse(rule?) | 服务端设置 Team Prepaid Auto Top Up 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40903) |
| `GetUserPrepaidBilling` / Unary | GetUserPrepaidBillingRequest(limit?, xai_team_id?, skip_balance_cache?) | GetUserPrepaidBillingResponse(billing_mode, eligible, available_cents, funded_cents, spent_cents, auto_top_up?, top_ups[], …+4) | 服务端读取 User Prepaid Billing 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40909) |
| `SetUserPrepaidAutoTopUp` / Unary | SetUserPrepaidAutoTopUpRequest(rule?, xai_team_id?) | SetUserPrepaidAutoTopUpResponse(rule?) | 服务端设置 User Prepaid Auto Top Up 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40915) |
| `GetTeamMembers` / Unary | GetTeamMembersRequest(team_id, include_org_admins?) | GetTeamMembersResponse(team_members[], user_id, is_scim_synced, org_admins[], merged_seat_rail, team_linked_to_organization, invite_seat_tier_enabled) | 服务端读取 Team Members 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40920) |
| `SendTeamInvite` / Unary | SendTeamInviteRequest(team_id, email, role, message?, billing_tier?, onboarding?, merged_seat_tier?) | SendTeamInviteResponse(valid_until) | 服务端发送 Team Invite 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40921) |
| `GetTeamInviteLink` / Unary | GetTeamInviteLinkRequest(team_id, create_if_missing?, billing_tier?, role?, merged_seat_tier?) | GetTeamInviteLinkResponse(invite_link?) | 服务端读取 Team Invite Link 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40923) |
| `PrepareGithubConnectFlow` / Unary | PrepareGithubConnectFlowRequest(github_repo, ghe_application?, source, verifier_hash, force_oauth, connect_target?, connect_source?, …+2) | PrepareGithubConnectFlowResponse(flow_id, state, github_url, expires_at_ms, should_install, ghe_application?) | 服务端准备 Github Connect Flow 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40929) |
| `CompleteGithubConnectFlow` / Unary | CompleteGithubConnectFlowRequest(state, verifier, code, installation_id, setup_action, ghe_application?) | CompleteGithubConnectFlowResponse(outcome, installation_id, confirmation_code, github_login, ghe_application?) | 服务端完成 Github Connect Flow 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40935) |
| `DisconnectGithub` / Unary | DisconnectGithubRequest(ghe_application?, user_only?) | DisconnectGithubResponse(removed_connections_count) | 服务端执行 Disconnect Github 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40940) |
| `GetHardLimit` / Unary | GetHardLimitRequest(team_id?, personal_scope?) | GetHardLimitResponse(hard_limit, no_usage_based_allowed, hard_limit_per_user?, per_user_monthly_limit_dollars, is_dynamic_team_limit, has_pending_setup_onboarding_credit_claim, is_setup_promo_active, …+5) | 服务端读取 Hard Limit 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L431](runtime-api-shapes.jsonl#L431)；[Proto](formatted/electron-main/proto.cjs#L40941) |
| `SetHardLimit` / Unary | SetHardLimitRequest(team_id?, hard_limit, no_usage_based_allowed, hard_limit_per_user?, preserve_hard_limit_per_user, per_user_monthly_limit_dollars, clear_per_user_monthly_limit_dollars, …+8) | SetHardLimitResponse(empty) | 服务端设置 Hard Limit 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40942) |
| `GetDailySpendByCategory` / Unary | GetDailySpendByCategoryRequest(team_id?, user_id?, period_start_ms, period_end_ms, group_by, spend_type?, service_account_id?, …+6) | GetDailySpendByCategoryResponse(daily_spend[], categories[], effective_limit_cents?) | 服务端读取 Daily Spend By Category 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40944) |

### MCP、OAuth、工具与资源

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetMcpConfig` / Unary | GetMcpConfigRequest(team_scope, team_id, redact_secrets, expand_plugin_variables) | GetMcpConfigResponse(config_json, server_metadata_by_name) | 服务端读取 Mcp Config 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40949) |
| `GetAvailableMcpServers` / Unary | GetAvailableMcpServersRequest(grok_bot_plugin_scope?, grok_bot_agent_id?) | GetAvailableMcpServersResponse(servers[]) | 服务端读取 Available Mcp Servers 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L339](runtime-api-shapes.jsonl#L339)；[Proto](formatted/electron-main/proto.cjs#L40951) |
| `SetMcpConfig` / Unary | SetMcpConfigRequest(team_scope, team_id, config_json, server_renames, server_ids_by_name) | SetMcpConfigResponse(empty) | 服务端设置 Mcp Config 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40956) |
| `ListSandMcpTools` / Unary | ListSandMcpToolsRequest(server_identifiers[], mcp_config_json?, grok_bot_plugin_scope?) | ListSandMcpToolsResponse(servers[]) | 服务端列举 Sand Mcp Tools 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L399](runtime-api-shapes.jsonl#L399)；[Proto](formatted/electron-main/proto.cjs#L40957) |
| `ExecuteSandMcpTool` / Unary | ExecuteSandMcpToolRequest(server_identifier, tool_name, args, tool_call_id, agent_id, turn_id, mcp_config_json?, …+4) | ExecuteSandMcpToolResponse(result) | 服务端执行 Sand Mcp Tool 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40959) |
| `ReadSandMcpResource` / Unary | ReadSandMcpResourceRequest(server_identifier, uri, agent_id, mcp_config_json?, grok_bot_plugin_scope?) | ReadSandMcpResourceResponse(contents[], error?) | 服务端读取 Sand Mcp Resource 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40965) |
| `DeleteMcpOAuthToken` / Unary | DeleteMcpOAuthTokenRequest(server_url, service_account_id?, source?, account_key, server_identifier?) | DeleteMcpOAuthTokenResponse(outcome) | 服务端删除 Mcp O Auth Token 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40971) |
| `ValidateMcpOAuthTokens` / Unary | ValidateMcpOAuthTokensRequest(server_urls[], service_account_id?, targets[], server_identifiers[]) | ValidateMcpOAuthTokensResponse(results[]) | 服务端校验 Mcp O Auth Tokens 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40977) |
| `CheckHttpMcpStatus` / Unary | CheckHttpMcpStatusRequest(server_ids[], oauth_redirect_uri, team_id?, service_account_id?, force_reauth, service_account_type?, post_auth_return_url?, …+6) | CheckHttpMcpStatusResponse(statuses[]) | 服务端校验 Http Mcp Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40983) |
| `RenameMcpOAuthAccount` / Unary | RenameMcpOAuthAccountRequest(server_id, account_key, new_account_key) | RenameMcpOAuthAccountResponse(empty) | 服务端执行 Rename Mcp O Auth Account 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40989) |
| `DeleteMcpOAuthAccount` / Unary | DeleteMcpOAuthAccountRequest(server_id, account_key) | DeleteMcpOAuthAccountResponse(empty) | 服务端删除 Mcp O Auth Account 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L40995) |
| `CompleteMcpOAuth` / Unary | CompleteMcpOAuthRequest(state_id, authorization_code) | CompleteMcpOAuthResponse(post_auth_return_url, account_key) | 服务端完成 Mcp O Auth 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41000) |
| `GetPluginMcpConfig` / Unary | GetPluginMcpConfigRequest(plugin_id) | GetPluginMcpConfigResponse(config_json, commit_sha) | 服务端读取 Plugin Mcp Config 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41002) |

### 团队策略面

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetTeamAdminSettingsOrEmptyIfNotInTeam` / Unary | GetTeamAdminSettingsRequest(team_id?) | GetTeamAdminSettingsResponse(allowed_models[], blocked_models[], auto_run_controls, cursor_ignore_controls, dot_cursor_protection, allowed_mcp_configuration?, background_agent_settings?, …+77) | 服务端读取 Team Admin Settings Or Empty If Not In Team 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L343](runtime-api-shapes.jsonl#L343)；[Proto](formatted/electron-main/proto.cjs#L41008) |

### Commerce、用量、试用与准入

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetXaiCommerceBearerToken` / Unary | GetXaiCommerceBearerTokenRequest(purpose) | GetXaiCommerceBearerTokenResponse(credential, refusal) | 服务端读取 Xai Commerce Bearer Token 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41014) |
| `GetCurrentPeriodUsage` / Unary | GetCurrentPeriodUsageRequest(team_id?, include_pooled_usage?) | GetCurrentPeriodUsageResponse(billing_cycle_start, billing_cycle_end, plan_usage, spend_limit_usage, display_threshold?, enabled, display_message, …+4) | 服务端读取 Current Period Usage 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L429](runtime-api-shapes.jsonl#L429)；[Proto](formatted/electron-main/proto.cjs#L41020) |
| `GetSandUsageStatus` / Unary | GetSandUsageStatusRequest(empty) | GetSandUsageStatusResponse(current_period_start, next_reset_timestamp_utc, usage_percent?, included_limit_zero, available_banked_reset_count, uses_pooled_enterprise_allowance, has_available_usage, …+15) | 服务端读取 Sand Usage Status 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L428](runtime-api-shapes.jsonl#L428)；[Proto](formatted/electron-main/proto.cjs#L41026) |
| `GetSandTrialClaimStatus` / Unary | GetSandTrialClaimStatusRequest(empty) | GetSandTrialClaimStatusResponse(status) | 服务端读取 Sand Trial Claim Status 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L430](runtime-api-shapes.jsonl#L430)；[Proto](formatted/electron-main/proto.cjs#L41032) |
| `CancelSandTrial` / Unary | CancelSandTrialRequest(empty) | CancelSandTrialResponse(empty) | 服务端取消 Sand Trial 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41037) |
| `GetSandAccessStatus` / Unary | GetSandAccessStatusRequest(empty) | GetSandAccessStatusResponse(state, purchase_channel, block_reason, purchasable_tiers[], is_paid_trial_plan?, unpaid_admin_needs_paid_seat, privacy_disclaimer_required, …+7) | 服务端读取 Sand Access Status 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L336](runtime-api-shapes.jsonl#L336)；[Proto](formatted/electron-main/proto.cjs#L41039) |

### 用户设备 Relay 注册与权限

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `RegisterSandMachine` / Unary | RegisterSandMachineRequest(label, local_tool_permission?, messages_enabled?, kind) | RegisterSandMachineResponse(credential, expires_at_ms, credential_held) | 服务端执行 Register Sand Machine 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L328](runtime-api-shapes.jsonl#L328)；[Proto](formatted/electron-main/proto.cjs#L41045) |
| `ListSandMachines` / Unary | ListSandMachinesRequest(empty) | ListSandMachinesResponse(machines[], current_machine_removed) | 服务端列举 Sand Machines 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L331](runtime-api-shapes.jsonl#L331)；[Proto](formatted/electron-main/proto.cjs#L41050) |
| `UpdateSandMachineLabel` / Unary | UpdateSandMachineLabelRequest(machine_id, label) | UpdateSandMachineLabelResponse(machine) | 服务端更新 Sand Machine Label 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41052) |
| `UpdateSandMachineLocalToolPermission` / Unary | UpdateSandMachineLocalToolPermissionRequest(machine_id, local_tool_permission) | UpdateSandMachineLocalToolPermissionResponse(machine) | 服务端更新 Sand Machine Local Tool Permission 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41058) |
| `GetSandMachineMessagesEnabled` / Unary | GetSandMachineMessagesEnabledRequest(machine_id) | GetSandMachineMessagesEnabledResponse(messages_enabled) | 服务端读取 Sand Machine Messages Enabled 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41064) |
| `UpdateSandMachineMessagesEnabled` / Unary | UpdateSandMachineMessagesEnabledRequest(machine_id, messages_enabled) | UpdateSandMachineMessagesEnabledResponse(machine) | 服务端更新 Sand Machine Messages Enabled 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41070) |
| `RemoveSandMachine` / Unary | RemoveSandMachineRequest(machine_id) | RemoveSandMachineResponse(empty) | 服务端移除 Sand Machine 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41076) |

### 账期、GitHub、Slack、用量与隐私

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetMonthlyBillingCycle` / Unary | GetMonthlyBillingCycleRequest(team_id?) | GetMonthlyBillingCycleResponse(start_date_epoch_millis, end_date_epoch_millis) | 服务端读取 Monthly Billing Cycle 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41082) |
| `GetGithubRepoAccessStatus` / Unary | GetGithubRepoAccessStatusRequest(repo_slug) | GetGithubRepoAccessStatusResponse(granted) | 服务端读取 Github Repo Access Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41088) |
| `GetSlackInstallUrl` / Unary | GetSlackInstallUrlRequest(team_id, repo_url?, source?, attempt_id?, grok_bot_callback_url?, site?) | GetSlackInstallUrlResponse(url, source, attempt_id) | 服务端读取 Slack Install Url 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41094) |
| `GetAggregatedUsageEvents` / Unary | GetAggregatedUsageEventsRequest(team_id, start_date?, end_date?, user_id?) | GetAggregatedUsageEventsResponse(aggregations[], total_input_tokens, total_output_tokens, total_cache_write_tokens, total_cache_read_tokens, total_cost_cents, percent_of_burst_used, …+1) | 服务端读取 Aggregated Usage Events 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41100) |
| `GetUserPrivacyMode` / Unary | GetUserPrivacyModeRequest(inferred_privacy_mode, team_id?) | GetUserPrivacyModeResponse(privacy_mode, hours_remaining_in_grace_period, is_enforced_by_team, is_not_migrated_to_server_source_of_truth, partner_data_share, has_acknowledged_grace_period_disclaimer, account_privacy_mode?) | 服务端读取 User Privacy Mode 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L268](runtime-api-shapes.jsonl#L268)；[Proto](formatted/electron-main/proto.cjs#L41106) |

### Canvas

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ListUserCanvases` / Unary | ListUserCanvasesRequest(page_size, page_token, shared_only) | ListUserCanvasesResponse(store_id?, canvases[], next_page_token?) | 服务端列举 User Canvases 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41111) |
| `GetCanvasMetadata` / Unary | GetCanvasMetadataRequest(store_id, canvas_id) | GetCanvasMetadataResponse(metadata) | 服务端读取 Canvas Metadata 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41113) |
| `GetCanvasPayload` / Unary | GetCanvasPayloadRequest(store_id, canvas_id) | GetCanvasPayloadResponse(metadata, render_bundle_gzip, data_json?) | 服务端读取 Canvas Payload 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41118) |
| `SetCanvasVisibility` / Unary | SetCanvasVisibilityRequest(store_id, canvas_id, visibility) | SetCanvasVisibilityResponse(visibility, page_url?, page_slug?) | 服务端设置 Canvas Visibility 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41120) |
| `SetPageAddress` / Unary | SetPageAddressRequest(store_id, canvas_id, slug) | SetPageAddressResponse(slug, page_url) | 服务端设置 Page Address 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41125) |
| `RenameCanvas` / Unary | RenameCanvasRequest(store_id, canvas_id, title) | RenameCanvasResponse(title) | 服务端执行 Rename Canvas 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41126) |

### 用户资料、Webhook 与客户端动作

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `UpdateUserName` / Unary | UpdateUserNameRequest(first_name, last_name) | UpdateUserNameResponse(empty) | 服务端更新 User Name 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41127) |
| `UploadUserProfilePicture` / Unary | UploadUserProfilePictureRequest(content_type, bytes) | UploadUserProfilePictureResponse(profile_picture_url) | 服务端上传 User Profile Picture 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41129) |
| `CreateAutomationWebhookApiKey` / Unary | CreateAutomationWebhookApiKeyRequest(automation_id, name?) | CreateAutomationWebhookApiKeyResponse(api_key) | 服务端创建 Automation Webhook Api Key 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41135) |
| `GetSlackUserSettings` / Unary | GetSlackUserSettingsRequest(team_id) | GetSlackUserSettingsResponse(has_slack_auth, default_repo, default_branch, default_model, can_show, open_pr_by_default, use_github_app_for_auto_draft_prs?, …+7) | 服务端读取 Slack User Settings 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41141) |
| `UnlinkSlackAccess` / Unary | UnlinkSlackAccessRequest(empty) | UnlinkSlackAccessResponse(success) | 服务端执行 Unlink Slack Access 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41147) |
| `ClientAction` / Unary | ClientActionRequest(action, args) | ClientActionResponse(success, error_message?, info_message?, open_url?, confirmation?) | 服务端执行 Client Action 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41152) |

### 插件市场与 Managed Skills

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ListMarketplacePlugins` / Unary | ListMarketplacePluginsRequest(search?, tags[], page_size?, page_token?, marketplace_id?, publisher_id?, skip_team_admin_filter?, …+1) | ListMarketplacePluginsResponse(plugins[], next_page_token?, has_more, superseded_plugin_popularity_ranks) | 服务端列举 Marketplace Plugins 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L282](runtime-api-shapes.jsonl#L282)；[Proto](formatted/electron-main/proto.cjs#L41154) |
| `InstallUserPlugin` / Unary | InstallUserPluginRequest(plugin_id, pinned_git_ref?, variables) | InstallUserPluginResponse(install) | 服务端执行 Install User Plugin 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41160) |
| `UpdateUserPluginInstall` / Unary | UpdateUserPluginInstallRequest(plugin_id, is_enabled?, pinned_git_ref?, variables) | UpdateUserPluginInstallResponse(install) | 服务端更新 User Plugin Install 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41166) |
| `UninstallUserPlugin` / Unary | UninstallUserPluginRequest(plugin_id) | UninstallUserPluginResponse(success) | 服务端卸载 User Plugin 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41172) |
| `GetTeamPluginPopularity` / Unary | GetTeamPluginPopularityRequest(team_id, use_replica?) | GetTeamPluginPopularityResponse(counts[]) | 服务端读取 Team Plugin Popularity 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41178) |
| `GetEffectiveUserPlugins` / Unary | GetEffectiveUserPluginsRequest(use_replica?, team_id?, exclude_configured_variables) | GetEffectiveUserPluginsResponse(plugins[], marketplaces[]) | 服务端读取 Effective User Plugins 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L342](runtime-api-shapes.jsonl#L342)；[Proto](formatted/electron-main/proto.cjs#L41184) |
| `ListMarketplaces` / Unary | ListMarketplacesRequest(empty) | ListMarketplacesResponse(marketplaces[]) | 服务端列举 Marketplaces 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L458](runtime-api-shapes.jsonl#L458)；[Proto](formatted/electron-main/proto.cjs#L41189) |
| `GetManagedSkills` / Unary | GetManagedSkillsRequest(empty) | GetManagedSkillsResponse(skills[]) | 服务端读取 Managed Skills 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41190) |

### 金融连接

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ListFinancialConnections` / Unary | ListFinancialConnectionsRequest(empty) | ListFinancialConnectionsResponse(connections[], pending_link_sessions, connect_url?) | 服务端列举 Financial Connections 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L624](runtime-api-shapes.jsonl#L624)；[Proto](formatted/electron-main/proto.cjs#L41192) |
| `ListFinancialAccounts` / Unary | ListFinancialAccountsRequest(empty) | ListFinancialAccountsResponse(accounts[]) | 服务端列举 Financial Accounts 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L625](runtime-api-shapes.jsonl#L625)；[Proto](formatted/electron-main/proto.cjs#L41198) |
| `DeleteFinancialConnection` / Unary | DeleteFinancialConnectionRequest(connection_id) | DeleteFinancialConnectionResponse(empty) | 服务端删除 Financial Connection 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41204) |
| `StartFinancialLink` / Unary | StartFinancialLinkRequest(return_to, repair_linked_bank) | StartFinancialLinkResponse(hosted_link_url, expires_at?) | 服务端启动 Financial Link 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L41210) |

## GrokBotService（309 路由）

主 Agent 控制面：Box/Harness、Transcript、Agent 注册、任务、自动化、记忆、插件、凭证、邮箱、会议、房间、模板、审批与用户设备 Relay。

推断可复刻为 Agent Registry + Harness Router + append-only Transcript Journal + Box Broker + Object Store + Secret Broker + Scheduler + Event Stream；Temporal.io、Kubernetes、Firecracker 均未被客户端证实。

### Box、存储、迁移、升级与团队运维

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `EnsureSandBox` / Unary | EnsureSandBoxRequest(wake?, supports_asleep_box?) | EnsureSandBoxResponse(cluster, tenant_id, pod_id, network_token, exec_daemon_auth_token, exec_daemon_url, vnc_url, …+8) | 按需唤醒或确保持久 Box 可用，并返回 Gateway/VNC/exec-daemon 等连接控制信息。 | 动态+静态：[capture L340](runtime-api-shapes.jsonl#L340)；[Proto](formatted/electron-main/proto.cjs#L63664) |
| `EnsureSandBoxWindow` / Unary | EnsureSandBoxWindowRequest(window_index) | EnsureSandBoxResponse(cluster, tenant_id, pod_id, network_token, exec_daemon_auth_token, exec_daemon_url, vnc_url, …+8) | 服务端确保存在或可用 Sand Box Window 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63666) |
| `RecreateSandBox` / Unary | RecreateSandBoxRequest(preserve_data, force, acknowledge_terminal_upgrade_schedule) | RecreateSandBoxResponse(started, reason, operation_id) | 服务端执行 Recreate Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63671) |
| `ForceRecreateSandBox` / Unary | ForceRecreateSandBoxRequest(empty) | RecreateSandBoxResponse(started, reason, operation_id) | 服务端执行 Force Recreate Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63673) |
| `AdminRecreateSandBox` / Unary | AdminRecreateSandBoxRequest(auth_id, flavor, preserve_data, force) | RecreateSandBoxResponse(started, reason, operation_id) | 管理员侧执行 Recreate Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63679) |
| `AdminForceRecreateSandBox` / Unary | AdminForceRecreateSandBoxRequest(auth_id, flavor) | RecreateSandBoxResponse(started, reason, operation_id) | 管理员侧执行 Force Recreate Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63685) |
| `AdminBreakGlassDeleteSandBoxPod` / Unary | AdminBreakGlassDeleteSandBoxPodRequest(auth_id, flavor, pod_id, cluster, actor_email) | AdminBreakGlassDeleteSandBoxPodResponse(deleted, reason, started, recreate_reason, operation_id) | 管理员侧执行 Break Glass Delete Sand Box Pod 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63691) |
| `PresignSandBoxStoreWrites` / Unary | PresignSandBoxStoreWritesRequest(files[]) | PresignSandBoxStoreWritesResponse(instructions[]) | 服务端签发预签名访问 Sand Box Store Writes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63697) |
| `CompleteSandBoxStoreMultipartWrites` / Unary | CompleteSandBoxStoreMultipartWritesRequest(completions[]) | CompleteSandBoxStoreMultipartWritesResponse(results[]) | 服务端完成 Sand Box Store Multipart Writes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63703) |
| `CommitSandBoxStoreManifest` / Unary | CommitSandBoxStoreManifestRequest(manifest, base_etag) | CommitSandBoxStoreManifestResponse(status, etag) | 服务端提交 Sand Box Store Manifest 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63709) |
| `AbortSandBoxStoreMultipartWrites` / Unary | AbortSandBoxStoreMultipartWritesRequest(uploads[]) | AbortSandBoxStoreMultipartWritesResponse(results[]) | 服务端中止 Sand Box Store Multipart Writes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63715) |
| `PresignSandBoxStoreReads` / Unary | PresignSandBoxStoreReadsRequest(rel_paths[]) | PresignSandBoxStoreReadsResponse(instructions[]) | 服务端签发预签名访问 Sand Box Store Reads 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63721) |
| `StatSandBoxStoreObject` / Unary | StatSandBoxStoreObjectRequest(rel_path) | StatSandBoxStoreObjectResponse(exists, etag, size_bytes, last_modified_ms) | 服务端执行 Stat Sand Box Store Object 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63727) |
| `ListSandBoxStoreObjects` / Unary | ListSandBoxStoreObjectsRequest(prefix, cursor, max_entries) | ListSandBoxStoreObjectsResponse(entries[], next_cursor, truncated) | 服务端列举 Sand Box Store Objects 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63733) |
| `AdminGetSandBoxStoreStatus` / Unary | AdminSandBoxStoreStatusRequest(auth_id, flavor) | AdminSandBoxStoreStatusResponse(durable, entry_count, total_bytes, last_snapshot_at_ms, reachable) | 管理员侧读取 Sand Box Store Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63739) |
| `AdminUpdateSandBoxHost` / Unary | AdminUpdateSandBoxHostRequest(auth_id, flavor, force) | AdminUpdateSandBoxHostResponse(started, reason, version) | 管理员侧更新 Sand Box Host 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63745) |
| `AdminGetSandBoxHostStatus` / Unary | AdminSandBoxHostStatusRequest(auth_id, flavor) | AdminSandBoxHostStatusResponse(gateway_reachable, host_version?, host_update_available?, latest_host_version?, is_busy?, last_busy_at_ms?) | 管理员侧读取 Sand Box Host Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63751) |
| `AdminSnapshotSandBoxStore` / Unary | AdminSnapshotSandBoxStoreRequest(auth_id, flavor) | AdminSnapshotSandBoxStoreResponse(ok, manifest_entries, files_uploaded, reason) | 管理员侧执行 Snapshot Sand Box Store 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63757) |
| `AdminListSandBoxStoreManifestVersions` / Unary | AdminListSandBoxStoreManifestVersionsRequest(auth_id, flavor, cursor, max_versions, parse_limit, before_timestamp_ms?) | AdminListSandBoxStoreManifestVersionsResponse(store_id, versions[], next_cursor, truncated, time_scan_capped) | 管理员侧列举 Sand Box Store Manifest Versions 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63763) |
| `AdminStatSandBoxStoreObject` / Unary | AdminStatSandBoxStoreObjectRequest(s3_link) | AdminStatSandBoxStoreObjectResponse(bucket, key, exists, version_id, size_bytes, last_modified_ms, etag, …+8) | 管理员侧执行 Stat Sand Box Store Object 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63769) |
| `AdminRestoreSandBoxStoreSnapshot` / Unary | AdminRestoreSandBoxStoreSnapshotRequest(auth_id, flavor, manifest_version_id, expected_entry_count?) | AdminRestoreSandBoxStoreSnapshotResponse(started, reason, operation_id, current_entry_count, target_entry_count) | 管理员侧执行 Restore Sand Box Store Snapshot 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63775) |
| `AdminHibernateSandBox` / Unary | AdminHibernateSandBoxRequest(auth_id, flavor, force) | AdminHibernateSandBoxResponse(started, reason) | 管理员侧执行 Hibernate Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63781) |
| `AdminRefreshSandBoxEgress` / Unary | AdminRefreshSandBoxEgressRequest(auth_id, flavor, trigger, team_id?) | AdminRefreshSandBoxEgressResponse(status, auth_id, cluster, tenant_id, pod_id, runtime_applied, http_proxy_rule_count, …+6) | 管理员侧执行 Refresh Sand Box Egress 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63787) |
| `AdminListSandAgents` / Unary | AdminListSandAgentsRequest(auth_id, flavor) | AdminListSandAgentsResponse(reachable, agents_json, reason) | 管理员侧列举 Sand Agents 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63793) |
| `AdminGetSandAgentTranscriptPage` / Unary | AdminGetSandAgentTranscriptPageRequest(auth_id, flavor, agent_id, before_seq, limit, since_ms, until_ms, …+1) | AdminGetSandAgentTranscriptPageResponse(reachable, entries_json, reason, next_before_seq, session_id) | 管理员侧读取 Sand Agent Transcript Page 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63799) |
| `WatchSandBoxMigration` / ServerStreaming | WatchSandBoxMigrationRequest(from_offset_key, include_finished) | SandBoxMigrationEvent(phase, detail, at_ms, offset_key, operation_id) | 服务端持续订阅 Sand Box Migration 对应资源或流程，并通过服务端流返回增量结果；具体内部实现仅能由契约推断。 | 动态+静态：[capture L337](runtime-api-shapes.jsonl#L337)；[Proto](formatted/electron-main/proto.cjs#L63805) |
| `AdminWatchSandBoxMigration` / ServerStreaming | AdminWatchSandBoxMigrationRequest(auth_id, flavor, from_offset_key) | SandBoxMigrationEvent(phase, detail, at_ms, offset_key, operation_id) | 管理员侧持续订阅 Sand Box Migration 对应资源或流程，并通过服务端流返回增量结果；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63811) |
| `GetSandBoxRunState` / Unary | GetSandBoxRunStateRequest(empty) | GetSandBoxRunStateResponse(state, image_update_available?, egress_tunnel_ownership?, image) | 服务端读取 Sand Box Run State 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L1251](runtime-api-shapes.jsonl#L1251)；[Proto](formatted/electron-main/proto.cjs#L63817) |
| `GetSandBoxUpgradeSchedule` / Unary | GetSandBoxUpgradeScheduleRequest(empty) | GetSandBoxUpgradeScheduleResponse(schedule) | 服务端读取 Sand Box Upgrade Schedule 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L642](runtime-api-shapes.jsonl#L642)；[Proto](formatted/electron-main/proto.cjs#L63823) |
| `ScheduleSandBoxUpgrade` / Unary | ScheduleSandBoxUpgradeRequest(timezone, local_time, recurring) | ScheduleSandBoxUpgradeResponse(schedule) | 服务端执行 Schedule Sand Box Upgrade 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63829) |
| `CancelSandBoxUpgrade` / Unary | CancelSandBoxUpgradeRequest(dismiss_terminal_outcome) | CancelSandBoxUpgradeResponse(schedule) | 服务端取消 Sand Box Upgrade 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63835) |
| `RescheduleSandBoxUpgrade` / Unary | RescheduleSandBoxUpgradeRequest(timezone, local_time, recurring) | RescheduleSandBoxUpgradeResponse(schedule) | 服务端执行 Reschedule Sand Box Upgrade 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63841) |
| `ListSandBoxes` / Unary | ListSandBoxesRequest(empty) | ListSandBoxesResponse(boxes[]) | 服务端列举 Sand Boxes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63846) |
| `NotifySandAgentTurnFinished` / Unary | NotifySandAgentTurnFinishedRequest(agent_id, agent_name, message_preview, last_message_id, awaiting_user_response, member_agent_ids[], sender_agent_id, …+1) | NotifySandAgentTurnFinishedResponse(empty) | 服务端通知 Sand Agent Turn Finished 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63848) |
| `ListSandSetupManifests` / Unary | ListSandSetupManifestsRequest(include_team_secrets) | ListSandSetupManifestsResponse(schema_version, manifests[], team_secrets[]) | 服务端列举 Sand Setup Manifests 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63854) |
| `ListTeamSandSetupManifests` / Unary | ListTeamSandSetupManifestsRequest(empty) | ListTeamSandSetupManifestsResponse(team_id, can_manage, manifests[]) | 服务端列举 Team Sand Setup Manifests 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63860) |
| `SaveTeamSandSetupManifest` / Unary | SaveTeamSandSetupManifestRequest(manifest_id, expected_etag, entries[]) | SaveTeamSandSetupManifestResponse(manifest) | 服务端保存 Team Sand Setup Manifest 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63866) |
| `DeleteTeamSandSetupManifest` / Unary | DeleteTeamSandSetupManifestRequest(manifest_id, expected_etag) | DeleteTeamSandSetupManifestResponse(empty) | 服务端删除 Team Sand Setup Manifest 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63872) |
| `ListTeamGroupSandSetupManifests` / Unary | ListTeamGroupSandSetupManifestsRequest(group_public_id) | ListTeamGroupSandSetupManifestsResponse(team_id, can_manage, manifests[]) | 服务端列举 Team Group Sand Setup Manifests 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63878) |
| `SaveTeamGroupSandSetupManifest` / Unary | SaveTeamGroupSandSetupManifestRequest(group_id, manifest_id, expected_etag, entries[]) | SaveTeamGroupSandSetupManifestResponse(manifest) | 服务端保存 Team Group Sand Setup Manifest 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63884) |
| `DeleteTeamGroupSandSetupManifest` / Unary | DeleteTeamGroupSandSetupManifestRequest(group_id, manifest_id, expected_etag) | DeleteTeamGroupSandSetupManifestResponse(empty) | 服务端删除 Team Group Sand Setup Manifest 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63890) |
| `DeleteTeamGrokBot` / Unary | DeleteTeamGrokBotRequest(team_id, agent_id) | DeleteTeamGrokBotResponse(slack_app_removal) | 服务端删除 Team Grok Bot 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63896) |
| `ListTeamMemberSandBoxes` / Unary | ListTeamMemberSandBoxesRequest(team_id, user_id) | ListTeamMemberSandBoxesResponse(user_id, email, name, boxes[], scan_incomplete) | 服务端列举 Team Member Sand Boxes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63902) |
| `KillTeamMemberSandBox` / Unary | KillTeamMemberSandBoxRequest(team_id, user_id, pod_id, cluster) | KillTeamMemberSandBoxResponse(killed, reason, deleted_count) | 服务端执行 Kill Team Member Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63908) |
| `RecreateTeamMemberSandBox` / Unary | RecreateTeamMemberSandBoxRequest(team_id, user_id, force) | RecreateSandBoxResponse(started, reason, operation_id) | 服务端执行 Recreate Team Member Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63914) |
| `GetTeamMemberSandBoxMigrationStatus` / Unary | GetTeamMemberSandBoxMigrationStatusRequest(team_id, user_id, operation_id) | GetTeamMemberSandBoxMigrationStatusResponse(event?) | 服务端读取 Team Member Sand Box Migration Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63920) |
| `StartBulkTeamMemberSandBoxOperation` / Unary | StartBulkTeamMemberSandBoxOperationRequest(team_id, user_ids[], action, force, operation_id, clear_sand_box_restart_required) | StartBulkTeamMemberSandBoxOperationResponse(operation_id) | 服务端启动 Bulk Team Member Sand Box Operation 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63926) |
| `GetBulkTeamMemberSandBoxOperationStatus` / Unary | GetBulkTeamMemberSandBoxOperationStatusRequest(team_id, operation_id) | GetBulkTeamMemberSandBoxOperationStatusResponse(operation_id, action, state, total_count, queued_count, running_count, succeeded_count, …+5) | 服务端读取 Bulk Team Member Sand Box Operation Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63932) |
| `MintSandVoiceCallSecret` / Unary | MintSandVoiceCallSecretRequest(model) | MintSandVoiceCallSecretResponse(client_secret, expires_at_unix_seconds, model, websocket_url) | 服务端签发短期凭证 Sand Voice Call Secret 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63938) |

### 1Password 连接与凭证审批

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `BeginOnePasswordConnection` / Unary | BeginOnePasswordConnectionRequest(connection_id, vault_id, service_account_token) | BeginOnePasswordConnectionResponse(mint_ticket, connection_id, expected_generation, expiration_mode, provider_expires_in_seconds, credential_expires_at_ms, ticket_expires_at_ms, …+3) | 服务端发起 One Password Connection 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63944) |
| `CompleteOnePasswordConnection` / Unary | CompleteOnePasswordConnectionRequest(mint_ticket, service_account_token, account_uuid, account_email, account_url) | OnePasswordState(connections[], items[]) | 服务端完成 One Password Connection 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63950) |
| `GetOnePasswordState` / Unary | GetOnePasswordStateRequest(empty) | OnePasswordState(connections[], items[]) | 服务端读取 One Password State 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L341](runtime-api-shapes.jsonl#L341)；[Proto](formatted/electron-main/proto.cjs#L63956) |
| `SyncOnePasswordConnections` / Unary | SyncOnePasswordConnectionsRequest(trigger) | OnePasswordState(connections[], items[]) | 服务端同步 One Password Connections 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L1242](runtime-api-shapes.jsonl#L1242)；[Proto](formatted/electron-main/proto.cjs#L63962) |
| `DeleteOnePasswordConnection` / Unary | DeleteOnePasswordConnectionRequest(connection_id) | OnePasswordState(connections[], items[]) | 服务端删除 One Password Connection 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63968) |
| `StartOnePasswordOAuth` / Unary | StartOnePasswordOAuthRequest(connection_id, connect_link, locale) | StartOnePasswordOAuthResponse(authorize_url, state, expires_at_ms, redirect_uri, connect_url?) | 服务端启动 One Password O Auth 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63974) |
| `StoreOnePasswordIntegrationKey` / Unary | StoreOnePasswordIntegrationKeyRequest(state, integration_key) | StoreOnePasswordIntegrationKeyResponse(connection_id) | 服务端执行 Store One Password Integration Key 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63980) |
| `CompleteOnePasswordOAuth` / Unary | CompleteOnePasswordOAuthRequest(state, code, error) | OnePasswordState(connections[], items[]) | 服务端完成 One Password O Auth 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63986) |
| `ApproveOnePasswordCredentialRequest` / Unary | ApproveOnePasswordCredentialRequestRequest(entry_id, agent_id, credential_id, connection_id, catalog_revision, target_site, harness) | OnePasswordCredentialDecisionResponse(ok, detail) | 服务端批准 One Password Credential Request 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63992) |
| `DenyOnePasswordCredentialRequest` / Unary | DenyOnePasswordCredentialRequestRequest(entry_id, agent_id, harness) | OnePasswordCredentialDecisionResponse(ok, detail) | 服务端拒绝 One Password Credential Request 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L63998) |

### Transcript、附件与客户端 Presence

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `CommitGrokBotTranscriptEntries` / Unary | CommitGrokBotTranscriptEntriesRequest(agent_id, generation, entries[], deletes[], session_id) | CommitGrokBotTranscriptEntriesResponse(committed_count, deleted_count, rejections[]) | 服务端提交 Grok Bot Transcript Entries 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64004) |
| `ListGrokBotTranscriptEntries` / Unary | ListGrokBotTranscriptEntriesRequest(agent_id, generation?, before_seq?, limit, session_id, unread_boundary_ms?) | ListGrokBotTranscriptEntriesResponse(entries[], generation, cloud_agent_peer_ids[], cloud_agent_peer_ids_known, unread_anchor?) | 服务端列举 Grok Bot Transcript Entries 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L354](runtime-api-shapes.jsonl#L354)；[Proto](formatted/electron-main/proto.cjs#L64010) |
| `WatchGrokBotTranscripts` / ServerStreaming | WatchGrokBotTranscriptsRequest(cursors[], include_unlisted_agents?, inline_body_max_bytes) | GrokBotTranscriptWatchFrame(connected, rows, cleared, cursor_too_old, heartbeat, agent_state, computer_actions, …+5) | 以服务端流持续推送 Transcript、Roster、Agent/Box 状态和计算机动作等增量帧。 | 动态+静态：[capture L360](runtime-api-shapes.jsonl#L360)；[Proto](formatted/electron-main/proto.cjs#L64016) |
| `SetGrokBotAgentClientState` / Unary | SetGrokBotAgentClientStateRequest(agent_id, mark_read?, mark_unread?, notifications_enabled?, notify_on_updates_enabled?, hidden_from_sidebar?) | SetGrokBotAgentClientStateResponse(state) | 服务端设置 Grok Bot Agent Client State 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L906](runtime-api-shapes.jsonl#L906)；[Proto](formatted/electron-main/proto.cjs#L64022) |
| `ListGrokBotAgentStatuses` / Unary | ListGrokBotAgentStatusesRequest(agent_ids[]) | ListGrokBotAgentStatusesResponse(statuses[]) | 服务端列举 Grok Bot Agent Statuses 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64028) |
| `ListGrokBotAgentSessions` / Unary | ListGrokBotAgentSessionsRequest(agent_id) | ListGrokBotAgentSessionsResponse(sessions[]) | 服务端列举 Grok Bot Agent Sessions 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64034) |
| `ReadGrokBotAgentAttachmentChunk` / Unary | ReadGrokBotAgentAttachmentChunkRequest(path, offset, length, session_id?) | ReadGrokBotAgentAttachmentChunkResponse(data, total_size) | 服务端读取 Grok Bot Agent Attachment Chunk 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L400](runtime-api-shapes.jsonl#L400)；[Proto](formatted/electron-main/proto.cjs#L64040) |
| `ResolveGrokBotAttachmentReads` / Unary | ResolveGrokBotAttachmentReadsRequest(agent_id, session_id?, paths[]) | ResolveGrokBotAttachmentReadsResponse(reads[]) | 服务端处理 Grok Bot Attachment Reads 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L350](runtime-api-shapes.jsonl#L350)；[Proto](formatted/electron-main/proto.cjs#L64046) |
| `ReadGrokBotGroupChatDocument` / Unary | ReadGrokBotGroupChatDocumentRequest(group_chat_id, store_id, document_id) | ReadGrokBotGroupChatDocumentResponse(content, assets[]) | 服务端读取 Grok Bot Group Chat Document 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64052) |
| `ReadGrokBotGroupChatCanvas` / Unary | ReadGrokBotGroupChatCanvasRequest(group_chat_id, store_id, canvas_id) | ReadGrokBotGroupChatCanvasResponse(render_bundle_gzip, data_json?) | 服务端读取 Grok Bot Group Chat Canvas 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64058) |
| `ReadGrokBotMcpAppDocument` / Unary | ReadGrokBotMcpAppDocumentRequest(agent_id, session_id, entry_id) | ReadGrokBotMcpAppDocumentResponse(html, meta_json?) | 服务端读取 Grok Bot Mcp App Document 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64064) |
| `UploadGrokBotAgentAttachmentChunk` / Unary | UploadGrokBotAgentAttachmentChunkRequest(agent_id, upload_id, file_name, offset, total_size, data, sha256_hex?, …+1) | UploadGrokBotAgentAttachmentChunkResponse(received_bytes, path?) | 服务端上传 Grok Bot Agent Attachment Chunk 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64070) |
| `BeginGrokBotAttachmentUpload` / Unary | BeginGrokBotAttachmentUploadRequest(agent_id, session_id?, file_name, size_bytes, supports_store_attachment_refs, supports_multipart, sha256_hex?) | BeginGrokBotAttachmentUploadResponse(mode, use_box_reason, refusal, limit_bytes, upload_token, session_expires_at_ms, put, …+2) | 服务端发起 Grok Bot Attachment Upload 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64076) |
| `PresignGrokBotAttachmentUploadParts` / Unary | PresignGrokBotAttachmentUploadPartsRequest(upload_token, parts[]) | PresignGrokBotAttachmentUploadPartsResponse(refusal, parts[], put) | 服务端签发预签名访问 Grok Bot Attachment Upload Parts 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64082) |
| `CompleteGrokBotAttachmentUpload` / Unary | CompleteGrokBotAttachmentUploadRequest(upload_token) | CompleteGrokBotAttachmentUploadResponse(refusal, limit_bytes, alias, file_name, size_bytes, content_type) | 服务端完成 Grok Bot Attachment Upload 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64088) |
| `AbortGrokBotAttachmentUpload` / Unary | AbortGrokBotAttachmentUploadRequest(upload_token) | AbortGrokBotAttachmentUploadResponse(empty) | 服务端中止 Grok Bot Attachment Upload 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64094) |
| `ReportGrokBotClientPresence` / Unary | ReportGrokBotClientPresenceRequest(agent_id, viewing, surface, trigger, intent?) | ReportGrokBotClientPresenceResponse(presence_ttl_ms, intent_action?, intent_reason?) | 服务端上报 Grok Bot Client Presence 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L1222](runtime-api-shapes.jsonl#L1222)；[Proto](formatted/electron-main/proto.cjs#L64100) |
| `ReportGrokBotDesktopActivity` / Unary | ReportGrokBotDesktopActivityRequest(install_id, active) | ReportGrokBotDesktopActivityResponse(lease_ms) | 服务端上报 Grok Bot Desktop Activity 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64106) |
| `ReportGrokBotNotificationPermission` / Unary | ReportGrokBotNotificationPermissionRequest(platform, device_id, os_permission, os_setting?, alert_setting?, can_ask_again?, in_app_enabled?) | ReportGrokBotNotificationPermissionResponse(empty) | 服务端上报 Grok Bot Notification Permission 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L359](runtime-api-shapes.jsonl#L359)；[Proto](formatted/electron-main/proto.cjs#L64112) |
| `ReportSandBoxHostState` / Unary | ReportSandBoxHostStateRequest(disk_pressure?, host_version?, host_update_available?) | ReportSandBoxHostStateResponse(empty) | 服务端上报 Sand Box Host State 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64118) |

### 自动化、Todo、Task、Subagent、Library 与 Skill

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ListGrokBotAgentAutomations` / Unary | ListGrokBotAgentAutomationsRequest(agent_id, time_zone?) | ListGrokBotAgentAutomationsResponse(automations[]) | 服务端列举 Grok Bot Agent Automations 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L345](runtime-api-shapes.jsonl#L345)；[Proto](formatted/electron-main/proto.cjs#L64124) |
| `ListGrokBotAccountAutomations` / Unary | ListGrokBotAccountAutomationsRequest(time_zone?, agent_ids[]) | ListGrokBotAccountAutomationsResponse(agents[]) | 服务端列举 Grok Bot Account Automations 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64130) |
| `ListGrokBotAgentTodos` / Unary | ListGrokBotAgentTodosRequest(agent_id) | ListGrokBotAgentTodosResponse(todos[]) | 服务端列举 Grok Bot Agent Todos 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64136) |
| `ListGrokBotAgentTasks` / Unary | ListGrokBotAgentTasksRequest(agent_id, include_recently_done?) | ListGrokBotAgentTasksResponse(tasks[]) | 服务端列举 Grok Bot Agent Tasks 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64142) |
| `ListGrokBotSubagents` / Unary | ListGrokBotSubagentsRequest(agent_id) | ListGrokBotSubagentsResponse(subagents[]) | 服务端列举 Grok Bot Subagents 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L349](runtime-api-shapes.jsonl#L349)；[Proto](formatted/electron-main/proto.cjs#L64148) |
| `MarkGrokBotAgentTaskDone` / Unary | MarkGrokBotAgentTaskDoneRequest(agent_id, task_id) | MarkGrokBotAgentTaskDoneResponse(tasks[]) | 服务端标记 Grok Bot Agent Task Done 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64154) |
| `MarkGrokBotAgentTaskRead` / Unary | MarkGrokBotAgentTaskReadRequest(agent_id, task_id, entry_id) | MarkGrokBotAgentTaskReadResponse(tasks[]) | 服务端标记 Grok Bot Agent Task Read 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64160) |
| `ListGrokBotLibraryDocs` / Unary | ListGrokBotLibraryDocsRequest(agent_id) | ListGrokBotLibraryDocsResponse(docs[]) | 服务端列举 Grok Bot Library Docs 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64166) |
| `KeepGrokBotTaskList` / Unary | KeepGrokBotTaskListRequest(agent_id, messages[], is_awaiting_user, has_background_work, turn_end, finished_work[]) | KeepGrokBotTaskListResponse(tasks[]) | 服务端执行 Keep Grok Bot Task List 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64172) |
| `ListGrokBotTasks` / Unary | ListGrokBotTasksRequest(agent_id, session_id) | ListGrokBotTasksResponse(tasks[]) | 服务端列举 Grok Bot Tasks 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64177) |
| `DismissGrokBotTask` / Unary | DismissGrokBotTaskRequest(agent_id, session_id, task_id) | DismissGrokBotTaskResponse(tasks[]) | 服务端执行 Dismiss Grok Bot Task 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64179) |
| `MarkGrokBotTasksSeen` / Unary | MarkGrokBotTasksSeenRequest(agent_id, session_id, task_ids[]) | MarkGrokBotTasksSeenResponse(tasks[]) | 服务端标记 Grok Bot Tasks Seen 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64185) |
| `SetGrokBotAgentAutomationEnabled` / Unary | SetGrokBotAgentAutomationEnabledRequest(agent_id, automation_id, is_enabled, time_zone?) | SetGrokBotAgentAutomationEnabledResponse(automations[]) | 服务端设置 Grok Bot Agent Automation Enabled 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64191) |
| `DeleteGrokBotAgentAutomation` / Unary | DeleteGrokBotAgentAutomationRequest(agent_id, automation_id, time_zone?) | DeleteGrokBotAgentAutomationResponse(automations[]) | 服务端删除 Grok Bot Agent Automation 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64197) |
| `ListGrokBotAgentSkills` / Unary | ListGrokBotAgentSkillsRequest(agent_id) | ListGrokBotAgentSkillsResponse(skills[]) | 服务端列举 Grok Bot Agent Skills 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64203) |

### 用户 MCP、Runtime、权限、Main Agent 与条款

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetGrokBotUserMcpSettings` / Unary | GetGrokBotUserMcpSettingsRequest(empty) | GetGrokBotUserMcpSettingsResponse(settings) | 服务端读取 Grok Bot User Mcp Settings 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L726](runtime-api-shapes.jsonl#L726)；[Proto](formatted/electron-main/proto.cjs#L64209) |
| `SetGrokBotUserMcpSettings` / Unary | SetGrokBotUserMcpSettingsRequest(settings, keep_disabled_tools) | SetGrokBotUserMcpSettingsResponse(settings) | 服务端设置 Grok Bot User Mcp Settings 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64215) |
| `GetGrokBotUserRuntimeSettings` / Unary | GetGrokBotUserRuntimeSettingsRequest(empty) | GetGrokBotUserRuntimeSettingsResponse(settings) | 服务端读取 Grok Bot User Runtime Settings 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L333](runtime-api-shapes.jsonl#L333)；[Proto](formatted/electron-main/proto.cjs#L64221) |
| `UpdateGrokBotUserRuntimeSettings` / Unary | UpdateGrokBotUserRuntimeSettingsRequest(pinned_agents?, sidebar_sections?, has_seen_onboarding?, auto_review_instructions?, x_tool_access?) | UpdateGrokBotUserRuntimeSettingsResponse(settings) | 服务端更新 Grok Bot User Runtime Settings 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64227) |
| `GetGrokBotMcpToolPermissions` / Unary | GetGrokBotMcpToolPermissionsRequest(empty) | GetGrokBotMcpToolPermissionsResponse(servers[]) | 服务端读取 Grok Bot Mcp Tool Permissions 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64233) |
| `SetGrokBotMcpToolPermissions` / Unary | SetGrokBotMcpToolPermissionsRequest(server_id, tools, reads?, writes?) | SetGrokBotMcpToolPermissionsResponse(server) | 服务端设置 Grok Bot Mcp Tool Permissions 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64239) |
| `SetGrokBotMainAgent` / Unary | SetGrokBotMainAgentRequest(agent_id) | SetGrokBotMainAgentResponse(settings) | 服务端设置 Grok Bot Main Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64245) |
| `EnsureGrokBotDefaultMainAgent` / Unary | EnsureGrokBotDefaultMainAgentRequest(empty) | EnsureGrokBotDefaultMainAgentResponse(agent_id, outcome) | 服务端确保存在或可用 Grok Bot Default Main Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64251) |
| `MarkGrokBotTermsSeen` / Unary | MarkGrokBotTermsSeenRequest(empty) | MarkGrokBotTermsSeenResponse(terms_seen_at_ms) | 服务端标记 Grok Bot Terms Seen 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64257) |
| `GetGrokBotTermsSeen` / Unary | GetGrokBotTermsSeenRequest(empty) | GetGrokBotTermsSeenResponse(terms_seen_at_ms?) | 服务端读取 Grok Bot Terms Seen 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64263) |

### Agent Registry、Harness、发布、ACL 与 Voice

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `CreateGrokBotAgent` / Unary | CreateGrokBotAgentRequest(legacy_agent_id, name, description, title, avatar_shape, avatar_color, avatar_data_url?, …+10) | CreateGrokBotAgentResponse(agent, harness) | 服务端创建 Grok Bot Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64269) |
| `CreateGrokBotTemporalAgent` / Unary | CreateGrokBotAgentRequest(legacy_agent_id, name, description, title, avatar_shape, avatar_color, avatar_data_url?, …+10) | CreateGrokBotAgentResponse(agent, harness) | 服务端创建 Grok Bot Temporal Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64275) |
| `ListGrokBotAgents` / Unary | ListGrokBotAgentsRequest(role?, include_team_agents?, added_team_agents_only?) | ListGrokBotAgentsResponse(agents[], slack_connections[], truncated, teams_connections[]) | 服务端列举 Grok Bot Agents 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L408](runtime-api-shapes.jsonl#L408)；[Proto](formatted/electron-main/proto.cjs#L64281) |
| `ListGrokBotTeamAgents` / Unary | ListGrokBotTeamAgentsRequest(role?) | ListGrokBotTeamAgentsResponse(entries[], slack_connections[], teams_connections[]) | 服务端列举 Grok Bot Team Agents 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L497](runtime-api-shapes.jsonl#L497)；[Proto](formatted/electron-main/proto.cjs#L64287) |
| `GetGrokBotRuntimeCapabilities` / Unary | GetGrokBotRuntimeCapabilitiesRequest(empty) | GetGrokBotRuntimeCapabilitiesResponse(capabilities) | 服务端读取 Grok Bot Runtime Capabilities 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L370](runtime-api-shapes.jsonl#L370)；[Proto](formatted/electron-main/proto.cjs#L64293) |
| `ListDeletedGrokBotAgentIds` / Unary | ListDeletedGrokBotAgentIdsRequest(agent_ids[]) | ListDeletedGrokBotAgentIdsResponse(agent_ids[]) | 服务端列举 Deleted Grok Bot Agent Ids 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64299) |
| `EnsureGrokBotBoxHarnessMigrationPass` / Unary | EnsureGrokBotBoxHarnessMigrationPassRequest(operation_id, box_rooms[]) | EnsureGrokBotBoxHarnessMigrationPassResponse(state) | 服务端确保存在或可用 Grok Bot Box Harness Migration Pass 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64305) |
| `SetGrokBotAgentVisibility` / Unary | SetGrokBotAgentVisibilityRequest(agent_id, visibility, personal_secret_names[]) | SetGrokBotAgentVisibilityResponse(agent, outcome) | 服务端设置 Grok Bot Agent Visibility 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64311) |
| `CloneGrokBotAgentToTeam` / Unary | CloneGrokBotAgentToTeamRequest(agent_id, personal_secret_names[], offer_entry_id, in_place) | CloneGrokBotAgentToTeamResponse(outcome, agent) | 服务端克隆 Grok Bot Agent To Team 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64317) |
| `PublishGrokBotAgent` / Unary | PublishGrokBotAgentRequest(agent_id) | PublishGrokBotAgentResponse(agent, outcome) | 服务端发布 Grok Bot Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64323) |
| `UnpublishGrokBotAgent` / Unary | UnpublishGrokBotAgentRequest(agent_id) | UnpublishGrokBotAgentResponse(agent, outcome) | 服务端取消发布 Grok Bot Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64329) |
| `AddGrokBotAgentManager` / Unary | AddGrokBotAgentManagerRequest(agent_id, user_id) | AddGrokBotAgentManagerResponse(empty) | 服务端执行 Add Grok Bot Agent Manager 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64335) |
| `RemoveGrokBotAgentManager` / Unary | RemoveGrokBotAgentManagerRequest(agent_id, user_id) | RemoveGrokBotAgentManagerResponse(empty) | 服务端移除 Grok Bot Agent Manager 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64341) |
| `ListGrokBotAgentManagers` / Unary | ListGrokBotAgentManagersRequest(agent_id) | ListGrokBotAgentManagersResponse(manager_user_ids[]) | 服务端列举 Grok Bot Agent Managers 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64347) |
| `SetGrokBotAgentMeetingsVisibility` / Unary | SetGrokBotAgentMeetingsVisibilityRequest(agent_id, visibility) | SetGrokBotAgentMeetingsVisibilityResponse(empty) | 服务端设置 Grok Bot Agent Meetings Visibility 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64353) |
| `ListGrokBotAgentMeetings` / Unary | ListGrokBotAgentMeetingsRequest(agent_id, fresh) | ListGrokBotAgentMeetingsResponse(visible, meetings[], visibility, own_meeting_ids[]) | 服务端列举 Grok Bot Agent Meetings 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64359) |
| `AddGrokBotAgentAccessPrincipal` / Unary | AddGrokBotAgentAccessPrincipalRequest(agent_id, principal) | AddGrokBotAgentAccessPrincipalResponse(empty) | 服务端执行 Add Grok Bot Agent Access Principal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64365) |
| `RemoveGrokBotAgentAccessPrincipal` / Unary | RemoveGrokBotAgentAccessPrincipalRequest(agent_id, principal) | RemoveGrokBotAgentAccessPrincipalResponse(empty) | 服务端移除 Grok Bot Agent Access Principal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64371) |
| `ListGrokBotAgentAccessPrincipals` / Unary | ListGrokBotAgentAccessPrincipalsRequest(agent_id) | ListGrokBotAgentAccessPrincipalsResponse(principals[], creator_user_id, team_row_on?) | 服务端列举 Grok Bot Agent Access Principals 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64377) |
| `GetGrokBotAgentAccess` / Unary | GetGrokBotAgentAccessRequest(agent_id) | GetGrokBotAgentAccessResponse(state, creator_user_id, deleted_group_ids[]) | 服务端读取 Grok Bot Agent Access 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64383) |
| `UpdateGrokBotAgentAccess` / Unary | UpdateGrokBotAgentAccessRequest(agent_id, update) | UpdateGrokBotAgentAccessResponse(state, creator_user_id, deleted_group_ids[]) | 服务端更新 Grok Bot Agent Access 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64389) |
| `GetGrokBotAgentLinkAccess` / Unary | GetGrokBotAgentLinkAccessRequest(agent_id) | GetGrokBotAgentLinkAccessResponse(access) | 服务端读取 Grok Bot Agent Link Access 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64395) |
| `UpdateGrokBotAgent` / Unary | UpdateGrokBotAgentRequest(id, name?, description?, title?, avatar_shape?, avatar_color?, clear_avatar, …+2) | UpdateGrokBotAgentResponse(agent) | 服务端更新 Grok Bot Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64401) |
| `SetGrokBotAgentVoice` / Unary | SetGrokBotAgentVoiceRequest(id, voice_id?, voice_speed?, voice_language?) | SetGrokBotAgentVoiceResponse(agent) | 服务端设置 Grok Bot Agent Voice 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64407) |
| `SetGrokBotAgentDraftingDisabled` / Unary | SetGrokBotAgentDraftingDisabledRequest(id, disabled) | SetGrokBotAgentDraftingDisabledResponse(empty) | 服务端设置 Grok Bot Agent Drafting Disabled 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64413) |
| `DeleteGrokBotAgent` / Unary | DeleteGrokBotAgentRequest(id) | DeleteGrokBotAgentResponse(empty) | 服务端删除 Grok Bot Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64419) |

### Secrets、Vault、Email、Plugin 与 Agent Files

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ListGrokBotSecrets` / Unary | ListGrokBotSecretsRequest(id) | ListGrokBotSecretsResponse(secrets[]) | 服务端列举 Grok Bot Secrets 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64425) |
| `PutGrokBotSecret` / Unary | PutGrokBotSecretRequest(id, name, description, value) | PutGrokBotSecretResponse(secret) | 服务端写入 Grok Bot Secret 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64430) |
| `DeleteGrokBotSecret` / Unary | DeleteGrokBotSecretRequest(id, name) | DeleteGrokBotSecretResponse(empty) | 服务端删除 Grok Bot Secret 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64432) |
| `ListGrokBotVaultCredentials` / Unary | ListGrokBotVaultCredentialsRequest(empty) | ListGrokBotVaultCredentialsResponse(credentials[]) | 服务端列举 Grok Bot Vault Credentials 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L650](runtime-api-shapes.jsonl#L650)；[Proto](formatted/electron-main/proto.cjs#L64438) |
| `PutGrokBotVaultCredential` / Unary | PutGrokBotVaultCredentialRequest(id, title, username, notes, sites[], password) | PutGrokBotVaultCredentialResponse(credential) | 服务端写入 Grok Bot Vault Credential 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64444) |
| `DeleteGrokBotVaultCredential` / Unary | DeleteGrokBotVaultCredentialRequest(id) | DeleteGrokBotVaultCredentialResponse(empty) | 服务端删除 Grok Bot Vault Credential 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64450) |
| `CreateGrokBotEmailInbox` / Unary | CreateGrokBotEmailInboxRequest(username, display_name) | CreateGrokBotEmailInboxResponse(inbox) | 服务端创建 Grok Bot Email Inbox 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64456) |
| `ListGrokBotEmailInboxes` / Unary | ListGrokBotEmailInboxesRequest(empty) | ListGrokBotEmailInboxesResponse(inboxes[]) | 服务端列举 Grok Bot Email Inboxes 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L652](runtime-api-shapes.jsonl#L652)；[Proto](formatted/electron-main/proto.cjs#L64462) |
| `CheckGrokBotEmailAddressAvailability` / Unary | CheckGrokBotEmailAddressAvailabilityRequest(usernames[]) | CheckGrokBotEmailAddressAvailabilityResponse(results[]) | 服务端校验 Grok Bot Email Address Availability 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64468) |
| `DeleteGrokBotEmailInbox` / Unary | DeleteGrokBotEmailInboxRequest(email) | DeleteGrokBotEmailInboxResponse(empty) | 服务端删除 Grok Bot Email Inbox 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64474) |
| `SendGrokBotEmail` / Unary | SendGrokBotEmailRequest(from_inbox_email, to[], cc[], bcc[], subject, text_body, html_body?, …+4) | SendGrokBotEmailResponse(message_id, thread_id, provider_message_id, suppressed_recipients[]) | 服务端发送 Grok Bot Email 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64479) |
| `SearchGrokBotEmailThreads` / Unary | SearchGrokBotEmailThreadsRequest(query, inbox_email?, from_address?, after_ms?, before_ms?, limit, mode) | SearchGrokBotEmailThreadsResponse(threads[]) | 服务端搜索 Grok Bot Email Threads 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64481) |
| `ReadGrokBotEmailThread` / Unary | ReadGrokBotEmailThreadRequest(thread_id, max_messages, body_max_chars) | ReadGrokBotEmailThreadResponse(messages[], truncated_older_count) | 服务端读取 Grok Bot Email Thread 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64487) |
| `ReadGrokBotEmailAttachment` / Unary | ReadGrokBotEmailAttachmentRequest(attachment_id) | ReadGrokBotEmailAttachmentResponse(attachment, text, data) | 服务端读取 Grok Bot Email Attachment 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64493) |
| `GetGrokBotAgentPlugins` / Unary | GetGrokBotAgentPluginsRequest(agent_id, include_mcp_config) | GetGrokBotAgentPluginsResponse(marketplace?, plugins[]) | 服务端读取 Grok Bot Agent Plugins 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64499) |
| `SetGrokBotAgentPlugins` / Unary | SetGrokBotAgentPluginsRequest(agent_id, plugins[]) | SetGrokBotAgentPluginsResponse(marketplace, plugins[]) | 服务端设置 Grok Bot Agent Plugins 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64505) |
| `SetGrokBotAgentPluginVariables` / Unary | SetGrokBotAgentPluginVariablesRequest(agent_id, plugin_id, variables, merge_with_stored) | SetGrokBotAgentPluginVariablesResponse(marketplace, plugins[]) | 服务端设置 Grok Bot Agent Plugin Variables 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64511) |
| `UpdateGrokBotAgentMarketplace` / Unary | UpdateGrokBotAgentMarketplaceRequest(agent_id, display_name?, description?) | UpdateGrokBotAgentMarketplaceResponse(marketplace) | 服务端更新 Grok Bot Agent Marketplace 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64517) |
| `AddGrokBotAgentSkill` / Unary | AddGrokBotAgentSkillRequest(agent_id, name?, description?, content) | AddGrokBotAgentSkillResponse(marketplace, plugins[], skill) | 服务端执行 Add Grok Bot Agent Skill 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64523) |
| `UpdateGrokBotAgentSkill` / Unary | UpdateGrokBotAgentSkillRequest(agent_id, name, description?, content) | UpdateGrokBotAgentSkillResponse(marketplace, plugins[], skill) | 服务端更新 Grok Bot Agent Skill 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64529) |
| `RemoveGrokBotAgentSkill` / Unary | RemoveGrokBotAgentSkillRequest(agent_id, name) | RemoveGrokBotAgentSkillResponse(marketplace, plugins[]) | 服务端移除 Grok Bot Agent Skill 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64535) |
| `GetGrokBotAgentPluginFile` / Unary | GetGrokBotAgentPluginFileRequest(agent_id, plugin_id, path) | GetGrokBotAgentPluginFileResponse(content) | 服务端读取 Grok Bot Agent Plugin File 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64541) |
| `BeginGrokBotAgentFileUpload` / Unary | BeginGrokBotAgentFileUploadRequest(agent_id, file_name, size_bytes, sha256_hex, content_type) | BeginGrokBotAgentFileUploadResponse(upload_token, final_name, url, headers, expires_at_ms) | 服务端发起 Grok Bot Agent File Upload 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64547) |
| `FinishGrokBotAgentFileUpload` / Unary | FinishGrokBotAgentFileUploadRequest(agent_id, upload_token) | FinishGrokBotAgentFileUploadResponse(file) | 服务端完成 Grok Bot Agent File Upload 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64553) |
| `ListGrokBotAgentFiles` / Unary | ListGrokBotAgentFilesRequest(agent_id, page_token) | ListGrokBotAgentFilesResponse(files[], next_page_token, total_bytes, can_edit) | 服务端列举 Grok Bot Agent Files 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64559) |
| `DeleteGrokBotAgentFile` / Unary | DeleteGrokBotAgentFileRequest(agent_id, name) | DeleteGrokBotAgentFileResponse(empty) | 服务端删除 Grok Bot Agent File 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64565) |

### 团队上下文、记忆、模板与公共市场

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetGrokBotTeamContextSummary` / Unary | GetGrokBotTeamContextSummaryRequest(agent_id) | GetGrokBotTeamContextSummaryResponse(summary?, stale, skills[], learned[], memory_count) | 服务端读取 Grok Bot Team Context Summary 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64571) |
| `ListGrokBotUserBotMemories` / Unary | ListGrokBotUserBotMemoriesRequest(agent_id) | ListGrokBotUserBotMemoriesResponse(memories[]) | 读取 Agent 私有事实记忆。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64577) |
| `PromoteGrokBotMemoriesToTeam` / Unary | PromoteGrokBotMemoriesToTeamRequest(agent_id, fact_ids[]) | PromoteGrokBotMemoriesToTeamResponse(created[], already_in_team[], kept_private_count) | 将选定私有事实提升为团队共享记忆，并返回去重/保留结果。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64583) |
| `CreateGrokBotTemplate` / Unary | CreateGrokBotTemplateRequest(name, avatar_shape, avatar_color, source_agent_id, blob_content_type?, blob_byte_size?, description, …+1) | CreateGrokBotTemplateResponse(template, blob_put_url?, version) | 服务端创建 Grok Bot Template 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64589) |
| `ListGrokBotTemplates` / Unary | ListGrokBotTemplatesRequest(empty) | ListGrokBotTemplatesResponse(templates[], export_policy?) | 服务端列举 Grok Bot Templates 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64595) |
| `DeleteGrokBotTemplate` / Unary | DeleteGrokBotTemplateRequest(share_id) | DeleteGrokBotTemplateResponse(empty) | 服务端删除 Grok Bot Template 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64601) |
| `SetGrokBotTemplateVisibility` / Unary | SetGrokBotTemplateVisibilityRequest(share_id, visibility) | SetGrokBotTemplateVisibilityResponse(template) | 服务端设置 Grok Bot Template Visibility 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64607) |
| `ActivateGrokBotTemplateVersion` / Unary | ActivateGrokBotTemplateVersionRequest(share_id, version) | ActivateGrokBotTemplateVersionResponse(template) | 服务端执行 Activate Grok Bot Template Version 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64613) |
| `GetGrokBotTemplateVersion` / Unary | GetGrokBotTemplateVersionRequest(share_id, version) | GetGrokBotTemplateVersionResponse(version, active, created_at_ms, blob_object_key, blob_get_url, visibility) | 服务端读取 Grok Bot Template Version 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64619) |
| `GetGrokBotTemplateForSourceAgent` / Unary | GetGrokBotTemplateForSourceAgentRequest(source_agent_id) | GetGrokBotTemplateForSourceAgentResponse(template?, export_policy?, has_team?) | 服务端读取 Grok Bot Template For Source Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L366](runtime-api-shapes.jsonl#L366)；[Proto](formatted/electron-main/proto.cjs#L64625) |
| `GetGrokBotTemplateExportPolicy` / Unary | GetGrokBotTemplateExportPolicyRequest(empty) | GetGrokBotTemplateExportPolicyResponse(export_policy?, has_team?) | 服务端读取 Grok Bot Template Export Policy 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L357](runtime-api-shapes.jsonl#L357)；[Proto](formatted/electron-main/proto.cjs#L64631) |
| `GetPublicGrokBotTemplate` / Unary | GetPublicGrokBotTemplateRequest(share_id) | GetPublicGrokBotTemplateResponse(template, owner_display_name) | 服务端读取 Public Grok Bot Template 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64637) |
| `ListPublicGrokBotMarketplaceListings` / Unary | ListPublicGrokBotMarketplaceListingsRequest(category?, page_size, page_token) | ListPublicGrokBotMarketplaceListingsResponse(featured_listings[], listings[], next_page_token, all_categories_order[]) | 服务端列举 Public Grok Bot Marketplace Listings 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64643) |
| `GetPublicGrokBotMarketplaceListing` / Unary | GetPublicGrokBotMarketplaceListingRequest(slug) | GetPublicGrokBotMarketplaceListingResponse(listing, template_get_url) | 服务端读取 Public Grok Bot Marketplace Listing 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64649) |
| `GetGrokBotTemplateImportDetails` / Unary | GetGrokBotTemplateImportDetailsRequest(share_id) | GetGrokBotTemplateImportDetailsResponse(template, blob_get_url, expected_active_version, creator_display_name) | 服务端读取 Grok Bot Template Import Details 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64655) |
| `CreateGrokBotAgentFromTemplate` / Unary | CreateGrokBotAgentFromTemplateRequest(share_id, agent_id, expected_active_version?, first_party_template?, creator_context?, setup_delegation_supported?, language?, …+1) | CreateGrokBotAgentFromTemplateResponse(agent, blob_get_url?, setup_handled_by_server, conversational_setup_enabled, getting_started_trusted, update_state_split) | 服务端创建 Grok Bot Agent From Template 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64661) |

### 消息、运行控制、Widget/Form、审批与支付卡

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `SendGrokBotUserMessage` / Unary | SendGrokBotUserMessageRequest(agent_id, message_id, text, sent_at_ms, rich_text?, reply_to_id?, is_fork, …+13) | SendGrokBotUserMessageResponse(dispatched, mode, workflow_id?, delivery, refusal?) | 校验并幂等接纳用户消息，选择 Harness/工作流并返回投递或拒绝状态。 | 动态+静态：[capture L1459](runtime-api-shapes.jsonl#L1459)；[Proto](formatted/electron-main/proto.cjs#L64667) |
| `GetGrokBotSendStatus` / Unary | GetGrokBotSendStatusRequest(agent_id, message_id, session_id) | GetGrokBotSendStatusResponse(status, echo_entry_id?, rejection_code?, accepted_at_ms?) | 服务端读取 Grok Bot Send Status 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L1686](runtime-api-shapes.jsonl#L1686)；[Proto](formatted/electron-main/proto.cjs#L64673) |
| `StartGrokBotImagePrecaption` / Unary | StartGrokBotImagePrecaptionRequest(image, mime_type, draft_text, prior_user_messages[], agent_id) | StartGrokBotImagePrecaptionResponse(outcome, content_sha256) | 服务端启动 Grok Bot Image Precaption 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64679) |
| `GetGrokBotCloudAgentWatchers` / Unary | GetGrokBotCloudAgentWatchersRequest(bc_id) | GetGrokBotCloudAgentWatchersResponse(watchers[]) | 服务端读取 Grok Bot Cloud Agent Watchers 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64685) |
| `InterruptGrokBotAgentRun` / Unary | InterruptGrokBotAgentRunRequest(agent_id, reason, session_id?) | InterruptGrokBotAgentRunResponse(had_active_run) | 服务端执行 Interrupt Grok Bot Agent Run 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64691) |
| `StartFreshGrokBotConversation` / Unary | StartFreshGrokBotConversationRequest(agent_id, session_id?) | StartFreshGrokBotConversationResponse(empty) | 服务端启动 Fresh Grok Bot Conversation 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64697) |
| `RollBackGrokBotConversation` / Unary | RollBackGrokBotConversationRequest(agent_id, session_id?) | RollBackGrokBotConversationResponse(empty) | 服务端执行 Roll Back Grok Bot Conversation 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64703) |
| `RespondGrokBotWidget` / Unary | RespondGrokBotWidgetRequest(agent_id, entry_id, value, session_id) | RespondGrokBotWidgetResponse(accepted, refusal?) | 服务端执行 Respond Grok Bot Widget 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64709) |
| `SubmitGrokBotSecret` / Unary | SubmitGrokBotSecretRequest(agent_id, entry_id, value, session_id) | SubmitGrokBotSecretResponse(accepted, refusal?) | 服务端提交 Grok Bot Secret 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64715) |
| `ResolveGrokBotCredentialRequest` / Unary | ResolveGrokBotCredentialRequestRequest(agent_id, entry_id, resolution, session_id) | ResolveGrokBotCredentialRequestResponse(accepted, refusal?) | 服务端处理 Grok Bot Credential Request 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64721) |
| `DismissGrokBotWidget` / Unary | DismissGrokBotWidgetRequest(agent_id, entry_id, session_id) | DismissGrokBotWidgetResponse(accepted, refusal?) | 服务端执行 Dismiss Grok Bot Widget 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64727) |
| `SubmitGrokBotUserForm` / Unary | SubmitGrokBotUserFormRequest(agent_id, entry_id, values, session_id, platform, save_to_vault) | SubmitGrokBotUserFormResponse(accepted, refusal?) | 服务端提交 Grok Bot User Form 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64733) |
| `DismissGrokBotUserForm` / Unary | DismissGrokBotUserFormRequest(agent_id, entry_id, mode, session_id, platform) | DismissGrokBotUserFormResponse(accepted, refusal?) | 服务端执行 Dismiss Grok Bot User Form 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64739) |
| `SendGrokBotDraft` / Unary | SendGrokBotDraftRequest(agent_id, entry_id, session_id, email, slack, meeting_chat, shown_signature_html?) | SendGrokBotDraftResponse(accepted, refusal?) | 服务端发送 Grok Bot Draft 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64744) |
| `DiscardGrokBotDraft` / Unary | DiscardGrokBotDraftRequest(agent_id, entry_id, session_id) | DiscardGrokBotDraftResponse(accepted, refusal?) | 服务端执行 Discard Grok Bot Draft 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64746) |
| `ReactToGrokBotMessage` / Unary | ReactToGrokBotMessageRequest(agent_id, entry_id, emoji, session_id) | ReactToGrokBotMessageResponse(refusal?) | 服务端执行 React To Grok Bot Message 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64752) |
| `VoteGrokBotFeedback` / Unary | VoteGrokBotFeedbackRequest(agent_id, entry_id, action, categories[], comment?, session_id) | VoteGrokBotFeedbackResponse(refusal?) | 服务端执行 Vote Grok Bot Feedback 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64758) |
| `SendGrokBotAgentMessage` / Unary | SendGrokBotAgentMessageRequest(from_agent_id, to_agent_id, message_id, text, sent_at_ms, reply_to_id?) | SendGrokBotAgentMessageResponse(delivery, target_agent_id, target_name, workflow_id?) | 服务端发送 Grok Bot Agent Message 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64764) |
| `ResolveGrokBotAutoReviewApproval` / Unary | ResolveGrokBotAutoReviewApprovalRequest(agent_id, request_id, resolution, approval_platform, approved_command?, session_id?, meeting_join?) | ResolveGrokBotAutoReviewApprovalResponse(dispatched, workflow_id?) | 服务端处理 Grok Bot Auto Review Approval 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64770) |
| `ResolveGrokBotLocalToolPermission` / Unary | ResolveGrokBotLocalToolPermissionRequest(agent_id, entry_id, request_id, resolution, session_id?) | ResolveGrokBotLocalToolPermissionResponse(dispatched, workflow_id?, refusal?) | 服务端处理 Grok Bot Local Tool Permission 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64776) |
| `ResolveGrokBotConnectorGrant` / Unary | ResolveGrokBotConnectorGrantRequest(agent_id, request_id, resolution, session_id?, entry_id?) | ResolveGrokBotConnectorGrantResponse(dispatched, workflow_id?, refusal?) | 服务端处理 Grok Bot Connector Grant 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64782) |
| `ClearGrokBotConnectorAlwaysAllow` / Unary | ClearGrokBotConnectorAlwaysAllowRequest(empty) | ClearGrokBotConnectorAlwaysAllowResponse(cleared_count) | 服务端清理 Grok Bot Connector Always Allow 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64788) |
| `RaiseGrokBotVirtualCard` / Unary | RaiseGrokBotVirtualCardRequest(agent_id, amount_cents, currency, merchant_name, merchant_url, context) | RaiseGrokBotVirtualCardResponse(outcome, request_id, merchant_name?, superseded_request_id?) | 服务端执行 Raise Grok Bot Virtual Card 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64794) |
| `ResolveGrokBotVirtualCardApproval` / Unary | ResolveGrokBotVirtualCardApprovalRequest(agent_id, entry_id, request_id, resolution, payment_method_id?, attestation?) | ResolveGrokBotVirtualCardApprovalResponse(outcome, spend_request_id?, approval_url?, message?, refusal?, enrolled_credential_ids[]) | 服务端处理 Grok Bot Virtual Card Approval 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64800) |
| `ListGrokBotStripeLinkPaymentMethods` / Unary | ListGrokBotStripeLinkPaymentMethodsRequest(empty) | ListGrokBotStripeLinkPaymentMethodsResponse(outcome, payment_methods[], unavailable_count) | 服务端列举 Grok Bot Stripe Link Payment Methods 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64806) |

### Passkey 与 Spend Approval

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `StartPasskeyEnrollment` / Unary | StartPasskeyEnrollmentRequest(empty) | StartPasskeyEnrollmentResponse(empty) | 服务端启动 Passkey Enrollment 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64812) |
| `VerifyPasskeyEnrollmentCode` / Unary | VerifyPasskeyEnrollmentCodeRequest(code) | VerifyPasskeyEnrollmentCodeResponse(enrollment_ticket) | 服务端执行 Verify Passkey Enrollment Code 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64818) |
| `BeginPasskeyRegistration` / Unary | BeginPasskeyRegistrationRequest(enrollment_ticket) | BeginPasskeyRegistrationResponse(ceremony_id, creation_options_json, ceremony_path, ceremony_token) | 服务端发起 Passkey Registration 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64824) |
| `FinishPasskeyRegistration` / Unary | FinishPasskeyRegistrationRequest(ceremony_token, attestation_json, name) | FinishPasskeyRegistrationResponse(credential_id) | 服务端完成 Passkey Registration 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64830) |
| `GetPasskeyCeremony` / Unary | GetPasskeyCeremonyRequest(ceremony_token) | GetPasskeyCeremonyResponse(kind, options_json, spend?) | 服务端读取 Passkey Ceremony 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64836) |
| `GetPasskeyCeremonyStatus` / Unary | GetPasskeyCeremonyStatusRequest(ceremony_id) | GetPasskeyCeremonyStatusResponse(status) | 服务端读取 Passkey Ceremony Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64842) |
| `ListPasskeys` / Unary | ListPasskeysRequest(empty) | ListPasskeysResponse(passkeys[]) | 服务端列举 Passkeys 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64847) |
| `RevokePasskey` / Unary | RevokePasskeyRequest(credential_id) | RevokePasskeyResponse(empty) | 服务端撤销 Passkey 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64848) |
| `BeginGrokBotSpendApproval` / Unary | BeginGrokBotSpendApprovalRequest(agent_id, request_id, payment_method_id?, mode, enrollment_ticket?) | BeginGrokBotSpendApprovalResponse(ceremony_id, challenge_id, request_options_json, creation_options_json, ceremony_path, ceremony_token) | 服务端发起 Grok Bot Spend Approval 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64850) |
| `FinishGrokBotSpendApprovalAssertion` / Unary | FinishGrokBotSpendApprovalAssertionRequest(ceremony_token, challenge_id, assertion_json, registration?) | FinishGrokBotSpendApprovalAssertionResponse(credential_id) | 服务端完成 Grok Bot Spend Approval Assertion 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64856) |

### 用户设备 Relay、会议、Handoff、Room 与 PR Chat

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `IssueGrokBotUserComputerCredential` / Unary | IssueGrokBotUserComputerCredentialRequest(machine_id, credential) | IssueGrokBotUserComputerCredentialResponse(credential, expires_at_ms, server_authoritative) | 服务端签发凭证 Grok Bot User Computer Credential 对应资源或流程；具体内部实现仅能由契约推断。 | 动态+静态：[capture L418](runtime-api-shapes.jsonl#L418)；[Proto](formatted/electron-main/proto.cjs#L64862) |
| `WatchGrokBotUserComputerRequests` / ServerStreaming | WatchGrokBotUserComputerRequestsRequest(machine_id, credential, hello) | WatchGrokBotUserComputerRequestsEvent(connected, notify, heartbeat) | 建立用户设备 Relay 的服务端流，承载 connected/notify/heartbeat。 | 动态+静态：[capture L465](runtime-api-shapes.jsonl#L465)；[Proto](formatted/electron-main/proto.cjs#L64868) |
| `PollGrokBotUserComputerRequests` / Unary | PollGrokBotUserComputerRequestsRequest(machine_id, credential, ack_ids[], limit) | PollGrokBotUserComputerRequestsResponse(requests[]) | 服务端轮询 Grok Bot User Computer Requests 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64874) |
| `SubmitGrokBotUserComputerResponses` / Unary | SubmitGrokBotUserComputerResponsesRequest(machine_id, credential, frames[]) | SubmitGrokBotUserComputerResponsesResponse(accepted_count) | 服务端提交 Grok Bot User Computer Responses 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64880) |
| `ListGrokBotUserComputers` / Unary | ListGrokBotUserComputersRequest(empty) | ListGrokBotUserComputersResponse(computers[]) | 服务端列举 Grok Bot User Computers 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64886) |
| `PullGrokBotMeetings` / Unary | PullGrokBotMeetingsRequest(machine_id, wait_ms) | PullGrokBotMeetingsResponse(reply_json) | 服务端执行 Pull Grok Bot Meetings 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64892) |
| `ReportGrokBotMeetings` / Unary | ReportGrokBotMeetingsRequest(machine_id, report_json) | ReportGrokBotMeetingsResponse(empty) | 服务端上报 Grok Bot Meetings 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64898) |
| `ListGrokBotServerMeetings` / Unary | ListGrokBotServerMeetingsRequest(since_ms, agent_id) | ListGrokBotServerMeetingsResponse(meetings[]) | 服务端列举 Grok Bot Server Meetings 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64904) |
| `LeaveGrokBotServerMeeting` / Unary | LeaveGrokBotServerMeetingRequest(meeting_id, agent_id) | LeaveGrokBotServerMeetingResponse(empty) | 服务端执行 Leave Grok Bot Server Meeting 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64910) |
| `GetGrokBotMeetingRecord` / Unary | GetGrokBotMeetingRecordRequest(meeting_id, agent_id) | GetGrokBotMeetingRecordResponse(meeting, machine_id, display_name, failure, channel_closed, summary_text?, summary_updated_at_ms?, …+4) | 服务端读取 Grok Bot Meeting Record 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64916) |
| `OpenGrokBotUserComputerRequest` / ServerStreaming | OpenGrokBotUserComputerRequestRequest(machine_id, frame, idempotency_key) | GrokBotUserComputerResponseFrame(request_id, client, control, file, file_error, messages_result, messages_error, …+5) | 打开单个用户设备请求的服务端流，返回控制、文件、消息和本地工具结果帧。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64922) |
| `CancelGrokBotUserComputerRequest` / Unary | CancelGrokBotUserComputerRequestRequest(machine_id, request_id) | CancelGrokBotUserComputerRequestResponse(empty) | 服务端取消 Grok Bot User Computer Request 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64928) |
| `EndGrokBotBoxHandoff` / Unary | EndGrokBotBoxHandoffRequest(agent_id, request_id, trigger) | EndGrokBotBoxHandoffResponse(dispatched, workflow_id?) | 服务端执行 End Grok Bot Box Handoff 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64934) |
| `RequestGrokBotRoomMemberTurn` / Unary | RequestGrokBotRoomMemberTurnRequest(nonce, room, member_agent_id, peers[], new_messages[], is_winding_down, deadline_ms, …+2) | RequestGrokBotRoomMemberTurnResponse(dispatch, member_agent_id, workflow_id?) | 服务端执行 Request Grok Bot Room Member Turn 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64940) |
| `CancelGrokBotRoomMemberTurn` / Unary | CancelGrokBotRoomMemberTurnRequest(nonce, member_agent_id, reason) | CancelGrokBotRoomMemberTurnResponse(delivered) | 服务端取消 Grok Bot Room Member Turn 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64946) |
| `DeliverGrokBotRoomMemberTurnResult` / Unary | DeliverGrokBotRoomMemberTurnResultRequest(room_id, nonce, member_agent_id, outcome, messages[], error, posts[]) | DeliverGrokBotRoomMemberTurnResultResponse(intake) | 服务端执行 Deliver Grok Bot Room Member Turn Result 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64952) |
| `CreateGrokBotRoom` / Unary | CreateGrokBotRoomRequest(agent_id, name, description, member_agent_ids[], human_member_user_ids[]) | CreateGrokBotRoomResponse(agent) | 服务端创建 Grok Bot Room 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64958) |
| `SetGrokBotRoomMembers` / Unary | SetGrokBotRoomMembersRequest(agent_id, member_agent_ids[]) | SetGrokBotRoomMembersResponse(agent) | 服务端设置 Grok Bot Room Members 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64964) |
| `AddGrokBotRoomPeople` / Unary | AddGrokBotRoomPeopleRequest(agent_id, user_ids[]) | AddGrokBotRoomPeopleResponse(agent) | 服务端执行 Add Grok Bot Room People 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64970) |
| `RemoveGrokBotRoomPeople` / Unary | RemoveGrokBotRoomPeopleRequest(agent_id, user_ids[]) | RemoveGrokBotRoomPeopleResponse(agent) | 服务端移除 Grok Bot Room People 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64976) |
| `EnsureGrokBotPullRequestChat` / Unary | EnsureGrokBotPullRequestChatRequest(origin_org, origin_repo, change_number) | EnsureGrokBotPullRequestChatResponse(room, blocked) | 服务端确保存在或可用 Grok Bot Pull Request Chat 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64982) |
| `ListGrokBotPullRequestChatEntries` / Unary | ListGrokBotPullRequestChatEntriesRequest(room_agent_id, before_seq?, limit) | ListGrokBotTranscriptEntriesResponse(entries[], generation, cloud_agent_peer_ids[], cloud_agent_peer_ids_known, unread_anchor?) | 服务端列举 Grok Bot Pull Request Chat Entries 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64988) |
| `SendGrokBotPullRequestChatMessage` / Unary | SendGrokBotPullRequestChatMessageRequest(room_agent_id, message_id, text, sent_at_ms) | SendGrokBotPullRequestChatMessageResponse(delivery, refusal?) | 服务端发送 Grok Bot Pull Request Chat Message 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L64994) |

### Slack 与 Teams

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetGrokBotSlackInstallState` / Unary | GetGrokBotSlackInstallStateRequest(agent_id) | GetGrokBotSlackInstallStateResponse(status, slack_team_id?, workspace_name?, workspaces[], needs_manifest_update, pending_reinstall_approval, oauth_authorize_url?, …+7) | 服务端读取 Grok Bot Slack Install State 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65000) |
| `StartGrokBotSlackConnect` / Unary | StartGrokBotSlackConnectRequest(agent_id) | StartGrokBotSlackConnectResponse(url, outcome) | 服务端启动 Grok Bot Slack Connect 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65006) |
| `InstallGrokBotSlackApp` / Unary | InstallGrokBotSlackAppRequest(agent_id, slack_team_id?, replace_existing_app) | InstallGrokBotSlackAppResponse(outcome, slack_team_id?, workspace_name?, oauth_authorize_url?, workspaces[], slack_error?, retry_after_seconds?, …+5) | 服务端执行 Install Grok Bot Slack App 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65012) |
| `ReinstallGrokBotSlackApp` / Unary | ReinstallGrokBotSlackAppRequest(agent_id, automatic) | ReinstallGrokBotSlackAppResponse(outcome, slack_team_id?, workspace_name?, slack_error?, retry_after_seconds?, oauth_authorize_url?, approval_request_filed?) | 服务端执行 Reinstall Grok Bot Slack App 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65018) |
| `UninstallGrokBotSlackApp` / Unary | UninstallGrokBotSlackAppRequest(agent_id, forget_if_unreachable) | UninstallGrokBotSlackAppResponse(outcome, slack_team_id?, slack_error?, retry_after_seconds?, forgotten?, workspace_name?) | 服务端卸载 Grok Bot Slack App 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65024) |
| `GetGrokBotTeamsInstallState` / Unary | GetGrokBotTeamsInstallStateRequest(agent_id) | GetGrokBotTeamsInstallStateResponse(state, tenant_id?, tenant_display_name?, catalog_app_id?, manager_is_admin, installed_teams[], approval_request_filed_at_ms?, …+5) | 服务端读取 Grok Bot Teams Install State 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65030) |
| `StartGrokBotTeamsConnect` / Unary | StartGrokBotTeamsConnectRequest(agent_id, request_admin_scopes, grant_scope_team) | StartGrokBotTeamsConnectResponse(consent_url, nonce) | 服务端启动 Grok Bot Teams Connect 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65036) |
| `InstallGrokBotTeamsApp` / Unary | InstallGrokBotTeamsAppRequest(agent_id, tenant_id?, team_ids[], install_personal) | InstallGrokBotTeamsAppResponse(state, failure_reason?, tenants[]) | 服务端执行 Install Grok Bot Teams App 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65042) |
| `ReinstallGrokBotTeamsApp` / Unary | ReinstallGrokBotTeamsAppRequest(agent_id, tenant_id?) | ReinstallGrokBotTeamsAppResponse(state, failure_reason?, tenants[]) | 服务端执行 Reinstall Grok Bot Teams App 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65048) |
| `UninstallGrokBotTeamsApp` / Unary | UninstallGrokBotTeamsAppRequest(agent_id) | UninstallGrokBotTeamsAppResponse(state, catalog_removal_pending_admin) | 服务端卸载 Grok Bot Teams App 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65054) |
| `AddGrokBotTeamsAppToTeam` / Unary | AddGrokBotTeamsAppToTeamRequest(agent_id, team_id, team_ids[], install_personal) | AddGrokBotTeamsAppToTeamResponse(team, failure_reason?, teams[], installed_personal) | 服务端执行 Add Grok Bot Teams App To Team 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65060) |

### 内部 Marketplace 与 Harness Migration

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `CreateGrokBotMarketplaceListingInternal` / Unary | CreateGrokBotMarketplaceListingInternalRequest(template_id, slug, category, creator_id, category_ids[]) | GrokBotMarketplaceListing(id, template_id, pinned_template_version_id, blob_object_key, name, description, image_url, …+9) | 服务端创建 Grok Bot Marketplace Listing Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65066) |
| `ListGrokBotMarketplaceListingsInternal` / Unary | ListGrokBotMarketplaceListingsInternalRequest(status?, category?, template_id?, page_size, page_token) | ListGrokBotMarketplaceListingsInternalResponse(listings[], next_page_token) | 服务端列举 Grok Bot Marketplace Listings Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65072) |
| `GetGrokBotMarketplaceListingInternal` / Unary | GetGrokBotMarketplaceListingInternalRequest(listing_id) | GrokBotMarketplaceListing(id, template_id, pinned_template_version_id, blob_object_key, name, description, image_url, …+9) | 服务端读取 Grok Bot Marketplace Listing Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65078) |
| `UpdateGrokBotMarketplaceListingInternal` / Unary | UpdateGrokBotMarketplaceListingInternalRequest(listing_id, slug?, category?, name?, description?, image_url, default_avatar, …+3) | GrokBotMarketplaceListing(id, template_id, pinned_template_version_id, blob_object_key, name, description, image_url, …+9) | 服务端更新 Grok Bot Marketplace Listing Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65084) |
| `SetGrokBotMarketplaceListingStatusInternal` / Unary | SetGrokBotMarketplaceListingStatusInternalRequest(listing_id, status) | GrokBotMarketplaceListing(id, template_id, pinned_template_version_id, blob_object_key, name, description, image_url, …+9) | 服务端设置 Grok Bot Marketplace Listing Status Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65090) |
| `PresignGrokBotMarketplaceImageUploadInternal` / Unary | PresignGrokBotMarketplaceImageUploadInternalRequest(listing_id, image_kind, content_type, byte_size) | PresignGrokBotMarketplaceImageUploadInternalResponse(put_url, public_url) | 服务端签发预签名访问 Grok Bot Marketplace Image Upload Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65096) |
| `CreateGrokBotMarketplaceCreatorInternal` / Unary | CreateGrokBotMarketplaceCreatorInternalRequest(name, profile_photo_url, handles) | GrokBotMarketplaceCreator(id, name, profile_photo_url, handles, created_at_ms, updated_at_ms) | 服务端创建 Grok Bot Marketplace Creator Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65102) |
| `ListGrokBotMarketplaceCreatorsInternal` / Unary | ListGrokBotMarketplaceCreatorsInternalRequest(page_size, page_token) | ListGrokBotMarketplaceCreatorsInternalResponse(creators[], next_page_token) | 服务端列举 Grok Bot Marketplace Creators Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65108) |
| `GetGrokBotMarketplaceCreatorInternal` / Unary | GetGrokBotMarketplaceCreatorInternalRequest(creator_id) | GrokBotMarketplaceCreator(id, name, profile_photo_url, handles, created_at_ms, updated_at_ms) | 服务端读取 Grok Bot Marketplace Creator Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65114) |
| `UpdateGrokBotMarketplaceCreatorInternal` / Unary | UpdateGrokBotMarketplaceCreatorInternalRequest(creator_id, name?, profile_photo_url?, handles, replace_handles?) | GrokBotMarketplaceCreator(id, name, profile_photo_url, handles, created_at_ms, updated_at_ms) | 服务端更新 Grok Bot Marketplace Creator Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65120) |
| `PresignGrokBotMarketplaceCreatorProfileUploadInternal` / Unary | PresignGrokBotMarketplaceCreatorProfileUploadInternalRequest(content_type, byte_size) | PresignGrokBotMarketplaceImageUploadInternalResponse(put_url, public_url) | 服务端签发预签名访问 Grok Bot Marketplace Creator Profile Upload Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65126) |
| `PreviewGrokBotMarketplaceSourceInternal` / Unary | PreviewGrokBotMarketplaceSourceInternalRequest(source_ref) | PreviewGrokBotMarketplaceSourceInternalResponse(template_id, share_id, name, description, avatar_shape, avatar_color, published, …+3) | 服务端执行 Preview Grok Bot Marketplace Source Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65132) |
| `CreateGrokBotMarketplaceCategoryInternal` / Unary | CreateGrokBotMarketplaceCategoryInternalRequest(name) | GrokBotMarketplaceCategory(id, name) | 服务端创建 Grok Bot Marketplace Category Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65138) |
| `ListGrokBotMarketplaceCategoriesInternal` / Unary | ListGrokBotMarketplaceCategoriesInternalRequest(page_size, page_token) | ListGrokBotMarketplaceCategoriesInternalResponse(categories[], next_page_token) | 服务端列举 Grok Bot Marketplace Categories Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65144) |
| `GetGrokBotMarketplaceCategoryInternal` / Unary | GetGrokBotMarketplaceCategoryInternalRequest(category_id) | GrokBotMarketplaceCategory(id, name) | 服务端读取 Grok Bot Marketplace Category Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65150) |
| `UpdateGrokBotMarketplaceCategoryInternal` / Unary | UpdateGrokBotMarketplaceCategoryInternalRequest(category_id, name?) | GrokBotMarketplaceCategory(id, name) | 服务端更新 Grok Bot Marketplace Category Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65156) |
| `GetGrokBotMarketplaceListingTemplateInternal` / Unary | GetGrokBotMarketplaceListingTemplateInternalRequest(listing_id) | GetGrokBotMarketplaceListingTemplateInternalResponse(recipe_json) | 服务端读取 Grok Bot Marketplace Listing Template Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65162) |
| `GetGrokBotMarketplaceListingSourceTemplateInternal` / Unary | GetGrokBotMarketplaceListingSourceTemplateInternalRequest(listing_id) | GetGrokBotMarketplaceListingSourceTemplateInternalResponse(recipe_json, template_version_id, version) | 服务端读取 Grok Bot Marketplace Listing Source Template Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65168) |
| `DeleteGrokBotMarketplaceListingInternal` / Unary | DeleteGrokBotMarketplaceListingInternalRequest(listing_id) | DeleteGrokBotMarketplaceListingInternalResponse(empty) | 服务端删除 Grok Bot Marketplace Listing Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65174) |
| `UpdateGrokBotMarketplaceListingTemplateInternal` / Unary | UpdateGrokBotMarketplaceListingTemplateInternalRequest(listing_id, recipe_json) | GetGrokBotMarketplaceListingTemplateInternalResponse(recipe_json) | 服务端更新 Grok Bot Marketplace Listing Template Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65180) |
| `GetGrokBotTemplateForOperatorInternal` / Unary | GetGrokBotTemplateForOperatorInternalRequest(share_id) | GrokBotTemplateOperatorView(share_id, name, description, published, creator_attribution?, public_byline) | 服务端读取 Grok Bot Template For Operator Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65186) |
| `SetGrokBotTemplateCreatorAttributionInternal` / Unary | SetGrokBotTemplateCreatorAttributionInternalRequest(share_id, creator_attribution?) | GrokBotTemplateOperatorView(share_id, name, description, published, creator_attribution?, public_byline) | 服务端设置 Grok Bot Template Creator Attribution Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65192) |
| `GetGrokBotHarnessMigrationStatusInternal` / Unary | GetGrokBotHarnessMigrationStatusInternalRequest(owner_auth_id) | GetGrokBotHarnessMigrationStatusInternalResponse(rollout, hold_state, agents[], passes[], pass_history_available) | 服务端读取 Grok Bot Harness Migration Status Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65198) |
| `ClearGrokBotHarnessMigrationHoldInternal` / Unary | ClearGrokBotHarnessMigrationHoldInternalRequest(owner_auth_id) | ClearGrokBotHarnessMigrationHoldInternalResponse(cleared) | 服务端清理 Grok Bot Harness Migration Hold Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65204) |
| `PreviewInternalPrimaryBotMigration` / Unary | PreviewInternalPrimaryBotMigrationRequest(team_ids[], email_suffixes[], after_user_id, page_size) | PreviewInternalPrimaryBotMigrationResponse(owners[], filtered_count, cohort_hash, preview_token, aggregate, total_owner_count, page_size, …+1) | 服务端执行 Preview Internal Primary Bot Migration 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65210) |
| `ExecuteInternalPrimaryBotMigration` / Unary | ExecuteInternalPrimaryBotMigrationRequest(team_ids[], email_suffixes[], selected_user_ids[], cohort_hash, preview_token, confirmation) | ExecuteInternalPrimaryBotMigrationResponse(outcomes[], aggregate) | 服务端执行 Internal Primary Bot Migration 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65216) |

### Form Vault、Skills Snapshot 与扩展下载

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ListGrokBotUserFormVaultEntries` / Unary | ListGrokBotUserFormVaultEntriesRequest(empty) | ListGrokBotUserFormVaultEntriesResponse(entries[]) | 服务端列举 Grok Bot User Form Vault Entries 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65222) |
| `UpsertGrokBotUserFormVaultEntry` / Unary | UpsertGrokBotUserFormVaultEntryRequest(entry) | UpsertGrokBotUserFormVaultEntryResponse(empty) | 服务端新增或更新 Grok Bot User Form Vault Entry 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65228) |
| `DeleteGrokBotUserFormVaultEntry` / Unary | DeleteGrokBotUserFormVaultEntryRequest(entry_id) | DeleteGrokBotUserFormVaultEntryResponse(empty) | 服务端删除 Grok Bot User Form Vault Entry 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65234) |
| `ListGrokBotUserFormVaultKeys` / Unary | ListGrokBotUserFormVaultKeysRequest(empty) | ListGrokBotUserFormVaultKeysResponse(keys[]) | 服务端列举 Grok Bot User Form Vault Keys 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65240) |
| `PublishGrokBotUserSkillsSnapshot` / Unary | PublishGrokBotUserSkillsSnapshotRequest(fingerprint) | PublishGrokBotUserSkillsSnapshotResponse(empty) | 服务端发布 Grok Bot User Skills Snapshot 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65246) |
| `InvalidateGrokBotUserSkillsCache` / Unary | InvalidateGrokBotUserSkillsCacheRequest(empty) | InvalidateGrokBotUserSkillsCacheResponse(empty) | 服务端执行 Invalidate Grok Bot User Skills Cache 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65252) |
| `GetGrokBotOnePasswordExtensionDownload` / Unary | GetGrokBotOnePasswordExtensionDownloadRequest(accepts_store_crx) | GetGrokBotOnePasswordExtensionDownloadResponse(enabled, url, tree_digest, expires_at_ms, crx_sha256) | 服务端读取 Grok Bot One Password Extension Download 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65258) |

### 管理员 Session Box、Agent、Email 与 Meeting

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `AdminListGrokBotSessionBoxes` / Unary | AdminListGrokBotSessionBoxesRequest(auth_id, agent_id, page_cursor) | AdminListGrokBotSessionBoxesResponse(boxes[], next_page_cursor) | 管理员侧列举 Grok Bot Session Boxes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65264) |
| `AdminGetGrokBotSessionBox` / Unary | AdminGetGrokBotSessionBoxRequest(agent_id, session_id) | AdminGetGrokBotSessionBoxResponse(box, host?, store?) | 管理员侧读取 Grok Bot Session Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65270) |
| `AdminReapGrokBotSessionBoxNow` / Unary | AdminReapGrokBotSessionBoxNowRequest(agent_id, session_id, dry_run) | AdminReapGrokBotSessionBoxNowResponse(result, reason, tenant_id, dry_run, pod_count, deleted_pod_count, revoked_credential_count, …+3) | 管理员侧执行 Reap Grok Bot Session Box Now 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65276) |
| `AdminHibernateGrokBotSessionBox` / Unary | AdminHibernateGrokBotSessionBoxRequest(agent_id, session_id, force) | AdminHibernateGrokBotSessionBoxResponse(started, reason, tenant_id, box_key) | 管理员侧执行 Hibernate Grok Bot Session Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65282) |
| `AdminForceDeleteGrokBotSessionBox` / Unary | AdminForceDeleteGrokBotSessionBoxRequest(agent_id, session_id) | AdminForceDeleteGrokBotSessionBoxResponse(deleted, reason, tenant_id, deleted_pod_count, revoked_credential_count, stamp_cleared, box_key) | 管理员侧执行 Force Delete Grok Bot Session Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65288) |
| `AdminGetGrokBotAgentDefinition` / Unary | AdminGetGrokBotAgentDefinitionRequest(agent_ref, identity_only) | AdminGetGrokBotAgentDefinitionResponse(identity, definition, refusal) | 管理员侧读取 Grok Bot Agent Definition 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65294) |
| `AdminListGrokBotTeamAgents` / Unary | AdminListGrokBotTeamAgentsRequest(team_id) | AdminListGrokBotTeamAgentsResponse(agents[], team_name, truncated, orphaned_slack_apps[], orphaned_slack_apps_truncated) | 管理员侧列举 Grok Bot Team Agents 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65300) |
| `AdminDeleteGrokBotAgent` / Unary | AdminDeleteGrokBotAgentRequest(agent_id, team_id, operator_email) | AdminDeleteGrokBotAgentResponse(id, slack_app_removal) | 管理员侧删除 Grok Bot Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65306) |
| `AdminRetryGrokBotSlackAppRemoval` / Unary | AdminRetryGrokBotSlackAppRemovalRequest(agent_id, team_id, operator_email) | AdminRetryGrokBotSlackAppRemovalResponse(slack_app_removal) | 管理员侧执行 Retry Grok Bot Slack App Removal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65312) |
| `AdminGetGrokBotTeamAgentSharedState` / Unary | AdminGetGrokBotTeamAgentSharedStateRequest(team_id, agent_id, identity_only) | AdminGetGrokBotTeamAgentSharedStateResponse(identity, owner_email, owner_multiplayer_gate, shared_state, refusal) | 管理员侧读取 Grok Bot Team Agent Shared State 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65318) |
| `AdminListGrokBotEmailInboxes` / Unary | AdminListGrokBotEmailInboxesRequest(user_id) | AdminListGrokBotEmailInboxesResponse(inboxes[], gate_enabled, sending_domain) | 管理员侧列举 Grok Bot Email Inboxes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65324) |
| `AdminListGrokBotEmailMessages` / Unary | AdminListGrokBotEmailMessagesRequest(user_id, inbox_email, thread_id, direction, limit, cursor) | AdminListGrokBotEmailMessagesResponse(messages[], next_cursor) | 管理员侧列举 Grok Bot Email Messages 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65330) |
| `AdminSendGrokBotTestEmail` / Unary | AdminSendGrokBotTestEmailRequest(user_id, from_inbox_email, to, subject, text_body, operator_email) | AdminSendGrokBotTestEmailResponse(message_id, thread_id, provider_message_id) | 管理员侧发送 Grok Bot Test Email 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65336) |
| `AdminGetGrokBotEmailSendingState` / Unary | AdminGetGrokBotEmailSendingStateRequest(user_id) | AdminGrokBotEmailSendingStateResponse(has_account, state, effective_state, reason, changed_at_ms?, expires_at_ms?, reinstated_until_ms?, …+3) | 管理员侧读取 Grok Bot Email Sending State 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65342) |
| `AdminSetGrokBotEmailSendingState` / Unary | AdminSetGrokBotEmailSendingStateRequest(user_id, state, reason, expires_at_ms?, reinstated_until_ms?, operator_email) | AdminGrokBotEmailSendingStateResponse(has_account, state, effective_state, reason, changed_at_ms?, expires_at_ms?, reinstated_until_ms?, …+3) | 管理员侧设置 Grok Bot Email Sending State 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65348) |
| `AdminGetGrokBotEmailLimits` / Unary | AdminGetGrokBotEmailLimitsRequest(user_id) | AdminGrokBotEmailLimitsResponse(has_account, default_thresholds_json, overrides_json, effective_thresholds_json, overridden_paths[], new_recipients) | 管理员侧读取 Grok Bot Email Limits 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65354) |
| `AdminSetGrokBotEmailThresholds` / Unary | AdminSetGrokBotEmailThresholdsRequest(user_id, overrides_json, reason, operator_email) | AdminGrokBotEmailLimitsResponse(has_account, default_thresholds_json, overrides_json, effective_thresholds_json, overridden_paths[], new_recipients) | 管理员侧设置 Grok Bot Email Thresholds 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65360) |
| `AdminListGrokBotEmailSuppressions` / Unary | AdminListGrokBotEmailSuppressionsRequest(user_id, address, domain, reason, created_after_ms?, created_before_ms?, limit, …+1) | AdminListGrokBotEmailSuppressionsResponse(suppressions[], next_cursor) | 管理员侧列举 Grok Bot Email Suppressions 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65366) |
| `AdminAddGrokBotEmailSuppression` / Unary | AdminAddGrokBotEmailSuppressionRequest(user_id, address, reason, operator_email) | AdminAddGrokBotEmailSuppressionResponse(added, suppression) | 管理员侧执行 Add Grok Bot Email Suppression 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65372) |
| `AdminRemoveGrokBotEmailSuppressions` / Unary | AdminRemoveGrokBotEmailSuppressionsRequest(address, user_id, all_users, expected_count, reason, operator_email) | AdminRemoveGrokBotEmailSuppressionsResponse(removed[]) | 管理员侧移除 Grok Bot Email Suppressions 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65378) |
| `AdminLookupGrokBotMeetings` / Unary | AdminLookupGrokBotMeetingsRequest(provider, meeting_id) | AdminLookupGrokBotMeetingsResponse(provider, meeting_id, provider_meeting_id_hash, truncated, meetings[]) | 管理员侧执行 Lookup Grok Bot Meetings 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65384) |
| `AdminLookupGrokBotMeetingsByAgent` / Unary | AdminLookupGrokBotMeetingsByAgentRequest(agent_ref) | AdminLookupGrokBotMeetingsByAgentResponse(status, agent_ref, agent, truncated, meetings[]) | 管理员侧执行 Lookup Grok Bot Meetings By Agent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65390) |
| `AdminGetGrokBotMeetingJoinConsent` / Unary | AdminGetGrokBotMeetingJoinConsentRequest(user_id) | AdminGetGrokBotMeetingJoinConsentResponse(consent_at_ms?) | 管理员侧读取 Grok Bot Meeting Join Consent 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65396) |
| `AdminGetGrokBotMeetingTranscript` / Unary | AdminGetGrokBotMeetingTranscriptRequest(meeting_id, agent_id) | AdminGetGrokBotMeetingTranscriptResponse(access, lines[], truncated, summary_text?, request_log[], request_log_truncated, request_log_unavailable) | 管理员侧读取 Grok Bot Meeting Transcript 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65402) |
| `AdminMintGrokBotMeetingAvatarLinks` / Unary | AdminMintGrokBotMeetingAvatarLinksRequest(empty) | AdminMintGrokBotMeetingAvatarLinksResponse(links[], custom_link) | 管理员侧签发短期凭证 Grok Bot Meeting Avatar Links 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65408) |
| `AdminGetGrokBotMeetingSummaryVersions` / Unary | AdminGetGrokBotMeetingSummaryVersionsRequest(meeting_id, agent_id) | AdminGetGrokBotMeetingSummaryVersionsResponse(access, versions[]) | 管理员侧读取 Grok Bot Meeting Summary Versions 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65414) |

### Egress Policy

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `GetGrokBotEgressPolicy` / Unary | GetGrokBotEgressPolicyRequest(empty) | GetGrokBotEgressPolicyResponse(restricted, allowed_domains[], allowed_tcp_destinations[]) | 返回 Box/Agent 的网络出口限制与允许目标。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65420) |

### Voice Harness

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `VoiceCallHarnessSession` / Unary | VoiceCallHarnessSessionRequest(agent_id, agent_name, user_name?, description?, spoken_language?) | VoiceCallHarnessSessionResponse(instructions, tools[], has_overheard, greeting, receipt) | 为实时语音会话生成 Harness 指令、工具、问候语和回执配置。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65426) |
| `VoiceCallHarnessTool` / Unary | VoiceCallHarnessToolRequest(agent_id, call_id, name, input, line) | VoiceCallHarnessToolResponse(kind, output) | 执行语音会话中的 Harness 工具调用并返回结构化结果。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65432) |

### Changelog

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `CreateGrokBotChangelogInternal` / Unary | CreateGrokBotChangelogInternalRequest(slug, feature_description, relevance_guidance, delivery_window, not_before_ms?, expires_at_ms, priority, …+5) | GrokBotChangelog(id, slug, status, feature_description, relevance_guidance, delivery_window, not_before_ms?, …+12) | 服务端创建 Grok Bot Changelog Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65438) |
| `ListGrokBotChangelogsInternal` / Unary | ListGrokBotChangelogsInternalRequest(status?, page_size, page_token) | ListGrokBotChangelogsInternalResponse(changelogs[], next_page_token) | 服务端列举 Grok Bot Changelogs Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65444) |
| `GetGrokBotChangelogInternal` / Unary | GetGrokBotChangelogInternalRequest(changelog_id) | GrokBotChangelog(id, slug, status, feature_description, relevance_guidance, delivery_window, not_before_ms?, …+12) | 服务端读取 Grok Bot Changelog Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65450) |
| `UpdateGrokBotChangelogInternal` / Unary | UpdateGrokBotChangelogInternalRequest(changelog_id, slug, feature_description, relevance_guidance, delivery_window, not_before_ms?, expires_at_ms, …+6) | GrokBotChangelog(id, slug, status, feature_description, relevance_guidance, delivery_window, not_before_ms?, …+12) | 服务端更新 Grok Bot Changelog Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65456) |
| `SetGrokBotChangelogStatusInternal` / Unary | SetGrokBotChangelogStatusInternalRequest(changelog_id, status) | GrokBotChangelog(id, slug, status, feature_description, relevance_guidance, delivery_window, not_before_ms?, …+12) | 服务端设置 Grok Bot Changelog Status Internal 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65462) |

### 默认 Main Bot

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `EnsureGrokBotCursorMainBot` / Unary | EnsureGrokBotCursorMainBotRequest(empty) | EnsureGrokBotCursorMainBotResponse(agent, created) | 服务端确保存在或可用 Grok Bot Cursor Main Bot 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65468) |

## SandBoxService（55 路由）

Box 与 1Password 的独立兼容控制面；55 条方法全部被 GrokBotService 同名同 schema 复用。

推断可作为可独立拆出的 Box Control Plane：生命周期、存储快照、迁移、升级、团队批量运维和凭证代理。不能由路由复用推断其部署拓扑。

### Box 生命周期、存储、迁移与升级

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `EnsureSandBox` / Unary | EnsureSandBoxRequest(wake?, supports_asleep_box?) | EnsureSandBoxResponse(cluster, tenant_id, pod_id, network_token, exec_daemon_auth_token, exec_daemon_url, vnc_url, …+8) | 按需唤醒或确保持久 Box 可用，并返回 Gateway/VNC/exec-daemon 等连接控制信息。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65496) |
| `EnsureSandBoxWindow` / Unary | EnsureSandBoxWindowRequest(window_index) | EnsureSandBoxResponse(cluster, tenant_id, pod_id, network_token, exec_daemon_auth_token, exec_daemon_url, vnc_url, …+8) | 服务端确保存在或可用 Sand Box Window 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65498) |
| `RecreateSandBox` / Unary | RecreateSandBoxRequest(preserve_data, force, acknowledge_terminal_upgrade_schedule) | RecreateSandBoxResponse(started, reason, operation_id) | 服务端执行 Recreate Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65503) |
| `ForceRecreateSandBox` / Unary | ForceRecreateSandBoxRequest(empty) | RecreateSandBoxResponse(started, reason, operation_id) | 服务端执行 Force Recreate Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65505) |
| `AdminRecreateSandBox` / Unary | AdminRecreateSandBoxRequest(auth_id, flavor, preserve_data, force) | RecreateSandBoxResponse(started, reason, operation_id) | 管理员侧执行 Recreate Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65511) |
| `AdminForceRecreateSandBox` / Unary | AdminForceRecreateSandBoxRequest(auth_id, flavor) | RecreateSandBoxResponse(started, reason, operation_id) | 管理员侧执行 Force Recreate Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65517) |
| `AdminBreakGlassDeleteSandBoxPod` / Unary | AdminBreakGlassDeleteSandBoxPodRequest(auth_id, flavor, pod_id, cluster, actor_email) | AdminBreakGlassDeleteSandBoxPodResponse(deleted, reason, started, recreate_reason, operation_id) | 管理员侧执行 Break Glass Delete Sand Box Pod 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65523) |
| `PresignSandBoxStoreWrites` / Unary | PresignSandBoxStoreWritesRequest(files[]) | PresignSandBoxStoreWritesResponse(instructions[]) | 服务端签发预签名访问 Sand Box Store Writes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65529) |
| `CompleteSandBoxStoreMultipartWrites` / Unary | CompleteSandBoxStoreMultipartWritesRequest(completions[]) | CompleteSandBoxStoreMultipartWritesResponse(results[]) | 服务端完成 Sand Box Store Multipart Writes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65535) |
| `CommitSandBoxStoreManifest` / Unary | CommitSandBoxStoreManifestRequest(manifest, base_etag) | CommitSandBoxStoreManifestResponse(status, etag) | 服务端提交 Sand Box Store Manifest 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65541) |
| `AbortSandBoxStoreMultipartWrites` / Unary | AbortSandBoxStoreMultipartWritesRequest(uploads[]) | AbortSandBoxStoreMultipartWritesResponse(results[]) | 服务端中止 Sand Box Store Multipart Writes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65547) |
| `PresignSandBoxStoreReads` / Unary | PresignSandBoxStoreReadsRequest(rel_paths[]) | PresignSandBoxStoreReadsResponse(instructions[]) | 服务端签发预签名访问 Sand Box Store Reads 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65553) |
| `StatSandBoxStoreObject` / Unary | StatSandBoxStoreObjectRequest(rel_path) | StatSandBoxStoreObjectResponse(exists, etag, size_bytes, last_modified_ms) | 服务端执行 Stat Sand Box Store Object 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65559) |
| `ListSandBoxStoreObjects` / Unary | ListSandBoxStoreObjectsRequest(prefix, cursor, max_entries) | ListSandBoxStoreObjectsResponse(entries[], next_cursor, truncated) | 服务端列举 Sand Box Store Objects 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65565) |
| `AdminGetSandBoxStoreStatus` / Unary | AdminSandBoxStoreStatusRequest(auth_id, flavor) | AdminSandBoxStoreStatusResponse(durable, entry_count, total_bytes, last_snapshot_at_ms, reachable) | 管理员侧读取 Sand Box Store Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65571) |
| `AdminUpdateSandBoxHost` / Unary | AdminUpdateSandBoxHostRequest(auth_id, flavor, force) | AdminUpdateSandBoxHostResponse(started, reason, version) | 管理员侧更新 Sand Box Host 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65577) |
| `AdminGetSandBoxHostStatus` / Unary | AdminSandBoxHostStatusRequest(auth_id, flavor) | AdminSandBoxHostStatusResponse(gateway_reachable, host_version?, host_update_available?, latest_host_version?, is_busy?, last_busy_at_ms?) | 管理员侧读取 Sand Box Host Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65583) |
| `AdminSnapshotSandBoxStore` / Unary | AdminSnapshotSandBoxStoreRequest(auth_id, flavor) | AdminSnapshotSandBoxStoreResponse(ok, manifest_entries, files_uploaded, reason) | 管理员侧执行 Snapshot Sand Box Store 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65589) |
| `AdminListSandBoxStoreManifestVersions` / Unary | AdminListSandBoxStoreManifestVersionsRequest(auth_id, flavor, cursor, max_versions, parse_limit, before_timestamp_ms?) | AdminListSandBoxStoreManifestVersionsResponse(store_id, versions[], next_cursor, truncated, time_scan_capped) | 管理员侧列举 Sand Box Store Manifest Versions 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65595) |
| `AdminStatSandBoxStoreObject` / Unary | AdminStatSandBoxStoreObjectRequest(s3_link) | AdminStatSandBoxStoreObjectResponse(bucket, key, exists, version_id, size_bytes, last_modified_ms, etag, …+8) | 管理员侧执行 Stat Sand Box Store Object 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65601) |
| `AdminRestoreSandBoxStoreSnapshot` / Unary | AdminRestoreSandBoxStoreSnapshotRequest(auth_id, flavor, manifest_version_id, expected_entry_count?) | AdminRestoreSandBoxStoreSnapshotResponse(started, reason, operation_id, current_entry_count, target_entry_count) | 管理员侧执行 Restore Sand Box Store Snapshot 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65607) |
| `AdminHibernateSandBox` / Unary | AdminHibernateSandBoxRequest(auth_id, flavor, force) | AdminHibernateSandBoxResponse(started, reason) | 管理员侧执行 Hibernate Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65613) |
| `AdminRefreshSandBoxEgress` / Unary | AdminRefreshSandBoxEgressRequest(auth_id, flavor, trigger, team_id?) | AdminRefreshSandBoxEgressResponse(status, auth_id, cluster, tenant_id, pod_id, runtime_applied, http_proxy_rule_count, …+6) | 管理员侧执行 Refresh Sand Box Egress 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65619) |
| `AdminListSandAgents` / Unary | AdminListSandAgentsRequest(auth_id, flavor) | AdminListSandAgentsResponse(reachable, agents_json, reason) | 管理员侧列举 Sand Agents 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65625) |
| `AdminGetSandAgentTranscriptPage` / Unary | AdminGetSandAgentTranscriptPageRequest(auth_id, flavor, agent_id, before_seq, limit, since_ms, until_ms, …+1) | AdminGetSandAgentTranscriptPageResponse(reachable, entries_json, reason, next_before_seq, session_id) | 管理员侧读取 Sand Agent Transcript Page 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65631) |
| `WatchSandBoxMigration` / ServerStreaming | WatchSandBoxMigrationRequest(from_offset_key, include_finished) | SandBoxMigrationEvent(phase, detail, at_ms, offset_key, operation_id) | 服务端持续订阅 Sand Box Migration 对应资源或流程，并通过服务端流返回增量结果；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65637) |
| `AdminWatchSandBoxMigration` / ServerStreaming | AdminWatchSandBoxMigrationRequest(auth_id, flavor, from_offset_key) | SandBoxMigrationEvent(phase, detail, at_ms, offset_key, operation_id) | 管理员侧持续订阅 Sand Box Migration 对应资源或流程，并通过服务端流返回增量结果；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65643) |
| `GetSandBoxRunState` / Unary | GetSandBoxRunStateRequest(empty) | GetSandBoxRunStateResponse(state, image_update_available?, egress_tunnel_ownership?, image) | 服务端读取 Sand Box Run State 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65649) |
| `GetSandBoxUpgradeSchedule` / Unary | GetSandBoxUpgradeScheduleRequest(empty) | GetSandBoxUpgradeScheduleResponse(schedule) | 服务端读取 Sand Box Upgrade Schedule 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65655) |
| `ScheduleSandBoxUpgrade` / Unary | ScheduleSandBoxUpgradeRequest(timezone, local_time, recurring) | ScheduleSandBoxUpgradeResponse(schedule) | 服务端执行 Schedule Sand Box Upgrade 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65661) |
| `CancelSandBoxUpgrade` / Unary | CancelSandBoxUpgradeRequest(dismiss_terminal_outcome) | CancelSandBoxUpgradeResponse(schedule) | 服务端取消 Sand Box Upgrade 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65667) |
| `RescheduleSandBoxUpgrade` / Unary | RescheduleSandBoxUpgradeRequest(timezone, local_time, recurring) | RescheduleSandBoxUpgradeResponse(schedule) | 服务端执行 Reschedule Sand Box Upgrade 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65673) |
| `ListSandBoxes` / Unary | ListSandBoxesRequest(empty) | ListSandBoxesResponse(boxes[]) | 服务端列举 Sand Boxes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65678) |
| `NotifySandAgentTurnFinished` / Unary | NotifySandAgentTurnFinishedRequest(agent_id, agent_name, message_preview, last_message_id, awaiting_user_response, member_agent_ids[], sender_agent_id, …+1) | NotifySandAgentTurnFinishedResponse(empty) | 服务端通知 Sand Agent Turn Finished 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65680) |
| `ListSandSetupManifests` / Unary | ListSandSetupManifestsRequest(include_team_secrets) | ListSandSetupManifestsResponse(schema_version, manifests[], team_secrets[]) | 服务端列举 Sand Setup Manifests 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65686) |
| `ListTeamSandSetupManifests` / Unary | ListTeamSandSetupManifestsRequest(empty) | ListTeamSandSetupManifestsResponse(team_id, can_manage, manifests[]) | 服务端列举 Team Sand Setup Manifests 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65692) |
| `SaveTeamSandSetupManifest` / Unary | SaveTeamSandSetupManifestRequest(manifest_id, expected_etag, entries[]) | SaveTeamSandSetupManifestResponse(manifest) | 服务端保存 Team Sand Setup Manifest 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65698) |
| `DeleteTeamSandSetupManifest` / Unary | DeleteTeamSandSetupManifestRequest(manifest_id, expected_etag) | DeleteTeamSandSetupManifestResponse(empty) | 服务端删除 Team Sand Setup Manifest 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65704) |

### 团队成员与批量运维

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `ListTeamMemberSandBoxes` / Unary | ListTeamMemberSandBoxesRequest(team_id, user_id) | ListTeamMemberSandBoxesResponse(user_id, email, name, boxes[], scan_incomplete) | 服务端列举 Team Member Sand Boxes 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65710) |
| `KillTeamMemberSandBox` / Unary | KillTeamMemberSandBoxRequest(team_id, user_id, pod_id, cluster) | KillTeamMemberSandBoxResponse(killed, reason, deleted_count) | 服务端执行 Kill Team Member Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65716) |
| `RecreateTeamMemberSandBox` / Unary | RecreateTeamMemberSandBoxRequest(team_id, user_id, force) | RecreateSandBoxResponse(started, reason, operation_id) | 服务端执行 Recreate Team Member Sand Box 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65722) |
| `GetTeamMemberSandBoxMigrationStatus` / Unary | GetTeamMemberSandBoxMigrationStatusRequest(team_id, user_id, operation_id) | GetTeamMemberSandBoxMigrationStatusResponse(event?) | 服务端读取 Team Member Sand Box Migration Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65728) |
| `StartBulkTeamMemberSandBoxOperation` / Unary | StartBulkTeamMemberSandBoxOperationRequest(team_id, user_ids[], action, force, operation_id, clear_sand_box_restart_required) | StartBulkTeamMemberSandBoxOperationResponse(operation_id) | 服务端启动 Bulk Team Member Sand Box Operation 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65734) |
| `GetBulkTeamMemberSandBoxOperationStatus` / Unary | GetBulkTeamMemberSandBoxOperationStatusRequest(team_id, operation_id) | GetBulkTeamMemberSandBoxOperationStatusResponse(operation_id, action, state, total_count, queued_count, running_count, succeeded_count, …+5) | 服务端读取 Bulk Team Member Sand Box Operation Status 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65740) |
| `MintSandVoiceCallSecret` / Unary | MintSandVoiceCallSecretRequest(model) | MintSandVoiceCallSecretResponse(client_secret, expires_at_unix_seconds, model, websocket_url) | 服务端签发短期凭证 Sand Voice Call Secret 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65746) |

### Voice Secret

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `BeginOnePasswordConnection` / Unary | BeginOnePasswordConnectionRequest(connection_id, vault_id, service_account_token) | BeginOnePasswordConnectionResponse(mint_ticket, connection_id, expected_generation, expiration_mode, provider_expires_in_seconds, credential_expires_at_ms, ticket_expires_at_ms, …+3) | 服务端发起 One Password Connection 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65752) |

### 1Password

| 方法 / 形态 | Request 核心字段 | Response 核心字段 | 服务端职责 | 证据 |
|---|---|---|---|---|
| `CompleteOnePasswordConnection` / Unary | CompleteOnePasswordConnectionRequest(mint_ticket, service_account_token, account_uuid, account_email, account_url) | OnePasswordState(connections[], items[]) | 服务端完成 One Password Connection 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65758) |
| `GetOnePasswordState` / Unary | GetOnePasswordStateRequest(empty) | OnePasswordState(connections[], items[]) | 服务端读取 One Password State 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65764) |
| `SyncOnePasswordConnections` / Unary | SyncOnePasswordConnectionsRequest(trigger) | OnePasswordState(connections[], items[]) | 服务端同步 One Password Connections 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65770) |
| `DeleteOnePasswordConnection` / Unary | DeleteOnePasswordConnectionRequest(connection_id) | OnePasswordState(connections[], items[]) | 服务端删除 One Password Connection 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65776) |
| `StartOnePasswordOAuth` / Unary | StartOnePasswordOAuthRequest(connection_id, connect_link, locale) | StartOnePasswordOAuthResponse(authorize_url, state, expires_at_ms, redirect_uri, connect_url?) | 服务端启动 One Password O Auth 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65782) |
| `StoreOnePasswordIntegrationKey` / Unary | StoreOnePasswordIntegrationKeyRequest(state, integration_key) | StoreOnePasswordIntegrationKeyResponse(connection_id) | 服务端执行 Store One Password Integration Key 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65788) |
| `CompleteOnePasswordOAuth` / Unary | CompleteOnePasswordOAuthRequest(state, code, error) | OnePasswordState(connections[], items[]) | 服务端完成 One Password O Auth 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65794) |
| `ApproveOnePasswordCredentialRequest` / Unary | ApproveOnePasswordCredentialRequestRequest(entry_id, agent_id, credential_id, connection_id, catalog_revision, target_site, harness) | OnePasswordCredentialDecisionResponse(ok, detail) | 服务端批准 One Password Credential Request 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65800) |
| `DenyOnePasswordCredentialRequest` / Unary | DenyOnePasswordCredentialRequestRequest(entry_id, agent_id, harness) | OnePasswordCredentialDecisionResponse(ok, detail) | 服务端拒绝 One Password Credential Request 对应资源或流程；具体内部实现仅能由契约推断。 | 静态：[Proto](formatted/electron-main/proto.cjs#L65806) |

## 复刻时的建议服务边界

1. API Edge / Identity / Policy：认证、团队、entitlement、策略合并、限流和审计。
2. Agent Registry + Harness Router：Agent 元数据、Box/Temporal 两类 Harness 路由、房间与成员。
3. Transcript Journal + Event Fanout：append-only journal、游标、SSE/Connect stream、未读锚点和幂等。
4. Box Broker + Gateway + VNC Edge：持久 Box 生命周期、Gateway token、noVNC/websockify、迁移和升级。
5. User Device Relay：短期 credential、server stream/long poll、请求/响应批处理、权限与 ownership。
6. Plugin/MCP Registry + OAuth Broker：目录、安装、变量、工具 schema、OAuth token 与策略。
7. Scheduler / Automation / Meeting / Email：定时任务、Webhook、会议抓取和 Agent inbox。
8. Object Store / AgentStore：附件、Agent files、library docs、模板、artifact、预签名传输。
9. Secret Broker：普通 secret、Vault、1Password、WebAuthn/Passkey 与浏览器填充隔离。
10. Voice Realtime Gateway：credential mint、Realtime WebSocket、Harness prompt/tool bridge。
11. Telemetry / Feature Flags：logs、events、traces、Sentry、Statsig bootstrap。

