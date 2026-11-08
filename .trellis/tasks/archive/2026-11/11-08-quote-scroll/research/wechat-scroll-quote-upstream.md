# 上游取证：微信公众号「引用上下滑动」真实标记（2026-11-08）

来源文章：https://mp.weixin.qq.com/s/g1VKOWR78z4A4jwk5HKGbA（提示词框，"▲上下滑动查看全文"）
取证方式：真实浏览器 evaluate_script 抽取 #js_content 之 DOM 与 computed style（非转述）。

## 发布文章保留下来的滚动结构

滚动容器（微信发布链路原样保留的内联样式）：

```html
<section
  style="display: inline-block; width: 100%; height: 240px; vertical-align: top; overflow-y: auto; box-sizing: border-box;"
>
  （内部为普通 section/p/span，含 3px 左竖线引用排版）
</section>
```

实测：`clientHeight=240, scrollHeight=312`（第一块内容超长，确实在滚）。其余各块同款样式。
文章内共出现 ≥4 个同款滚动容器，.height 均为 240px。

提示行（滚动容器之后、紧跟的独立节点）：

```html
<section
  style="margin: 0px 0px 24px; text-align: center; box-sizing: border-box;"
>
  <section style="font-size: 12px; box-sizing: border-box;">
    <p style="margin: 0px; padding: 0px; box-sizing: border-box;">
      <span>▲上下滑动查看全文</span>
    </p>
  </section>
</section>
```

## 实测补充（2026-11-08 真机验证新增）

1. **微信编辑器对单条引用块提示「引用字数：N/300（单次引用不得超过300字，避免不合理引用）」**——超过 300 字触发蓝色合规提示（例：687 字），仅警告不拦保存（687 字草稿可存、可重开）。
2. 编辑器粘贴保留 `max-height`，并把 `overflow-x:hidden; overflow-y:auto` 归一为等价的 `overflow: hidden auto`；`-webkit-overflow-scrolling` 被丢弃（现代内核原生滚动）。
3. 保存草稿然后整页重开（appmsgid=100000365/100000369），样式与提示行原样保留——存档链路不清。
4. 提示行触发阈值实测（复制宽度 760px、青岚引用样式 16px/1.9、padding 14/32）：240px→约240字；280/300px→约320字；360px→约399字。**在 300 字额度内，240px 是唯一稳妥档**（此后默认高度维持 240px）。
5. 手机端 240px（内容换行更多）实测可滚，手感正常（用户确认）。

## 结论

1. 微信的保存/发布链路不剥 `height + overflow-y: auto`（编辑器粘贴同样只是保留内联样式；发布结果即证明）。
2. 提示行是独立 DOM 节点，不是容器 ::after（::after 在滚动容器内部会跟着滚，语义错误）。
3. 该文章的引用样式（左竖线灰字）与 WeMD 引用预设视觉同源，样式相容。

## 本项目复制链路审计（对照）

管线：`copyToWechat`(editorStore.ts:182) → `renderOffscreenContent`(apps/web/src/services/export/renderContainer.ts:87)
→ `parser.render → materializeCounterPseudoContent → processHtml(juice 内联, packages/core/src/ThemeProcessor.ts:86)`
→ `resolveInlineStyleVariablesForCopy → convertCheckboxesToEmoji → innerHTML → mermaid/table → normalizeCopyContainer` → `serializeWechatCopyHtml`。

- 归一化 [wechatCopyNormalizer.ts:507](apps/web/src/services/wechatCopyNormalizer.ts#L507) 无 CSS 属性白名单，本链路不会剥 overflow/max-height。
- `pre` 已有 canonical 先例：components.ts:55-59 基础规则 + ThemeProcessor.ts:102-113 juice 后二次追加 `overflow-x:auto;-webkit-overflow-scrolling:touch;`。
- 「链接转脚注」是复制链路唯一的先例（预览不出现、复制才注入），提示行照此模式。
- 引用样式变体机制：styleConfig `quoteStylePresets`(apps/web/src/config/styleOptions.ts:132)，高级细项 `quoteBlocks`(apps/web/src/components/Theme/ThemeDesigner/generators/optionalOverrides.ts:123-172) 在追加覆盖层，字段缺省输出零字节。
- designer 变量在复制入口可达：editorStore.ts:182-189 读 `designerVariables.showMacBar`（同款读取路径可读 `quoteScrollHeight`）。
- 导出图片共用 `renderOffscreenContent`（apps/web/src/services/export/exportService.ts:316，forWechat=false）→ 滑动样式需在非微信语境剥离。
- 微信只认内联样式：class 只在本项目预览有效，复制进微信编辑器即丢。

## 规格硬约束（.trellis/spec/web/frontend）

- theme-designer.md：60 份 designer 基线（fixtures/designer-baseline/）逐字节不变；新开关式规则进 append-only 层（optionalOverrides），缺省分支必须零字节；optionalOverrides.ts 文件本身是 CRLF，编辑时勿动腰部 EOL。
- wechat-copy-pitfalls.md：兼容关键排版必须内联（class 不可依赖）；验收必须跑完整链 buildCopyCss→processHtml→resolveInlineStyleVariablesForCopy→normalizeCopyContainer→serializeWechatCopyHtml。
- scroll-image-block.md：jsdom 的 CSSOM 不支持 touch-action / max-content，relevant 断言要落在 HTML 字符串层；真实浏览器与微信验证分开报告。
