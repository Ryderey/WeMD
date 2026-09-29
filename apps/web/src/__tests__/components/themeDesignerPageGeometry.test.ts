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

describe("root typography switch", () => {
  it("开启后根节点给出行高与断行，并把链接的 break-all 收回", () => {
    const css = v({ rootTypography: true });
    expect(css).toContain(`#wemd {
  line-height: var(--wemd-line-height);
  word-break: break-word;
}`);
    expect(css).toContain(`#wemd a {
  word-break: break-word;
}`);
  });

  it("缺省与非布尔值都不产生任何覆盖", () => {
    expect(v({})).toBe(frozenDefault);
    expect(v({ rootTypography: "yes" as never })).toBe(frozenDefault);
    expect(v({ rootTypography: false })).toBe(frozenDefault);
  });
});

describe("page geometry fields", () => {
  it("emits the vertical page padding when set", () => {
    expect(v({ pagePaddingY: 5 })).toContain(
      "padding: 5px var(--wemd-page-padding);",
    );
    expect(v({ pagePaddingY: 0 })).toContain(
      "padding: 0px var(--wemd-page-padding);",
    );
  });

  it("emits the content max width with centering when set", () => {
    const css = v({ pageMaxWidth: 677 });
    expect(css).toContain("max-width: 677px;");
    expect(css).toContain("margin: 0 auto;");
  });

  it("keeps the paragraph margin symmetric unless overridden", () => {
    expect(v({ paragraphMarginBottom: 25 })).toContain(
      "margin: var(--wemd-paragraph-margin) 0 25px;",
    );
    expect(v({ paragraphMarginTop: 0, paragraphMarginBottom: 25 })).toContain(
      "margin: 0px 0 25px;",
    );
    expect(v({ paragraphMarginTop: 18 })).toContain(
      "margin: 18px 0 var(--wemd-paragraph-margin);",
    );
  });

  it("reproduces the reading edition's page and paragraph geometry", () => {
    const css = v({
      pagePadding: 22,
      pagePaddingY: 5,
      pageMaxWidth: 677,
      paragraphMarginTop: 0,
      paragraphMarginBottom: 25,
      textJustify: false,
    });

    expect(css).toContain("padding: 5px var(--wemd-page-padding);");
    expect(css).toContain("max-width: 677px;");
    expect(css).toContain("margin: 0px 0 25px;");
    expect(css).not.toContain("text-align: justify;");
  });

  it.each([
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["负值", -1],
    ["字符串", "5px"],
    ["null", null],
    ["对象", {}],
    ["布尔", true],
    ["超出上限", 9999],
  ])("非法的 pagePaddingY（%s）逐字回退到冻结基线", (unused, value) => {
    expect(v({ pagePaddingY: value as never })).toBe(frozenDefault);
  });

  it.each([
    ["NaN", NaN],
    ["负值", -100],
    ["字符串", "677px"],
    ["undefined", undefined],
    ["对象", []],
    ["低于下限", 120],
    ["超出上限", 5000],
  ])("非法的 pageMaxWidth（%s）逐字回退到冻结基线", (unused, value) => {
    expect(v({ pageMaxWidth: value as never })).toBe(frozenDefault);
  });

  it.each([
    ["NaN", NaN],
    ["负值", -5],
    ["字符串", "25px"],
    ["null", null],
    ["超出上限", 500],
  ])("非法的段距覆盖值（%s）逐字回退到冻结基线", (unused, value) => {
    expect(
      v({
        paragraphMarginTop: value as never,
        paragraphMarginBottom: value as never,
      }),
    ).toBe(frozenDefault);
  });
});
