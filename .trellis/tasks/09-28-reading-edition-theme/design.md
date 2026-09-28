# Design：青岚主题移植映射

来源：`WeDraft/templates/reading-editions.ts` 的 `createEdition()` base + `jade-notes` overrides。
目标：`packages/core/src/themes/jade-notes.ts`，一个 `#wemd` 作用域 CSS 字符串。

## 调色板（jade-notes）

| 名           | 值        | 用途                                             |
| ------------ | --------- | ------------------------------------------------ |
| accent       | `#27675C` | 二级标题、链接、三级标题、参考标题、表头文字     |
| ink          | `#3D4841` | 正文、加粗、emoji 后正文                         |
| muted        | `#6D786F` | 图注、参考条目、脚注正文                         |
| surface      | `#F4F7F4` | 代码块底（jade override 改为 `#F3F7F4`）、表头底 |
| rule         | `#DDE7DF` | 分隔线、表格线、边框                             |
| rhythm       | `1.92`    | 正文行高                                         |
| paragraphGap | `25`      | 段间距                                           |

字体：sans `"PingFang SC","Microsoft YaHei",Arial,sans-serif`；serif `"Songti SC","Noto Serif CJK SC","SimSun",serif`；mono `"Menlo","Consolas",monospace`。

## 分块映射

| WeDraft 块                      | WeMD 目标选择器                                                                     | 处理                                                                                                                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `article`                       | `#wemd`                                                                             | 字体/字号 16px/行高 1.92/字距 0/左对齐/ink 色/`overflow-wrap`                                                                                                                                       |
| `body`                          | `#wemd p`                                                                           | 加 `margin: 0 8px 25px`                                                                                                                                                                             |
| `heading2`                      | `#wemd h2` + `#wemd h2 .content`                                                    | 20px/1.6/600，jade override 用 accent；`.prefix/.suffix` 隐藏                                                                                                                                       |
| `headingNumber` / `headingText` | **不复现**                                                                          | WeDraft 的「编号单独一行」需要 renderer 产出两个 span；WeMD 标题文本在 `.content` 内是整串。`.prefix` 仅为空槽，定义基础样式但不占位                                                                |
| `heading3`                      | `#wemd h3 .content`                                                                 | 17px/1.7/600/accent                                                                                                                                                                                 |
| `quote`                         | `#wemd blockquote`（元素同时带 `.multiquote-N`）                                    | jade：`border-left: 0`、底 `#F4F8F5`、`padding: 14px 16px 14px 32px`、行高 1.9                                                                                                                      |
| `quoteMark` / `quoteStrong`     | **不复现引号字符**                                                                  | WeMD 不产出引号 span；伪元素在微信复制链路会丢，不加。加粗色由 `#wemd strong` 承担                                                                                                                  |
| `image`                         | `#wemd img`                                                                         | `width: calc(100% - 16px)`、`margin: 26px 8px 8px`                                                                                                                                                  |
| `caption`                       | `#wemd figcaption`                                                                  | 12px/1.65/muted/右对齐/`margin: 0 8px 26px`                                                                                                                                                         |
| `link`                          | `#wemd a`                                                                           | accent + 下划线（`text-decoration: underline`），不写 `border-bottom`                                                                                                                               |
| `divider`                       | `#wemd hr`                                                                          | `border: 0; border-top: 1px solid rule; width: calc(100% - 16px); height: 0; margin: 34px auto 16px`                                                                                                |
| `strong`                        | `#wemd strong`                                                                      | ink + 700                                                                                                                                                                                           |
| `list` / `listItem`             | `#wemd ul`、`#wemd ol`、`#wemd ul li`、`#wemd ol li`、`#wemd li section`            | `padding-left: 1.25em`、`margin: 18px 8px 25px`、条目 `margin: 0 0 6px`                                                                                                                             |
| `note`                          | `#wemd .callout` 及 `.callout-title`                                                | WeMD 无独立「说明」块，把 note 的排版（13px/1.8/muted）落到 callout 上                                                                                                                              |
| `code`                          | `#wemd pre code.hljs`、`#wemd pre code:not(.hljs)`、`#wemd p code`、`#wemd li code` | mono 13px/1.75、jade override `color: #3B5548` + 底 `#F3F7F4`、`border: 1px solid rule`、`padding: 14px 16px`、`word-break: break-word`。**不设 `pre` 容器底色**（保留 mac 栏块与 github 高亮分工） |
| `references`                    | `#wemd .footnotes-sep`                                                              | `padding-top: 20px`、`margin: 0 8px 22px`                                                                                                                                                           |
| `referenceTitle`                | `#wemd .footnotes-sep:before`                                                       | 13px/1.6/600/accent/`margin-bottom: 14px`；`content` 由 basic 提供，不改                                                                                                                            |
| `referenceItem`                 | `#wemd .footnote-item p`                                                            | 13px/1.8/muted、`padding-left: 22px`、`text-indent: -22px`、`margin: 0 0 8px`                                                                                                                       |
| `referenceNumber`               | `#wemd .footnote-num`                                                               | 12px、等宽数字、`width: 22px`、muted                                                                                                                                                                |
| `tableWrapper`                  | `#wemd .table-container`                                                            | `margin: 24px 8px 28px`、`border-top: 1px solid #B6CCC1`（jade override）                                                                                                                           |
| `table`                         | `#wemd table`                                                                       | `width: 100%`、`table-layout: fixed`、`border-collapse: separate`、`border-spacing: 0`、等宽数字                                                                                                    |
| `tableHeaderCell`               | `#wemd table tr th`                                                                 | accent 文字、surface 底、600、`border-bottom: 1px solid rule`、`padding: 10px 8px`                                                                                                                  |
| `tableCell` / `tableAltCell`    | `#wemd table tr td`                                                                 | 13.5px/1.7、ink、白底、`border-bottom: 1px solid rule`、`padding: 10px 8px`、`overflow-wrap: anywhere`                                                                                              |
| —（无斑马）                     | `#wemd table tr:nth-child(2n)`                                                      | 源模板不区分隔行，需**抵消 basic 的斑马底**：置为 `background: transparent`                                                                                                                         |

## 自造部分（源模板没有的块）

| WeMD 块                | 取值                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `h1`                   | 24px/serif/600/ink/居中，下衬 1px rule 短线                                                                                                     |
| `h4`                   | 15px/700/accent，无装饰                                                                                                                         |
| `h5/h6`                | 14px/700/ink                                                                                                                                    |
| `em`                   | ink + italic；`em strong` 用 ink 700                                                                                                            |
| `mark`                 | 底 `#E4EDE6`，ink                                                                                                                               |
| `del`                  | muted + line-through                                                                                                                            |
| `callout` 五变体       | 底 surface、`border-left: 4px solid`，note/tip/important 取 accent 深浅，warning `#C98A4B`、caution `#B0574B`（借调色板邻近色，避免引入新色系） |
| `imageflow-*`          | 沿用主题族通用写法，圆角/字色换成本主题值                                                                                                       |
| 公式 / 任务列表 / 目录 | 只保留 `max-width` 之类的兜底，不改观感                                                                                                         |

## 决策与偏离

1. **不复现 WeDraft 的 renderer 级花活**：`headingNumber` 双行编号、`quoteMark` 引号字符、`sectionLabel` 章节标签都依赖它自家 renderer 产出的额外 span，WeMD 不产出。本次以「同一调色板 + 同一排版节奏」复刻观感，不新增解析器结构。
2. **不引入 CSS 变量**：WeMD CSS 模式主题的既有约定是字面值（否则微信复制会残留 `var()`）。
3. **不写 `border-bottom` 做链接下划线**：改用 `text-decoration`，避免复制链路的边框简写问题。
4. **不改 `basicTheme` / `codeGithubTheme`**：本主题作为 `basicTheme + jadeNotesTheme + codeGithubTheme` 的中间层，靠自身规则覆盖默认值；不改共享文件即不会影响其余 10 款主题。
5. 分支 `feat/reading-edition-theme`，回滚 = 丢弃分支。

## 验证

```
pnpm --filter @wemd/web run test -- --run
pnpm --filter @wemd/web run lint
pnpm --filter @wemd/web run build
```

浏览器：dev server 上选中「青岚」，用内置欢迎样稿逐块目视（含 320px 窄屏）；再用现有复制链路确认 `var(` 零残留。

## 实现结果与偏离（实现 + 代码审查后补记）

代码审查（子代理，按 juice 真实内联结果判定胜出规则）查出并已修复：

- `imageflow-*` 五条规则原为同特异性但排在 `codeGithubTheme` 之前 → 全部失效。改用 `section.imageflow-layer1/2/3`、`img.imageflow-img`、`p.imageflow-caption` 提高一级特异性后生效。
- `.multiquote-3` 在基础主题里被 `text-align: center`，且 `.multiquote-2/3` 带 `box-shadow` → 补 `text-align: left`（p 与 h3）与 `box-shadow: none`。
- callout 保留基础主题的 `border: 1px solid` 与重阴影 → 补 `border: 0; box-shadow: none;`，标题补 `letter-spacing: 0`。
- 代码块漏文字色（被 `#wemd .hljs{color:#333}` 接管）→ 补 `color: #3B5548`。
- 基础主题的 `min-width: max-content` 使长行溢出文章 → 补 `min-width: 0`。
- 逐行行高由 `#wemd pre code span{line-height:26px}` 接管 → 补 `#wemd pre code span{line-height:1.75}`。
- 基础主题的 `a{font-weight:bold}`、`del{font-style:italic}`、`li section{font-weight:500}`、`.footnote-num{opacity:.6}`、`.footnote-item p{word-break:break-all}`、`.footnote-word/ref{font-weight:bold}` 全部泄漏 → 逐条压掉。
- 图片链接嵌套路径 `figure a + figcaption` 带 `margin-top:-35px` + 深色浮层 → 用同选择器覆盖为常规图注。

实测结论（决定不再纠缠的两处）：

- **代码块 `white-space` 主题层压不动**：`min-width` 能压（已生效为 0），但 `white-space` 实测仍为 `pre`。这是全主题族的一致行为（不换行、框内横向滚动），源模板的 `pre-wrap` 不在本主题追求范围内，已删除该死声明并加注释说明。
- **删除线标签是 `<s>` 不是 `<del>`**：`~~x~~` 经 markdown-it 产出 `<s>`，规则改为同时覆盖 `s` 与 `del`。

与源模板的其余偏离：

1. **水平内缩统一交给根容器**：源模板每个块各带 `8px` 左右边距；本实现改为根容器 `padding: 5px 22px`，块级只用纵向 margin，`img/figcaption/hr` 因此用 `100%` 宽而非 `calc(100% - 16px)`。
2. **表格字号/行高/padding 不由主题决定**：`apps/web/src/services/wechatTableRenderer.ts` 在预览与复制时固定内联这些值（该模块注释明确「布局参数不绑定主题字号」），主题只能控制颜色/背景/边框。因此表头 `13.5px` 声明实机显示为 `13px`。
3. **`td` 底色改 `transparent`**（源为 `#FFFFFF`）：浅色下等效，且避免微信深色模式下奇偶行不同色。
4. **列表标记不上色**：源 `list` 块无 `color`，本实现不给 `ul/ol` 设色，标记随文字取 ink；未沿用其他内置主题的彩色标记。
5. **`img` 去掉圆角**：源 `image` 块无圆角。
6. **自造块**（源模板未定义）：`h1` 24px/600 左对齐 + 1px 细线；`h5/h6` 14px/700 ink；`mark` 底 `#E4EDE6`；callout 五变体配色（note=accent、tip=muted、important=ink、warning=`#C98A4B`、caution=`#B0574B`）。链接下划线用 `text-decoration` 而非 `border-bottom`。
7. **未复现**：`headingNumber` 双行编号、`quoteMark` 引号字符、`sectionLabel` 章节标签——都依赖对方 renderer 产出的额外 span。其中标题标签按用户决定**另开分支**用「作者显式标注」方案实现，不在本分支。

## 第二批复刻：阅读版式系列收敛为工厂（同日）

上游 `reading-editions.ts` 的 5 款本就是「共享 base + 逐块 overrides」，因此把单文件的青岚改造成工厂 + 版本参数，而不是复制 5 份近重复 CSS：

| 文件                                           | 说明                                                                                                                                                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/themes/reading-editions.ts` | 新增。`ReadingPalette`（accent/ink/muted/surface/rule/rhythm/gap/markBg/tagline）+ `ReadingDeltas`（heading2 / quote / divider / tableTop / tableHeader / code / calloutBg，均可缺省）+ `createReadingEdition()` |
| `packages/core/src/themes/jade-notes.ts`       | 删除，导出改由工厂提供                                                                                                                                                                                           |

导出 5 款主题：`plainPaperTheme`「素笺」、`inkJournalTheme`「墨刊」、`jadeNotesTheme`「青岚」、`blueprintTheme`「蓝图」、`cinnabarTheme`「朱砂」。

**无回归证明**：改造前后分别抓取 `jadeNotesTheme` 字符串做逐行比对 —— 541 行、全部 CSS 声明逐字节一致，唯一差异是一行注释文案（"引用：浅青底…" → "引用：悬挂缩进，不用投影"）。过程中确实抓出并修掉一处真实差异：青岚的提示块底色当初写的是引用同色 `#F4F8F5`，工厂里一度统一成 surface `#F4F7F4`，已通过 `calloutBg` 参数还原。

各款差异（相对基座）：

| 版本 | 标题                          | 引用                                           | 分隔线                           | 表格                             | 代码                         |
| ---- | ----------------------------- | ---------------------------------------------- | -------------------------------- | -------------------------------- | ---------------------------- |
| 素笺 | 21px / 1.55 / 字距 0.5 / 居中 | 去左竖线，上下 1px 细线，12/16/12/32，1.86     | 28px 宽，#C8BFB2，36px auto 14px | 上边线 #CFC5B7                   | 底 #FAF9F6                   |
| 墨刊 | 衬线 22px / 1.55 / #272727    | 衬线 17px / 1.85，1px 左竖线 #B6B6B2，6/0/6/24 | #464644                          | 表头白底 #303030，下边线 #B7B7B2 | 底 #F8F8F6，仅左竖线 #CFCFCB |
| 青岚 | 20px，accent                  | 去左竖线，底 #F4F8F5，14/16/14/32，1.9         | #DDE7DF                          | 上边线 #B6CCC1                   | 底 #F3F7F4，字 #3B5548       |
| 蓝图 | 20px / 1.55 / #2F3540         | 2px 左竖线 #ABC0E5，1.85                       | 32px auto 16px                   | 上边线 #B4C7E7                   | 底 #F6F8FC                   |
| 朱砂 | 21px / 1.55                   | 去左竖线，底 #FCF8F5，14/16/14/32              | 28px 宽，#BB796F，36px 0 16px    | 上边线 #EBE1DB                   | 底 #FBF8F5                   |

段间距：素笺 24 / 墨刊 24 / 青岚 25 / 蓝图 22 / 朱砂 24；行高：1.90 / 1.84 / 1.92 / 1.84 / 1.88。

上游的 `headingNumber`、`headingText`、`headingNumbered`、`quoteMark` 四个 overrides 依赖其 renderer 产出的额外 span，本系列一律不渲染（与青岚同一决策）。

**验证**：改动后 `build` 通过、434 tests 全绿、lint 0 error；4 款新版的差异项以断言生成文本的方式逐条校验（6 组全过）；实机预览确认主题库 17 项含 5 款阅读版式，并选中「墨刊」端到端核对：h2 衬线 22px #272727、引用衬线 17px 白底 1px 左竖线 padding-left 24px、代码底 #F8F8F6 且上边框 0 / 左边框 1px、表头白底 #303030、分隔线 #464644、正文 margin 24px 行高 29.44px（16×1.84）。
