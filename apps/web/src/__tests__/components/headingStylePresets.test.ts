import { describe, expect, it } from "vitest";
import { headingStylePresets } from "../../config/styleOptions";
import { getHeadingPresetCSS } from "../../components/Theme/ThemeDesigner/generators/presets";

describe("heading style presets", () => {
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
});
