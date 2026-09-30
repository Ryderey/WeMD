# Implementation

- [x] Add shared five-preset metadata/snippet and optional number fields.
- [x] Add preset options and scoped CSS via existing heading extra channel.
- [x] Add selection defaults, conditional number controls, hints and copy feedback.
- [x] Update five H2 seeds, live sample and coverage fixture/mirror.
- [x] Verify selection -> copied fragment -> parser -> final copy serialization;
      plain headings, inline formatting, malformed settings and persisted roundtrip.
- [x] Explicitly generate five new baselines; verify all original 55 unchanged.
- [x] Run relevant Vitest suites, web TypeScript and changed-file ESLint.
- [x] Verify real Vite UI copy/paste and both previews; compare wrapped headings.
- [x] Review full diff, record checks and update the designer contract.

Results and limits: see verification.md. ESLint reports 0 errors and one unchanged
pre-existing ThemeLivePreview dependency warning. WeChat device paste is pending.

The user accepted the result on 2026-09-30 and authorized commit, push and wrap-up.
Commit only the approved feature scope on codex/reading-heading-html, then archive
the task and record the session. Keep unrelated files intact. No merge is requested.
