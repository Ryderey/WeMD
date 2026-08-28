import * as fs from "fs";
import * as path from "path";

export interface AiSecretCipher {
  isEncryptionAvailable: () => boolean;
  getSelectedStorageBackend?: () => string;
  encryptString: (plainText: string) => Buffer;
  decryptString: (encrypted: Buffer) => string;
}

export interface AiSecretStoreOptions {
  getFilePath: () => string;
  cipher: AiSecretCipher;
  platform?: NodeJS.Platform;
}

export interface AiSecretStore {
  getStatus: () => { hasKey: boolean; canPersist: boolean; error?: string };
  saveApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
  readApiKey: () => string | null;
}

interface SecretFile {
  version: 1;
  ciphertext: string;
}

const ENCRYPTION_ERROR = "当前系统无法安全保存 API Key，请使用 Web 版会话密钥";

export function createAiSecretStore(
  options: AiSecretStoreOptions,
): AiSecretStore {
  const assertEncryptionAvailable = (): void => {
    const weakLinuxBackend =
      (options.platform ?? process.platform) === "linux" &&
      options.cipher.getSelectedStorageBackend?.() === "basic_text";
    if (!options.cipher.isEncryptionAvailable() || weakLinuxBackend) {
      throw new Error(ENCRYPTION_ERROR);
    }
  };

  const readApiKey = (): string | null => {
    assertEncryptionAvailable();
    const filePath = options.getFilePath();
    if (!fs.existsSync(filePath)) return null;

    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!isSecretFile(parsed)) throw new Error("invalid secret file");
      const apiKey = options.cipher
        .decryptString(Buffer.from(parsed.ciphertext, "base64"))
        .trim();
      return apiKey || null;
    } catch {
      throw new Error("已保存的 API Key 无法解密，请清除后重新保存");
    }
  };

  return {
    getStatus: () => {
      try {
        return { hasKey: readApiKey() !== null, canPersist: true };
      } catch (error) {
        return {
          hasKey: false,
          canPersist: false,
          error: error instanceof Error ? error.message : ENCRYPTION_ERROR,
        };
      }
    },
    saveApiKey: (apiKey) => {
      assertEncryptionAvailable();
      const normalized = apiKey.trim();
      if (!normalized) throw new Error("请输入 API Key");

      const filePath = options.getFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const tempPath = `${filePath}.tmp`;
      const backupPath = `${filePath}.bak`;
      const secret: SecretFile = {
        version: 1,
        ciphertext: options.cipher.encryptString(normalized).toString("base64"),
      };
      try {
        fs.writeFileSync(tempPath, JSON.stringify(secret), {
          encoding: "utf8",
          mode: 0o600,
        });
        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
        if (fs.existsSync(filePath)) fs.renameSync(filePath, backupPath);
        fs.renameSync(tempPath, filePath);
        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
      } catch {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        if (!fs.existsSync(filePath) && fs.existsSync(backupPath)) {
          fs.renameSync(backupPath, filePath);
        }
        throw new Error("保存 API Key 失败，请重试");
      }
    },
    clearApiKey: () => {
      const filePath = options.getFilePath();
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        throw new Error("清除 API Key 失败，请重试");
      }
    },
    readApiKey,
  };
}

function isSecretFile(value: unknown): value is SecretFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    value.version === 1 &&
    "ciphertext" in value &&
    typeof value.ciphertext === "string"
  );
}
