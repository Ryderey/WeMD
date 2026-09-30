# 设计：选择预设时载入参考标题参数

## 本次继续修复：显式写法的使用入口与真实验收

用户于 2026-09-30 明确要求继续修复，并随后表示可接受现有显式 span 写法。自动生成会新增主题相关的 DOM 转换、三条入口接入和编号语义，本轮据此保留最小显式路线，不引入该转换层。

仅在 HeadingSection 当前级别选中 chapter-label 时，展示对应标题级别的 Markdown 示例、手动编号说明与“复制标签代码”按钮；换其他预设时提示隐藏。按钮仅复制 span 片段，通过现有 Electron preload writeText 或浏览器 navigator.clipboard.writeText；沿用项目 toast 反馈成功/失败。延续已有标题参数和装饰色修正，无新依赖、字段或渲染接口。

回归升级为真实 renderOffscreenContent 与 serializeWechatCopyHtml，减少手动模拟复制链路造成的盲区。输入明确含作者标签，不将通过结果用于宣称自动生成能力。

浏览器必须在运行中的 dev:web 录入示例、创建验证主题、选预设、保存应用、复制标签并粘贴到正文，观察主预览与设计器预览；静态对照不能替代此验收。公众号载荷通过真实渲染入口验证；原生富文本剪贴板的工具读取限制单独记录。普通未标注标题仍为单行加竖线，这是保留显式路线的已知行为。

## 诊断

复现实际 HeadingSection 点击 → generateCSS → createMarkdownParser → buildCopyCss → processHtml(true,true) → resolveInlineStyleVariablesForCopy。当前输出主标题 #333、标签与竖线 #07C160、缺少独立行高、bold 字重、0 字距，与参考的双配色和排版不同。源码中选择按钮仅设置 preset；章节预设继承主题色。不存在标签丢失或 parser 顺序缺陷。

同字体、515px 视口浏览器实测：参考主标题盒高 48px，当前 44px；局部参考 CSS 对照恢复到 48px。此处仅比较标题，未复刻整个 WeDraft modal 或正文模板。

## 最小修正

1. HeadingSection 的预设选择分支：chapter-label 载入 fontSize:20、color:#FFA900、lineHeight:1.5、fontWeight:"750"、letterSpacing:0.2、marginTop:0、marginBottom:24、centered:false；其他选择保持现有逻辑。只改变选中级别，不修改全局 defaultVariables 或 primaryColor。
2. chapter-label CSS：保留现有 inline-block 和作者子 span；标签和左边框采用 #F96E57，维持其余已对齐的标签尺寸。主标题 CSS 仍读取正常 heading 变量，不硬编码覆盖用户控件。
3. 不新增 schema 字段、解析器、标签编辑器或主题迁移。重新选择预设是旧章节标签主题获取参考主标题参数的明确操作。

这是对旧方案「装饰色跟随主题、主标题参数不变」的明确修订：该简化无法达到用户本轮确认的参考视觉。标签与竖线属于这个预设的固定配色，主标题仍可微调。

## 兼容与验证

章节标签 CSS 的装饰色变化是已知、需审阅的该预设输出变化。仅允许更新 headingPreset-h2-chapter-label.css；不重写其余 54 个基线，manifest 无需增项。

回归必须从真实选择按钮触发，避免仅在测试里手工塞入正确 h2 值而掩盖入口缺陷。保留强调、链接、无标签普通标题与现有复制链路验证。微信人工粘贴未完成。

## 回退

回退仅涉及 HeadingSection 的选择分支、chapter-label CSS、相应测试和单一 fixture，不触碰原稿、其他主题或 server 修改。
