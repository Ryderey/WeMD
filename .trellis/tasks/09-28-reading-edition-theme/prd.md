# PRD：移植青岚阅读版式为主题

## 背景

`D:\Work\sync_remote_projtcts\temp\WeDraft`（第三方 MIT 项目，`github.com/pafa/WeDraft`）的模板是 `LayoutTemplate` 数据模型：23 个语义分块的 `{CSS属性: 值}` 映射，由它自己的 renderer 生成内联样式。WeMD 的主题是 `#wemd` 作用域的选择器 CSS。两者不通用，只能逐款移植。

`templates/reading-editions.ts` 的 5 款是「共享 base + overrides」结构，因此移植 base + `jade-notes` 一款即可解锁另外 4 款。

用户决定：**不做署名标注**；在独立分支 `feat/reading-edition-theme` 上实施以降低回滚成本。

## 需求

1. 新增一款内置主题 **青岚**（id `jade-notes`），把 WeDraft `reading-editions.ts` 的 base 与 `jade-notes` overrides 映射到 WeMD 的选择器结构。
2. 主题必须是 CSS 模式主题（与现有 10 款内置一致，无 `designerVariables`），注册通道为 `packages/core/src/themes/` + `index.ts` 导出 + `builtInThemes.ts` 组合 `basicTheme + 主题 + codeGithubTheme`。
3. 不得修改现有主题、`basicTheme`、`codeGithubTheme` 或任何共享生成逻辑。
4. 覆盖 WeMD 独有块（callout 五变体、mermaid、滚动长图、mac 代码栏、多级引用、行内公式、任务列表、h1/h5/h6），不出现"未定义即破相"的区块。
5. 微信复制链路可用：不得依赖 CSS 变量、不得使用会被复制链路丢弃的写法（边框简写含变量、空 content 伪元素等）。

## 范围外

- 另外 4 款阅读版式（素笺/墨刊/蓝图/朱砂）——base 落地后属增量 overrides，本次不做。
- 另外 2 款 JSON 模板（`default-business`、`next-edition`）。
- 可视化设计器支持（不生成 `designerVariables`）。
- 深色模式专门适配（沿用现有 `background-color: transparent` 约定）。

## 验收标准

- [x] 主题库出现「青岚」，可选中、可应用，预览与 WeDraft 原版观感一致（正文/标题/引用/链接/分割线/代码/表格/图注/参考资料）。
- [x] WeMD 欢迎样稿全量目视：正文、加粗、引用（含二级嵌套）、列表、代码块（含 mac 栏）、行内代码、表格、图片与图注、提示块五变体、脚注、mermaid、行内/行间公式均无破相。
- [x] 该主题下复制到微信公众号的 HTML：无未解析 CSS 变量、无 `var(` 残留，边框为字面值。
- [x] `pnpm --filter @wemd/web run test -- --run`、`lint`、`build` 全绿；无既有基线失败。
- [x] 现有 10 款内置主题输出不变（纯新增，不改共享文件的行为）。
- [x] 微信公众号编辑器真实粘贴验证（2026-09-28 由用户完成）。
