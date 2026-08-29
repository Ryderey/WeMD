import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createAiSecretStore, type AiSecretCipher } from "./ai-secret-store";

function createCipher(overrides: Partial<AiSecretCipher> = {}): AiSecretCipher {
  return {
    isEncryptionAvailable: () => true,
    getSelectedStorageBackend: () => "kwallet6",
    encryptString: (value) => Buffer.from(`encrypted:${value}`, "utf8"),
    decryptString: (value) => value.toString("utf8").replace(/^encrypted:/, ""),
    ...overrides,
  };
}

test("API Key is encrypted, readable, queryable, and clearable", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wemd-ai-secret-"));
  const filePath = path.join(dir, "ai-secrets.json");
  try {
    const store = createAiSecretStore({
      getFilePath: () => filePath,
      cipher: createCipher(),
    });
    store.saveApiKey(
      "secret-key",
      "https://api.example.com/v1/chat/completions",
    );

    const stored = fs.readFileSync(filePath, "utf8");
    assert.equal(stored.includes("secret-key"), false);
    assert.equal(stored.includes("api.example.com"), false);
    assert.deepEqual(store.readCredential(), {
      apiKey: "secret-key",
      approvedEndpoint: "https://api.example.com/v1/chat/completions",
    });
    assert.deepEqual(store.getStatus(), { hasKey: true, canPersist: true });

    store.saveApiKey(
      "replacement-key",
      "https://second.example.com/v1/chat/completions",
    );
    assert.deepEqual(store.readCredential(), {
      apiKey: "replacement-key",
      approvedEndpoint: "https://second.example.com/v1/chat/completions",
    });
    assert.equal(fs.existsSync(`${filePath}.bak`), false);

    store.clearApiKey();
    assert.equal(fs.existsSync(filePath), false);
    assert.deepEqual(store.getStatus(), { hasKey: false, canPersist: true });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("legacy keys remain readable but are not trusted for any endpoint", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wemd-ai-secret-"));
  const filePath = path.join(dir, "ai-secrets.json");
  const cipher = createCipher();
  try {
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        version: 1,
        ciphertext: cipher.encryptString("legacy-key").toString("base64"),
      }),
    );
    const store = createAiSecretStore({
      getFilePath: () => filePath,
      cipher,
    });

    assert.deepEqual(store.readCredential(), {
      apiKey: "legacy-key",
      approvedEndpoint: null,
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("recovers a committed backup after an interrupted replacement", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wemd-ai-secret-"));
  const filePath = path.join(dir, "ai-secrets.json");
  try {
    const store = createAiSecretStore({
      getFilePath: () => filePath,
      cipher: createCipher(),
    });
    store.saveApiKey("secret-key", "https://api.example.com/chat/completions");
    fs.renameSync(filePath, `${filePath}.bak`);
    fs.writeFileSync(`${filePath}.tmp`, "incomplete", "utf8");

    assert.deepEqual(store.readCredential(), {
      apiKey: "secret-key",
      approvedEndpoint: "https://api.example.com/chat/completions",
    });
    assert.equal(fs.existsSync(filePath), true);
    assert.equal(fs.existsSync(`${filePath}.bak`), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("recovers a completed temporary file on the first interrupted save", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wemd-ai-secret-"));
  const filePath = path.join(dir, "ai-secrets.json");
  try {
    const store = createAiSecretStore({
      getFilePath: () => filePath,
      cipher: createCipher(),
    });
    store.saveApiKey("secret-key", "https://api.example.com/chat/completions");
    fs.renameSync(filePath, `${filePath}.tmp`);

    assert.equal(store.getStatus().hasKey, true);
    assert.equal(fs.existsSync(filePath), true);
    assert.equal(fs.existsSync(`${filePath}.tmp`), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("clear removes the main, temporary, and backup ciphertext files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wemd-ai-secret-"));
  const filePath = path.join(dir, "ai-secrets.json");
  try {
    const store = createAiSecretStore({
      getFilePath: () => filePath,
      cipher: createCipher(),
    });
    store.saveApiKey("secret-key", "https://api.example.com/chat/completions");
    fs.copyFileSync(filePath, `${filePath}.tmp`);
    fs.copyFileSync(filePath, `${filePath}.bak`);

    store.clearApiKey();

    for (const candidate of [filePath, `${filePath}.tmp`, `${filePath}.bak`]) {
      assert.equal(fs.existsSync(candidate), false);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("unavailable encryption refuses persistence without writing a file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wemd-ai-secret-"));
  const filePath = path.join(dir, "ai-secrets.json");
  try {
    const store = createAiSecretStore({
      getFilePath: () => filePath,
      cipher: createCipher({ isEncryptionAvailable: () => false }),
    });
    assert.throws(
      () =>
        store.saveApiKey(
          "secret-key",
          "https://api.example.com/v1/chat/completions",
        ),
      /无法安全保存/,
    );
    assert.equal(fs.existsSync(filePath), false);
    assert.equal(store.getStatus().canPersist, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("Linux basic_text backend refuses persistence", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wemd-ai-secret-"));
  const filePath = path.join(dir, "ai-secrets.json");
  try {
    const store = createAiSecretStore({
      getFilePath: () => filePath,
      platform: "linux",
      cipher: createCipher({ getSelectedStorageBackend: () => "basic_text" }),
    });
    assert.throws(
      () =>
        store.saveApiKey(
          "secret-key",
          "https://api.example.com/v1/chat/completions",
        ),
      /无法安全保存/,
    );
    assert.equal(fs.existsSync(filePath), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
