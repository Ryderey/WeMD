# Proposed commit

`fix(theme): align chapter headings and add copy hint`

## Included files

- `.trellis/spec/web/frontend/theme-designer.md`
- `apps/web/src/components/Theme/ThemeDesigner/sections/HeadingSection.tsx`
- `apps/web/src/components/Theme/ThemeDesigner/generators/presets.ts`
- `apps/web/src/__tests__/components/chapterLabelReference.test.tsx`
- `apps/web/src/__tests__/components/headingStylePresets.test.ts`
- `apps/web/src/__tests__/services/wechatCopyCssIntegration.test.ts`
- `apps/web/src/__tests__/fixtures/designer-baseline/headingPreset-h2-chapter-label.css`
- `.trellis/tasks/09-30-chapter-label-reference/` (all task planning, diagnosis,
  test harness, baseline snapshot, generated comparison/copy artifacts, final
  development-app screenshots, metrics, verification record, and this plan)

## Excluded files

- `apps/server/src/proxy/proxy.controller.ts` — unrelated existing user change.
- `docs/plans/2026-09-28-designer-template-preset.md` — pre-existing untracked plan.
- `docs/plans/2026-09-28-independent-bold-color.md` — pre-existing untracked plan.
- `docs/research/` — earlier research, outside this correction commit.

## Validation

7 related test files pass: 180 passed, 1 intentional freeze-test skip. Type check
and changed-file lint pass. Exactly one of 56 recorded baseline files changed:
the chapter-label fixture's two coral color literals. Real Vite UI selection,
save/apply, exact snippet copy, editor paste, and both previews were checked.
Native rich-text clipboard inspection and actual WeChat paste remain unverified;
final HTML styles are checked through the actual offscreen copy renderer.

The user reported verification passed on 2026-09-30 and explicitly approved
committing, pushing and archiving this task. Keep the exclusions above. Create
the work commit first, then separate archive and journal commits. The user
subsequently specified merging
`feat/chapter-label-heading-preset` back into `bugfix` and pushing `bugfix`.
Do not amend.
