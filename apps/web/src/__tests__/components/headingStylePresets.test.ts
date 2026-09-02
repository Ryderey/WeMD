import { describe, expect, it } from "vitest";
import { headingStylePresets } from "../../config/styleOptions";
import { getHeadingPresetCSS } from "../../components/Theme/ThemeDesigner/generators/presets";

describe("heading style presets", () => {
  it("keeps each bottom underline clear of wrapped heading text", () => {
    const css = getHeadingPresetCSS("bottom-border", "#07c160", "h2").content;

    expect(css).toContain("text-decoration-line: underline");
    expect(css).toContain("text-decoration-thickness: 2px");
    expect(css).toContain("text-decoration-skip-ink: none");
    expect(css).not.toContain("text-underline-offset");
    expect(css).not.toContain("padding-bottom");
    expect(css).not.toContain("border-bottom");
  });

  it("sizes the gradient underline to the heading text", () => {
    const css = getHeadingPresetCSS(
      "gradient-underline",
      "#07c160",
      "h2",
    ).content;

    expect(css).toContain("display: inline-block");
    expect(css).toContain("width: fit-content");
    expect(css).not.toContain("display: block;");
  });

  it.each([
    ["gradient-underline", "background-size: 100% 2px"],
    ["gradient-highlight", "border-radius: 6px"],
    ["numbered-label", "box-shadow: 5px 5px 0 var(--wemd-primary-color-30)"],
  ])("exposes %s and generates its CSS", (presetId, expectedCss) => {
    expect(headingStylePresets.some(({ id }) => id === presetId)).toBe(true);
    expect(getHeadingPresetCSS(presetId, "#07c160", "h2").content).toContain(
      expectedCss,
    );
  });

  it("renders numbered-label as a compact white-on-primary tag", () => {
    const css = getHeadingPresetCSS("numbered-label", "#07c160", "h2").content;

    expect(css).toContain("display: inline-block");
    expect(css).toContain("background: var(--wemd-primary-gradient)");
    expect(css).toContain("color: #fff");
    expect(css).toContain("padding: 6px 16px");
    expect(css).toContain("border-radius: 2px");
  });

  it("renders corner-brackets with only bottom-left and top-right corners", () => {
    const { content, extra } = getHeadingPresetCSS(
      "corner-brackets",
      "#07c160",
      "h2",
    );

    expect(headingStylePresets.some(({ id }) => id === "corner-brackets")).toBe(
      true,
    );
    expect(content).toContain("width: fit-content");
    expect(content).toContain("position: relative");
    expect(extra).toContain("#wemd h2 .content::before");
    expect(extra).toContain('content: "\u00a0"');
    expect(extra).toContain("border-left-width: 3px");
    expect(extra).toContain("border-left-color: var(--wemd-primary-color)");
    expect(extra).toContain("border-bottom-width: 3px");
    expect(extra).toContain("border-bottom-color: var(--wemd-primary-color)");
    expect(extra).toContain("#wemd h2 .content::after");
    expect(extra).toContain("border-top-width: 3px");
    expect(extra).toContain("border-top-color: var(--wemd-primary-color)");
    expect(extra).toContain("border-right-width: 3px");
    expect(extra).toContain("border-right-color: var(--wemd-primary-color)");
  });
});
