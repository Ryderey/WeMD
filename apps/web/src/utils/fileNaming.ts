// eslint-disable-next-line no-control-regex
const WINDOWS_INVALID_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;
const MAX_FILE_NAME_LENGTH = 100;

export function sanitizeFileName(name: string): string {
  const trimmed = name.trim();
  const withoutInvalid = trimmed.replace(WINDOWS_INVALID_CHARS, "_");
  const collapsed = withoutInvalid.replace(/_+/g, "_").replace(/^_+|_+$/g, "");

  if (!collapsed) {
    return "未命名";
  }

  let base = collapsed;
  let ext = "";
  const lastDot = collapsed.lastIndexOf(".");
  if (lastDot > 0) {
    base = collapsed.slice(0, lastDot);
    ext = collapsed.slice(lastDot);
  }

  const maxBaseLength = Math.max(1, MAX_FILE_NAME_LENGTH - ext.length);
  const truncatedBase = base.slice(0, maxBaseLength);
  return `${truncatedBase}${ext}`;
}

export function generateUniqueFileName(
  baseName: string,
  extension: string,
  existingNames: string[],
): string {
  const safeBase = sanitizeFileName(baseName);
  const safeExt = extension.startsWith(".") ? extension : `.${extension}`;
  const ext = extension ? safeExt : "";

  const normalizedExisting = new Set(
    existingNames.map((name) => name.toLowerCase()),
  );

  const fullName = `${safeBase}${ext}`;
  if (!normalizedExisting.has(fullName.toLowerCase())) {
    return fullName;
  }

  const suffixPattern = new RegExp(
    `^${escapeRegExp(safeBase)}-(\\d+)${escapeRegExp(ext)}$`,
    "i",
  );

  let maxIndex = 0;
  for (const name of existingNames) {
    const match = name.match(suffixPattern);
    if (match) {
      maxIndex = Math.max(maxIndex, parseInt(match[1], 10));
    }
  }

  return `${safeBase}-${maxIndex + 1}${ext}`;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
