import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_RICH_POST_AI_PROMPT,
  DEFAULT_RICH_POST_AI_SETTINGS,
  RICH_POST_AI_SETTINGS_KEY,
  buildRichPostRequestHeaders,
  composeRichPostMessages,
  createRichPostSessionId,
  loadRichPostAiSettings,
  normalizeChatCompletionsUrl,
  parseRichPostRewriteResult,
  probeRichPostAiInBrowser,
  rewriteRichPostInBrowser,
  saveRichPostAiSettings,
  type RichPostAiCustomHeader,
} from "../../services/richPostAi";

function literalHeader(
  overrides: Partial<RichPostAiCustomHeader> = {},
): RichPostAiCustomHeader {
  return {
    name: "x-demo",
    value: "demo-value",
    valueSource: "literal",
    enabled: true,
    remember: false,
    ...overrides,
  };
}

function sessionHeader(
  overrides: Partial<RichPostAiCustomHeader> = {},
): RichPostAiCustomHeader {
  return {
    name: "x-opencode-session",
    value: "",
    valueSource: "session",
    enabled: true,
    remember: true,
    ...overrides,
  };
}

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
      customHeaders: [],
    });
    expect(loadRichPostAiSettings()).toEqual({
      baseUrl: "https://example.com/v1",
      model: "demo",
      prompt: "custom",
      customHeaders: [],
    });
    expect(localStorage.getItem(RICH_POST_AI_SETTINGS_KEY)).not.toContain(
      "apiKey",
    );
  });

  it("loads legacy settings without custom headers", () => {
    localStorage.setItem(
      RICH_POST_AI_SETTINGS_KEY,
      JSON.stringify({
        baseUrl: "https://example.com/v1",
        model: "demo",
        prompt: "custom",
      }),
    );
    expect(loadRichPostAiSettings()).toEqual({
      baseUrl: "https://example.com/v1",
      model: "demo",
      prompt: "custom",
      customHeaders: [],
    });
  });

  it("drops invalid stored custom header rows", () => {
    localStorage.setItem(
      RICH_POST_AI_SETTINGS_KEY,
      JSON.stringify({
        baseUrl: "https://example.com/v1",
        model: "demo",
        prompt: "custom",
        customHeaders: [
          literalHeader({ remember: true }),
          { name: "x-bad" },
          "junk",
          {
            name: "x-bad-source",
            value: "v",
            valueSource: "other",
            enabled: true,
          },
          literalHeader({ name: "x-missing-enabled", enabled: undefined }),
          literalHeader({ name: "x-off", enabled: false, remember: true }),
        ],
      }),
    );
    expect(loadRichPostAiSettings().customHeaders).toEqual([
      literalHeader({ remember: true }),
      literalHeader({ name: "x-off", enabled: false, remember: true }),
    ]);
  });

  it("persists only remembered rows and never session-generated values", () => {
    saveRichPostAiSettings({
      baseUrl: "https://example.com/v1",
      model: "demo",
      prompt: "custom",
      customHeaders: [
        literalHeader({ remember: true, value: "kept" }),
        literalHeader({ name: "x-ephemeral", value: "gone", remember: false }),
        sessionHeader({ value: "typed-but-unused", remember: true }),
      ],
    });
    expect(loadRichPostAiSettings().customHeaders).toEqual([
      literalHeader({ remember: true, value: "kept" }),
      sessionHeader({ value: "" }),
    ]);
    const stored = localStorage.getItem(RICH_POST_AI_SETTINGS_KEY) ?? "";
    expect(stored).not.toContain("gone");
    expect(stored).not.toContain("typed-but-unused");
  });

  it("creates a UUID-shaped session id", () => {
    expect(createRichPostSessionId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("builds system headers plus enabled custom rows", () => {
    const headers = buildRichPostRequestHeaders({
      apiKey: "secret-key",
      customHeaders: [
        literalHeader({ name: "X-Demo", value: "demo-value" }),
        sessionHeader(),
        literalHeader({ name: "x-off", enabled: false }),
        literalHeader({ name: "  ", value: "  ", enabled: true }),
      ],
      sessionId: "session-123",
    });
    expect(headers).toEqual({
      Authorization: "Bearer secret-key",
      "Content-Type": "application/json",
      "X-Demo": "demo-value",
      "x-opencode-session": "session-123",
    });
  });

  it("rejects invalid custom header configurations before sending", () => {
    const cases: [RichPostAiCustomHeader[], string, string | null][] = [
      [
        [literalHeader({ name: "x-dup" }), literalHeader({ name: "X-Dup" })],
        "重复",
        "s",
      ],
      [[literalHeader({ name: "Bad Name" })], "字段名合法字符", "s"],
      [[literalHeader({ name: "authorization" })], "由系统管理", "s"],
      [[literalHeader({ name: "AUTHORIZATION" })], "由系统管理", "s"],
      [[literalHeader({ name: "Content-Type" })], "由系统管理", "s"],
      [[literalHeader({ name: "Cookie" })], "浏览器或传输层限制", "s"],
      [
        [literalHeader({ name: "x-demo", value: "a\r\nb" })],
        "换行或控制字符",
        "s",
      ],
      [[literalHeader({ name: "x-demo", value: " " })], "请填写请求头值", "s"],
      [[literalHeader({ name: "" })], "请填写请求头名称", "s"],
      [[sessionHeader()], "会话 ID 未就绪", null],
    ];
    for (const [customHeaders, message, sessionId] of cases) {
      expect(() =>
        buildRichPostRequestHeaders({ apiKey: "k", customHeaders, sessionId }),
      ).toThrow(message);
    }
  });

  it("rejects header values that cannot be sent as a byte string", async () => {
    expect(() =>
      buildRichPostRequestHeaders({
        apiKey: "k",
        customHeaders: [literalHeader({ name: "x-demo", value: "中文值" })],
        sessionId: "session-123",
      }),
    ).toThrow("Latin-1");
    expect(() =>
      buildRichPostRequestHeaders({
        apiKey: "k",
        customHeaders: [sessionHeader()],
        sessionId: "a\r\nb",
      }),
    ).toThrow("会话 ID 包含非法字符");

    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      rewriteRichPostInBrowser({
        settings: {
          ...DEFAULT_RICH_POST_AI_SETTINGS,
          customHeaders: [literalHeader({ name: "x-demo", value: "中文值" })],
        },
        apiKey: "secret-key",
        sessionId: "session-123",
        title: "标题",
        markdown: "# 内容",
      }),
    ).rejects.toThrow("Latin-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("produces headers accepted by the native Headers implementation", () => {
    const headers = buildRichPostRequestHeaders({
      apiKey: "secret-key",
      customHeaders: [
        literalHeader({ name: "x-demo", value: "demo-value" }),
        literalHeader({ name: "x-latin1", value: "café" }),
        sessionHeader(),
      ],
      sessionId: "session-123",
    });
    const native = new Headers(headers);
    expect(native.get("Authorization")).toBe("Bearer secret-key");
    expect(native.get("x-demo")).toBe("demo-value");
    expect(native.get("x-latin1")).toBe("café");
    expect(() => new Headers({ "x-demo": "中文值" })).toThrow();
  });

  it("rejects custom header rows beyond the limits", () => {
    const many = Array.from({ length: 21 }, (_item, index) =>
      literalHeader({ name: `x-demo-${index}`, value: "v" }),
    );
    expect(() =>
      buildRichPostRequestHeaders({ apiKey: "k", customHeaders: many }),
    ).toThrow("最多 20 行");
    expect(() =>
      buildRichPostRequestHeaders({
        apiKey: "k",
        customHeaders: [literalHeader({ value: "x".repeat(17 * 1024) })],
      }),
    ).toThrow("16 KB");
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
        settings: {
          ...DEFAULT_RICH_POST_AI_SETTINGS,
          customHeaders: [
            literalHeader({ name: "x-demo", value: "demo-value" }),
            sessionHeader(),
          ],
        },
        apiKey: "secret-key",
        sessionId: "session-123",
        title: "标题",
        markdown: "# 内容",
      }),
    ).resolves.toEqual({ body: "正文", highlightTerms: [] });

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    const [url, init] = call;
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer secret-key",
      "x-demo": "demo-value",
      "x-opencode-session": "session-123",
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({ stream: false });
  });

  it("rejects invalid custom headers without calling fetch", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      rewriteRichPostInBrowser({
        settings: {
          ...DEFAULT_RICH_POST_AI_SETTINGS,
          customHeaders: [
            literalHeader({ name: "x-dup" }),
            literalHeader({ name: "X-DUP" }),
          ],
        },
        apiKey: "secret-key",
        sessionId: "session-123",
        title: "标题",
        markdown: "# 内容",
      }),
    ).rejects.toThrow("重复");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("probes the configured model without sending article content", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      probeRichPostAiInBrowser({
        settings: {
          ...DEFAULT_RICH_POST_AI_SETTINGS,
          customHeaders: [sessionHeader()],
        },
        apiKey: "secret-key",
        sessionId: "session-123",
      }),
    ).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer secret-key",
      "x-opencode-session": "session-123",
    });
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
