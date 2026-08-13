# 滚动长图实施计划

1. 在 Core 中实现并注册 `scroll-image` 容器插件，补齐解析、边界、回退、可访问性和横向图片流回归测试。
2. 新增滚动长图设置弹窗和工具栏入口，复用现有上传/压缩链路，补齐交互测试与语法帮助。
3. 增加公众号复制集成测试，验证完整规范化后的关键内联样式。
4. 运行 Core/Web 测试、lint、TypeScript 构建和全项目构建；修复全部本次引入的问题。
5. 启动本地 WeMD，用 Chrome DevTools MCP 完成本地和公众号真实粘贴、界面与保存重开验证，保留截图证据后删除测试草稿；不发送预览。
6. 执行 Trellis 检查、评估规范更新、整理提交计划并等待用户确认。

## Validation commands

```powershell
pnpm --filter @wemd/core test -- --run
pnpm --filter @wemd/web test -- --run
pnpm --filter @wemd/web lint
pnpm --filter @wemd/core build
pnpm --filter @wemd/web build
pnpm build
```
