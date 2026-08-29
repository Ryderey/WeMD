# 优化顶部工具栏

## Goal

Make the desktop header retain standard window controls while reducing the
number of top-level export actions.

## Requirements

- On Windows Electron, display usable minimize, maximize/restore, and close
  controls at the end of the visible header.
- Replace the separate "导出图片" and "导出图文" header actions with one
  "导出" button that reveals both actions in a dropdown.
- Preserve the existing image-export and rich-post export behaviors.
- Keep mobile and auto-hidden header behavior unchanged.

## Acceptance Criteria

- [ ] Windows Electron renders three accessible window-control buttons and
      each calls its existing window-control action.
- [ ] The visible header contains one "导出" button and no separate
      top-level "导出图片" or "导出图文" buttons.
- [ ] Opening the export dropdown exposes both export choices; clicking one
      runs the same action as before and closes the dropdown.
- [ ] The dropdown closes when clicking outside or pressing Escape.
- [ ] Focused component tests and the web package lint/build succeed.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
