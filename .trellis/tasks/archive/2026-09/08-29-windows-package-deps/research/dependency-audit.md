# Dependency Audit

## Baseline

- `pnpm --filter @wemd/server deploy --prod` deploys `cos-nodejs-sdk-v5@2.15.4` into Electron resources.
- Its production chain includes `request@2.88.2`, `har-validator@5.1.5`, and `uuid@3.4.0`; this is the source of the Windows-build warning.
- The current embedded server resource directory is 18.91 MiB, of which 18.24 MiB is `node_modules`.

## Upgrade Candidate

- The npm registry reports `cos-nodejs-sdk-v5@3.0.0` with only `cos-request`, `cos-fast-xml-parser`, and `mime-types` as runtime dependencies.
- The application uses only the established SDK `putObject` callback API in `apps/server/src/services/cos.service.ts`, so a major-version upgrade is the smallest compatible remediation to verify.

## Packaging Observation

- `pnpm deploy --prod` currently copies package source, test and repository documentation into `apps/electron/resources/server` even though the packaged runtime starts only `dist/main.js`.
- Removing those non-runtime files after the fresh deployment is a safe, local size reduction provided the build verifies the entry point and Nest runtime dependency remain present.

## Verification Results

- `cos-nodejs-sdk-v5` is now `3.0.0`. The deployment warning no longer contains `request@2.88.2`, `har-validator@5.1.5` or `uuid@3.4.0`. The remaining `glob`/`inflight` warning is from the workspace dependency resolution; those packages are not present in the embedded server's production dependency directory.
- The final embedded directory contains only `dist/` and `node_modules/`. User uploads are placed under Electron `userData/uploads` at runtime, so stripping the historical packaged `uploads/` directory does not discard user data. The local upload response now uses the actual `PORT`, including Electron's embedded port `14000`.
- Embedded server resources: 18.91 MiB (19,825,686 bytes) to 16.07 MiB (16,850,537 bytes), saving 2.84 MiB / 15.0%.
- NSIS installer: `WeMD Setup 1.2.13.exe` 163.07 MiB to the final `WeMD Setup 1.2.14.exe` 160.50 MiB, saving 2.57 MiB / 1.6%.
- Final packaged server health check: `GET /api` returned HTTP 200 and the configured runtime uploads directory was created.
