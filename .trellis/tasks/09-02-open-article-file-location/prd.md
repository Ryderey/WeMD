# 文章菜单打开文件位置

## Goal

在文章列表的更多操作菜单中增加“打开文件位置”，调用系统文件管理器并选中该文章文件。

## Requirements

- 仅在选中文章的菜单中显示“打开文件位置”，放在“复制标题”之后。
- 复用现有 `electron.fs.revealInFinder` 与 `file:reveal` IPC，不新增依赖或重复通道。
- 点击后关闭菜单，并由系统文件管理器打开文章所在目录、选中文件。
- 非 Electron 环境不显示该菜单项；文件夹菜单保持不变。

## Acceptance Criteria

- [x] Electron 环境下，文章菜单显示“打开文件位置”。
- [x] 点击菜单项时以文章的真实文件路径调用 `revealInFinder`，随后关闭菜单。
- [x] 非 Electron 环境及文件夹菜单不显示该功能。
- [x] 相关组件测试、TypeScript 检查和定向 lint 通过。
- [x] Windows 中手动关闭由该功能打开的资源管理器窗口后，WeMD 保持响应。

## Notes

- 现有主进程已通过 `shell.showItemInFolder` 实现 `file:reveal`，本任务只接入现有能力。
- 这是轻量 UI 接线任务，PRD 足以覆盖实现范围。
- 现有 IPC 与组件规范已经覆盖本次实现，没有新增需要沉淀的工程约定。
- 2026-09-02 捕获到一次 Electron 28.3.3 `AppHangB1`，发生在关闭系统资源管理器后。
- 最小 Electron、完整 WeMD 直接 IPC、真实菜单点击均可运行；COM `Quit()` 20 次与原生 `WM_CLOSE` 20 次压力循环均未复现，等待保留挂起进程的人工复现以采集线程证据。
- 使用项目标准入口 `pnpm dev:desktop` 完成真实菜单点击与资源管理器窗口关闭验证，WeMD 保持响应；用户确认不再复现并按通过收尾。
