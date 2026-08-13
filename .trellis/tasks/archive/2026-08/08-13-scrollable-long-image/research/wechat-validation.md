# WeChat Official Account Validation

Validated on 2026-08-13 with Chrome DevTools MCP against an authenticated
WeChat Official Account editor session. The test draft title was
`WeMD 滚动长图兼容性测试 2026-08-13 17:05`.

## End-to-end path

1. Opened the local WeMD development build and selected a generated
   1200 x 6000 PNG through the dedicated scroll-image input.
2. Used the real settings dialog at 320 px and the existing upload service.
3. Inserted the generated `::: scroll-image 320` block.
4. Used WeMD's “复制到公众号” action and pasted with `Ctrl+V` into the
   authenticated WeChat editor. HTML was not injected into the editor.
5. Saved the draft, reloaded it from WeChat, and deleted the test draft after
   the editor and mobile-emulation checks. The article was never published.

Chrome DevTools MCP rejected direct filesystem attachment because its upload
path allowlist did not accept any configured workspace path. To keep the
product path under test, an equivalent 1200 x 6000 browser `File` was assigned
to the real hidden file input. Preview, upload, Markdown insertion, copy,
clipboard paste, draft save, reload, and draft deletion all used
the actual product and WeChat UI flows.

Before the acceptance criterion was revised to stop at editor inspection, one
preview had already been sent to the account's existing preview recipient under
the earlier approved plan. No further preview was sent after the revision.

## Measurements

| Checkpoint                       | `clientHeight` | `scrollHeight` | Scroll mutation | Result |
| -------------------------------- | -------------: | -------------: | --------------: | ------ |
| WeMD preview after upload        |         320 px |        1700 px |        0 -> 640 | Pass   |
| WeChat immediately after paste   |         320 px |        2780 px |        0 -> 600 | Pass   |
| WeChat after save and reload     |         320 px |        2780 px |        0 -> 700 | Pass   |
| 390 x 844 mobile touch emulation |         320 px |        2780 px |        0 -> 900 | Pass   |

The mobile emulation reported a coarse pointer, one touch point, and retained
`overflow-y: auto`, `overflow-x: hidden`, and `touch-action: pan-y`.

## WeChat sanitizer result

- WeChat rewrote the uploaded image URL to its own CDN during paste.
- Saving and reopening removed the feature CSS classes.
- The nested `section` structure remained.
- The compatibility-critical inline declarations remained, including the
  fixed height, vertical and horizontal overflow, image width and auto height,
  zero image margin, and touch panning.
- `tabindex="0"`, `role="region"`, the accessible label, and the fixed hint
  text remained.
- The earlier preview request returned success (`base_resp.ret = 0`), but it is
  retained only as an execution note and is not part of the final acceptance
  criterion. Final acceptance stops at successful paste, save/reload, and
  visual/DOM inspection in the WeChat editor.

## Cleanup

- The WeChat test draft was deleted from the draft list after editor checks.
- No publish action was invoked.
- Generated local validation images were removed after the test.
- The existing image upload service does not expose a delete operation for its
  uploaded object, so no unsupported remote deletion was attempted.
