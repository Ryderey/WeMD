# Execution Plan

1. Capture baseline production deployment size and dependency tree.
2. Upgrade COS SDK and lockfile, then build and test the server.
3. Add a small cleanup step to the Windows packaging script and test its retained runtime files.
4. Run the production deployment and full Windows packaging build without a version bump.
5. Compare sizes, update task notes, review and commit only task-owned files.

## Completed Verification

- `pnpm --filter @wemd/server build`
- `pnpm --filter @wemd/server test -- --runInBand` (6 suites, 24 tests)
- `pnpm --filter wemd-electron test` (14 tests)
- Targeted server and Electron ESLint checks, plus `git diff --check`
- `pnpm run build:windows -- --no-bump`, producing `apps/electron/release/WeMD Setup 1.2.14.exe`
- Launched `apps/electron/resources/server/dist/main.js` from the final package resources; `/api` returned 200 and runtime upload directory creation succeeded.
