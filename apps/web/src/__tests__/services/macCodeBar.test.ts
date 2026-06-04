import { describe, expect, it } from "vitest";
import { shouldRenderMacCodeBarNode } from "../../services/macCodeBar";

describe("shouldRenderMacCodeBarNode", () => {
  it("honors explicit showMacBar=true", () => {
    expect(shouldRenderMacCodeBarNode("", true)).toBe(true);
  });

  it("detects css that styles mac-sign nodes", () => {
    const css = `
      #wemd pre.custom > .mac-sign {
        display: block;
      }
    `;

    expect(shouldRenderMacCodeBarNode(css)).toBe(true);
  });

  it("detects apple code bar radial-gradient fallback", () => {
    const css = `
      #wemd pre {
        background-image:
          radial-gradient(circle at 18px 17px, #ff5f57 0, #ff5f57 5px, transparent 6px),
          linear-gradient(to bottom, #f2f2f7 0, #f2f2f7 34px, #f5f5f7 34px);
      }
    `;

    expect(shouldRenderMacCodeBarNode(css)).toBe(true);
  });

  it("ignores ordinary paragraph and code block css", () => {
    const paragraphCss = "#wemd p { margin: 8px 0; }";
    const codeCss = `
      #wemd pre code {
        display: block;
        padding: 16px;
        background: #f5f5f7;
      }
    `;

    expect(shouldRenderMacCodeBarNode(paragraphCss)).toBe(false);
    expect(shouldRenderMacCodeBarNode(codeCss)).toBe(false);
  });
});
