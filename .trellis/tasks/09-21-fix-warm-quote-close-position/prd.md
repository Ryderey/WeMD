# 修复暖白引语模板：闭引号贴合文字末尾

## Goal

"导出 → 导出图文" 的**暖白引语**模板中，闭引号 `”` 用写死的绝对坐标 `(left 880px, top 1070px)` 定位，只有标题恰好排满约 5 行时才贴近文字。短标题（用户报告："欢迎使用 WeMD"，2 行）文字在 y≈600 结束，闭引号却钉在 y=1070，中间出现约 470px 空白（用户 2026-09-20 截图报告，期望效果见其提供的对照图：引号紧贴最后一个字）。

## Background（已核对）

| 位置                                             | 现状                                                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/services/richPostCover.ts:216-223` | 开引号 `("“", left 116, top 222)`、闭引号 `("”", left 880, top 1070)`，均为绝对坐标                              |
| `createQuote()`（同文件 :379-399）               | 引号是 root 的绝对定位子元素，`fontSize 116px`、accent 色                                                        |
| `fitRichPostCoverTitle()`（:228-260）            | 字号从 116 向下收缩直到不溢出；预览（`RichPostDialog.tsx:171-188`）与导出（`captureRichPostCover`）都先调它      |
| 测试                                             | `apps/web/src/__tests__/services/richPostCover.test.ts` 未断言引号坐标；`docs/` 与归档任务中无本模板的几何设计稿 |

## Requirements

1. 闭引号改为**排版后动态定位**：量出标题最后一个字符的矩形，把闭引号放到其右下（轻微下沉，视觉上如同结束引号跟在句尾）。不再使用写死的 880/1070。
2. 其他一律不动：开引号位置、标题字号与位置、`fitRichPostCoverTitle` 的收缩与溢出报错、冷白手写与放射黑底两个模板。
3. 预览（`RichPostDialog`）与导出（`captureRichPostCover`）两条渲染路径应用同一套定位逻辑；不新增依赖。
4. 无布局环境（jsdom 等测得矩形为 0）时保持现有坐标作为兜底，不抛错。

## Acceptance Criteria

- [x] 2 行短标题（"欢迎使用 WeMD"）与长标题样例渲染后，闭引号与最后一个字的间距 ≤ 约 0.1em；不再出现 400px 级空白。
      （实测：导出 PNG 像素分析，引号左缘距末行文字右缘 8–12px；数据见 `research/quote-position.md`）
- [x] 标题接近收缩边界（最后一行占满整行、或文字贴底）时，闭引号不换行、不被裁切、不超出 1080×1440 画布。
      （实测：长标题一例文字底 y=968、引号底 y=971，均在画布内）
- [x] `pnpm --filter @wemd/web exec vitest run src/__tests__/services/richPostCover.test.ts src/__tests__/components/RichPostDialog.test.tsx` 全绿，且新增至少一条定位断言（mock 矩形，钉住"最后一个字右下 + 固定偏移"的关系）。
      （web 全量 397 用例通过；新增 3 条定位用例，含 0.25 缩放换算与无布局兜底）
- [x] 浏览器实测：dev server 打开导出图文预览/导出 PNG，截图对照用户提供的期望图，截图与结论写入本任务 `research/`。
      （`research/after-export.png` + `research/quote-position.md`；lint 0 error、`pnpm --filter @wemd/web build` 通过）

## Notes

- 对照图（用户提供）的字号约 145px、边距更小，均大于当前模板上限 116px；本轮**只修引号贴合**，不追平对照图的"占满感"（用户 2026-09-20 明确选择"仅引号贴合"）。
- 不涉及的模板（冷白手写/放射黑底）没有引号元素，本改动对其零影响。
