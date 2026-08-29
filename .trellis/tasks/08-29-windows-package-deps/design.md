# Windows Package Dependency Cleanup Design

## Boundaries

- `apps/server` owns the COS runtime dependency.
- `scripts/build-windows.mjs` owns construction of `resources/server`.
- `apps/electron/electron-builder.json` owns final installer inclusion rules.

## Approach

1. Upgrade the existing `cos-nodejs-sdk-v5` dependency from 2.x to 3.x. The public `putObject` callback integration remains the same, avoiding a new storage abstraction.
2. After `pnpm deploy --prod`, remove files that the embedded Nest service cannot execute: source, test, package-manager metadata, development env examples and repository documentation. Keep `dist`, production `node_modules` and the runtime `server.env` convention intact.
3. Measure the deployed resource directory and the NSIS executable before and after the change.

## Safety

- The cleanup occurs only inside the freshly recreated `apps/electron/resources/server` directory.
- The packaging script validates `dist/main.js` and `@nestjs/core` after cleanup.
- No dependency is removed merely because it is large; it must be absent from the Nest runtime path.
