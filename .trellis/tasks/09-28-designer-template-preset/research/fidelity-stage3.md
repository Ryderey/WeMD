# Stage 3 保真验收：五份变量种子 vs `basic + reading + codeGithub`

样例、脚本与截图位置见文末「复现方式」。本文件是方案 §6 要求的「逐项列出差异并给出处理结论」。

## 方法

- 样例：整份 `apps/web/src/__tests__/fixtures/theme-sample.md`（`research/sample.md` 的镜像）交给实际
  `createMarkdownParser`，再走 `processHtml(…, inlineStyles=false)`。
- 每款生成一个对照页：**四块同构内容** = 基准/生成 × 362px/677px。两份 CSS 只做一件事——把 `#wemd`
  改写成带作用域的 id（`#wemd-ref-362` 等），**特异性仍是 id 级**，不改任何选择器结构。
- 基准 CSS 与 `builtInThemes.ts` 的注册方式逐字一致：`basicTheme + "\n" + 阅读版式 + "\n" + codeGithubTheme`；
  生成侧是 `generateCSS(种子)`。
- 采集环境：真实 Chrome（813px 视口，块宽由固定 width 控制）。等字体 ready、图片解码完成
  （`naturalWidth` 实测 `800x450` 与内嵌 `1x1`，无解码失败）、MathJax `typesetPromise` 完成后才取数；
  五款回报均为 `MathJax=ok`，因此**公式是真实 MathJax SVG 路径**，不是 KaTeX 回退。
- 探针：60 个节点 × 44 个计算属性；比较脚本按「模式」压缩（颜色与 px 抽象成占位符），忽略派生量 `height`
  与字体栈书写差异（`PingFang SC` 与 `-apple-system,…` 在本机都落到系统中文字体，实测断行与字宽一致）。

## 总体观感

| 款   | @362px 总高（基准 → 生成） | @677px               | 提示块 @677   | 引用 @362       |
| ---- | -------------------------- | -------------------- | ------------- | --------------- |
| 素笺 | 5636 → 5328（-5.5%）       | 6114 → 5782（-5.4%） | 61.78 → 56.69 | 568.44 → 552.14 |
| 墨刊 | 5464 → 5184（-5.1%）       | 5997 → 5693（-5.1%） | 61.78 → 55.91 | 495.94 → 479.83 |
| 青岚 | 5677 → 5378（-5.3%）       | 6151 → 5827（-5.3%） | 61.78 → 56.95 | 580.30 → 567.19 |
| 蓝图 | 5460 → 5117（-6.3%）       | 6000 → 5634（-6.1%） | 61.78 → 55.91 | 487.34 → 463.23 |
| 朱砂 | 5642 → 5340（-5.4%）       | 6119 → 5792（-5.3%） | 61.78 → 56.44 | 576.45 → 559.75 |

方向一致、幅度一致（-5%~-6%），说明这是**同一条根级继承缺失**在累加，不是逐块的取值错误。

## A. 根级继承缺失 —— 会改变所有可视化主题的输出，需要人工审核后重新冻结

| #   | 差异                                                                         | 实测证据                                                                                                                                                                                            | 结论                                                                                                       |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A1  | 生成的 `#wemd` 没有 `line-height`，只把行高写在 p/li/引用等具体规则上        | 计算值 `root.line-height: 30.72px → normal`，凡是未显式声明行高的节点全部继承到 `normal`：`figure`、`.callout` 与五个变体、`blockquote` 容器、`h5 .content`、公式容器、`hr`、`img`… 共 40+ 个探针键 | 建议修。visual 主题 CSS 自包含（方案 §4），根上不给行高等于把节奏交给浏览器默认；这也是上表 -5%~-6% 的主因 |
| A2  | 生成的 `#wemd` 只有 `overflow-wrap: break-word`，缺 `word-break: break-word` | `word-break: break-word → normal` 同样遍布所有继承节点                                                                                                                                              | 建议修，与 A1 同一次改默认                                                                                 |
| A3  | `#wemd a { word-break: break-all }`                                          | `a.word-break: break-word → break-all`                                                                                                                                                              | 建议修。break-all 会把链接里的英文单词从中间断开，基准不是这个行为                                         |

三项都属于「设计器输出该自己给全，而不是靠 basicTheme 兜底」的既有契约范围内，但**必然改动 55 条冻结基线**，
因此按方案要走「人工审核 + `FREEZE_DESIGNER_BASELINE=1` 重新冻结 + 任务记录说明」。是否执行需要用户拍板。

## B. 只影响新可选字段与新预设的修复 —— 不动旧输出，可直接实施

| #   | 差异                                                                                                          | 实测证据（青岚 @362）                                                                                                              | 处理                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| B1  | `codeBlockContainWidth` 用 `overflow-x: hidden` + `pre code { word-break: keep-all }`，超长行既不换行也滚不到 | `pre code.word-break: break-word → keep-all`，`pre.overflow-x: auto → hidden`                                                      | 给该开关补换行语义（`word-break: break-word` 或 `overflow-wrap: anywhere`），否则是可达性缺陷 |
| B2  | 悬挂式脚注：编号颜色被 `footnoteHeaderColor` 牵成主题色；条目缺 `margin-bottom`；缺 `font-variant-numeric`    | `footnote-num.color: #6D786F → #27675C`、`footnote-item p.margin-bottom: 8px → 0px`、`font-variant-numeric: tabular-nums → normal` | 在 `footnoteLayout: "hanging"` 覆盖块内补齐：编号与正文同用脚注文本色、条目段后距、等宽数字   |
| B3  | 阅读式列表的 `li section` 外距                                                                                | `li section.margin-top: 5px → 0px`                                                                                                 | 在 `listLayout: "reading"` 覆盖块给出与基准一致的外距                                         |
| B4  | 滑动图片容器上距用段距                                                                                        | `imageflow-layer1.margin-top: 26px → 25px`                                                                                         | `imageflowLayout: "reading"` 内写定 26px，或改用图片外距变量                                  |
| B5  | 引用上下外距固定 26px，种子只能落到段距                                                                       | `blockquote.margin-top: 26px → 25px`（各款差 1–4px）                                                                               | 新增一个可选 `quoteOuterMargin`，与其它「外距独立」字段同构                                   |

## C. 已接受的小偏差（只记录，不修）

- 提示块五变体左线：基准按调色板分色（accent / muted / ink / `#C98A4B` / `#B0574B`），`calloutStyle: "primary"` 拉平为主题色。
- 表格三处细线（容器顶线、th 底线、td 底线）基准各自有色，种子统一由 `tableBorderColor` 提供。
- 代码块外距 24/26 与段距 25 差 1–2px；行内代码 `margin: 0 2px` 无对应字段。
- `h2/h3/h4 .content` 的 `display: inline-block → inline`：无装饰时视觉等价（宽度差只影响贴边装饰）。
- 脚注编号字号 12px（基准）vs 13px（种子共用 `footnoteFontSize`）。
- 代码底色/圆角落点不同（基准画在 `pre code`，生成画在 `pre`）：实测外观一致，仅在无 `overflow` 裁切时圆角表现不同。

## D. 纯数据回填（不需要改生成器）

- `h5`/`h6` 外距：基准 composition 是 `30px / 15px`，种子先前按估值写了 `26 / 10` → 回填为 30/15。
- 基准的 `h5` 外壳字号是 basicTheme 的 16px，`.content` 才是 14px；生成侧同构（外壳 UA 13.28px、`.content` 14px），可见文字一致，不需要处理。

## 验收结论

1. 五份种子在**声明层**与基准一致：配色、字号、行高节奏、引用不对称内距与悬挂缩进、分隔线短线、代码框、表格横线式、图片满宽与图注、脚注悬挂、公式 max-width 均按预期落到计算样式上。
2. 阻塞项是 A 类根级继承缺失——它不是某一款的问题，而是「自包含输出」在根节点上少给的两条声明，实测影响约 5% 全文高度。
3. 按方案「未通过保真验收不得登记」，**A/B 未处理前不在 `builtInThemes.ts` 挂载五款**。A 类需要先取得「重新冻结 55 条基线」的决策；B 类与 D 类可以在不动旧输出的前提下先做。

## 复现方式

- 对照页构建：`apps/web/src/__tests__/services/zzFidelityBuild.test.ts`（临时脚本，写入 `.tmp/fidelity/pages/`；
  Stage 3 收尾时要么转正为常规工具、要么删除，不得长期留在测试目录里）。
- 采集与比较：`.tmp/fidelity/serve.cjs`（静态 + 回传）、`.tmp/fidelity/digest.js`（浏览器探针）、
  `.tmp/fidelity/patterns.cjs`（差异模式）、`.tmp/fidelity/heights.cjs`（总高）。
- 原始数据：`.tmp/fidelity/reports/*.json`；截图：`.tmp/fidelity/shots/*.jpeg`（每款全页，含基准/生成 × 两宽度四块）。
- 采样环境固定：视口 813px、图片 `800x450` + 内嵌 `1x1`、`MathJax=ok`（SVG 输出，非 KaTeX 回退）。

## 第二轮复测：A/B 修完之后（同日）

用户选择把 A 类做成 opt-in 字段而不是改默认输出，因此 55 条冻结基线不动。已实施：

- A → 新可选 `rootTypography`：开启时追加 `#wemd { line-height: var(--wemd-line-height); word-break: break-word; }`
  与 `#wemd a { word-break: break-word; }`。五份种子全部开启。
- B1 → `codeBlockContainWidth` 追加 `word-break: break-word`：外框改成不滚动后，长行必须能换行看到，
  否则是被裁掉的可达性缺陷。
- B2 → 悬挂脚注：编号改用 `footnoteColor`（原先被 `footnoteHeaderColor` 牵成主题色）、补
  `font-variant-numeric: tabular-nums`、条目补 `margin: 0 0 8px`。
- B3 → 阅读式列表 `li section` 外距 `5px 0`；B4 → 滑动容器 `margin: 26px 0 8px`（不再跟段距）；
  B5 → 新可选 `quoteOuterMargin`（基础规则的外距带 `!important`，覆盖也必须带）。种子设 26px。
- 另补：`equationMaxWidth` 一并给出 `.block-equation { text-align: center; overflow-x: auto; }`。

### 全文总高偏差（基准 → 生成）

| 款   | @362 修复前 → 修复后 | @677 修复前 → 修复后 |
| ---- | -------------------- | -------------------- |
| 素笺 | -5.5% → +0.4%        | -5.4% → -0.1%        |
| 墨刊 | -5.1% → +0.1%        | -5.1% → -0.3%        |
| 青岚 | -5.3% → +0.6%        | -5.3% → +0.2%        |
| 蓝图 | -6.3% → -0.3%        | -6.1% → -0.7%        |
| 朱砂 | -5.4% → +0.3%        | -5.3% → -0.2%        |

10 份采样全部收进 ±0.7%；差异模式数从 227 降到 131，剩下的几乎全是上面 C 类的已接受项
（提示块五变体分色、callout 外距 1–2px 与标题字距、脚注编号 12 vs 13px、`figure` 的 flex/block
与图注派生宽度、`blockquote strong` 600 vs 700、`h2/h3/h4 .content` inline-block）。

### 判定

**通过**，附 C 类已记录偏差。生成 CSS 在统一样例上的真实计算样式与
`basic + reading + codeGithub` 基准在 ±0.7% 总高内一致；公式是 MathJax SVG 路径，图片解码正常。

### 登记时机的偏离说明

方案原写「通过验收后即挂载 `builtInThemes.ts`」。实际把登记并入 Stage 4 的第一个提交：内置列表一旦
出现 `editorMode: "visual"` 的条目，就会立刻出现在所有主题选择器里，而那时 `ThemePanel` 仍有
「按名字查对象 + 陈旧闭包」的已知问题——先登记会留下一个明知有缺陷的中间状态。验收证据在本文件与
`.tmp/fidelity/` 里保持可查。

### 未取到的证据

修复后的全页截图没拿到：复测采集完成后应用内 Browser 表面进入后台
（`visibilityState=hidden`），`take_screenshot` 报 `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`。
数值证据完整（`reports/` 为修复后，`reports-before/` 为修复前）；需要视觉存证时把内嵌 Browser
切到前台，访问 `http://127.0.0.1:5199/<id>.html` 重截即可。
