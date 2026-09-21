# Image Upload Size Limits

> How per-host upload limits are decided, where they live, and why they must not be duplicated.

## One Resolver, Per-Host Thresholds

**Rule:** Client-side pre-upload limits come from `apps/web/src/services/image/imageUploadLimits.ts` (`resolveImageUploadLimit`). Do not hard-code a byte limit at a call site, and do not reuse the uploader's outer cap as the user-facing threshold.

| Host                                  | Client threshold  | Strictness                        | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------- | ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wechat`                              | `950,000` bytes   | `>=` rejects (strictly less than) | Upstream `uploadimg` judges "less than 1M" in **decimal** bytes (1,000,000). The outer caps (server export `WECHAT_IMAGE_MAX_BYTES` and its web mirror) now use that exact value, closing the former 1,000,000–1,048,575 false-pass window that failed at WeChat with an opaque `40009`. This threshold keeps a margin for multipart framing and the default `client_max_body_size 1m` (1,048,576 bytes of the **whole request body**, not just the file) when deployed behind nginx. |
| `official`                            | `4,500,000` bytes | `>` rejects                       | `serverUrl` may point at self-hosted `apps/server`, whose multer inbound cap is 5 MB. Take the provable strictest bound.                                                                                                                                                                                                                                                                                                                                                              |
| `qiniu` / `aliyun` / `tencent` / `s3` | `9,000,000` bytes | `>` rejects                       | Only the 10 MB outer cap (`NON_WECHAT_MAX_UPLOAD_BYTES`) is documented; leave headroom for the provider's own accounting.                                                                                                                                                                                                                                                                                                                                                             |

The resolver also returns `allowedTypes` (`["image/jpeg", "image/png"]` for `wechat`, `null` otherwise) so format rejection happens locally instead of at the uploader.

## Cross-Package Constant Parity

`WECHAT_IMAGE_MAX_BYTES` lives twice: the server export in `apps/server/src/wechat-image/wechat-image.service.ts` (source of truth) and the web mirror in `apps/web/src/services/image/uploaders/WechatUploader.ts`. Changing one without the other reopens the false-pass window.

Because `turbo.json` has no `test` task, each package's tests run independently — so there is one tripwire test **per side**, each reading the other package's source and comparing the parsed literal: `wechat-image.service.spec.ts` (server) and `WechatUploader.test.ts` (web). Both must stay green; a rename or move of either constant fails its counterpart test on purpose.

## Why Thresholds Differ From the Outer Cap

- `ImageHostManager.upload` enforces `NON_WECHAT_MAX_UPLOAD_BYTES` (10 MB) and `WechatUploader.validateFile` enforces its own cap. Those are last-resort guards; the threshold is an earlier, _stricter_ layer whose job is to fail before a request is sent.
- The limit scope is **one file per request**. WeChat's `< 1 MB` applies to a single `media` field, and the server's multer `fileSize` only counts the current file. N uploads are N independent POSTs — never sum sizes into an upload gate. Totals are display-only.
- Error copy must print the byte count (with thousands separators). Windows Explorer rounds "MB" up to whole units, so users cannot compare "1 MB" against a boundary; give them `1,020,233 字节，超过 950,000 字节上限`.

## Compression Is Opt-In, Never Implicit

`prepareImageForUpload` returns the file untouched when `file.size <= maxSizeBytes`, and `maxSizeBytes` defaults to 2 MiB. So "not passing compression options" does **not** mean "no compression". A flow that must preserve original pixels (for example the scroll-image upload) has to pass `skipCompression: true` to `uploadEditorImage`; assert both `skipCompression: true` and the absence of `compressionOptions` in tests.

## WeChat Host Uploader Constraints

`WechatUploader.validateFile` additionally sniffs magic bytes: JPEG must start `FF D8 FF`, PNG must match the 8-byte signature. MIME type alone is not accepted. Keep local pre-checks aligned with these runtime constraints so failures surface before the network call.
