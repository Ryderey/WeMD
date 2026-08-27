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
