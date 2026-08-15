# 微信 uploadImage 官方约束摘要

- 接口：`POST https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=ACCESS_TOKEN`。
- 接口必须在服务端调用；请求字段为 `media`，返回图片 `url`。
- 仅支持 JPG/PNG，文件必须小于 1 MB。
- AppSecret/access token 需要服务端保管。
- URL 生命周期、站外外链、删除和列表能力未获官方保证。

## 稳定版接口调用凭据核对

- 官方稳定版接口为 `POST https://api.weixin.qq.com/cgi-bin/stable_token`，无查询参数；JSON 请求体必填 `grant_type: "client_credential"`、`appid`、`secret`，`force_refresh` 为可选布尔值且默认 `false`。
- `force_refresh: false` 是普通模式：凭据有效期内重复调用会返回原 token，并通过 `expires_in` 返回剩余有效秒数。平台会在普通模式下提前 5 分钟更新 token。
- `force_refresh: true` 会立即使上一个 token 失效并返回新 token。官方要求谨慎使用，强制刷新每天最多 20 次，连续调用至少间隔 30 秒。
- 返回字段为 `access_token` 和 `expires_in`；`expires_in` 是剩余有效时间（秒），目前为不超过 7200 秒的值，并不保证每次都是 7200。
- 官方明确该接口应在服务器端调用，不可由网页、小程序或 App 前端直接调用；稳定版 token 与旧版 `getAccessToken` 获取的 token 相互隔离。
- 错误码 `40164 invalid ip not in whitelist` 表示调用方公网来源 IP 未加入公众号 IP 白名单。由此可推知，本方案应将 Nest 进程实际访问微信时使用的公网出口 IP 加白；固定出口 IP 是减少白名单维护的部署建议，不是请求参数。

## 与当前实现的对照

- `wechat-image.service.ts` 使用的端点、POST 方法、JSON 字段、普通模式、`expires_in` 缓存以及 token 失效后单次强刷重试，均与稳定版接口定义一致。
- 本地缓存再提前 5 分钟过期是保守策略，兼容官方返回“剩余有效秒数”的语义；缓存只在状态检查或上传请求到来时检查，不运行后台定时刷新。
- 当前实现会合并同一时刻的并发刷新，并阻止 30 秒内连续调用 `force_refresh: true`。官方每天最多 20 次的限制作为运维约束记录在 README；计数未跨进程或重启持久化，持续 token 失效时应排查配置而不是反复重试。正常缓存路径不会触发强刷。

## 官方来源

- [获取稳定版接口调用凭据](https://developers.weixin.qq.com/doc/subscription/api/base/api_getstableaccesstoken.html)
- [上传发表内容中的图片](https://developers.weixin.qq.com/doc/service/api/notify/message/api_uploadimage.html)
- [接口调用指南](https://developers.weixin.qq.com/doc/oplatform/developers/dev/guide.html)
