import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import toast from "react-hot-toast";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";
import { HeadingSection } from "../../components/Theme/ThemeDesigner/sections/HeadingSection";
import type { HeadingSectionProps } from "../../components/Theme/ThemeDesigner/types";
import { renderOffscreenContent } from "../../services/export/renderContainer";
import { serializeWechatCopyHtml } from "../../services/wechatCopyNormalizer";

describe("chapter-label reference appearance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(["browser", "electron", "failure"])(
    "copies the label as plain text with feedback (%s)",
    async (environment) => {
      const writeText = vi
        .fn()
        .mockResolvedValue({ success: environment !== "failure" });
      vi.stubGlobal(
        "electron",
        environment === "browser" ? undefined : { clipboard: { writeText } },
      );
      vi.stubGlobal("navigator", { clipboard: { writeText } });
      const success = vi.spyOn(toast, "success");
      const error = vi.spyOn(toast, "error");
      const panel = render(
        <HeadingSection
          variables={{
            ...defaultVariables,
            h2: { ...defaultVariables.h2, preset: "chapter-label" },
          }}
          activeHeading="h2"
          setActiveHeading={() => {}}
          updateVariable={() => {}}
          updateHeading={() => {}}
        />,
      );
      fireEvent.click(panel.getByRole("button", { name: "复制标签代码" }));
      await waitFor(() =>
        expect(environment === "failure" ? error : success).toHaveBeenCalled(),
      );
      expect(writeText).toHaveBeenCalledWith(
        '<span class="chapter-label">SECTION 01</span>',
      );
      expect(
        environment === "failure" ? success : error,
      ).not.toHaveBeenCalled();
    },
  );

  it("styles an explicit label through the real copy entry and stays editable", async () => {
    let variables = {
      ...defaultVariables,
      h2: { ...defaultVariables.h2, fontSize: 28, centered: true },
    };
    const updateHeading: HeadingSectionProps["updateHeading"] = (
      level,
      updates,
    ) => {
      variables = {
        ...variables,
        [level]: { ...variables[level], ...updates },
      };
    };
    const section = () => (
      <HeadingSection
        variables={variables}
        activeHeading="h2"
        setActiveHeading={() => {}}
        updateVariable={() => {}}
        updateHeading={updateHeading}
      />
    );
    const panel = render(section());
    fireEvent.click(panel.getByRole("button", { name: "章节标签" }));
    panel.rerender(section());

    expect({ ...variables, h2: defaultVariables.h2 }).toEqual(defaultVariables);
    expect(
      panel.getByText(
        '## <span class="chapter-label">SECTION 01</span>建立阅读层级',
      ),
    ).toBeInTheDocument();
    const markdown =
      '## <span class="chapter-label">SECTION 01</span>建立 **阅读** [层级](https://example.com)';
    const copy = async () => {
      const { container, dispose } = await renderOffscreenContent(
        markdown,
        generateCSS(variables),
        { forWechat: true },
      );
      try {
        const snapshot = document.createElement("div");
        snapshot.innerHTML = serializeWechatCopyHtml(container);
        expect(snapshot.innerHTML).not.toContain("var(--wemd-");
        return snapshot;
      } finally {
        dispose();
      }
    };
    const snapshot = await copy();
    const title = snapshot.querySelector<HTMLElement>("h2 .content");
    const label = title?.querySelector<HTMLElement>(".chapter-label");
    expect(label?.textContent).toBe("SECTION 01");
    expect(title?.textContent).toBe("SECTION 01建立 阅读 层级");
    expect(title?.style.color).toBe("rgb(255, 169, 0)");
    expect(title?.style.fontSize).toBe("20px");
    expect(title?.style.lineHeight).toBe("1.5");
    expect(title?.style.fontWeight).toBe("750");
    expect(title?.style.letterSpacing).toBe("0.2px");
    expect(title?.style.borderLeftColor).toBe("rgb(249, 110, 87)");
    expect(title?.style.paddingLeft).toBe("13px");
    expect(label?.style.color).toBe("rgb(249, 110, 87)");
    expect(label?.style.display).toBe("block");
    expect(title?.firstElementChild).toBe(label);
    expect(title?.querySelector("strong")?.textContent).toBe("阅读");
    expect(title?.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com",
    );
    expect(snapshot.querySelector("h2")?.style.marginTop).toBe("0px");
    expect(snapshot.querySelector("h2")?.style.marginBottom).toBe("24px");
    expect(variables.h2.centered).toBe(false);
    expect(snapshot.querySelector("h2")?.style.textAlign).not.toBe("center");

    for (const [name, value] of [
      ["字号", "18"],
      ["行高", "1.8"],
      ["字间距", "1"],
    ]) {
      const field = panel
        .getByText(name, { selector: "label", exact: true })
        .closest(".designer-field");
      if (!(field instanceof HTMLElement))
        throw new Error(`Missing field: ${name}`);
      fireEvent.change(within(field).getByRole("slider"), {
        target: { value },
      });
    }
    fireEvent.click(panel.getByRole("button", { name: "常规" }));
    const colorField = panel
      .getByText("文字颜色", { selector: "label" })
      .closest(".designer-field");
    if (!(colorField instanceof HTMLElement))
      throw new Error("Missing text color field");
    fireEvent.click(within(colorField).getByRole("button", { name: "#666" }));
    const adjusted = (await copy()).querySelector<HTMLElement>("h2 .content");
    expect(adjusted?.style.fontSize).toBe("18px");
    expect(adjusted?.style.lineHeight).toBe("1.8");
    expect(adjusted?.style.letterSpacing).toBe("1px");
    expect(adjusted?.style.fontWeight).toBe("normal");
    expect(adjusted?.style.color).toBe("rgb(102, 102, 102)");
    expect(adjusted?.style.borderLeftColor).toBe("rgb(249, 110, 87)");

    const previousHeading = { ...variables.h2 };
    fireEvent.click(panel.getByRole("button", { name: "无样式" }));
    expect(variables.h2).toEqual({ ...previousHeading, preset: "simple" });
    expect(
      (await copy()).querySelector<HTMLElement>("h2 .content")?.style
        .borderLeftWidth,
    ).toBe("");
    const plain = (await copy()).querySelector<HTMLElement>("h2 .content");
    expect(
      plain?.querySelector<HTMLElement>(".chapter-label")?.style.display,
    ).toBe("");
    expect(plain?.textContent).toBe("SECTION 01建立 阅读 层级");
    panel.rerender(section());
    expect(
      panel.queryByText(
        '## <span class="chapter-label">SECTION 01</span>建立阅读层级',
      ),
    ).not.toBeInTheDocument();
  });
});
