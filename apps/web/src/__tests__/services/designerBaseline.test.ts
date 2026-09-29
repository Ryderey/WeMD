// @vitest-environment node
import { describe, expect, it } from "vitest";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";
import {
  headingStylePresets,
  quoteStylePresets,
} from "../../config/styleOptions";
import type { DesignerVariables } from "../../components/Theme/ThemeDesigner/types";

/**
 * 设计器旧输出基线。
 *
 * fixtures 记录经审核的设计器输出。2026-09-29 为让新主题默认覆盖 Markdown <s>
 * 的删除线颜色，全部 54 个配置增加了 #wemd s 规则并显式重冻。
 * 任何生成器改动都必须让这些断言保持通过；确需改变输出时，必须人工审核后用
 *   FREEZE_DESIGNER_BASELINE=1 pnpm --filter @wemd/web exec vitest run src/__tests__/services/designerBaseline.test.ts
 * 重新冻结，并在任务记录里说明为什么。禁止把它当成快照随手 -u 更新。
 *
 * 旧的 calloutStyle-primary 例外已随本次整批重冻写入 fixture。
 */
const fixturePath = (name: string) =>
  new URL(`../fixtures/designer-baseline/${name}.css`, import.meta.url);
const readFixture = (name: string) => readFileSync(fixturePath(name), "utf8");

const v = (overrides: Partial<DesignerVariables>): DesignerVariables => ({
  ...defaultVariables,
  ...overrides,
});

const buildConfigs = (): [string, DesignerVariables][] => {
  const configs: [string, DesignerVariables][] = [
    ["default", defaultVariables],
  ];

  for (const preset of quoteStylePresets) {
    configs.push([`quotePreset-${preset.id}`, v({ quotePreset: preset.id })]);
  }
  for (const preset of headingStylePresets) {
    configs.push([
      `headingPreset-h2-${preset.id}`,
      v({ h2: { ...defaultVariables.h2, preset: preset.id } }),
    ]);
  }
  for (const style of [
    "solid",
    "dashed",
    "dotted",
    "double",
    "pill",
    "gradient",
  ]) {
    configs.push([
      `hrStyle-${style}`,
      v({ hrStyle: style as DesignerVariables["hrStyle"] }),
    ]);
  }
  for (const style of [
    "none",
    "color",
    "highlighter",
    "highlighter-bottom",
    "underline",
    "dot",
  ]) {
    configs.push([`strongStyle-${style}`, v({ strongStyle: style })]);
  }
  for (const style of ["color", "highlighter", "highlighter-bottom"]) {
    configs.push([
      `strongStyle-${style}-withGradient`,
      v({
        strongStyle: style,
        primaryGradient: "linear-gradient(135deg, #4158D0 0%, #FFCC70 100%)",
      }),
    ]);
  }
  for (const theme of ["github", "dracula", "monokai", "vscode", "xcode"]) {
    configs.push([`codeTheme-${theme}`, v({ codeTheme: theme })]);
  }
  for (const style of ["simple", "rounded", "github", "color-text"]) {
    configs.push([`inlineCodeStyle-${style}`, v({ inlineCodeStyle: style })]);
  }
  for (const style of ["solid", "wavy", "dotted", "dashed"]) {
    configs.push([
      `underlineStyle-${style}`,
      v({ underlineStyle: style as DesignerVariables["underlineStyle"] }),
    ]);
  }
  configs.push(["calloutStyle-primary", v({ calloutStyle: "primary" })]);
  configs.push(["textJustify-off", v({ textJustify: false })]);
  configs.push(["textIndent-on", v({ textIndent: true })]);
  configs.push(["tableZebra-off", v({ tableZebra: false })]);
  configs.push(["imageShadow-on", v({ imageShadow: true })]);
  configs.push(["linkUnderline-off", v({ linkUnderline: false })]);
  configs.push([
    "combined-readingLike",
    v({
      primaryColor: "#27675C",
      paragraphColor: "#3D4841",
      fontSize: "16px",
      lineHeight: "1.92",
      quotePreset: "left-border",
      quoteBorderWidth: 0,
      hrStyle: "solid",
      strongStyle: "color",
      tableZebra: false,
      imageShadow: false,
      linkUnderline: true,
    }),
  ]);
  return configs;
};

describe("designer legacy output baseline", () => {
  const configs = buildConfigs();

  it("每个配置都有已冻结的基线文件", () => {
    const missing = configs
      .map(([name]) => name)
      .filter((name) => !existsSync(fixturePath(name)));
    expect(missing, `缺少基线：${missing.join(", ")}`).toEqual([]);
  });

  it.each(configs.map((c) => [c[0], c[1]] as const))(
    "%s 的输出与冻结基线逐字一致",
    (name, variables) => {
      expect(existsSync(fixturePath(name)), `找不到基线文件 ${name}.css`).toBe(
        true,
      );
      const output = generateCSS(variables);
      expect(output).toBe(readFixture(name));
    },
  );
});

describe.skipIf(process.env.FREEZE_DESIGNER_BASELINE !== "1")(
  "重新冻结基线（显式执行）",
  () => {
    it("写回全部配置的输出", () => {
      mkdirSync("src/__tests__/fixtures/designer-baseline", {
        recursive: true,
      });
      const names: string[] = [];
      for (const [name, variables] of buildConfigs()) {
        writeFileSync(
          `src/__tests__/fixtures/designer-baseline/${name}.css`,
          generateCSS(variables),
          "utf8",
        );
        names.push(name);
      }
      writeFileSync(
        "src/__tests__/fixtures/designer-baseline/_manifest.json",
        JSON.stringify({ configs: names }, null, 2),
        "utf8",
      );
      console.log(`@@REFROZEN@@ ${names.length} configs`);
    });
  },
);
