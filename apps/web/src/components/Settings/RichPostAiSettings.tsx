import { useMemo, useRef, useState, type ReactElement } from "react";
import {
  DEFAULT_RICH_POST_AI_PROMPT,
  collectRichPostCustomHeaderErrors,
  type RichPostAiSettings as Settings,
} from "../../services/richPostAi";
import { RichPostCustomHeaderEditor } from "./RichPostCustomHeaderEditor";
import "./RichPostAiSettings.css";

interface RichPostAiSettingsProps {
  settings: Settings;
  apiKey: string;
  hasElectronKey?: boolean;
  sessionId?: string | null;
  onSettingsChange: (settings: Settings) => void;
  onApiKeyChange: (apiKey: string) => void;
  onProbe?: () => void | Promise<void>;
  isProbing?: boolean;
  onSaveApiKey?: () => void | Promise<void>;
  onClearApiKey?: () => void | Promise<void>;
}

type TextSettingKey = "baseUrl" | "model" | "prompt";

export function RichPostAiSettings({
  settings,
  apiKey,
  hasElectronKey = false,
  sessionId = null,
  onSettingsChange,
  onApiKeyChange,
  onProbe,
  isProbing = false,
  onSaveApiKey,
  onClearApiKey,
}: RichPostAiSettingsProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const headerErrors = useMemo(
    () => collectRichPostCustomHeaderErrors(settings.customHeaders, sessionId),
    [settings.customHeaders, sessionId],
  );
  const hasHeaderErrors =
    headerErrors.error !== null ||
    headerErrors.rowErrors.some((message) => message !== null);
  const advancedVisible = showAdvanced || hasHeaderErrors;

  const updateText = (key: TextSettingKey, value: string) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const importPrompt = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      setImportError("仅支持 .txt 或 .md 提示词文件");
      return;
    }
    try {
      updateText("prompt", await file.text());
      setImportError("");
    } catch {
      setImportError("读取提示词文件失败");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section className="rich-post-ai-settings">
      <div className="rich-post-ai-settings__row">
        <label>
          Base URL
          <input
            value={settings.baseUrl}
            onChange={(event) => updateText("baseUrl", event.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </label>
        <label>
          模型名
          <input
            value={settings.model}
            onChange={(event) => updateText("model", event.target.value)}
            placeholder="gpt-4o-mini"
          />
        </label>
      </div>

      <div className="rich-post-ai-settings__key-row">
        <label>
          API Key
          <input
            type="password"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            autoComplete="off"
            placeholder={hasElectronKey ? "已安全保存" : "sk-..."}
          />
        </label>
        <div className="rich-post-ai-settings__key-actions">
          {onProbe && (
            <button
              type="button"
              onClick={() => void onProbe()}
              disabled={isProbing || hasHeaderErrors}
            >
              {isProbing ? "探测中…" : "探测配置"}
            </button>
          )}
          {onSaveApiKey && (
            <button type="button" onClick={() => void onSaveApiKey()}>
              安全保存 Key
            </button>
          )}
          {onClearApiKey && (
            <button type="button" onClick={() => void onClearApiKey()}>
              清除 Key
            </button>
          )}
        </div>
      </div>
      {!onSaveApiKey && !onClearApiKey && (
        <small className="rich-post-ai-settings__key-note">
          Web 版 API Key 只在当前页面会话内保留。
        </small>
      )}

      <button
        type="button"
        className="rich-post-ai-settings__advanced-toggle"
        aria-expanded={advancedVisible}
        onClick={() => setShowAdvanced((visible) => !visible)}
      >
        高级配置 · 自定义请求头
        {advancedVisible ? "（收起）" : "（展开）"}
      </button>

      {advancedVisible && (
        <RichPostCustomHeaderEditor
          headers={settings.customHeaders}
          errors={headerErrors}
          onChange={(customHeaders) =>
            onSettingsChange({ ...settings, customHeaders })
          }
        />
      )}

      <label>
        改写提示词
        <textarea
          rows={12}
          value={settings.prompt}
          onChange={(event) => updateText("prompt", event.target.value)}
        />
      </label>
      <div className="rich-post-ai-settings__prompt-actions">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          aria-label="导入提示词文件"
          onChange={(event) => void importPrompt(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => updateText("prompt", DEFAULT_RICH_POST_AI_PROMPT)}
        >
          恢复默认
        </button>
      </div>
      {importError && <p role="alert">{importError}</p>}
    </section>
  );
}
