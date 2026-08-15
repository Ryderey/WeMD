# 新增微信公众号图片图床

## Goal

在现有图床设置中新增“公众号”选项。用户配置自托管 Nest 代理地址和受限上传密钥后，插图、粘贴图片和滚动长图上传均可通过微信 `uploadImage` 接口获得 URL，并将该 URL 写入 Markdown。

## Requirements

- 从 `bugfix` 的提交 `d7a5ad3` 在独立 worktree/分支中实现。
- 前端新增 `wechat` 图床类型，配置项仅包含 `apiBaseUrl` 与 `uploadKey`。
- 图床设置页可生成并复制 32 位随机 `uploadKey`，供使用者填入服务端环境变量。
- AppID、AppSecret 和微信 access token 仅保存在 Nest 服务端。
- 前端沿用“配置、测试连接、启用”的现有交互。
- 微信图床只接受原始 JPG/PNG 且文件必须严格小于 1 MiB。
- 微信图床不得压缩、转换或修复图片；WebP、GIF、超限和无效图片直接拒绝。
- 微信图床绕过现有自动压缩流程，其他图床行为保持不变。
- Nest 提供受 Bearer 密钥保护的状态检查和图片上传接口。
- 服务端再次验证 MIME、JPEG/PNG 魔数和文件大小。
- 使用稳定版 access token，内存缓存、提前刷新、并发合并；token 失效只重试一次。
- 稳定凭据必须调用官方 `POST /cgi-bin/stable_token`，并由测试锁定请求契约。
- 不修改 Docker、Compose、Nginx、CI 或发布脚本；README 明确部署尚未实现。
- README 说明 Nest 的 `.env`、本地启动、前端连接、稳定凭据和 IP 白名单配置。
- 仅公众号图床把上传原图缓存到本机，用于绕过微信站外引用提示并恢复右侧预览。
- 预览缓存按最近访问保留 7 天、软上限 50 MiB，只在应用启动时自动清理一次。

## Acceptance Criteria

- [x] 图床设置出现“公众号”选项，可保存代理地址和上传密钥、测试连接并启用。
- [x] 图床设置可生成并复制 32 位随机上传密钥。
- [x] 三个现有图片入口使用 `wechat` 时都把微信返回 URL 写入 Markdown。
- [x] 合规 JPG/PNG 原样上传，前端不调用压缩依赖。
- [x] `>= 1 MiB`、WebP、GIF 和无效图片在上传前得到明确错误。
- [x] `GET /api/wechat-images/status` 成功返回 `{ "ok": true }`。
- [x] `POST /api/wechat-images` 接收 `file` 并成功返回 `{ "url": "..." }`。
- [x] 错误密钥返回 401、缺失配置返回 503、超限返回 413、无效图片返回 400、微信上游失败返回 502。
- [x] 响应和日志不泄露 AppSecret 或 access token。
- [x] 测试确认使用微信官方稳定版凭据 endpoint 和请求体。
- [x] 服务端与图床 README 给出完整 Nest 配置步骤。
- [x] 前端、服务端测试与构建通过，现有图床回归测试通过。
- [x] 公众号图片命中本机缓存时显示原图，Markdown 和公众号复制仍使用微信 URL。
- [x] 其他图床不写入预览缓存；缓存失败、缺失或被清理时不影响上传和复制。

## Out of Scope

- 微信第三方平台 OAuth、多公众号、多租户、数据库和配额面板。
- 图片压缩、格式转换、动画处理或图片修复。
- Docker/Compose、反向代理、HTTPS、固定出口 IP 等生产部署实现。
