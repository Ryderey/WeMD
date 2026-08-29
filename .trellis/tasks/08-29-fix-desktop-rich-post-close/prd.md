# 修复客户端导出图文关闭

## Goal

Restore the close action for the desktop client's "导出图文" dialog.

## Requirements

- The header close control of the rich-post export dialog must be clickable in
  the Windows Electron client.
- Electron title-bar drag regions must not intercept modal interactions.
- The same dialog must remain usable in the Web version.

## Acceptance Criteria

- [x] A regression test covers the modal's Electron-safe interaction region.
- [x] Clicking the close control invokes the dialog close callback in the
      desktop interaction path.
- [x] Relevant Web and Electron checks pass.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
