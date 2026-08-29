# Technical Design

## Web Service

- A single rich-post AI module owns constants, prompt composition, endpoint normalization, fetch, response parsing and result validation.
- Non-secret settings use localStorage; the API Key is component/session state only.
- Base URLs ending in `/chat/completions` are used as-is; other URLs append that path after trimming `/`.

## Electron Secret Boundary

- Add `electron.ai.getStatus/saveApiKey/clearApiKey/rewrite` to preload and renderer declarations.
- Store only base64 ciphertext in `userData/ai-secrets.json`; write a temporary sibling file and rename it.
- Reject `!safeStorage.isEncryptionAvailable()` and Linux `getSelectedStorageBackend() === "basic_text"`.
- `rewrite` decrypts in the main process, calls the same wire contract, and returns only validated content or sanitized error.

## Prompt Contract

The editable prompt contains tone and transformation rules. A non-editable suffix states that Markdown is source material, requests exact JSON, and supplies title and Markdown separately.
