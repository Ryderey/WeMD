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

const hrBlock = (css: string) => {
  const start = css.indexOf("#wemd hr {");
  return start < 0 ? "" : css.slice(start, css.indexOf("\n}", start) + 2);
};

describe("divider width, alignment and independent spacing", () => {
  it("emits the width after the style block so it wins over the preset", () => {
    const b = hrBlock(v({ hrWidth: 28 }));
    expect(b).toContain("width: 28px;");
    expect(b.indexOf("width: 28px;")).toBeGreaterThan(b.indexOf("border-top:"));
  });

  it("a short centered divider uses auto side margins", () => {
    const b = hrBlock(v({ hrWidth: 28, hrAlign: "center" }));
    expect(b).toContain(
      "margin: var(--wemd-hr-margin) auto var(--wemd-hr-margin);",
    );
    expect(b).toContain("width: 28px;");
  });

  it("top and bottom spacing can differ from the shared value", () => {
    const b = hrBlock(v({ hrMarginTop: 36, hrMarginBottom: 16 }));
    expect(b).toContain("margin: 36px 0 16px;");
  });

  it("reproduces 素笺 centered hairline", () => {
    const b = hrBlock(
      v({
        hrStyle: "solid",
        hrColor: "#C8BFB2",
        hrWidth: 28,
        hrAlign: "center",
        hrMarginTop: 36,
        hrMarginBottom: 14,
      }),
    );
    expect(b).toContain("margin: 36px auto 14px;");
    expect(b).toContain(
      "border-top: var(--wemd-hr-height) solid var(--wemd-hr-color);",
    );
    expect(b).toContain("width: 28px;");
  });

  it("reproduces 朱砂 left-aligned short divider", () => {
    const b = hrBlock(
      v({
        hrWidth: 28,
        hrAlign: "left",
        hrMarginTop: 36,
        hrMarginBottom: 16,
      }),
    );
    expect(b).toContain("margin: 36px 0 16px;");
    expect(b).toContain("width: 28px;");
  });

  it("pill 预设仍保留自身形态，显式宽度在其后可覆盖", () => {
    const b = hrBlock(v({ hrStyle: "pill", hrWidth: 40 }));
    expect(b).toContain("width: 20%;");
    expect(b.indexOf("width: 40px;")).toBeGreaterThan(b.indexOf("width: 20%;"));
  });

  it.each([
    ["零宽（低于下限）", 0],
    ["超上限", 700],
    ["字符串", "28px"],
    ["NaN", NaN],
    ["null", null],
  ])("非法 hrWidth（%s）逐字回退到冻结基线", (unused, value) => {
    expect(v({ hrWidth: value as never })).toBe(frozenDefault);
  });

  it.each([
    ["负值", -1],
    ["超上限", 200],
    ["字符串", "36px"],
    ["undefined", undefined],
  ])("非法 hrMarginTop（%s）逐字回退到冻结基线", (unused, value) => {
    expect(v({ hrMarginTop: value as never })).toBe(frozenDefault);
  });

  it.each([
    ["拼错", "right"],
    ["注入", "center; color: red"],
    ["非字符串", 5],
  ])("非法 hrAlign（%s）逐字回退到冻结基线", (unused, value) => {
    expect(v({ hrAlign: value as never })).toBe(frozenDefault);
  });

  it("left 对齐在没有其它覆盖时不产生任何差异", () => {
    expect(v({ hrAlign: "left" })).toBe(frozenDefault);
  });
});
