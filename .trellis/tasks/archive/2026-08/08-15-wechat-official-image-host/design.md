# Design

## Data Flow

`Editor entry -> uploadEditorImage -> WechatUploader -> Nest /api/wechat-images -> WeChat stable token/uploadimg -> URL -> Markdown`

`wechat upload success -> IndexedDB original Blob cache keyed by WeChat URL -> preview-only blob URL`

`uploadEditorImage` 先读取当前图床。`wechat` 分支校验原始文件并跳过 `prepareImageForUpload`；其他分支保持原调用顺序和参数。

## Frontend Contract

- `ImageHostConfig.type` 增加 `wechat`。
- 配置：`{ apiBaseUrl: string; uploadKey: string }`。
- `GET {apiBaseUrl}/wechat-images/status`，Bearer 鉴权，`response.ok` 表示连接有效。
- `POST {apiBaseUrl}/wechat-images`，Bearer 鉴权，multipart 字段名为 `file`，读取 `{ url }`。
- 前端快速校验 MIME、大小和文件魔数；服务端验证是最终信任边界。
- 仅 `wechat` 上传成功后保存原始 Blob；Markdown 和公众号复制继续使用微信 URL。
- 右侧预览按微信 URL 查询独立 IndexedDB，命中后仅替换预览 DOM 中的 `src`。
- 缓存按最近访问保留 7 天、软上限 50 MiB，只在应用启动时清理一次；入库不清理。

## Backend Contract

- 新增独立微信图片模块，外部接口只有状态检查与上传。
- 环境变量：`WECHAT_APP_ID`、`WECHAT_APP_SECRET`、`WECHAT_UPLOAD_KEY`。
- 上传密钥至少 32 字符；缺失或不匹配返回 401/503。
- 合规 MIME 为 `image/jpeg`、`image/png`，大小严格 `< 1024 * 1024`；同时校验文件魔数。
- 稳定 token 通过 `/cgi-bin/stable_token` 获取，缓存至 `expires_in - 300s`，并发刷新复用同一 Promise。
- 微信上传通过 `/cgi-bin/media/uploadimg`，上游 multipart 字段为 `media`。
- `40001`、`40014`、`42001` 清理 token 后重试一次；强制刷新至少间隔 30 秒，其他上游错误直接映射为 502。
- 返回 URL 保持微信原值，不改写协议。

## Compatibility

- 现有 localStorage 配置无需迁移，默认图床仍为 `official`。
- 不修改 `autoCompressImage`；现有 provider 的 2 MiB 自动压缩行为不变。
- 不修改现有 `/api/upload` local/COS 路由。
- IndexedDB 缓存失败不影响上传；历史微信 URL、缓存缺失或清理后退回微信站外提示图。

## Operational Boundary

代码只提供 Nest 接口和本地运行说明。生产部署、固定出口 IP、微信白名单、HTTPS 和反向代理由使用者自行完成，并在 README 中明确标注未实现。
