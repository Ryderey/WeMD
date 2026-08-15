import { afterEach, describe, expect, it, vi } from "vitest";
import {
  WECHAT_IMAGE_MAX_BYTES,
  WechatUploader,
} from "../../services/image/uploaders/WechatUploader";
import { ImageHostManager } from "../../services/image/ImageUploader";

const config = {
  apiBaseUrl: "http://localhost:4000/api/",
  uploadKey: "a".repeat(32),
};

function response(
  body: unknown,
  ok = true,
  statusText = "OK",
  status = 200,
): Response {
  return {
    ok,
    statusText,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function jpegFile(size = 8, name = "demo.jpg"): File {
  return new File(
    [new Uint8Array([0xff, 0xd8, 0xff]), new Uint8Array(size - 3)],
    name,
    { type: "image/jpeg" },
  );
}

function pngFile(name = "demo.png"): File {
  return new File(
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    name,
    { type: "image/png" },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WechatUploader", () => {
  it("使用 Bearer 密钥检查服务状态", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(new WechatUploader(config).validate()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/wechat-images/status",
      { headers: { Authorization: `Bearer ${config.uploadKey}` } },
    );
  });

  it("状态检查失败时保留 HTTP 状态码和服务端错误", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response(
            { message: "获取微信 access token 失败 (40164)" },
            false,
            "Bad Gateway",
            502,
          ),
        ),
    );

    await expect(new WechatUploader(config).validate()).rejects.toThrow(
      "公众号图床连接失败（HTTP 502）：获取微信 access token 失败 (40164)",
    );
  });

  it("以 multipart 原样上传文件并保留微信返回 URL", async () => {
    const file = jpegFile();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ url: "http://mmbiz.qpic.cn/demo" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(new WechatUploader(config).upload(file)).resolves.toBe(
      "http://mmbiz.qpic.cn/demo",
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: `Bearer ${config.uploadKey}`,
    });
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("接受合规 PNG 原图", async () => {
    const file = pngFile();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ url: "https://mmbiz.qpic.cn/png" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(new WechatUploader(config).upload(file)).resolves.toBe(
      "https://mmbiz.qpic.cn/png",
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("拒绝等于 1 MiB 的文件", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      new WechatUploader(config).upload(jpegFile(WECHAT_IMAGE_MAX_BYTES)),
    ).rejects.toThrow("必须小于 1 MiB");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["image/webp", "demo.webp"],
    ["image/gif", "demo.gif"],
  ])("拒绝不支持的格式 %s", async (type, name) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const file = new File([new Uint8Array([1, 2, 3])], name, { type });

    await expect(new WechatUploader(config).upload(file)).rejects.toThrow(
      "仅支持 JPG/PNG",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("拒绝 MIME 与内容不匹配的文件", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const file = new File([new Uint8Array([1, 2, 3])], "fake.jpg", {
      type: "image/jpeg",
    });

    await expect(new WechatUploader(config).upload(file)).rejects.toThrow(
      "图片内容与文件格式不匹配",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("返回代理提供的明确错误", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ message: "上传密钥错误" }, false)),
    );

    await expect(new WechatUploader(config).upload(jpegFile())).rejects.toThrow(
      "上传密钥错误",
    );
  });

  it("由公众号 adapter 处理其大小限制", async () => {
    const manager = new ImageHostManager({ type: "wechat", config });

    await expect(manager.upload(jpegFile(11 * 1024 * 1024))).rejects.toThrow(
      "必须小于 1 MiB",
    );
  });
});
