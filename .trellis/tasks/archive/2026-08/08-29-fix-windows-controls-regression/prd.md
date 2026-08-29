# 修复 Windows 窗口控制缺失回归

## Goal

Restore visible, working minimize, maximize/restore, and close controls in the
Windows desktop application header.

## Requirements

- Diagnose why the Windows Electron renderer does not receive the preload
  bridge that identifies the desktop platform.
- Restore the bridge through the smallest root-cause fix.
- Keep browser mode free of desktop window controls.

## Acceptance Criteria

- [ ] The Windows Electron renderer reports an Electron platform and renders
      all three header window-control buttons.
- [ ] The controls invoke the existing minimize, maximize/restore, and close
      IPC actions.
- [ ] Browser mode continues to omit the desktop controls.
- [ ] A repeatable Electron DOM smoke check and focused tests pass.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
