# 修复导出图文弹窗关闭

## Goal

Make the close control in the "导出图文" dialog reliably dismiss the dialog.

## Requirements

- Clicking the dialog header's close control must invoke the supplied close
  callback and return the user to the editor.
- The close control must not accidentally submit a surrounding form or rely on
  event bubbling to close the dialog.
- Keep the existing export and AI configuration flows unchanged.

## Acceptance Criteria

- [x] A regression test proves that the header close control calls `onClose`.
- [x] The close control is explicitly a non-submit button and handles its own
      click event.
- [x] Relevant web tests, type check/build, and lint complete without errors.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
