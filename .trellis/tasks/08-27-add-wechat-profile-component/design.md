# Design: built-in Markdown components

## Scope and boundaries

This change crosses the `apps/web` editor UI and the `packages/core` Markdown
renderer. The smallest complete slice is a fixed registry for the four named
built-ins, not a user-extensible component engine.

Out of scope: custom components, import/export, marketplace integration,
slash commands, additional built-in components, localization infrastructure,
and server-side persistence.

## Data flow

```text
Header `组件` action
  -> ComponentDialog
  -> selected built-in -> quick example / filled props / saved account
  -> typed insert event
  -> MarkdownEditor CodeMirror selection
  -> `<BuiltIn ... />` in Markdown
  -> one core markdown-it block parser with four fixed renderers
  -> reference-compatible inline HTML
  -> live preview / HTML copy / WeChat copy
```

Saved accounts follow:

```text
validated form -> typed account record -> localStorage -> dialog list
```

## Contracts

### Markdown syntax

Only a self-closing, standalone line for an in-scope name is recognized:

```md
<MpProfile mpId="..." nickname="..." headimg="..." signature="..." serviceType="1" verifyStatus="1" />
<QRCodeBlock url="..." text="扫码访问" size="150" />
<AuthorBlock name="..." avatar="..." bio="..." />
<BadgeGroup tags='["Vue 3","TypeScript"]' color="#07c160" />
```

Required properties are `mpId` and `nickname`. Optional properties are
`headimg` and `signature`; `serviceType` defaults to `1` and `verifyStatus`
defaults to `0`. Attribute values may use single or double quotes.

The shared attribute parser accepts single or double quotes, rejects unknown or
duplicate properties and malformed trailing text, and does not activate inside
fenced code or for inline/unknown tags.

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

`QRCodeBlock` and `AuthorBlock` render the reference inline-style templates.
`BadgeGroup` parses `tags` as JSON and renders one escaped span per primitive
array item. Invalid JSON and non-array values resolve to an empty item list.

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

Fixed built-in renderers keep the reference styles for live preview and carry
an internal `data-wemd-component` marker. While cloning the clipboard DOM, the
serializer sets only the marked root's top/bottom margin and padding to zero,
then removes the marker. This prevents component-owned blank boxes in WeChat
without normalizing vertical spacing on paragraphs, headings, quotes, or other
user-authored blocks.

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
2. Four fixed built-in cards with quick insert and single-card
   expand/collapse.
3. Shared expanded property fields, rendered preview, snippet preview, and
   validated insert action; `MpProfile` keeps its specialized select fields and
   saved-account controls.
4. A saved-account section with add/edit/delete/insert actions and a compact
   account form.

## Compatibility and rollback

- Existing Markdown remains unchanged unless it contains a valid standalone
  in-scope component line.
- The component parser is registered once in `createMarkdownParser`, so all
  existing preview and copy consumers receive identical output.
- Rollback is limited to removing the parser plugin, dialog files, insertion
  event hook, and header action; no migration is required because saved data is
  isolated under a new localStorage key.
