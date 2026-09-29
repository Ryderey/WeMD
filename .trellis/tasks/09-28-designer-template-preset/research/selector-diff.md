# 逐选择器差异表：设计器生成器 vs 阅读系列模板

方法：程序化比对两份 CSS 的「选择器 → 声明属性集合」（脚本一次运行，非肉眼）。

- A 侧：`generateCSS(defaultVariables)`（设计器自包含输出）
- B 侧：`jadeNotesTheme`（阅读系列，实际运行时为 `basicTheme + 该 CSS + codeGithubTheme`）

初次扫描记录：48 个 B 独有选择器、32 处共有选择器上 B 有而 A 没有的声明、43 个 A 独有选择器。这些数字仅描述默认设计器与青岚原始 CSS 的属性集合，不代表五款最终运行样式的完整差异；原脚本和输出未随任务保存，不能作为可复现的保真证据。

## 0. 解读这份 diff 的三个前提（重要）

1. **两侧的运行时组合不同**。visual 主题保存的 CSS = `generateCSS(variables)`，**自包含、不叠加 `basicTheme`**（`ThemePanel.handleSave` → `createTheme(..., cssToSave, ...)`，`cssToSave = generateCSS(designerVariables)`；`getThemeCSS` 直接返回该 CSS）。而内置阅读主题运行在 `basic + reading + codeGithub` 之上。所以
   - 选择器名称不同不等于缺口，名称相同也不代表等价。设计器必须用自己的规则覆盖目标元素；不能以 basic/github 在内置侧承担该职责为由，跳过 visual 侧验证。
   - 对照基准应使用每款注册后的完整 CSS，而不只是 reading 字符串；例如阅读系列显式定义 h5/h6，设计器需要独立表达这些样式。
2. **属性集合比较不能识别简写/长写**。例如 B 用 `background-color`、A 用 `background`；B 用 `border-bottom`、A 用 `border`。这类会在 diff 里显示为「缺口」但实际不是。下表已逐条人工核对，剔除这类假阳性。
3. **初次扫描只比属性、不比取值**。下面补入源码人工核对的取值与绑定关系差异；最终仍需五款完整 CSS 的计算样式对照，不能将属性集合扫描视为保真证明。

## 1. 真缺口（设计器当前无法表达，且影响阅读系列观感）

按文档 §4.1 归并为 G1–G17 工作项；包含能力缺失、现有参数绑定不满足和待运行时确认的差异，不是 17 个必须新增的字段：

| #   | 元素           | 设计器现状                                                                                                                     | 阅读系列需要                                                                                                                                                                     | 影响版本                                  |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| G1  | `#wemd`        | `padding: 0 var(--wemd-page-padding)`（仅横向）；不设 `max-width`、`text-align`、`word-break`                                  | 纵向页边距 `5px`、`max-width: 677px`、`text-align: left`                                                                                                                         | 全 5 款                                   |
| G2  | `#wemd p`      | 上下对称 margin；justify 由 `textJustify` 控制，并非固定输出                                                                   | 仅段后距（22–25px）；先用 `textJustify:false` 验证左对齐，不重复新增开关                                                                                                         | 全 5 款                                   |
| G3  | `#wemd h5/h6`  | **完全无规则**                                                                                                                 | `.content` 14px/700/ink，并隐藏 `.prefix/.suffix`                                                                                                                                | 全 5 款                                   |
| G4  | 标题行高与字体 | `HeadingStyle` 无 `lineHeight`、无 `fontFamily`                                                                                | h1 1.5、h2 1.55–1.6、h3 1.7、h4 1.6；墨刊 h2 衬线 22px                                                                                                                           | 墨刊（字体）、全 5 款（行高）             |
| G5  | `h1 .content`  | 无 `border-bottom` / `padding-bottom`                                                                                          | 1px 细线 + 8px 下内距                                                                                                                                                            | 全 5 款                                   |
| G6  | 引用           | `quotePreset` + 变量：对称 `quotePaddingX/Y`、无 `text-indent`、无段间距、无字体                                               | 左右不对称（14/16/14/32）、`text-indent: -16px`、多段间 10px、外距 26px；墨刊衬线 17px                                                                                           | 全 5 款（不对称/缩进/段距）、墨刊（字体） |
| G7  | `#wemd hr`     | `hrStyle` 有 solid/dashed/dotted/double/pill/gradient；`pill` 固定 20% 宽居中；无通用宽度                                      | `width: 28px`（素笺居中、朱砂靠左，`margin: 36px 0 16px`）                                                                                                                       | 素笺、朱砂                                |
| G8  | 代码块         | `pre.custom { background; border-radius: 8px; overflow: hidden }`，边框/圆角/行高不可配；`pre code { border-radius: 0 }`       | 4px 圆角、1px 全框（墨刊仅左边框）、13px/1.75 行高                                                                                                                               | 全 5 款（圆角）、墨刊（边框）             |
| G9  | 行内代码       | `#wemd code` 有 color/background/padding/radius                                                                                | 13px、1px rule 边框、1px/4px 内距、左右 2px 外距                                                                                                                                 | 全 5 款                                   |
| G10 | 表格           | `table` 无 `table-layout`/`border-spacing`；`th,td` 用 `1px` 全框 + `8px 12px`；`tr:nth-child(even)` 斑马（`tableZebra` 控制） | 固定布局、`separate` + `border-spacing: 0`、仅横线、13.5px、容器顶线、无斑马                                                                                                     | 全 5 款                                   |
| G11 | 图片与图注     | img 仅 max-width:100%，margin 为上下同值/左右 auto；caption 已有行高但绑定正文，margin-top:8px；figure 与链接图片路径需核对    | 图片 width:100%、margin:26px 0 8px，小图也撑满；figure margin:0；图注独立行高 1.65、margin:0 0 26px、右对齐；链接图片图注同样保真。visual 不叠加 basic，不为不存在的浮层添加补丁 | 全 5 款                                   |
| G12 | 列表           | 只输出 `li::marker` 颜色与 `li` 基础；间距绑在 `paragraph-margin`                                                              | 独立容器距 18px/段后 22–25px、嵌套 6px、`li` 段后 6px、`li section` 16px/400/行高                                                                                                | 全 5 款                                   |
| G13 | 链接/删除线    | 链接用 `border-bottom` 下划线，无 `text-underline-offset`；无 `s` 规则（只有 `del`）                                           | `text-decoration: underline` + offset 2px、`s` 与 `del` 同规则                                                                                                                   | 全 5 款                                   |
| G14 | 脚注           | extras.ts 已有编号 width:32px、font-size:80%、line-height:26px、父项 flex；未输出 opacity:.6；条目无悬挂缩进                   | 编号 22px/12px、等宽数字；条目 13px/1.8、padding-left:22px/text-indent:-22px；核对 flex 与阅读布局的差异，不能只改编号宽度                                                       | 全 5 款                                   |
| G15 | 提示块         | `calloutStyle` 字段存在但**生成器未读取**；五变体配色在 `extras.ts` 写死                                                       | 底色统一、五变体左线分色、标题/正文各自字号色距                                                                                                                                  | 全 5 款                                   |
| G16 | 滑动图片       | 容器距 1em/0.5em；imageflow-img 没有清除普通 img 外距且圆角绑定普通图片；caption margin-top:0，其他方向还受 p 规则影响         | 容器 margin:26px 0 8px；滑动图片 margin:0、圆角 2px；caption margin:6px 0 0、12px/muted。核对普通 img/p 规则对专用元素的影响                                                     | 全 5 款                                   |
| G17 | 公式           | A 侧无 `.block-equation/.inline-equation` 规则                                                                                 | `max-width`、`vertical-align`                                                                                                                                                    | 全 5 款                                   |

> G16 不为假设中的 basic/github 组合提升特异性；只处理当前设计器内部实际存在的级联冲突和取值差异。

## 2. 假阳性（已剔除，不作为缺口）

| 现象                                                                  | 原因                                                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `#wemd mark` 显示「缺 background-color」                              | 设计器用 `background` 简写                                                                                                           |
| `#wemd blockquote` 的 background / border-left 名称差异               | 设计器预设可在 base 中输出简写/长写；仅剔除对应属性名称差异，不能整体排除引用布局。extra 不保证覆盖所有属性，仍须检查 G6             |
| `li::marker`、`pre code:not(.hljs)`、`u`、`.hljs-*` 选择器形态不同    | 暂不按名称新增规则；分别核对设计器 typography、components 和 codeTheme 对实际 DOM 的覆盖及计算值，尤其不能将非 hljs 代码分支直接排除 |
| `#wemd table tr th/td`（B）vs `#wemd th, #wemd td`（A）               | 同一元素，选择器写法不同；A 自包含时 `#wemd th` 已生效                                                                               |
| `#wemd tr:nth-child(even)`（A）vs `#wemd table tr:nth-child(2n)`（B） | 同上，斑马由 `tableZebra` 控制                                                                                                       |

## 3. 设计器已覆盖、无需新增的部分（避免重复造控件）

正文/段落字号与行高、标题 h1–h4 字号/颜色/间距、正文色、主题色与渐变、引用已有预设与变量、代码底色与字号、行内代码配色、表格表头/边框配色与斑马开关、图注字号/色/对齐、图片圆角与对称间距、列表标记色与样式、脚注配色/字号/栏目标题、加粗（含独立加粗配色）、斜体/高亮/下划线配色、Mermaid 主题。复用这些能力不等于已保真：图片非对称间距见 G11，删除线 s 覆盖见 G13，提示块 default/primary 尚未接通见 G15。

## 4. 结论与下一步

- 保留 G1–G17 编号以便交接；先核对五款完整运行样式与样例 DOM，再决定最小字段/预设集合。不得将初次单款属性扫描称为五款完整保真审计。
- 依文档要求：**先用测试证明生成器具备表达能力，再加入口**；`reading-editions.ts` 本任务不改，作为保真基准。
- 建议按依赖顺序推进：G1/G2（页面与段落）→ G4/G5/G3（标题、h5/h6）→ G7（分隔线）→ G13/G14（链接、脚注）→ G8/G9（代码）→ G10/G11/G12（表格、图注、列表）→ G6/G15/G16/G17（引用、提示块、滑动图片、公式）。
