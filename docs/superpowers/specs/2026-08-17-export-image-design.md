# WeMD 导出图片（小红书切图）交互设计

- 日期：2026-08-17
- 状态：已确认（brainstorming 产出）
- 关联 mockup：`.superpowers/brainstorm/wemd-bs-20260817193456/content/page-decoration.html`、`export-dialog.html`

## 背景与目标

在顶栏增加「导出图片」功能，将当前主题下的排版结果导出为图片，供小红书等图文平台使用。核心策略：**复用「复制到公众号」管线的离屏渲染容器**（Markdown 解析 → CSS 变量展开 → 内联样式 → Mermaid/表格/公式渲染），导出 = 把同一容器交给截图库输出 PNG/JPEG。

## 已确认决策摘要

| 主题   | 决策                                                                             |
| ------ | -------------------------------------------------------------------------------- |
| 入口   | 统一入口 + 设置对话框                                                            |
| 模式   | 单张长图 / 切图·小红书（对话框内切换）                                           |
| 比例   | 3:4 默认（1080×1440）+ 预设 1:1（1080×1080）、4:3（1200×900）、9:16（1080×1920） |
| 切分   | 按块智能切分（原子块不切断）                                                     |
| 超长块 | 预览红框指页 + 页号警告 + 导出时确认框，确认后等比缩小适配单页                   |
| 装饰   | 页码必有；水印选填（留空=方案 A 仅页码居中；填写=方案 B 左页码右水印）；无封面页 |
| 预览   | 对话框内实时缩略图预览（全部页 + 点击放大高清大图）                              |
| 输出   | Web：ZIP 打包下载（jszip）；Electron：目录选择写盘                               |

## 1. 入口与对话框布局

### 入口

- 桌面顶栏 `apps/web/src/components/Header/Header.tsx`：新增「导出图片」次级按钮，位于「复制 HTML」左侧；隐藏标题栏时的浮动工具栏同步加按钮。
- 移动端 `apps/web/src/components/common/MobileToolbar.tsx`：「更多功能」菜单加「导出图片」项。

### 对话框

- 复用现有 `Modal` 组件（`apps/web/src/components/common/Modal.tsx`），新增 `.modal-export` 宽版类（width: min(1160px, 95vw)）容纳左右布局；不引入 antd（项目中为残留依赖，零使用）。桌面：左设置区 + 右实时预览区；移动端窄屏：上下结构，预览横滑。
- 设置区控件：
  - 导出模式：分段控件「单张长图 / 切图·小红书」；
  - 比例：chips（仅切图模式显示），3:4 默认；
  - 水印文字：输入框（仅切图模式显示，选填，placeholder「@你的账号名」）；
  - 格式：PNG（默认）/ JPEG（quality 0.92）。
- 所有设置持久化到 localStorage（key 前缀 `wemd-export-`），下次打开恢复。
- 主按钮动态文案：「导出 N 张」/「导出长图」；导出中 loading 且禁用防重复；成功 toast「已导出 N 张图」。

## 2. 渲染容器与切分

### 共享渲染容器

- 从 `apps/web/src/services/wechatCopyService.ts` 抽取容器构建逻辑为共享 service（复制与导出共用）：`createMarkdownParser` → `expandCSSVariables` → `processHtml` 内联 → `renderMermaidBlocks` / `renderTableBlocks` / 公式渲染 → `normalizeCopyContainer`。
- 容器宽度按比例：3:4/1:1/9:16 → 1080px；4:3 → 1200px。强制亮色（复用 `applyLightRootVars`（位于 `apps/web/src/services/inlineStyleVarResolver.ts`） + `colorScheme: light`）。
- Mermaid 主题：项目当前无 `data-mermaid-theme` 设置点，渲染器始终回退 default 主题；导出管线与微信复制管线保持等价，不额外处理。

### 按块智能切分

- 原子块 = 内容容器的顶级直接子元素（即 h1–h6、p、pre、`.table-container`、figure/img、ul/ol、blockquote、容器指令块等所有直接子节点，不再向下嵌套切分）。
- 页面视觉参数（1080 宽基准，其他宽度等比缩放）：左右页边距 80px，上边距 96px，下边距 96px（含页脚区）；页脚高 64px，页码/水印字号 24px、浅灰（#999 系）。
- 页可用高度 = 页高 − 上边距 − 下边距；按文档顺序累加原子块实测 `offsetHeight`（含块 margin），放不下一块即换页。

### 超长块兜底

- 单原子块高 > 页可用高度 → 标记超长块；预览区黄色警告条指明页号（「第 2、5 页含超长块，导出时将等比缩小」），对应页缩略图加红框 + 「超长块」角标（hover 显示块文本摘要）。
- 点击导出时弹确认框：「第 N 页含超长块，将等比缩小适配到单页，是否继续？」确认 → 该块整体 `transform: scale()` 缩小居中放入单页；取消 → 回到对话框。
- 图片先按容器宽度等比缩（默认行为），缩后仍超页高再走超长块流程。

## 3. 页脚装饰

- 每页底部固定页脚：水印留空 → 页码「1 / N」居中；填写 → 左页码「1 / N」右水印文本。
- 页脚由导出管线绘制在页容器上，不修改内容 DOM。系统字体，随宽度等比缩放。
- 不做封面页（列为未来扩展，不在本次范围）。

## 4. 实时预览

- 设置变更 debounce 300ms → 重建容器 → 切分 → 低清缩略图（0.25 倍截图）刷新预览；更新期间 loading 态。
- 预览区展示全部页缩略图（可滚动网格，上限 18 页），每张带页码角标；点击缩略图打开 lightbox：按需对该页 scale=1 高清截图（带加载指示，缓存已打开页；离屏页面在预览期间保留供高清截图），大图适配视口（max 90vw/85vh）；顶部标注「共 N 页 · W×H」。
- 单张长图模式：预览单张缩略图；总高超 canvas 上限（约 16384px）时预览区报错并建议切换切图模式。

## 5. 导出输出与保存

- Web：
  - 切图多张 → jszip 打包下载，ZIP 名 `WeMD-{标题}-{yyyyMMdd-HHmm}.zip`（标题取 `editorStore.currentFilePath` 的 basename 去扩展名，无文件时回退 `WeMD`），包内 `01.png`、`02.png`… 按页序；
  - 单张长图 → 直接下载 `WeMD-{标题}-{yyyyMMdd-HHmm}.{png|jpg}`。
- Electron：新增 IPC `export:saveImages`（preload 暴露 `electron.export.saveImages(payload)`，payload `{ files: [{ filename, base64 }], defaultName? }`）；单张走 `showSaveDialog`，多张走 `showOpenDialog` 选目录逐张写盘；返回 `{ success, path? }`，成功后 toast 保存位置。
- 导出结束释放离屏容器与 canvas。

## 6. 平台约束提示（只提示不阻断）

- 切图页数 > 18：预览区警告「小红书单篇最多 18 图，当前 N 张，建议拆分多篇」。
- 单文件预估 > 32MB：建议切换 JPEG。

## 7. 边缘情况与错误处理

- 空内容：导出按钮禁用，预览空态。
- 远程图片 CORS：截图前复用 `wechatPreviewCache.ts` 的 blob→objectURL 模式将 `<img>` 转同源；直连 fetch 失败（图床无 CORS 头）时回退 Nest 服务 `GET /api/proxy/image?url=` 服务端抓取（服务端不受 CORS 限制，undici ProxyAgent 支持代理环境变量出网），候选地址 `127.0.0.1:14000`（桌面内嵌）/ `localhost:4000`（开发默认），探测结果缓存；个别转换失败不阻断，预览阶段 toast 警告「N 张图片跨域获取失败，导出图中将留白」。
- Mermaid/公式异步渲染：导出前 await 现有渲染管线完成。
- 暗色模式：强制亮色容器（见 §2）。
- 截图库失败：toast 报错「导出失败: {msg}」，不残留 loading。

## 8. 依赖与代码改动清单

- 新增依赖：`modern-screenshot`（截图，现代 CSS 兼容优于 html2canvas）、`jszip`（Web 打包）、`undici`（server 代理出网，ProxyAgent）。
- 新增文件（建议）：
  - `apps/web/src/services/export/renderContainer.ts`（共享容器构建，wechatCopyService 重构调用它）
  - `apps/web/src/services/export/paginator.ts`（切分纯函数）
  - `apps/web/src/services/export/footerRenderer.ts`
  - `apps/web/src/services/export/exportService.ts`（截图/ZIP/IPC 编排）
  - `apps/web/src/components/Export/ExportDialog.tsx`
  - `apps/server/src/proxy/proxy.controller.ts` + `proxy.module.ts`（图片代理端点）
- 修改：`Header.tsx`、`MobileToolbar.tsx`、`wechatCopyService.ts`（抽取重构）、`apps/electron/src/main.ts` + `preload.ts`（新 IPC）、`.gitignore`（增加 `.superpowers/`，brainstorm companion 会话数据不入库）。

## 9. 测试计划

- 单元测试（vitest，`apps/web/src/__tests__/`）：
  - `paginator` 纯函数：块高数组→分页结果、超长块标记；
  - 命名规则（ZIP/文件名）、页脚 DOM 生成（A/B 两态）；
  - jszip 结构（mock）。
- 组件测试：Header/MobileToolbar 新按钮渲染与回调；ExportDialog 设置 localStorage 持久化；截图库在 jsdom 中 mock。
- 手动验证清单（Web + Electron）：长文、代码块、宽表格、Mermaid、公式、远程图、暗色模式、超长代码块确认流程、>18 页警告。

## 10. 交付分期

- 默认一次性交付完整设计（评估约 4 人日）。
- 可选拆分（排期紧张时）：P1 = 对话框 + 单张长图导出；P2 = 切图/实时预览/ZIP/Electron 增强。
