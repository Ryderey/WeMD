# Implementation Plan

1. Change the server's direct Undici dependency to `^6.28.0` and regenerate the lockfile/install state.
2. Add a bounded readiness wait to `server-launcher.ts`, covering success, timeout, and early process failure.
3. Catch and log startup rejection from `main.ts` without blocking window creation.
4. Point the Windows release workflow at the root no-bump build command and remove now-redundant build steps where safe.
5. Run server tests/build, Electron tests/build, the desktop startup port check, and Windows packaging preconditions.
