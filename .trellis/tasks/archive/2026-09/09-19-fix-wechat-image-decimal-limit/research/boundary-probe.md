# 微信图片大小边界探针记录

任务：`09-19-fix-wechat-image-decimal-limit`。探针脚本：`research/probe-image-limit.mjs`（生成精确字节数的合法 PNG，直连 `/api/wechat-images` 上传并记录 HTTP 状态与响应体）。

## 状态：真实微信实测未执行

原 PRD 要求直连 `/api/wechat-images` 上传 949,000 / 999,000 / 1,001,000 / 1,048,000 四张真实图片，记录 HTTP 状态与微信 `errcode`。**2026-09-20 用户决定跳过**：真实实测需要微信公众号凭据 + 服务器出口 IP 白名单，不在本轮环境内（`apps/server/.env` 不存在；仓库内无任何已执行的实测数据）。

因此本任务采用**本地无凭据探针**作为可复现替代证据（下述两次运行），并声明：

- 十进制 1,000,000 口径目前**仅有人工确认**，无实测支撑；
- 探针脚本与命令已保留，凭据就绪后可直接补跑；
- **若补跑结果与十进制假设不符，须按实测值重设常量并回滚本次口径。**

### 补跑方式（凭据就绪后）

```bash
# 1) 在 apps/server/.env 配置 WECHAT_APP_ID / WECHAT_APP_SECRET / WECHAT_UPLOAD_KEY，
#    并确保服务器出口 IP 在公众号白名单内
# 2) 起服务
pnpm --filter @wemd/server dev
# 3) 直连实测（密钥从 .env 读取，不进命令行）
node .trellis/tasks/09-19-fix-wechat-image-decimal-limit/research/probe-image-limit.mjs \
  --base http://localhost:4000/api \
  --sizes 949000,999000,1001000,1048000
```

预期：949,000 / 999,000 返回 201 与微信 URL；1,001,000 / 1,048,000 在改后代码下被本地 413 拦下。若要单独验证微信侧口径，可用 `--sizes 1000000` 对**改前代码**运行，观察是否返回 40009。

## 运行 1：改前基线（2026-09-20）

环境：`WECHAT_UPLOAD_KEY=<dummy 32 位>`、`PORT=4137`、未配置微信凭据（`pnpm --filter @wemd/server dev`，代码上限仍为 `1024 * 1024 = 1,048,576`）。

| 字节数    | HTTP | 响应体                                                         |
| --------- | ---- | -------------------------------------------------------------- |
| 949,000   | 503  | `{"message":"微信公众号 AppID/AppSecret 未配置", ...}`         |
| 999,000   | 503  | 同上                                                           |
| 1,000,000 | 503  | 同上                                                           |
| 1,001,000 | 503  | 同上                                                           |
| 1,048,000 | 503  | 同上                                                           |
| 1,048,576 | 413  | `{"message":"File too large","error":"Payload Too Large",...}` |

解读：

- 503 = 通过 multer 与 `validateFile` 两层本地校验，止于"未配置微信凭据"这一步；换言之 **1,000,000 / 1,001,000 / 1,048,000 三档在改前代码下会被原样转发给微信**。按用户口径（微信十进制 1,000,000 判定），它们将换回 `40009`——这就是"假通过区间"的本地半段证据。
- 1,048,576（`1024 * 1024`）→ 413，且响应体是 busboy/Nest 的英文默认文案 `File too large`，与源码阅读一致（busboy 在 `fileSize === limit` 时即触发 `LIMIT_FILE_SIZE`）。
- 本环境无微信凭据，任何一次请求都不可能触达微信；因此本表不包含微信 `errcode`。

## 运行 2：改后复验（由用户执行，2026-09-20 决定）

用户要求改后复验与最终测试由其本人执行（未由 AI 实跑）。可复现命令：

```bash
# 无需微信凭据，仅验证本地拦截口径
WECHAT_UPLOAD_KEY=0123456789abcdef0123456789abcdef PORT=4137 pnpm --filter @wemd/server dev
node .trellis/tasks/09-19-fix-wechat-image-decimal-limit/research/probe-image-limit.mjs \
  --base http://localhost:4137/api \
  --key 0123456789abcdef0123456789abcdef
```

预期：949,000 / 999,000 → 503（本地放行，止于未配置凭据）；1,000,000 / 1,001,000 / 1,048,000 / 1,048,576 → 413（本地拦下，不再可能触达微信）。与运行 1 对照即可看出假通过区间被关闭。

## 未覆盖

- 微信真实 `errcode` 与十进制口径（需凭据 + IP 白名单，见上）。
- 改后复验的本地 HTTP 实测（命令已备，由用户执行）。
- nginx `client_max_body_size` 默认值对真实部署的影响（另开任务）。
- 上游 40009 归因文案（本任务新增）只能由自动化测试验证，无法在无凭据环境实测。
