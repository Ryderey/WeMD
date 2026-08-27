import {
  buildComponentSnippet,
  MP_PROFILE_DEFINITION,
  type MpProfileValues,
} from "./builtInComponents";

export {
  EMPTY_MP_PROFILE,
  MP_PROFILE_EXAMPLE,
  type MpProfileValues,
} from "./builtInComponents";

export interface MpAccount extends MpProfileValues {
  id: string;
}

export const MP_ACCOUNTS_STORAGE_KEY = "wemd-mp-accounts";

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
  return buildComponentSnippet(MP_PROFILE_DEFINITION, values);
}

export function hasRequiredMpProfileValues(values: MpProfileValues): boolean {
  return Boolean(values.mpId.trim() && values.nickname.trim());
}
