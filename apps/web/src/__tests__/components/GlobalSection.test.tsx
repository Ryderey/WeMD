import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { GlobalSection } from "../../components/Theme/ThemeDesigner/sections/GlobalSection";
import { OtherSection } from "../../components/Theme/ThemeDesigner/sections/OtherSection";

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

  it("shows follow-theme as the selected bold color mode by default", () => {
    render(
      <GlobalSection
        variables={defaultVariables}
        updateVariable={vi.fn()}
        handlePrimaryColorChange={vi.fn()}
      />,
    );

    const group = screen.getByRole("group", { name: "加粗配色来源" });
    const follow = within(group).getByRole("button", { name: "跟随主题" });
    const custom = within(group).getByRole("button", { name: "自定义" });

    expect(follow).toHaveAttribute("aria-pressed", "true");
    expect(custom).toHaveAttribute("aria-pressed", "false");
  });

  it("seeds the custom accent from the current theme color and clears it on follow", () => {
    const updateVariable = vi.fn();
    render(
      <GlobalSection
        variables={{ ...defaultVariables, primaryColor: "#722ED1" }}
        updateVariable={updateVariable}
        handlePrimaryColorChange={vi.fn()}
      />,
    );

    fireEvent.click(
      within(screen.getByRole("group", { name: "加粗配色来源" })).getByRole(
        "button",
        { name: "自定义" },
      ),
    );
    expect(updateVariable).toHaveBeenCalledWith("strongAccentColor", "#722ED1");

    fireEvent.click(
      within(screen.getByRole("group", { name: "加粗配色来源" })).getByRole(
        "button",
        { name: "跟随主题" },
      ),
    );
    expect(updateVariable).toHaveBeenCalledWith("strongAccentColor", "");
  });

  it("seeds a usable accent when the theme color is not a palette color", () => {
    const updateVariable = vi.fn();
    render(
      <GlobalSection
        variables={{ ...defaultVariables, primaryColor: "rgb(1, 2, 3)" }}
        updateVariable={updateVariable}
        handlePrimaryColorChange={vi.fn()}
      />,
    );

    fireEvent.click(
      within(screen.getByRole("group", { name: "加粗配色来源" })).getByRole(
        "button",
        { name: "自定义" },
      ),
    );
    expect(updateVariable).toHaveBeenCalledWith("strongAccentColor", "#07C160");
  });

  it("offers the shared palette only in custom mode", () => {
    const updateVariable = vi.fn();
    const { rerender } = render(
      <GlobalSection
        variables={{
          ...defaultVariables,
          primaryColor: "#722ED1",
          strongAccentColor: "#FA5151",
        }}
        updateVariable={updateVariable}
        handlePrimaryColorChange={vi.fn()}
      />,
    );

    const accentField = screen.getByText("加粗配色")
      .parentElement as HTMLElement;
    expect(
      within(screen.getByRole("group", { name: "加粗配色来源" })).getByRole(
        "button",
        { name: "自定义" },
      ),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(within(accentField).getByTitle("活力橘"));
    expect(updateVariable).toHaveBeenLastCalledWith(
      "strongAccentColor",
      "#FA5151",
    );

    rerender(
      <GlobalSection
        variables={defaultVariables}
        updateVariable={vi.fn()}
        handlePrimaryColorChange={vi.fn()}
      />,
    );
    const followField = screen.getByText("加粗配色")
      .parentElement as HTMLElement;
    expect(followField.querySelector(".color-btn")).toBeNull();
  });

  it("keeps the configured accent when switching bold style", () => {
    const updateVariable = vi.fn();
    render(
      <GlobalSection
        variables={{ ...defaultVariables, strongAccentColor: "#FA5151" }}
        updateVariable={updateVariable}
        handlePrimaryColorChange={vi.fn()}
      />,
    );

    for (const name of ["基础加粗", "底部涂抹", "下划线", "着重号"]) {
      fireEvent.click(screen.getByRole("button", { name }));
    }

    expect(updateVariable.mock.calls.map(([key]) => key)).toEqual([
      "strongStyle",
      "strongStyle",
      "strongStyle",
      "strongStyle",
    ]);
  });

  it("moves the bold text color override into the global section", () => {
    const updateVariable = vi.fn();
    render(
      <GlobalSection
        variables={defaultVariables}
        updateVariable={updateVariable}
        handlePrimaryColorChange={vi.fn()}
      />,
    );

    expect(screen.getByText("加粗文字颜色")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("自动"));
    expect(updateVariable).toHaveBeenCalledWith("strongColor", "inherit");
    expect(
      screen.getByText(/单独设置文字颜色可覆盖文字部分/),
    ).toBeInTheDocument();
  });

  it("no longer renders the bold color entry in the other section", () => {
    render(
      <OtherSection variables={defaultVariables} updateVariable={vi.fn()} />,
    );

    expect(screen.queryByText("加粗颜色")).toBeNull();
    expect(screen.queryByText("加粗文字颜色")).toBeNull();
  });
});
