import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { GlobalSection } from "../../components/Theme/ThemeDesigner/sections/GlobalSection";
import { ParagraphSection } from "../../components/Theme/ThemeDesigner/sections/ParagraphSection";

const openAdvanced = (summaryText: string) => {
  const summary = screen.getByText(summaryText);
  const details = summary.closest("details");
  expect(details, `${summaryText} 必须放在可折叠的高级选项里`).toBeTruthy();
  expect(details?.hasAttribute("open")).toBe(false);
  fireEvent.click(summary);
  return details as HTMLDetailsElement;
};

const setRange = (
  container: HTMLElement | null,
  label: string,
  value: string,
) => {
  const field = Array.from(
    container?.querySelectorAll<HTMLElement>(".designer-field") ?? [],
  ).find((f) => f.querySelector("label")?.textContent?.trim() === label);
  expect(field, `找不到字段「${label}」`).toBeTruthy();
  const input = field?.querySelector<HTMLInputElement>('input[type="range"]');
  expect(input, `「${label}」缺少滑块`).toBeTruthy();
  fireEvent.change(input as HTMLInputElement, { target: { value } });
};

describe("advanced page and paragraph controls", () => {
  it("页面高级选项写入新字段，且默认不影响既有值", () => {
    const updateVariable = vi.fn();
    render(
      <GlobalSection
        variables={defaultVariables}
        updateVariable={updateVariable}
        handlePrimaryColorChange={vi.fn()}
      />,
    );

    const details = openAdvanced("页面高级选项");
    setRange(details, "页面上下间距", "5");
    expect(updateVariable).toHaveBeenCalledWith("pagePaddingY", 5);

    updateVariable.mockClear();
    setRange(details, "内容最大宽度", "677");
    expect(updateVariable).toHaveBeenCalledWith("pageMaxWidth", 677);

    expect(
      screen.getByText(/内容最大宽度设为 0 表示不限制/),
    ).toBeInTheDocument();
  });

  it("未触碰高级选项时不会写出新字段", () => {
    const updateVariable = vi.fn();
    render(
      <GlobalSection
        variables={defaultVariables}
        updateVariable={updateVariable}
        handlePrimaryColorChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "底部涂抹" }));
    const keys = updateVariable.mock.calls.map(([key]) => key);
    expect(keys).toEqual(["strongStyle"]);
    expect(keys).not.toContain("pagePaddingY");
    expect(keys).not.toContain("pageMaxWidth");
  });

  it("段落高级选项分别写段前距与段后距", () => {
    const updateVariable = vi.fn();
    render(
      <ParagraphSection
        variables={defaultVariables}
        updateVariable={updateVariable}
      />,
    );

    const details = openAdvanced("段落高级选项");
    setRange(details, "段前距", "0");
    setRange(details, "段后距", "25");
    expect(updateVariable).toHaveBeenCalledWith("paragraphMarginTop", 0);
    expect(updateVariable).toHaveBeenCalledWith("paragraphMarginBottom", 25);
    expect(
      screen.getByText(/不调整时段落仍使用上方「段落间距」/),
    ).toBeInTheDocument();
  });

  it("段落高级选项默认值跟随段落间距", () => {
    render(
      <ParagraphSection
        variables={{ ...defaultVariables, paragraphMargin: 18 }}
        updateVariable={vi.fn()}
      />,
    );

    const details = openAdvanced("段落高级选项");
    const fields = Array.from(details.querySelectorAll(".designer-field"));
    const readValue = (label: string) => {
      const field = fields.find(
        (f) => f.querySelector("label")?.textContent?.trim() === label,
      );
      return field?.querySelector<HTMLInputElement>('input[type="range"]')
        ?.value;
    };
    expect(readValue("段前距")).toBe("18");
    expect(readValue("段后距")).toBe("18");
  });
});
