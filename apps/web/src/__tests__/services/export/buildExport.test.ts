import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  renderOffscreenContent: vi.fn(),
  applyWechatPreviewCache: vi.fn(async () => undefined),
}));

vi.mock("../../../services/export/renderContainer", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    renderOffscreenContent: mocked.renderOffscreenContent,
  };
});

vi.mock("../../../services/image/wechatPreviewCache", () => ({
  applyWechatPreviewCache: mocked.applyWechatPreviewCache,
}));

import { buildExport } from "../../../services/export/exportService";

/** 构建带 N 个伪块的离屏容器 */
const makeSourceContainer = (blockCount: number): HTMLElement => {
  const container = document.createElement("div");
  const section = document.createElement("section");
  section.id = "wemd";
  for (let index = 0; index < blockCount; index += 1) {
    const paragraph = document.createElement("p");
    paragraph.textContent = `块 ${index + 1}`;
    section.appendChild(paragraph);
  }
  container.appendChild(section);
  return container;
};

describe("buildExport 管线编排", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("切图模式：以页内容宽度渲染容器并生成带页脚的页面", async () => {
    const source = makeSourceContainer(3);
    const dispose = vi.fn(() => source.remove());
    mocked.renderOffscreenContent.mockResolvedValue({
      container: source,
      dispose,
    });

    const built = await buildExport(
      "# 标题",
      "#wemd p { margin: 16px 0; }",
      { mode: "paged", ratioId: "3:4", watermark: "@wemd", format: "png" },
      { width: 1080, height: 1440 },
    );

    // 容器宽度 = 页宽 - 左右边距（1080 - 80*2），且不走微信专用转换
    expect(mocked.renderOffscreenContent).toHaveBeenCalledWith(
      "# 标题",
      "#wemd p { margin: 16px 0; }",
      { widthPx: 920, forWechat: false },
    );
    // jsdom 中块高为 0，全部合入单页；页脚按方案 B 渲染
    expect(built.totalPages).toBe(1);
    const footer = built.pages[0].querySelector(".wemd-export-footer");
    expect(footer).toBeTruthy();
    expect(footer?.textContent).toContain("1 / 1");
    expect(footer?.textContent).toContain("@wemd");
    expect(built.oversizedCount).toBe(0);

    built.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(document.body.contains(source)).toBe(false);
  });

  it("切图模式：无水印时页脚仅含页码", async () => {
    const source = makeSourceContainer(2);
    mocked.renderOffscreenContent.mockResolvedValue({
      container: source,
      dispose: () => source.remove(),
    });

    const built = await buildExport(
      "内容",
      "",
      { mode: "paged", ratioId: "3:4", watermark: "", format: "png" },
      { width: 1080, height: 1440 },
    );

    const footer = built.pages[0].querySelector(".wemd-export-footer");
    expect(footer?.children).toHaveLength(1);
    expect(footer?.textContent).toBe("1 / 1");
    built.dispose();
  });

  it("长图模式：单页且无页脚", async () => {
    const source = makeSourceContainer(2);
    mocked.renderOffscreenContent.mockResolvedValue({
      container: source,
      dispose: () => source.remove(),
    });

    const built = await buildExport(
      "内容",
      "",
      { mode: "long", ratioId: "3:4", watermark: "@wemd", format: "png" },
      { width: 1080, height: 0 },
    );

    expect(built.totalPages).toBe(1);
    expect(built.pages[0].querySelector(".wemd-export-footer")).toBeNull();
    built.dispose();
  });

  it("渲染失败时释放容器并抛出错误", async () => {
    mocked.renderOffscreenContent.mockRejectedValue(new Error("渲染失败"));

    await expect(
      buildExport(
        "内容",
        "",
        { mode: "paged", ratioId: "3:4", watermark: "", format: "png" },
        { width: 1080, height: 1440 },
      ),
    ).rejects.toThrow("渲染失败");
  });

  it("截图前应用微信图床缓存同源化", async () => {
    const source = makeSourceContainer(1);
    mocked.renderOffscreenContent.mockResolvedValue({
      container: source,
      dispose: () => source.remove(),
    });

    const built = await buildExport(
      "内容",
      "",
      { mode: "paged", ratioId: "3:4", watermark: "", format: "png" },
      { width: 1080, height: 1440 },
    );

    expect(mocked.applyWechatPreviewCache).toHaveBeenCalledWith(source);
    built.dispose();
  });
});
