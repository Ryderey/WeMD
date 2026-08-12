import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { GlobalSection } from "../../components/Theme/ThemeDesigner/sections/GlobalSection";

describe("GlobalSection", () => {
  it("offers the four article background presets", () => {
    const updateVariable = vi.fn();
    render(
      <GlobalSection
        variables={defaultVariables}
        updateVariable={updateVariable}
        handlePrimaryColorChange={vi.fn()}
      />,
    );

    for (const name of ["透明", "浅绿", "暖白", "淡蓝"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }

    expect(screen.getByRole("button", { name: "透明" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "浅绿" }));
    expect(updateVariable).toHaveBeenCalledWith(
      "pageBackgroundColor",
      "#F2FAF5",
    );
    const articleBackgroundField = screen.getByText("文章底色").parentElement;
    expect(
      articleBackgroundField?.querySelector('[title="选择新颜色"]'),
    ).toBeInTheDocument();
  });

  it("updates solid and gradient theme colors independently", () => {
    const updateVariable = vi.fn();
    const handlePrimaryColorChange = vi.fn();
    render(
      <GlobalSection
        variables={defaultVariables}
        updateVariable={updateVariable}
        handlePrimaryColorChange={handlePrimaryColorChange}
      />,
    );

    fireEvent.click(screen.getByTitle("极光玻璃"));
    expect(updateVariable).toHaveBeenCalledWith(
      "primaryGradient",
      "linear-gradient(135deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
    );
    expect(handlePrimaryColorChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTitle("活力橘"));
    expect(handlePrimaryColorChange).toHaveBeenCalledWith("#FA5151");

    expect(screen.queryByLabelText("自定义渐变起始色")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle("添加自定义渐变"));
    expect(screen.getByTitle("自定义渐变预览")).toHaveClass("color-btn");
    const startInput = screen.getByLabelText("自定义渐变起始色");
    expect(startInput.parentElement).toHaveClass("color-btn");
    fireEvent.change(startInput, {
      target: { value: "#123456" },
    });
    expect(updateVariable).toHaveBeenLastCalledWith(
      "primaryGradient",
      "linear-gradient(135deg, #123456 0%, #FFCC70 100%)",
    );
  });
});
