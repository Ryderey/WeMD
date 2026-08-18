import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../common";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";
import {
  RATIO_PRESETS,
  DEFAULT_RATIO_ID,
  XIAOHONGSHU_MAX_IMAGES,
} from "../../services/export/paginator";
import {
  buildExport,
  capturePages,
  capturePage,
  resolveExportTitle,
  buildExportBaseName,
  buildFileNames,
  downloadBlob,
  downloadAsZip,
  saveViaElectron,
  ExportTooTallError,
  type ExportSettings,
  type ExportMode,
  type ExportFormat,
  type BuiltExport,
  type OversizedPageInfo,
} from "../../services/export/exportService";
import "./ExportDialog.css";

const STORAGE_KEYS = {
  mode: "wemd-export-mode",
  ratio: "wemd-export-ratio",
  watermark: "wemd-export-watermark",
  format: "wemd-export-format",
} as const;

const PREVIEW_DEBOUNCE_MS = 300;
const PREVIEW_SCALE = 0.25;
const SINGLE_FILE_WARN_BYTES = 32 * 1024 * 1024;

const readSetting = (key: string, fallback: string): string => {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const writeSetting = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 隐私模式等场景忽略持久化失败
  }
};

const loadSettings = (): ExportSettings => ({
  mode: (readSetting(STORAGE_KEYS.mode, "paged") as ExportMode) || "paged",
  ratioId: readSetting(STORAGE_KEYS.ratio, DEFAULT_RATIO_ID),
  watermark: readSetting(STORAGE_KEYS.watermark, ""),
  format: (readSetting(STORAGE_KEYS.format, "png") as ExportFormat) || "png",
});

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface PreviewState {
  thumbs: string[];
  totalPages: number;
  pageSize: { width: number; height: number };
  oversizedPages: OversizedPageInfo[];
  tooTall: boolean;
}

interface LightboxState {
  index: number;
  hiRes: string | null;
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const [settings, setSettings] = useState<ExportSettings>(loadSettings);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [lightboxLoading, setLightboxLoading] = useState(false);

  const markdown = useEditorStore((state) => state.markdown);
  const currentFilePath = useEditorStore((state) => state.currentFilePath);

  const runIdRef = useRef(0);
  const objectUrlsRef = useRef<string[]>([]);
  /** 预览期间保留离屏页面，供 lightbox 按需高清截图 */
  const builtRef = useRef<BuiltExport | null>(null);
  const hiResRef = useRef<Map<number, string>>(new Map());

  const ratio = useMemo(
    () =>
      RATIO_PRESETS.find((item) => item.id === settings.ratioId) ??
      RATIO_PRESETS[0],
    [settings.ratioId],
  );

  const isEmpty = markdown.trim().length === 0;

  const updateSettings = useCallback((patch: Partial<ExportSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeSetting(STORAGE_KEYS.mode, next.mode);
      writeSetting(STORAGE_KEYS.ratio, next.ratioId);
      writeSetting(STORAGE_KEYS.watermark, next.watermark);
      writeSetting(STORAGE_KEYS.format, next.format);
      return next;
    });
  }, []);

  const revokeUrls = (urls: string[]) => {
    urls.forEach((url) => URL.revokeObjectURL(url));
  };

  const clearHiRes = () => {
    hiResRef.current.forEach((url) => URL.revokeObjectURL(url));
    hiResRef.current.clear();
  };

  // 实时预览：设置或内容变更后 debounce 重建
  useEffect(() => {
    if (!open || isEmpty) {
      setPreview(null);
      return;
    }
    setPreviewing(true);
    const timer = setTimeout(async () => {
      const runId = ++runIdRef.current;
      const themeStore = useThemeStore.getState();
      const css = themeStore.getThemeCSS(themeStore.themeId);
      const pageSize =
        settings.mode === "paged"
          ? { width: ratio.width, height: ratio.height }
          : { width: 1080, height: 0 };

      let built: BuiltExport | null = null;
      try {
        built = await buildExport(markdown, css, settings, pageSize);
        if (runId !== runIdRef.current) {
          built.dispose();
          return;
        }
        const blobs = await capturePages(built, { scale: PREVIEW_SCALE });
        if (runId !== runIdRef.current) {
          built.dispose();
          return;
        }
        const thumbs = blobs.map((blob) => URL.createObjectURL(blob));
        revokeUrls(objectUrlsRef.current);
        objectUrlsRef.current = thumbs;
        builtRef.current?.dispose();
        builtRef.current = built;
        clearHiRes();
        setPreview({
          thumbs,
          totalPages: built.totalPages,
          pageSize:
            settings.mode === "paged"
              ? { width: ratio.width, height: ratio.height }
              : { width: 1080, height: 0 },
          oversizedPages: built.oversizedPages,
          tooTall: false,
        });
      } catch (error) {
        built?.dispose();
        if (runId !== runIdRef.current) return;
        if (error instanceof ExportTooTallError) {
          revokeUrls(objectUrlsRef.current);
          objectUrlsRef.current = [];
          setPreview({
            thumbs: [],
            totalPages: 0,
            pageSize,
            oversizedPages: [],
            tooTall: true,
          });
        } else {
          console.error("[ExportDialog] 预览构建失败", error);
        }
      } finally {
        if (runId === runIdRef.current) setPreviewing(false);
      }
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [open, isEmpty, markdown, settings, ratio]);

  // 关闭时释放预览资源
  useEffect(() => {
    if (open) return;
    revokeUrls(objectUrlsRef.current);
    objectUrlsRef.current = [];
    builtRef.current?.dispose();
    builtRef.current = null;
    clearHiRes();
    setPreview(null);
    setLightbox(null);
  }, [open]);

  // 点击缩略图：优先用缓存高清，否则按需 scale=1 截图
  const openLightbox = async (index: number) => {
    setLightbox({ index, hiRes: hiResRef.current.get(index) ?? null });
    if (hiResRef.current.has(index)) return;
    const built = builtRef.current;
    if (!built) return;
    setLightboxLoading(true);
    try {
      const blob = await capturePage(built, index, { scale: 1 });
      const url = URL.createObjectURL(blob);
      hiResRef.current.set(index, url);
      setLightbox((current) =>
        current && current.index === index ? { index, hiRes: url } : current,
      );
    } catch (error) {
      console.error("[ExportDialog] 高清预览生成失败", error);
    } finally {
      setLightboxLoading(false);
    }
  };

  const handleExport = async () => {
    if (isEmpty || exporting) return;

    if (preview && preview.oversizedPages.length > 0) {
      const pageList = preview.oversizedPages
        .map((item) => item.page)
        .join("、");
      const confirmed = window.confirm(
        `第 ${pageList} 页含超长块，将等比缩小适配到单页，是否继续？`,
      );
      if (!confirmed) return;
    }

    setExporting(true);
    let built: BuiltExport | null = null;
    try {
      const themeStore = useThemeStore.getState();
      const css = themeStore.getThemeCSS(themeStore.themeId);
      const pageSize =
        settings.mode === "paged"
          ? { width: ratio.width, height: ratio.height }
          : { width: 1080, height: 0 };

      built = await buildExport(markdown, css, settings, pageSize);
      const blobs = await capturePages(built, { format: settings.format });
      built.dispose();
      built = null;

      const title = resolveExportTitle(currentFilePath);
      const baseName = buildExportBaseName(title);
      const filenames = buildFileNames(baseName, blobs.length, settings.format);
      const files = blobs.map((blob, index) => ({
        filename: filenames[index],
        blob,
      }));

      const oversizeFile = files.find(
        (file) => file.blob.size > SINGLE_FILE_WARN_BYTES,
      );

      const electronResult = await saveViaElectron(files, baseName);
      if (electronResult) {
        if (electronResult.canceled) return;
        if (!electronResult.success) {
          throw new Error(electronResult.error || "保存失败");
        }
        toast.success(
          electronResult.path
            ? `已保存至 ${electronResult.path}`
            : `已导出 ${files.length} 张图`,
        );
      } else if (files.length === 1) {
        downloadBlob(files[0].blob, files[0].filename);
        toast.success("已导出长图");
      } else {
        await downloadAsZip(files, baseName);
        toast.success(`已导出 ${files.length} 张图（ZIP）`);
      }

      if (oversizeFile) {
        toast("单张图片超过 32MB，上传平台可能受限，建议改用 JPEG", {
          icon: "⚠️",
        });
      }
      if (settings.mode === "paged" && blobs.length > XIAOHONGSHU_MAX_IMAGES) {
        toast(
          `小红书单篇最多 ${XIAOHONGSHU_MAX_IMAGES} 图，本次 ${blobs.length} 张，建议拆分多篇`,
          { icon: "⚠️" },
        );
      }
    } catch (error) {
      built?.dispose();
      if (error instanceof ExportTooTallError) {
        toast.error("内容过长超出画布上限，请切换切图模式");
      } else {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(`导出失败: ${message}`);
      }
    } finally {
      setExporting(false);
    }
  };

  const exportLabel =
    settings.mode === "long"
      ? "导出长图"
      : `导出 ${preview?.totalPages ?? "?"} 张`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="导出图片"
      className="modal-export"
    >
      <div className="export-dialog">
        <div className="export-settings">
          <div className="export-field">
            <span className="export-field-label">导出模式</span>
            <div className="export-segmented">
              <button
                type="button"
                className={settings.mode === "paged" ? "active" : ""}
                onClick={() => updateSettings({ mode: "paged" })}
              >
                切图·小红书
              </button>
              <button
                type="button"
                className={settings.mode === "long" ? "active" : ""}
                onClick={() => updateSettings({ mode: "long" })}
              >
                单张长图
              </button>
            </div>
          </div>

          {settings.mode === "paged" && (
            <>
              <div className="export-field">
                <span className="export-field-label">页面比例</span>
                <div className="export-ratio-chips">
                  {RATIO_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`export-ratio-chip ${
                        settings.ratioId === preset.id ? "active" : ""
                      }`}
                      onClick={() => updateSettings({ ratioId: preset.id })}
                    >
                      {preset.label}
                      <small>
                        {preset.width}×{preset.height}
                      </small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="export-field">
                <span className="export-field-label">水印文字（选填）</span>
                <input
                  className="export-watermark-input"
                  type="text"
                  placeholder="@你的账号名"
                  value={settings.watermark}
                  maxLength={40}
                  onChange={(event) =>
                    updateSettings({ watermark: event.target.value })
                  }
                />
              </div>
            </>
          )}

          <div className="export-field">
            <span className="export-field-label">图片格式</span>
            <div className="export-segmented">
              <button
                type="button"
                className={settings.format === "png" ? "active" : ""}
                onClick={() => updateSettings({ format: "png" })}
              >
                PNG
              </button>
              <button
                type="button"
                className={settings.format === "jpeg" ? "active" : ""}
                onClick={() => updateSettings({ format: "jpeg" })}
              >
                JPEG
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary export-submit"
            disabled={isEmpty || exporting || !preview || preview.tooTall}
            onClick={handleExport}
          >
            {exporting ? "导出中…" : exportLabel}
          </button>
        </div>

        <div className="export-preview">
          {isEmpty ? (
            <div className="export-preview-empty">内容为空，无法导出</div>
          ) : preview?.tooTall ? (
            <div className="export-preview-error">
              内容总高度超出浏览器画布上限，请切换「切图·小红书」模式
            </div>
          ) : (
            <>
              <div className="export-preview-meta">
                {previewing
                  ? "预览生成中…"
                  : preview
                    ? settings.mode === "paged"
                      ? `共 ${preview.totalPages} 页 · ${preview.pageSize.width}×${preview.pageSize.height}`
                      : `单张长图 · 宽 ${preview.pageSize.width}px`
                    : ""}
                {preview &&
                  settings.mode === "paged" &&
                  preview.totalPages > XIAOHONGSHU_MAX_IMAGES && (
                    <span className="export-preview-warn">
                      小红书单篇最多 {XIAOHONGSHU_MAX_IMAGES} 图，建议拆分多篇
                    </span>
                  )}
              </div>
              {preview && preview.oversizedPages.length > 0 && (
                <div className="export-preview-warn export-preview-warn-block">
                  第{" "}
                  {preview.oversizedPages.map((item) => item.page).join("、")}{" "}
                  页含超长块，导出时将等比缩小
                </div>
              )}
              <div className="export-preview-list">
                {preview?.thumbs.map((thumb, index) => {
                  const oversizedInfo = preview.oversizedPages.find(
                    (item) => item.page === index + 1,
                  );
                  return (
                    <button
                      key={thumb}
                      type="button"
                      className={`export-preview-thumb${
                        oversizedInfo ? " is-oversized" : ""
                      }`}
                      title={
                        oversizedInfo
                          ? `超长块：${oversizedInfo.excerpt}`
                          : undefined
                      }
                      onClick={() => openLightbox(index)}
                    >
                      <img src={thumb} alt={`第 ${index + 1} 页预览`} />
                      <span className="export-preview-page-no">
                        {index + 1}
                      </span>
                      {oversizedInfo && (
                        <span className="export-preview-oversized-badge">
                          超长块
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {lightbox && preview && (
        <div className="export-lightbox" onClick={() => setLightbox(null)}>
          {lightboxLoading && !lightbox.hiRes && (
            <span className="export-lightbox-loading">高清预览生成中…</span>
          )}
          <img
            src={lightbox.hiRes ?? preview.thumbs[lightbox.index]}
            alt={`第 ${lightbox.index + 1} 页预览大图`}
          />
          <span className="export-lightbox-counter">
            {lightbox.index + 1} / {preview.totalPages}
          </span>
        </div>
      )}
    </Modal>
  );
}
