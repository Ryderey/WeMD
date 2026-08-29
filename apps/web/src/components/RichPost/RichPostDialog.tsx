import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  Check,
  Copy,
  ImageIcon,
  Loader2,
  Package,
  RefreshCw,
  Settings2,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../common";
import { RichPostAiSettings } from "../Settings/RichPostAiSettings";
import { useEditorStore } from "../../store/editorStore";
import {
  getRichPostAiErrorMessage,
  loadRichPostAiSettings,
  probeRichPostAiInBrowser,
  rewriteRichPostInBrowser,
  saveRichPostAiSettings,
  type RichPostAiSettings as AiSettings,
} from "../../services/richPostAi";
import {
  DEFAULT_RICH_POST_COVER_SETTINGS,
  RICH_POST_COVER_PRESETS,
  captureRichPostCover,
  createRichPostCoverElement,
  ensureRichPostCoverFonts,
  fitRichPostCoverTitle,
  normalizeHighlightTerms,
  resolveRichPostTitle,
  type RichPostCoverSettings,
  type RichPostCoverTemplateId,
} from "../../services/richPostCover";
import {
  downloadRichPostArchive,
  formatRichPostArticle,
} from "../../services/richPostDelivery";
import "./RichPostDialog.css";

interface RichPostDialogProps {
  open: boolean;
  onClose: () => void;
}

export function RichPostDialog({
  open,
  onClose,
}: RichPostDialogProps): ReactElement {
  const markdown = useEditorStore((state) => state.markdown);
  const currentFilePath = useEditorStore((state) => state.currentFilePath);
  const sourceTitle = useMemo(
    () => resolveRichPostTitle(markdown, currentFilePath),
    [markdown, currentFilePath],
  );
  const [aiSettings, setAiSettings] = useState<AiSettings>(
    loadRichPostAiSettings,
  );
  const [apiKey, setApiKey] = useState("");
  const [hasElectronKey, setHasElectronKey] = useState(false);
  const [canPersistElectronKey, setCanPersistElectronKey] = useState(true);
  const [showAiSettings, setShowAiSettings] = useState(true);
  const [body, setBody] = useState("");
  const [coverTitle, setCoverTitle] = useState(sourceTitle);
  const [highlightTermsInput, setHighlightTermsInput] = useState("");
  const highlightTerms = useMemo(
    () =>
      normalizeHighlightTerms(coverTitle, highlightTermsInput.split(/[,，\n]/)),
    [coverTitle, highlightTermsInput],
  );
  const [coverSettings, setCoverSettings] = useState<RichPostCoverSettings>(
    DEFAULT_RICH_POST_COVER_SETTINGS,
  );
  const [rewriting, setRewriting] = useState(false);
  const [probing, setProbing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [coverError, setCoverError] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const rewriteRequestIdRef = useRef(0);
  const latestSourceRef = useRef({ markdown, currentFilePath, revision: 0 });
  const latestCoverTitleRef = useRef(coverTitle);
  if (
    latestSourceRef.current.markdown !== markdown ||
    latestSourceRef.current.currentFilePath !== currentFilePath
  ) {
    latestSourceRef.current = {
      markdown,
      currentFilePath,
      revision: latestSourceRef.current.revision + 1,
    };
  }
  latestCoverTitleRef.current = coverTitle;

  const electronAi = window.electron?.ai;
  const isEmpty = markdown.trim().length === 0;

  useEffect(() => {
    saveRichPostAiSettings(aiSettings);
  }, [aiSettings]);

  useEffect(() => {
    setBody("");
    setCoverTitle(sourceTitle);
    setHighlightTermsInput("");
    setError("");
    setRewriting(false);
  }, [markdown, currentFilePath, sourceTitle]);

  useEffect(() => {
    setHighlightTermsInput((current) =>
      normalizeHighlightTerms(coverTitle, current.split(/[,，\n]/)).join("，"),
    );
  }, [coverTitle]);

  useEffect(() => {
    if (!open || !electronAi) return;
    let cancelled = false;
    void electronAi
      .getStatus()
      .then((status) => {
        if (cancelled) return;
        setHasElectronKey(status.hasKey);
        setCanPersistElectronKey(status.canPersist);
        setError(status.error ?? "");
      })
      .catch((statusError: unknown) => {
        if (!cancelled) setError(getRichPostAiErrorMessage(statusError));
      });
    return () => {
      cancelled = true;
    };
  }, [electronAi, open]);

  useEffect(() => {
    const host = previewRef.current;
    if (!open || !host) return;
    let cancelled = false;
    host.replaceChildren();
    setCoverError("");
    if (!coverTitle.trim()) {
      setCoverError("封面标题不能为空");
      return;
    }

    const cover = createRichPostCoverElement({
      title: coverTitle,
      highlightTerms,
      settings: coverSettings,
    });
    cover.classList.add("rich-post-cover-preview__canvas");
    host.appendChild(cover);

    void ensureRichPostCoverFonts()
      .then(() => {
        if (cancelled) return;
        if (fitRichPostCoverTitle(cover) === null) {
          setCoverError("标题过长，请缩短封面专用标题");
        }
      })
      .catch((fontError: unknown) => {
        if (!cancelled) setCoverError(getRichPostAiErrorMessage(fontError));
      });

    return () => {
      cancelled = true;
      cover.remove();
    };
  }, [coverSettings, coverTitle, highlightTerms, open]);

  const saveElectronKey = async (): Promise<boolean> => {
    if (!electronAi) return false;
    try {
      const result = await electronAi.saveApiKey({
        apiKey,
        baseUrl: aiSettings.baseUrl,
      });
      setHasElectronKey(result.hasKey);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return false;
      }
      setApiKey("");
      setError("");
      toast.success("API Key 已安全保存");
      return true;
    } catch (saveError) {
      const message = getRichPostAiErrorMessage(saveError);
      setError(message);
      toast.error(message);
      return false;
    }
  };

  const clearElectronKey = async (): Promise<void> => {
    if (!electronAi) return;
    try {
      const result = await electronAi.clearApiKey();
      setHasElectronKey(result.hasKey);
      if (result.success) {
        setApiKey("");
        const status = await electronAi.getStatus();
        setHasElectronKey(status.hasKey);
        setCanPersistElectronKey(status.canPersist);
        setError(status.error ?? "");
        toast.success("API Key 已清除");
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (clearError) {
      const message = getRichPostAiErrorMessage(clearError);
      setError(message);
      toast.error(message);
    }
  };

  const probeAiConfiguration = async (): Promise<void> => {
    if (probing) return;
    setProbing(true);
    setError("");
    try {
      if (electronAi) {
        if (apiKey.trim()) {
          throw new Error("请先安全保存 API Key 后再探测");
        }
        if (!hasElectronKey) throw new Error("请先安全保存 API Key");
        const response = await electronAi.probe({
          baseUrl: aiSettings.baseUrl,
          model: aiSettings.model,
        });
        if (!response.success) throw new Error(response.error);
      } else {
        await probeRichPostAiInBrowser({
          settings: aiSettings,
          apiKey,
        });
      }
      toast.success("AI 配置连通正常");
    } catch (probeError) {
      const message = getRichPostAiErrorMessage(probeError);
      setError(message);
      toast.error(message);
    } finally {
      setProbing(false);
    }
  };

  const rewrite = async (): Promise<void> => {
    if (isEmpty || rewriting) return;
    const requestId = ++rewriteRequestIdRef.current;
    const requestSourceRevision = latestSourceRef.current.revision;
    const isCurrentRequest = (): boolean =>
      requestId === rewriteRequestIdRef.current &&
      latestSourceRef.current.revision === requestSourceRevision;
    setRewriting(true);
    setError("");
    try {
      let result;
      if (electronAi) {
        let keyReady = hasElectronKey;
        if (apiKey.trim()) {
          keyReady = await saveElectronKey();
          if (!keyReady) return;
        }
        if (!keyReady) throw new Error("请先安全保存 API Key");
        const response = await electronAi.rewrite({
          ...aiSettings,
          title: sourceTitle,
          markdown,
        });
        if (!response.success) throw new Error(response.error);
        result = response.data;
      } else {
        result = await rewriteRichPostInBrowser({
          settings: aiSettings,
          apiKey,
          title: sourceTitle,
          markdown,
        });
      }
      if (!isCurrentRequest()) return;
      setBody(result.body);
      setHighlightTermsInput(
        normalizeHighlightTerms(
          latestCoverTitleRef.current,
          result.highlightTerms,
        ).join("，"),
      );
      setShowAiSettings(false);
    } catch (rewriteError) {
      if (!isCurrentRequest()) return;
      const message = getRichPostAiErrorMessage(rewriteError);
      setError(message);
      toast.error(message);
    } finally {
      if (isCurrentRequest()) setRewriting(false);
    }
  };

  const copyArticle = async (): Promise<void> => {
    if (!body.trim()) return;
    const text = formatRichPostArticle(sourceTitle, body);
    try {
      if (window.electron?.clipboard?.writeText) {
        const result = await window.electron.clipboard.writeText(text);
        if (!result.success) throw new Error(result.error || "复制失败");
      } else {
        await navigator.clipboard.writeText(text);
      }
      toast.success("文案已复制");
    } catch (copyError) {
      toast.error(getRichPostAiErrorMessage(copyError));
    }
  };

  const exportArchive = async (): Promise<void> => {
    if (!body.trim() || exporting || coverError) return;
    setExporting(true);
    try {
      const cover = await captureRichPostCover({
        title: coverTitle,
        highlightTerms,
        settings: coverSettings,
      });
      const filename = await downloadRichPostArchive({
        cover,
        title: sourceTitle,
        body,
      });
      toast.success(`已导出 ${filename}`);
    } catch (exportError) {
      toast.error(getRichPostAiErrorMessage(exportError));
    } finally {
      setExporting(false);
    }
  };

  const changeTemplate = (templateId: RichPostCoverTemplateId): void => {
    const preset = RICH_POST_COVER_PRESETS[templateId];
    setCoverSettings({
      templateId,
      backgroundColor: preset.backgroundColor,
      accentColor: preset.accentColor,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="导出图文"
      className="modal-rich-post"
    >
      <div className="rich-post-dialog">
        <div className="rich-post-dialog__intro">
          <div>
            <span className="rich-post-dialog__eyebrow">当前文章</span>
            <strong>{sourceTitle}</strong>
            <small>首图与文案不会写回 Markdown</small>
          </div>
          <div className="rich-post-dialog__intro-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAiSettings((visible) => !visible)}
            >
              <Settings2 size={16} /> AI 配置
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={isEmpty || rewriting}
              onClick={() => void rewrite()}
            >
              {rewriting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : body ? (
                <RefreshCw size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {rewriting ? "改写中…" : body ? "重新改写" : "生成图文"}
            </button>
          </div>
        </div>

        {isEmpty && (
          <p className="rich-post-dialog__notice">内容为空，无法生成图文。</p>
        )}
        {error && <p className="rich-post-dialog__notice is-error">{error}</p>}

        {showAiSettings && (
          <div className="rich-post-dialog__ai-panel">
            <RichPostAiSettings
              settings={aiSettings}
              apiKey={apiKey}
              hasElectronKey={hasElectronKey}
              onSettingsChange={setAiSettings}
              onApiKeyChange={setApiKey}
              onProbe={() => void probeAiConfiguration()}
              isProbing={probing}
              onSaveApiKey={
                electronAi && canPersistElectronKey
                  ? () => void saveElectronKey()
                  : undefined
              }
              onClearApiKey={
                electronAi ? () => void clearElectronKey() : undefined
              }
            />
          </div>
        )}

        <div className="rich-post-dialog__workspace">
          <section className="rich-post-dialog__cover-column">
            <div className="rich-post-section-heading">
              <ImageIcon size={17} />
              <div>
                <strong>首图</strong>
                <small>1080 × 1440 PNG</small>
              </div>
            </div>

            <div className="rich-post-template-list">
              {Object.values(RICH_POST_COVER_PRESETS).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={
                    coverSettings.templateId === preset.id ? "active" : ""
                  }
                  onClick={() => changeTemplate(preset.id)}
                >
                  <span
                    style={{
                      background: preset.backgroundColor,
                      color: preset.textColor,
                    }}
                  >
                    字
                  </span>
                  <span>
                    {preset.name}
                    <small>{preset.description}</small>
                  </span>
                  {coverSettings.templateId === preset.id && (
                    <Check size={16} />
                  )}
                </button>
              ))}
            </div>

            <label className="rich-post-field">
              <span>封面专用标题</span>
              <textarea
                rows={3}
                value={coverTitle}
                onChange={(event) => setCoverTitle(event.target.value)}
                placeholder="仅影响首图，不改变文章标题"
              />
            </label>

            <label className="rich-post-field">
              <span>高亮词（最多两个，用逗号分隔）</span>
              <input
                value={highlightTermsInput}
                onChange={(event) => setHighlightTermsInput(event.target.value)}
                onBlur={() => setHighlightTermsInput(highlightTerms.join("，"))}
                placeholder="例如：免费，429"
              />
            </label>

            <div className="rich-post-color-fields">
              <label>
                <span>背景色</span>
                <input
                  type="color"
                  value={coverSettings.backgroundColor}
                  onChange={(event) =>
                    setCoverSettings((current) => ({
                      ...current,
                      backgroundColor: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>强调色</span>
                <input
                  type="color"
                  value={coverSettings.accentColor}
                  onChange={(event) =>
                    setCoverSettings((current) => ({
                      ...current,
                      accentColor: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="rich-post-cover-preview">
              <div
                ref={previewRef}
                className="rich-post-cover-preview__stage"
              />
            </div>
            {coverError && (
              <p className="rich-post-dialog__notice is-error">{coverError}</p>
            )}
          </section>

          <section className="rich-post-dialog__article-column">
            <div className="rich-post-section-heading">
              <Sparkles size={17} />
              <div>
                <strong>发布文案</strong>
                <small>复制和 ZIP 始终使用原始标题</small>
              </div>
            </div>
            <div className="rich-post-article-title">标题：{sourceTitle}</div>
            <textarea
              className="rich-post-article-editor"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="配置 AI 后点击“生成图文”，生成结果可在这里继续编辑。"
              aria-label="图文正文"
            />
            <div className="rich-post-dialog__actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={!body.trim()}
                onClick={() => void copyArticle()}
              >
                <Copy size={16} /> 复制文案
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!body.trim() || exporting || Boolean(coverError)}
                onClick={() => void exportArchive()}
              >
                {exporting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Package size={16} />
                )}
                {exporting ? "打包中…" : "导出 ZIP"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
}
