// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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

describe("imageflow reading layout", () => {
  it("容器距、滑动图片零外距与图注间距一次给全", () => {
    expect(ov({ imageflowLayout: "reading" })).toBe(
      `
#wemd .imageflow-layer1 {
  margin: var(--wemd-paragraph-margin) 0 8px;
}
#wemd .imageflow-img {
  margin: 0;
  box-shadow: none;
  border-radius: 2px;
}
#wemd .imageflow-caption {
  margin: 6px 0 0;
  text-indent: 0;
}
`,
    );
  });

  it("只用设计器自身的选择器，不为假设的组合提高特异性", () => {
    const block = ov({ imageflowLayout: "reading" });
    expect(block).toContain("#wemd .imageflow-img {");
    expect(block).not.toContain("#wemd img.imageflow-img");
    expect(block).not.toContain("#wemd p.imageflow-caption");
    expect(block).not.toContain("#wemd section.imageflow-layer1");
  });

  it("清掉的是普通图片与段落规则对专用元素的影响", () => {
    const block = ov({ imageflowLayout: "reading" });
    expect(block).toContain("margin: 0;");
    expect(block).toContain("box-shadow: none;");
    expect(block).toContain("text-indent: 0;");
  });

  it("缺省与非取值都逐字回退到冻结基线", () => {
    expect(ov({})).toBe("");
    expect(ov({ imageflowLayout: "default" as const })).toBe("");
    expect(ov({ imageflowLayout: "reading " as never })).toBe("");
    expect(full({ imageflowLayout: undefined })).toBe(frozenDefault);
  });
});

describe("equation width guard", () => {
  it("给块级与行内公式的 svg 补上 max-width", () => {
    expect(ov({ equationMaxWidth: true })).toBe(
      `
#wemd .block-equation svg {
  max-width: 100% !important;
}
#wemd .inline-equation svg {
  max-width: 100%;
  vertical-align: middle;
}
`,
    );
  });

  it("非布尔值不产生覆盖", () => {
    expect(ov({ equationMaxWidth: "yes" as never })).toBe("");
    expect(ov({ equationMaxWidth: 1 as never })).toBe("");
    expect(ov({ equationMaxWidth: false })).toBe("");
    expect(full({ equationMaxWidth: false })).toBe(frozenDefault);
  });
});
