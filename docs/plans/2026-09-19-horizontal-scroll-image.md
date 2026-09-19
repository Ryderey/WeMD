# 滚动长图：增加横向滚动方案

日期：2026-09-19。状态：已按本方案实现；自动化与浏览器实测通过，微信端手测待进行。

本轮仅阅读现有实现并编写方案，没有修改功能代码、运行功能测试或验证微信客户端。本文件是实现交接文档，不代表功能已完成；不创建或启动 Trellis 实施任务。

### 实现与验证记录（2026-09-19 实现 agent 追加）

按第 7 节顺序完成，未派生其他 agent。实现范围与文件边界完全遵循本方案，`Toolbar.tsx` 未修改。

- 自动化：core 78/78（含 47 项 MarkdownParser）、web 384/384、web `tsc -b` 0 错误、`pnpm build` 成功、改动文件 ESLint 0 问题；electron 17/17 回归通过。
- 复制链路按第 6 节完整断言（解析 → processHtml → resolveInlineStyleVariablesForCopy → normalizeCopyContainer → serializeWechatCopyHtml），基础/designer/sunset 三主题横向合约通过，未修改复制服务。
- 浏览器实测（Chrome，容器宽 362px）：宽图 2400×600 溢出 1256 > 346 且 `scrollLeft` 可置 500；`scrollHeight == clientHeight` 证明无纵向裁切；图片尺寸精确等比（314px 高 → 1256px 宽）；正方图无溢出时左对齐不拉伸；正文 `body.scrollWidth == clientWidth` 未被撑宽；横向视口可聚焦；弹窗横向预览 1248/312 精确等比、切向时滚动位置归零且高度保留。
- 测试环境限制：jsdom 的 CSSOM 不支持 `touch-action`，样式重写步骤会丢弃该属性（纵向同样如此），故该属性在字符串阶段断言；真实浏览器与微信端保留（微信实测记录见 `.trellis/tasks/archive/2026-08/08-13-scrollable-long-image/research/wechat-validation.md`）。
- 待测：微信编辑器粘贴、保存重开、手机阅读三阶段的横向表现尚未实测，不能视为微信兼容通过。

## 1. 结论与范围

可以在现有“滚动长图”中增加“滚动方向”选项，复用文件选择、预览、压缩上传、Markdown 插入及渲染链路。默认仍为纵向，新增横向适用于全景图、时间轴等单张宽图。

横向模式按指定展示高度等比缩放图片，容器宽度跟随文章；图片宽于容器时左右滚动。这里的横向是浏览方向，不旋转图片、不改变文字排版。

首版不增加多图拼接、轮播、自动播放、拖拽模拟、方向自动识别、全局偏好持久化或新的依赖。现有多图 `imageflow` 功能继续独立。

## 2. 已核对的现状

| 文件（仓库相对路径）                                               | 现有职责与实现要点                                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `apps/web/src/components/Editor/Toolbar.tsx`                       | 独立文件入口、创建和释放 object URL、挂载设置弹窗、插入 Markdown                                             |
| `apps/web/src/components/Editor/ScrollImageDialog.tsx`             | 展示高度默认 320，范围 160–800，预设 240/320/420；调用 `uploadEditorImage`；生成 `::: scroll-image <height>` |
| `apps/web/src/components/Editor/ScrollImageDialog.css`             | 预览当前固定高度、纵向 overflow、图片宽度 100%                                                               |
| `packages/core/src/plugins/markdown-it-scroll-image.ts`            | 校验单图块、解析高度、渲染 section/img/提示文案；关键样式已内联                                              |
| `apps/web/src/components/Preview/MarkdownPreview.css`              | `#wemd img` 强制 `max-width:100% !important; height:auto !important`，会阻止横向图片按固定高度展示           |
| `apps/web/src/components/Editor/SyntaxHelpPopover.tsx`             | 公开纵向语法说明                                                                                             |
| `apps/web/src/__tests__/services/wechatCopyCssIntegration.test.ts` | 已有纵向从解析、CSS 内联到复制 DOM 归一化的回归测试                                                          |

核心插件对越界整数高度采用钳制，弹窗对越界值禁用提交；这是既有差异，本次保留。插件对非法参数或非单图内容降级为普通容器，保留正文。

实施前阅读 `.trellis/spec/web/frontend/index.md` 中相关必读规范，以及 `wechat-copy-pitfalls.md`、`css-design.md`、`.trellis/spec/core/frontend/index.md`。复制兼容所需尺寸与 overflow 必须内联，不能只依赖 class。

## 3. 用户交互

在现有弹窗预览上方增加原生单选组“滚动方向”：`纵向（上下滑动）`、`横向（左右滑动）`。复用现有颜色和间距 token。

- 每次选择新文件，方向恢复纵向、高度恢复 320；不根据宽高自动切换。
- 切换方向保留已输入高度，并把预览滚动位置重置到起点；不触发上传。
- 高度控件仍叫“展示高度”，两种方向均使用 160–800px 与现有预设。
- 纵向提示保持“↕ 上下滑动查看完整图片”；横向改为“↔ 左右滑动查看完整图片”。说明文字与 aria-label 同步方向。
- 预览保持可聚焦，使用原生滚动与原生单选键盘操作；横向可用触控板、触屏及聚焦后的方向键操作，不拦截普通鼠标滚轮。
- 上传过程中方向和高度均不可编辑；失败保留文件、方向、高度，允许重试。取消和成功后沿用 object URL 清理。
- 图片按高度缩放后不足容器宽度时左对齐，不拉伸到铺满、不强制制造溢出。首版仍显示方向提示，不为隐藏提示额外增加尺寸监听。

## 4. Markdown 合约

采用在旧高度参数后追加方向的方式，旧文档无需迁移：

```markdown
<!-- 原有纵向，省略高度时为 320 -->

::: scroll-image
![长图](https://example.com/long.png)
:::

<!-- 原有纵向；工具栏在纵向模式继续生成此格式 -->

::: scroll-image 320
![长图](https://example.com/long.png)
:::

<!-- 新增横向；工具栏在横向模式生成此格式 -->

::: scroll-image 320 horizontal
![全景图](https://example.com/panorama.png)
:::
```

允许的头部严格为 `scroll-image`、`scroll-image <整数高度>`、`scroll-image <整数高度> horizontal`、`scroll-image <整数高度> vertical`。方向区分大小写，只允许上述两个值；省略方向按 vertical 处理。显式 vertical 供手写使用，工具栏不生成冗余参数。

不接受 `scroll-image horizontal`、未知方向、重复方向、调换参数次序、额外参数及小数高度。非法输入沿用当前普通容器回退，正文不可丢失。负整数和越界整数沿用原钳制逻辑；高度省略时默认 320。

块内容仍仅允许单张图片。继续使用 Markdown-it 图片解析与 HTML 转义，保留 alt/title/URL 处理，不自行拼接未转义属性，不扩展可用 URL 协议。

## 5. 渲染设计

把插件内部 `parseHeight` 扩展为返回 `{ height, direction } | null` 的参数解析函数，`ScrollImageMeta` 增加方向。有效打开 token 携带方向；关闭 token 的现有处理不变。不新增对外配置 API 或通用组件框架。

保留现有 `.scroll-image`、`.scroll-image-viewport`、`.scroll-image-img`、`.scroll-image-caption` 结构。仅横向根节点附加 `.scroll-image-horizontal`，便于预览定向覆盖；纵向 HTML 与样式尽可能原样保留。

| 项目              | 纵向                                    | 横向                                                     |
| ----------------- | --------------------------------------- | -------------------------------------------------------- |
| 视口宽度          | 100%                                    | 100%                                                     |
| 视口高度          | 固定 H px                               | 固定 H px                                                |
| overflow          | x hidden / y auto                       | x auto / y hidden                                        |
| 图片尺寸          | width 100%; max-width 100%; height auto | width auto; max-width none; height 100%; max-height none |
| 图片布局          | block，margin 0，border 0               | 同左，不裁剪、不压缩宽高比                               |
| touch-action      | 沿用 pan-y                              | auto，让横向原生滚动与页面纵向手势共存；实测确认         |
| 提示及 aria-label | 上下滚动                                | 左右滚动                                                 |

横向图片使用 `height:100%` 匹配固定视口的实际内容高度，让占位滚动条出现时仍能完整展示图片高度。横向视口不预留纵向 scrollbar gutter（覆盖为 auto）；弹窗外层和纵向视口的既有 gutter 保留。真实浏览器需验证 Windows 占位滚动条和覆盖式滚动条下均不裁底、不出现纵向滚动。

上述关键样式写入插件输出的行内样式；弹窗预览用对应 CSS 规则实现同样尺寸策略。不引入 JS 图片测量来计算宽度。

### 必须处理的预览覆盖

只改变插件 overflow 不够：`MarkdownPreview.css` 的全局图片 `!important` 会把横图重新限制在文章宽度内，并覆盖固定高度。

在全局规则之后增加限定于横向组件的更具体规则，例如 `#wemd .scroll-image-horizontal .scroll-image-img`，覆盖 `max-width:none !important` 和 `height:100% !important`；width auto、max-height none 与渲染合约一致。普通图片和纵向图继续使用既有规则。弹窗 CSS 也必须覆盖其默认的 width/max-width/height。

主题内联后仍需断言实际结果；如果内置主题的 important 声明确实覆盖横向合约，再在横向组件范围内补最小内联修正。不要无证据地全局放宽图片规则，也不要修改所有主题。

## 6. 上传、复制与兼容性

方向仅存在于弹窗状态和 Markdown，不增加数据库字段或上传接口参数。复用 `uploadEditorImage` 及现有压缩上限；上传后的图片尺寸可能变化，但长宽比与横向布局应保持。

复制验收路径必须覆盖：`createMarkdownParser().render` → `processHtml` → `resolveInlineStyleVariablesForCopy` → `normalizeCopyContainer` → `serializeWechatCopyHtml`。将最终序列化结果重新解析后检查尺寸、overflow、图片地址、提示与单图数量，不能只测试初始 HTML。

目前仅能从本地代码确认实现路径可扩展，尚未证明公众号编辑器保存及移动端阅读能保留新增横向布局。实现 agent 必须记录粘贴、保存重开、手机阅读三个阶段的实际效果。若目标端移除关键样式，应记录平台与现象并修订方案，不把浏览器预览通过视为微信兼容通过。

不新增截图、PDF 等静态导出的整图展开规则；若触及这些链路，应记录现有行为及回归结果。旧版 WeMD 遇到带方向参数的新语法会按非法参数降级为普通内容，因此回退版本可读图片但不保留横向布局。

## 7. 实施顺序与文件边界

1. 扩展核心插件参数解析、元信息、方向对应的行内样式和提示；同步扩展 `packages/core/src/__tests__/MarkdownParser.test.ts`。
2. 扩展 `ScrollImageDialog.tsx` 与其 CSS，新增本地方向状态、原生单选与方向序列化。`Toolbar.tsx` 现有回调应可保持，只有接入确有需要才修改。
3. 在 `MarkdownPreview.css` 处理横向专属覆盖，更新 `SyntaxHelpPopover.tsx`，并扩展 `ToolbarScrollImage.test.tsx`。
4. 扩展复制集成测试至最终序列化，先验证再决定是否需要修改复制服务；不要预先重写复制逻辑。
5. 完成真实浏览器和微信手测，提交验证证据与尚未验证项。

本轮没有派生子 agent。用户指定实现 agent 后可直接按此顺序推进，避免多个 agent 同时修改同一插件或弹窗。

## 8. 验收与验证命令

自动化最少覆盖：

- 所有旧语法和普通图片回归不变；现有横向多图 imageflow 不受影响。
- 横向、显式纵向、默认高度、160/800 边界、越界钳制；未知方向及额外参数回退；非单图回退；属性转义保留。
- 弹窗默认纵向；切换保留高度、提示与 aria-label 更新；插入对应语法；上传期间不能切换；失败重试保持横向；取消释放地址。
- 复制最终 HTML 在基础主题、已有 sunsetFilmTheme 和设计器生成主题中保持横向合约，纵向与普通图片不变。

从仓库根目录运行（实现后执行，本轮未运行）：

```powershell
pnpm --filter @wemd/core test --run src/__tests__/MarkdownParser.test.ts
pnpm --filter @wemd/core build
pnpm --filter @wemd/web test --run src/__tests__/components/ToolbarScrollImage.test.tsx src/__tests__/services/wechatCopyCssIntegration.test.ts
pnpm --filter @wemd/web build
pnpm --filter @wemd/web lint
```

core build 放在 web 验证之前，因为 `@wemd/core` 包入口指向 dist。若遇到既有无关失败，单独记录，不扩大本任务修改范围。

真实布局验收使用宽图（如 2400×600）、竖图、正方形和透明背景图，在窄屏及桌面检查：横向溢出时 `scrollWidth > clientWidth` 且 scrollLeft 可变化；正文页面不被撑宽；图片长宽比正确、底部不被切掉；无横向溢出时正常显示。另检查纵横切换重置滚动位置、键盘与触屏操作、深浅主题、上传压缩后的显示。

DOM 单元测试无法证明实际滚动或微信兼容。最终交付须明确区分“自动化通过”“浏览器实测通过”和“微信实测通过/待测”。
