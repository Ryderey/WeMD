// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { processHtml } from "@wemd/core";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";
import { generateOptionalOverrides } from "../../components/Theme/ThemeDesigner/generators/optionalOverrides";
import type { DesignerVariables } from "../../components/Theme/ThemeDesigner/types";

const frozenDefault = readFileSync(
  new URL("../fixtures/designer-baseline/default.css", import.meta.url),
  "utf8",
);

const vars = (overrides: Partial<DesignerVariables>) => ({
  ...defaultVariables,
  ...overrides,
});
const full = (overrides: Partial<DesignerVariables>) =>
  generateCSS(vars(overrides));
const ov = (overrides: Partial<DesignerVariables>) =>
  generateOptionalOverrides(vars(overrides));

const QUOTE_CONTAINERS = `#wemd blockquote,
#wemd .multiquote-1,
#wemd .multiquote-2,
#wemd .multiquote-3 {`;

const QUOTE_PARAGRAPHS = `#wemd blockquote p,
#wemd .multiquote-1 p,
#wemd .multiquote-2 p,
#wemd .multiquote-3 p {`;

const QUOTE_LAST_PARAGRAPHS = `#wemd blockquote p:last-child,
#wemd .multiquote-1 p:last-child,
#wemd .multiquote-2 p:last-child,
#wemd .multiquote-3 p:last-child {`;

const CALLOUT_VARIANTS = `#wemd .callout-note,
#wemd .callout-tip,
#wemd .callout-important,
#wemd .callout-warning,
#wemd .callout-caution {`;

describe("quote asymmetric padding, indent, paragraph gap and font", () => {
  it("只改一侧内距，另一侧沿用对称值", () => {
    expect(ov({ quotePaddingLeft: 32 })).toContain(
      "padding: 12px 16px 12px 32px;",
    );
    expect(ov({ quotePaddingRight: 0 })).toContain(
      "padding: 12px 0px 12px 16px;",
    );
  });

  it("悬挂缩进同时落在引用容器与引用内的 p", () => {
    const block = ov({ quoteIndent: 16 });
    expect(block).toContain(`${QUOTE_CONTAINERS}\n  text-indent: -16px;\n}`);
    expect(block).toContain(`${QUOTE_PARAGRAPHS}\n  text-indent: -16px;\n}`);
  });

  it("缩进为 0 表示显式取消首行缩进", () => {
    expect(ov({ quoteIndent: 0 })).toContain("text-indent: 0px;");
  });

  it("多段引用有段距，末段不带段后距", () => {
    const block = ov({ quoteParagraphGap: 10 });
    expect(block).toContain(
      `${QUOTE_PARAGRAPHS}\n  margin: 0 0 10px !important;\n}`,
    );
    expect(block).toContain(
      `${QUOTE_LAST_PARAGRAPHS}\n  margin-bottom: 0 !important;\n}`,
    );
  });

  it("引用字体同时作用到容器与 p，因为全局 p 自带字体", () => {
    const block = ov({
      quoteFontFamily: "Songti SC, Noto Serif CJK SC, SimSun, serif",
    });
    const family = "font-family: Songti SC, Noto Serif CJK SC, SimSun, serif;";
    expect(block.split(family)).toHaveLength(3);
  });

  it("只有上下横线的引用把预设自带的左线压回 0，且不引入居中", () => {
    const block = ov({ quoteBorderEdges: "top-bottom" });
    expect(block).toContain(
      `${QUOTE_CONTAINERS}
  border-width: var(--wemd-quote-border-width) 0;
  border-style: var(--wemd-quote-border-style);
  border-color: var(--wemd-quote-border-color);
}`,
    );
    expect(block).not.toContain("text-align");
  });

  it("left 与非法值都不产生覆盖", () => {
    expect(ov({ quoteBorderEdges: "left" })).toBe("");
    expect(ov({ quoteBorderEdges: "top" as never })).toBe("");
  });

  it("组合输出与预期逐字一致", () => {
    expect(
      ov({
        quotePaddingLeft: 32,
        quotePaddingRight: 16,
        quoteIndent: 16,
        quoteParagraphGap: 10,
      }),
    ).toBe(
      `\n${QUOTE_CONTAINERS}
  padding: 12px 16px 12px 32px;
  text-indent: -16px;
}

${QUOTE_PARAGRAPHS}
  text-indent: -16px;
  margin: 0 0 10px !important;
}

${QUOTE_LAST_PARAGRAPHS}
  margin-bottom: 0 !important;
}\n`,
    );
  });

  it("非法取值按未设置处理，不产生任何覆盖", () => {
    expect(ov({ quotePaddingLeft: 9999 })).toBe("");
    expect(ov({ quoteIndent: -4 })).toBe("");
    expect(ov({ quoteParagraphGap: "wide" as never })).toBe("");
    expect(ov({ quoteFontFamily: "serif; } #wemd { color: red" })).toBe("");
    expect(full({ quoteFontFamily: "serif; } #wemd { color: red" })).toBe(
      frozenDefault,
    );
  });
});

describe("quote overrides survive the WeChat inliner", () => {
  it("juice 能把段间距与末段归零内联到真实节点上", () => {
    const out = processHtml(
      `<blockquote><p>第一段</p><p>第二段</p></blockquote>`,
      full({
        quoteParagraphGap: 10,
        quoteIndent: 16,
        quotePaddingLeft: 32,
      }),
      true,
      false,
    );
    const [first, last] = out.match(/<p[^>]*style="[^"]*"/g) ?? [];
    expect(first).toContain("margin: 0 0 10px !important");
    expect(first).toContain("text-indent: -16px");
    expect(last).toContain("margin-bottom: 0 !important");
    expect(out).toContain("padding: 12px 16px 12px 32px");
  });
});

describe("callout style mode and parameters", () => {
  it("default 模式逐字保持旧输出", () => {
    expect(ov({ calloutStyle: "default" })).toBe("");
    expect(full({ calloutStyle: "default" })).toBe(frozenDefault);
  });

  it("primary 模式统一底色并让五变体左线跟随主题色", () => {
    expect(ov({ calloutStyle: "primary" })).toBe(
      `\n#wemd .callout {
  background-color: var(--wemd-primary-color-20);
}
#wemd .callout-title {
  color: var(--wemd-primary-color);
}
${CALLOUT_VARIANTS}
  border-left-width: 4px;
  border-left-style: solid;
  border-left-color: var(--wemd-primary-color);
}\n`,
    );
  });

  it("细项块排在样式模式之后，显式值优先", () => {
    const block = ov({
      calloutStyle: "primary",
      calloutBackground: "#F4F8F5",
      calloutTitleColor: "#27675C",
    });
    expect(block.lastIndexOf("background-color: #F4F8F5;")).toBeGreaterThan(
      block.indexOf("background-color: var(--wemd-primary-color-20);"),
    );
    expect(block).toContain(
      `${CALLOUT_VARIANTS}
  border-left-width: 4px;
  border-left-style: solid;
  border-left-color: var(--wemd-primary-color);
}`,
    );
    expect(
      block.lastIndexOf("#wemd .callout-title {\n  color: #27675C;\n}"),
    ).toBeGreaterThan(
      block.indexOf(
        "#wemd .callout-title {\n  color: var(--wemd-primary-color);\n}",
      ),
    );
  });

  it("内距与标题/正文细项分块写出", () => {
    const block = ov({
      calloutPaddingX: 16,
      calloutPaddingY: 14,
      calloutTitleFontSize: 13,
      calloutBodyFontSize: 13,
      calloutBodyColor: "#6D786F",
    });
    expect(block).toContain("#wemd .callout {\n  padding: 14px 16px;\n}");
    expect(block).toContain("#wemd .callout-title {\n  font-size: 13px;\n}");
    expect(block).toContain(
      "#wemd .callout p {\n  font-size: 13px;\n  color: #6D786F;\n}",
    );
  });

  it("只设一侧内距时另一侧沿用旧默认值", () => {
    expect(ov({ calloutPaddingY: 14 })).toContain("padding: 14px 16px;");
    expect(ov({ calloutPaddingX: 20 })).toContain("padding: 12px 20px;");
  });

  it("非法颜色与越界字号被丢弃，合法项照常输出", () => {
    const block = ov({
      calloutTitleColor: "red",
      calloutBodyColor: "#6D786F",
      calloutTitleFontSize: 999,
      calloutBodyFontSize: 13,
    });
    expect(block).toBe(
      "\n#wemd .callout p {\n  font-size: 13px;\n  color: #6D786F;\n}\n",
    );
    expect(block).not.toContain("color: red");
  });

  it("字段缺省时不产生提示块覆盖", () => {
    expect(ov({})).toBe("");
    expect(ov({ calloutStyle: undefined as never })).toBe("");
    expect(ov({ calloutStyle: "accent" as never })).toBe("");
  });
});
