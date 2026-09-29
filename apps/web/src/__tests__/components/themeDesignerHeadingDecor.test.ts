// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";
import type {
  DesignerVariables,
  HeadingStyle,
} from "../../components/Theme/ThemeDesigner/types";

const frozenDefault = readFileSync(
  new URL("../fixtures/designer-baseline/default.css", import.meta.url),
  "utf8",
);

const v = (overrides: Partial<DesignerVariables>) =>
  generateCSS({ ...defaultVariables, ...overrides });

const h = (
  level: "h1" | "h2" | "h3" | "h4",
  overrides: Partial<HeadingStyle>,
): HeadingStyle => ({ ...defaultVariables[level], ...overrides });

const minor = (overrides: Partial<HeadingStyle>): HeadingStyle => ({
  fontSize: 14,
  color: "#3D4841",
  marginTop: 20,
  marginBottom: 10,
  ...overrides,
});

const block = (css: string, selector: string) => {
  const start = css.indexOf(selector);
  return start < 0 ? "" : css.slice(start, css.indexOf("\n}", start) + 2);
};

describe("heading line-height, font and hairline", () => {
  it("emits the per-level line height when valid", () => {
    expect(
      block(v({ h2: h("h2", { lineHeight: 1.55 }) }), "#wemd h2 .content"),
    ).toContain("line-height: 1.55;");
  });

  it("normalizes quotes in the per-level font stack", () => {
    const css = v({
      h2: h("h2", { fontFamily: '"Songti SC", SimSun, serif' }),
    });
    expect(block(css, "#wemd h2 .content")).toContain(
      "font-family: 'Songti SC', SimSun, serif;",
    );
  });

  it("emits the hairline below a heading with its gap", () => {
    const css = v({
      h1: h("h1", {
        ruleBelowWidth: 1,
        ruleBelowColor: "#DDE7DF",
        ruleBelowGap: 8,
      }),
    });
    const b = block(css, "#wemd h1 .content");
    expect(b).toContain("border-bottom: 1px solid #DDE7DF;");
    expect(b).toContain("padding-bottom: 8px;");
  });

  it("needs both width and color, otherwise no hairline is emitted", () => {
    expect(v({ h1: h("h1", { ruleBelowWidth: 1 }) })).toBe(frozenDefault);
    expect(v({ h1: h("h1", { ruleBelowColor: "#DDE7DF" }) })).toBe(
      frozenDefault,
    );
  });

  it("reproduces 墨刊 serif heading and 青岚 h1 hairline together", () => {
    const css = v({
      h1: h("h1", {
        fontSize: 24,
        lineHeight: 1.5,
        color: "#3D4841",
        ruleBelowWidth: 1,
        ruleBelowColor: "#DDE7DF",
        ruleBelowGap: 8,
      }),
      h2: h("h2", {
        fontFamily: "Songti SC, Noto Serif CJK SC, SimSun, serif",
        fontSize: 22,
        lineHeight: 1.55,
        color: "#272727",
      }),
    });

    const h1 = block(css, "#wemd h1 .content");
    expect(h1).toContain("line-height: 1.5;");
    expect(h1).toContain("border-bottom: 1px solid #DDE7DF;");
    const h2 = block(css, "#wemd h2 .content");
    expect(h2).toContain(
      "font-family: Songti SC, Noto Serif CJK SC, SimSun, serif;",
    );
    expect(h2).toContain("line-height: 1.55;");
    // 字号与颜色沿用设计器的 CSS 变量通道，不在 .content 里写死
    expect(css).toContain("--wemd-h2-font-size: 22px;");
    expect(css).toContain("--wemd-h2-color: #272727;");
  });
});

describe("h5 and h6 generation", () => {
  it("emits rules only when the level is configured", () => {
    expect(v({})).not.toContain("#wemd h5");
    const css = v({
      h5: minor({ fontWeight: "700" }),
    });
    const b = block(css, "#wemd h5 .content");
    expect(b).toContain("font-size: 14px;");
    expect(b).toContain("color: #3D4841;");
    expect(b).toContain("font-weight: 700;");
    expect(css).toContain(
      "#wemd h5 .prefix,\n#wemd h5 .suffix {\n  display: none;\n}",
    );
  });

  it("h6 is independent of h5", () => {
    const css = v({ h6: minor({ fontSize: 13, color: "#6D786F" }) });
    expect(css).not.toContain("#wemd h5");
    expect(css).toContain("#wemd h6 .content");
  });
});

describe("heading fields reject unsafe runtime input", () => {
  it.each([
    ["注入分号", { fontFamily: "PingFang SC; color: red" }],
    ["注入闭合括号", { fontFamily: "X} body {display:none" }],
    ["标签", { fontFamily: "<script>" }],
    ["超长串", { fontFamily: "A".repeat(300) }],
    ["非字符串", { fontFamily: 42 as never }],
  ])("非法字体栈（%s）逐字回退到冻结基线", (unused, overrides) => {
    expect(v({ h2: h("h2", overrides) })).toBe(frozenDefault);
  });

  it.each([
    ["非 hex", "#GGHHII"],
    ["颜色名", "red"],
    ["注入", "#fff; color: red"],
    ["非字符串", 123],
  ])("非法细线颜色（%s）逐字回退到冻结基线", (unused, color) => {
    expect(
      v({ h1: h("h1", { ruleBelowWidth: 1, ruleBelowColor: color as never }) }),
    ).toBe(frozenDefault);
  });

  it.each([
    ["零宽", 0],
    ["超上限", 12],
    ["字符串", "1px"],
    ["负值", -1],
  ])("非法细线宽度（%s）逐字回退到冻结基线", (unused, width) => {
    expect(
      v({
        h1: h("h1", {
          ruleBelowWidth: width as never,
          ruleBelowColor: "#DDE7DF",
        }),
      }),
    ).toBe(frozenDefault);
  });

  it.each([
    ["过小", 0.2],
    ["过大", 9],
    ["NaN", NaN],
    ["带单位", "1.9em"],
    ["注入", "1.9; color: red"],
  ])("非法行高（%s）逐字回退到冻结基线", (unused, value) => {
    expect(v({ h2: h("h2", { lineHeight: value as never }) })).toBe(
      frozenDefault,
    );
  });

  it("数值字符串行高按全局 lineHeight 的既有约定接受", () => {
    expect(
      block(
        v({ h2: h("h2", { lineHeight: "1.9" as never }) }),
        "#wemd h2 .content",
      ),
    ).toContain("line-height: 1.9;");
  });

  it("非法字重回退到 bold，不引入注入", () => {
    const css = v({ h5: minor({ fontWeight: "bold; color: red" as never }) });
    expect(block(css, "#wemd h5 .content")).toContain("font-weight: bold;");
    expect(css).not.toContain("color: red");
  });

  it("h5 字号非法时整块不输出", () => {
    expect(v({ h5: minor({ fontSize: 0 }) })).toBe(frozenDefault);
    expect(v({ h5: minor({ fontSize: 999 }) })).toBe(frozenDefault);
  });
});
