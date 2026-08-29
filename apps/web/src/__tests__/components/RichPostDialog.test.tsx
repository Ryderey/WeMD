import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { FormEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RichPostDialog } from "../../components/RichPost/RichPostDialog";
import {
  probeRichPostAiInBrowser,
  rewriteRichPostInBrowser,
} from "../../services/richPostAi";
import { useEditorStore } from "../../store/editorStore";

vi.mock("../../services/richPostAi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../services/richPostAi")>();
  return {
    ...actual,
    probeRichPostAiInBrowser: vi.fn(),
    rewriteRichPostInBrowser: vi.fn(),
  };
});

vi.mock("../../services/richPostCover", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../services/richPostCover")>();
  return {
    ...actual,
    ensureRichPostCoverFonts: vi.fn(async () => undefined),
    fitRichPostCoverTitle: vi.fn(() => 100),
  };
});

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("RichPostDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(probeRichPostAiInBrowser).mockReset();
    vi.mocked(rewriteRichPostInBrowser).mockReset();
    localStorage.clear();
    delete window.electron;
    useEditorStore.setState({
      markdown: "# 文章 A\n\n旧内容",
      currentFilePath: "A.md",
    });
  });

  it("discards an old rewrite result after switching articles", async () => {
    const first = deferred<{ body: string; highlightTerms: string[] }>();
    const second = deferred<{ body: string; highlightTerms: string[] }>();
    vi.mocked(rewriteRichPostInBrowser)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    render(<RichPostDialog open onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "test-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "生成图文" }));
    await waitFor(() =>
      expect(rewriteRichPostInBrowser).toHaveBeenCalledTimes(1),
    );

    act(() => {
      useEditorStore.setState({
        markdown: "# 文章 B\n\n新内容",
        currentFilePath: "B.md",
      });
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "生成图文" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "生成图文" }));
    await waitFor(() =>
      expect(rewriteRichPostInBrowser).toHaveBeenCalledTimes(2),
    );

    await act(async () => {
      first.resolve({ body: "文章 A 的旧结果", highlightTerms: [] });
      await first.promise;
    });
    expect(screen.getByLabelText("图文正文")).toHaveValue("");

    await act(async () => {
      second.resolve({ body: "文章 B 的新结果", highlightTerms: [] });
      await second.promise;
    });
    await waitFor(() =>
      expect(screen.getByLabelText("图文正文")).toHaveValue("文章 B 的新结果"),
    );
  });

  it("allows typing a second highlight term and removes terms invalidated by the title", async () => {
    useEditorStore.setState({
      markdown: "# 免费领取 429 会员",
      currentFilePath: "offer.md",
    });
    render(<RichPostDialog open onClose={vi.fn()} />);

    const input = screen.getByLabelText("高亮词（最多两个，用逗号分隔）");
    const typeNext = (text: string): void => {
      fireEvent.change(input, {
        target: { value: `${(input as HTMLInputElement).value}${text}` },
      });
    };
    typeNext("免费");
    typeNext("，");
    typeNext("429");
    expect(input).toHaveValue("免费，429");

    fireEvent.change(screen.getByLabelText("封面专用标题"), {
      target: { value: "全新标题" },
    });
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("probes the current Web AI configuration without generating an article", async () => {
    vi.mocked(probeRichPostAiInBrowser).mockResolvedValueOnce();
    render(<RichPostDialog open onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "test-key" },
    });

    fireEvent.click(screen.getByRole("button", { name: "探测配置" }));

    await waitFor(() =>
      expect(probeRichPostAiInBrowser).toHaveBeenCalledWith({
        settings: expect.objectContaining({
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini",
        }),
        apiKey: "test-key",
      }),
    );
    expect(rewriteRichPostInBrowser).not.toHaveBeenCalled();
  });

  it("discards an old rewrite result after switching away and back", async () => {
    const rewrite = deferred<{ body: string; highlightTerms: string[] }>();
    vi.mocked(rewriteRichPostInBrowser).mockReturnValueOnce(rewrite.promise);

    render(<RichPostDialog open onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "test-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "生成图文" }));
    await waitFor(() =>
      expect(rewriteRichPostInBrowser).toHaveBeenCalledTimes(1),
    );

    act(() => {
      useEditorStore.setState({
        markdown: "# 文章 B\n\n新内容",
        currentFilePath: "B.md",
      });
    });
    await waitFor(() =>
      expect(screen.getByLabelText("封面专用标题")).toHaveValue("文章 B"),
    );
    act(() => {
      useEditorStore.setState({
        markdown: "# 文章 A\n\n旧内容",
        currentFilePath: "A.md",
      });
    });
    await waitFor(() =>
      expect(screen.getByLabelText("封面专用标题")).toHaveValue("文章 A"),
    );

    await act(async () => {
      rewrite.resolve({ body: "文章 A 的过期结果", highlightTerms: [] });
      await rewrite.promise;
    });
    expect(screen.getByLabelText("图文正文")).toHaveValue("");
  });

  it("restores secure save immediately after clearing a damaged key", async () => {
    const getStatus = vi
      .fn()
      .mockResolvedValueOnce({
        hasKey: false,
        canPersist: false,
        error: "已保存的 API Key 无法解密，请清除后重新保存",
      })
      .mockResolvedValueOnce({ hasKey: false, canPersist: true });
    const clearApiKey = vi
      .fn()
      .mockResolvedValue({ success: true, hasKey: false });
    Object.defineProperty(window, "electron", {
      configurable: true,
      writable: true,
      value: {
        ai: {
          getStatus,
          saveApiKey: vi.fn(),
          clearApiKey,
          rewrite: vi.fn(),
        },
      },
    });

    render(<RichPostDialog open onClose={vi.fn()} />);
    await screen.findByText("已保存的 API Key 无法解密，请清除后重新保存");
    expect(
      screen.queryByRole("button", { name: "安全保存 Key" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "清除 Key" }));

    await waitFor(() => expect(clearApiKey).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "安全保存 Key" }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByText("已保存的 API Key 无法解密，请清除后重新保存"),
    ).not.toBeInTheDocument();
  });

  it("clears a stale preview and blocks export for an empty cover title", async () => {
    const { container } = render(<RichPostDialog open onClose={vi.fn()} />);
    const preview = container.querySelector(".rich-post-cover-preview__stage");
    expect(preview?.childElementCount).toBe(1);

    fireEvent.change(screen.getByLabelText("图文正文"), {
      target: { value: "可发布正文" },
    });
    fireEvent.change(screen.getByLabelText("封面专用标题"), {
      target: { value: "" },
    });

    await screen.findByText("封面标题不能为空");
    expect(preview?.childElementCount).toBe(0);
    expect(screen.getByRole("button", { name: "导出 ZIP" })).toBeDisabled();
  });

  it("closes from the header without submitting a surrounding form", () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <RichPostDialog open onClose={onClose} />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
