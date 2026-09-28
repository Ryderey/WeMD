import { describe, expect, it } from "vitest";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateVariables } from "../../components/Theme/ThemeDesigner/generators/variables";
import { generateGlobal } from "../../components/Theme/ThemeDesigner/generators/global";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";
import type { DesignerVariables } from "../../components/Theme/ThemeDesigner/types";

const variablesFor = (overrides: Partial<DesignerVariables> = {}) =>
  generateVariables(
    { ...defaultVariables, ...overrides },
    "PingFang SC, sans-serif",
  );

const strongRuleFor = (overrides: Partial<DesignerVariables> = {}) =>
  generateGlobal({ ...defaultVariables, ...overrides });

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

  it("applies only non-transparent article backgrounds to #wemd", () => {
    const transparentCss = generateVariables(
      defaultVariables,
      "PingFang SC, sans-serif",
    );
    const coloredCss = generateVariables(
      { ...defaultVariables, pageBackgroundColor: "#F2FAF5" },
      "PingFang SC, sans-serif",
    );

    expect(transparentCss).not.toContain("background-color:");
    expect(coloredCss).toContain("background-color: #F2FAF5;");
  });

  it("keeps legacy variables without article background transparent", () => {
    const legacyVariables = { ...defaultVariables };
    delete legacyVariables.pageBackgroundColor;
    const css = generateVariables(legacyVariables, "PingFang SC, sans-serif");

    expect(css).not.toContain("background-color:");
  });

  it("falls back to the theme color when no strong accent is configured", () => {
    const css = variablesFor({
      primaryColor: "#722ED1",
      strongAccentColor: "",
    });

    expect(css).toContain("--wemd-strong-accent-color: #722ED1;");
    expect(css).toContain(
      "--wemd-strong-accent-color-12: rgba(114, 46, 209, 0.12);",
    );
    expect(css).toContain(
      "--wemd-strong-accent-color-18: rgba(114, 46, 209, 0.18);",
    );
  });

  it("emits the independent accent color and its two alpha steps", () => {
    const css = variablesFor({
      primaryColor: "#722ED1",
      strongAccentColor: "#FA5151",
    });

    expect(css).toContain("--wemd-strong-accent-color: #FA5151;");
    expect(css).toContain(
      "--wemd-strong-accent-color-12: rgba(250, 81, 81, 0.12);",
    );
    expect(css).toContain(
      "--wemd-strong-accent-color-18: rgba(250, 81, 81, 0.18);",
    );
    expect(css).toContain("--wemd-primary-color: #722ED1;");
  });
});

describe("strong accent CSS generation", () => {
  const accent = "#FA5151";

  it("uses the accent color for colored bold text", () => {
    const text = `color: var(--wemd-strong-accent-color);`;

    expect(
      strongRuleFor({ strongStyle: "color", strongAccentColor: accent }),
    ).toContain(text);
    expect(
      strongRuleFor({
        strongStyle: "color",
        strongAccentColor: accent,
        primaryGradient: "linear-gradient(135deg, #4158D0 0%, #FFCC70 100%)",
      }),
    ).toContain(text);
  });

  it("never makes bold text transparent while an accent is configured", () => {
    const css = strongRuleFor({
      strongStyle: "color",
      strongAccentColor: accent,
      primaryGradient: "linear-gradient(135deg, #4158D0 0%, #FFCC70 100%)",
    });

    expect(css).not.toContain("color: transparent");
    expect(css).not.toContain("--wemd-primary-gradient)");
  });

  it("paints decorations from the accent instead of the theme", () => {
    expect(
      strongRuleFor({ strongStyle: "highlighter", strongAccentColor: accent }),
    ).toContain("background: var(--wemd-strong-accent-color-12);");
    expect(
      strongRuleFor({
        strongStyle: "highlighter-bottom",
        strongAccentColor: accent,
      }),
    ).toContain(
      "background: linear-gradient(to bottom, transparent 60%, var(--wemd-strong-accent-color-18) 60%);",
    );
    expect(
      strongRuleFor({ strongStyle: "underline", strongAccentColor: accent }),
    ).toContain("border-bottom-color: var(--wemd-strong-accent-color);");
    expect(
      strongRuleFor({ strongStyle: "dot", strongAccentColor: accent }),
    ).toContain("text-emphasis-color: var(--wemd-strong-accent-color);");
  });

  it("declares the underline with border longhands", () => {
    const css = strongRuleFor({
      strongStyle: "underline",
      strongAccentColor: accent,
    });

    expect(css).toContain("border-bottom-width: 2px;");
    expect(css).toContain("border-bottom-style: solid;");
    expect(css).toContain(
      "border-bottom-color: var(--wemd-strong-accent-color);",
    );
    expect(css).toContain("padding-bottom: 1px;");
    expect(css).not.toMatch(/border-bottom:/);
  });

  it("lets the text override win over the accent color", () => {
    const css = strongRuleFor({
      strongStyle: "highlighter-bottom",
      strongAccentColor: accent,
      strongColor: "#000000",
    });

    expect(css).toContain("color: #000000;");
    expect(css).toContain(
      "background: linear-gradient(to bottom, transparent 60%, var(--wemd-strong-accent-color-18) 60%);",
    );
  });

  it("keeps basic bold inheriting its container even with an accent", () => {
    const css = strongRuleFor({
      strongStyle: "none",
      strongAccentColor: accent,
    });

    expect(css).toContain("color: inherit;");
    expect(css).not.toContain("--wemd-strong-accent-color)");
  });

  it.each([
    "",
    "   ",
    "123",
    "red",
    "rgb(1,2,3)",
    "inherit",
    "#GGHHII",
  ] as const)(
    "treats the invalid accent %s as follow-theme",
    (strongAccentColor) => {
      expect(strongRuleFor({ strongStyle: "color", strongAccentColor })).toBe(
        strongRuleFor({ strongStyle: "color", strongAccentColor: "" }),
      );
      expect(
        variablesFor({ strongStyle: "color", strongAccentColor }),
      ).toContain("--wemd-strong-accent-color: #07C160;");
    },
  );

  it("rejects non-string accents without throwing", () => {
    for (const value of [undefined, null, 42, {}, [], true]) {
      expect(() =>
        strongRuleFor({
          strongStyle: "color",
          strongAccentColor: value as never,
        }),
      ).not.toThrow();
      expect(
        strongRuleFor({
          strongStyle: "color",
          strongAccentColor: value as never,
        }),
      ).toBe(strongRuleFor({ strongStyle: "color", strongAccentColor: "" }));
    }
  });

  it("keeps bold colors independent from theme color and gradient changes", () => {
    const configured: DesignerVariables = {
      ...defaultVariables,
      primaryColor: "#722ED1",
      strongStyle: "highlighter-bottom",
      strongAccentColor: "#FA5151",
    };
    const before = generateCSS(configured);
    const after = generateCSS({
      ...configured,
      primaryColor: "#07C160",
      primaryGradient: "linear-gradient(135deg, #4158D0 0%, #FFCC70 100%)",
    });

    const strongBlock = (css: string) =>
      css.slice(
        css.indexOf("#wemd strong"),
        css.indexOf("\n\n", css.indexOf("#wemd strong")),
      );
    const accentVars = (css: string) =>
      css.split("\n").filter((line) => line.includes("--wemd-strong-accent"));

    expect(strongBlock(after)).toBe(strongBlock(before));
    expect(accentVars(after)).toEqual(accentVars(before));
    expect(after).toContain("--wemd-primary-color: #07C160;");
  });

  it("preserves follow-theme bold behavior when the field is absent", () => {
    const legacy = { ...defaultVariables } as Record<string, unknown>;
    delete legacy.strongAccentColor;
    const variables = legacy as unknown as DesignerVariables;

    expect(strongRuleFor(variables)).toBe(
      generateGlobal({ ...variables, strongAccentColor: "" }),
    );

    const gradientColor = generateGlobal({
      ...variables,
      primaryGradient: "linear-gradient(135deg, #4158D0 0%, #FFCC70 100%)",
    });
    expect(gradientColor).toContain("color: transparent");

    expect(
      generateGlobal({ ...variables, strongStyle: "highlighter" }),
    ).toContain("background: var(--wemd-primary-gradient-20);");
    expect(
      generateGlobal({ ...variables, strongStyle: "highlighter-bottom" }),
    ).toContain("var(--wemd-primary-color-30)");
    expect(
      generateGlobal({ ...variables, strongStyle: "underline" }),
    ).toContain("border-bottom: 2px solid var(--wemd-primary-color);");
    expect(generateGlobal({ ...variables, strongStyle: "dot" })).not.toContain(
      "text-emphasis-color",
    );
  });

  const strongBody = (css: string) => {
    const start = css.indexOf("#wemd strong {");
    return css.slice(start, css.indexOf("\n}", start) + 2);
  };

  const legacyStrong = (
    textRule: string,
    decorations: readonly [string, string, string, string],
  ) =>
    [
      "#wemd strong { ",
      "  font-weight: bold;",
      `  ${textRule}`,
      ...decorations.map((rule) => `  ${rule}`),
      "}",
    ].join("\n");

  const primaryText = "color: var(--wemd-primary-color);";

  it.each([
    ["none", "color: inherit;", ["", "", "", ""]],
    ["color", primaryText, ["", "", "", ""]],
    [
      "highlighter",
      primaryText,
      [
        "background: var(--wemd-primary-gradient-20); padding: 0 2px; border-radius: 2px;",
        "",
        "",
        "",
      ],
    ],
    [
      "highlighter-bottom",
      primaryText,
      [
        "",
        "background: linear-gradient(to bottom, transparent 60%, var(--wemd-primary-color-30) 60%); padding: 0 2px;",
        "",
        "",
      ],
    ],
    [
      "underline",
      primaryText,
      [
        "",
        "",
        "border-bottom: 2px solid var(--wemd-primary-color); padding-bottom: 1px;",
        "",
      ],
    ],
    [
      "dot",
      primaryText,
      [
        "",
        "",
        "",
        "-webkit-text-emphasis: dot; -webkit-text-emphasis-position: under; text-emphasis: dot; text-emphasis-position: under;",
      ],
    ],
  ] as const)(
    "freezes the follow-theme bold rule for the %s style",
    (strongStyle, textRule, decorations) => {
      expect(
        strongBody(generateGlobal({ ...defaultVariables, strongStyle })),
      ).toBe(legacyStrong(textRule, decorations));
    },
  );

  it("does not touch heading preset accent variables", () => {
    const css = generateCSS({
      ...defaultVariables,
      strongAccentColor: "#FA5151",
    });

    expect(css).toContain("--wemd-primary-color-30: rgba(7, 193, 96, 0.18);");
    expect(css).toContain(
      "--wemd-primary-gradient-20: rgba(7, 193, 96, 0.12);",
    );
  });
});
