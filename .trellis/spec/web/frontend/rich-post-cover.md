# Rich Post Cover（导出图文封面）

> 1080×1440 封面模板的几何与定位契约。改动 `apps/web/src/services/richPostCover.ts` 前必读。

## 画布与模板

- 单一固定画布 `1080×1440`（`RICH_POST_COVER_WIDTH/HEIGHT`），`position: relative; overflow: hidden`，通过 `modern-screenshot` 的 `domToBlob` 导出 PNG。
- 三个模板：`warm-quote`（暖白引语）、`cool-underline`（冷白手写）、`burst-black`（放射黑底）。预设（字体、颜色、字号上下限）在 `RICH_POST_COVER_PRESETS`。
- 标题是绝对定位的固定框（warm-quote：left 176 / top 288 / 728×864，`line-height 1.34`，`letter-spacing -2px`），字号由 `fitRichPostCoverTitle` 从预设上限向下以 4px 步进收缩，直到不溢出；到下限仍溢出返回 `null` → `RichPostCoverOverflowError`（对话框显示"标题过长"）。

## 引号定位（warm-quote）

- 开引号 `“` 固定 (left 116, top 222)；**闭引号 `”` 必须测量后定位，不得写死坐标**。写死坐标只在标题恰好排满整块时成立：任何"短标题"都会让引号留在画布下半部，与文字之间出现 400px 级空白（2026-09 回归，任务 `09-21-fix-warm-quote-close-position`）。
- `positionRichPostCoverClosingQuote(root)` 在 `fitRichPostCoverTitle` 之后调用（预览：`RichPostDialog` 的 effect；导出：`captureRichPostCover`）。它取标题**最后一个字符**的 `Range` 矩形，放到其右下，偏移为 `CLOSE_QUOTE_GAP_EM` / `CLOSE_QUOTE_DROP_EM`（em，随字号缩放）。
- 闭引号是画布（root）的子元素、不在标题框内：这样不会参与 `scrollHeight/scrollWidth` 的溢出判定，也不会被标题框的 `overflow: hidden` 裁切。
- 预览的画布带 `transform: scale(0.25)`（`.rich-post-cover-preview__canvas`），`getBoundingClientRect` 返回的是缩放后坐标；定位时必须除以 `canvasRect.width / 1080` 换算回本地像素。函数已内置该换算，调用方不需要处理。
- jsdom 不实现 `Range#getBoundingClientRect`，定位函数在无布局测量时直接返回、保留初始兜底坐标；单测需自行 stub `Range.prototype.getBoundingClientRect` 与画布矩形（见 `richPostCover.test.ts` 的 `stubRangeRect`）。

## 测试

`apps/web/src/__tests__/services/richPostCover.test.ts`：模板渲染、高亮、字号收缩、溢出、引号定位（含 0.25 缩放与无布局兜底）、导出参数。组件层在 `RichPostDialog.test.tsx`。
