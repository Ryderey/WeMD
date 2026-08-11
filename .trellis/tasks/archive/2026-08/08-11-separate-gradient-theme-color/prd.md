# Separate gradient theme color

## Goal

Separate the visual theme designer's solid primary color from its optional
gradient paint so unsupported CSS properties always keep a valid solid color.

## Requirements

- Keep the existing primary color selector solid-only, including its custom
  color picker and list marker synchronization.
- Add an independent optional gradient primary color selector with None,
  Aurora Glass, Deep Sea, Sunset Coral, and Mint Lime presets.
- Apply the gradient only to supported heading paints and the theme-colored
  bold/highlighter styles. Links, borders, list markers, footnotes, and other
  color-only properties continue using the solid primary color.
- Explain the supported gradient scope directly below the new selector.
- Preserve existing visuals when no gradient is selected and normalize older
  visual themes without a gradient field to the None state.
- Add a dependency-free custom two-color, 135° gradient editor that persists
  with the visual theme; saved preset-library management remains out of scope.

## Acceptance Criteria

- [ ] Solid and gradient selections can change independently and persist in a
      visual custom theme.
- [ ] Selecting None restores the previous solid/tinted presentation.
- [ ] Gradient-capable heading presets and bold/highlighter styles use the
      selected gradient while unsupported styles remain valid solid CSS.
- [ ] The UI lists all presets, hides the custom picker for gradients, and
      shows the agreed application-range hint and custom start/end controls.
- [ ] Unit tests, type-check, lint, production build, diff check, and live UI
      verification pass without new errors.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
