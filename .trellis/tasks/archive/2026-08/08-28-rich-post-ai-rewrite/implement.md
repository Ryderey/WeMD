# Implementation Plan

1. Add the shared prompt/config/result helpers and focused unit tests.
2. Add browser direct-fetch transport and setting persistence helpers.
3. Add Electron encrypted secret store, AI request handler, preload bridge and type declarations.
4. Add an AI settings form suitable for reuse inside the final dialog.
5. Run Web tests/lint/build and Electron tests/build before handing off to the cover task.

## Rollback Points

- Web service and Electron IPC are independent; revert the IPC namespace without affecting browser behavior.
- Secret file schema is a single ciphertext value and requires no migration if removed.
