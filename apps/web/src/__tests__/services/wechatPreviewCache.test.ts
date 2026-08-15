import { beforeEach, describe, expect, it, vi } from "vitest";

const openDBMock = vi.hoisted(() => vi.fn());

vi.mock("idb", () => ({ openDB: openDBMock }));

function record(
  url: string,
  size: number,
  lastAccessedAt: number,
  createdAt = lastAccessedAt,
) {
  return {
    url,
    blob: new Blob([new Uint8Array(1)], { type: "image/jpeg" }),
    size,
    createdAt,
    lastAccessedAt,
  };
}

beforeEach(() => {
  vi.resetModules();
  openDBMock.mockReset();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn().mockReturnValue("blob:wechat-preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("wechatPreviewCache", () => {
  it("启动清理选择过期记录并按 LRU 清理至 50 MiB", async () => {
    const {
      selectWechatPreviewCacheEvictions,
      WECHAT_PREVIEW_CACHE_MAX_BYTES,
      WECHAT_PREVIEW_CACHE_RETENTION_MS,
    } = await import("../../services/image/wechatPreviewCache");
    const now = 1_800_000_000_000;
    const records = [
      record("expired", 1, now - WECHAT_PREVIEW_CACHE_RETENTION_MS),
      record("old", 30 * 1024 * 1024, now - 3_000),
      record("new", 30 * 1024 * 1024, now - 1_000),
    ];

    expect(WECHAT_PREVIEW_CACHE_MAX_BYTES).toBe(50 * 1024 * 1024);
    expect(selectWechatPreviewCacheEvictions(records, now)).toEqual([
      "expired",
      "old",
    ]);
  });

  it("启动时只清理一次", async () => {
    const deleteRecord = vi.fn().mockResolvedValue(undefined);
    const db = {
      getAll: vi.fn().mockResolvedValue([record("expired", 1, 0)]),
      transaction: vi.fn().mockReturnValue({
        store: { delete: deleteRecord },
        done: Promise.resolve(),
      }),
    };
    openDBMock.mockResolvedValue(db);
    const { initializeWechatPreviewCache } = await import(
      "../../services/image/wechatPreviewCache"
    );

    await initializeWechatPreviewCache();
    await initializeWechatPreviewCache();

    expect(db.getAll).toHaveBeenCalledTimes(1);
    expect(deleteRecord).toHaveBeenCalledWith("expired");
  });

  it("图片入库只保存记录，不触发清理", async () => {
    const db = {
      put: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn(),
    };
    openDBMock.mockResolvedValue(db);
    const { cacheWechatPreviewImage } = await import(
      "../../services/image/wechatPreviewCache"
    );
    const blob = new Blob([new Uint8Array(8)], { type: "image/jpeg" });

    await cacheWechatPreviewImage("http://mmbiz.qpic.cn/demo", blob);

    expect(db.put).toHaveBeenCalledWith(
      "images",
      expect.objectContaining({
        url: "http://mmbiz.qpic.cn/demo",
        blob,
        size: blob.size,
      }),
    );
    expect(db.getAll).not.toHaveBeenCalled();
  });

  it("右侧预览仅替换命中的微信图片", async () => {
    const { applyWechatPreviewCache } = await import(
      "../../services/image/wechatPreviewCache"
    );
    const root = document.createElement("div");
    root.innerHTML = [
      '<img id="wechat" src="http://mmbiz.qpic.cn/demo">',
      '<img id="other" src="https://example.com/demo.jpg">',
    ].join("");
    const resolveUrl = vi.fn().mockResolvedValue("blob:wechat-preview");

    await applyWechatPreviewCache(root, resolveUrl);

    expect(resolveUrl).toHaveBeenCalledWith("http://mmbiz.qpic.cn/demo");
    expect(root.querySelector<HTMLImageElement>("#wechat")?.src).toBe(
      "blob:wechat-preview",
    );
    expect(root.querySelector<HTMLImageElement>("#other")?.src).toBe(
      "https://example.com/demo.jpg",
    );
  });

  it("缓存未命中时保留微信原 URL", async () => {
    const { applyWechatPreviewCache } = await import(
      "../../services/image/wechatPreviewCache"
    );
    const root = document.createElement("div");
    root.innerHTML = '<img src="http://mmbiz.qpic.cn/demo">';

    await applyWechatPreviewCache(root, vi.fn().mockResolvedValue(null));

    expect(root.querySelector<HTMLImageElement>("img")?.src).toBe(
      "http://mmbiz.qpic.cn/demo",
    );
  });
});
