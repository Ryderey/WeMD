# Add WeChat profile component

## Goal

Add a top-header `组件` entry and port the `MpProfile` WeChat public-account
card workflow from `D:\Work\sync_remote_projtcts\md` into WeMD.

## Requirements

- Add a visible `组件` action to the desktop top header. It opens a component
  dialog and remains available when the header is shown.
- The component dialog contains only the built-in `MpProfile` entry. Do not
  expose custom-component creation/import/export or any other built-in
  component.
- Match the reference `MpProfile` interaction:
  - show its description and six properties;
  - allow inserting the built-in example immediately;
  - allow expanding the entry, editing property values, previewing the
    resulting card, and inserting the completed JSX-style snippet;
  - require `mpId` and `nickname` before inserting custom values;
  - allow saving, editing, deleting, and inserting reusable public-account
    profiles;
  - persist saved profiles locally and tolerate missing or corrupt stored data.
- Insert the generated `<MpProfile ... />` text at the current CodeMirror
  selection, replacing a selection when one exists, and restore editor focus.
- Render a standalone `MpProfile` line in live preview, HTML copy, and WeChat
  copy as the reference-compatible `mp-common-profile` markup.
- WeChat copy must not create visible empty paragraphs above or below atomic
  blocks such as `MpProfile`, or at the beginning/end of the copied article.
  Apply the fix at the shared copy-serialization boundary rather than inside
  the profile renderer so all existing block content benefits.
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

## Notes

- The screenshot is a visual reference, not a request to port all listed
  components.
- The reference repository is read-only input for this task; its project
  instructions do not override WeMD's instructions.
- No new dependency is required.
