import { openDB, type DBSchema, type IDBPDatabase } from "idb";

const DB_NAME = "wemd-wechat-image-preview-cache";
const DB_VERSION = 1;
const STORE_NAME = "images";

export const WECHAT_PREVIEW_CACHE_MAX_BYTES = 50 * 1024 * 1024;
export const WECHAT_PREVIEW_CACHE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export interface WechatPreviewCacheRecord {
  url: string;
  blob: Blob;
  size: number;
  createdAt: number;
  lastAccessedAt: number;
}

interface WechatPreviewCacheDB extends DBSchema {
  images: {
    key: string;
    value: WechatPreviewCacheRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<WechatPreviewCacheDB>> | null = null;
let startupCleanupPromise: Promise<void> | null = null;
const objectUrls = new Map<string, string>();
const pendingObjectUrls = new Map<string, Promise<string | null>>();

function getDB(): Promise<IDBPDatabase<WechatPreviewCacheDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WechatPreviewCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "url" });
        }
      },
    });
  }
  return dbPromise;
}

export function selectWechatPreviewCacheEvictions(
  records: WechatPreviewCacheRecord[],
  now: number,
): string[] {
  const evicted = new Set<string>();
  const retained = records.filter((record) => {
    const expired =
      now - record.lastAccessedAt >= WECHAT_PREVIEW_CACHE_RETENTION_MS;
    if (expired) evicted.add(record.url);
    return !expired;
  });

  let totalBytes = retained.reduce((total, record) => total + record.size, 0);
  retained.sort(
    (left, right) =>
      left.lastAccessedAt - right.lastAccessedAt ||
      left.createdAt - right.createdAt,
  );
  for (const record of retained) {
    if (totalBytes <= WECHAT_PREVIEW_CACHE_MAX_BYTES) break;
    evicted.add(record.url);
    totalBytes -= record.size;
  }

  return [...evicted];
}

async function cleanupWechatPreviewCache(now = Date.now()): Promise<void> {
  const db = await getDB();
  const records = await db.getAll(STORE_NAME);
  const evictions = selectWechatPreviewCacheEvictions(records, now);
  if (evictions.length === 0) return;

  const tx = db.transaction(STORE_NAME, "readwrite");
  for (const url of evictions) {
    await tx.store.delete(url);
  }
  await tx.done;
}

export function initializeWechatPreviewCache(): Promise<void> {
  if (!startupCleanupPromise) {
    startupCleanupPromise = cleanupWechatPreviewCache().catch((error) => {
      console.warn("[WechatPreviewCache] startup cleanup failed", error);
    });
  }
  return startupCleanupPromise;
}

export async function cacheWechatPreviewImage(
  url: string,
  blob: Blob,
): Promise<void> {
  if (startupCleanupPromise) await startupCleanupPromise;

  const db = await getDB();
  const now = Date.now();
  await db.put(STORE_NAME, {
    url,
    blob,
    size: blob.size,
    createdAt: now,
    lastAccessedAt: now,
  });

  const previousUrl = objectUrls.get(url);
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  objectUrls.set(url, URL.createObjectURL(blob));
}

export async function getWechatPreviewImageUrl(
  url: string,
): Promise<string | null> {
  const existingUrl = objectUrls.get(url);
  if (existingUrl) return existingUrl;
  const pendingUrl = pendingObjectUrls.get(url);
  if (pendingUrl) return pendingUrl;

  const loadPromise = (async () => {
    if (startupCleanupPromise) await startupCleanupPromise;
    const db = await getDB();
    const record = await db.get(STORE_NAME, url);
    if (!record) return null;

    const objectUrl = URL.createObjectURL(record.blob);
    objectUrls.set(url, objectUrl);
    await db.put(STORE_NAME, { ...record, lastAccessedAt: Date.now() });
    return objectUrl;
  })().finally(() => pendingObjectUrls.delete(url));
  pendingObjectUrls.set(url, loadPromise);
  return loadPromise;
}

function isWechatImageUrl(value: string): boolean {
  try {
    return new URL(value).hostname === "mmbiz.qpic.cn";
  } catch {
    return false;
  }
}

export async function applyWechatPreviewCache(
  root: HTMLElement,
  resolveUrl: (
    url: string,
  ) => Promise<string | null> = getWechatPreviewImageUrl,
): Promise<void> {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    images.map(async (image) => {
      const sourceUrl = image.getAttribute("src");
      if (!sourceUrl || !isWechatImageUrl(sourceUrl)) return;

      const previewUrl = await resolveUrl(sourceUrl);
      if (previewUrl) image.src = previewUrl;
    }),
  );
}
