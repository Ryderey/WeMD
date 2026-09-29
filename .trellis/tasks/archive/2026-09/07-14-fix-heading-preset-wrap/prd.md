# 修复标题样式预设换行错乱

## Goal

修复“自定义主题 → 可视化设计 → 标题”中各样式预设，在长标题换行（尤其是手机端）时出现的样式错乱。

## Requirements

- 各标题样式预设必须在标题文字换行后保持视觉一致。
- 整体装饰型预设（左侧竖线、双线装饰、背景块、高亮胶囊、括号装饰）应作为一个整体围绕标题文字，不应被切成多段或宽度异常。
- 逐行装饰型预设（底部下划线、底部高亮）应在每一行文字上独立呈现装饰。
- 不得影响“居中/不居中”两种对齐方式的显示。
- 不得删除或降级现有样式功能。
- 不引入新的外部依赖。

## Acceptance Criteria

- [x] `simple`、`left-border`、`bottom-border`、`double-line`、`boxed`、`bottom-highlight`、`pill`、`bracket` 八种预设的长标题在手机宽度下换行后均无错乱。
- [x] 短标题在修改后效果与修改前一致。
- [x] 居中开关开启/关闭时长标题均正常显示。
- [x] 通过项目现有 lint 检查。

## Notes

- 核心修改文件：`apps/web/src/components/Theme/ThemeDesigner/generators/presets.ts`。
- 标题 span 为 `#wemd h1/h2/h3/h4 .content`。
