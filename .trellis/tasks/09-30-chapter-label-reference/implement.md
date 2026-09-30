# 实施清单（已获用户确认）

## 继续修复使用入口（用户接受显式写法）

- [x] 确认普通标题缺少标签的反馈是显式路线的契约差异；用户接受显式写法，不实施自动生成层。
- [x] 在章节预设选择处增加用法示例、手动编号说明与复制标签按钮；回归覆盖两种剪贴板入口、失败反馈和准确 span 内容。
- [x] 回归改用真实 renderOffscreenContent，验证显式标签、格式节点、颜色微调和切换预设。
- [x] 在真实 Vite 开发页录入示例，完成选择/保存/应用、复制标签/编辑器粘贴、两个预览的尺寸与配色检查；保存实际截图。
- [x] 点击公众号复制并记录成功状态；工具未读取到原生富文本载荷，不以 toast 冒充验证。载荷由真实 renderOffscreenContent 自动化检查覆盖，实际微信粘贴待人工验收。
- [x] 更新规范和验证记录；提交计划以最终变更为准，等待单独的 Git 提交确认。

- [x] 审阅 research/comparison.png 中参考、当前和候选对照；确认 design.md 后再 task.py start。
- [x] 将 research/reference-probe.test.ts 的真实选择入口及复制断言整理为最小回归测试，先确认当前实现失败。
- [x] 只改 HeadingSection 的章节预设选择参数和 presets.ts 的章节装饰色，不动 parser 或全局主题色。
- [x] 更新章节样式断言与唯一章节基线，核对其余 54 个 fixture 哈希均不变；不使用无审查的整批冻结。
- [x] 跑相关预设、变量、DOM coverage、基线及微信复制集成测试；检查 UI 选择后继续微调有效。
- [x] 按 515px 和窄正文宽度实际浏览器对照，验证长标题与两行布局；记录最终内联 HTML 和剩余人工验收边界。
- [x] 完整审阅只涉及本任务的 diff，列出 commit-plan.md，保留其他改动。
- [x] 用户报告验证通过，并批准最终提交计划、推送与任务归档。
- [ ] 按项目流程分别提交工作、归档和日志记录，推送当前分支；不 amend。

复现命令：从仓库根目录运行 powershell -NoProfile -File .trellis/tasks/09-30-chapter-label-reference/research/check.ps1。修正前以参考样式断言失败；修正后应通过，并输出真实实现对照。

实施与验证已完成，见 research/verification.md。diff 已审阅；用户已批准提交、推送和归档，按 commit-plan.md 执行。
