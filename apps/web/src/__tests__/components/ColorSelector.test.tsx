import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorSelector } from "../../components/Theme/ColorSelector";
import { primaryGradientOptions } from "../../config/styleOptions";

describe("ColorSelector", () => {
  it("renders gradient presets and can hide the custom color picker", () => {
    const onChange = vi.fn();
    const aurora = primaryGradientOptions[1].value;
    render(
      <ColorSelector
        value={aurora}
        presets={primaryGradientOptions}
        onChange={onChange}
        allowCustomColor={false}
      />,
    );

    const auroraButton = screen.getByTitle("极光玻璃");
    expect(auroraButton.style.backgroundImage).toContain("linear-gradient");
    expect(auroraButton).toHaveClass("active");
    expect(screen.queryByTitle("选择新颜色")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("无渐变"));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
