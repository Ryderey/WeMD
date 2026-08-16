# Fix server startup missing multer dependency

## Goal

Ensure `@wemd/server` can resolve every package it imports at runtime so the compiled NestJS service starts without `Cannot find module 'multer'`.

## Background

- `apps/server/src/upload/upload.controller.ts:10` imports `memoryStorage` directly from `multer`.
- `apps/server/package.json` declares `@types/multer` only as a development dependency; it does not declare the `multer` runtime package.
- With pnpm's dependency isolation, `multer` being a transitive dependency of `@nestjs/platform-express` does not make it available for direct imports from `@wemd/server`.
- `pnpm --filter @wemd/server exec node -e "require('multer')"` deterministically reproduces `MODULE_NOT_FOUND`.

## Requirements

- Declare `multer` as a direct production dependency of `@wemd/server`.
- Keep the installed version compatible with the existing NestJS platform dependency and `@types/multer` declarations.
- Update the pnpm lockfile consistently.
- Do not change upload behavior or controller implementation.

## Acceptance Criteria

- [x] `pnpm --filter @wemd/server exec node -e "require('multer')"` exits successfully.
- [x] `pnpm --filter @wemd/server run build` succeeds.
- [x] Starting the compiled server no longer fails with `Cannot find module 'multer'`.
- [x] Only dependency metadata and Trellis task artifacts change; existing unrelated working-tree files remain untouched.

## Out of Scope

- Refactoring upload handling or storage modes.
- Changing API behavior, file validation, or upload limits.
- Modifying the separate project copy used on another machine.
