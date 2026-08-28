import test from "node:test";
import assert from "node:assert/strict";
import { assertApprovedRichPostEndpoint } from "./richPostAi";

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
