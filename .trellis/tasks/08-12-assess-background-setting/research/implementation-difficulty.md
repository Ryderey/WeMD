# WeMD 背景设置产品化难度评估

## 结论

实现**整篇纯色背景的可视化设置**难度较低，建议作为第一期：在主题设计变量中增加一个颜色字段，由现有主题生成器输出 `#wemd { background-color: ... }`，继续复用已经存在的微信纯色背景下沉逻辑。它主要是主题编辑 UI、变量类型、CSS 生成与测试的增量，不需要改 Markdown 语法或复制协议。

“一键插入背景”需要先区分两种产品语义：整篇背景的快捷预设应只是上述字段的快捷入口；局部背景块则应复用引用块或提示块，作为独立的编辑器快捷操作。两者不宜共用一个含义模糊的按钮。整篇图片/纹理背景在微信粘贴链路中不可靠，应推迟。

## 方案对比

| 方案                             | 用户体验                                             | 实现难度                       | 粗略工期                                       | 主要取舍                                                                                 |
| -------------------------------- | ---------------------------------------------------- | ------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A. 整篇纯色背景可视化字段        | 在“全局”设计区选择背景色，所见即所得                 | 低                             | 0.5–1.5 人日                                   | 语义明确，能复用现有链路；首期推荐，但只直接适用于可编辑的自定义可视化主题               |
| B1. 可视化设计器内的一键配色预设 | 提供少量色块，点击后回填同一个背景字段               | 低                             | 在 A 上增加 0.5–1 人日                         | 不增加第二套状态；内置主题仍需先复制成自定义主题                                         |
| B2. 任意当前主题均可一键换底色   | 点击预设后自动派生主题并应用                         | 中                             | 合计约 2.5–4 人日                              | 需要处理内置主题 copy-on-write、派生主题复用、命名与导入导出                             |
| B3. 局部背景块快捷入口           | 工具栏把选区包装为引用或提示块                       | 低至中                         | 1–2 人日                                       | 与整篇设置分开；多行选区、撤销和空选区行为需要测试                                       |
| C. 单篇文章独立背景覆盖          | 背景不属于主题，随文章单独保存                       | 中                             | 3–5 人日                                       | 会扩展 frontmatter、历史快照、打开/保存和 CSS 覆盖链路；首期不建议                       |
| D. 整篇图片背景                  | 上传图片并配置平铺、尺寸和位置                       | 预览中等，公众号交付高且不确定 | 仅预览约 3–5 人日；公众号可靠方案约 7–12+ 人日 | 根背景图目前不会被复制规范化链路下沉，必须先做微信实机兼容验证                           |
| E. 通用背景规则系统              | 可按文章、段落、标题、引用等目标配置纯色、渐变或图片 | 高                             | 5–10+ 人日，另需公众号实机验证                 | 灵活但会引入选择器、优先级、覆盖规则、上传与兼容矩阵；当前需求不足以支撑复杂度，暂不采用 |

以上是基于现有代码结构的工程估算，不包含视觉稿评审、完整回归发布流程或微信客户端差异排查。

## 为什么第一期较简单

可视化设计器已经有全局变量类型和全局配置区，只是目前没有页面背景字段。[`apps/web/src/components/Theme/ThemeDesigner/types.ts:21`](../../../../apps/web/src/components/Theme/ThemeDesigner/types.ts#L21) [`apps/web/src/components/Theme/ThemeDesigner/sections/GlobalSection.tsx:153`](../../../../apps/web/src/components/Theme/ThemeDesigner/sections/GlobalSection.tsx#L153)

主题预览已经以 `#wemd` 包裹正文并注入当前主题 CSS，因此新增纯色字段不需要新增渲染容器。[`apps/web/src/components/Preview/MarkdownPreview.tsx:59`](../../../../apps/web/src/components/Preview/MarkdownPreview.tsx#L59) [`packages/core/src/ThemeProcessor.ts:79`](../../../../packages/core/src/ThemeProcessor.ts#L79)

当前文章 frontmatter 只保存主题 ID 和名称，没有独立背景字段；同时内置主题不可直接编辑，现有界面要求先复制为自定义主题。因此“可视化主题字段”和“任意文章独立一键背景”并不是同一工作量。[`apps/web/src/utils/markdownFileMeta.ts:4`](../../../../apps/web/src/utils/markdownFileMeta.ts#L4) [`apps/web/src/components/Theme/ThemePanelView.tsx:313`](../../../../apps/web/src/components/Theme/ThemePanelView.tsx#L313)

复制到微信时，现有规范化器会读取根节点的非透明背景色、从根节点移除它，再下沉到正文块，以规避微信清洗外层样式；这正好覆盖纯色整篇背景的核心兼容问题。[`apps/web/src/services/wechatCopyNormalizer.ts:380`](../../../../apps/web/src/services/wechatCopyNormalizer.ts#L380) [`apps/web/src/services/wechatCopyNormalizer.ts:438`](../../../../apps/web/src/services/wechatCopyNormalizer.ts#L438)

局部背景也已有可复用的表达：引用块有可视化背景设置，提示块会生成真实的 `section.callout` 容器。因此局部“一键背景块”更适合包装现有能力，而不是发明新的 Markdown 结构。[`apps/web/src/components/Theme/ThemeDesigner/sections/QuoteSection.tsx:69`](../../../../apps/web/src/components/Theme/ThemeDesigner/sections/QuoteSection.tsx#L69) [`packages/core/src/plugins/markdown-it-github-alert.ts:124`](../../../../packages/core/src/plugins/markdown-it-github-alert.ts#L124)

## 推荐的最小实现

1. 在全局设计变量中新增可选的 `pageBackgroundColor`，默认值保持“透明/未设置”，保证旧主题行为不变。
2. 在全局设计面板加入颜色选择器和“清除背景”操作。
3. 在 CSS 生成器中仅在字段有值时输出 `#wemd` 的 `background-color`。
4. 可选地提供 4–8 个“一键配色”预设，但预设只负责回填同一个字段，不保存另一套背景状态。
5. 如果还需要局部强调块，在编辑器工具栏单独增加“背景块”快捷入口，优先插入现有引用或提示块语法；不要把它与整篇背景按钮混合。

首期建议接受一个清晰限制：背景色属于“主题”，使用内置主题时先复制后编辑。若产品必须让用户在任意内置主题上直接点一个色块，则按钮应在内部自动创建或复用派生自定义主题，而不是增加单篇文章覆盖字段。

## 最小影响范围

预计需要修改的核心位置：

- `apps/web/src/components/Theme/ThemeDesigner/types.ts`：增加背景色变量。
- `apps/web/src/components/Theme/ThemeDesigner/sections/GlobalSection.tsx`：增加颜色控件、清除动作和可选预设。
- `apps/web/src/components/Theme/ThemeDesigner/generators/` 下对应生成器：输出根容器背景色。
- 设计器现有状态初始化、序列化或预设定义文件：为新字段提供向后兼容默认值；具体文件应在实现时沿当前数据流确认。
- 若做局部快捷入口，再修改 `apps/web/src/components/Editor/toolbarConfigs.ts` 及其插入处理；现有引用入口位于该文件附近。[`apps/web/src/components/Editor/toolbarConfigs.ts:239`](../../../../apps/web/src/components/Editor/toolbarConfigs.ts#L239)

最小测试集：

- 生成器单元测试：未设置时不输出背景；设置后只输出预期的 `background-color`。
- 设计变量兼容测试：旧主题缺少字段时仍能打开、预览和保存。
- 微信规范化测试：根纯色正确下沉，同时不覆盖引用、渐变等局部显式背景；现有局部渐变保留用例可作为回归基线。[`apps/web/src/__tests__/services/wechatCopyNormalizer.test.ts:218`](../../../../apps/web/src/__tests__/services/wechatCopyNormalizer.test.ts#L218)
- 一条“用户配置 → 生成主题 CSS → 复制到微信 HTML”的集成测试。
- 若做局部按钮，再补选区有无文本时的插入行为测试。

## 迁移与交付风险

- **旧主题兼容**：新字段必须是可选值并以透明为默认；否则加载旧主题后可能无意改变外观。
- **归一化遗漏**：主题面板会把旧变量与默认变量合并，但主题仓库加载或导入可视化主题时也会直接重新生成 CSS；生成器本身仍应为缺失字段提供透明回退，避免旧主题出现 `undefined` 样式。[`apps/web/src/components/Theme/ThemePanel.tsx:123`](../../../../apps/web/src/components/Theme/ThemePanel.tsx#L123) [`apps/web/src/store/themeStore.ts:60`](../../../../apps/web/src/store/themeStore.ts#L60)
- **CSS 优先级**：手写 CSS 主题可能已经声明 `#wemd` 背景。可视化字段只应进入可视化主题的数据流，或明确覆盖顺序，避免保存后静默改写用户 CSS。
- **深色模式**：部分内置主题刻意保持根背景透明。不能给所有主题批量填入默认白色或浅色，否则会破坏当前深色模式策略。[`packages/core/src/themes/academic-paper.ts:2`](../../../../packages/core/src/themes/academic-paper.ts#L2)
- **入口语义**：整篇背景是主题属性，局部背景是内容结构；若合并成一个“一键插入”按钮，撤销、切换主题和跨文章复用都会变得难以解释。
- **复制入口差异**：“复制到微信”会处理主题 CSS，“复制 HTML”只复制裸 HTML，后者不会携带该背景。界面文案或帮助信息需要明确这一点。[`apps/web/src/services/htmlCopyService.ts:81`](../../../../apps/web/src/services/htmlCopyService.ts#L81)
- **图片背景**：根级 `background-image` 当前没有被规范化器下沉，微信可能清洗掉外层样式；还涉及图片托管、防盗链、尺寸、平铺、可读性与客户端差异，不能沿用纯色工期估算。[`apps/web/src/services/wechatCopyNormalizer.ts:382`](../../../../apps/web/src/services/wechatCopyNormalizer.ts#L382)

## 建议路线

第一期做“可视化整篇纯色背景”，并可附带少量预设快捷项；先把它明确为主题属性，不扩展单篇文章元数据。若必须在任意内置主题上一键设置，则采用自动派生主题，整体按 2.5–4 人日估算。若用户真正需要截图中的局部浅色说明块，再把现有引用/提示块包装成独立快捷入口。暂不建设通用背景规则系统，也暂缓整篇图片背景，直到明确公众号端的兼容方案和验收矩阵。

## 公众号实机验证补充

2026-08-12 使用 Chrome DevTools MCP 在微信公众号新建文章编辑器中验证：根背景仅下沉到段落时，段落 margin 区域会露白，形成逐行色块；普通内层 `div` 会被公众号粘贴处理解包，不能承载连续背景；内层 `section` 会被保留，并能连续覆盖多个段落之间的 margin。因此复制规范化应保留最外层清洗兼容处理，同时在其下使用带背景色的 `section` 包裹全文。测试内容已从自动保存的空白草稿正文中清除，未发布。
