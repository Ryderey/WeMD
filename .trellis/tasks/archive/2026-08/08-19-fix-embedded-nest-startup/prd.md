# 修复内嵌 Nest 启动与可见性

## Goal

Restore reliable startup of the embedded Nest service in desktop development and Windows packages, and make startup failures visible without preventing the editor window from opening.

## Requirements

- Use an Undici release supported by Electron 28's bundled Node 18.18.2 runtime.
- Keep the existing image proxy behavior and proxy-environment support.
- Make Electron detect when the embedded service does not listen on port 14000 within a bounded startup period and log a clear error.
- Preserve reuse of an existing service already listening on port 14000.
- Make the Windows release workflow use the build path that bundles the Nest server and its production dependencies.
- Do not change unrelated user work or automatically commit changes.

## Acceptance Criteria

- [ ] A clean workspace install resolves the server's direct `undici` import.
- [ ] Server build and proxy controller tests pass on the supported Node 18 runtime range.
- [ ] `pnpm dev:desktop` starts Electron, Vite, and a healthy service on port 14000.
- [ ] A failed service startup produces a clear timeout/error message in the Electron main-process log.
- [ ] Closing Electron terminates the service started by the app.
- [ ] The Windows release workflow calls the root build script that deploys the server into Electron resources without bumping versions.
- [ ] Electron and server type-check/build checks pass.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
