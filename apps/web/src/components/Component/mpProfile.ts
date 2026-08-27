export interface MpProfileValues {
  mpId: string;
  nickname: string;
  headimg: string;
  signature: string;
  serviceType: "1" | "2";
  verifyStatus: "0" | "1" | "2";
}

export interface MpAccount extends MpProfileValues {
  id: string;
}

export const MP_ACCOUNTS_STORAGE_KEY = "wemd-mp-accounts";

export const MP_PROFILE_EXAMPLE: MpProfileValues = {
  mpId: "MzIxNjA5ODQ0OQ==",
  nickname: "Doocs",
  headimg:
    "https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/gh/doocs/md/images/mp-logo.png",
  signature: "GitHub 开源组织",
  serviceType: "1",
  verifyStatus: "1",
};

export const EMPTY_MP_PROFILE: MpProfileValues = {
  mpId: "",
  nickname: "",
  headimg: "",
  signature: "",
  serviceType: "1",
  verifyStatus: "0",
};

function escapeSnippetValue(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isMpAccount(value: unknown): value is MpAccount {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.mpId === "string" &&
    typeof record.nickname === "string" &&
    typeof record.headimg === "string" &&
    typeof record.signature === "string" &&
    (record.serviceType === "1" || record.serviceType === "2") &&
    (record.verifyStatus === "0" ||
      record.verifyStatus === "1" ||
      record.verifyStatus === "2")
  );
}

function createAccountId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `mp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
}

export function createMpAccount(values: MpProfileValues): MpAccount {
  return { id: createAccountId(), ...values };
}

export function readMpAccounts(): MpAccount[] {
  try {
    const stored = window.localStorage.getItem(MP_ACCOUNTS_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isMpAccount) : [];
  } catch {
    return [];
  }
}

export function writeMpAccounts(accounts: MpAccount[]): void {
  try {
    window.localStorage.setItem(
      MP_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(accounts),
    );
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function buildMpProfileSnippet(values: MpProfileValues): string {
  const attrs = [
    `mpId="${escapeSnippetValue(values.mpId.trim())}"`,
    `nickname="${escapeSnippetValue(values.nickname.trim())}"`,
  ];
  if (values.headimg.trim()) {
    attrs.push(`headimg="${escapeSnippetValue(values.headimg.trim())}"`);
  }
  if (values.signature.trim()) {
    attrs.push(`signature="${escapeSnippetValue(values.signature.trim())}"`);
  }
  attrs.push(`serviceType="${values.serviceType}"`);
  attrs.push(`verifyStatus="${values.verifyStatus}"`);
  return `<MpProfile ${attrs.join(" ")} />`;
}

export function hasRequiredMpProfileValues(values: MpProfileValues): boolean {
  return Boolean(values.mpId.trim() && values.nickname.trim());
}
