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
    store.saveApiKey("secret-key");

    const stored = fs.readFileSync(filePath, "utf8");
    assert.equal(stored.includes("secret-key"), false);
    assert.equal(store.readApiKey(), "secret-key");
    assert.deepEqual(store.getStatus(), { hasKey: true, canPersist: true });

    store.saveApiKey("replacement-key");
    assert.equal(store.readApiKey(), "replacement-key");
    assert.equal(fs.existsSync(`${filePath}.bak`), false);

    store.clearApiKey();
    assert.equal(fs.existsSync(filePath), false);
    assert.deepEqual(store.getStatus(), { hasKey: false, canPersist: true });
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
    assert.throws(() => store.saveApiKey("secret-key"), /无法安全保存/);
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
    assert.throws(() => store.saveApiKey("secret-key"), /无法安全保存/);
    assert.equal(fs.existsSync(filePath), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
