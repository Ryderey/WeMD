import { describe, expect, it } from "vitest";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateVariables } from "../../components/Theme/ThemeDesigner/generators/variables";

describe("theme designer variables generator", () => {
  it("keeps page padding on #wemd root for live preview", () => {
    const css = generateVariables(defaultVariables, "PingFang SC, sans-serif");

    expect(css).toContain("--wemd-page-padding: 8px;");
    expect(css).toContain("padding: 0 var(--wemd-page-padding);");
    expect(css).not.toContain("#wemd > *");
  });

  it("keeps solid theme color separate from optional gradient paint", () => {
    const css = generateVariables(
      {
        ...defaultVariables,
        primaryColor: "#07C160",
        primaryGradient:
          "linear-gradient(135deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
      },
      "PingFang SC, sans-serif",
    );

    expect(css).toContain("--wemd-primary-color: #07C160;");
    expect(css).toContain(
      "--wemd-primary-gradient: linear-gradient(135deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%);",
    );
    expect(css).toContain(
      "--wemd-primary-gradient-20: linear-gradient(135deg, rgba(65, 88, 208, 0.12)",
    );
  });

  it("uses previous solid fallbacks when no gradient is selected", () => {
    const css = generateVariables(
      { ...defaultVariables, primaryGradient: "" },
      "PingFang SC, sans-serif",
    );

    expect(css).toContain("--wemd-primary-gradient: #07C160;");
    expect(css).toContain(
      "--wemd-primary-gradient-line: linear-gradient(to right, transparent, rgba(7, 193, 96, 0.5), transparent);",
    );
  });
});
