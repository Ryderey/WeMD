# Implement：引用块超长时上下滑动

分支 `feat/quote-scroll`（base `bugfix`）。改前先 `git checkout -b feat/quote-scroll`（从当前 bugfix）。

## 顺序清单

1. **types.ts**（apps/web/src/components/Theme/ThemeDesigner/types.ts）
   引用可选字段块尾（quoteOuterMargin 之后）加：
   `/** 引用超长时上下滑动的高度(px)；未设置 = 关闭 */ quoteScrollHeight?: number;`
2. **optionalOverrides.ts** → `quoteBlocks`
   在函数尾部（内层 blocks 组装后）追加：`v.quoteScrollHeight` 经 clamp(160,800) 校验非空时 push 滚动规则块（选择器 `quoteSelector("")`，四声明字面值）。缺省零字节。注意文件是 CRLF，勿整文件重写。
3. **wechatQuoteScroll.ts**（新文件 apps/web/src/services/wechatQuoteScroll.ts）
   - `applyWechatQuoteScroll(container: HTMLElement, maxHeight: number)`：遍历 `container.querySelectorAll("blockquote")`；
     - 补写内联：`max-height/overflow-y:auto/overflow-x:hidden/-webkit-overflow-scrolling:touch`（用 CSSStyleDeclaration，append 不覆盖 juice 已写值）。
     - 溢出判定：`el.clientHeight > 0 ? el.scrollHeight > el.clientHeight : (el.textContent ?? "").length >= 200`；
     - 满足则 `el.after` 注入提示行节点（纯内联 section>span，无 class，无 data-tool）。
   - `stripQuoteScroll(container)`：blockquotes 上 remove 四项内联属性。
4. **renderContainer.ts**（apps/web/src/services/export/renderContainer.ts）
   - `RenderContainerOptions` 增 `quoteScrollHeight?: number`；
   - `normalizeCopyContainer(container)` 之后：`forWechat=true` 且高度有效 → `applyWechatQuoteScroll`；`forWechat=false` → `stripQuoteScroll`；其余不开。
5. **editorStore.ts**（apps/web/src/store/editorStore.ts:182）
   `copyToWechat` 读 `currentTheme?.designerVariables?.quoteScrollHeight`，传入 copyToWechat options；`CopyToWechatOptions`（wechatCopyService.ts）与调用透传补字段。
6. **QuoteSection.tsx**（…ThemeDesigner/sections/QuoteSection.tsx 引用高级选项 details 内）
   「超长时上下滑动」Switch（on→240，off→undefined）+「滑动高度」SliderInput（160–800，仅开启时显示）+ 单行 hint。
7. **测试**
   - 新增/扩展 `apps/web/src/__tests__/services/`：复制集成断言按 PRD 验收（HTML 字符串层）。
   - 导出端：断言 strip 生效（blockquote 内联无四项）。
   - 基线套件原样全跑：60 份 fixture 不动、全绿。
8. **样例文档**（供真机验证）临时放到 `.trellis/tasks/11-08-quote-scroll/sample.md`：含 240px 下必滚长引用（≈600 字提示词风格）、200–395 字边界引用、短引用各一，并在任务目录留复制操作步骤说明。

## 验证命令

```bash
# 单测（apps/web）
npx vitest run src/__tests__/services/wechatCopyCssIntegration.test.ts \
  src/__tests__/services/wechatQuoteScroll.test.tsx ...
# 基线回归
npx vitest run src/__tests__/components/designerBaseline.test.ts
# lint + 类型
pnpm --filter @wemd/web run lint ; pnpm --filter @wemd/web run typecheck? (按实际 package.json)
```

真实浏览器验证（Electron 起应用）+ 微信桌面端复制粘贴/保存/手机预览为**用户手测项**，标注 automated / browser / WeChat 三档如实汇报。

## 提交

分两批：① 功能代码 + 测试（feat(theme): 引用超长可滑动）；② 样例与任务文档随 /finish-work 流程归档。未经用户明确同意不推送。

## 回滚点

每个提交独立可 revert；关闭 `quoteScrollHeight` 即恢复现状。
