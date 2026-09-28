# Design：加粗配色独立于主题色

来源：`docs/plans/2026-09-28-independent-bold-color.md`（用户批准的方案，全文保留如下）。本任务额外补充「代码核对结论」一节。

## 0. 代码核对结论（2026-09-28 实现前）

方案第 2 节的十条文件职责描述与当前代码一致。补充与修正：

| 位置                                         | 事实                                                                                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generators/global.ts:4-7`                   | `useGradientText` = 有 `primaryGradient` 且 `strongStyle==="color"` 且 `strongColor` 为空或 `inherit`；命中时输出 `background-clip: text; color: transparent`                         |
| `generators/global.ts:22-23`                 | 显式 `strongColor`（非 `inherit`）优先于任何样式分支，直接写死文字色                                                                                                                  |
| `generators/global.ts:28-31`                 | 荧光笔→`--wemd-primary-gradient-20`；底部涂抹→`--wemd-primary-color-30`；下划线→`border-bottom: 2px solid var(--wemd-primary-color)`（简写）；着重号→无颜色声明                       |
| `generators/variables.ts:55-56`              | `primaryColor20 = toAlphaColor(primaryColor, 0.12)`、`primaryColor30 = … 0.18`：变量名后缀与真实透明度不一致，属既有历史命名。新变量必须用 `-12` / `-18` 对齐真实透明度，不改现有变量 |
| `generators/presets.ts:71,82,124`            | `--wemd-primary-gradient-20` / `--wemd-primary-color-30` 同时被**标题预设**（boxed / bottom-highlight / numbered-label）使用。这些引用不得改动，否则违反「其他主题元素保持原有取色」  |
| `sections/OtherSection.tsx:88-95`            | 现有「加粗颜色」控件：`value={variables.strongColor \|\| "inherit"}`、`presets={["inherit", primaryColor, "#333"]}`，即方案要移动的文字覆盖色入口                                     |
| `config/styleOptions.ts:119-126`             | `boldStyleOptions` 中 `{ id: "color", label: "随主题色" }` 为唯一需改文案的条目                                                                                                       |
| `components/Theme/ColorSelector.tsx:119-128` | 预设按 `displayColor \|\| value` 归一化去重 —— 证实方案第 3 节「不要把跟随主题做成色块」的判断                                                                                        |
| `ThemeDesigner/index.tsx:96-103`             | `handlePrimaryColorChange` 只同步 `listMarkerColor(L2)`，不涉及 strong，无需改动                                                                                                      |
| `ThemePanel.tsx:17-26`                       | `normalizeDesignerVariables` 用 `{...defaultVariables, ...variables}` 平铺合并；字段缺失时默认值可生效，但方案第 4 节要求生成路径自身也要能回退                                       |
| `generateCSS.ts:70-71`                       | `generateVariables(v, safeFontFamily)` 与 `generateGlobal(v)` 都在同一 `generateCSS` 调用内，共享取值函数应放在两者都能 import 的位置                                                 |

工作区状态：`docs/plans/2026-09-28-independent-bold-color.md` 与 `docs/research/` 为未跟踪文件，属用户所有，不纳入本任务提交、也不得覆盖。

---

# 自定义可视化主题：加粗配色独立方案

- 日期：2026-09-28
- 状态：已批准，进入实现
- 用途：需求审阅与其他 Agent 实施交接
- 本文基于当前代码调查编写；尚未修改功能代码，尚未运行实现验证。

## 1. 用户需求与范围

用户希望在自定义可视化主题中，将“主题色”与“加粗样式”的颜色独立分开，加粗样式不必跟随主题色。

截图中的主要场景是“底部涂抹”。本次应覆盖全部六种加粗样式，不能只改文字颜色，而让涂抹、荧光笔或下划线继续跟随主题色。

推荐方案：在“加粗样式”下新增“加粗配色”，允许选择“跟随主题”或自定义纯色。保留已有的文字颜色覆盖能力及旧主题默认表现。

### 必须实现

- 独立配色可控制加粗默认文字色和装饰色。
- 配置独立配色后，修改主题色或渐变主题色不会覆盖它。
- 切换加粗样式不会清空独立配色。
- 保留“黑色文字＋彩色涂抹”等分别设置文字与装饰颜色的能力。
- 保存、应用、复制主题、重开、JSON 导入导出及 CSS 导出均保留效果。
- 旧主题未配置新字段时，维持现有取色行为。

### 本次不包含

- 独立的加粗渐变编辑器。
- 单独为每一种加粗样式保存一套颜色。
- 新颜色处理依赖、通用配色状态框架或全局主题架构重构。
- 数据库迁移或已有主题的批量重写。

## 2. 当前实现与根因

以下路径均相对于仓库根目录。

| 文件                                                                     | 当前职责与相关事实                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `apps/web/src/components/Theme/ThemeDesigner/sections/GlobalSection.tsx` | 展示主题色、渐变主题色和六种加粗样式                           |
| `apps/web/src/components/Theme/ThemeDesigner/sections/OtherSection.tsx`  | 已有 `strongColor` 的加粗文字颜色控件                          |
| `apps/web/src/components/Theme/ThemeDesigner/types.ts`                   | `DesignerVariables` 已定义 `strongStyle`、`strongColor`        |
| `apps/web/src/components/Theme/ThemeDesigner/defaults.ts`                | 默认 `strongStyle: "color"`、`strongColor: "inherit"`          |
| `apps/web/src/components/Theme/ThemeDesigner/generators/global.ts`       | 生成 `#wemd strong` 的文字与装饰样式                           |
| `apps/web/src/components/Theme/ThemeDesigner/generators/variables.ts`    | 生成 CSS 变量，已有透明色转换函数 `toAlphaColor`               |
| `apps/web/src/components/Theme/ThemeDesigner/index.tsx`                  | `handlePrimaryColorChange` 更新主题色和列表标记色              |
| `apps/web/src/components/Theme/ThemeDesigner/generateCSS.ts`             | 汇总完整主题 CSS                                               |
| `apps/web/src/components/Theme/ThemePanel.tsx`                           | 合并设计器默认值、管理主题编辑与保存                           |
| `apps/web/src/store/themeStore.ts`                                       | 加载、复制、保存、导入导出；加载和导入时直接调用 `generateCSS` |

目前 `strongColor` 只覆盖文字颜色；荧光笔、底部涂抹和下划线直接引用 `--wemd-primary-*`。着重号未单独指定颜色，随文字颜色渲染。因此仅暴露或移动 `strongColor` 控件不能完整解决需求。

此外，`strongColor: "inherit"` 在现有生成器中代表自动取色分支，并非所有样式都严格继承正文色：基础加粗继承所在容器，其余样式按主题逻辑取色。

## 3. 界面与交互

建议“全局”标签页按以下顺序展示：

```text
主题色
[现有色板]

渐变主题色
[现有渐变色板]

加粗样式
[基础加粗] [彩色加粗] [荧光笔]
[底部涂抹] [下划线]   [着重号]

加粗配色
[跟随主题] [自定义]

选择自定义时：
[颜色预设] [+]

加粗文字颜色
[自动] [现有颜色预设] [+]
```

具体要求：

1. 将“随主题色”样式按钮改名为“彩色加粗”，保留内部 ID `color`。
2. “跟随主题”为默认模式。进入自定义模式时，以当前 `primaryColor` 初始化独立配色。
3. 切回跟随主题时清空独立配色。首版不记忆切换前的自定义颜色。
4. 将“其他”标签页已有的 `strongColor` 控件移动到此处，不保留两个重复入口。
5. 将该控件的 `inherit` 选项显示为“自动”，保持存储值不变。
6. 加粗配色与文字覆盖色的说明建议为：“加粗配色控制文字默认颜色及装饰颜色；单独设置文字颜色可覆盖文字部分。”
7. 基础加粗仍保持纯加粗语义；独立配色在该样式下保留配置，但不主动改变文字颜色。显式文字覆盖色仍可生效。
8. 调整渐变主题色说明，明确仅在加粗配色跟随主题时，相关加粗效果才使用主题渐变。
9. 色板复用现有 `ColorSelector` 和预设，不新增颜色选择器依赖。模式按钮应具有明确的可访问名称与选中状态。

### 注意模式选择与色板去重

“跟随主题 / 自定义”应使用独立按钮或项目已有开关。不要把“跟随主题”模拟成与主题色相同的普通色块：现有 `ColorSelector` 按展示颜色去重，会混淆两个颜色相同但语义不同的选项。

## 4. 数据模型与兼容契约

新增一个可选字段：

```ts
strongAccentColor?: string;
```

| 值                          | 语义                 |
| --------------------------- | -------------------- |
| 缺失、`undefined`、空字符串 | 跟随主题，沿用原行为 |
| 合法纯色                    | 使用独立加粗配色     |
| 非法类型或无效颜色          | 安全回退为跟随主题   |

`defaultVariables` 使用空字符串。不新增重复表达同一状态的 `followTheme` 布尔值。

保留 `strongColor` 的原有含义：仅作为文字覆盖色。不能直接将其改成文字与装饰的公共色，因为旧主题可能已配置“黑色文字＋主题色涂抹”。

新字段的校验应先复用仓库已有能力；若没有，定义与当前色板实际输出匹配的最小有效颜色范围，并明确处理旧 JSON 的字段缺失。不得对导入值未经类型检查就调用字符串方法，也不得将未经验证的值直接拼入 CSS。

兼容回退必须在 CSS 生成路径内有效，不能只依靠 `ThemePanel` 合并默认值：`themeStore` 加载和导入时会直接调用生成器。

## 5. 六种样式的取色规则

下表适用于已配置合法独立配色 `C`、且未显式覆盖 `strongColor` 的情况。

| 样式 ID              | 显示名称 | 文字         | 装饰                           |
| -------------------- | -------- | ------------ | ------------------------------ |
| `none`               | 基础加粗 | 继承所在容器 | 无                             |
| `color`              | 彩色加粗 | `C`          | 无                             |
| `highlighter`        | 荧光笔   | `C`          | `C` 的 12% 透明背景            |
| `highlighter-bottom` | 底部涂抹 | `C`          | 下方区域使用 `C` 的 18% 透明色 |
| `underline`          | 下划线   | `C`          | `C` 的下边线                   |
| `dot`                | 着重号   | `C`          | `C` 的着重号                   |

显式配置 `strongColor` 时，文字优先使用该覆盖色，装饰仍使用 `C`。例如文字黑色、独立配色橙色时，底部涂抹呈现黑字与橙色涂抹。

未配置独立配色时，完整保留旧行为，包括：

- 基础加粗的继承逻辑。
- 显式 `strongColor` 的优先级。
- 彩色加粗在符合现有条件时使用主题渐变。
- 荧光笔使用主题渐变或原纯色回退。
- 底部涂抹、下划线使用主题色。
- 着重号继续随文字取色。

## 6. CSS 生成设计

### 6.1 变量生成

在 `generators/variables.ts` 中复用 `toAlphaColor`，增加：

```css
--wemd-strong-accent-color: ...;
--wemd-strong-accent-color-12: ...;
--wemd-strong-accent-color-18: ...;
```

- 自定义时从有效 `strongAccentColor` 生成，否则回退主题色。
- 透明度继续使用当前 12% 与 18%，不顺带调整视觉强度。
- 变量命名中的数字与真实透明度一致。
- 不复制透明色解析函数，不增加通用颜色解析框架。
- 若校验与取值需在两个生成器复用，使用一个小型共享函数，避免出现两套不一致的“是否自定义”判断。

### 6.2 加粗规则生成

修改 `generators/global.ts`：

1. 判断是否存在有效独立配色。
2. 文字优先级：显式 `strongColor` → 基础加粗继承 → 独立配色 → 现有主题取色分支。
3. 独立配色生效时禁止彩色加粗继续使用主题渐变，避免出现透明文字与旧渐变残留。
4. 荧光笔在独立模式下使用独立纯色透明背景；跟随模式保留原渐变逻辑。
5. 底部涂抹与下划线使用对应的独立变量或主题回退。
6. 独立模式下显式设置着重号颜色，避免被文字覆盖色带走；跟随模式保持原表现。

下划线建议将 `border-bottom-width`、`border-bottom-style`、`border-bottom-color` 分开声明，以降低微信复制链路中变量与边框简写组合造成的兼容问题。保持原有线宽与间距。

禁止通过改写 `--wemd-primary-*` 实现此功能，否则标题、链接、列表等也会受到影响。

## 7. 保存、导入导出与影响边界

当前保存和 JSON 导出会携带完整的 `designerVariables`，优先沿用该通道，无需单独创建存储机制。

需检查：

- 保存与应用后重新打开，字段与预览一致。
- 刷新或重新启动后字段仍在。
- 复制主题后两份主题可独立编辑。
- JSON 导出再导入保留独立配色与文字覆盖色。
- CSS 导出包含加粗专用变量及正确引用。
- 旧 JSON 缺失新字段时正常导入，旧效果不变。
- 无效新字段不会导致整批自定义主题加载失败。
- 更改加粗配色不会改动标题、链接、引用、列表标记、代码等其他配置。

不预先重构 `ThemePanel` 或 `themeStore`。只有字段校验或验证暴露实际问题时，才做必要的局部调整。

## 8. 文件改动清单

| 文件                                                                     | 计划改动                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------- |
| `apps/web/src/components/Theme/ThemeDesigner/types.ts`                   | 新增可选 `strongAccentColor`                   |
| `apps/web/src/components/Theme/ThemeDesigner/defaults.ts`                | 添加空字符串默认值                             |
| `apps/web/src/components/Theme/ThemeDesigner/sections/GlobalSection.tsx` | 添加配色模式与色板，承接文字颜色控件，修订说明 |
| `apps/web/src/components/Theme/ThemeDesigner/sections/OtherSection.tsx`  | 移除已移动的文字颜色入口                       |
| `apps/web/src/config/styleOptions.ts`                                    | 将 `color` 对应文案改为“彩色加粗”，不修改 ID   |
| `apps/web/src/components/Theme/ThemeDesigner/generators/variables.ts`    | 生成独立颜色及透明色变量                       |
| `apps/web/src/components/Theme/ThemeDesigner/generators/global.ts`       | 实现文字优先级、装饰独立取色及旧配置回退       |
| `apps/web/src/components/Theme/ThemeDesigner/VARIABLES.md`               | 记录新变量、默认回退与适用范围                 |
| `apps/web/src/__tests__/components/themeDesignerVariables.test.ts`       | 扩展变量与生成器回归测试                       |
| 现有组件测试或一个精简的新测试文件                                       | 验证模式切换、状态保留与入口交互               |
| `apps/web/src/__tests__/services/wechatCopyCssIntegration.test.ts`       | 验证复制后独立颜色与装饰保留                   |

上述为预计清单；共享校验位置及样式文件是否需要调整，由实现时的最小改动决定。

## 9. 实施顺序

1. 阅读当前仓库 `AGENTS.md`、`.trellis/workflow.md` 及 Web 前端相关规范；按届时用户授权处理 Trellis 任务流程。本文不是已激活的 Trellis 任务，也不表示已完成任何实现阶段。
2. 确认上述调用链仍与代码一致，检查当前未提交工作，避免覆盖其他修改。
3. 增加可选字段、默认值及安全取值逻辑。
4. 完成变量和加粗 CSS 生成，先验证无新字段时保持原效果。
5. 增加独立配色交互，移动文字颜色控件，调整按钮与帮助文案。
6. 验证保存、应用、复制、重开及导入导出。
7. 更新变量文档；代码内的技术文档遵循项目英文规范。本文保留中文以供本次需求审阅与交接。
8. 执行自动化检查与浏览器验收，记录真实结果；未完成的外部微信验收应明确标注。

## 10. 验收标准

### 10.1 主要场景

配置：主题色紫色、独立加粗配色橙色、样式为底部涂抹。

- [ ] 未显式覆盖文字色时，显示橙色文字与半透明橙色涂抹。
- [ ] 文字色单独设为黑色后，显示黑字与橙色涂抹。
- [ ] 主题色改为绿色，加粗颜色不变。
- [ ] 修改主题渐变，加粗颜色不变。
- [ ] 切换其他加粗样式，独立颜色配置仍在。
- [ ] 切回“跟随主题”，恢复原有主题联动。
- [ ] 基础加粗仍遵守继承色或显式文字覆盖色规则。
- [ ] 其他主题元素保持原有取色规则。

### 10.2 回归与持久化

- [ ] 六种样式均覆盖独立模式和跟随模式。
- [ ] 旧主题有、无显式 `strongColor` 均保持原效果。
- [ ] 主题渐变有、无两种情况均验证。
- [ ] 保存、应用、重开、刷新、复制主题均保留配置。
- [ ] JSON 往返与 CSS 导出正确。
- [ ] 新字段缺失、空值、无效类型或无效颜色可安全回退。
- [ ] 控件支持键盘操作，模式和颜色具有可访问名称及正确选中状态。

### 10.3 自动化测试

优先复用现有 Vitest 与 Testing Library，不增加测试框架。

- 变量与生成器：验证独立颜色、12%/18% 透明度、六种样式、文字覆盖色优先级和旧配置回退。
- 独立性：先生成 CSS，再改变 `primaryColor` 和 `primaryGradient`；断言加粗相关有效颜色保持不变，不要求整份 CSS 相同。
- 组件：切换配色模式、选择颜色、修改主题色、切换样式后检查状态与输出。
- 微信复制：至少覆盖底部涂抹与下划线；经过现有完整复制流程后，断言内联颜色为预期实际值，没有未解析的相关 CSS 变量。

在仓库根目录运行：

```powershell
pnpm --filter @wemd/web run test -- --run
pnpm --filter @wemd/web run lint
pnpm --filter @wemd/web run build
```

可先运行受影响测试进行快速反馈，再执行上述完整检查。若存在基线失败，区分本次引入与已有问题，不把未通过写成通过。

### 10.4 浏览器与微信人工验收

预览至少检查正文加粗、长文本换行、列表和引用内加粗，以及加粗与链接嵌套情况，确保没有异常透明文字或装饰残留。

将底部涂抹、荧光笔和下划线示例复制至微信公众号编辑器，检查粘贴后及保存重开后的颜色。自动化复制测试通过不等于微信客户端最终表现已验证；无法执行时在交接中明确记录未验证项。

## 11. 简化替代方案及取舍

更少改动的替代方案是直接让 `strongColor` 同时控制文字和装饰，但这会改变旧主题“文字色与装饰色分别设置”的语义。本方案选择增加一个可选字段，以保留兼容性与黑字配彩色装饰的能力。

首版仅提供独立纯色，不新增独立渐变、各样式单独颜色或多级配置系统。确有后续需求时再扩展。

## 12. 完成交接时应提供

- 实际修改的文件及实现行为。
- 自动化检查的命令、结果与任何基线失败。
- 独立配色、文字覆盖色和旧主题兼容性的验证结果。
- 浏览器截图或可复现的验收步骤。
- 微信实际粘贴是否完成验证，未验证项明确列出。
- 是否存在偏离本文的实现决策及原因。
