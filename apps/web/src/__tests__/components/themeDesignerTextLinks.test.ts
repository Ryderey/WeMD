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

describe("link underline mode", () => {
  it("switches to text-decoration and drops the border", () => {
    const css = v({ linkUnderlineMode: "text" });
    const overrideStart = css.indexOf("text-underline-offset");
    expect(overrideStart).toBeGreaterThan(css.indexOf("#wemd a {"));
    const tail = css.slice(css.lastIndexOf("#wemd a {"));
    expect(tail).toContain("text-decoration: underline;");
    expect(tail).toContain("text-underline-offset: 2px;");
    expect(tail).toContain("border-bottom: none;");
  });

  it("honours an explicit offset", () => {
    expect(v({ linkUnderlineMode: "text", linkUnderlineOffset: 4 })).toContain(
      "text-underline-offset: 4px;",
    );
  });

  it("out-of-range offset falls back to the default offset, not to raw input", () => {
    const css = v({ linkUnderlineMode: "text", linkUnderlineOffset: 9999 });
    expect(css).toContain("text-underline-offset: 2px;");
    expect(css).not.toContain("9999");
  });

  it.each([
    ["未知枚举", "wavy"],
    ["非字符串", 5],
    ["null", null],
    ["border", "border"],
  ])("非法 linkUnderlineMode（%s）逐字回退到冻结基线", (unused, value) => {
    expect(v({ linkUnderlineMode: value as never })).toBe(frozenDefault);
  });
});

describe("strikethrough coverage", () => {
  it("mirrors the del styling onto the <s> element Markdown produces", () => {
    const css = v({ delCoversStrikethrough: true });
    const start = css.indexOf("#wemd s {");
    expect(start).toBeGreaterThan(0);
    const block = css.slice(start, css.indexOf("}", start));
    expect(block).toContain("text-decoration: line-through;");
    expect(block).toContain("color: var(--wemd-del-color);");
    expect(block).toContain("font-style: normal;");
  });

  it("keeps the del rule itself untouched", () => {
    expect(v({ delCoversStrikethrough: true })).toContain(
      "#wemd del {\n  text-decoration: line-through;\n  color: var(--wemd-del-color);\n}",
    );
  });

  it.each([
    ["真值字符串", "yes"],
    ["数字", 1],
    ["对象", {}],
    ["null", null],
  ])(
    "非布尔的 delCoversStrikethrough（%s）逐字回退到冻结基线",
    (unused, value) => {
      expect(v({ delCoversStrikethrough: value as never })).toBe(frozenDefault);
    },
  );
});

describe("hanging footnote layout", () => {
  it("gives the number a fixed width and hangs the item text", () => {
    const css = v({ footnoteLayout: "hanging" });
    const num = css.slice(css.lastIndexOf("#wemd .footnote-num {"));
    expect(num).toContain("display: inline-block;");
    expect(num).toContain("width: 22px;");
    expect(num).toContain("opacity: 1;");
    expect(num).toContain("font-weight: 400;");

    const item = css.slice(css.lastIndexOf("#wemd .footnote-item p {"));
    expect(item).toContain("display: block;");
    expect(item).toContain("padding-left: 22px;");
    expect(item).toContain("text-indent: -22px;");
    expect(item).toContain("word-break: normal;");
  });

  it("悬挂布局同时给脚注区自己的分隔间距", () => {
    const css = v({ footnoteLayout: "hanging" });
    const sep = css.slice(css.lastIndexOf("#wemd .footnotes-sep {"));
    expect(sep).toContain("border-top-width: 0;");
    expect(sep).toContain("margin: 34px 0 22px;");
    expect(sep).toContain("padding: 2px 0 4px;");
  });

  it("纯文字标题只追加排版，不改 extras.ts 里任何既有分支", () => {
    const css = v({ footnoteHeaderStyle: "plain" });
    const before = css.slice(css.lastIndexOf("#wemd .footnotes-sep:before {"));
    expect(before).toContain("font-weight: 600;");
    expect(before).toContain("font-size: 13px;");
    expect(before).toContain("line-height: 1.6;");
    expect(before).toContain("margin-bottom: 14px;");
    expect(before).not.toContain("border-left:");
    // 既有样式分支的输出必须一字不变
    expect(v({ footnoteHeaderStyle: "left-border" })).toBe(frozenDefault);
  });

  it("keeps number and indent widths in sync", () => {
    const css = v({ footnoteLayout: "hanging", footnoteNumberWidth: 26 });
    expect(css).toContain("width: 26px;");
    expect(css).toContain("padding-left: 26px;");
    expect(css).toContain("text-indent: -26px;");
  });

  it("applies the configured line height and font size", () => {
    const css = v({
      footnoteLayout: "hanging",
      footnoteLineHeight: 1.9,
      footnoteFontSize: 13,
    });
    expect(css).toContain("line-height: 1.9;");
    expect(css).toContain("font-size: 13px;");
  });

  it("clamps out-of-range numbers instead of emitting them", () => {
    const css = v({
      footnoteLayout: "hanging",
      footnoteNumberWidth: 5000,
      footnoteLineHeight: 40,
      footnoteFontSize: 900,
    });
    expect(css).toContain("width: 22px;");
    expect(css).toContain("line-height: 1.8;");
    expect(css).not.toContain("5000");
    expect(css).not.toContain("line-height: 40");
  });

  it.each([
    ["未知布局", "grid"],
    ["非字符串", 7],
    ["null", null],
  ])("非法 footnoteLayout（%s）逐字回退到冻结基线", (unused, value) => {
    expect(v({ footnoteLayout: value as never })).toBe(frozenDefault);
  });
});

describe("link underline switch", () => {
  it("关掉显示下划线时，text 模式不会把下划线加回来", () => {
    const css = v({ linkUnderlineMode: "text", linkUnderline: false });
    const tail = css.slice(css.lastIndexOf("#wemd a {"));
    expect(tail).toContain("text-decoration: none;");
    expect(tail).not.toContain("text-underline-offset");
  });
});

describe("overrides are appended, never interleaved", () => {
  it("the frozen default CSS is a prefix of a fully overridden theme", () => {
    const css = v({
      linkUnderlineMode: "text",
      delCoversStrikethrough: true,
      footnoteLayout: "hanging",
    });
    expect(css.startsWith(frozenDefault.trimEnd())).toBe(true);
  });
});
