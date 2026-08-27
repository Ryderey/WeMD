# Design: WeChat profile component

## Scope and boundaries

This change crosses the `apps/web` editor UI and the `packages/core` Markdown
renderer. The smallest complete slice is one hard-coded built-in component,
not a generic component registry.

Out of scope: custom components, import/export, marketplace integration,
slash commands, additional built-in components, localization infrastructure,
and server-side persistence.

## Data flow

```text
Header `组件` action
  -> ComponentDialog
  -> quick example / filled props / saved account
  -> typed insert event
  -> MarkdownEditor CodeMirror selection
  -> `<MpProfile ... />` in Markdown
  -> core markdown-it block rule
  -> reference-compatible mp-common-profile HTML
  -> live preview / HTML copy / WeChat copy
```

Saved accounts follow:

```text
validated form -> typed account record -> localStorage -> dialog list
```

## Contracts

### Markdown syntax

Only a self-closing, standalone line is recognized:

```md
<MpProfile mpId="..." nickname="..." headimg="..." signature="..." serviceType="1" verifyStatus="1" />
```

Required properties are `mpId` and `nickname`. Optional properties are
`headimg` and `signature`; `serviceType` defaults to `1` and `verifyStatus`
defaults to `0`. Attribute values may use single or double quotes.

The rule must not activate inside fenced code or for inline/unknown tags.

### Rendered HTML

The renderer emits the same structural markup as the reference project:

```html
<section class="mp_profile_iframe_wrp custom_select_card_wrp" nodeleaf="">
  <mp-common-profile
    class="mpprofile js_uneditable custom_select_card mp_profile_iframe"
    data-pluginname="mpprofile"
    data-id="..."
    data-nickname="..."
    data-headimg="..."
    data-signature="..."
    data-service_type="1"
    data-verify_status="0"
  ></mp-common-profile>
  <br class="ProseMirror-trailingBreak" />
</section>
```

All values are escaped as HTML attributes at the renderer boundary.

### Editor insertion

`editorInsert.ts` owns a named custom-event contract and dispatch helper.
`MarkdownEditor` listens while mounted and delegates to the existing
`insertTextAtSelection` helper. This preserves CodeMirror selection, undo, and
focus behavior without storing the editor instance globally.

### WeChat clipboard boundaries

The normalized `#wemd` root is a rendering container, not part of the
clipboard contract. `serializeWechatCopyHtml` clones that root, moves missing
inherited inline styles onto its direct element children, and serializes only
the children. This prevents WeChat from unwrapping a neutral `div` into visible
empty paragraphs around atomic blocks.

The serializer also adds a zero-font-size, zero-line-height, zero-margin
`&nbsp;` paragraph at each clipboard boundary. These match the reference
project's editable selection anchors without adding visible space.

### Saved-account storage

The web layer owns a small typed helper using one versionless localStorage key.
Unknown/corrupt data resolves to an empty list. IDs use `crypto.randomUUID()`
with the existing timestamp/random fallback pattern only if unavailable.

## UI structure

`Header` lazy-loads a dedicated `ComponentDialog`, matching other header-owned
panels. It reuses the existing `Modal` shell for the overlay and close control;
the focused component content adds dialog semantics and Escape handling
without changing the shared modal contract.

The component dialog contains:

1. Header description.
2. A single `MpProfile` card with quick insert and expand/collapse.
3. Expanded property fields, rendered preview, snippet preview, and validated
   insert action.
4. A saved-account section with add/edit/delete/insert actions and a compact
   account form.

## Compatibility and rollback

- Existing Markdown remains unchanged unless it contains a valid standalone
  `MpProfile` line.
- The component parser is registered once in `createMarkdownParser`, so all
  existing preview and copy consumers receive identical output.
- Rollback is limited to removing the parser plugin, dialog files, insertion
  event hook, and header action; no migration is required because saved data is
  isolated under a new localStorage key.
