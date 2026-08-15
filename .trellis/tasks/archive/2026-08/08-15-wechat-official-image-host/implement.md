# Implementation Plan

1. 扩展前端图床类型、动态加载和设置面板，新增微信 adapter 及其测试。
2. 调整统一图片上传流程：`wechat` 校验并上传原图，其他 provider 保持现有压缩路径；补回归测试。
3. 新增 Nest 微信图片模块、Bearer guard、图片验证、token 缓存和微信上传调用；补单元/接口测试。
4. 更新图床 README 和 server README，仅说明配置、本地使用及尚未提供部署方案。
5. 运行前端/服务端测试、lint、build；检查跨层契约和 git diff。
6. 按 Trellis 流程更新规范判断、提交计划并完成任务。
7. 为公众号上传增加独立本机预览缓存：保存原始 Blob、预览替换微信 URL，并仅在启动时按 7 天/50 MiB LRU 清理；补缓存隔离与降级测试。

## Validation Commands

```powershell
pnpm --filter @wemd/web exec vitest run
pnpm --filter @wemd/web lint
pnpm --filter @wemd/web build
pnpm --filter @wemd/server test -- --runInBand
pnpm --filter @wemd/server lint
pnpm --filter @wemd/server build
```

## Rollback

移除 `wechat` provider、微信图片模块和对应文档即可；没有数据迁移或持久化状态需要回滚。
