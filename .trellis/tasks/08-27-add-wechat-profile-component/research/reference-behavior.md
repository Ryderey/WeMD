# Reference behavior findings

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
