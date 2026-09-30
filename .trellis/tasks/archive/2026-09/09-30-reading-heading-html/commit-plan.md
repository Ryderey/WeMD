# 已确认的提交计划

工作分支：`codex/reading-heading-html`。用户于 2026-09-30 确认：
“验证通过，可以提交和推送并进行收尾工作”。
按以下范围进行工作提交，再归档任务、记录会话并推送当前分支。

## 拟提交一次

`feat(theme): add authored reading heading presets and copy guidance`

仅包括本轮能力、回归和任务记录：

- `.trellis/spec/web/frontend/theme-designer.md`
- `.trellis/tasks/09-28-designer-template-preset/research/sample.md`（现有覆盖样例的镜像）
- `.trellis/tasks/09-30-reading-heading-html/check.jsonl`
- `.trellis/tasks/09-30-reading-heading-html/design.md`
- `.trellis/tasks/09-30-reading-heading-html/implement.jsonl`
- `.trellis/tasks/09-30-reading-heading-html/implement.md`
- `.trellis/tasks/09-30-reading-heading-html/prd.md`
- `.trellis/tasks/09-30-reading-heading-html/reading-heading-ui.jpg`
- `.trellis/tasks/09-30-reading-heading-html/task.json`
- `.trellis/tasks/09-30-reading-heading-html/verification.md`
- `.trellis/tasks/09-30-reading-heading-html/commit-plan.md`
- `apps/web/src/components/Theme/ThemeDesigner/readingHeadings.ts`
- `apps/web/src/components/Theme/ThemeDesigner/types.ts`
- `apps/web/src/components/Theme/ThemeDesigner/generateCSS.ts`
- `apps/web/src/components/Theme/ThemeDesigner/generators/presets.ts`
- `apps/web/src/components/Theme/ThemeDesigner/sections/HeadingSection.tsx`
- `apps/web/src/components/Theme/ThemeDesigner.css`
- `apps/web/src/components/Theme/ThemeLivePreview.tsx`
- `apps/web/src/config/styleOptions.ts`
- `apps/web/src/store/themes/designerPresets.ts`
- `apps/web/src/__tests__/components/readingHeadingPresets.test.tsx`
- `apps/web/src/__tests__/services/themeSampleDomCoverage.test.ts`
- `apps/web/src/__tests__/fixtures/theme-sample.md`
- `apps/web/src/__tests__/fixtures/designer-baseline/_manifest.json`
- `apps/web/src/__tests__/fixtures/designer-baseline/headingPreset-h2-reading-plain-paper.css`
- `apps/web/src/__tests__/fixtures/designer-baseline/headingPreset-h2-reading-ink-journal.css`
- `apps/web/src/__tests__/fixtures/designer-baseline/headingPreset-h2-reading-jade-notes.css`
- `apps/web/src/__tests__/fixtures/designer-baseline/headingPreset-h2-reading-blueprint.css`
- `apps/web/src/__tests__/fixtures/designer-baseline/headingPreset-h2-reading-cinnabar.css`

## 已有未提交内容，默认不纳入

- `apps/server/src/proxy/proxy.controller.ts`
- `docs/plans/2026-09-28-designer-template-preset.md`
- `docs/plans/2026-09-28-independent-bold-color.md`
- `docs/research/2026-09-30-reading-edition-heading-visual-options.md`
- `docs/research/2026-09-30-wedraft-reading-heading-source.md`
- `docs/research/heading-numbered-split-layout.md`
- `docs/research/wechat-editor-plugin-spec.md`
- `docs/research/wechat-image-host-feasibility.md`
- `docs/research/wedraft-heading-template-investigation.md`

回归、补测及 TypeScript 已通过。ESLint 为 0 错误、1 处原有 Hook 依赖警告，
见 verification.md。用户已确认验收通过；代理未直接检查微信客户端粘贴。
本轮已授权提交、推送和任务归档；未要求合并回 bugfix。
