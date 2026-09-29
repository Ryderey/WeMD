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

const blockAt = (css: string, marker: string) => {
  const start = css.lastIndexOf(marker);
  return start < 0 ? "" : css.slice(start, css.indexOf("\n}", start) + 2);
};

describe("rules table preset", () => {
  it("draws only horizontal separators with longhands", () => {
    const css = v({ tableStyle: "rules" });
    const cells = blockAt(css, "#wemd th,\n#wemd td {");
    expect(cells).toContain("border-width: 0;");
    expect(cells).toContain("border-bottom-width: 1px;");
    expect(cells).toContain(
      "border-bottom-color: var(--wemd-table-border-color);",
    );
    expect(cells).toContain("padding: 10px 8px;");
    expect(cells).toContain("font-size: 13.5px;");
    expect(cells).not.toMatch(/\bborder: /);
  });

  it("gives the container a top rule and the table a fixed layout", () => {
    const css = v({ tableStyle: "rules" });
    const container = blockAt(css, "#wemd .table-container {");
    expect(container).toContain("border-top-width: 1px;");
    expect(container).toContain("border-top-style: solid;");
    const table = blockAt(css, "#wemd table {");
    expect(table).toContain("table-layout: fixed;");
    expect(table).toContain("border-collapse: separate;");
    expect(table).toContain("border-spacing: 0;");
    expect(table).toContain("font-variant-numeric: tabular-nums;");
  });

  it("keeps header weight and cell background distinct", () => {
    const css = v({ tableStyle: "rules" });
    expect(blockAt(css, "#wemd th {")).toContain("font-weight: 600;");
    expect(blockAt(css, "#wemd td {")).toContain(
      "background-color: transparent;",
    );
  });

  it("grid 与非法取值都不产生覆盖", () => {
    expect(v({ tableStyle: "grid" })).toBe(frozenDefault);
    expect(v({ tableStyle: "zebra" as never })).toBe(frozenDefault);
    expect(v({ tableStyle: null as never })).toBe(frozenDefault);
  });
});

describe("fill image preset", () => {
  it("makes small images span the column and spaces the caption", () => {
    const css = v({ imageLayout: "fill" });
    expect(blockAt(css, "#wemd img {")).toContain("width: 100%;");
    // 图与图注之间只留 8px，图注下方才是整段的外距。
    expect(blockAt(css, "#wemd img {")).toContain(
      "margin: var(--wemd-image-margin) 0 8px;",
    );
    expect(blockAt(css, "#wemd figure {")).toContain("margin: 0;");
    const caption = blockAt(css, "#wemd figcaption {");
    expect(caption).toContain("line-height: 1.65;");
    expect(caption).toContain("margin: 0 0 var(--wemd-image-margin);");
  });

  it.each([
    ["contain", "contain"],
    ["非法", "stretch"],
    ["null", null],
  ])("imageLayout=%s 不产生覆盖", (unused, value) => {
    expect(v({ imageLayout: value as never })).toBe(frozenDefault);
  });
});

describe("reading list preset", () => {
  it("separates indent, container and item spacing", () => {
    const css = v({ listLayout: "reading" });
    const list = blockAt(css, "#wemd ul,\n#wemd ol {");
    expect(list).toContain("padding-left: 1.25em;");
    expect(list).toContain("margin: 18px 0 var(--wemd-paragraph-margin);");
    expect(blockAt(css, "#wemd li {")).toContain("margin: 0 0 6px;");
    expect(blockAt(css, "#wemd ul ul,\n#wemd ol ol {")).toContain(
      "margin: 6px 0 0;",
    );
  });

  it("styles the section that actually holds list text", () => {
    const css = v({ listLayout: "reading" });
    const section = blockAt(css, "#wemd li section {");
    expect(section).toContain("font-size: var(--wemd-font-size);");
    expect(section).toContain("font-weight: 400;");
    expect(section).toContain("line-height: var(--wemd-line-height);");
    // 基准 composition 里条目正文带 5px 上下外距，全为 0 会让列表比模板紧一截
    expect(section).toContain("margin: 5px 0;");
    expect(section).toContain("color: var(--wemd-text-color);");
  });

  it("default 与非法取值不产生覆盖", () => {
    expect(v({ listLayout: "default" })).toBe(frozenDefault);
    expect(v({ listLayout: "compact" as never })).toBe(frozenDefault);
  });
});

describe("presets are append-only", () => {
  it("三个 preset 同时开启时，冻结基线仍是前缀", () => {
    const css = v({
      tableStyle: "rules",
      imageLayout: "fill",
      listLayout: "reading",
    });
    expect(css.startsWith(frozenDefault.trimEnd())).toBe(true);
  });

  it("reproduces 青岚的表格与列表形态", () => {
    const css = v({
      primaryColor: "#27675C",
      tableBorderColor: "#DDE7DF",
      tableHeaderBackground: "#F4F7F4",
      tableHeaderColor: "#27675C",
      tableZebra: false,
      tableStyle: "rules",
      listLayout: "reading",
      imageLayout: "fill",
    });
    expect(css).toContain("--wemd-table-border-color: #DDE7DF;");
    expect(css).not.toContain("#wemd tr:nth-child(even)");
    expect(blockAt(css, "#wemd th,\n#wemd td {")).toContain(
      "border-bottom-color: var(--wemd-table-border-color);",
    );
  });
});
