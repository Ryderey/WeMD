# Xiaoha numbered heading with HTML copy

## Request

Add the heading style shown in the user's Xiaoha screenshot to the visual theme designer, with the same authored HTML copy workflow as the existing reading heading presets.

## Requirements

- Provide a selectable 小哈编号 preset for the active heading level.
- Match WeDraft default-business: coral #F96E57 italic 900-weight 25px number, orange #FFA900 700-weight 15px title, and a centered 1px #F0DED5 line at 36% width with 40px/18px vertical spacing.
- Number and title share a natural inline baseline. The screenshot's red outline is an annotation.
- Show guidance explaining manual numbering and HTML placement after the Markdown heading marker. Copy the full heading fragment, including the line, with sample number 1.
- Keep title and number settings editable and persistent; horizontal number spacing must have an accurate label.
- Preserve existing presets and ordinary Markdown headings. Only authored headings get the new line and number layout.

## Acceptance

- Selecting the preset applies the reference defaults without changing global theme colors or other heading levels.
- The copied snippet renders correctly through the actual parser, both browser previews, and final WeChat HTML serialization, with literal inline styles and no unresolved theme variables.
- A long title wraps naturally without overflow. Copy success and failures use the existing feedback behavior.
- Existing 60 designer CSS fixtures stay byte-identical; only one new preset fixture and its manifest entry are added.
- Related tests, TypeScript, and scoped lint pass; pre-existing warnings are reported separately.
- Real WeChat editor paste remains a user device acceptance step.

## Scope

One heading preset, visual controls, copy guidance and representative samples. No automatic numbering, parser changes, full-article Xiaoha theme, or new dependencies.
