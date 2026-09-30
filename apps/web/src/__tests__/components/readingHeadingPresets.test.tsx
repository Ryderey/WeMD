import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import toast from "react-hot-toast";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";
import { HeadingSection } from "../../components/Theme/ThemeDesigner/sections/HeadingSection";
import { getReadingHeadingDefaults } from "../../components/Theme/ThemeDesigner/readingHeadings";
import type {
  HeadingLevel,
  HeadingSectionProps,
} from "../../components/Theme/ThemeDesigner/types";
import { renderOffscreenContent } from "../../services/export/renderContainer";
import { serializeWechatCopyHtml } from "../../services/wechatCopyNormalizer";
import { useThemeStore } from "../../store/themeStore";

const cases = [
  {
    id: "reading-plain-paper",
    label: "素笺编号",
    size: "13px",
    color: "rgb(117, 102, 85)",
    display: "block",
    width: "",
    gap: "6px",
    rule: "rgb(200, 191, 178)",
  },
  {
    id: "reading-ink-journal",
    label: "墨刊编号",
    size: "12px",
    color: "rgb(39, 39, 39)",
    display: "inline-block",
    width: "26px",
    gap: "6px",
    rule: "rgb(70, 70, 68)",
  },
  {
    id: "reading-jade-notes",
    label: "青岚编号",
    size: "12px",
    color: "rgb(39, 103, 92)",
    display: "block",
    width: "22px",
    gap: "8px",
    rule: "rgb(221, 231, 223)",
  },
  {
    id: "reading-blueprint",
    label: "蓝图编号",
    size: "12px",
    color: "rgb(40, 87, 183)",
    display: "inline-block",
    width: "28px",
    gap: "0px",
    rule: "rgb(223, 230, 241)",
  },
  {
    id: "reading-cinnabar",
    label: "朱砂编号",
    size: "22px",
    color: "rgb(163, 69, 60)",
    display: "inline-block",
    width: "36px",
    gap: "6px",
    rule: "rgb(187, 121, 111)",
  },
  {
    id: "reading-xiaoha",
    label: "小哈编号",
    size: "25px",
    color: "rgb(249, 110, 87)",
    display: "inline",
    width: "",
    gap: "0px",
    rule: "rgb(240, 222, 213)",
  },
];

function panelFor(level: HeadingLevel = "h2") {
  let variables = structuredClone(defaultVariables);
  const updateHeading: HeadingSectionProps["updateHeading"] = (
    heading,
    updates,
  ) => {
    variables = {
      ...variables,
      [heading]: { ...variables[heading], ...updates },
    };
    panel.rerender(section());
  };
  const section = () => (
    <HeadingSection
      variables={variables}
      activeHeading={level}
      setActiveHeading={() => {}}
      updateVariable={() => {}}
      updateHeading={updateHeading}
    />
  );
  const panel = render(section());
  return { panel, variables: () => variables };
}

async function finalCopy(markdown: string, variables: typeof defaultVariables) {
  const { container, dispose } = await renderOffscreenContent(
    markdown,
    generateCSS(variables),
    { forWechat: true },
  );
  try {
    const result = document.createElement("div");
    result.innerHTML = serializeWechatCopyHtml(container);
    expect(result.innerHTML).not.toMatch(/var\(--wemd-|NaN|undefined/);
    return result;
  } finally {
    dispose();
  }
}

describe("authored reading heading presets", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(cases)(
    "select/copy/parser/final styles: $label",
    async (expected) => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("electron", undefined);
      vi.stubGlobal("navigator", { clipboard: { writeText } });
      const success = vi.spyOn(toast, "success");
      const { panel, variables } = panelFor();
      fireEvent.click(panel.getByRole("button", { name: expected.label }));
      expect(panel.getByText(/编号需手动填写/)).toBeInTheDocument();
      fireEvent.click(panel.getByRole("button", { name: "复制标题 HTML" }));
      await waitFor(() => expect(success).toHaveBeenCalled());
      const snippet = writeText.mock.calls[0]?.[0];
      expect(typeof snippet).toBe("string");
      expect(snippet).toContain(`class="reading-heading ${expected.id}"`);
      expect(snippet).toContain('<span class="heading-rule">&nbsp;</span>');
      expect(snippet).not.toMatch(/^#+|---/);
      expect(
        panel.getByText(`## ${snippet}`, { selector: "code" }),
      ).toBeInTheDocument();
      expect(variables().primaryColor).toBe(defaultVariables.primaryColor);
      expect(variables().h1).toEqual(defaultVariables.h1);

      const result = await finalCopy(
        `## ${snippet.replace("建立阅读层级", "建立 **阅读** [层级](https://example.com)")}\n\n## 1. 普通标题`,
        variables(),
      );
      const number = result.querySelector<HTMLElement>(".heading-number");
      const rule = result.querySelector<HTMLElement>(".heading-rule");
      const body = result.querySelector<HTMLElement>(".heading-body");
      const numberText = expected.id === "reading-xiaoha" ? "1." : "01";
      expect(number?.textContent).toBe(numberText);
      expect(number?.style.fontSize).toBe(expected.size);
      expect(number?.style.color).toBe(expected.color);
      expect(number?.style.display).toBe(expected.display);
      expect(number?.style.width).toBe(expected.width);
      expect(number?.style.marginBottom).toBe(expected.gap);
      expect(rule?.textContent).toBe("\u00a0");
      expect(rule?.style.borderTopWidth).toBe("1px");
      expect(rule?.style.borderTopColor).toBe(expected.rule);
      expect(body?.style.paddingLeft).toBe(
        expected.display === "inline-block" ? expected.width : "0px",
      );
      expect(Number.parseFloat(body?.style.textIndent ?? "NaN")).toBe(
        expected.display === "inline-block"
          ? -Number.parseFloat(expected.width)
          : 0,
      );
      expect(result.querySelector(".heading-text strong")?.textContent).toBe(
        "阅读",
      );
      expect(
        result.querySelector(".heading-text a")?.getAttribute("href"),
      ).toBe("https://example.com");
      const plain = result.querySelectorAll("h2")[1];
      expect(plain.textContent).toBe("1. 普通标题");
      expect(
        plain.querySelector(".heading-number, .heading-rule, .heading-body"),
      ).toBeNull();
      if (expected.id === "reading-jade-notes") {
        expect(number?.style.borderBottomColor).toBe("rgb(184, 205, 195)");
        expect(number?.style.paddingBottom).toBe("4px");
      }
      if (expected.id === "reading-xiaoha") {
        expect(number?.style.fontStyle).toBe("italic");
        expect(number?.style.fontWeight).toBe("900");
        expect(number?.style.lineHeight).toBe("1.19");
        expect(number?.style.letterSpacing).toBe("1px");
        expect(number?.style.marginRight).toBe("0px");
        expect(rule?.style.width).toBe("36%");
        expect(rule?.style.margin).toBe("40px auto 18px");
        expect(
          result.querySelector<HTMLElement>("h2 .content")?.style.fontSize,
        ).toBe("15px");
        expect(
          result.querySelector<HTMLElement>("h2 .content")?.style.color,
        ).toBe("rgb(255, 169, 0)");
        expect(
          result.querySelector<HTMLElement>(".heading-text")?.style.fontStyle,
        ).toBe("normal");
        expect(result.querySelector(".heading-text")?.textContent).toBe(
          " 建立 阅读 层级",
        );
      }
      fireEvent.click(panel.getByRole("button", { name: "无样式" }));
      expect(panel.queryByRole("button", { name: "复制标题 HTML" })).toBeNull();
      const changed = await finalCopy(`## ${snippet}`, variables());
      expect(
        changed.querySelector<HTMLElement>(".heading-number")?.style.display,
      ).toBe("");
      expect(changed.querySelector(".heading-number")?.textContent).toBe(
        numberText,
      );
    },
  );

  it.each(["electron", "electron-failure", "browser-failure"])(
    "clipboard feedback: %s",
    async (environment) => {
      const writeText =
        environment === "browser-failure"
          ? vi.fn().mockRejectedValue(new Error("denied"))
          : vi.fn().mockResolvedValue({ success: environment === "electron" });
      const browserWrite =
        environment === "browser-failure" ? writeText : vi.fn();
      vi.stubGlobal(
        "electron",
        environment === "browser-failure"
          ? undefined
          : { clipboard: { writeText } },
      );
      vi.stubGlobal("navigator", { clipboard: { writeText: browserWrite } });
      const success = vi.spyOn(toast, "success");
      const error = vi.spyOn(toast, "error");
      const { panel } = panelFor("h3");
      fireEvent.click(panel.getByRole("button", { name: "蓝图编号" }));
      expect(
        panel.getByText(/^### <span/, { selector: "code" }),
      ).toBeInTheDocument();
      fireEvent.click(panel.getByRole("button", { name: "复制标题 HTML" }));
      await waitFor(() =>
        expect(environment === "electron" ? success : error).toHaveBeenCalled(),
      );
      expect(
        environment === "electron" ? error : success,
      ).not.toHaveBeenCalled();
      expect(writeText).toHaveBeenCalledOnce();
      if (environment !== "browser-failure")
        expect(browserWrite).not.toHaveBeenCalled();
    },
  );

  it("edits number controls independently and preserves them in serialized settings", async () => {
    const { panel, variables } = panelFor();
    fireEvent.click(panel.getByRole("button", { name: "墨刊编号" }));
    for (const [label, value] of [
      ["编号字号", "16"],
      ["编号下间距", "10"],
      ["编号栏宽度", "42"],
    ]) {
      const field = panel
        .getByText(label, { selector: "label", exact: true })
        .closest(".designer-field");
      if (!(field instanceof HTMLElement)) throw new Error(`Missing ${label}`);
      fireEvent.change(within(field).getByRole("slider"), {
        target: { value },
      });
    }
    const colorField = panel
      .getByText("编号颜色", { selector: "label" })
      .closest(".designer-field");
    if (!(colorField instanceof HTMLElement))
      throw new Error("Missing number color");
    fireEvent.click(
      within(colorField).getByRole("button", { name: "#333333" }),
    );
    const stored = JSON.parse(JSON.stringify(variables()));
    expect(stored.h2).toMatchObject({
      numberFontSize: 16,
      numberColor: "#333333",
      numberGap: 10,
      numberWidth: 42,
      fontSize: 22,
      color: "#272727",
    });
    const snippet = panel
      .getByText(/^## <span/, { selector: "code" })
      .textContent?.slice(3);
    const result = await finalCopy(`## ${snippet}`, stored);
    expect(
      result.querySelector<HTMLElement>(".heading-number")?.style.fontSize,
    ).toBe("16px");
    expect(
      result.querySelector<HTMLElement>(".heading-number")?.style.color,
    ).toBe("rgb(51, 51, 51)");
    expect(
      result.querySelector<HTMLElement>(".heading-number")?.style.marginBottom,
    ).toBe("10px");
    expect(
      result.querySelector<HTMLElement>(".heading-body")?.style.paddingLeft,
    ).toBe("42px");
  });

  it("invalid imported number settings use safe preset defaults", () => {
    const heading = getReadingHeadingDefaults("reading-blueprint");
    const invalid = JSON.parse(
      '{"numberFontSize":"bad","numberColor":"red; } body { display:none","numberGap":-1,"numberWidth":999}',
    );
    const css = generateCSS({
      ...defaultVariables,
      h2: { ...heading, ...invalid },
    });
    expect(css).not.toMatch(/NaN|undefined|red;|display:none/);
    expect(css).toContain("font-size: 12px;");
    expect(css).toContain("color: #2857B7;");
    expect(css).toContain("padding-left: 28px;");
    expect(css).toContain("margin-bottom: 0px;");
    expect(
      generateCSS({
        ...defaultVariables,
        h2: { ...defaultVariables.h2, ...invalid },
      }),
    ).toBe(generateCSS(defaultVariables));
  });

  it("edits Xiaoha right spacing and title size on H1 without a fixed number column", async () => {
    const { panel, variables } = panelFor("h1");
    fireEvent.click(panel.getByRole("button", { name: "小哈编号" }));
    const code = panel.getByText(/^# <span/, { selector: "code" });
    expect(code.textContent).toContain(
      '<span class="heading-number">1.</span>',
    );
    expect(panel.queryByText("编号下间距", { selector: "label" })).toBeNull();
    expect(panel.queryByText("编号栏宽度", { selector: "label" })).toBeNull();
    for (const [label, value] of [
      ["编号右间距", "8"],
      ["字号", "15"],
    ]) {
      const field = panel
        .getByText(label, { selector: "label", exact: true })
        .closest(".designer-field");
      if (!(field instanceof HTMLElement)) throw new Error(`Missing ${label}`);
      const input = within(field).getByRole("textbox");
      fireEvent.change(input, { target: { value } });
      fireEvent.blur(input);
    }
    expect(variables().h1.fontSize).toBe(15);
    const result = await finalCopy(code.textContent ?? "", variables());
    expect(
      result.querySelector<HTMLElement>(".heading-number")?.style.marginRight,
    ).toBe("8px");
    expect(
      result.querySelector<HTMLElement>(".heading-number")?.style.width,
    ).toBe("");
    expect(
      result.querySelector<HTMLElement>("h1 .content")?.style.fontSize,
    ).toBe("15px");
  });

  it.each(["reading-cinnabar", "reading-xiaoha"])(
    "keeps edited %s number fields through the real theme export/import methods",
    async (preset) => {
      const previous = useThemeStore.getState().customThemes;
      const previousStorage = localStorage.getItem("wemd-custom-themes");
      const NativeURL = URL;
      let exported: Blob | undefined;
      vi.stubGlobal(
        "URL",
        class extends NativeURL {
          static createObjectURL(blob: Blob) {
            exported = blob;
            return "blob:reading-heading-test";
          }
          static revokeObjectURL = vi.fn();
        },
      );
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => undefined,
      );
      try {
        const variables = {
          ...structuredClone(defaultVariables),
          h2: {
            ...getReadingHeadingDefaults(preset),
            numberFontSize: 18,
            numberColor: "#123456",
            numberGap: 9,
            numberWidth: 42,
          },
        };
        const original = useThemeStore
          .getState()
          .createTheme(
            "阅读标题 JSON 验证",
            "visual",
            generateCSS(variables),
            variables,
          );
        useThemeStore.getState().exportTheme(original.id);
        const exportedBlob = exported;
        if (!exportedBlob) throw new Error("No exported JSON blob");
        const json = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === "string"
              ? resolve(reader.result)
              : reject(new Error("Expected text export"));
          reader.onerror = () => reject(reader.error);
          reader.readAsText(exportedBlob);
        });
        const file = new File([json], "reading-heading.json", {
          type: "application/json",
        });
        // jsdom File lacks text(); the data still comes from the real export Blob.
        Object.defineProperty(file, "text", { value: async () => json });
        expect(await useThemeStore.getState().importTheme(file)).toBe(true);
        const imported = useThemeStore.getState().customThemes.at(-1);
        expect(imported?.designerVariables?.h2).toEqual(variables.h2);
        expect(imported?.css).toBe(generateCSS(variables));
        expect(imported?.editorMode).toBe("visual");
      } finally {
        useThemeStore.setState({ customThemes: previous });
        if (previousStorage === null)
          localStorage.removeItem("wemd-custom-themes");
        else localStorage.setItem("wemd-custom-themes", previousStorage);
      }
    },
  );
});
