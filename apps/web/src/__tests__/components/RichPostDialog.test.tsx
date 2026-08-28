import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RichPostDialog } from "../../components/RichPost/RichPostDialog";
import { rewriteRichPostInBrowser } from "../../services/richPostAi";
import { useEditorStore } from "../../store/editorStore";

vi.mock("../../services/richPostAi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../services/richPostAi")>();
  return { ...actual, rewriteRichPostInBrowser: vi.fn() };
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
});
