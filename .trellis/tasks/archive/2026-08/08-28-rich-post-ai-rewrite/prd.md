# 导出图文：AI 改写

## Goal

提供可配置、可验证且不会泄漏密钥的 OpenAI 兼容文章改写能力。

## Requirements

- 配置 Base URL、API Key、模型名和可编辑提示词；提示词支持 `.txt/.md` 导入和恢复默认。
- Web 直连模型服务，Key 只在当前页面会话内存中存在。
- Electron 主进程读取加密 Key 并发起请求；渲染层仅能查询状态、保存/清除和改写。
- 使用 Chat Completions 非流式请求；不支持 Responses API、工具调用或服务端代理。
- 返回值验证为非空 `body` 和最多两个、确实存在于标题中的 `highlightTerms`。
- 错误信息不得包含 Key、请求正文或上游敏感响应头。

## Acceptance Criteria

- [x] 内置提示词与 `research/rewrite-prompt.md` 一致。
- [x] 合法响应、代码围栏 JSON、非法 JSON、空正文和无效高亮词均有测试。
- [x] Web 刷新后 Key 消失，非秘密设置仍存在。
- [x] Electron Key 可保存、查询状态和清除，但任何 IPC 均无法读取明文。
- [x] safeStorage 不可用或 Linux 为 `basic_text` 时不落盘。
- [x] CORS、超时、401/429 和上游格式异常返回可操作的中文错误。

## Out of Scope

- 服务端代理、多供应商专用 SDK、流式展示、用量统计。
