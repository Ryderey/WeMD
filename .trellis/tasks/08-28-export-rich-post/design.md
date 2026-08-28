# Technical Design

## Boundaries

- `apps/web` owns title resolution, AI result validation, cover DOM/rendering, dialog state, clipboard and ZIP composition.
- `apps/electron` owns API Key encryption and Electron-side AI requests through narrow IPC methods.
- `apps/server` is unchanged; Web calls user-configured endpoints directly.

## Data Flow

`editorStore.markdown + currentFilePath` → resolve title → AI transport → validated `{ body, highlightTerms }` → editable result → cover renderer → `cover.png` + composed text → clipboard or ZIP.

## Compatibility and Security

- Web requires providers that allow browser CORS; Key is never persisted.
- Electron never exposes a get-key method. `safeStorage` ciphertext is atomically written under `userData`; unavailable encryption and Linux `basic_text` are rejected.
- Imported prompts only replace editable style instructions; the application always appends the fixed JSON contract and source-material guard.

## Rollback

The feature is isolated behind a new dialog and IPC namespace. Removing the new entry points, dialog, rich-post services and `electron.ai` bridge restores prior behavior without data migration.
