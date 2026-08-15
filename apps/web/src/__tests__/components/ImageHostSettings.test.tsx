import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageHostSettings } from "../../components/Settings/ImageHostSettings";

describe("ImageHostSettings 公众号图床", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("保存、测试并启用公众号图床配置", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ImageHostSettings />);

    fireEvent.click(screen.getByRole("button", { name: "公众号" }));
    fireEvent.change(screen.getByPlaceholderText("https://example.com/api"), {
      target: { value: "http://localhost:4000/api" },
    });
    fireEvent.change(screen.getByPlaceholderText("服务端 WECHAT_UPLOAD_KEY"), {
      target: { value: "a".repeat(32) },
    });

    fireEvent.click(screen.getByRole("button", { name: "测试连接" }));
    await screen.findByText("✅ 配置有效");
    fireEvent.click(screen.getByRole("button", { name: "启用公众号图床" }));

    await waitFor(() => {
      expect(screen.getByText("当前使用中")).toBeInTheDocument();
      expect(
        JSON.parse(localStorage.getItem("imageHostConfig") ?? "{}"),
      ).toEqual({
        type: "wechat",
        config: {
          apiBaseUrl: "http://localhost:4000/api",
          uploadKey: "a".repeat(32),
        },
      });
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("测试连接失败时显示 HTTP 状态码和服务端错误", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: vi.fn().mockResolvedValue({
          message: "获取微信 access token 失败 (40164)",
        }),
      }),
    );
    render(<ImageHostSettings />);

    fireEvent.click(screen.getByRole("button", { name: "公众号" }));
    fireEvent.change(screen.getByPlaceholderText("https://example.com/api"), {
      target: { value: "http://localhost:4000/api" },
    });
    fireEvent.change(screen.getByPlaceholderText("服务端 WECHAT_UPLOAD_KEY"), {
      target: { value: "a".repeat(32) },
    });

    fireEvent.click(screen.getByRole("button", { name: "测试连接" }));
    await screen.findByText(
      "❌ 公众号图床连接失败（HTTP 502）：获取微信 access token 失败 (40164)",
    );
  });

  it("生成并复制 32 位上传密钥", async () => {
    const randomUUID = vi
      .fn()
      .mockReturnValue("01234567-89ab-cdef-0123-456789abcdef");
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("crypto", { randomUUID });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<ImageHostSettings />);

    fireEvent.click(screen.getByRole("button", { name: "公众号" }));
    fireEvent.click(screen.getByRole("button", { name: "生成 32 位密钥" }));

    const input = screen.getByPlaceholderText("服务端 WECHAT_UPLOAD_KEY");
    expect(input).toHaveValue("0123456789abcdef0123456789abcdef");
    fireEvent.click(screen.getByRole("button", { name: "复制密钥" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "0123456789abcdef0123456789abcdef",
      );
    });
  });
});
