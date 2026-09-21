# 执行计划

每步可独立回退；测试命令在仓库根目录执行。

## S0 改前基线证据（先于任何代码改动）

1. 用 dummy 密钥起服务（无需微信凭据）：
   `WECHAT_UPLOAD_KEY=<32位dummy> PORT=<空闲端口> pnpm --filter @wemd/server dev`
2. 跑探针：`node .trellis/tasks/09-19-fix-wechat-image-decimal-limit/research/probe-image-limit.mjs --base http://localhost:<端口>/api --key <32位dummy>`
3. 预期（现状代码，上限 1,048,576）：949,000 / 999,000 / 1,000,000 / 1,048,000 → **503**（本地全放行，止于未配置微信凭据，即"假通过区间"演示）；1,048,576 → **413**。
4. 结果写入 `research/boundary-probe.md`（标注为改前基线）。

## S1 服务端常量与文案

`apps/server/src/wechat-image/wechat-image.service.ts`

- :14 → `export const WECHAT_IMAGE_MAX_BYTES = 1_000_000;`
- :67 → `throw new PayloadTooLargeException('微信公众号图片必须小于 1,000,000 字节');`
- `upstreamError`（:228-238）增加 `40009` 分支，文案见 design D5。

## S2 服务端测试

`apps/server/src/wechat-image/wechat-image.service.spec.ts`

- 重写 :121-129：①999,999 放行（fetch 恰被调用一次且成功返回）；②1,000,000 拒；③1,000,001 拒；④1,048,575 拒。后三例断言新文案且 `fetchMock` 未被调用；测试名不再含 "1 MiB"。
- 新增 40009 用例（仿 :213-226 的 40164 用例）：上游返回 `40009` → 502，文案含 `微信判定图片尺寸或大小超限`。
- 新增 tripwire 用例：读 `apps/web/src/services/image/uploaders/WechatUploader.ts`，解析常量并断言相等（见 design D3）。

`apps/server/src/wechat-image/wechat-image.controller.spec.ts`

- 重写 :99-109：测试名改为字节口径；对 1,000,000 与 1,000,001 两个尺寸断言 413 且 `upload` 未被调用。

运行：`pnpm --filter @wemd/server test`

## S3 客户端常量与文案

`apps/web/src/services/image/uploaders/WechatUploader.ts`

- :3 → `1_000_000` + 镜像注释（design D2）
- :82 → `"微信公众号图片必须小于 1,000,000 字节"`

## S4 客户端测试

`apps/web/src/__tests__/services/WechatUploader.test.ts`

- 重写 :111-119：断言 1,000,000 拒（新文案）；补 999,999 放行、1,000,001 拒 两例；测试名去掉 "1 MiB"。
- :159-165（manager 路径 11 MB）→ 断言新文案。
- 新增 tripwire 用例：读 `apps/server/src/wechat-image/wechat-image.service.ts` 断言常量相等。

运行：`pnpm --filter @wemd/web test --run src/__tests__/services/WechatUploader.test.ts`

## S5 文案与文档

- `apps/web/src/components/Settings/ImageHostSettingsPanels.tsx:205`
- `apps/server/README.md:82,106`
- `apps/web/src/services/image/README.md:40`

统一改为"严格小于 1,000,000 字节"。

## S6 改后实测（2026-09-20 调整：由用户执行）

用户要求改后复验与最终测试由其本人执行，S6 未由 AI 实跑。命令与预期已写入 `research/boundary-probe.md`「运行 2」。

## S7 全量验证

- `pnpm --filter @wemd/server test`
- `pnpm --filter @wemd/web exec vitest run`（全量；`pnpm --filter … test --run` 会被 pnpm 拒绝，需 `exec` 或 `--` 分隔）
- `pnpm --filter @wemd/server lint`、`pnpm --filter @wemd/web lint`（或根 `pnpm lint`）
- `pnpm --filter @wemd/server build`、`pnpm --filter @wemd/web build`
- 复核 grep：`1 MiB` 不再出现在 `apps/server`、`apps/web` 的源码与 README（`docs/plans` 历史文档不算）。

## S8 spec 更新与提交（Phase 3.3 / 3.4）

- `.trellis/spec/web/frontend/image-upload-limits.md`：wechat 行措辞与"used to compare"表述更新为现状。
- `.trellis/spec/server/backend/error-handling.md`：新增 40009 归因场景（仿 40164 结构）。
- 提交计划报审 → 执行提交（不 push）。

## 失败信号（出现即停下）

- 任一 <1,000,000 尺寸出现 413 或 400。
- 任一 ≥1,000,000 尺寸返回 503/201（说明拦截失效）。
- tripwire 解析失败（先确认是否真的重构了被读文件）。
- 残留 "1 MiB" 文案（源码与 README）。
