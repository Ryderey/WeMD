# WeChat Copy/Paste Pitfalls

> Symptoms and correct implementation patterns for content copied from WeMD into the WeChat Official Account editor.

## Decorative Pseudo-Elements Disappear

**Symptom:** A decoration created with `::before` or `::after` looks correct in preview but disappears after pasting into WeChat.

**Correct pattern:** Do not use empty `content: ""` for compatibility-critical decorations. Use `content: "\u00a0"` as a non-empty anchor and set `font-size: 0` and `line-height: 0`, or use a non-empty real element.

## Borders or Colors Disappear

**Symptom:** A decorative node remains after paste, but its border or color is missing.

**Correct pattern:** Do not put CSS variables inside compatibility-critical border shorthands. Split them into longhands such as `border-left-width`, `border-left-style`, and `border-left-color`, and ensure copied inline styles contain literal values instead of `var(...)`.

## Article Background or Padding Disappears

**Symptom:** The article background or horizontal padding is visible in preview but missing after paste.

**Correct pattern:** Do not rely on the outermost copied element to retain visual styles. Propagate required inherited styles to its direct element children before serialization.

## Empty Paragraphs Appear Around Content

**Symptom:** WeChat inserts visible blank paragraphs around the article or between content blocks.

**Correct pattern:** Serialize the root container's children directly. Avoid neutral wrapper `div` elements, and use a semantic `section` when a continuous article background must span block margins.

Use `section` for the inner vertical-padding layer too: it survives root unwrapping and enters the clipboard payload. Test themes with nonzero top/bottom page padding, with both transparent and opaque backgrounds.

## Layout Breaks After Saving and Reopening

**Symptom:** Content looks correct immediately after paste but loses layout after the WeChat draft is saved and reopened.

**Correct pattern:** Do not use CSS classes as the only source of compatibility-critical layout. Put required dimensions, overflow rules, image sizing, and layout declarations inline.

## White Gaps Appear Around Built-In Blocks

**Symptom:** White seams appear around built-in block components on a colored article background.

**Correct pattern:** Clear the component root's outer margin and padding in the copied DOM, and keep the article background on a semantic wrapper that survives paste.

Clear vertical margins on copied `img` and `figure` elements as well. Global image rules also reach built-in avatars, so clearing only component roots leaves internal gaps. Apply this on the serializer's clone; retain horizontal alignment, captions, paragraph spacing, and preview image margins.

## Blank Lines Before or After the Article

**Symptom:** A blank line appears before the first paragraph or outside the article background after paste.

**Correct pattern:** Serialize only the article content, without synthetic NBSP paragraphs at either clipboard boundary. Zero font size and line height do not remove the paragraph from the pasted document. Test paragraph counts for both transparent and colored article backgrounds, and preserve intentional article spacing and decorative NBSP spans.

A payload with no empty paragraphs can still have a leading gap from the first paragraph's top margin (16px in the designer, 26px in the sunset theme). On the clipboard clone, traverse only generated page wrappers and zero the leading paragraph's top margin. Preserve subsequent paragraphs, nested content, page padding, and preview styles. Verify the first paragraph's position in a real browser in addition to counting DOM nodes.

## Wrapped Inline Underlines Overlap the Next Line

**Symptom:** A per-line heading underline looks correct on one line but crosses the glyphs on the following line after the heading wraps.

**Correct pattern:** Use native `text-decoration` with explicit thickness for per-line underlines. Keep any fixed underline offset small enough for compact heading line-height; the visual theme uses `3px`. Do not combine vertical padding with `border-bottom` on an inline fragment because the padding and border do not expand the line box.
