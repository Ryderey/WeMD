# 实际诊断证据

日期：2026-09-30。当前产品提交：8711060（feat(theme): add chapter-label heading preset）。用户确认截图是预期参考，并同意创建修正任务。

## 复现命令与结果

从仓库根目录运行：

```powershell
powershell -NoProfile -File .trellis/tasks/09-30-chapter-label-reference/research/check.ps1
```

临时探针实际点击 HeadingSection 的「章节标签」按钮，再经真实 CSS 生成器、parser 和内联处理链路获取最终样式。2026-09-30 修正前重复运行，结果固定失败。关键输出：

```text
titleColor: rgb(51, 51, 51)     expected rgb(255, 169, 0)
titleSize: 20px                expected 20px
titleLineHeight: empty        expected 1.5
titleWeight: bold             expected 750
titleTracking: 0px            expected 0.2px
labelColor: rgb(7, 193, 96)    expected rgb(249, 110, 87)
ruleColor: rgb(7, 193, 96)     expected rgb(249, 110, 87)
```

测试约 3.6–3.8 秒，具体断言用例约 0.3 秒；临时 probe 自动清理，不留在产品测试目录。复制测试并不写入系统剪贴板。

## 已验证的假设

1. 预设继承默认主题色导致配色差异：成立。真实点击只写 preset，最终仍为 #333 主标题与 #07C160 装饰；局部改为参考双配色后显示对齐。
2. 主标题缺少独立排版参数导致高度差异：成立。在同字体环境和 515px 视口，参考标题盒高 48px，当前 44px；局部设置 1.5 行高、750 字重和 0.2px 字距后高 48px。
3. 预览外层容器是主要原因：隔离同尺寸环境后仍有上述差异，因此不是这些已复现差异的主因。实际用户文章的整页间距仍需实施后在主预览检查，不能以隔离对照保证全部容器。

## 视觉对照

`compare.html` 由实际代码生成。第一块是从 WeDraft JSON 和 renderer 抽取的参考标题内联样式，第二块是当前真实 parser/CSS 生成结果，第三块是只用于验证视觉的局部 CSS 候选。第三块尚不是产品实现。

`comparison.png` 是浏览器真实截图：固定 515px 视口、同一 Microsoft YaHei 字体环境。参考截图的原始平台字体可能不同，因此此对照证明布局及颜色参数等价，不承诺跨平台字形像素完全一致。红色矩形是用户标注，不属于拟实现样式。

## 诊断时的边界

任务仍为 planning，尚未运行 task.py start；业务代码未修改。保留已存在的 server 修改及未追踪文档。修正方案待审阅；原参考主题、parser、文章内容和全局默认主题色不动。

## 实施后的状态

用户已确认按第三块效果实施，任务已进入 in_progress。修正后的测试、真实浏览器测量、复制 HTML 和兼容性边界见 verification.md；implemented.png 为实际实现截图。上述失败输出和 comparison.png 保留作修正前证据。
