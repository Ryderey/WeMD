# 滚动长图技术设计

## Syntax and parsing

公开语法为：

```md
::: scroll-image 320
![图片说明](https://example.com/long-image.jpg "可选标题")
:::
```

Core 使用已安装的 `markdown-it-container` 识别容器，再用 MarkdownIt 已生成的 token 校验容器内部恰好是一个只含图片的段落。高度省略取 320；整数夹到 160–800；非数字参数或非单图内容回退为普通容器内容，不输出滚动样式。

渲染输出固定的 `scroll-image` 类名和必要内联样式。滚动层设置固定高度、`overflow-y:auto`、`overflow-x:hidden`、触摸惯性滚动、`tabindex=0` 与中文 `aria-label`；图片设置 `display:block;width:100%;height:auto;margin:0`；提示位于滚动层外。

## Authoring flow

工具栏新增独立滚动长图按钮和隐藏文件输入。文件选中后创建对象 URL 并打开设置弹窗；弹窗本地预览与最终布局一致。用户确认后调用现有 `uploadEditorImage`，成功后通过 `onInsertText` 插入块语法。

弹窗内部持有文件、对象 URL、高度和上传状态。取消与成功都释放对象 URL；上传失败只显示错误并保留状态供重试。普通图片按钮和编辑器粘贴链路不变。

## Compatibility and validation

所有关键布局属性使用内联样式，现有 `processHtml` 和 `normalizeCopyContainer` 只负责主题样式和微信兼容处理。自动化测试断言经过完整复制流水线后这些属性仍存在。

真实验证用 Chrome DevTools MCP 操作本地 WeMD 和已登录公众号：真实点击复制、键盘粘贴、保存草稿、重开并检查界面与计算样式，随后删除草稿。禁止直接向公众号编辑器注入 HTML，禁止发送预览或发表。

## Rollback

删除滚动长图插件注册、工具栏入口及其组件即可；现有 Markdown、普通图片和横向图片流没有数据迁移。
