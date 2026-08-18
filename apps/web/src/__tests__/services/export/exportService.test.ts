import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  resolveExportTitle,
  buildExportBaseName,
  buildFileNames,
  measureBlocks,
  localizeImages,
  resetImageProxyCache,
} from "../../../services/export/exportService";

describe("resolveExportTitle", () => {
  it("无文件时回退 WeMD", () => {
    expect(resolveExportTitle(undefined)).toBe("WeMD");
    expect(resolveExportTitle("")).toBe("WeMD");
  });

  it("取 basename 并去扩展名（Windows 路径）", () => {
    expect(resolveExportTitle("D:\\docs\\我的文章.md")).toBe("我的文章");
  });

  it("取 basename 并去扩展名（POSIX 路径）", () => {
    expect(resolveExportTitle("/docs/note.md")).toBe("note");
  });

  it("清洗文件名非法字符", () => {
    expect(resolveExportTitle("/docs/a/b:c*d.md")).toBe("b_c_d");
  });
});

describe("buildExportBaseName", () => {
  it("生成 WeMD-{标题}-{yyyyMMdd-HHmm} 格式", () => {
    const fixed = new Date(2026, 7, 17, 9, 5);
    expect(buildExportBaseName("测试", fixed)).toBe("WeMD-测试-20260817-0905");
  });
});

describe("buildFileNames", () => {
  it("单张使用完整基础名", () => {
    expect(buildFileNames("WeMD-a-20260817-0905", 1, "png")).toEqual([
      "WeMD-a-20260817-0905.png",
    ]);
  });

  it("多张使用序号命名", () => {
    expect(buildFileNames("base", 3, "jpeg")).toEqual([
      "01.jpg",
      "02.jpg",
      "03.jpg",
    ]);
  });
});

describe("measureBlocks", () => {
  const stubLayout = (
    el: HTMLElement,
    offsetTop: number,
    offsetHeight: number,
  ) => {
    Object.defineProperty(el, "offsetTop", { value: offsetTop });
    Object.defineProperty(el, "offsetHeight", { value: offsetHeight });
  };

  it("末块取自身高度而非累计偏移（回归：末块误判超长）", () => {
    const root = document.createElement("div");
    const first = document.createElement("p");
    const last = document.createElement("p");
    root.append(first, last);
    stubLayout(first, 0, 400);
    stubLayout(last, 420, 100);

    const measures = measureBlocks(root);
    expect(measures[0].height).toBe(420);
    expect(measures[1].height).toBe(100);
  });
});

describe("localizeImages 代理回退", () => {
  beforeEach(() => {
    resetImageProxyCache();
    vi.unstubAllGlobals();
  });

  const buildRoot = (src: string): HTMLElement => {
    const root = document.createElement("div");
    const img = document.createElement("img");
    img.setAttribute("src", src);
    root.appendChild(img);
    return root;
  };

  const imageBlob = () =>
    new Blob([new Uint8Array([1])], { type: "image/png" });

  it("直连成功时直接本地化，不走代理", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      blob: async () => imageBlob(),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const root = buildRoot("https://remote.example/a.png");

    const failed = await localizeImages(root);

    expect(failed).toBe(0);
    expect(root.querySelector("img")?.src).toMatch(/^blob:/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("直连跨域失败时回退 Nest 代理取图", async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.startsWith("https://remote.example/")) {
        throw new TypeError("CORS blocked");
      }
      if (url.includes("/proxy/image")) {
        if (url.includes("127.0.0.1%3A9")) return { ok: false, status: 400 };
        return { ok: true, status: 200, blob: async () => imageBlob() };
      }
      return { ok: false, status: 404 };
    });
    vi.stubGlobal("fetch", fetchMock);
    const root = buildRoot("https://remote.example/a.png");

    const failed = await localizeImages(root);

    expect(failed).toBe(0);
    expect(root.querySelector("img")?.src).toMatch(/^blob:/);
    expect(calls.some((u) => u.includes("/proxy/image?url="))).toBe(true);
  });

  it("代理不可用时计为失败且保留原 src", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("CORS blocked");
    });
    vi.stubGlobal("fetch", fetchMock);
    const root = buildRoot("https://remote.example/a.png");

    const failed = await localizeImages(root);

    expect(failed).toBe(1);
    expect(root.querySelector("img")?.getAttribute("src")).toBe(
      "https://remote.example/a.png",
    );
  });

  it("代理返回非图片类型时计为失败", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("https://remote.example/")) {
        throw new TypeError("CORS blocked");
      }
      if (url.includes("127.0.0.1%3A9")) return { ok: false, status: 400 };
      return {
        ok: true,
        status: 200,
        blob: async () =>
          new Blob([new Uint8Array([60])], { type: "text/html" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    const root = buildRoot("https://remote.example/a.png");

    const failed = await localizeImages(root);

    expect(failed).toBe(1);
  });
});
