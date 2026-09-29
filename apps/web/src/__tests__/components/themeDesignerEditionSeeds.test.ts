// @vitest-environment node
import { describe, expect, it } from "vitest";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";
import { generateOptionalOverrides } from "../../components/Theme/ThemeDesigner/generators/optionalOverrides";
import {
  blueprintPreset,
  cinnabarPreset,
  designerPresets,
  inkJournalPreset,
  jadeNotesPreset,
  plainPaperPreset,
} from "../../store/themes/designerPresets";

const cssOf = (preset: (typeof designerPresets)[number]) =>
  generateCSS(preset.variables);

/** 种子最容易被静默丢弃：值超出校验范围时生成器当「未设置」，CSS 少一行而不会报错。 */
describe("designer edition seeds generate", () => {
  it.each(designerPresets)("$name 不含非法值且带完整结构", (preset) => {
    const css = cssOf(preset);
    expect(css).not.toMatch(/undefined|NaN/);
    expect(css).toContain(
      `--wemd-primary-color: ${preset.variables.primaryColor};`,
    );
    for (const selector of [
      "#wemd {",
      "#wemd p {",
      "#wemd h1 .content {",
      "#wemd h5 .content {",
      "#wemd h6 .content {",
      "#wemd blockquote,",
      "#wemd .callout {",
      "#wemd .callout-caution {",
      "#wemd .footnote-num {",
      "#wemd .imageflow-img {",
      "#wemd .block-equation svg {",
      "#wemd .table-container {",
      "#wemd hr {",
      "#wemd li section {",
    ]) {
      expect(css, `${preset.name} 缺少 ${selector}`).toContain(selector);
    }
  });

  it("h5/h6 外距按浏览器对照实测值回填", () => {
    for (const preset of designerPresets) {
      expect(cssOf(preset)).toContain("#wemd h5 { margin: 30px 0 15px; }");
      expect(cssOf(preset)).toContain("#wemd h6 { margin: 30px 0 15px; }");
    }
  });

  it("五份种子互不相同，且都追加了覆盖块", () => {
    const outputs = designerPresets.map(cssOf);
    expect(new Set(outputs).size).toBe(5);
    for (const preset of designerPresets) {
      expect(
        generateOptionalOverrides(preset.variables).length,
      ).toBeGreaterThan(500);
    }
  });
});

describe("surface-derived defaults", () => {
  it("表头底色与提示块底色缺省跟随 surface", () => {
    expect(cssOf(plainPaperPreset)).toContain(
      "--wemd-table-header-background: #F8F6F1;",
    );
    expect(cssOf(cinnabarPreset)).toContain("background-color: #FBF6F3;");
    // 墨刊显式给出白底，不应被 surface 覆盖
    expect(cssOf(inkJournalPreset)).toContain(
      "--wemd-table-header-background: #FFFFFF;",
    );
    expect(cssOf(inkJournalPreset)).toContain("background-color: #F6F6F3;");
  });
});

describe("plain paper seed", () => {
  const css = cssOf(plainPaperPreset);

  it("引用是上下横线、不对称内距与悬挂缩进", () => {
    expect(css).toContain("border-width: var(--wemd-quote-border-width) 0;");
    expect(css).toContain("padding: 12px 16px 12px 32px;");
    expect(css).toContain("text-indent: -16px;");
    expect(css).toContain("--wemd-quote-border-width: 1px;");
  });

  it("h1 带细线，h2 居中且 21px", () => {
    expect(css).toContain("border-bottom: 1px solid #E6E0D7;");
    expect(css).toContain("padding-bottom: 8px;");
    expect(css).toContain("--wemd-h2-font-size: 21px;");
    expect(css).toContain(
      "#wemd h2 { margin: var(--wemd-h2-margin-top) 0 var(--wemd-h2-margin-bottom); text-align: center; }",
    );
  });

  it("分隔线是 28px 居中短线", () => {
    expect(css).toContain("margin: 36px auto 14px;");
    expect(css).toContain("width: 28px;");
    expect(css).toContain("--wemd-hr-color: #C8BFB2;");
  });
});

describe("ink journal seed", () => {
  const css = cssOf(inkJournalPreset);

  it("h2 与引用用衬线，引用 17px 且右内距为 0", () => {
    const serif = "font-family: Songti SC, Noto Serif CJK SC, SimSun, serif;";
    expect(css.split(serif)).toHaveLength(4);
    expect(css).toContain("--wemd-quote-font-size: 17px;");
    expect(css).toContain("padding: 6px 0px 6px 24px;");
  });

  it("代码块只有左线", () => {
    expect(css).toContain("border-width: 0 0 0 1px;");
    expect(css).toContain("border-color: #CFCFCB;");
  });

  it("分隔线通栏且用深灰", () => {
    expect(css).toContain("margin: 34px 0 16px;");
    expect(css).toContain("--wemd-hr-color: #464644;");
    expect(css).not.toContain("width: 28px;");
  });
});

describe("jade notes seed", () => {
  const css = cssOf(jadeNotesPreset);

  it("引用与提示块共用松青底色，代码块无边框色脱节", () => {
    expect(css).toContain("--wemd-quote-background: #F4F8F5;");
    expect(css).toContain("background-color: #F4F8F5;");
    expect(css).toContain("--wemd-code-background: #F3F7F4;");
    expect(css).toContain("--wemd-inline-code-color: #3B5548;");
    expect(css).toContain("--wemd-paragraph-margin: 25px;");
  });

  it("引用左线宽度为 0，即纯色块无竖线", () => {
    expect(css).toContain("--wemd-quote-border-width: 0px;");
    expect(css).not.toContain(
      "border-width: var(--wemd-quote-border-width) 0;",
    );
  });
});

describe("blueprint and cinnabar seeds", () => {
  it("蓝图引用是 2px 左竖线，段距 22px", () => {
    const css = cssOf(blueprintPreset);
    expect(css).toContain("--wemd-quote-border-width: 2px;");
    expect(css).toContain("--wemd-quote-border-color: #ABC0E5;");
    expect(css).toContain("--wemd-paragraph-margin: 22px;");
    expect(css).toContain("margin: 32px 0 16px;");
  });

  it("朱砂的 28px 短线靠左", () => {
    const css = cssOf(cinnabarPreset);
    expect(css).toContain("width: 28px;");
    expect(css).toContain("margin: 36px 0 16px;");
    expect(css).toContain("--wemd-hr-color: #BB796F;");
  });

  it("两份都带引用背景与图注右对齐", () => {
    expect(cssOf(cinnabarPreset)).toContain(
      "--wemd-image-caption-align: right;",
    );
    expect(cssOf(blueprintPreset)).toContain(
      "--wemd-image-caption-color: #6D7684;",
    );
  });
});
