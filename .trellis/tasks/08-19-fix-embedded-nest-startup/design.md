# Design

## Dependency compatibility

Pin the direct server dependency to `undici@^6.28.0`. Undici 6 supports Node >=18.17, covering Electron 28's Node 18.18.2, while 6.28.0 includes the current 6.x security fixes. The existing `fetch` and `ProxyAgent` call sites remain unchanged.

## Startup visibility

Keep window creation non-blocking. After starting the development child or production utility process, poll the existing HTTP health probe until port 14000 responds or 15 seconds elapse. Reject with a mode-specific message on timeout or an early child-process error/exit. The caller logs the failure through one catch handler; the editor remains usable.

Use the existing `isServerRunning` probe and no new dependency. Keep reuse of a pre-existing listener unchanged.

## Windows packaging

Replace the Windows release job's direct Electron-only build command with `pnpm run build:windows -- --no-bump`, which already builds the monorepo, deploys Nest production dependencies, verifies the deployed entry/dependencies, and packages Electron.

## Scope

Required code scope: server package manifest and lockfile, Electron launcher/main process, Windows release workflow, and one focused launcher test if the current test setup admits it without a new framework.
