# Implementation Plan

1. Complete and verify `08-28-rich-post-ai-rewrite`.
2. Complete and verify `08-28-rich-post-cover`.
3. Complete and verify `08-28-rich-post-delivery`.
4. Run full Web/Electron tests, builds and lint; manually exercise one real compatible endpoint in each runtime when credentials are available.
5. Perform final cross-child review: secret handling, title invariants, font loading, copy text and ZIP structure.

## Validation

- `pnpm --filter @wemd/web test --run`
- `pnpm --filter @wemd/web lint`
- `pnpm --filter @wemd/web build`
- `pnpm --filter wemd-electron test`
- `pnpm --filter wemd-electron build`
