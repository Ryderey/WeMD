# Verification — 2026-09-30

Branch: `codex/reading-heading-html`, based on `bugfix` (`0b0de45`).
Approved route A is implemented without changing the parser or adding dependencies.

## Automated checks

- Nine related suites passed: 195 tests, one intentionally skipped baseline-write
  test. Suites: readingHeadingPresets, chapterLabelReference, headingStylePresets,
  themeDesignerEditionSeeds, themeDesignerHeadingDecor, ThemePanel,
  themeSampleDomCoverage, designerBaseline, wechatCopyCssIntegration.
- After adding a real theme-store JSON export/import check, reran
  `readingHeadingPresets.test.tsx` (11 tests) and `themeStore.test.ts` (3 tests):
  14 passed. The export Blob is captured at the browser download boundary; its
  actual data is then fed to the real import method. Imported heading settings
  and regenerated CSS match the edited original.
- `pnpm --filter @wemd/web exec tsc --noEmit`: passed.
- ESLint on all changed TypeScript files: 0 errors, one pre-existing warning at
  `ThemeLivePreview.tsx:237` (`react-hooks/exhaustive-deps`, designerVariables).
  The dependency array and affected effect were unchanged by this work.
- Prettier applied to changed source/test files; frozen CSS excluded.
- Source/documentation whitespace checks passed. The staged check excludes frozen
  baseline CSS, whose trailing whitespace is part of the exact generator output
  and must be preserved rather than reformatted.

Selection tests exercise the actual HeadingSection buttons and clipboard handlers,
then `renderOffscreenContent(..., { forWechat: true })` and
`serializeWechatCopyHtml`. All five number/rule styles survive as inline literals;
no remaining `var(--wemd-*)`, undefined, or NaN. Plain headings do not receive
authored layout nodes. Strong/link content survives. Electron success/failure and
browser rejection are covered. Invalid optional values fall back safely.

Baseline write was explicit:

```powershell
$env:FREEZE_DESIGNER_BASELINE='1'
pnpm --filter @wemd/web exec vitest run src/__tests__/services/designerBaseline.test.ts -t '写回全部配置的输出'
```

The baseline directory diff contains only five manifest entries and five new CSS
fixtures. The original 55 fixture files have no diff and all their assertions passed.

## Real Vite browser checks

Started the actual app with `pnpm dev:web -- --host 127.0.0.1 --port 5173`.
Used UI controls in the in-app browser at a 1440×900 desktop viewport.

- Duplicated 素笺 into a clearly named temporary visual theme.
- Selected all five options; confirmed guidance, current-level examples and each
  exact copied plain-text fragment through the browser clipboard API.
- Pasted the copied fragment into a temporary Markdown article with actual
  Ctrl+V. Main preview rendered its chapter line, number and title.
- Checked both built-in sample and current-article designer previews.
- Applied all five presets to the real article. Checked long headings in the
  318px main content area and the 450px designer preview; no horizontal overflow.
  Hanging title lines align after 26/28/36px number columns for 墨刊/蓝图/朱砂.
- Edited 朱砂's number size to 18px and width to 42px; saved, applied, reloaded,
  reopened the designer. Inputs and computed styles retained both values.
- Restored the temporary theme to 素笺 defaults, then restored the original
  welcome article and its prior chapter-label theme. Test document/theme remain
  clearly marked temporary. Reset the temporary viewport override.
- Browser developer log inspection returned no errors/warnings.
- Stopped the development server started for this verification after restoring
  the original article/theme. The screenshot remains available locally.

Observed default number values:

| Preset | Size | Color   | Display            | Column width   |
| ------ | ---- | ------- | ------------------ | -------------- |
| 素笺   | 13px | #756655 | block              | none           |
| 墨刊   | 12px | #272727 | inline-block       | 26px           |
| 青岚   | 12px | #27675C | block, bottom rule | 22px underline |
| 蓝图   | 12px | #2857B7 | inline-block       | 28px           |
| 朱砂   | 22px | #A3453C | inline-block       | 36px           |

Screenshot: [reading-heading-ui.jpg](reading-heading-ui.jpg).

## Limits and handoff

The actual publisher-copy button displayed success, but this browser bridge
exposed only plain-text clipboard data and retained the preceding raw-HTML copy.
Do not treat that toast as proof of the native rich HTML clipboard. Final inline
copy styles are verified by the automated real serialization chain above.
WeChat client paste is still a separate manual acceptance step.

At the implementation handoff, no commit, push, or archive had been performed.
The existing server proxy change and earlier untracked research/plans were not
modified or included in this feature.

## User acceptance — 2026-09-30

The user confirmed: “验证通过，可以提交和推送并进行收尾工作”.
Proceed with the approved feature-only commit, task archive and session record;
push codex/reading-heading-html. This confirms user acceptance without claiming
that the agent directly inspected a WeChat client paste. No merge was requested.

## Work commit

`e8bff4298c19ce71bebf54ffbad24198b49544e3` —
`feat(theme): add authored reading heading presets and copy guidance`.
The commit hook completed successfully. Generator source hashes were unchanged
by the hook; the original baselines and unrelated working-tree files remain intact.
Task archive metadata is recorded separately from this work commit. Final remote
verification and session completion are recorded in the local Trellis journal.
