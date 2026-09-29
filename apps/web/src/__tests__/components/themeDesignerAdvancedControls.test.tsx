import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { GlobalSection } from "../../components/Theme/ThemeDesigner/sections/GlobalSection";
import { ParagraphSection } from "../../components/Theme/ThemeDesigner/sections/ParagraphSection";
import { HeadingSection } from "../../components/Theme/ThemeDesigner/sections/HeadingSection";
import { OtherSection } from "../../components/Theme/ThemeDesigner/sections/OtherSection";
import { CodeSection } from "../../components/Theme/ThemeDesigner/sections/CodeSection";
import { TableHrSection } from "../../components/Theme/ThemeDesigner/sections/TableHrSection";
import { ImageSection } from "../../components/Theme/ThemeDesigner/sections/ImageSection";
import { ListSection } from "../../components/Theme/ThemeDesigner/sections/ListSection";
import { QuoteSection } from "../../components/Theme/ThemeDesigner/sections/QuoteSection";
import type {
  HeadingLevel,
  HeadingStyle,
  SectionProps,
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

describe("link, strikethrough and footnote controls", () => {
  type UpdateVariable = SectionProps["updateVariable"];

  const renderOther = (updateVariable: UpdateVariable) =>
    render(
      <OtherSection
        variables={defaultVariables}
        updateVariable={updateVariable}
      />,
    );

  const clickOption = (container: HTMLElement | null, label: string) => {
    const button = Array.from(
      container?.querySelectorAll<HTMLButtonElement>(".option-btn") ?? [],
    ).find((b) => b.textContent === label);
    expect(button, `找不到选项「${label}」`).toBeTruthy();
    fireEvent.click(button as Element);
  };

  it("链接高级选项写下划线形态与偏移", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    renderOther(updateVariable);

    const details = openAdvanced("链接高级选项");
    expect(updateVariable).not.toHaveBeenCalled();

    clickOption(details, "文字下划线");
    expect(updateVariable).toHaveBeenCalledWith("linkUnderlineMode", "text");

    updateVariable.mockClear();
    setRange(details, "下划线偏移", "4");
    expect(updateVariable).toHaveBeenCalledWith("linkUnderlineOffset", 4);
    expect(screen.getByText(/随换行逐行绘制/)).toBeInTheDocument();
  });

  it("删除线覆盖开关写入布尔值", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    renderOther(updateVariable);

    fireEvent.click(
      screen
        .getByText("同时覆盖删除线文本")
        .parentElement!.querySelector("input") as Element,
    );
    expect(updateVariable).toHaveBeenCalledWith("delCoversStrikethrough", true);
  });

  it("脚注高级选项写布局与编号宽度", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    renderOther(updateVariable);

    const details = openAdvanced("脚注高级选项");
    clickOption(details, "悬挂缩进");
    expect(updateVariable).toHaveBeenCalledWith("footnoteLayout", "hanging");

    updateVariable.mockClear();
    setRange(details, "编号宽度", "26");
    expect(updateVariable).toHaveBeenCalledWith("footnoteNumberWidth", 26);

    updateVariable.mockClear();
    clickOption(details, "默认");
    expect(updateVariable).toHaveBeenCalledWith("footnoteLayout", undefined);
  });
});

describe("code block advanced controls", () => {
  type UpdateVariable = SectionProps["updateVariable"];

  const renderCode = (updateVariable: UpdateVariable) =>
    render(
      <CodeSection
        variables={defaultVariables}
        updateVariable={updateVariable}
        setVariables={vi.fn() as never}
      />,
    );

  const clickOption = (container: HTMLElement | null, label: string) => {
    const button = Array.from(
      container?.querySelectorAll<HTMLButtonElement>(".option-btn") ?? [],
    ).find((b) => b.textContent === label);
    expect(button, `找不到选项「${label}」`).toBeTruthy();
    fireEvent.click(button as Element);
  };

  it("外框、圆角与长行滚动写入对应变量", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    renderCode(updateVariable);

    const details = openAdvanced("代码块高级选项");
    expect(updateVariable).not.toHaveBeenCalled();

    clickOption(details, "仅左线");
    expect(updateVariable).toHaveBeenCalledWith("codeBlockBorder", "left");

    updateVariable.mockClear();
    setRange(details, "圆角", "4");
    expect(updateVariable).toHaveBeenCalledWith("codeBlockRadius", 4);

    updateVariable.mockClear();
    fireEvent.click(
      screen
        .getByText("长行在框内滚动")
        .parentElement!.querySelector("input") as Element,
    );
    expect(updateVariable).toHaveBeenCalledWith("codeBlockContainWidth", true);

    expect(
      screen.getByText(/超长代码行不会把代码块撑破正文宽度/),
    ).toBeInTheDocument();
  });
});

describe("quote and callout advanced controls", () => {
  type UpdateVariable = SectionProps["updateVariable"];

  const renderQuote = (updateVariable: UpdateVariable) =>
    render(
      <QuoteSection
        variables={defaultVariables}
        updateVariable={updateVariable}
      />,
    );

  const clickOption = (container: HTMLElement | null, label: string) => {
    const button = Array.from(
      container?.querySelectorAll<HTMLButtonElement>(".option-btn") ?? [],
    ).find((b) => b.textContent === label);
    expect(button, `找不到选项「${label}」`).toBeTruthy();
    fireEvent.click(button as Element);
  };

  it("引用高级选项写左右内距、悬挂缩进与段间距", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    renderQuote(updateVariable);

    const details = openAdvanced("引用高级选项");
    expect(updateVariable).not.toHaveBeenCalled();

    setRange(details, "左侧内距", "32");
    setRange(details, "右侧内距", "8");
    setRange(details, "悬挂缩进", "16");
    setRange(details, "引用内段间距", "10");
    expect(updateVariable).toHaveBeenCalledWith("quotePaddingLeft", 32);
    expect(updateVariable).toHaveBeenCalledWith("quotePaddingRight", 8);
    expect(updateVariable).toHaveBeenCalledWith("quoteIndent", 16);
    expect(updateVariable).toHaveBeenCalledWith("quoteParagraphGap", 10);
  });

  it("引用字体可以回到跟随全局", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    render(
      <QuoteSection
        variables={{ ...defaultVariables, quoteFontFamily: "serif" }}
        updateVariable={updateVariable}
      />,
    );

    const details = openAdvanced("引用高级选项");
    clickOption(details, "跟随全局");
    expect(updateVariable).toHaveBeenCalledWith("quoteFontFamily", undefined);
  });

  it("提示块高级选项写模式、内距与字号", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    renderQuote(updateVariable);

    const details = openAdvanced("提示块高级选项");
    expect(updateVariable).not.toHaveBeenCalled();

    clickOption(details, "跟随主题色");
    expect(updateVariable).toHaveBeenCalledWith("calloutStyle", "primary");

    updateVariable.mockClear();
    setRange(details, "水平内距", "20");
    setRange(details, "标题字号", "13");
    expect(updateVariable).toHaveBeenCalledWith("calloutPaddingX", 20);
    expect(updateVariable).toHaveBeenCalledWith("calloutTitleFontSize", 13);

    expect(
      screen.getByText(/这里设置的细项排在模式之后，永远优先/),
    ).toBeInTheDocument();
  });

  it("未设细项时滑块显示旧默认值", () => {
    renderQuote(vi.fn());
    const details = openAdvanced("提示块高级选项");
    const fields = Array.from(details.querySelectorAll(".designer-field"));
    const readValue = (label: string) => {
      const field = fields.find(
        (f) => f.querySelector("label")?.textContent?.trim() === label,
      );
      return field?.querySelector<HTMLInputElement>('input[type="range"]')
        ?.value;
    };
    expect(readValue("水平内距")).toBe("16");
    expect(readValue("垂直内距")).toBe("12");
  });
});

describe("imageflow and equation controls", () => {
  type UpdateVariable = SectionProps["updateVariable"];

  it("滑动图片切到阅读式写入 imageflowLayout", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    render(
      <ImageSection
        variables={defaultVariables}
        updateVariable={updateVariable}
      />,
    );

    const details = openAdvanced("图片高级选项");
    const button = Array.from(
      details.querySelectorAll<HTMLButtonElement>(".option-btn"),
    ).find((b) => b.textContent === "阅读式");
    fireEvent.click(button as Element);
    expect(updateVariable).toHaveBeenCalledWith("imageflowLayout", "reading");
  });

  it("公式宽度开关写入 equationMaxWidth", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    render(
      <OtherSection
        variables={defaultVariables}
        updateVariable={updateVariable}
      />,
    );

    openAdvanced("公式高级选项");
    fireEvent.click(
      screen
        .getByText("公式限制在正文宽度内")
        .parentElement!.querySelector("input") as Element,
    );
    expect(updateVariable).toHaveBeenCalledWith("equationMaxWidth", true);
  });
});

describe("root typography and quote outer margin controls", () => {
  type UpdateVariable = SectionProps["updateVariable"];

  it("根节点排版开关写布尔值", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    render(
      <GlobalSection
        variables={defaultVariables}
        updateVariable={updateVariable}
        handlePrimaryColorChange={vi.fn()}
      />,
    );

    openAdvanced("页面高级选项");
    fireEvent.click(
      screen
        .getByText("根节点统一给行高与断行")
        .parentElement!.querySelector("input") as Element,
    );
    expect(updateVariable).toHaveBeenCalledWith("rootTypography", true);
    expect(screen.getByText(/链接不再从单词中间断开/)).toBeInTheDocument();
  });

  it("引用上下外距写入 quoteOuterMargin", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    render(
      <QuoteSection
        variables={defaultVariables}
        updateVariable={updateVariable}
      />,
    );

    const details = openAdvanced("引用高级选项");
    setRange(details, "引用上下外距", "26");
    expect(updateVariable).toHaveBeenCalledWith("quoteOuterMargin", 26);
  });

  it("外距滑块默认显示段距", () => {
    render(
      <QuoteSection
        variables={{ ...defaultVariables, paragraphMargin: 25 }}
        updateVariable={vi.fn()}
      />,
    );
    const details = openAdvanced("引用高级选项");
    const field = Array.from(details.querySelectorAll(".designer-field")).find(
      (f) => f.querySelector("label")?.textContent?.trim() === "引用上下外距",
    );
    expect(
      field?.querySelector<HTMLInputElement>('input[type="range"]')?.value,
    ).toBe("25");
  });
});

describe("structural presets", () => {
  type UpdateVariable = SectionProps["updateVariable"];

  const clickOption = (container: HTMLElement | null, label: string) => {
    const button = Array.from(
      container?.querySelectorAll<HTMLButtonElement>(".option-btn") ?? [],
    ).find((b) => b.textContent === label);
    expect(button, `找不到选项「${label}」`).toBeTruthy();
    fireEvent.click(button as Element);
  };

  it("表格形态切到横线式写入 tableStyle", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    render(
      <TableHrSection
        variables={defaultVariables}
        updateVariable={updateVariable}
      />,
    );

    const details = openAdvanced("表格高级选项");
    expect(updateVariable).not.toHaveBeenCalled();
    clickOption(details, "横线式");
    expect(updateVariable).toHaveBeenCalledWith("tableStyle", "rules");
  });

  it("图片布局切到撑满正文写入 imageLayout", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    render(
      <ImageSection
        variables={defaultVariables}
        updateVariable={updateVariable}
      />,
    );

    const details = openAdvanced("图片高级选项");
    clickOption(details, "撑满正文");
    expect(updateVariable).toHaveBeenCalledWith("imageLayout", "fill");
  });

  it("列表布局切到阅读式写入 listLayout，且默认项标记为选中", () => {
    const updateVariable = vi.fn<UpdateVariable>();
    render(
      <ListSection
        variables={defaultVariables}
        updateVariable={updateVariable}
      />,
    );

    const details = openAdvanced("列表高级选项");
    const defaultButton = Array.from(
      details.querySelectorAll<HTMLButtonElement>(".option-btn"),
    ).find((b) => b.textContent === "默认");
    expect(defaultButton).toHaveAttribute("aria-pressed", "true");

    clickOption(details, "阅读式");
    expect(updateVariable).toHaveBeenCalledWith("listLayout", "reading");
  });
});
