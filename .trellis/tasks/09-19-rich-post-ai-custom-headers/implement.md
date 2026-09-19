# Implement：导出图文 AI 自定义请求头与会话 ID

执行顺序（每步完成即运行对应验证）：

## A. Web 服务层（apps/web/src/services/richPostAi.ts）

- [x] A1 类型：`RichPostAiCustomHeader`、`customHeaders` 加入 `RichPostAiSettings` 与默认值。
- [x] A2 读写兼容：`loadRichPostAiSettings` 验证数组结构，非法项丢弃；`saveRichPostAiSettings` 只写 `remember` 行。
- [x] A3 共享工具：`validateRichPostCustomHeaders`（重复名大小写不敏感、field-name、CR/LF/控制字符、空值、保留头、受限头、≤20 行、≤16KB 编码后合计）与 `buildRichPostRequestHeaders`（解析 `valueSource: "session"`，返回 `Headers` 或普通对象）。
- [x] A4 `rewriteRichPostInBrowser` / `probeRichPostAiInBrowser` 接入构建结果；校验错误在 fetch 前抛出且不被 TypeError 分支吞并。
- 验证：`pnpm --filter @wemd/web test -- --run services/richPostAi`。

## B. Electron 端（shared/preload/main/d.ts）

- [x] B1 `apps/electron/src/shared/richPostAi.ts`：类型扩展、`parseRichPostElectronProbeInput` / `parseRichPostElectronRewriteInput` 解析 `customHeaders`（结构校验）与 `sessionId`（非空、≤128）、`RichPostRewriteInput` 增加两字段、`requestRichPostRewrite` / `probeRichPostAi` 接入 `buildRichPostRequestHeaders`。
- [x] B2 `apps/electron/src/preload.ts`：probe payload 类型同步（含 customHeaders/sessionId）。
- [x] B3 `apps/web/src/types/electron.d.ts`：`RichPostElectronRewriteInput` 与 probe 声明同步。
- [x] B4 `apps/electron/src/main.ts`：确认展开传递新字段，不丢失；端点绑定检查保持在构建头之前。
- 验证：`pnpm --filter wemd-electron test`。

## C. 设置界面（RichPostAiSettings.tsx + CSS）

- [x] C1 默认折叠“高级配置”；行编辑器（名称/值类型/值/启用/本地记住），新增、删除；空白占位行允许，暂不完整允许。
- [x] C2 行级错误提示（校验失败阻止探测与改写）；`remember` 提示“固定值以明文保存在本机”。
- [x] C3 提供“添加 OpenCode 会话头”推荐配置入口（`x-opencode-session` + 自动会话 ID + 启用 + 记住）。
- [x] C4 `update` 辅助函数适配数组字段（当前仅接受字符串）。
- 验证：`pnpm --filter @wemd/web test -- --run components/RichPostAiSettings`。

## D. 会话生命周期（RichPostDialog.tsx）

- [x] D1 `sessionId` 状态：打开/文章切换（`currentFilePath`）/baseUrl 规范化变化时重置。
- [x] D2 探测与改写传递 `customHeaders` 快照与 `sessionId`；Web/Electron 两分支一致。
- [x] D3 校验失败在 UI 显示且不发生请求。
- 验证：`pnpm --filter @wemd/web test -- --run components/RichPostDialog`。

## E. 回归与质量

- [x] E1 扩展 web/electron 测试矩阵（见 design.md 测试策略）。
- [x] E2 `pnpm --filter @wemd/web test -- --run`、`pnpm --filter @wemd/web exec tsc -b`、`pnpm --filter @wemd/web lint`。
- [x] E3 `pnpm --filter wemd-electron test`（含 tsc）。
- [x] E4 交叉检查：`get_context.py --mode packages` 列出的受影响包 spec Quality Check。

## F. 联调（临时凭据，最小样例）

- [x] F1 用临时 Key 对 `https://opencode.ai/zen/go/v1` 发送专用最小样例，比较缺少/携带 `x-opencode-session` 的结果，记录状态与结论，不记录凭据。
- [x] F2 完成一次真实改写（正文+高亮词解析）；不发送用户当前文章。
- [x] F3 报告：修改文件、验证结果、供应商兼容性限制（CORS/用途/模型）。

## 复核修复（评审 P2，2026-09-19）

- [x] 会话 ID 非空/长度之外补充字符集校验：Web/Electron 校验解析后的会话值（CR/LF、控制字符、超出 Latin-1 均拒绝），IPC `readSessionId` 同步拒绝；补“请求未发出”断言。
- [x] 固定头值拒绝超出 ISO-8859-1 的字符（ByteString 限制），在字段校验阶段报错；补原生 `Headers` 断言，避免 fetch mock 掩盖 TypeError。

## 回退点

- 每阶段可独立回退：A/B/C/D 均为增量字段与新增函数；停用自定义行即恢复原请求头集合。
- 不修改 Nest 服务端、`ai-secret-store.ts` 存储格式、URL 规范化行为。
