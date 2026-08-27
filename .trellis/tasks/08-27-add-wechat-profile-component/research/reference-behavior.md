# Reference behavior findings

## Additional requested built-ins

The user-provided path with `sync\_remote\_projtcts` does not exist locally;
the repository already used for the original comparison is
`D:\Work\sync_remote_projtcts\md`.

- `QRCodeBlock` has `url` (required), `text` (`扫码访问`), and `size` (`150`).
  It renders a centered QR image from `api.qrserver.com` plus a tertiary-color
  caption.
- `AuthorBlock` has `name` (required), `avatar`, and `bio`. It renders a
  table-layout author row with a 56 px circular avatar.
- `BadgeGroup` has JSON-array `tags` (required) and `color` (`#07c160`). It
  renders a wrapping flex row of pill badges and treats invalid JSON as an empty
  list.
- The reference dialog quick-inserts each example. Expanding a card initializes
  values from that example/defaults, exposes editable properties, shows a live
  preview and snippet, validates required fields, and inserts the filled
  snippet at the cursor. Only one card is expanded at a time.
- Chrome UI smoke testing was attempted after implementation, but the current
  machine no longer has the ChatGPT Chrome extension or native-host connection.
  The acceptance evidence therefore uses focused DOM interaction tests plus a
  full WeChat copy-pipeline integration test. Restoring browser control requires
  reinstalling the Browser plugin from the ChatGPT plugin UI.

Source inspected read-only:
`D:\Work\sync_remote_projtcts\md`.

## Relevant reference files

- `packages/core/src/extensions/component.ts`: defines `MpProfile`, parses JSX
  attributes, applies defaults, and renders `mp-common-profile` markup.
- `apps/web/src/components/editor/dialogs/CustomComponentDialog.vue`: quick
  insert, property expansion, saved account management, and dialog closing.
- `apps/web/src/components/editor/dialogs/ComponentPropFill.vue`: property
  entry, preview, and generated snippet display.
- `apps/web/src/components/editor/dialogs/MpAccountConfigDialog.vue`: account
  form validation and create/edit flow.
- `apps/web/src/stores/mpAccounts.ts`: persistent account data contract.
- `apps/web/src/components/editor/editor-header/InsertDropdown.vue`: menu entry
  opening the component dialog.
- `docs/mp-card.md`: user-facing explanation for obtaining a public-account
  fake ID.

## Porting decisions

- Preserve the `MpProfile` six-property contract and exact WeChat card DOM.
- Preserve quick insert, filled-property insert, and saved-account CRUD.
- Replace the reference's generic component registry with one focused parser
  and one focused dialog because all other/custom components are out of scope.
- Use current-project React, CodeMirror, CSS, modal, toast, Zustand, and
  localStorage patterns; do not copy Vue/Pinia abstractions.
- Integrate rendering at `createMarkdownParser`, the common boundary already
  used by preview, copy-as-HTML, and WeChat copy.

## WeChat paste-spacing investigation

Chrome DevTools MCP was used against a logged-in WeChat public-account article
editor. With `上方正文。`, `MpProfile`, and `下方正文。`, the original WeMD
clipboard payload had one neutral outer `div`. WeChat unwrapped it into:

```text
paragraph -> empty paragraph -> profile section -> empty paragraph -> paragraph
```

Removing only the component's `ProseMirror-trailingBreak` did not change the
result. Adding only the reference project's zero-height clipboard boundary
paragraphs also did not remove the internal gaps.

The reference copy flow serializes `#output` children rather than the output
container itself. An A/B paste that removed WeMD's neutral outer `div` changed
the WeChat DOM to:

```text
zero-height boundary -> paragraph -> profile section -> paragraph -> zero-height boundary
```

This proves the visible gap came from the clipboard wrapper boundary, not from
the profile template. The shared serializer now unwraps the root, preserves
missing inherited root styles on direct blocks, and adds the reference-style
zero-height boundaries. The fixed structure was verified by a second real
paste; phone preview was not used.

## AuthorBlock vertical-gap follow-up

A later WeChat screenshot showed a different kind of gap around `AuthorBlock`.
The complete copy-pipeline regression measured `16px` top/bottom margin plus
`16px` top/bottom padding on the component root. The reference template owns
those values; the zero-height clipboard anchors remained zero and the default
theme root contributed horizontal padding only.

The fix therefore keeps the reference template in preview but trims vertical
margin/padding from every marked fixed built-in root on the cloned clipboard
DOM. The regression covers `MpProfile`, `QRCodeBlock`, `AuthorBlock`, and
`BadgeGroup` together with a non-transparent article background. It verifies
that the continuous background layer and every component root remain free of
vertical blank space and share the same background color. A second live DOM
inspection could not be run because the Chrome extension and native-host
manifest are currently absent; Browser plugin reinstallation is required
before Chrome can be controlled again.
