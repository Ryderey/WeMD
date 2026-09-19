# Scrollable Container Blocks (scroll-image)

> Contract for the `::: scroll-image` container: syntax, DOM, inline-style requirements, and the constraints that make it survive WeChat paste.

## Syntax

```
::: scroll-image <height> [horizontal|vertical]
![alt](<url>)

![alt](<url>)
:::
```

- `height` is clamped to 160–800; a bare `::: scroll-image` means 320px vertical.
- The container accepts **1..20 images and no text**. Any `text` child that is not pure whitespace degrades the whole block to a plain `<div>` so the body content is never lost. The same degradation applies to illegal params and to >20 images.
- All three handwriting styles are equivalent and must keep working: one image per line, blank-line separated, and several images on one line separated by spaces. `softbreak` / `hardbreak` / whitespace-only text nodes are skipped, not treated as content.
- `SCROLL_IMAGE_MAX_IMAGES` is exported from `@wemd/core`; the dialog and the plugin share that one constant. Never re-declare the number.

## DOM

| Mode       | Structure                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| vertical   | `section.scroll-image > section.scroll-image-viewport > img.scroll-image-img × N` + `p.scroll-image-caption`                                                      |
| horizontal | `section.scroll-image.scroll-image-horizontal > section.scroll-image-viewport > section.scroll-image-track > img.scroll-image-img × N` + `p.scroll-image-caption` |

Vertical needs no track: `display:block; width:100%; height:auto` stacks naturally. Horizontal must add the track, because inline images inside a scrolling viewport need a `width:max-content` carrier; the images become `display:inline-block; height:100%; width:auto; max-width:none; max-height:none`.

## Inline Styles Are Load-Bearing

WeChat strips classes and only keeps inline styles, so every compatibility-critical declaration lives in `style=""` on the emitted elements:

- Viewport: fixed `height`, `overflow`, `box-sizing`, `scrollbar-gutter`, `touch-action`, `-webkit-overflow-scrolling`.
- Track: `width:max-content`, `white-space:nowrap`, `font-size:0; line-height:0` (kills inter-image inline gaps).
- Images: `margin:0` — the preview's global `#wemd img { margin:10px auto }` would otherwise add 10px seams that the copy pipeline later zeroes out, making preview and pasted result disagree.

The single-image vertical HTML is a byte-level regression baseline: it must not change. Any change to the shared vertical branch is a contract change and needs the baseline test updated deliberately.

## Preview Overrides

`MarkdownPreview.css` carries `!important` overrides because theme CSS reaches the same nodes:

```css
#wemd .scroll-image-horizontal .scroll-image-track {
  display: inline-block !important;
  width: max-content !important; /* … */
}
#wemd .scroll-image-viewport img {
  margin: 0 !important;
}
```

Keep the horizontal overrides scoped to the component. Do not relax the global `#wemd img` rule and do not edit every theme.

## Testing Notes

- jsdom's CSSOM does not support `touch-action` or `max-content`; style re-serialization drops them. Assert those at the HTML string level and verify in a real browser instead of asserting on `element.style`.
- The copy pipeline (`processHtml` → `resolveInlineStyleVariablesForCopy` → `normalizeCopyContainer` → `serializeWechatCopyHtml`) must be tested for N images per direction across the designer, basic, and sunset themes, asserting image order and count — not just that one image survived.
- DOM assertions cannot prove scrolling works. Report automated, browser-verified, and WeChat-verified status separately; never present the first two as the third.
