import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { GlobalSection } from "../../components/Theme/ThemeDesigner/sections/GlobalSection";
import { ParagraphSection } from "../../components/Theme/ThemeDesigner/sections/ParagraphSection";
import { HeadingSection } from "../../components/Theme/ThemeDesigner/sections/HeadingSection";
import type {
  HeadingLevel,
  HeadingStyle,
} from "../../components/Theme/ThemeDesigner/types";

type UpdateHeading = (
  level: HeadingLevel,
  style: Partial<HeadingStyle>,
) => void;

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

describe("heading advanced controls", () => {
  const renderHeading = (updateHeading: UpdateHeading) =>
    render(
      <HeadingSection
        variables={defaultVariables}
        updateVariable={vi.fn() as never}
        activeHeading="h1"
        setActiveHeading={vi.fn()}
        updateHeading={updateHeading}
      />,
    );

  it("只展开高级选项不会写任何字段", () => {
    const updateHeading = vi.fn<UpdateHeading>();
    renderHeading(updateHeading);
    openAdvanced("标题高级选项");
    expect(updateHeading).not.toHaveBeenCalled();
  });

  it("细线与字体写入当前标题层级", () => {
    const updateHeading = vi.fn<UpdateHeading>();
    renderHeading(updateHeading);
    const details = openAdvanced("标题高级选项");

    setRange(details, "下方细线宽度", "1");
    expect(updateHeading).toHaveBeenCalledWith("h1", { ruleBelowWidth: 1 });

    updateHeading.mockClear();
    setRange(details, "细线与文字距离", "8");
    expect(updateHeading).toHaveBeenCalledWith("h1", { ruleBelowGap: 8 });

    updateHeading.mockClear();
    setRange(details, "行高", "1.55");
    expect(updateHeading).toHaveBeenCalledWith("h1", { lineHeight: 1.55 });

    updateHeading.mockClear();
    fireEvent.click(
      Array.from(
        details.querySelectorAll<HTMLButtonElement>(".option-btn"),
      ).find((b) => b.textContent === "跟随全局") as Element,
    );
    expect(updateHeading).toHaveBeenCalledWith("h1", { fontFamily: undefined });

    expect(screen.getByText(/细线宽度设为 0 表示不显示/)).toBeInTheDocument();
  });
});

describe("divider advanced controls", () => {
  it("只展开不会写字段，细项写入对应变量", () => {
    const updateVariable = vi.fn();
    render(
      <ParagraphSection
        variables={defaultVariables}
        updateVariable={updateVariable}
      />,
    );

    const details = openAdvanced("分隔线高级选项");
    expect(updateVariable).not.toHaveBeenCalled();

    setRange(details, "宽度", "28");
    expect(updateVariable).toHaveBeenCalledWith("hrWidth", 28);

    updateVariable.mockClear();
    setRange(details, "上边距", "36");
    expect(updateVariable).toHaveBeenCalledWith("hrMarginTop", 36);

    updateVariable.mockClear();
    fireEvent.click(
      Array.from(
        details.querySelectorAll<HTMLButtonElement>(".option-btn"),
      ).find((b) => b.textContent === "居中") as Element,
    );
    expect(updateVariable).toHaveBeenCalledWith("hrAlign", "center");

    expect(screen.getByText(/宽度设为 0 表示通栏/)).toBeInTheDocument();
  });
});
