# Implement：可视化设计器套用模板再微调

权威方案：`docs/plans/2026-09-28-designer-template-preset.md`（修订节为准）。
差异表与样例：本任务 `research/selector-diff.md`、`research/sample.md`。

## 硬约束（来自方案 §4）

- visual 主题 CSS 自包含：`css = generateCSS(variables)`，不叠加 `basicTheme`。因此生成器必须自己给全（含 h5/h6、图注、列表、表格、代码、脚注、提示块、滑动图片、公式）。
- 不引入运行时 CSS 解析、不记录脏字段、不拼接「原 CSS + 设计器 CSS」。
- 新字段全部可选，缺省时旧主题输出逐字不变；回退写在生成器读取处（`.trellis/spec/web/frontend/theme-designer.md`）。
- 不以模板 ID 为生成条件；副本 JSON 自包含。
- 不顺手改 `reading-editions.ts`（它是保真基准）。

## Stage 1 — 差异表与样例（审查修订，运行验证待完成）

- `research/selector-diff.md`：保留初次单款属性扫描数字供追溯；G1–G17 是经源码复核的工作项，不是完整运行样式的保真证明。最终对照所有五款注册后的完整 CSS，并记录取值、级联与继承差异。
- `research/sample.md`：含多段/三级引用、h1–h6、嵌套列表、五提示块、带语言/无语言围栏与显式非 hljs 代码、超长行、普通/链接/滑动图片及固有尺寸小图、表格、项目支持的链接脚注、公式。
- 先使用当前 `createMarkdownParser` 实际解析整份样例，再以 DOM 查询验证下列节点存在；保留可重复执行的检查及输出。不能只在 Markdown 源码里搜索文字作为通过证据。
  - h1–h6 的 `.content`，多段 blockquote、`.multiquote-3` 与其内 h3，嵌套 ul/ol 和 `li section`。
  - 五种 `.callout-*`（note/tip/important/warning/caution），至少两个 `pre code.hljs`、一个 `pre code:not(.hljs)`，以及行内 code、s、u。
  - 普通 figure/img/figcaption、`figure a + figcaption`、`.imageflow-layer1/2/3`、`.imageflow-img`、`.imageflow-caption`、内嵌小图。
  - `.table-container`、th/td、至少两组 `.footnote-item`/`.footnote-num` 和 `.footnotes-sep`。
  - 行内/块级公式容器；在真实浏览器确认 MathJax SVG 路径。若只得到 KaTeX 回退，不算 SVG 样式覆盖通过。
- 截图前等待字体与图片加载完成，图片解码失败应先修复样例资源；362px/677px 均检查小图是否撑满、超长代码行的 overflow 与脚注换行。DOM 检查可用现有 jsdom，但不代替浏览器布局对照。

**Review gate 1 执行结果（2026-09-29）**

- DOM 覆盖检查已固化为可重复执行的测试：`apps/web/src/__tests__/services/themeSampleDomCoverage.test.ts`，样例镜像为 `apps/web/src/__tests__/fixtures/theme-sample.md`（任务目录会被归档移动，测试不引用 research 路径；两处改动需同步）。
- 检查同时统计 `createMarkdownParser` 原始输出与 `processHtml` 之后两个阶段。**47 类必需节点全部命中**，包括 h1–h6 的 `.content`、`.multiquote-3` 及其内 h3、`li section`、五种 `.callout-*`、`pre code.hljs` ×2 与 `pre code:not(.hljs)` ×1、`figure a + figcaption`、`data:` 小图、`.imageflow-layer1/2/3`、`.table-container`、两组 `.footnote-item`/`.footnote-num` 与 `.footnotes-sep`、`s`、`u`、行内与块级公式容器。缺任一即失败。
- 公式渲染：jsdom 阶段同时看到 `.katex`（2）与公式容器内的 `svg`（2）。按方案要求，**SVG 样式覆盖仍须在真实浏览器确认**，此处只作为记录，不记为通过（留到 Stage 3 截图阶段）。
- 旧输出基线已冻结：`apps/web/src/__tests__/services/designerBaseline.test.ts` + `fixtures/designer-baseline/`（54 个配置 × 完整 CSS，pinned 到改动前 `7c50096`）。断言为逐字相等；重写基线必须显式 `FREEZE_DESIGNER_BASELINE=1` 执行，默认跳过，避免被当成快照随手更新。
- 覆盖的配置：默认、6 个引用预设、10 个标题预设、6 个 hr 样式、6 个加粗样式（其中 3 个另配渐变）、5 个代码主题、4 个行内代码样式、4 个下划线样式、提示块 primary、正文对齐/首行缩进/斑马/图片阴影/链接下划线开关各 1、以及一个近似阅读版式的组合配置。
- 代价需知悉：基线固定件共约 900KB。若认为过重，可改为「默认配置存全量、其余分支只存差异规则」，但会偏离方案「完整 CSS 输出」的字面要求，需你确认。
- 全量验证：491 tests 通过（新增 55 条基线 + 2 条覆盖检查）、lint 0 errors、build 通过。

**Review gate 1**：差异表与样例经审核，且上述 DOM 覆盖检查通过并记录结果后进入 Stage 2。

## Stage 2 — 生成器表达能力（按依赖顺序分片，每片先测试后接线）

在修改任何生成器前，固定旧版本提交号，并将默认配置及受影响的现有 preset/分支配置与其完整 CSS 输出保存为测试 fixture（包含各标题/引用预设、hr 样式、代码主题、加粗样式等受影响分支）。基线必须由修改前代码生成、审核并冻结，不得随实现自动更新。

每片的固定做法：先添加旧输出基线断言与新能力失败用例 → `types.ts` 加可选字段 → `generators/*.ts` 读取并输出（缺省走原规则）→ `VARIABLES.md` 记录新变量 → 验证缺省输出逐字等于冻结 fixture、新值达到明确预期 → 最后在 sections 加控件（细项放对应分区「高级」折叠区）。禁止用修改后两条调用路径彼此相等来证明旧输出兼容。

| 片                               | 覆盖缺口       | 备注                                                                                                                                                              |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 页面与段落 ✅                | G1 G2          | 已交付 `pagePaddingY` / `pageMaxWidth` / `paragraphMarginTop` / `paragraphMarginBottom`；确认 `textJustify: false` 已可表达左对齐，未新增对齐字段                 |
| 2.2 标题                         | G3 G4 G5       | h5/h6 生成与序列化保留、标题行高与字体、h1 细线（结构化装饰，不用 2px 文字下划线近似）                                                                            |
| 2.3 分隔线                       | G7             | `hrWidth`（px/%）、对齐、上下间距；缺省保持 solid/pill/gradient 旧输出                                                                                            |
| 2.4 链接与脚注                   | G13 G14        | 链接下划线模式 + offset；`s` 与 `del` 同规则；脚注编号宽度/悬挂缩进/行高                                                                                          |
| 2.5 代码                         | G8 G9          | 代码块边框/圆角/行高、内距与溢出（区分 pre 与 code 职责）；分别验证 hljs 与非 hljs 分支及超长行；行内代码参数                                                     |
| 2.6 表格/图片与图注/列表         | G10 G11 G12    | 横线表格 preset + 尺寸配色；图片全宽、非对称间距、figure 外距、小图撑满；图注独立行高/底距和链接图片路径；列表独立间距与 li section                               |
| 2.7 引用/提示块/滑动图片/公式 ✅ | G6 G15 G16 G17 | 已交付 `quotePaddingLeft/Right`、`quoteIndent`、`quoteParagraphGap`、`quoteFontFamily`；接通 `calloutStyle` 并加提示块细项；`imageflowLayout`、`equationMaxWidth` |

**Review gate 2**：生成器测试全绿且「缺省不改变旧输出」有测试证明。

### 2.1 完成记录（2026-09-29）

- 新增字段：`pagePaddingY?`、`pageMaxWidth?`、`paragraphMarginTop?`、`paragraphMarginBottom?`，全部可选；缺省时生成器不输出任何新行。
- 新增 `generators/optionalLength.ts`：运行时输入校验（类型、有限值、上下限、两位取整），非法值一律按「未设置」处理，不把任意值拼进 CSS。
- 上限：`pagePaddingY` 0–48、`pageMaxWidth` 240–1200（0 或越界 = 不限制）、段距 0–64。
- 未新增 CSS 变量（声明直接落在 `#wemd` / `#wemd p`），因此 `VARIABLES.md` 本\_slice 无新增条目。
- 测试：`themeDesignerPageGeometry.test.ts` 24 条（含 8 组非法 `pagePaddingY`、7 组非法 `pageMaxWidth`、5 组非法段距必须**逐字等于冻结的 default 基线**）；`themeDesignerAdvancedControls.test.tsx` 4 条（高级区默认折叠、控件写对字段、未触碰时不写出新字段、段前后距默认跟随段落间距）。
- 控件放在 `GlobalSection`「页面高级选项」与 `ParagraphSection`「段落高级选项」，用原生 `details/summary`，样式加在 `ThemeDesigner.css`。
- 全量：519 tests 通过、lint 0 errors、build 通过；55 条旧输出基线断言保持全绿。

### 过程中的一个真实事故（已修）

首轮冻结的 54 个 `.css` 基线被 pre-commit 的 `prettier --write`（规则 `*.{json,md,css}`）重排了格式，导致 74 条断言失败——**逐字节基线不能放在会被格式化的后缀/目录下**。处理：新增 `.prettierignore` 排除 `fixtures/designer-baseline/`，并把生成器改动 stash 起来、回到改动前代码重新冻结，再恢复改动复验。教训已写入 `.trellis/spec/web/frontend/theme-designer.md`。

## Stage 3 — 五份变量种子

- 新增 `apps/web/src/store/themes/designerPresets.ts`，写五款完整 `DesignerVariables`（含嵌套 h1–h4、提示块）。
- 先在测试中生成五份种子 CSS，不提前登记到内置列表。
- 保真验收：对每款比对 `basic + reading + codeGithub`（基准）与 `generateCSS(seed)`（生成）在统一样例上的关键计算样式（正文/标题/引用/分隔线/代码/表格/页边距/脚注/提示块/图片），逐项列出差异并给出处理结论；截图存证。
- **通过保真验收后**才在 `builtInThemes.ts` 挂载种子并登记 `editorMode: "visual"`；若仍有缺口，补生成器后再登记；不得以「首次保存即近似」上线。

## Stage 4 — 入口与状态

1. `themeStore.duplicateTheme`：深拷贝完整 `designerVariables`（含嵌套），生成 CSS，复用 `createTheme` 返回副本；旧 CSS 主题按原方式复制。
2. `ThemePanel.tsx`：抽出「按主题对象初始化面板状态」的例程；普通点击查对象、复制直接用返回对象（消除 `allThemes` 陈旧闭包）；切换主题清空 `visualCss`，必要时按主题 ID 加 key；保存后同步 `cssInput`/`visualCss`/`originalCss`/`originalVariables`。
3. `ThemePanelView.tsx`：自定义主题区分「模板 · 复制后编辑」（五款，带文字 `[模板]` 标识）与「我的主题」（空态一行）；从内置分组过滤这五款；模板只读（不显示删除/保存/导出），按钮为「复制并微调」+「应用主题」；提示文案「模板不可修改，复制后可进行可视化微调」。
4. `ThemePanel.css` 只补必要规则。

## Stage 5 — 验证

```powershell
pnpm --filter @wemd/web exec vitest run src/__tests__/components/ThemePanel.test.tsx src/__tests__/components/themeDesignerVariables.test.ts src/__tests__/services/wechatCopyCssIntegration.test.ts
pnpm --filter @wemd/web run test -- --run
pnpm --filter @wemd/web run lint
pnpm --filter @wemd/web run build
```

- 优先扩展现有测试；新增 store/保真测试须把实际路径追加到命令并记录结果。
- 不满足于「CSS 含某字符串」就宣称视觉等价：保真靠真实浏览器的计算样式 + 截图（jsdom 不可靠）。
- 微信侧：复制内联样式保留短线、代码边框、字体与页面间距；粘贴 / 保存 / 重开人工验证，无法执行时明确标注。

## 回退

未发布：撤回入口与五款种子登记。已发布：可隐藏模板入口，但必须保留新增字段的读取与生成能力，避免已有副本刷新或导入时变样；不得清理用户主题数据。

### 2.2 完成记录（2026-09-29）

- `HeadingStyle` 新增可选 `lineHeight`、`fontFamily`、`ruleBelowWidth`、`ruleBelowColor`、`ruleBelowGap`；`DesignerVariables` 新增可选 `h5` / `h6`。缺省时生成器不多输出任何一行，55 条旧输出基线仍全绿。
- 校验统一到新模块 `generators/safeCssValue.ts`（`optionalLength` 从 `optionalLength.ts` 迁入并删除旧文件，另加 `optionalUnitless` / `optionalHexColor` / `optionalFontStack`）：字体栈只允许名称字符且拒绝 `;` `}` `<`，双引号归一为单引号；`fontWeight` 走白名单，非法值退回 `bold` 而不注入。
- 细线只在「宽度与颜色都合法」时输出，并同时输出 `display: inline-block`，使细线跟随文字宽度而非通栏。
- h5/h6 只在配置了该层级时输出，且一并隐藏 `.prefix/.suffix`；h5 字号非法则整块不输出。
- 测试：`themeDesignerHeadingDecor.test.ts` 28 条（含 5 组字体栈注入、4 组颜色、4 组宽度、5 组行高必须**逐字等于冻结 default**）；`themeDesignerAdvancedControls.test.tsx` 增至 6 条（只展开不写字段、写入落在当前层级、`跟随全局` 写 `undefined`）。
- 全量：549 tests / 56 files 通过、lint 0 errors、build 通过。
- 遗留：h5/h6 无控件（方案允许）；标题高级控件尚未做「跟随全局」以外的字体校验提示（生成侧已拒绝，UI 侧只从 `fontFamilyOptions` 取值，不产生非法值）。

### 2.3 完成记录（2026-09-29）

- 新增可选 `hrWidth`（1–600px）、`hrAlign`（`left` / `center` 白名单）、`hrMarginTop` / `hrMarginBottom`（0–120px）。缺省时 `#wemd hr` 输出与旧版逐字一致（6 条 `hrStyle-*` 基线仍全绿）。
- 宽度声明放在样式块**之后**：pill 预设自带 `width: 20%`，若把用户宽度写在前面会被它覆盖；现在显式宽度稳定胜出。
- 对齐只在有宽度时产生视觉差异；`hrAlign: "left"` 在无其它覆盖时不产生任何差异（已断言逐字等于冻结 default）。
- 测试期间抓到一个真实 bug：`optionalLength` 返回数字，`margin` 拼接时漏了 `px` 单位，输出成 `margin: 36 0 16;`。已由测试断言 `margin: 36px 0 16px;` 捕获并修正。
- 控件在段落分区「分隔线高级选项」折叠区：宽度（0 = 通栏）、对齐（靠左 / 居中，带 `aria-pressed`）、上下边距独立。
- 新增 `themeDesignerHr.test.ts` 19 条（含 5 组非法宽度、4 组非法上边距、3 组非法对齐必须逐字等于冻结 default）；控件测试增至 7 条。
- 全量：569 tests / 57 files 通过、lint 0 errors、build 通过。

### 2.4 完成记录（2026-09-29）

- 实现方式改为**追加覆盖块**（新 `generators/optionalOverrides.ts`，整段拼在输出末尾）：选择器与既有规则相同，靠出现顺序覆盖，因此不需要改动 `components.ts` / `extras.ts` 内部，缺省时也不产生任何新行。55 条旧输出基线仍全绿。
- 新增可选：`linkUnderlineMode`（`border` / `text`）、`linkUnderlineOffset`（0–10px）、`delCoversStrikethrough`（严格 `=== true` 才生效）、`footnoteLayout`（`hanging`）、`footnoteNumberWidth`（8–60px）、`footnoteLineHeight`（1–3）。
- 过程中修掉两个自己造的语义/实现漏洞：
  1. 初版把宽度声明放在样式块之前，会被 pill 预设自带的 `width: 20%` 覆盖（2.3 已修，本片的覆盖块同样置于末尾）。
  2. text 模式下若用户关掉了「显示下划线」，覆盖块会强行加回下划线；现按 `linkUnderline !== false` 决定，并有断言。
- **发现一个既有缺陷（未擅自改默认行为）**：设计器的「删除线颜色」此前只作用于 `#wemd del`，而 Markdown 的 `~~文本~~` 实际产出 `<s>`，也就是说该控件对正文里的删除线一直无效。本片提供 `delCoversStrikethrough` 开关来修正，但**没有默认打开**——默认打开会改变所有既有 visual 主题的输出，越过基线冻结的边界。是否将其设为默认（并重新冻结基线）需要决策。
- 测试：`themeDesignerTextLinks.test.ts` 22 条（枚举白名单、布尔严格比较、越界取值被夹住、覆盖块只追加不穿插）；控件测试增至 10 条。
- 全量：594 tests / 58 files 通过、lint 0 errors、build 通过。

### 2.5 完成记录（2026-09-29）

- 仍走「追加覆盖块」：`optionalOverrides.ts` 里分 `codeBlockBlocks` 与 `inlineCodeBlocks` 两段，外框落在 `#wemd pre, #wemd pre.custom`、内层落在 `#wemd pre code` + `pre code.hljs` + `pre code:not(.hljs)` 三条选择器上，hljs 与非 hljs 分支都覆盖到。缺省时不产生任何新行，55 条基线仍全绿。
- 边框全部写成 `border-width` / `border-style` / `border-color` 长属性（含行内代码用 `var(--wemd-primary-color-50)` 兜底色的情况），不出现 `border:` 简写，符合微信复制链路的既有约定。
- `codeBlockContainWidth` 同时给出 `min-width: 0`（内层）与 `overflow-x: hidden`（外框），解决超长行把代码块撑破正文宽度的问题。
- 颜色非法（`red`、注入串）时退回默认 `#DDE7DF`，绝不把原始输入写进 CSS；越界的宽度/圆角/行高分别退回 1px、不输出、或整块不输出。
- 控件在代码分区「代码块高级选项」折叠区（外框三态、边框色/宽、圆角、横纵内距、行高、长行滚动开关、行内代码字号与边框）。
- 测试：`themeDesignerCodeBlock.test.ts` 28 条；控件测试增至 11 条。全量 623 tests / 59 files、lint 0 errors、build 通过。

### 需要随本任务一起交接的既有缺陷（用户已确认暂不改默认）

设计器「删除线颜色」只作用于 `#wemd del`，而 Markdown 的 `~~文本~~` 产出 `<s>`，因此该控件对正文删除线**一直无效**。2.4 提供 `delCoversStrikethrough` 开关修正，但**默认关闭**：默认打开会改变所有既有可视化主题的输出，越过冻结基线。已同时记入 `.trellis/spec/web/frontend/theme-designer.md` 的「Known defect」一节与本任务记录，避免被遗忘。

### 2.6 完成记录（2026-09-29）

- 按方案「固定结构用有限 preset 表达」，这片没有做逐声明旋钮，而是三个枚举 preset：
  - `tableStyle: "rules"`：容器顶线 + `table-layout: fixed` + `separate`/`border-spacing: 0` + 等宽数字 + 只画横向分隔线（`border-width` / `-style` / `-color` 长属性）+ 13.5px 单元格 + 透明单元格底。
  - `imageLayout: "fill"`：`width: 100%`（小图也撑满正文）、figure 零外距、图注行高 1.65 与底距。
  - `listLayout: "reading"`：`1.25em` 缩进、容器距与条目距分离、嵌套 6px、`li section` 统一字号/字重 400/行高/正文色。
- 修正差异表的一处判断：`figure a + figcaption` 的深色浮层来自 `basicTheme`，而 visual 主题 CSS 自包含、不叠加 basic，因此**不需要**在生成器里抵消；G11 该项对 visual 侧不适用。
- 斑马纹无需新增能力：`tableZebra: false` 本来就不输出 `tr:nth-child(even)`，自包含场景下等效于「无斑马」。
- 过程失误两处，都被工具挡住：批量生成控件的模板把「类型转换」也复用了同一个占位符，产出 `opt.id as (variables.x ?? "y")` 的废代码，由 `tsc` 拦下；preset 控件测试初版是 `expect(true).toBe(true)` 的假断言，被拦后改成三节各自显式断言（含默认项 `aria-pressed` 与「只展开不写字段」）。
- 测试：`themeDesignerTableImageList.test.ts` 13 条（含非法枚举不产生覆盖、三 preset 同时开启时冻结基线仍是前缀）；控件测试增至 14 条。
- 全量：639 tests / 60 files 通过、lint 0 errors、build 通过；55 条旧输出基线仍全绿。

### 2.7 完成记录（2026-09-29）

- 新增可选字段：引用 `quotePaddingLeft` / `quotePaddingRight`（单侧缺省回退 `quotePaddingX`，垂直沿用 `quotePaddingY`）、`quoteIndent`（悬挂缩进，0 表示显式取消）、`quoteParagraphGap`（多段引用段距，末段用 `:last-child` 归零）、`quoteFontFamily`；提示块 `calloutBackground` / `calloutPaddingX` / `calloutPaddingY` / `calloutTitleFontSize` / `calloutTitleColor` / `calloutBodyFontSize` / `calloutBodyColor`；`imageflowLayout`、`equationMaxWidth`。
- **接通了死字段 `calloutStyle`**：此前生成器完全不读它。`primary` = 统一底色（`var(--wemd-primary-color-20)`，实际 12%）+ 五变体左线与标题跟随主题色；`default`（含缺省）逐字保持旧输出。模式块在前、显式细项在后，所以细项永远优先——这是方案里「default/primary 优先级」的落地方式。
- 这是本片唯一改变旧输出的地方，按「不重新冻结」处理：`designerBaseline.test.ts` 新增 `reviewedChanges`，该配置断言为 `旧基线 + 逐字钉住的追加内容`，其余 55 条仍逐字一致。机制与本任务理由已写入 `.trellis/spec/web/frontend/theme-designer.md`（Waking a dead field 一节）。影响面：无控件，只有导入/手改 JSON 才可能带 `"primary"`，这类主题现在才真正生效。
- 引用的级联关键点：全局 `#wemd p` 自带 `font-family` 与 `margin`，基础规则又写了 `margin: 0 !important`，所以字体/缩进必须**同时**写到容器和 `blockquote p`，段距必须带 `!important`；`p:last-child` 归零段后距。这一条不只靠推理：`themeDesignerQuoteCallout.test.ts` 直接用真实复制链路 `processHtml`（juice）内联两段引用的 HTML，断言首段带 `margin: 0 0 10px !important` 与 `text-indent: -16px`、末段带 `margin-bottom: 0 !important`。
- 滑动图片只使用设计器自身已有的选择器（`#wemd .imageflow-img` 等），没有按参考模板写成 `img.imageflow-img` / `section.imageflow-layer1` 去为假设中的 basic/github 组合提特异性；清掉的正是普通 `#wemd img`（外距、阴影）与 `#wemd p`（首行缩进）落到专用元素上的那些值。
- 公式原本在 visual 侧没有任何规则，长公式会撑破正文：`equationMaxWidth` 给块级 `max-width: 100% !important`、行内 `max-width: 100%` + `vertical-align: middle`。真实浏览器里的 MathJax SVG 效果仍未确认（KaTeX 回退不算通过），留到 Stage 3/5。
- 未新增 CSS 变量（追加块直接落声明，只复用既有 `--wemd-*`），因此 `VARIABLES.md` 本片无新增条目。
- 控件：`QuoteSection`「引用高级选项」「提示块高级选项」、`ImageSection`「图片高级选项」加滑动图片形态、`OtherSection`「公式高级选项」开关。
- 测试：`themeDesignerQuoteCallout.test.ts` 14 条、`themeDesignerImageflowEquation.test.ts` 6 条（含「不提高特异性」与逐字输出断言）、控件测试增至 20 条（含「只展开不写字段」「滑块显示旧默认值」）。全量：665 tests / 62 files 通过、lint 0 errors（18 条既有 warnings）、build 通过；基线 56 条断言：55 逐字一致 + 1 条审核过的追加。
- 遗留（Stage 3 保真验收要逐条列出）：五变体左线各自分色的配色无法表达（`primary` 会拉平成主题色）；引用外距 26px 依赖 `paragraphMargin`，与模板可能差 1–2px；`quoteFontFamily` 只能取 `fontFamilyOptions` 里的字体栈，与墨刊的 `Songti SC, Noto Serif CJK SC, …` 不完全一致。

### Stage 3 第一段：五份变量种子 + 写种子时暴露的表达能力缺口（2026-09-29）

- 新增 `apps/web/src/store/themes/designerPresets.ts`：五份完整 `DesignerVariables`（含 h5/h6 与提示块），取值逐条来自 `reading-editions.ts`。共享排版用工厂 `buildEdition`，五份只差调色板与少量分块参数——与参考实现同构，避免五份近乎重复的数据。**尚未登记到 `builtInThemes.ts`**：按方案，保真验收通过前不进内置列表。
- 写种子时暴露 4 个真实缺口，已在本段补掉（都走「追加覆盖」，缺省输出不变）：
  1. 素笺式引用只有上下横线且正文左对齐 → 新可选 `quoteBorderEdges: "top-bottom"`，用长属性把预设自带的左线压回 0。
  2. 满宽图片的图注间距：`fill` 之前给 `img` 上下等距 + 图注 `margin-top: 8px`，与模板的「图上 26 / 下 8、图注下 26」不符，实测会多出 18px → 改为 `img { margin: var(--wemd-image-margin) 0 8px }` + `figcaption { margin: 0 0 var(--wemd-image-margin) }`。
  3. 阅读式列表容器距：模板是「上 18、下 = 段距」→ 改成 `margin: 18px 0 var(--wemd-paragraph-margin)`。
  4. 脚注区：模板的「参考资料」标题是 13px/600/无装饰，且脚注区前有独立间距 → 新增 `footnoteHeaderStyle: "plain"`（追加块实现）并在 `footnoteLayout: "hanging"` 里带上 `.footnotes-sep` 的 `margin: 34px 0 22px`、`padding: 2px 0 4px`、`border-top-width: 0`。
- **本段最重要的过程教训**：第 4 项最初是往 `extras.ts` 的 `footnoteHeaderStyle` 三元链里加分支，结果 54 条基线**全红**。两个独立原因叠在一起：
  1. 编辑工具把 `extras.ts` 从 LF 整体改写成 CRLF，而它是 CSS 模板字符串的源头，换行符直接进入产物字节；
  2. 即便换行修好，往那条链里加分支也会在输出里多插一段 `\n  ` 空白（模板里每个 `${}` 之间的字面文本都会输出），因此对既有分支**不是**无操作。
     处理：`git checkout --` 还原 `extras.ts`（逐字节比对确认与 HEAD 一致），把 "plain" 改为在覆盖块里追加规则（不匹配任何既有分支时，`extras.ts` 只留下 `content` 与 `display`）。教训：改任何含 CSS 模板字面量的文件后必须看换行符，且「加一个条件分支」不等于「输出不变」。
- 测试：`themeDesignerEditionSeeds.test.ts` 18 条（每份种子必须自包含地含 h5/h6、引用、提示块五变体、脚注、滑动图片、公式、表格容器、`li section` 等节点规则；种子值被校验器静默丢弃是最难发现的失败，因此按款钉住关键声明）+ 2.7 文件补 2 条 `quoteBorderEdges`、脚注文件补 2 条（含「既有分支输出逐字不变」）。
- 全量：688 tests / 63 files 通过（另 1 条为显式重新冻结用的 skip）、lint 0 errors（18 条既有 warnings）、build 通过；55 条旧输出基线仍逐字一致 + 1 条审核过的 `calloutStyle-primary` 追加。
- 已知并接受/待确认的偏差（浏览器对照时逐条核）：提示块五变体左线在 `primary` 下拉平为主题色（模板是 accent/muted/ink/两个暖色）；表格容器顶线、th 底线在模板里各自有色差，种子统一用 `tableBorderColor`；提示块外距用段距（模板 24/26）；行内代码 `margin: 0 2px` 无法表达；引用内 `strong` 字重 700（模板 600）；h5/h6 外距是估值 26/10，模板靠 UA 默认，需要浏览器实测后回填。
