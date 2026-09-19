# Design：导出图文 AI 自定义请求头与会话 ID

## 数据模型

`RichPostAiSettings` 增量字段：

```ts
interface RichPostAiCustomHeader {
  name: string;
  value: string;
  valueSource: "literal" | "session";
  enabled: boolean;
  remember: boolean;
}
interface RichPostAiSettings {
  baseUrl: string;
  model: string;
  prompt: string;
  customHeaders: RichPostAiCustomHeader[];
}
```

持久化（Web localStorage / 渲染进程内存）只写入 `remember === true` 的行；`valueSource === "session"` 的行不写入生成的 ID。加载时逐项验证结构，非法项丢弃回退为空数组；旧配置缺字段按空数组处理。

## 会话生命周期

- 每次“导出图文”上下文持有 `sessionId: string`（`crypto.randomUUID()`，两端均可用；Electron 渲染进程与 Web 相同）。
- 重置条件（任一变化）：弹窗关闭后重新打开、`currentFilePath` 变化（文章身份）、`baseUrl` 规范化结果变化。
- 不重置：正文/标题编辑、模型或提示词修改、探测与改写交替。
- 判断依据用 `currentFilePath`（编辑器现有文章身份字段），不用标题/正文。
- 请求前捕获配置与 sessionId 快照，异步返回不受后续编辑影响。
- 会话 ID 不落盘、不含文章信息。

## 请求头构建（共享规则，两端各自实现）

处理顺序：基础配置与自定义行 → 校验 → 解析自动会话值 → 构建 Headers → 发送。

1. 名称大小写不敏感；启用行内重复名（忽略大小写）报错，不静默覆盖。
2. 合法 HTTP field-name：`^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$`；值拒绝 `\r`、`\n` 与非法控制字符；启用行值不能为空（自动模式校验解析后的值）。
3. 完全空白的占位行（名称与值皆空）跳过，不计入也不报错；半填且启用的行报错。
4. 系统头保留：Authorization、Content-Type（任何大小写变体）禁止用户覆盖。
5. 传输层/浏览器受限头拒绝：Host、Content-Length、Cookie、Connection、Transfer-Encoding、Upgrade、TE、Trailer、Proxy-_（前缀）、Sec-_（前缀）等；Web 端再受浏览器 Fetch 实测限制，错误信息说明该可能性。
6. 限制：≤20 行启用（含半填报错行），名称+值编码后合计 ≤16KB（两端一致）。
7. 校验错误使用明确的字段级消息，不能被现有 `instanceof TypeError` 网络分支误分类（校验在 fetch 之前抛出，非 TypeError）。

## IPC 契约

`ai:probe` / `ai:rewrite` payload 增量字段 `customHeaders: RichPostAiCustomHeader[]`、`sessionId?: string`（自动模式必需非空，长度 ≤128）。主进程 `readBoundedArray` 风格显式解析：逐项验证 name/value/valueSource/enabled（remember 可忽略），拒绝未知结构；随后复用同一构建函数校验（重复名、保留头、16KB）。端点绑定检查顺序保持：先 `assertApprovedRichPostEndpoint`，再构建头。

preload.ts 同步类型；`apps/web/src/types/electron.d.ts` 同步接口声明。

## 测试策略

- `apps/web/src/__tests__/services/richPostAi.test.ts`：fetch mock 断言 headers、会话解析、校验拒绝矩阵、持久化兼容与 remember 过滤。
- `apps/web/src/__tests__/components/RichPostAiSettings.test.tsx`：高级配置折叠、行增删改、错误行提示。
- `apps/web/src/__tests__/components/RichPostDialog.test.tsx`：会话 ID 稳定性（多次调用一致）、切换文章/端点/重开后变化、正文编辑不变。
- `apps/electron/src/shared/richPostAi.test.ts`：IPC 解析含 customHeaders/sessionId、非法输入拒绝、构建结果与 probe/rewrite 的 headers 断言。
- 命令：web `pnpm --filter @wemd/web test -- --run`、`pnpm --filter @wemd/web exec tsc -b`、`pnpm --filter @wemd/web lint`；electron `pnpm --filter wemd-electron test`（tsc + node --test）。

## 兼容与回退

新字段全部为增量；旧版本加载器只读原字段。回退 = 停用/删除自定义行。不涉及数据库或秘密存储迁移。

## 平台边界（如实告知）

- Web 端受 CORS 限制，服务端需允许新头；网络失败提示需说明，不能判定为 Key 无效。
- 不伪装其他编码客户端，不承诺自定义 User-Agent 解决 Web 限制。
- 探测固定 `max_tokens: 1`，模型/供应商不接受时单独定位，不误判为自定义头未生效。
