# Add built-in Markdown components

## Goal

Add a top-header `组件` entry and port `MpProfile`, `QRCodeBlock`, `AuthorBlock`,
and `BadgeGroup` from `D:\Work\sync_remote_projtcts\md` into WeMD.

## Requirements

- Add a visible `组件` action to the desktop top header. It opens a component
  dialog and remains available when the header is shown.
- The component dialog contains only the built-in `MpProfile`, `QRCodeBlock`,
  `AuthorBlock`, and `BadgeGroup` entries. Do not expose custom-component
  creation/import/export or any other built-in component.
- Match the reference `MpProfile` interaction:
  - show its description and six properties;
  - allow inserting the built-in example immediately;
  - allow expanding the entry, editing property values, previewing the
    resulting card, and inserting the completed JSX-style snippet;
  - require `mpId` and `nickname` before inserting custom values;
  - allow saving, editing, deleting, and inserting reusable public-account
    profiles;
  - persist saved profiles locally and tolerate missing or corrupt stored data.
- Match the reference common interaction for `QRCodeBlock`, `AuthorBlock`, and
  `BadgeGroup`: show the description and property count, quick-insert the
  reference example, expand one card at a time, edit property values, preview
  the rendered result and generated snippet, validate required values, and
  insert at the current editor selection.
- Render the three added components with the reference templates and defaults:
  - `QRCodeBlock`: required `url`, optional `text` defaulting to `扫码访问`, and
    `size` defaulting to `150`;
  - `AuthorBlock`: required `name`, with optional `avatar` and `bio`;
  - `BadgeGroup`: required JSON string-array `tags`, with `color` defaulting to
    `#07c160`; malformed or non-array JSON renders no badge items safely.
- Insert the generated `<MpProfile ... />` text at the current CodeMirror
  selection, replacing a selection when one exists, and restore editor focus.
- Render a standalone `MpProfile` line in live preview, HTML copy, and WeChat
  copy as the reference-compatible `mp-common-profile` markup.
- WeChat copy must not create visible empty paragraphs above or below atomic
  blocks such as `MpProfile`, or at the beginning/end of the copied article.
  Apply the fix at the shared copy-serialization boundary rather than inside
  the profile renderer so all existing block content benefits.
- WeChat copy must also remove component-owned outer vertical margin/padding
  from all four in-scope built-ins, without changing their preview styling or
  intentional spacing on ordinary article blocks.
- Treat all property values as untrusted text and escape them both when
  generating Markdown snippets and when rendering HTML attributes.
- Keep the existing header auto-hide, theme, storage, export, copy, and editor
  behaviors unchanged.

## Acceptance Criteria

- [x] A new branch prefixed with `codex/` is created from the current `bugfix`
      branch without adding the pre-existing untracked files.
- [x] Clicking the top-header `组件` action opens an accessible dialog that can
      be closed by its close control, overlay click, or Escape.
- [x] The dialog presents `MpProfile` only; there is no custom-components tab
      or custom-component management UI.
- [x] The quick insert action inserts the reference example at the current
      editor selection and closes the dialog.
- [x] Expanded property entry validates required fields, shows a rendered
      preview, and inserts a correctly escaped `<MpProfile ... />` snippet.
- [x] Saved public-account profiles survive reload through local storage and
      can be added, edited, deleted, and inserted.
- [x] Preview and both copy paths convert `MpProfile` Markdown into
      `section.mp_profile_iframe_wrp > mp-common-profile` markup with the six
      expected `data-*` attributes and defaults for optional enum values.
- [x] Malformed, incomplete, inline, unknown, and fenced-code component-like
      text is not accidentally rendered as a public-account card.
- [x] A real paste into the WeChat public-account editor places text directly
      adjacent to `MpProfile` without injected empty paragraphs, while root
      inherited styles and article background remain intact.
- [x] Relevant unit/component tests, lint, TypeScript build, and package tests
      pass.
- [x] The dialog lists exactly the four in-scope built-ins and quick insertion
      emits each reference example as a standalone Markdown block.
- [x] Expanded forms for `QRCodeBlock`, `AuthorBlock`, and `BadgeGroup` show the
      reference defaults, validate required fields, preview the result, and
      insert the edited snippet at the editor selection.
- [x] Preview, HTML copy, and WeChat copy render the three new components with
      the reference-compatible inline HTML templates and escaped values.
- [x] The full copy pipeline serializes `QRCodeBlock`, `AuthorBlock`, and
      `BadgeGroup` without visible outer vertical blank space while retaining
      their horizontal alignment and preview styles.
- [x] Direct Markdown rejects inline, fenced, malformed, duplicate, and unknown
      component-like tags without affecting existing Markdown rendering.
- [x] Core/web tests, lint, and production builds pass after the expanded scope.

## Notes

- Built-ins other than the four named components remain out of scope.
- The reference repository is read-only input for this task; its project
  instructions do not override WeMD's instructions.
- No new dependency is required.
