# Design

Implement approved route A. Keep the Markdown parser and all its callers unchanged.
Use one shared reading-heading metadata table for five presets, selection defaults,
CSS generation and snippets. Reuse HeadingSection and its clipboard/error pattern.

Authored inline HTML contains a reading-heading wrapper, a nonempty rule span,
a body wrapper, a number span and a text span. The body wrapper isolates hanging
padding/text-indent from the chapter rule. The rule is authored content, not a
parser-generated divider; the full snippet avoids requiring an additional `---`.
All CSS is scoped to the active heading level. Unmarked headings receive no number
or hanging padding. Changing a theme does not remove authored markup.

Number sizing/color/gap/width are optional HeadingStyle fields, validated at the
generator boundary. Missing/invalid values use preset defaults only for the five
new IDs. Existing IDs must generate byte-identical CSS. Main title typography
continues to use current HeadingStyle values. Borders use longhand declarations.

Built-in H2 seeds opt in. Previously saved custom copies are not migrated.
Reuse JSON storage and template duplication; no database/schema migration.

Reference: docs/research/2026-09-30-reading-edition-heading-visual-options.md and
docs/research/2026-09-30-wedraft-reading-heading-source.md. The authored rule span
refines route A's manual divider example to make the copied structure complete.
