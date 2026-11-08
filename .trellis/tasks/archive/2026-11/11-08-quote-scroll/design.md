# Design：引用块超长时上下滑动

## 变量与规则生成（唯一事实源）

- `DesignerVariables` 新增可选字段 `quoteScrollHeight?: number`（apps/web/src/components/Theme/ThemeDesigner/types.ts，引用区注释块尾）。语义：`undefined` = 关闭；正数 = 滑动容器高度 px（160–800）。
- 生成位置：`generateOptionalOverrides` → `quoteBlocks`（optionalOverrides.ts:123）新增一个 block——**append-only 层**，缺省分支零字节，60 份基线不动：

  ```css
  #wemd blockquote,
  #wemd .multiquote-1,
  #wemd .multiquote-2,
  #wemd .multiquote-3 {
    max-height: ${px}px;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
  ```

  选择器复用本文件已有的 `quoteSelector("")`；四条声明全是字面值，无 `var()`，不涉边框简写。数值经 clamp 帮助函数校验（160–800）后才插值。

- 不改 components.ts 主模板（会给所有主题加字节）、不加 conditional chain 分支。
- 属性全部内联在复制时兜底（见下），class 不作为兼容关键。

## 复制链路（微信）

- 数据流：`editorStore.copyToWechat`(store/editorStore.ts:182) 已读 `designerVariables`（showMacBar 同路径）→ `CopyToWechatOptions` 增加 `quoteScrollHeight?: number` → `renderOffscreenContent` options 透传。
- 新文件 `apps/web/src/services/wechatQuoteScroll.ts`，两个函数（供 renderContainer 调用）：
  - `applyWechatQuoteScroll(container, maxHeight)`：对容器内每个 `blockquote`（含 multiquote 类块）：补写四条内联声明（append 风格，双保险，同 pre 的 ThemeProcessor.ts:102-113 先例——用 DOM 补写替代字符串正则，且在 juice 之后，时效一致）；随后判定溢出并注入提示行。
  - `stripQuoteScroll(container)`：非微信语境（导出图片）从 blockquote 内联中 remove `max-height/overflow-y/overflow-x`（连 -webkit 一起）。
- 注入时机：`renderOffscreenContent` 内、`normalizeCopyContainer(container)` 之后、return 之前；`forWechat===true 且 height>0` 才 apply，`forWechat===false` 才 strip。`serializeWechatCopyHtml` 序列化时自然带上（克隆 container 子树）。
- 提示行节点（语义对齐上游取证）：

  ```html
  <section
    style="margin: 6px 0 24px; text-align: center; box-sizing: border-box;"
  >
    <span style="font-size: 12px;">▲上下滑动查看全文</span>
  </section>
  ```

  纯内联、无 class（微信剥 class），无 data-tool。结构对齐研究文档取证的节点，外距 6px/24px 与 WeMD 段距近似。

- 溢出判定：`el.scrollHeight > el.clientHeight` 且 `clientHeight > 0`（真实布局）；伪布局环境（jsdom，clientHeight=0）回退 `textContent.length >= 200`。
- 预览不含提示行：与「链接转脚注」（copy-only transform）同先例，PRD 有说明。

## 导出图片 / 其他语境

- `copyAsHtml`、导出 HTML：不动（CSS 随行，overflow 在现代语境可用）。
- 导出图片：`stripQuoteScroll` 保证长引用完整呈现（避免静默折叠）。

## UI

- `QuoteSection.tsx` 的「引用高级选项」details 内追加：
  - 开关行「超长时上下滑动」：`Switch`，on → 写入 `quoteScrollHeight: 240`（或恢复 240 默认），off → 写入 `undefined`。
  - 开启时显示滑杆「滑动高度」：`SliderInput` 160–800，值 240 起步。
  - 文案 hint：「开启后，复制到公众号的引用超长时内部可上下滑动；导出图片不受影响」——按界面文案口径，删说明文档腔，一句话足够。

## 兼容与风险

- 老 JSON 主题：字段缺省 = 关闭；`normalizeDesignerVariables` spread 透传无需特判。
- 基线：关闭时 optionalOverrides 零字节 → 60 份不变。**不**重冻结任何 fixture。
- optionalOverrides.ts 是 CRLF 文件，编辑时只改 quoteBlocks 函数体，勿整文件重写。
- jsdom 限制：`-webkit-overflow-scrolling`/max-height 断言落在序列化 HTML 字符串层（scroll-image 规格要求）。
- 中文提示行在 plain text fallback 也会出现（innerText），可接受。

## 回滚

单 commit 单分支；关闭开关即回到现状，无需数据迁移。
