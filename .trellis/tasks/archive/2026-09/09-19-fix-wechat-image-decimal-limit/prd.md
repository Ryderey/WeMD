# 修正微信图片上传 1MB 上限为十进制 1,000,000 字节

## Goal

微信 `uploadimg` 的"小于 1M"实际按**十进制 1,000,000 字节**判定（用户口径确认），而 WeMD 两端常量都写成 `1024 * 1024 = 1,048,576`。于是 1,000,000–1,048,575 字节这一段成为**假通过区间**：客户端放行、服务端 multer 放行、`validateFile` 放行，最后由微信返回 `40009 图片尺寸/大小超限`，用户只看到一句看不懂的上游错误。本任务把这条上限改成可确证的正确口径，让超限在本地/服务端就被拦下。

与 `docs/plans/2026-09-19-multi-image-scroll.md`（滚动长图多图方案）**相互独立**，不并入该轮改动。

## Background（已核对的现状）

| 位置                                                                       | 现值                                                                                      | 说明                               |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------- |
| `apps/server/src/wechat-image/wechat-image.service.ts:14`                  | `WECHAT_IMAGE_MAX_BYTES = 1024 * 1024`                                                    | 唯一服务端真源                     |
| `apps/server/src/wechat-image/wechat-image.service.ts:66-67`               | `file.buffer.length >= 上限` → `PayloadTooLargeException('微信公众号图片必须小于 1 MiB')` | 严格小于语义（`>=` 即拒）保持不变  |
| `apps/server/src/wechat-image/wechat-image.controller.ts:33`               | multer `limits.fileSize: WECHAT_IMAGE_MAX_BYTES`                                          | 引常量，随上面一起生效，无需单独改 |
| `apps/web/src/services/image/uploaders/WechatUploader.ts:3,81-82`          | 同名常量 + 同样的 `>=` 判定与文案                                                         | 客户端镜像校验，两处必须同源同值   |
| `apps/web/src/components/Settings/ImageHostSettingsPanels.tsx:205`         | "仅接受严格小于 1 MiB 的 JPG/PNG 原图…"                                                   | 面向用户的设置页文案               |
| `apps/server/README.md:82,106`、`apps/web/src/services/image/README.md:40` | "严格小于 1 MiB"                                                                          | 文档口径                           |

## Requirements

1. 服务端与客户端的微信图片上限常量都改为 **1,000,000 字节**，保留"严格小于"（`>=` 即拒）语义，不改判定方向。
2. 两处常量必须表达同一事实：服务端导出值为源，客户端要么继续显式镜像但注释指明与上游口径的对应关系，要么抽到共享位置——按 `.trellis/spec/server/backend` 与 `.trellis/spec/web/frontend` 现有跨包约定取舍，不为此新增共享包或新依赖。
3. 所有面向用户的文案改为**带千分位的字节数**（"必须小于 1,000,000 字节"），不再只写"1 MiB"；`apps/server/README.md`、`apps/web/src/services/image/README.md` 同步。理由：Windows 资源管理器列表视图按整 MB 向上取整显示，用户无法用"1 MB"对照极限值。
4. 服务端错误信息需可区分"本服务拦下"与"微信上游拒掉"，不得把 `40009` 原样抛成用户唯一可见的线索。
5. 本任务**不含**任何压缩、缩放、格式转换逻辑；也**不动**非微信图床的 10 MB（`ImageUploader.ts:87-90`）与 5 MB（`upload.controller.ts:57`）上限。

## Acceptance Criteria

- [ ] 边界单测钉住新口径：999,999 放行；1,000,000 拒；1,000,001 拒；1,048,575 拒。服务端 `wechat-image.service.spec.ts:121-126`（原"one MiB boundary"）、`wechat-image.controller.spec.ts:99-107`（原"over one MiB → 413"）、客户端 `apps/web/src/__tests__/services/WechatUploader.test.ts:111-117,162-163` 全部按新值重写，测试名与断言文案不再出现"1 MiB"。
- [ ] 1,000,000–1,048,575 区间的文件在任何一端都被拦下，不再有请求打到微信。
- [ ] 客户端与服务端常量一致性有测试或编译期约束保证（修改一处而漏改另一处时要有失败信号）。
- [ ] 设置页与两份 README 的口径、错误文案与常量一致；`pnpm --filter @wemd/server test`、`pnpm --filter @wemd/web exec vitest run src/__tests__/services/WechatUploader.test.ts` 及两端 build/lint 全绿。
  - 注：`pnpm --filter @wemd/web test --run …` 会被 pnpm 当作自身选项拒绝（需 `--` 分隔），实际可用命令见上（2026-09-20 实测）。
- [ ] `research/boundary-probe.md` 记录本任务的边界证据。**2026-09-20 用户决定跳过真实微信实测**（凭据与 IP 白名单不在本轮环境内），并要求改后复验与最终测试由用户本人执行。文件现状：①改前基线（六个尺寸的本地 HTTP 实测）已完成并记录；②改后复验与真实微信补跑的**可复现命令已写入该文件**，由用户在最终验证阶段执行。**若补跑结果与十进制假设不符，须回滚本次口径并按其重设常量。**

## Notes / 顺带核查项（不在验收内，发现即记录）

- `nginx.conf` 未设 `client_max_body_size`（全仓无该指令），默认 `1m` 且按**整个请求体**计（含 multipart boundary、`Content-Disposition` 等数百字节封装）。也就是说真实部署在 nginx 之后时，约 1.048 MB 以上的请求可能先吃 413——这条对非微信图床的 5 MB 路径影响更大。把常量收到 1,000,000 会让本任务路径更安全，但不解决那条默认值问题；若确认部署形态确实经过 nginx，另开任务显式设定该指令。
- multer `fileSize` 只数文件字节，nginx 数整体请求体，两者本就不同界；不要试图用同一个数字表达两者。
- multer 超限（`>= 1,000,000`）由 busboy 在 `fileSize === limit` 时触发 `LIMIT_FILE_SIZE`，Nest 默认映射为英文 413 `File too large`。**2026-09-20 决定不改**：该路径只对直连 API 的调用方可见（WeMD 客户端用同一常量在本地先拦），改它需要额外异常处理，超出本任务最小范围。已作为已知观察记录。

## 决策记录（2026-09-20）

1. **跳过真实微信边界实测，按十进制口径直接改代码**（用户在两项方案中明确选择）。未实测部分按上文验收项 5 处理：写"未执行 + 替代证据 + 补跑方式"，不伪装成已实测。
2. **multer 英文 413 文案不处理**（见 Notes 末条）。
3. 常量一致性采用"两端各一条 tripwire 测试互读对端源码"（详见 `design.md` D3）。
