# 调整启动等待、渐变分割线与公众号复制空行

## Goal

Improve desktop startup resilience and complete the divider/copy experience in the visual theme designer.

## Requirements

- The Electron client must wait up to 30 seconds for the bundled Nest service to become ready during startup.
- The divider style selector must add a gradient option matching the supplied reference: a single line strongest at the center and fading to transparent at both ends.
- The gradient divider must respect the existing divider color, height, and vertical-margin controls and remain usable in preview/export/copy output.
- Copying rendered content into the WeChat Official Account editor must not introduce a leading empty paragraph/blank line before the first content block.
- Existing divider styles and intentional spacing inside the copied article must remain unchanged.

## Acceptance Criteria

- [x] The bundled Nest startup timeout and its timeout message both represent 30 seconds.
- [x] The visual theme designer exposes a gradient divider option and renders it with the configured divider color, height, and margin.
- [x] Existing solid, dashed, dotted, double, and pill divider styles continue to render as before.
- [x] A regression test exercises the actual WeChat copy-normalization seam and rejects a leading empty block while preserving non-leading intentional spacing.
- [x] Relevant Electron and web tests, type-check/build, and lint pass.

## Notes

- Treat the screenshots as visual/behavioral references only.
- Keep this a lightweight PRD-only task; the three changes reuse existing startup, theme-generation, and copy-normalization seams.
