# WeMD Server

## 微信公众号图片代理

本服务提供微信公众号图片上传所需的服务端代理，微信公众号的 `AppSecret` 和
`access token` 只保留在 Nest 服务端，不会下发到前端。

### 1. 准备公众号配置

1. 在微信公众号后台取得该公众号的 `AppID` 和 `AppSecret`。
2. 将运行 Nest 服务的公网出口 IP 加入公众号 IP 白名单。微信校验的是请求实际到达
   微信服务器时的来源 IP；使用代理时应以该请求实际走的出口为准。
3. 在 WeMD“图床设置 → 公众号”中点击“生成 32 位密钥”并复制。该密钥只用于保护
   WeMD 到 Nest 的上传接口，不是微信 AppSecret。

### 2. 配置 Nest 环境变量

从 `apps/server/.env.example` 复制出 `apps/server/.env`（`.env` 已被 Git 忽略），再填写：

```dotenv
WECHAT_APP_ID=公众号AppID
WECHAT_APP_SECRET=公众号AppSecret
WECHAT_UPLOAD_KEY=设置页生成并复制的32位密钥
# PORT=4000
```

前端“上传密钥”与 `WECHAT_UPLOAD_KEY` 必须完全一致。不要把 `AppSecret` 写入前端
设置、源码或提交到 Git。

### 3. 本地启动与前端连接

无需全局安装 Nest，也无需新建服务；本仓库的 `apps/server` 已包含 Nest 服务代码。
从仓库根目录执行一次 `pnpm install` 安装项目依赖，再启动它：

```bash
pnpm install
pnpm --filter @wemd/server dev
```

服务默认监听 `http://localhost:4000`。在 WeMD 公众号图床设置中填写：

- 服务端 API 地址：`http://localhost:4000/api`
- 上传密钥：与 `WECHAT_UPLOAD_KEY` 相同的值

点击“测试连接”，显示“配置有效”后再启用。测试连接会验证 Bearer 密钥、Nest 的
AppID/AppSecret 配置、公众号 IP 白名单以及稳定版 access token 获取能力。

### 4. 本地联调

准备好 `apps/server/.env` 后，在两个终端分别运行：

```bash
# 终端 A：Nest 图片代理
pnpm --filter @wemd/server dev

# 终端 B：任选一种客户端
pnpm dev:desktop  # Electron 桌面版
# 或 pnpm dev:web # 浏览器版
```

在 WeMD“图床设置 → 公众号”填写 `http://localhost:4000/api` 和与 `.env` 相同的
上传密钥，点击“测试连接”。也可以在 PowerShell 直接验证服务端：

```powershell
$weChatUploadKey = "与 WECHAT_UPLOAD_KEY 相同的值"
$headers = @{ Authorization = "Bearer $weChatUploadKey" }

Invoke-RestMethod `
  -Uri "http://localhost:4000/api/wechat-images/status" `
  -Headers $headers
```

成功时返回：

```json
{ "ok": true }
```

再使用一张严格小于 1 MiB 的真实 JPEG/PNG 文件验证上传。Windows PowerShell 中可用
`curl.exe`，避免 PowerShell 的 `curl` 别名：

```powershell
curl.exe -X POST "http://localhost:4000/api/wechat-images" `
  -H "Authorization: Bearer $weChatUploadKey" `
  -F "file=@C:\Temp\test.jpg;type=image/jpeg"
```

成功时返回 `{ "url": "..." }`。也可在编辑器工具栏、粘贴图片或滚动长图入口上传
同一张图片，确认 Markdown 写入微信返回的 URL。

常见结果：401 表示上传密钥不一致；503 表示服务端环境变量缺失；502 通常需要检查
AppID/AppSecret、微信 IP 白名单或网络出口；400/413 表示图片格式或大小不符合限制。

### 5. 接口与鉴权

Nest 提供：

- `GET /api/wechat-images/status`：验证服务端配置及微信 access token 获取能力。
- `POST /api/wechat-images`：通过 `multipart/form-data` 的 `file` 字段上传图片。

两个接口都要求请求头 `Authorization: Bearer <WECHAT_UPLOAD_KEY>`。上传接口只接受
MIME 和文件内容均为 JPEG/PNG、且严格小于 1 MiB 的原始文件；服务不会压缩、转换或
修复图片。

### 稳定版 access token

服务使用微信官方“获取稳定版接口调用凭据”：

```text
POST https://api.weixin.qq.com/cgi-bin/stable_token
```

请求体使用 `grant_type=client_credential`、`appid`、`secret` 和 `force_refresh`。
access token 只缓存在 Nest 内存中，不运行定时刷新任务。每次状态检查或图片上传时，
服务才检查缓存；在微信返回的 `expires_in` 到期前 5 分钟内才按需刷新，其他时间直接
复用缓存。并发刷新会合并为一次请求。微信返回 token 失效错误时，服务清理缓存、
强制刷新并只重试一次。代码会阻止 30 秒内连续强制刷新；微信官方同时限制每天最多
强制刷新 20 次，因此持续出现 token 失效时应先检查 AppSecret、IP 白名单和其他服务
是否在刷新同一公众号 token，不要反复重试。

官方文档：[获取稳定版接口调用凭据](https://developers.weixin.qq.com/doc/subscription/api/base/api_getstableaccesstoken.html)

### 部署状态

当前只提供代码接口和本地启动方式。Docker/Compose、生产反向代理、HTTPS 和固定
出口 IP 部署尚未实现。使用者需自行部署 Nest 服务、妥善保护环境变量，并把服务的
固定出口 IP 加入微信公众号后台的 IP 白名单。当前桌面 EXE 不会自动携带并启动 Nest；
使用打包版时仍需另行运行此服务或配置一个已部署的服务地址。

---

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

本仓库暂未提供生产部署方案，详见文档开头的“部署状态”。

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
