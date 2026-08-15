# 图床支持

WeMD 当前内置 6 类图床，均通过 `ImageHostManager` 统一管理。

## 支持的图床

| 图床       | 配置难度 | 说明                                         |
| ---------- | -------- | -------------------------------------------- |
| 官方图床   | ⭐       | 默认可用，开箱即用                           |
| 公众号     | ⭐⭐     | 通过自建 Nest 代理调用微信官方图片上传接口   |
| 七牛云     | ⭐⭐⭐   | 适合国内常见对象存储场景                     |
| 阿里云 OSS | ⭐⭐⭐   | 阿里云对象存储                               |
| 腾讯云 COS | ⭐⭐⭐   | 腾讯云对象存储                               |
| S3 兼容    | ⭐⭐⭐⭐ | 兼容 AWS S3 / Cloudflare R2 / MinIO / Spaces |

## 快速开始

### 1. 官方图床（默认）

无需配置，直接可用。

### 2. 公众号图床

前端需要填写：

- `apiBaseUrl`：自行部署的 Nest 服务 API 根地址，例如 `http://localhost:4000/api`
- `uploadKey`：与服务端 `WECHAT_UPLOAD_KEY` 相同的 Bearer 密钥，至少 32 个随机字符

设置页可一键生成并复制 32 位随机密钥；将它复制到服务端的 `WECHAT_UPLOAD_KEY` 后，
前端和服务端使用同一个值即可。

微信公众号 `AppSecret` 和 access token 不得填写或保存到前端。它们只配置在 Nest
服务端，详见 [`apps/server/README.md`](../../../../server/README.md)。

Nest 使用微信官方稳定版凭据接口
`POST https://api.weixin.qq.com/cgi-bin/stable_token`，在每次上传或测试连接时按需检查
内存缓存、临近到期才刷新 access token，不运行后台定时刷新。完整的 `.env`、本地
启动、前端连接及 IP 白名单配置步骤见上述服务端 README；官方说明见[获取稳定版接口调用凭据](https://developers.weixin.qq.com/doc/subscription/api/base/api_getstableaccesstoken.html)。

公众号图床只上传严格小于 1 MiB 的原始 JPEG/PNG。WebP、GIF、超限文件、MIME 与
内容不一致或无法识别的图片会直接拒绝；不会调用现有自动压缩，也不会转换或修复。
微信接口返回的 URL 会原样写入 Markdown，不转换 HTTP/HTTPS。该 URL 没有删除、
寿命及通用外链保证。

微信图片会阻止在公众号编辑器之外直接引用。WeMD 仅为通过 `wechat` 图床成功上传的
原始图片建立本机 IndexedDB 预览缓存，让右侧预览显示原图；Markdown 和复制结果仍
使用微信 URL，其他图床不使用该缓存。缓存按最近访问时间保留 7 天，并在应用启动时
清理一次；清理后总量超过 50 MiB 时继续按最久未使用顺序删除。本次运行期间允许
临时超过 50 MiB，不运行定时清理，也不在图片入库后清理。缓存缺失、过期或浏览器
存储不可用时，右侧预览会退回微信原 URL，并显示微信的禁止外链提示图。

当前只提供代码接口和本地启动方式。Docker/Compose、生产反向代理、HTTPS 和固定
出口 IP 部署尚未实现。使用者需自行部署 Nest 服务，并将其固定出口 IP 加入微信公众
号后台的 IP 白名单。

本地联调时先启动 `pnpm --filter @wemd/server dev`，再启动 `pnpm dev:desktop` 或
`pnpm dev:web`；完整的状态检查、PowerShell 上传命令和错误排查见
[`apps/server/README.md`](../../../../server/README.md)。
仓库已包含 Nest 服务代码，无需全局安装 Nest；但当前桌面 EXE 不会自动携带并启动
Nest，使用打包版需要自行运行或部署该服务。

### 3. 七牛云

需要填写：

- `accessKey`
- `secretKey`
- `bucket`
- `domain`
- `region`（可选，默认 `z0`）

### 4. 阿里云 OSS

需要填写：

- `accessKeyId`
- `accessKeySecret`
- `bucket`
- `region`
- `cdnHost`（可选）
- `path`（可选）

### 5. 腾讯云 COS

需要填写：

- `secretId`
- `secretKey`
- `bucket`
- `region`
- `cdnHost`（可选）
- `path`（可选）

### 6. S3 兼容

需要填写：

- `endpoint`
- `region`
- `accessKeyId`
- `secretAccessKey`
- `bucket`
- `pathPrefix`（可选）
- `customDomain`（可选）
- `forcePathStyle`（可选，MinIO 常用）

## 使用示例

```typescript
import { ImageHostManager } from "./services/image/ImageUploader";

const config = JSON.parse(
  localStorage.getItem("imageHostConfig") || '{"type":"official"}',
);

const manager = new ImageHostManager(config);
const url = await manager.upload(file);
```

## 常见问题

### Q: 是否支持 PicGo / PicList？

不直接对接工具本身，但支持 S3 兼容协议。  
如果 PicGo / PicList 配置的是同一套 S3 参数，可与 WeMD 共用同一存储后端。

### Q: 图片上传失败怎么办？

1. 检查图床配置是否完整。
2. 在图床设置面板点击“测试连接”。
3. 检查 Bucket 权限和 CORS 配置。
4. 查看浏览器控制台报错信息。

## 开发指南

### 添加新的图床支持

1. 在 `src/services/image/uploaders/` 新增 uploader。
2. 在 `ImageHostManager` 中注册新的 `type`。
3. 在 `ImageHostSettings` 中补充配置 UI。
