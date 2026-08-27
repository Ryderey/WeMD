# Implementation plan: WeChat profile component

## 1. Branch and renderer

- [x] Create `codex/add-wechat-profile-component` from `bugfix` and register it
      on the Trellis task.
- [x] Add a focused markdown-it block plugin for standalone `MpProfile` tags.
- [x] Register it in `createMarkdownParser` so preview and both copy flows share
      one implementation.
- [x] Add core regression tests for valid/defaulted/escaped cards and rejected
      incomplete, inline, unknown, and fenced-code inputs.

Validation:

```powershell
pnpm --filter @wemd/core test
pnpm --filter @wemd/core build
```

## 2. Editor insertion and saved accounts

- [x] Extend the existing editor insertion module with a typed window event.
- [x] Subscribe in `MarkdownEditor` and reuse `insertTextAtSelection`.
- [x] Add typed snippet-building and localStorage helpers for saved accounts,
      including corrupt-data fallback.
- [x] Add focused unit tests for event insertion, escaping, and persistence.

## 3. Component dialog and header entry

- [x] Build a lazy-loaded dialog containing only `MpProfile`.
- [x] Implement quick insertion, expandable prop fields/preview, validation,
      and saved-account add/edit/delete/insert behavior.
- [x] Add the `组件` action to the visible header and preserve responsive/header
      auto-hide behavior.
- [x] Ensure the modal has dialog semantics and Escape closing.
- [x] Add component tests for opening the dialog and the primary insertion
      path.

## 4. Full validation

- [x] Run formatting/lint/type checks and all affected package tests.
- [x] Build the web app.
- [x] Manually verify header -> dialog -> insertion -> preview in the browser,
      then verify the copied result in the real WeChat editor.
- [x] Review the complete diff against PRD and Web/Core frontend specs.

## 5. WeChat paste spacing regression

- [x] Reproduce the visible empty paragraphs in the real WeChat editor through
      Chrome DevTools MCP.
- [x] Compare the reference clipboard structure and remove WeMD's neutral root
      wrapper at the shared serializer boundary.
- [x] Preserve inherited root styles on direct blocks and add invisible
      clipboard boundary anchors.
- [x] Add serializer/copy regression tests and verify the fixed DOM through a
      second real WeChat paste without using phone preview.

## 6. Add the remaining requested built-ins

- [x] Replace the focused `MpProfile` parser with one fixed built-in-component
      parser for `MpProfile`, `QRCodeBlock`, `AuthorBlock`, and `BadgeGroup`.
- [x] Add reference-compatible renderers, defaults, escaping, and safe JSON
      handling for the three new components.
- [x] Generalize the dialog card/form interaction while retaining the
      specialized saved-account flow for `MpProfile`.
- [x] Add core renderer and web interaction/helper regression tests.
- [x] Run the complete Core/Web tests, lint, production builds, diff check, and
      focused DOM/copy-pipeline integration checks for all four dialog entries.

## 7. Remove built-in component copy gaps

- [x] Reproduce the author-card gap at the complete WeChat copy-pipeline seam.
- [x] Verify zero-height clipboard boundaries and horizontal-only page padding
      are not introducing the visible space.
- [x] Mark fixed built-in roots and clear only their vertical margin/padding on
      the cloned clipboard DOM, leaving live preview and ordinary article
      spacing unchanged.
- [x] Cover all four built-ins together with a non-transparent article
      background in one focused regression; verify the continuous background
      layer and every component root have no vertical blank space.

Commands:

```powershell
pnpm --filter @wemd/core test
pnpm --filter @wemd/core build
pnpm --filter @wemd/web test
pnpm --filter @wemd/web lint
pnpm --filter @wemd/web build
```

## Rollback points

- Renderer tests must pass before UI work begins.
- If insertion-at-cursor cannot be kept without global editor ownership, stop
  before changing store architecture and revisit the design.
