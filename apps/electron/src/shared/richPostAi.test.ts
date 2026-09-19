import test from "node:test";
import assert from "node:assert/strict";
import {
  assertApprovedRichPostEndpoint,
  parseRichPostApiKeySaveInput,
  parseRichPostElectronProbeInput,
  parseRichPostElectronRewriteInput,
  probeRichPostAi,
  requestRichPostRewrite,
  type RichPostAiCustomHeader,
} from "./richPostAi";

const sessionHeader: RichPostAiCustomHeader = {
  name: "x-opencode-session",
  value: "",
  valueSource: "session",
  enabled: true,
  remember: true,
};

test("only allows the endpoint bound to the saved API Key", () => {
  const approved = "https://api.example.com/v1/chat/completions";

  assert.equal(
    assertApprovedRichPostEndpoint("https://api.example.com/v1/", approved),
    approved,
  );
  assert.throws(
    () => assertApprovedRichPostEndpoint("https://evil.example/v1", approved),
    /端点已变更/,
  );
  assert.throws(
    () => assertApprovedRichPostEndpoint("https://api.example.com/v1", null),
    /尚未绑定/,
  );
});

test("validates renderer inputs before the main process uses them", () => {
  assert.deepEqual(
    parseRichPostApiKeySaveInput({
      apiKey: "secret-key",
      baseUrl: "https://api.example.com/v1",
    }),
    {
      apiKey: "secret-key",
      baseUrl: "https://api.example.com/v1",
    },
  );
  assert.deepEqual(
    parseRichPostElectronRewriteInput({
      baseUrl: "https://api.example.com/v1",
      model: "model",
      prompt: "prompt",
      title: "title",
      markdown: "markdown",
    }),
    {
      baseUrl: "https://api.example.com/v1",
      model: "model",
      prompt: "prompt",
      customHeaders: [],
      sessionId: null,
      title: "title",
      markdown: "markdown",
    },
  );
  assert.deepEqual(
    parseRichPostElectronRewriteInput({
      baseUrl: "https://api.example.com/v1",
      model: "model",
      prompt: "prompt",
      customHeaders: [sessionHeader],
      sessionId: "session-123",
      title: "title",
      markdown: "markdown",
    }),
    {
      baseUrl: "https://api.example.com/v1",
      model: "model",
      prompt: "prompt",
      customHeaders: [sessionHeader],
      sessionId: "session-123",
      title: "title",
      markdown: "markdown",
    },
  );

  assert.throws(() => parseRichPostApiKeySaveInput(null), /参数格式/);
  assert.throws(
    () =>
      parseRichPostElectronRewriteInput({
        baseUrl: "https://api.example.com/v1",
        model: "model",
        prompt: "prompt",
        title: "title",
        markdown: 42,
      }),
    /参数格式/,
  );
  assert.throws(
    () =>
      parseRichPostElectronRewriteInput({
        baseUrl: "https://api.example.com/v1",
        model: "model",
        prompt: "prompt",
        title: "title",
        markdown: "x".repeat(5_000_001),
      }),
    /内容过长/,
  );
  assert.deepEqual(
    parseRichPostElectronProbeInput({
      baseUrl: "https://api.example.com/v1",
      model: "model",
    }),
    {
      baseUrl: "https://api.example.com/v1",
      model: "model",
      customHeaders: [],
      sessionId: null,
    },
  );
});

test("rejects malformed custom header IPC payloads", () => {
  const base = {
    baseUrl: "https://api.example.com/v1",
    model: "model",
    prompt: "prompt",
    title: "title",
    markdown: "markdown",
  };

  assert.throws(
    () =>
      parseRichPostElectronRewriteInput({
        ...base,
        customHeaders: [{ name: "x-demo" }],
      }),
    /参数格式/,
  );
  assert.throws(
    () =>
      parseRichPostElectronRewriteInput({
        ...base,
        customHeaders: [{ ...sessionHeader, valueSource: "other" }],
      }),
    /参数格式/,
  );
  assert.throws(
    () => parseRichPostElectronRewriteInput({ ...base, customHeaders: "junk" }),
    /参数格式/,
  );
  assert.throws(
    () =>
      parseRichPostElectronRewriteInput({
        ...base,
        customHeaders: Array.from({ length: 21 }, (_item, index) => ({
          ...sessionHeader,
          name: `x-demo-${index}`,
        })),
      }),
    /最多 20 行/,
  );
  assert.throws(
    () => parseRichPostElectronRewriteInput({ ...base, sessionId: 42 }),
    /参数格式/,
  );
  assert.throws(
    () => parseRichPostElectronRewriteInput({ ...base, sessionId: "  " }),
    /参数格式/,
  );
  assert.throws(
    () => parseRichPostElectronRewriteInput({ ...base, sessionId: "a\r\nb" }),
    /参数格式/,
  );
  assert.throws(
    () => parseRichPostElectronRewriteInput({ ...base, sessionId: "中文" }),
    /参数格式/,
  );
  assert.throws(
    () =>
      parseRichPostElectronRewriteInput({
        ...base,
        sessionId: "x".repeat(129),
      }),
    /参数格式/,
  );
});

test("rejects unsendable header values before any request is made", async () => {
  let requested = false;
  const fetcher = async (): Promise<Response> => {
    requested = true;
    return new Response(null, { status: 200 });
  };
  const base = {
    baseUrl: "https://api.example.com/v1",
    model: "model",
    prompt: "prompt",
    apiKey: "secret-key",
    title: "title",
    markdown: "markdown",
  };

  await assert.rejects(
    requestRichPostRewrite(
      {
        ...base,
        customHeaders: [sessionHeader],
        sessionId: "a\r\nb",
      },
      { fetcher },
    ),
    /会话 ID 包含非法字符/,
  );
  await assert.rejects(
    requestRichPostRewrite(
      {
        ...base,
        customHeaders: [
          {
            name: "x-demo",
            value: "中文值",
            valueSource: "literal",
            enabled: true,
            remember: false,
          },
        ],
        sessionId: "session-123",
      },
      { fetcher },
    ),
    /Latin-1/,
  );
  assert.equal(requested, false);
});

test("probes the configured endpoint with the saved authorization", async () => {
  let request: RequestInit | undefined;
  await probeRichPostAi(
    {
      baseUrl: "https://api.example.com/v1",
      model: "model",
      apiKey: "secret-key",
      customHeaders: [sessionHeader],
      sessionId: "session-123",
    },
    {
      fetcher: async (_url, init) => {
        request = init;
        return new Response(null, { status: 200 });
      },
    },
  );

  assert.deepEqual(request?.headers, {
    Authorization: "Bearer secret-key",
    "Content-Type": "application/json",
    "x-opencode-session": "session-123",
  });
  assert.deepEqual(JSON.parse(String(request?.body)), {
    model: "model",
    stream: false,
    max_tokens: 1,
    messages: [{ role: "user", content: "ping" }],
  });
});

test("keeps endpoint binding and rejects invalid custom headers before fetching", async () => {
  let requested = false;
  const result = await requestRichPostRewrite(
    {
      baseUrl: "https://api.example.com/v1",
      model: "model",
      prompt: "prompt",
      customHeaders: [sessionHeader],
      sessionId: "session-123",
      apiKey: "secret-key",
      title: "title",
      markdown: "markdown",
    },
    {
      fetcher: async (_url, init) => {
        requested = true;
        const headers = init?.headers as Record<string, string>;
        assert.equal(headers["x-opencode-session"], "session-123");
        assert.equal(headers.Authorization, "Bearer secret-key");
        return new Response(
          JSON.stringify({
            choices: [
              { message: { content: '{"body":"正文","highlightTerms":[]}' } },
            ],
          }),
          { status: 200 },
        );
      },
    },
  );
  assert.deepEqual(result, { body: "正文", highlightTerms: [] });
  assert.equal(requested, true);

  requested = false;
  await assert.rejects(
    requestRichPostRewrite(
      {
        baseUrl: "https://api.example.com/v1",
        model: "model",
        prompt: "prompt",
        customHeaders: [
          {
            name: "x-demo",
            value: "v",
            valueSource: "literal",
            enabled: true,
            remember: false,
          },
          {
            name: "X-DEMO",
            value: "v",
            valueSource: "literal",
            enabled: true,
            remember: false,
          },
        ],
        sessionId: "session-123",
        apiKey: "secret-key",
        title: "title",
        markdown: "markdown",
      },
      {
        fetcher: async () => {
          requested = true;
          return new Response(null, { status: 200 });
        },
      },
    ),
    /重复/,
  );
  assert.equal(requested, false);
});
