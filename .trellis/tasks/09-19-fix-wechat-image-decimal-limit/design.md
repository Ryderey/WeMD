# 设计：微信图片上限修正为十进制 1,000,000 字节

## 范围与边界

- 改动包：`apps/server`（wechat-image 模块）、`apps/web`（image 服务、设置页、两份 README）。
- 不改：`imageUploadLimits.ts` 的 950,000 客户端门槛；非微信图床的 10 MB / 5 MB；任何压缩、缩放、格式转换逻辑；`nginx.conf`（另开任务）。
- 无接口签名变化、无数据迁移、无新依赖。

## D1 常量与语义

- `apps/server/src/wechat-image/wechat-image.service.ts:14`：`WECHAT_IMAGE_MAX_BYTES` 由 `1024 * 1024` 改为 `1_000_000`，导出名不变（`wechat-image.controller.ts:33` 的 multer `limits.fileSize` 自动跟随，无需改动）。
- 判定方向不变：`>= 上限` 即拒（严格小于语义）。
- 依据：微信 `uploadimg` 按十进制 1,000,000 字节判定（用户 2026-09-19 确认）。**该假设无实测支撑，是本任务登记在案的风险**（见文末）。

## D2 真源与镜像

- 服务端导出值为唯一真源；客户端 `apps/web/src/services/image/uploaders/WechatUploader.ts:3` 保留独立同名常量，注释指明"镜像服务端 `wechat-image.service.ts` 的 WECHAT_IMAGE_MAX_BYTES；口径为微信十进制 1,000,000 字节"。
- 不抽共享位置：`apps/server` 不依赖 `@wemd/core`（`apps/web` 依赖），搬常量进 core 等于给 server 加新依赖，PRD 已排除。

## D3 一致性 tripwire（PRD 验收项 3）

- 问题：单侧测试覆盖不了"改一端漏改另一端"。`turbo.json` 没有 `test` 任务，各包测试独立运行——只在 web 放一致性测试时，"改 server 常量 + 只跑 server 测试"会全绿漏过。
- 做法：两端各一条测试，读取**对端源文件**，用与实现同名的导出解析数值并断言相等：
  - web 侧（`WechatUploader.test.ts`）读 `apps/server/src/wechat-image/wechat-image.service.ts`；
  - server 侧（`wechat-image.service.spec.ts`）读 `apps/web/src/services/image/uploaders/WechatUploader.ts`。
- 解析：正则匹配 `export const WECHAT_IMAGE_MAX_BYTES = <数值字面量>;`（接受 `_` 分隔符与 `1024 * 1024` 形式的表达式由实现方统一），解析失败即测试失败——文件改名/搬移会红，这是预期的失败信号。
- 备选未采用：常量搬 `packages/core`（需给 server 加依赖）；构建脚本生成（引入新机制）。

## D4 multer 与服务端双层拦截

- 事实（已核对 `busboy@1.6.0/lib/types/multipart.js:467-481`）：busboy 在 `fileSize === limits.fileSize` 时即触发 `'limit'`，multer 报 `LIMIT_FILE_SIZE`，Nest 映射为 413，文案是英文默认值 `File too large`。
- 推论：常量改小后，**HTTP 路径上由 multer 承担 `>= 1,000,000` 的拦截**；`validateFile` 的同类检查成为防御层（HTTP 不可达，但保留并由单测钉住语义）。
- 决定（用户 2026-09-20）：不翻译 multer 的英文 413 文案，最小范围；该路径只对直连 API 的调用方可见，README 已写"400/413 表示格式或大小不符"。

## D5 上游 40009 归因（PRD 需求 4）

- 现状：所有非 0 errcode 统一为 `微信图片上传失败 (代码)`，40009 只剩一个代码。
- 改法：仿既有 40164 分支，在 `upstreamError` 中为 `40009` 追加中文说明：
  `微信图片上传失败 (40009)：微信判定图片尺寸或大小超限`
- 与"本服务拦下"的区分：本地 413 文案是 `微信公众号图片必须小于 1,000,000 字节`（含字节数），上游 502 以 `微信图片上传失败 (40009)` 开头，一眼可分。
- 不拼接上游 `errmsg` 原文（`error-handling.md` 的 Bad 例：可能带出无关诊断信息）。

## D6 文案口径（PRD 需求 3）

- 所有用户可见的 "1 MiB" 表述改为 "1,000,000 字节"：服务端 413、客户端 `validateFile`、设置页说明、两份 README。
- 950,000 门槛相关文案（弹窗内）已是字节数口径，不动。

## 契约

`POST /api/wechat-images`（multipart `file`）

| 输入                        | 生效层           | 结果                                                       |
| --------------------------- | ---------------- | ---------------------------------------------------------- |
| < 1,000,000 且格式/签名合法 | multer → service | 透传微信，201 `{url}`                                      |
| ≥ 1,000,000                 | multer（busboy） | 413 `File too large`，不进入 handler（已知观察）           |
| 格式/签名不合法             | `validateFile`   | 400 中文文案                                               |
| 微信返回 40009              | `upstreamError`  | 502 `微信图片上传失败 (40009)：微信判定图片尺寸或大小超限` |

客户端 `WechatUploader.upload`：`file.size >= 1,000,000` → 本地抛错（不发请求）。

## 兼容与回滚

- 兼容：更严的上限只会把 1,000,000–1,048,575 的"假通过区间"提前拦下；未升级的旧客户端在该区间仍本地放行，但服务端 413 兜底，用户看到中文 413 而不是上游 40009——正是本任务目标。
- 回滚：两端各一行常量 + 若干文案字符串，单独 revert 即可；S1（服务端）与 S3（客户端）互不依赖。

## 风险与未覆盖

- **十进制假设无实测**（2026-09-20 决定跳过真实微信实测）：若假设错误，表现为 <1,000,000 的文件也可能收到上游 `40009`；届时按 `research/boundary-probe.md` 的补跑流程取实测值重设常量并回滚口径。
- tripwire 依赖源码文本匹配，重构（改名/换文件）会使其失败；需同步维护路径，属预期信号。
- 真实微信端到端、IP 白名单、nginx `client_max_body_size` 默认值行为均不在本任务覆盖。
