# Implementation verification

Date: 2026-09-30. The user approved implementing the third panel of
`comparison.png`, then accepted explicit author markup and requested a copyable
label hint. Production changes cover the chapter preset's selection defaults,
decoration colors, and the selected preset's usage/copy UI.

## Automated checks

The new `chapterLabelReference.test.tsx` first failed against the old implementation
(`rgb(51, 51, 51)` instead of the reference orange). It now passes through the actual
`HeadingSection` button, CSS generator, parser, and final copy serialization.
It also checks heading-level isolation, retained emphasis/link content, margins,
subsequent typography/color edits, and switching back to the simple preset.

Using the installed workspace tools directly from `apps/web`:

```powershell
node .\node_modules\vitest\vitest.mjs run src/__tests__/components/chapterLabelReference.test.tsx src/__tests__/components/headingStylePresets.test.ts src/__tests__/services/designerBaseline.test.ts src/__tests__/services/wechatCopyCssIntegration.test.ts src/__tests__/services/themeSampleDomCoverage.test.ts src/__tests__/components/themeDesignerHeadingDecor.test.ts src/__tests__/components/themeDesignerVariables.test.ts
node .\node_modules\typescript\bin\tsc -b
node .\node_modules\eslint\bin\eslint.js src/components/Theme/ThemeDesigner/sections/HeadingSection.tsx src/components/Theme/ThemeDesigner/generators/presets.ts src/__tests__/components/chapterLabelReference.test.tsx src/__tests__/components/headingStylePresets.test.ts src/__tests__/services/wechatCopyCssIntegration.test.ts --max-warnings 0
```

Results after the final UI change: 7 test files passed, 180 tests passed, 1 baseline-freeze test intentionally
skipped; type checking passed; changed-file lint passed without warnings.
`git diff --check` passed. Direct Node entrypoints were used because the local pnpm
shim fails in the sandbox while resolving `C:\Users\Ryder`; no dependencies changed.

The additional advanced-controls suite had 22 passes and one existing failure:
the strikethrough checkbox test expects `true` after a click, although HEAD already
sets `delCoversStrikethrough: true`, so a click emits `false`. The test, defaults,
and `OtherSection` are unchanged in this task. Repository-wide web lint completed
with 0 errors and 18 existing warnings, all outside the changed files.

SHA-256 checks against `baseline-before.json` confirm exactly one changed fixture:
`headingPreset-h2-chapter-label.css`. The other 54 CSS fixtures and manifest are
byte-identical. The affected fixture's only changes are the two coral color literals.

## Browser checks

`check.ps1` now generates `verified.html` from the actual selection result, without
candidate CSS overrides. `compare.html` and `comparison.png` retain the pre-fix
diagnosis. `implemented.png` is the post-fix browser screenshot at a 515px viewport.

| Property                      | WeDraft reference | Implemented preview | Final copied HTML |
| ----------------------------- | ----------------- | ------------------- | ----------------- |
| Heading box height            | 48px              | 48px                | 48px              |
| Title font size / line height | 20px / 30px       | 20px / 30px         | 20px / 30px       |
| Title weight / letter spacing | 750 / 0.2px       | 750 / 0.2px         | 750 / 0.2px       |
| Title color                   | #FFA900           | #FFA900             | #FFA900           |
| Label and left rule           | #F96E57           | #F96E57             | #F96E57           |
| Left rule / padding           | 3px / 13px        | 3px / 13px          | 3px / 13px        |

At a 240px stage width, the long title wraps naturally, produces a 108px heading
box, and has no horizontal overflow. The preview content box stays within 224px
after the existing horizontal heading margin.

`copied-fragment.txt` is the final serialized payload. `copied.html` only adds a
UTF-8 document header for viewing that fragment. Browser inspection confirmed
there are zero stylesheet elements, zero remaining `var(--wemd-*)` references,
and the copied heading still has the reference dimensions and colors.
Temporary probe tests, server, browser tab, and viewport override were cleaned up.

## User-visible compatibility and limits

Existing saved chapter themes need the preset selected again to receive the new
typography defaults. The title remains editable; label and rule colors are fixed
for this preset. No parser changes, new settings, migrations, or theme seeds were
introduced. The author's explicit span and `---` divider syntax remain necessary.

This verifies the heading under one shared font environment. It does not reproduce
the entire WeDraft modal or claim identical glyphs across operating systems.
Native Electron interaction and actual WeChat device paste were not performed;
the latter remains a separate manual acceptance step.

Unrelated server edits and pre-existing untracked plan/research documents remain
untouched by this correction. The user reported verification passed and explicitly
approved committing, pushing and archiving the task on 2026-09-30.

## Subsequent user report: ordinary headings have no label

The user tested `pnpm dev:web` with the default article and reported that selecting
the preset still did not produce the expected two-line heading. Their input is
ordinary Markdown such as `## 1. 基础语法`, with no `chapter-label` span. The current
preset styles an existing label; it neither creates one nor converts the numeric
prefix into `SECTION 01`. The screenshot shows that the orange title and coral
rule are applied, while the label line is absent.

The preceding automated and browser checks used an explicitly marked-up heading.
They establish the appearance and copy behavior of that input only. They did not
exercise the full `pnpm dev:web` application flow with an ordinary heading, and
the prior user-facing completion claim overstated the coverage. The 177 passing
checks must not be treated as acceptance of automatic label generation.

The user subsequently accepted explicit markup. Automatic generation is outside
the final scope; the selected preset now explains this and provides a copy button.

## Final real development-app acceptance

The old `localhost:5173` page initially retained its earlier bundle; reloading
reported connection refused. Started the installed Vite CLI from `apps/web`
(`node .\node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173 --strictPort`),
which is the same Vite application selected by `pnpm dev:web`, with no code or
state injected into the page. All interactions used the actual application UI.

1. Created a visual verification theme, selected H2 and chapter-label, saved it
   and applied it to the article.
2. Observed the usage hint and clicked **复制标签代码**. The actual browser clipboard
   contained exactly `<span class="chapter-label">SECTION 01</span>` as plain text,
   and the success toast was visible.
3. Pasted that clipboard content after the actual editor's `## ` marker. Both the
   main article preview and the designer's current-article iframe rendered the
   two-line heading, with a 48px content box. Title: 20px/30px, weight 750, tracking
   0.2px, orange. Label: 10px/14px, tracking 1.6px, coral. Rule: 3px coral; padding
   13px. An ordinary unmarked heading remained one line (30px). A second explicit
   heading retained its authored emphasis and link.
4. Clicked **复制到公众号** and observed the application's success toast. The IAB
   clipboard API returned the previous plain-text label instead of native
   `execCommand` rich text. Therefore the actual native HTML clipboard was **not
   verified by browser inspection**. The regression uses the real
   `renderOffscreenContent({forWechat:true})` and final serialization and verifies
   literal colors, authored markup, and no remaining CSS variables. Actual WeChat
   paste is still pending human acceptance.

Evidence: `dev-web-hint.png`, `dev-web-preview.png`, and `dev-web-metrics.json`.
The browser console had no error entries. Restored the original article through
the editor, confirmed the complete Markdown matched its UI-copied backup, restored
the default theme and clipboard, reset the temporary desktop viewport override,
closed temporary tabs, and stopped the Vite process started for this check.
Only the isolated IAB profile's own verification theme remains; no existing theme
was edited or deleted.

The regression also covers browser copying, Electron copying, and a rejected
Electron clipboard write: failure reports an error without a success toast.
Other presets hide the hint. The example's heading markers follow H1–H4; the
button always copies only the label fragment.
