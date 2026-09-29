// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";
import type { DesignerVariables } from "../../components/Theme/ThemeDesigner/types";

const frozenDefault = readFileSync(
  new URL("../fixtures/designer-baseline/default.css", import.meta.url),
  "utf8",
);

const v = (overrides: Partial<DesignerVariables>) =>
  generateCSS({ ...defaultVariables, ...overrides });

const outer = (css: string) =>
  css.slice(css.lastIndexOf("#wemd pre,\n#wemd pre.custom {"));
const inner = (css: string) =>
  css.slice(css.lastIndexOf("#wemd pre code,\n#wemd pre code.hljs,"));
const inline = (css: string) => css.slice(css.lastIndexOf("#wemd code {"));

describe("code block frame", () => {
  it("uses border longhands instead of the shorthand", () => {
    const css = v({
      codeBlockBorder: "full",
      codeBlockBorderColor: "#DDE7DF",
      codeBlockBorderWidth: 1,
    });
    const b = outer(css);
    expect(b).toContain("border-width: 1px;");
    expect(b).toContain("border-style: solid;");
    expect(b).toContain("border-color: #DDE7DF;");
    expect(b).not.toMatch(/border: /);
  });

  it("left mode keeps the other three sides at zero", () => {
    const css = v({ codeBlockBorder: "left", codeBlockBorderColor: "#CFCFCB" });
    expect(outer(css)).toContain("border-width: 0 0 0 1px;");
    expect(outer(css)).toContain("border-color: #CFCFCB;");
  });

  it("none clears the frame", () => {
    expect(outer(v({ codeBlockBorder: "none" }))).toContain("border-width: 0;");
  });

  it("missing color falls back to a themed default, never to raw input", () => {
    const css = v({ codeBlockBorder: "full", codeBlockBorderColor: "red" });
    expect(css).toContain("border-color: #DDE7DF;");
    expect(css).not.toContain("border-color: red;");
  });
});

describe("code block inner box", () => {
  it("covers the hljs and non-hljs branches in one rule", () => {
    const css = v({ codeBlockPaddingX: 16, codeBlockPaddingY: 14 });
    const b = inner(css);
    expect(b).toContain("#wemd pre code,");
    expect(b).toContain("#wemd pre code.hljs,");
    expect(b).toContain("#wemd pre code:not(.hljs)");
    expect(b).toContain("padding: 14px 16px;");
  });

  it("applies the configured line height", () => {
    expect(inner(v({ codeBlockLineHeight: 1.75 }))).toContain(
      "line-height: 1.75;",
    );
  });

  it("contain-width keeps a long line inside the column and scrolls it", () => {
    const css = v({ codeBlockContainWidth: true, codeBlockRadius: 4 });
    expect(inner(css)).toContain("min-width: 0;");
    expect(outer(css)).toContain("overflow-x: hidden;");
    expect(outer(css)).toContain("border-radius: 4px;");
  });

  it("out-of-range radius is dropped, not clamped into the output", () => {
    expect(v({ codeBlockRadius: 9999 })).toBe(frozenDefault);
  });
});

describe("inline code", () => {
  it("sizes and pads independently of the code block", () => {
    const css = v({
      inlineCodeFontSize: 13,
      inlineCodePaddingX: 4,
      inlineCodePaddingY: 1,
    });
    const b = inline(css);
    expect(b).toContain("font-size: 13px;");
    expect(b).toContain("padding: 1px 4px;");
    expect(b).not.toContain("line-height");
  });

  it("adds a longhand border when a width is set", () => {
    const css = v({
      inlineCodeBorderWidth: 1,
      codeBlockBorderColor: "#DDE7DF",
    });
    const b = inline(css);
    expect(b).toContain("border-width: 1px;");
    expect(b).toContain("border-style: solid;");
    expect(b).toContain("border-color: #DDE7DF;");
  });

  it("uses a variable for the border color but keeps longhands", () => {
    const b = inline(v({ inlineCodeBorderWidth: 1 }));
    expect(b).toContain("border-color: var(--wemd-primary-color-50);");
    expect(b).toContain("border-width: 1px;");
    expect(b).not.toMatch(/border: /);
  });

  it("zero width clears the border", () => {
    expect(inline(v({ inlineCodeBorderWidth: 0 }))).toContain(
      "border-width: 0;",
    );
  });
});

describe("reading edition code presets", () => {
  it("reproduces 青岚 framed code block", () => {
    const css = v({
      codeBackground: "#F3F7F4",
      codeFontSize: 13,
      codeBlockBorder: "full",
      codeBlockBorderColor: "#DDE7DF",
      codeBlockRadius: 4,
      codeBlockPaddingX: 16,
      codeBlockPaddingY: 14,
      codeBlockLineHeight: 1.75,
      codeBlockContainWidth: true,
    });
    expect(css).toContain("--wemd-code-background: #F3F7F4;");
    expect(outer(css)).toContain("border-color: #DDE7DF;");
    expect(outer(css)).toContain("border-radius: 4px;");
    expect(inner(css)).toContain("padding: 14px 16px;");
    expect(inner(css)).toContain("line-height: 1.75;");
    expect(inner(css)).toContain("min-width: 0;");
  });

  it("reproduces 墨刊 left-rule-only code block", () => {
    const css = v({
      codeBlockBorder: "left",
      codeBlockBorderColor: "#CFCFCB",
      codeBlockRadius: 0,
    });
    expect(outer(css)).toContain("border-width: 0 0 0 1px;");
    expect(outer(css)).toContain("border-radius: 0px;");
  });
});

describe("code fields reject unsafe input", () => {
  it.each([
    ["未知枚举", "dotted"],
    ["非字符串", 3],
    ["null", null],
  ])("非法 codeBlockBorder（%s）逐字回退到冻结基线", (unused, value) => {
    expect(v({ codeBlockBorder: value as never })).toBe(frozenDefault);
  });

  it.each([
    ["颜色名", "red"],
    ["注入", "#fff; color: red"],
    ["非字符串", 7],
  ])("非法 codeBlockBorderColor（%s）不进入 CSS", (unused, value) => {
    const css = v({
      codeBlockBorder: "full",
      codeBlockBorderColor: value as never,
    });
    expect(css).toContain("border-color: #DDE7DF;");
    expect(css).not.toContain("color: red");
    expect(css).not.toContain("border-color: red");
  });

  it.each([
    ["超上限", 90],
    ["负值", -2],
    ["字符串", "2px"],
    ["NaN", NaN],
  ])("非法 codeBlockBorderWidth（%s）退回 1px", (unused, value) => {
    expect(
      outer(
        v({ codeBlockBorder: "full", codeBlockBorderWidth: value as never }),
      ),
    ).toContain("border-width: 1px;");
  });

  it.each([
    ["真值字符串", "yes"],
    ["数字", 1],
    ["null", null],
  ])(
    "非布尔 codeBlockContainWidth（%s）逐字回退到冻结基线",
    (unused, value) => {
      expect(v({ codeBlockContainWidth: value as never })).toBe(frozenDefault);
    },
  );

  it("非法行高不产生覆盖", () => {
    expect(v({ codeBlockLineHeight: 0.2 })).toBe(frozenDefault);
  });
});
