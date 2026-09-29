# Theme Designer CSS Generation

> Contract for `apps/web/src/components/Theme/ThemeDesigner/` — how designer variables become theme CSS, and what must stay stable.

## Generators are the only fallback layer

`themeStore.loadCustomThemes()` and `themeStore.importTheme()` call `generateCSS(variables)` directly on stored or parsed data. They do **not** pass through `ThemePanel.normalizeDesignerVariables`, which is the only place defaults get merged.

**Consequence**: any compatibility handling for a new or missing variable must live inside the generator that reads it. Merging defaults in the panel is not sufficient — a theme saved before the field existed still regenerates through `generateCSS` on every app load.

Never call string methods on an imported variable before a `typeof` check, and never interpolate an unvalidated value into CSS text. Validate once in a shared resolver and let generators consume its result.

## Existing themes must stay byte-identical

Adding a designer field must not change the generated CSS of themes that never set it. Only genuinely new declarations (e.g. additional `--wemd-*` variables) may appear.

`apps/web/src/__tests__/components/themeDesignerVariables.test.ts` freezes the follow-theme `#wemd strong` rule for all six bold styles as an exact string. When changing bold output, update that table deliberately — an assertion comparing two code paths in the same version cannot catch a regression.

## Bold accent color

| Field               | Role                                                        |
| ------------------- | ----------------------------------------------------------- |
| `strongAccentColor` | Optional solid color for bold text **and** bold decorations |
| `strongColor`       | Text-only override; always wins over the accent             |

- Empty, missing, non-string, or non-hex `strongAccentColor` means _follow theme_ and reproduces the pre-existing color logic for every style.
- Text precedence: explicit `strongColor` → `none` inherits its container → accent → theme color/gradient.
- Decorations never read `strongColor`. This is what keeps "black text + colored bottom swipe" working.
- When an accent is set, colored bold must not use the theme gradient, or the text renders transparent with no gradient behind it.
- Resolve validity through `generators/strongAccent.ts` only. Both `generators/variables.ts` and `generators/global.ts` consume it, so "is custom" is never decided twice.
- Do not implement bold colors by rewriting `--wemd-primary-*`; those variables also drive headings, links, quotes, list markers and code.

## Variable name vs real alpha

`--wemd-primary-color-20` is 12% and `--wemd-primary-color-30` is 18%. The suffixes are historical and wrong; they are kept because heading presets reference them. New variables must name the real value — `--wemd-strong-accent-color-12` / `-18`.

## WeChat border shorthands

The copy pipeline drops border shorthands that contain `var()`. Split into `border-bottom-width` / `-style` / `-color` when emitting a new rule. The follow-theme bold underline still emits the old shorthand to preserve byte-identical output; the accent-mode branch uses longhands.

## Frozen CSS baselines must escape formatting

Byte-exact generator baselines are stored under `apps/web/src/__tests__/fixtures/designer-baseline/`. The pre-commit hook runs `prettier --write` on `*.{json,md,css}`, which silently reflows `.css` fixtures and breaks every assertion.

That directory is listed in `.prettierignore`. When adding another frozen-output fixture, keep it out of any lint-staged glob, and regenerate baselines from the **pre-change** code (stash the edits, freeze, restore) so a regression cannot be baked into the baseline.

## Known defect: the strikethrough color control misses `<s>`

Markdown-it renders `~~text~~` as `<s>`, but the designer's `删除线颜色` (`delColor`) only emits
`#wemd del { ... }`. The control therefore has no effect on strikethrough produced from
markdown text — it only affects hand-written `<del>` in the source.

Status (2026-09-29): **not fixed by default.** `delCoversStrikethrough` adds a mirroring
`#wemd s` rule, but it stays opt-in because turning it on by default would change the
output of every existing visual theme, which the frozen baselines forbid. Flipping the
default requires an explicit decision plus a re-frozen baseline.
