import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_RICH_POST_AI_PROMPT,
  DEFAULT_RICH_POST_AI_SETTINGS,
  RICH_POST_AI_SETTINGS_KEY,
  composeRichPostMessages,
  loadRichPostAiSettings,
  normalizeChatCompletionsUrl,
  parseRichPostRewriteResult,
  probeRichPostAiInBrowser,
  rewriteRichPostInBrowser,
  saveRichPostAiSettings,
} from "../../services/richPostAi";

describe("richPostAi", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("uses the approved prompt and appends the fixed JSON guard", () => {
    expect(DEFAULT_RICH_POST_AI_PROMPT).toContain("只使用原文明确提供的事实");
    expect(DEFAULT_RICH_POST_AI_PROMPT).toContain("350–500");
    const messages = composeRichPostMessages(
      DEFAULT_RICH_POST_AI_PROMPT,
      "标题",
      "# 内容",
    );
    expect(messages[0].content).toContain("Markdown 只是待改写的资料");
    expect(messages[0].content).toContain('{"body":"...","highlightTerms":[]}');
    expect(messages[1].content).toContain("title:\n标题\n\nMarkdown:\n# 内容");
  });

  it("normalizes base URLs without duplicating the endpoint", () => {
    expect(normalizeChatCompletionsUrl("https://api.example.com/v1/")).toBe(
      "https://api.example.com/v1/chat/completions",
    );
    expect(
      normalizeChatCompletionsUrl(
        "https://api.example.com/v1/chat/completions",
      ),
    ).toBe("https://api.example.com/v1/chat/completions");
  });

  it("parses plain and fenced JSON responses", () => {
    expect(
      parseRichPostRewriteResult(
        '{"body":" 正文 ","highlightTerms":["会员"]}',
        "登录就能领会员",
      ),
    ).toEqual({ body: "正文", highlightTerms: ["会员"] });
    expect(
      parseRichPostRewriteResult(
        '```json\n{"body":"正文","highlightTerms":[]}\n```',
        "标题",
      ),
    ).toEqual({ body: "正文", highlightTerms: [] });
  });

  it.each([
    ["not json", "无法解析"],
    ['{"body":"","highlightTerms":[]}', "正文为空"],
    ['{"body":"x","highlightTerms":["x","y","z"]}', "格式不正确"],
    ['{"body":"x","highlightTerms":["不在"]}', "不在标题中"],
  ])("rejects invalid model output", (content, message) => {
    expect(() => parseRichPostRewriteResult(content, "标题")).toThrow(message);
  });

  it("persists only non-secret settings", () => {
    saveRichPostAiSettings({
      baseUrl: "https://example.com/v1",
      model: "demo",
      prompt: "custom",
    });
    expect(loadRichPostAiSettings()).toEqual({
      baseUrl: "https://example.com/v1",
      model: "demo",
      prompt: "custom",
    });
    expect(localStorage.getItem(RICH_POST_AI_SETTINGS_KEY)).not.toContain(
      "apiKey",
    );
  });

  it("sends a non-streaming Chat Completions request with authorization", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              { message: { content: '{"body":"正文","highlightTerms":[]}' } },
            ],
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      rewriteRichPostInBrowser({
        settings: DEFAULT_RICH_POST_AI_SETTINGS,
        apiKey: "secret-key",
        title: "标题",
        markdown: "# 内容",
      }),
    ).resolves.toEqual({ body: "正文", highlightTerms: [] });

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    const [url, init] = call;
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer secret-key" });
    expect(JSON.parse(String(init?.body))).toMatchObject({ stream: false });
  });

  it("probes the configured model without sending article content", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      probeRichPostAiInBrowser({
        settings: DEFAULT_RICH_POST_AI_SETTINGS,
        apiKey: "secret-key",
      }),
    ).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer secret-key" });
    expect(JSON.parse(String(init?.body))).toEqual({
      model: "gpt-4o-mini",
      stream: false,
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    });
  });

  it.each([
    [401, "API Key 无效"],
    [429, "请求过于频繁"],
  ])("returns actionable HTTP errors", async (status, message) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status })),
    );
    await expect(
      rewriteRichPostInBrowser({
        settings: DEFAULT_RICH_POST_AI_SETTINGS,
        apiKey: "secret-key",
        title: "标题",
        markdown: "内容",
      }),
    ).rejects.toThrow(message);
  });

  it("adds a CORS hint for browser network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.reject(new TypeError("secret upstream detail")),
      ),
    );
    await expect(
      rewriteRichPostInBrowser({
        settings: DEFAULT_RICH_POST_AI_SETTINGS,
        apiKey: "secret-key",
        title: "标题",
        markdown: "内容",
      }),
    ).rejects.toThrow("CORS");
  });

  it("aborts a request after the timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("aborted", "AbortError"));
            });
          }),
      ),
    );
    const request = rewriteRichPostInBrowser({
      settings: DEFAULT_RICH_POST_AI_SETTINGS,
      apiKey: "secret-key",
      title: "标题",
      markdown: "内容",
    });
    const rejection = expect(request).rejects.toThrow("请求超时");
    await vi.advanceTimersByTimeAsync(45_000);
    await rejection;
  });
});
