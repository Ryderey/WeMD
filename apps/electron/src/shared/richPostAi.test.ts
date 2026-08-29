import test from "node:test";
import assert from "node:assert/strict";
import {
  assertApprovedRichPostEndpoint,
  parseRichPostApiKeySaveInput,
  parseRichPostElectronProbeInput,
  parseRichPostElectronRewriteInput,
  probeRichPostAi,
} from "./richPostAi";

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
    { baseUrl: "https://api.example.com/v1", model: "model" },
  );
});

test("probes the configured endpoint with the saved authorization", async () => {
  let request: RequestInit | undefined;
  await probeRichPostAi(
    {
      baseUrl: "https://api.example.com/v1",
      model: "model",
      apiKey: "secret-key",
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
  });
  assert.deepEqual(JSON.parse(String(request?.body)), {
    model: "model",
    stream: false,
    max_tokens: 1,
    messages: [{ role: "user", content: "ping" }],
  });
});
