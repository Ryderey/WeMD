# Implement：加粗配色独立于主题色

按 stage 顺序执行。每个 stage 结束有验证命令；stage 2 之前不得改动 UI。所有改动在同一工作区完成，回滚点 = `git checkout -- <file>`（当前基线 `ccb5e1e`，工作区仅有两个用户所有的未跟踪路径，见 design.md §0）。

## Stage 1 — 数据模型与安全取值

1. `ThemeDesigner/types.ts`：在 `strongColor` 之后新增 `strongAccentColor?: string;`（注释说明为独立加粗配色，空 = 跟随主题）。
2. `ThemeDesigner/defaults.ts`：`strongAccentColor: ""`。
3. 新增 `ThemeDesigner/generators/strongAccent.ts`（仓库无现成颜色校验能力，已确认 `isValidColor` / `validateColor` 等均不存在，故按方案自建最小校验）：
   - `isValidStrongAccentColor(value: unknown): boolean` —— 仅接受 `string`，且匹配 `/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i`，与 `ColorSelector` 输出（`#` + 3~6 位 hex）及 `toAlphaColor` 支持的 3/4/6/8 位范围一致。非字符串、空串、`inherit`、`rgb(...)`、渐变串一律 false。
   - `resolveStrongAccentColor(v): string | null` —— 有效返回 trim 后的值，否则 `null`。**不调用任何字符串方法前先做类型判断**；返回 null 表示跟随主题。
   - 只这两个导出，不导出通用颜色框架，不复制 `toAlphaColor`。
4. 验证：`pnpm --filter @wemd/web exec tsc --noEmit`

**Review gate 1**：类型与默认值就位，尚无行为变化。

## Stage 2 — CSS 生成（先证明旧配置零回归）

5. `generators/variables.ts`：在 `--wemd-primary-gradient-highlight` 之后、`--wemd-letter-spacing` 之前输出三个变量，值由 `resolveStrongAccentColor` 结果或 `v.primaryColor` 派生：
   ```
   --wemd-strong-accent-color:    <C 或 primaryColor>
   --wemd-strong-accent-color-12: toAlphaColor(<同上>, 0.12)
   --wemd-strong-accent-color-18: toAlphaColor(<同上>, 0.18)
   ```
   后缀数字与真实透明度一致；不复用现有 `-20` / `-30` 命名。`toAlphaColor` 保持文件内私有，在本文件内直接调用。
6. `generators/global.ts`：`const accent = resolveStrongAccentColor(v)`，按 design.md §5 表格实现：
   - `useGradientText` 追加 `&& !accent`。
   - 文字优先级：显式 `strongColor`（非 `inherit`）→ `strongStyle === "none"` 时 `color: inherit` → accent 生效时 `var(--wemd-strong-accent-color)` → 原分支 `var(--wemd-primary-color)`。
   - 荧光笔：accent → `var(--wemd-strong-accent-color-12)`；否则原 `var(--wemd-primary-gradient-20)`。padding / radius 不变。
   - 底部涂抹：accent → `linear-gradient(to bottom, transparent 60%, var(--wemd-strong-accent-color-18) 60%)`；否则原 `-30` 版本。
   - 下划线：改为 `border-bottom-width: 2px; border-bottom-style: solid; border-bottom-color: <accent ? var(--wemd-strong-accent-color) : var(--wemd-primary-color)>;` 保留 `padding-bottom: 1px`。
   - 着重号：accent 时追加 `-webkit-text-emphasis-color` 与 `text-emphasis-color` 指向 `var(--wemd-strong-accent-color)`；跟随模式不加颜色声明（保持随文字）。
7. 不改 `generators/presets.ts`（标题预设继续用 `--wemd-primary-*`）。
8. 验证（顺序不可颠倒）：
   - 基线回归：`pnpm --filter @wemd/web run test -- --run themeDesignerVariables` 与 `headingStylePresets`、`wechatCopyCssIntegration` 必须全绿——**新变量是本次唯一允许的 CSS 文本新增**。
   - 手工比对：`generateCSS(defaultVariables)` 除三行新变量外与改动前逐字符一致。

**Review gate 2**：无新字段 = 旧效果不变。此 gate 未过不得进入 Stage 3。

## Stage 3 — 交互

9. `config/styleOptions.ts`：`{ id: "color", label: "彩色加粗" }`（ID 不变）。
10. `sections/GlobalSection.tsx`，在加粗样式字段之后依次插入：
    - 「加粗配色」：两个 `option-btn`，文案「跟随主题」/「自定义」，`aria-pressed` 标选中态。选中态由 `Boolean(variables.strongAccentColor)` 派生（不引入布尔字段）。点跟随 → `updateVariable("strongAccentColor", "")`；点自定义 → 以 `variables.primaryColor` 初始化。**不使用 `ColorSelector` 承载模式切换**。
    - 自定义模式下渲染 `ColorSelector`：`value={variables.strongAccentColor}`、`presets={primaryColorOptions}`、`onChange={(color) => updateVariable("strongAccentColor", color)}`。
    - 「加粗文字颜色」：从 OtherSection 迁入，`value={variables.strongColor || "inherit"}`，presets 改为 `[{ label: "自动", value: "inherit" }, variables.primaryColor, "#333"]`（存储值不变，仅 `inherit` 显示为「自动」）。
    - 说明文案 `.designer-field-hint`：「加粗配色控制文字默认颜色及装饰颜色；单独设置文字颜色可覆盖文字部分。」
    - 修订渐变主题色 hint：明确「仅当加粗配色选择跟随主题时，"彩色加粗"与荧光笔才使用主题渐变」。
11. `sections/OtherSection.tsx`：删除「加粗颜色」字段（唯一入口移到全局）。
12. 验证：`pnpm --filter @wemd/web exec tsc --noEmit`

**Review gate 3**：UI 就位，进入测试补齐。

## Stage 4 — 测试

13. `__tests__/components/themeDesignerVariables.test.ts` 扩展（或按需新增精简文件）：
    - 三个新变量在跟随模式下等于 `--wemd-primary-color` 及其 12%/18% 透明值。
    - 独立模式下取 `strongAccentColor`，且 `rgba(...)` 透明度为 0.12 / 0.18。
    - 六种 `strongStyle` × 独立/跟随的 `generateGlobal` 输出断言。
    - 覆盖色优先级：`strongColor: "#000000"` + accent 橙 + `highlighter-bottom` → 黑字 + 橙涂抹。
    - 非法值回退：`123`、`undefined`、`"rgb(1,2,3)"`、`{}`、非字符串、超长串 → 与跟随主题输出一致，且 CSS 中不出现该脏值。
    - 独立性：先生成 CSS，再改 `primaryColor` / `primaryGradient`，断言加粗相关有效颜色不变（不要求整份 CSS 相同）。
    - 旧配置零回归：`delete` 掉新字段后的 `generateCSS` 与基线一致。
14. `__tests__/components/GlobalSection.test.tsx`：模式按钮可访问名与 `aria-pressed`、进自定义以当前主题色初始化、切样式不清 accent、accent 色板可选、OtherSection 不再渲染加粗文字颜色入口。
15. `__tests__/services/wechatCopyCssIntegration.test.ts`：底部涂抹与下划线走 `resolveInlineStyleVariablesForCopy` → `normalizeCopyContainer` → `serializeWechatCopyHtml`，断言 `strong` 内联颜色为字面色值、无未解析 `var(--wemd-strong-*)`、涂抹渐变保留。
16. 验证：`pnpm --filter @wemd/web run test -- --run`

## Stage 5 — 文档与全量检查

17. `ThemeDesigner/VARIABLES.md`：在全量表追加三行（沿用该文件既有中文表格式），说明默认回退为主题色、仅作用于加粗。
18. 全量：
    ```powershell
    pnpm --filter @wemd/web run test -- --run
    pnpm --filter @wemd/web run lint
    pnpm --filter @wemd/web run build
    ```
19. 浏览器验收（dev server，实际点击，非仅单测）：紫主题＋橙 accent＋底部涂抹的八条主场景；正文加粗、长文本换行、列表/引用内加粗、加粗嵌套链接。
20. 持久化验收：保存 → 应用 → 重开面板；刷新页面；复制主题；JSON 导出再导入；CSS 导出文本含新变量且引用正确。
21. 微信真实粘贴（底部涂抹 / 荧光笔 / 下划线）：无法执行则明确记为未验证。

## Stage 6 — 收尾（Trellis Phase 3）

22. `trellis-check` 全量复核 → `.trellis/spec/web/frontend/` 是否需要写入新约定（加粗配色契约、`-12/-18` 命名与历史 `-20/-30` 的差异）→ 批量提交（先 work commit，再 archive/journal，不 amend、不 push）。

## 实现结果与偏差（Stage 5 完成后记录）

- 共享校验落在 `generators/strongAccent.ts`（`resolveStrongAccentColor`），`variables.ts` 与 `global.ts` 共用；`toAlphaColor` 保持 `variables.ts` 私有，未复制。
- **偏差 1**：design.md §6.2 对下划线长写属性的表述未限定模式，实现时先对两种模式都拆了长写，违反「无新字段时 CSS 逐字符不变」的 gate。已改为**仅独立配色模式使用长写**，跟随模式保留原 `border-bottom: 2px solid var(--wemd-primary-color)`。
- **偏差 2**：「自定义」按钮最初直接用 `variables.primaryColor` 播种；旧主题的主题色可能不是色板可输出的 hex（如 `rgb(...)`），会被校验拒绝导致按钮点击无效。改为播种「主题色若本身合法则用它，否则用色板首色」。
- 新增冻结测试：六种样式在跟随模式下的 `#wemd strong` 精确字符串断言（review 指出原先只做「新代码 vs 新代码」比较，结构上抓不到回归）。
- 未修复的既有缺陷（本次范围外，仅记录）：`generators/global.ts` 用 `Boolean(v.primaryGradient)` 判断是否走渐变文字分支，未 trim，而 `variables.ts` 输出的是 trim 后的值。`primaryGradient` 为纯空白时会产生 `color: transparent` 而背景无效，加粗文字不可见。配置独立配色会掩盖该分支。建议后续单独修 `Boolean(v.primaryGradient?.trim())`。
- 自动化结果：`test -- --run` 51 files / 434 tests 全绿；`lint` 0 errors（18 个既有 warning，均不在本次改动文件内）；`build` 通过（`tsc -b` 曾捕获测试里 `as const` 的 readonly 元组类型错误，已修）。
- 浏览器验收（localhost:5173，实际点击）：紫主题＋橙 accent＋底部涂抹 → 预览 `strong` 计算色 `rgb(250,81,81)`、涂抹 `rgba(250,81,81,0.18)`；文字覆盖为黑 → 黑字＋橙涂抹；主题色改天空蓝并加渐变 → accent 与涂抹不变、链接随主题变蓝；切样式后 accent 配置保留；切回跟随主题 → 恢复渐变文字且预览中不再出现 `FA5151`；基础加粗 → `rgb(51,51,51)` 无装饰。列表内、引用内、链接内、长文本换行四种上下文均无透明文字或装饰残留。保存→刷新→重开编辑器字段完整；复制主题后两份 accent 可分别编辑（`#FA5151` / `#FF85C0`）。验收用主题已删除，`wemd-custom-themes` 恢复为 `[]`、选中主题仍为 `default`。
- **未验证**：微信公众号编辑器真实粘贴（底部涂抹／荧光笔／下划线）与保存重开后的表现；JSON 文件导出→导入的下载与文件选择器路径（仅确认 `importTheme` 整体透传 `designerVariables` 给 `generateCSS`，无字段白名单）。
