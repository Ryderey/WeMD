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
  saveApiKey: (apiKey: string, approvedEndpoint: string) => void;
  clearApiKey: () => void;
  readCredential: () => AiSecretCredential | null;
}

export interface AiSecretCredential {
  apiKey: string;
  approvedEndpoint: string | null;
}

interface SecretFile {
  version: 1 | 2;
  ciphertext: string;
}

interface StoredCredentialV2 {
  apiKey: string;
  approvedEndpoint: string;
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

  const readCredential = (): AiSecretCredential | null => {
    assertEncryptionAvailable();
    const filePath = options.getFilePath();
    recoverInterruptedWrite(filePath);
    if (!fs.existsSync(filePath)) return null;

    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!isSecretFile(parsed)) throw new Error("invalid secret file");
      const plaintext = options.cipher.decryptString(
        Buffer.from(parsed.ciphertext, "base64"),
      );
      if (parsed.version === 1) {
        const apiKey = plaintext.trim();
        return apiKey ? { apiKey, approvedEndpoint: null } : null;
      }
      const credential: unknown = JSON.parse(plaintext);
      if (!isStoredCredentialV2(credential)) {
        throw new Error("invalid credential");
      }
      return {
        apiKey: credential.apiKey.trim(),
        approvedEndpoint: credential.approvedEndpoint,
      };
    } catch {
      throw new Error("已保存的 API Key 无法解密，请清除后重新保存");
    }
  };

  return {
    getStatus: () => {
      try {
        return { hasKey: readCredential() !== null, canPersist: true };
      } catch (error) {
        return {
          hasKey: false,
          canPersist: false,
          error: error instanceof Error ? error.message : ENCRYPTION_ERROR,
        };
      }
    },
    saveApiKey: (apiKey, approvedEndpoint) => {
      assertEncryptionAvailable();
      const normalized = apiKey.trim();
      if (!normalized) throw new Error("请输入 API Key");
      if (!approvedEndpoint.trim()) throw new Error("请输入有效的 Base URL");

      const filePath = options.getFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const tempPath = `${filePath}.tmp`;
      const backupPath = `${filePath}.bak`;
      const secret: SecretFile = {
        version: 2,
        ciphertext: options.cipher
          .encryptString(
            JSON.stringify({
              apiKey: normalized,
              approvedEndpoint: approvedEndpoint.trim(),
            } satisfies StoredCredentialV2),
          )
          .toString("base64"),
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
      const paths = [filePath, `${filePath}.tmp`, `${filePath}.bak`];
      let failed = false;
      for (const candidate of paths) {
        try {
          if (fs.existsSync(candidate)) fs.unlinkSync(candidate);
        } catch {
          failed = true;
        }
      }
      if (failed) {
        throw new Error("清除 API Key 失败，请重试");
      }
    },
    readCredential,
  };
}

function recoverInterruptedWrite(filePath: string): void {
  if (fs.existsSync(filePath)) return;

  const backupPath = `${filePath}.bak`;
  const tempPath = `${filePath}.tmp`;
  try {
    if (fs.existsSync(backupPath)) {
      fs.renameSync(backupPath, filePath);
    } else if (fs.existsSync(tempPath)) {
      fs.renameSync(tempPath, filePath);
    }
  } catch {
    throw new Error("已保存的 API Key 恢复失败，请清除后重新保存");
  }
}

function isSecretFile(value: unknown): value is SecretFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    (value.version === 1 || value.version === 2) &&
    "ciphertext" in value &&
    typeof value.ciphertext === "string"
  );
}

function isStoredCredentialV2(value: unknown): value is StoredCredentialV2 {
  return (
    typeof value === "object" &&
    value !== null &&
    "apiKey" in value &&
    typeof value.apiKey === "string" &&
    Boolean(value.apiKey.trim()) &&
    "approvedEndpoint" in value &&
    typeof value.approvedEndpoint === "string" &&
    Boolean(value.approvedEndpoint.trim())
  );
}
