import { beforeEach, describe, expect, it, vi } from "vitest";

const { domToBlobMock } = vi.hoisted(() => ({
  domToBlobMock: vi.fn(async () =>
    Promise.resolve(new Blob(["png"], { type: "image/png" })),
  ),
}));

let fontLoadMock: ReturnType<typeof vi.fn>;

vi.mock("modern-screenshot", () => ({ domToBlob: domToBlobMock }));

import {
  DEFAULT_RICH_POST_COVER_SETTINGS,
  RICH_POST_COVER_HEIGHT,
  RICH_POST_COVER_WIDTH,
  RichPostCoverOverflowError,
  captureRichPostCover,
  createRichPostCoverElement,
  fitRichPostCoverTitle,
  normalizeHighlightTerms,
  resolveRichPostTitle,
} from "../../services/richPostCover";

describe("richPostCover", () => {
  beforeEach(() => {
    domToBlobMock.mockClear();
    fontLoadMock = vi.fn(async () => [{} as FontFace]);
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: {
        load: fontLoadMock,
        ready: Promise.resolve(),
      },
    });
  });

  it("uses the first real H1 and ignores fenced pseudo headings", () => {
    expect(
      resolveRichPostTitle(
        "```md\n# 代码里的标题\n```\n\n## 二级标题\n\n# 真正标题\n\n正文",
        "D:\\docs\\文件名.md",
      ),
    ).toBe("真正标题");
  });

  it.each([
    ["", "D:\\docs\\我的文章.md", "我的文章"],
    ["正文首行", "/docs/note.markdown", "note"],
    ["## 只有二级标题", undefined, "未命名文章"],
  ])("falls back to filename or unnamed", (markdown, path, expected) => {
    expect(resolveRichPostTitle(markdown, path)).toBe(expected);
  });

  it("keeps inline H1 text without Markdown markers", () => {
    expect(resolveRichPostTitle("# **重要** `更新`", undefined)).toBe(
      "重要 更新",
    );
  });

  it("normalizes invalid, duplicate, and excessive highlights", () => {
    expect(
      normalizeHighlightTerms("登录就能领一个月会员", [
        "会员",
        "不存在",
        " 会员 ",
        "一个月",
        "登录",
      ]),
    ).toEqual(["会员", "一个月"]);
  });

  it("renders both visual templates with text-safe highlights", () => {
    const warm = createRichPostCoverElement({
      title: "登录就能领会员",
      highlightTerms: ["会员"],
      settings: DEFAULT_RICH_POST_COVER_SETTINGS,
    });
    expect(warm.style.width).toBe("1080px");
    expect(warm.style.height).toBe("1440px");
    expect(warm.textContent).toContain("登录就能领会员");
    expect(warm.querySelector("[data-rich-post-title] span")?.textContent).toBe(
      "会员",
    );

    const cool = createRichPostCoverElement({
      title: "商汤免费又加码",
      highlightTerms: ["免费"],
      settings: {
        templateId: "cool-underline",
        backgroundColor: "#ffffff",
        accentColor: "#00ffcc",
      },
    });
    const highlight = cool.querySelector<HTMLElement>(
      "[data-rich-post-title] span",
    );
    expect(highlight?.style.backgroundImage).toContain("rgb(0, 255, 204)");
  });

  it("shrinks the title and reports overflow at the minimum size", () => {
    const cover = createRichPostCoverElement({
      title: "较长标题",
      highlightTerms: [],
      settings: DEFAULT_RICH_POST_COVER_SETTINGS,
    });
    const title = cover.querySelector<HTMLElement>("[data-rich-post-title]");
    expect(title).not.toBeNull();
    if (!title) return;

    Object.defineProperties(title, {
      clientHeight: { configurable: true, value: 864 },
      clientWidth: { configurable: true, value: 728 },
      scrollHeight: {
        configurable: true,
        get: () => (Number.parseInt(title.style.fontSize, 10) > 80 ? 900 : 700),
      },
      scrollWidth: { configurable: true, value: 700 },
    });
    expect(fitRichPostCoverTitle(cover)).toBe(80);

    Object.defineProperty(title, "scrollHeight", {
      configurable: true,
      value: 999,
    });
    expect(fitRichPostCoverTitle(cover)).toBeNull();
  });

  it("captures an exact 1080 by 1440 PNG after loading fonts", async () => {
    const originalDescriptors = Object.fromEntries(
      ["clientHeight", "clientWidth", "scrollHeight", "scrollWidth"].map(
        (property) => [
          property,
          Object.getOwnPropertyDescriptor(HTMLElement.prototype, property),
        ],
      ),
    );
    Object.defineProperties(HTMLElement.prototype, {
      clientHeight: { configurable: true, get: () => 900 },
      clientWidth: { configurable: true, get: () => 900 },
      scrollHeight: { configurable: true, get: () => 100 },
      scrollWidth: { configurable: true, get: () => 100 },
    });
    try {
      const blob = await captureRichPostCover({
        title: "标题",
        highlightTerms: [],
        settings: DEFAULT_RICH_POST_COVER_SETTINGS,
      });
      expect(blob.type).toBe("image/png");
      expect(fontLoadMock).toHaveBeenCalledTimes(2);
      expect(domToBlobMock).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          width: RICH_POST_COVER_WIDTH,
          height: RICH_POST_COVER_HEIGHT,
          type: "image/png",
        }),
      );
    } finally {
      for (const [property, descriptor] of Object.entries(
        originalDescriptors,
      )) {
        if (descriptor) {
          Object.defineProperty(HTMLElement.prototype, property, descriptor);
        } else {
          Reflect.deleteProperty(HTMLElement.prototype, property);
        }
      }
    }
  });

  it("uses a dedicated overflow error", () => {
    expect(new RichPostCoverOverflowError().message).toContain("缩短");
  });

  it("blocks capture when a bundled font is unavailable", async () => {
    fontLoadMock.mockResolvedValueOnce([]);

    await expect(
      captureRichPostCover({
        title: "标题",
        highlightTerms: [],
        settings: DEFAULT_RICH_POST_COVER_SETTINGS,
      }),
    ).rejects.toThrow("字体加载失败");
    expect(domToBlobMock).not.toHaveBeenCalled();
  });
});
