# 滚动长图：改为多图上传并逐张控体积

日期：2026-09-19。状态：已按本方案实现；自动化与浏览器实测通过，微信端手测待进行（见第 10 节）。

## 0. 本轮已确认的产品决策

以下三项由用户在方案阶段直接指定，实现时不得自行扩大或反转：

1. **不做客户端自动切片**。不引入 canvas 像素处理，不把一张超长图拆成 N 段。用户自己决定给几张图。
2. **内部不做压缩处理**。滚动长图链路不再调用自动压缩，只在提交上传前校验单张图片的体积上限；超限就报错并让用户自行处理，保持已上传内容与原图逐像素一致。
3. **纵向与横向都支持多图**。
4. **批量上传部分失败时整体中止**：不插入任何 Markdown，保留已成功的 URL，只重试失败项。

## 1. 问题与结论

### 1.1 现状为什么"文件太大"

当前一张滚动长图必须作为单个文件上传，链路上有三道硬墙：

| 位置                                                                                                                | 约束                                                               | 超长图的后果                                                                             |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `apps/web/src/services/image/imageUploadFlow.ts:48-60`                                                              | 图床类型为 `wechat` 时**完全跳过** `prepareImageForUpload`         | 原图直接送上传器                                                                         |
| `apps/web/src/services/image/uploaders/WechatUploader.ts:3,81-83` + `apps/server/src/wechat-image.service.ts:14,33` | 必须 < 1 MiB，仅 JPG/PNG                                           | 公众号图床下 1200×6000 长图**必然失败**，报"必须小于 1 MiB"                              |
| `apps/web/src/services/image/ImageUploader.ts:87-90`                                                                | 非微信图床统一 10 MB                                               | 超长图可能通过，但见下一条                                                               |
| `apps/web/src/services/image/autoCompressImage.ts:26-27,64`                                                         | 输入上限 40 MiB / 3600 万像素，压缩后目标 2 MiB，缩放因子最低 0.42 | 1080×30000（3240 万像素）贴着像素上限；为压到 2 MiB 整张被缩到约 45%，正文文字糊到不可读 |

即：要么直接失败，要么以不可接受的降质换通过。两者都不可用。

多图方案把"体积"从单文件问题变成总量问题：N 张各自达标的小图，总信息量远超任何单个允许的文件，且每张都不需要降质。

### 1.2 结论

在现有滚动长图里把入口从"单文件"改为"1..N 文件"，逐张校验体积、逐张上传，全部成功后在**同一个滚动视口内**按顺序渲染 N 张图片，仍是一段连续可滚内容。Markdown 语法只扩展容器内容（允许多张图），头部参数不变，旧文档零迁移。

## 2. 已核对的现状

| 文件                                                                          | 现有职责与要点                                                                                                                                                                                |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/components/Editor/Toolbar.tsx:41-47,181-205,483-502`            | 单文件 `files?.[0]`；`scrollImageFile: File \| null` + 单个 object URL；`useEffect` 在 URL 变化时 revoke；弹窗条件挂载                                                                        |
| `apps/web/src/components/Editor/ScrollImageDialog.tsx`                        | props 为 `file`/`previewUrl`；高度 160–800 默认 320；方向单选；提交时 `uploadEditorImage(file, {compressionOptions:{maxSizeBytes:2MB}})`；生成 `::: scroll-image <h>[ horizontal]` + 单行图片 |
| `apps/web/src/components/Editor/ScrollImageDialog.css`                        | 预览区纵向 overflow、图片宽 100%，`.is-horizontal` 变体                                                                                                                                       |
| `packages/core/src/plugins/markdown-it-scroll-image.ts:12-19,58-78,112-119`   | `getSingleImage` 要求容器内**恰好** 3 个 token 且 inline 只有 1 个 image 子节点；meta 为单个 `{src,alt,title}`；渲染输出单个 `<img>`                                                          |
| `apps/web/src/components/Preview/MarkdownPreview.css:74-88`                   | `#wemd img` 强制 `max-width:100%!important; height:auto!important; margin:10px auto`；`:83-88` 为横向模式覆盖                                                                                 |
| `packages/core/src/plugins/markdown-it-imageflow.ts`                          | 已有的多图横向滑动（`<![a](u),![b](u)>`，默认上限 10 张，超限降级），卡片式 80% 宽 + `max-height:300px`，与滚动长图布局语义不同                                                               |
| `apps/web/src/services/image/wechatCopyNormalizer.ts:440-471,570-597,604-620` | 复制链路不改写 `<img>`、不计数；`trimCopyVerticalSpacing` 把所有 `img` 上下 margin 归零；序列化只展平根节点，嵌套 section 原样保留                                                            |
| `docs/plans/2026-09-19-horizontal-scroll-image.md:15`                         | 横向模式微信端**仍为待测**，不能视为已兼容                                                                                                                                                    |

关联缺陷（不在本轮范围，建议单列任务，需另行放行）：

1. `imageUploadFlow.ts:48-60` 让 `wechat` 图床绕过一切压缩，而上传器要求 < 1 MiB，因此**普通图片上传**在公众号图床下同样对 ≥1 MiB 图片直接失败；同时弹窗侧常量为 2 MiB（`autoCompressImage.ts:17`），两者本就不一致。本轮通过"滚动长图不再依赖压缩、改为显式校验"绕开这个矛盾，但不修复它。
2. 既然上游按 1,000,000 字节判定，`WechatUploader.ts:3` 与 `wechat-image.service.ts:14` 的 `1024 * 1024` 就都偏大，形成 1,000,000–1,048,575 的假通过区间（见 4.2.1）。建议把两处常量统一改为 `1_000_000`（保持 `>=` 即拒的严格小于语义），让服务端直接返回本地可懂的 413，而不是把图转给微信拿一个 `40009`。**已按用户指示单列为独立任务**：`.trellis/tasks/09-19-fix-wechat-image-decimal-limit/prd.md`（P2，package `server`），不并入本轮前端改动；本轮门槛 950,000 独立生效，不依赖那条修复。

## 3. 用户交互

### 3.1 选择与列表

- 工具栏滚动长图入口的隐藏 input 增加 `multiple`（`Toolbar.tsx:483-490`）；一次选择 1..N 张，非 `image/*` 项过滤并提示。
- 弹窗内以列表展示已选图片，每项包含：序号、缩略图（object URL）、文件名、体积、状态（待上传 / 上传中 / 已上传 / 失败原因）。
- 每项操作：移除、上移、下移。追加图片用弹窗内"继续添加"按钮再次打开同一个 input（`multiple` 保留，选完后**追加**而非替换；按 `name + size + lastModified` 去重）。不做拖拽排序。
- 数量上限 20 张：达到上限后禁用"继续添加"并说明原因。上限值在弹窗与核心插件共用同一常量口径（见 5.4）。
- 底部实时显示合计体积，让用户对文章重量有预期。

### 3.2 预览

预览区按当前方向把 N 张图连排：纵向自上而下、横向自左向右，都用与插件输出一致的尺寸策略（见 5.3），读者滑多远就看到多远。切方向时保留高度与已选列表，滚动位置归零（沿用 `ScrollImageDialog.tsx:73-79` 的处理）。

预览必须与导出结果一致：本地预览要给滚动视口内的图片显式去掉 `#wemd img` 的 `margin:10px auto`（`MarkdownPreview.css:75-80`），否则预览有 10px 缝、复制进微信后 margin 被 `trimCopyVerticalSpacing` 归零，两边不一致。

### 3.3 高度与方向

沿用现有控件与语义：160–800px、预设 240/320/420、方向单选、默认纵向。高度含义不变——视口高度，不是内容总高。多图内容总高由 N 张图的自然高度累加，弹窗在预览区下方补一行"内容总高约 N px / N 张"的只读提示（用图片 `naturalWidth/naturalHeight` 在 `<img>` 加载完成事件里读取，**不做任何 canvas 解码或重绘**）。

### 3.4 校验与提交

- 提交前逐张校验体积上限（见 4.2，门槛值随图床而定，公众号图床为 950,000 字节）。任何一张超限：该项标红并写明"<文件名>：<带千分位的字节数> 字节，超过 <门槛字节数> 字节上限，请先自行压缩或拆分后重选"，提交按钮禁用，不自动压缩、不自动剔除。
- 格式：图床为 `wechat` 时只放行 JPG/PNG，其他格式在选择时就拒绝并说明原因（与 `WechatUploader.validateFile` 的运行时约束对齐，把失败提前到本地）。
- 上传中禁止改列表、方向、高度，禁止取消（沿用现状）；失败后允许"仅重试失败项"或取消。
- 上传过程不产生"半块"内容：只有全部 N 张成功才调用 `onInsert`。

## 4. 上传与体积控量

### 4.1 流程

1. 逐张（或并发度 2 的小循环）调用现有 `uploadEditorImage`，**不传 `compressionOptions`**，即 `prepareImageForUpload` 因 `maxSizeBytes` 缺省而只对 >2 MiB 生效——为避免这条隐式路径，本轮改为：给 `uploadEditorImage` 传入的选项不动，而是在弹窗侧改为**先校验、后上传**，并把 `ScrollImageDialog.tsx:98-106` 的压缩选项移除，使该链路不再触发降质重编码。

   注：`prepareImageForUpload` 的入口判断是 `file.size <= maxSizeBytes` 直接原样返回（`autoCompressImage.ts:83-90`）。因此"不传压缩选项"并不等于"不压缩"——默认目标仍是 2 MiB。实现时必须显式跳过压缩：要么给 `uploadEditorImage` 增加一个"原图上传"意图开关，要么在滚动长图链路直接走 `ImageHostManager`。**推荐前者**：在 `UploadEditorImageOptions` 增加 `skipCompression: true`，语义集中在 `imageUploadFlow.ts:48-60` 现有分支旁，普通图片链路不受影响。

2. 每张成功即把 URL 与状态写进该项，失败记录 `index + message`。
3. 全部成功后按列表顺序生成 Markdown 并插入；有任何失败则不插入，Toast 汇总"第 k 张失败：<原因>"，列表保留。
4. 进度：优先在弹窗内渲染 `已上传 m/N`，不用 Toast 反复改写（`react-hot-toast` 的 loading 只用于最终结果，避免与并发上传互相打断）。

### 4.2 体积上限从哪来

新增单一来源的解析函数（建议放在 `apps/web/src/services/image/`，命名由实现方按现有风格定），输入当前图床配置类型，输出 `{ limitBytes, strictLessThan, allowedTypes }`：

| 图床                                      | 真实上限                          | 外层硬上限（代码现值）                 | 客户端门槛（本轮新增）      | 依据                                                                                                                            |
| ----------------------------------------- | --------------------------------- | -------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `wechat`                                  | **1,000,000 字节（十进制 1 MB）** | 1,048,576 字节，`>=` 即拒              | **950,000 字节 ≈ 0.91 MiB** | 上游口径由用户确认；代码现值见 `WechatUploader.ts:3,81`、`wechat-image.controller.ts:29-34`、`wechat-image.service.ts:14,38-40` |
| 自建服务端（`official` 指向 apps/server） | 未实测                            | 10 MB（客户端）/ 5 MB（服务端 multer） | **4,500,000 字节**          | `ImageUploader.ts:87-90`、`apps/server/src/upload/upload.controller.ts:56-58`                                                   |
| `api.wemd.app`、qiniu/aliyun/tencent/s3   | 未实测                            | 10 MB                                  | **9,000,000 字节**          | `ImageUploader.ts:87-90`                                                                                                        |

规则：**门槛 = 该图床可确证的最严上限 × 余量系数**。余量系数按口径确定程度分档——上限口径已实测确认的取 0.95（只需覆盖 multipart 封装与代理层判定口径差异）；上限只是文档措辞或未经实测的取 0.90（还要覆盖单位歧义）。外层硬上限代码本轮一律不动，门槛只是更靠内的一层拦截；被门槛拦下时提示必须打具体字节数。

### 4.2.1 为什么微信门槛取 950,000 而不是贴近 1,048,576

1. **上游是十进制口径**：微信 `uploadimg` 的"小于 1M"按 **1,000,000 字节** 判定（用户确认）。我们服务端与客户端上传器都按 `1024 * 1024 = 1,048,576` 实现，因此 **1,000,000–1,048,575 这一段是 48,576 字节的假通过区间**：本地放行、服务端 multer 放行，最后拿到微信 `40009 图片尺寸/大小超限`，用户在 WeMD 侧只看到一句上游错误。结论是微信图床的天花板必须按 1,000,000 算，"接近 1 MiB"要改成"接近 1,000,000 字节"。
2. **multipart 封装与代理层不同界**：multer 的 `fileSize` 只数文件字节，而 `nginx.conf` 未设 `client_max_body_size`（仓库内全仓无此指令），走默认 `1m` 即 1,048,576，且数的是**整个请求体**——含 boundary、`Content-Disposition`、`Content-Type` 等约数百字节封装开销。一张正好逼近 1,048,576 字节的图会先被 nginx 以 413 拒掉，根本到不了 `wechat-image.service.ts` 的校验。留 50,000 字节余量足以覆盖这部分开销。
3. **Windows 显示误差**：资源管理器"大小"列写"MB"但值是 MiB，列表视图还**向上取整到整 MB**（1,000,000 与 1,048,576 都显示"1 MB"，1,048,577 起显示"2 MB"）。用户拿"1 MB"去对照极限值必然反复试错，只能由我们把门槛画在明显低于两条口径的位置，并在报错里直接给字节数。

950,000 字节比 1,000,000 低 5%、比 1,048,576 低 9.4%，比方案初稿的 921 KiB 多留约 5% 画质空间——本轮已经不做自动压缩，每 1% 余量都直接换算成单图清晰度，所以口径确认后余量应当收紧，而非一律按 10%。

配套文案要求：错误与提示里**必须打字节数**，不能只写"1 MB"，例如"截图\_03.png：1,020,233 字节，超过 950,000 字节上限，请先自行压缩或拆分后重选"。合计体积同样用字节或固定两位小数的 MiB 显示，避免与 Windows 的取整显示混淆。

**上限作用域是"单张图 / 单次请求"，不是已选图片的合计**。服务端 `wechat-image.controller.ts:29-34` 的 multer `fileSize` 与 `wechat-image.service.ts:38-40` 的 `validateFile` 都只针对当前一个文件，`WechatUploader.upload` 每次只 append 一个 `file` 字段，N 张图即 N 次独立 POST；微信官方 `< 1 MB` 同样是单次 `media` 字段。链路上不存在任何累加限制，合计体积只做展示提示，不做拦截。

补充说明要写进错误文案与文档：`official` 图床的 `serverUrl` 可指向自建 apps/server（默认 `https://api.wemd.app`，见 `OfficialUploader.ts:11-20`），两种后端的入站上限不同（自建 5 MB、Worker 未实测），因此门槛按可确证的 5 MB 收，宁可偏保守；若实测确认 Worker 更宽，再按 host 分流放宽。

### 4.3 多图带来的新成本（必须如实记录）

- 每次插入产生 N 个上传对象。现有图床**没有删除接口**（`wechat-validation.md:58-62` 已记录），中止或失败留下的孤儿 URL 无法回收。文案与实现都不应承诺"取消即回收"。
- 同一张图重复提交会重复上传（不去重、不做内容哈希缓存）。
- 服务端 `/api/wechat-images` 无速率限制（仅 30 秒 token 刷新节流），N 张连发对上游微信 API 的实际限流行为**未知**，需实测记录（见 8.3）。因此并发度默认取 1（串行），只在实测确认无 45009/45011 类限流后再考虑提高。

## 5. Markdown 合约与渲染

### 5.1 语法

头部参数**完全不变**（`scroll-image` / `<h>` / `<h> horizontal|vertical`，规则见 `docs/plans/2026-09-19-horizontal-scroll-image.md` 第 4 节）。只放宽容器内容：从"恰好一张图片"改为"1..N 张图片、不含任何文字"。

```markdown
::: scroll-image 320
![第一段](https://host/a.jpg)

![第二段](https://host/b.jpg)

![第三段](https://host/c.jpg)
:::
```

工具栏生成时：每张图独占一段（空行分隔），URL 沿用现有 `<...>` 包裹与转义逻辑（`ScrollImageDialog.tsx:45-48` 抽成逐图调用），alt 取各自文件名（`:40-44` 的清洗规则不变）。

### 5.2 解析规则

`getSingleImage`（`markdown-it-scroll-image.ts:58-78`）替换为"收集容器内全部图片"：

- 允许的内部 token：包裹纯图片段落的 `paragraph_open/close`（或现有 `figure_*`，以实际 token 类型为准）、`inline`，且 `inline.children` 只含 `image` 与 `softbreak`/`hardbreak`。
- 出现任何文字 `text` 子节点、非图片内容 → 整块降级为普通容器，正文不丢（与现有非法参数回退一致）。
- 图片顺序 = 文档顺序；渲染时不重排。
- 因此"每张一行"和"每张之间空行"两种手写写法都接受，避免用户因换行习惯被静默降级。
- 超过 20 张 → 按非法处理，降级为普通容器；弹窗侧本就先拦住，这只影响手写文档。

实现后果（需在 PR 描述中点名）：`ScrollImageMeta` 的 `src/alt/title` 三个字段变成 `images: Array<{src, alt, title?}>`，`:156` 的 splice 与 `:112-119` 的单图渲染改为循环。这是内部类型，不对外导出。

### 5.3 渲染结构

保持已验证的纵向 DOM，横向按需加一层轨道：

| 模式         | DOM                                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 纵向（1..N） | `section.scroll-image > section.scroll-image-viewport > img.scroll-image-img × N > p.scroll-image-caption`                                                      |
| 横向（1..N） | `section.scroll-image.scroll-image-horizontal > section.scroll-image-viewport > section.scroll-image-track > img.scroll-image-img × N > p.scroll-image-caption` |

- 纵向不需要轨道：图片 `display:block;width:100%;height:auto;margin:0;border:0` 自然累加高度，与 `wechat-validation.md:41-49` 已验证保留的声明完全一致，单图纵向的输出 HTML 逐字节不变。
- 横向必须加轨道承载并排：`display:inline-block` 或 `flex` + `width:max-content;flex-wrap:nowrap`，图片 `height:100%;width:auto;max-width:none;flex-shrink:0`。
- 关键尺寸、overflow、touch-action 一律内联（`wechat-copy-pitfalls` 要求），不能只依赖 class。
- 单图横向的 HTML 因加入轨道而变化；该分支微信端本来就待测（`2026-09-19-horizontal-scroll-image.md:15`），本轮一并实测，不作为回归。
- 提示文案与 `aria-label` 仍按方向给一条（"↕ 上下滑动查看完整图片"），不按图片数量变化。
- 图片之间无间距、无缝隙背景色；不做"图片间留白"开关。

### 5.4 已知取舍

- 各图宽度不同 → 纵向按容器宽铺满，每张渲染高度与原图比例一致，但相邻图内容尺度会突变。首版不做对齐选项、不做居中按原始宽度展示。
- N 张图会被一次性全部加载（无 `loading="lazy"`；微信侧对 lazy 属性的保留行为未验证）。重量靠"数量上限 + 单图上限"控制，不靠懒加载。
- 旧版 WeMD 打开多图块：`getSingleImage` 返回 null → 降级普通容器，图片仍逐张显示但不滚动。可读、不丢内容，属可接受降级。

## 6. 预览样式覆盖

横向多图要在本地预览成立，必须扩展 `MarkdownPreview.css:83-88` 的选择器到新轨道：`#wemd .scroll-image-horizontal .scroll-image-track`（`width:max-content!important`、`display:inline-block!important`/flex）与 `.scroll-image-track .scroll-image-img`（保持现有 `height:100%!important` 等）。同时补 `#wemd .scroll-image-viewport img { margin:0 !important; }`，抵消 `:79` 的 `margin:10px auto`。

主题 CSS 在复制时会内联到元素上，可能与组件级 important 冲突。先按现状验证真实结果；确有覆盖才在横向组件范围内加最小修正，不全局放宽 `#wemd img`，不改所有主题。滚动长图不进主题（关键属性已内联），沿用 imageflow 之外的既有分工。

## 7. 实施顺序与文件边界

1. **核心插件**：`packages/core/src/plugins/markdown-it-scroll-image.ts` 改为收集 N 图 + 横向轨道 + 数量上限；同步扩 `packages/core/src/__tests__/MarkdownParser.test.ts`。先跑 `pnpm --filter @wemd/core build`（web 依赖 dist）。
2. **上传链路**：`imageUploadFlow.ts` 增加跳过压缩的显式开关 + 抽出体积上限解析；`ImageUploader.ts:87` 常量导出复用。不新增图床 provider，不改服务端。
3. **弹窗与工具栏**：`Toolbar.tsx`（multiple、File 数组与 object URL 生命周期）、`ScrollImageDialog.tsx/.css`（列表、增删排序、逐张状态、串行上传、仅重试失败项、合计体积）、`MarkdownPreview.css`、`SyntaxHelpPopover.tsx:18-19`（补多图语法说明与示例）。
4. **测试**：扩 `apps/web/src/__tests__/components/ToolbarScrollImage.test.tsx`；把 `apps/web/src/__tests__/services/wechatCopyCssIntegration.test.ts` 的复制断言扩到 N 图（含 `:747` 的 `toHaveLength(1)`）。
5. **实测**：浏览器布局 + 微信三阶段（见 8.3），记录证据与未覆盖项。

单文件单 agent 完成，不要多人同时改插件与弹窗。改动前阅读 `.trellis/spec/web/frontend/index.md` 列出的 `wechat-copy-pitfalls.md`、`css-design.md`、`react-pitfalls.md` 与 `.trellis/spec/core/frontend/index.md`。

## 8. 验收

### 8.1 契约变更（有意为之，需在 PR 里明确）

- `packages/core/src/__tests__/MarkdownParser.test.ts:91-98`：两图块"必须降级为 `<div>`"这一断言反转为"渲染为滚动多图"。
- `wechatCopyCssIntegration.test.ts:747`：横向"视口内恰好 1 张 img"断言改为按输入数量断言顺序与数量。
- 单图纵向输出 HTML 逐字节不变（回归基准）；单图横向因新轨道而变化。
- 滚动长图不再自动压缩：`ScrollImageDialog.tsx:111-115` 的"已自动压缩 X -> Y"文案随之删除。

### 8.2 自动化最少覆盖

- 旧语法全部回归；单图纵向快照不变；imageflow 不受影响。
- 多图纵向/横向：N=1/2/20 渲染数量与顺序；21 张降级；图文混排降级；alt/title/URL 逐图转义；负数与越界高度钳制保持。
- 弹窗：`multiple` 生效、多选入列表、非图片过滤、追加/移除/上下移动、上限 20 拦截、合计体积、超限项禁用提交且无压缩调用（断言 `prepareImageForUpload` 未被调用或 `skipCompression` 为真）。
- 上传：串行顺序、`已上传 m/N`、部分失败不插入且保留已成功 URL、"仅重试失败项"只重传失败下标、上传中禁改禁取消、取消释放全部 object URL。
- 体积门槛边界（每张图独立判定，无合计逻辑）：`949,999` 放行；`950,000` 按 `>` 还是 `>=` 语义必须与实现常量一致并被断言钉住；`1,000,000`、`1,048,576` 均被本地拦下且**不发请求**；同批中只有 1 张超限时仅该图标红、其余项状态不受影响；非微信图床分别断言 4,500,000 与 9,000,000 两个门槛。
- 复制链路：解析 → `processHtml` → `resolveInlineStyleVariablesForCopy` → `normalizeCopyContainer` → `serializeWechatCopyHtml` 后重新解析，断言 N 张图顺序、视口固定高度与 overflow、每张图片尺寸声明、提示文案与数量；基础/designer/sunset 三主题各一遍；序列化幂等。

命令（实现后执行，本轮未运行）：

```powershell
pnpm --filter @wemd/core test --run src/__tests__/MarkdownParser.test.ts
pnpm --filter @wemd/core build
pnpm --filter @wemd/web test --run src/__tests__/components/ToolbarScrollImage.test.tsx src/__tests__/services/wechatCopyCssIntegration.test.ts
pnpm --filter @wemd/web build
pnpm --filter @wemd/web lint
```

### 8.3 真实端实测（必须单独记录"自动化通过 / 浏览器实测通过 / 微信实测通过或待测"）

- 浏览器：3–5 张不同宽高截图纵向；宽窄不一致的图；横向 3 张轨道 `scrollWidth > clientWidth` 且 `scrollLeft` 可变化、正文页面不被撑宽；深色主题；预览与复制结果逐像素对比无 10px 缝。
- 微信端（真实 wemd 复制按钮 + `Ctrl+V`，禁止直接注入 HTML）：多图纵向、多图横向各自走完**粘贴 → 保存重开 → 手机阅读**三阶段，检查每张图片 URL 被改写到微信 CDN、N 张齐全且顺序一致、横向轨道的 `width:max-content`/`overflow-x` 是否存活。
- 体积边界（把 4.2.1 的假设变成证据）：直连 `/api/wechat-images` 依次上传 949,000 / 999,000 / 1,001,000 / 1,048,000 字节四张图，记录各自 HTTP 状态与微信 `errcode`。预期前两者成功、第三者拿 `40009`（证明十进制口径）、第四者被 nginx 或 multer 拦下；若第四者反而成功，说明链路上限判定与 4.2.1 的推断不符，须回来修订门槛。把这组数据追加到 `.trellis/tasks/archive` 下对应 research 或新建一份实测记录。
- 连发 5–10 张到 `/api/wechat-images`，记录是否出现上游限流/超时，据此决定并发度是否可 > 1。
- 测试草稿测完删除；不发布、不发预览。

## 9. 回滚

删除多图相关分支即回到单图行为：核心插件把收集结果限长为 1、`Toolbar.tsx` 去掉 `multiple`、弹窗退回单文件 props、`imageUploadFlow` 的 `skipCompression` 开关闲置或移除。Markdown 无数据迁移——已写出的多图块在旧版本按 5.4 的降级路径显示为普通图片列表，内容不丢。

## 10. 实现与验证记录（2026-09-19 实现 agent 追加）

状态：**自动化通过、浏览器实测通过、微信端待测**。按第 7 节顺序单文件实现，未派生其他 agent，未改服务端、未新增图床 provider。

### 10.1 实现范围

| 文件                                                             | 变更                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/plugins/markdown-it-scroll-image.ts`          | `getSingleImage` → `collectImages`（接受 `figure_*` 与 `paragraph_open/close` 两种包裹、忽略换行与纯空白文本、1..20 张）；meta 改为 `images[]`；横向新增 `section.scroll-image-track` 轨道并改图片为 `inline-block`；导出 `SCROLL_IMAGE_MAX_IMAGES` |
| `packages/core/src/index.ts`                                     | 导出 `SCROLL_IMAGE_MAX_IMAGES` 供弹窗与插件共用同一口径                                                                                                                                                                                             |
| `apps/web/src/services/image/imageUploadLimits.ts`（新增）       | 单一来源的体积门槛解析：wechat `950,000`（`>=` 即拒）、official `4,500,000`、其余 `9,000,000`；同时给出 `allowedTypes` 与字节千分位格式化                                                                                                           |
| `apps/web/src/services/image/imageUploadFlow.ts`                 | `UploadEditorImageOptions` 增加 `skipCompression`，与既有 `wechat` 分支并列                                                                                                                                                                         |
| `apps/web/src/services/image/ImageUploader.ts`                   | 导出 `NON_WECHAT_MAX_UPLOAD_BYTES` 复用既有 10 MB 常量                                                                                                                                                                                              |
| `apps/web/src/components/Editor/scrollImageSelection.ts`（新增） | `ScrollImageSelection` 类型与 `scrollImageFileKey`（`name:size:lastModified` 去重键），独立于组件以满足 fast-refresh 规则                                                                                                                           |
| `apps/web/src/components/Editor/Toolbar.tsx`                     | 隐藏 input 加 `multiple`；`File[]` + object URL 数组；追加/去重/上限/格式过滤；逐项移除与上下移动；释放全部 object URL                                                                                                                              |
| `apps/web/src/components/Editor/ScrollImageDialog.tsx`           | 改为 `items` props；列表（序号/缩略图/文件名/体积/状态）、增删排序、串行上传与 `已上传 m/N`、仅重试失败项、合计体积、超限标红与逐张文案、方向感知预览与总高/总宽提示；删除压缩选项与"已自动压缩"文案                                                |
| `apps/web/src/components/Preview/MarkdownPreview.css`            | 轨道选择器 `#wemd .scroll-image-horizontal .scroll-image-track` 与 `#wemd .scroll-image-viewport img { margin: 0 !important }`                                                                                                                      |
| `apps/web/src/components/Editor/SyntaxHelpPopover.tsx`           | 两条语法说明补充"容器内可放 1–20 张"                                                                                                                                                                                                                |

### 10.2 契约变更（与 8.1 一致）

- 原"两图块必须降级为 `<div>`"断言已反转为渲染为滚动多图；同时把"同行空格分隔的多图"从降级用例改为合法用例（方案 5.2 要求"每张一行"和"每张之间空行"都接受，同行写法按同一规则一并接受）。
- 横向单图因新增轨道，输出 HTML 变化；纵向单图新增逐字节基准断言，锁定"单图纵向输出不变"。
- 滚动长图链路不再调用压缩：弹窗断言 `skipCompression: true` 且 `compressionOptions` 为 `undefined`。
- 弹窗上传按钮文案在"失败可重试"与"全部已上传可插入"两态分别为"重试失败项"与"插入"；后者覆盖"部分失败后移除失败项"的收尾路径（移除后无需重复上传即可插入）。

### 10.3 自动化结果

- `@wemd/core`：85/85 通过（MarkdownParser 55 项，含 N=1/2/3/20/21、两种包裹形式等价、图文混排降级、转义、钳制、imageflow 不受影响、单图纵向逐字节基准）。
- `@wemd/web`：391/391 通过；`tsc -b` 0 错误；`pnpm build` 成功；改动文件 ESLint 0 错误（全仓 18 条既有 warning 未新增）。
- 新增/扩展用例覆盖：`multiple` 多选、追加与去重、格式过滤、20 张上限与禁用"继续添加"、移除与上下移动并释放地址、取消释放全部地址、串行顺序与插入语法、横向轨道、方向切换重置滚动、上传中全控件禁用、部分失败不插入 + 仅重试失败项、失败项移除后直接插入、`949,999` 放行 / `950,000` 拒绝、`1,000,000` 与 `1,048,576` 本地拦截且不发请求、非微信图床 `4,500,000` 与 `9,000,000` 边界、复制管线 N 图顺序与轨道契约（designer/basic/sunset 三主题）。

### 10.4 浏览器实测（Chrome，dev server）

用运行时生成的 1200×300 / 600×600 / 600×1800 三图写入 `::: scroll-image 320` 与 `::: scroll-image 320 horizontal` 两个块：

- 纵向：视口 `clientHeight=320`、`scrollHeight=1445`，`scrollTop` 可置 500；三图宽度均 340px，高度按原比例 85/340/1020，`margin` 全为 `0px`（无 10px 缝）。
- 横向：轨道宽 `1674.66px` > 视口 `clientWidth=346`，`scrollLeft` 可置 400；图片高 314px（视口 320 减边框），宽 1256/314/105，比例与原图一致；`scrollHeight == clientHeight` 证明无纵向裁切。
- 正文 `body.scrollWidth == clientWidth == 825`，横向轨道未撑宽页面；深色主题（`previewBg=rgb(15,17,19)`）下两个块仍可滚动。
- 弹窗：多选 3 张后列表显示 `已选图片（3/20）`、合计 `0.04 MiB（46,275 字节）`、纵向提示"内容总高约 786 px · 3 张"；切横向后出现轨道、`scrollWidth 1664 > clientWidth 191` 且 `scrollLeft` 可置 60，提示变为"内容总宽约 1,707 px · 3 张"；上移与移除后列表与合计即时更新。
- 环境限制：截图 API 不可用（in-app browser 未提供可见 viewport），故以 DOM/CSSOM 量化数据为证据；`width:max-content`、`white-space:nowrap`、`touch-action` 在 jsdom 中会被样式重写丢弃，已在字符串阶段断言并在真实浏览器确认存在。

### 10.5 尚未验证（不视为通过）

- 微信端三阶段（粘贴 → 保存重开 → 手机阅读）的多图纵向与横向表现：**待测**，需要用户已登录的公众号编辑器会话。
- 4.2.1 的体积口径证据（直连 `/api/wechat-images` 的 949,000 / 999,000 / 1,001,000 / 1,048,000 四张实测）与 5–10 张连发限流观测：**未执行**；本地门槛 `950,000` 已独立生效，不依赖这两组数据。
- 弹窗在 375px 窄屏下的列表布局仅做样式适配，未做真实窄屏实测。

### 10.6 官方图床多图端到端：受环境阻断

用 `C:\Users\Ryder\Pictures` 下三张真实图（621,183 / 549,275 / 638,319 字节，合计 1.72 MiB）对 `https://api.wemd.app` 走完整链路：

- 应用侧全部正确：三张入列（`已选图片（3/20）`、`合计 1.72 MiB（1,808,777 字节）`、`内容总高约 769 px · 3 张`），提交后进入串行上传（`已上传 0/3`、按钮"正在上传"、全控件禁用），失败后逐项归因、按钮转为"重试失败项"且已选列表与设置全部保留。
- 失败点在浏览器→图床的传输层，与应用代码无关：其一，图床 CORS 仅放行 `https://wemd.app`、`http://localhost:5173`、`http://localhost:3000`，dev server 换到 3000 后 CORS 报错消失；其二，跨域上传较大 multipart 时浏览器侧连接被重置（`net::ERR_CONNECTION_CLOSED`），同机 `curl` 直传同一文件返回 200 与真实 URL，浏览器内 8 字节探针与空表单 POST 亦分别得到 200 / 400。
- 结论：本轮不追加代码改动；该图床的真实上传能力需在允许列表内的部署环境或桌面端验证。
