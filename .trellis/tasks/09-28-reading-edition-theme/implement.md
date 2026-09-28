# Implement：青岚主题移植

## Stage 1 — 主题文件

1. 新建 `packages/core/src/themes/jade-notes.ts`，导出 `jadeNotesTheme`，按 design.md 的映射表覆盖：`#wemd` 根、p、h1–h6（`.content` + `.prefix/.suffix` 隐藏）、ul/ol/li/`li section`、`blockquote` 与 `.multiquote-N`、a、strong、em、mark、del、hr、img、figcaption、行内代码、`pre code.hljs` / `pre code:not(.hljs)`、table/th/td + 抵消斑马、脚注四组、公式兜底、callout 五变体、imageflow 五条。
2. 不自造 CSS 变量；不使用含变量的边框简写；不使用空 `content` 伪元素。

## Stage 2 — 注册

3. `packages/core/src/themes/index.ts`：`export * from './jade-notes';`
4. `apps/web/src/store/themes/builtInThemes.ts`：import `jadeNotesTheme`，在落日胶片之后追加 `{ id: "jade-notes", name: "青岚", css: basicTheme + "\n" + jadeNotesTheme + "\n" + codeGithubTheme, isBuiltIn: true, ... }`。

**Review gate 1**：只有新增文件与两处追加，`git diff` 不得出现对其他主题或共享文件的改动。

## Stage 3 — 验证

5. `pnpm --filter @wemd/web exec tsc -b`
6. `pnpm --filter @wemd/web run test -- --run`（确认无基线失败）
7. `pnpm --filter @wemd/web run lint` / `build`
8. 浏览器：dev server → 主题管理 → 选中「青岚」→ 用欢迎样稿逐块目视；缩到 320px 宽再看一次。
9. 复制链路：选中青岚后复制，检查快照 HTML 中 `var(` 零残留、表格/代码/引用样式为字面值。
10. 若发现破相 → 回 Stage 1 修 CSS；不改共享文件。

## Stage 4 — 收尾

11. 记录实际结果与未验证项到本文件。
12. 代码审查（子代理）→ 批量提交确认 → `/trellis:finish-work`。

## 验证结果（Stage 3 完成记录）

- `pnpm --filter @wemd/web run test -- --run`：51 files / 434 tests 全绿。
- `pnpm --filter @wemd/web run lint`：0 errors（18 个既有 warning，均不在本次改动文件内）。
- `pnpm --filter @wemd/web run build`：通过。
- 复制链路：青岚主题下 `var(` 零残留、无 `--wemd-` 变量、加粗与链接为字面色。
- 实机预览（dev server + 欢迎样稿，362px 窄屏）：根字号 16px / 行高 30.72px（1.92）/ 字距 0 / 页边距 22px；h2/h3 取 accent `rgb(39,103,92)`；引用底 `rgb(244,248,245)`、内缩 32px、无左边框、行高 1.9、悬挂缩进 -16px；链接 accent + 下划线且非粗体；表格表头 accent 配浅底、单元格透明、斑马纹已抵消；脚注编号 22px 不透明；提示块无边框无阴影；代码块 13px/1.75、浅青底、1px 边框、`min-width: 0`。
- 代码审查由子代理完成（按 juice 真实内联结果判定胜出规则），查出的 10 类泄漏全部修复并用真实复制载荷复验，详见 design.md「实现结果与偏离」。
- **微信公众号真实粘贴：2026-09-28 由用户完成验证，通过。**
- 本次唯一未覆盖：其余 4 款阅读版式与 2 款 JSON 模板（后续增量）。
