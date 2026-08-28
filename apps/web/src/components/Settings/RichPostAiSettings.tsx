import { useRef, useState } from "react";
import {
  DEFAULT_RICH_POST_AI_PROMPT,
  type RichPostAiSettings as Settings,
} from "../../services/richPostAi";
import "./RichPostAiSettings.css";

interface RichPostAiSettingsProps {
  settings: Settings;
  apiKey: string;
  hasElectronKey?: boolean;
  onSettingsChange: (settings: Settings) => void;
  onApiKeyChange: (apiKey: string) => void;
  onSaveApiKey?: () => void | Promise<void>;
  onClearApiKey?: () => void | Promise<void>;
}

export function RichPostAiSettings({
  settings,
  apiKey,
  hasElectronKey = false,
  onSettingsChange,
  onApiKeyChange,
  onSaveApiKey,
  onClearApiKey,
}: RichPostAiSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");

  const update = (key: keyof Settings, value: string) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const importPrompt = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      setImportError("仅支持 .txt 或 .md 提示词文件");
      return;
    }
    try {
      update("prompt", await file.text());
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
            onChange={(event) => update("baseUrl", event.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </label>
        <label>
          模型名
          <input
            value={settings.model}
            onChange={(event) => update("model", event.target.value)}
            placeholder="gpt-4o-mini"
          />
        </label>
      </div>

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
        {onSaveApiKey && (
          <button type="button" onClick={() => void onSaveApiKey()}>
            安全保存 Key
          </button>
        )}
        {onClearApiKey ? (
          <button type="button" onClick={() => void onClearApiKey()}>
            清除 Key
          </button>
        ) : (
          !onSaveApiKey && (
            <small>Web 版 API Key 只在当前页面会话内保留。</small>
          )
        )}
      </div>

      <label>
        改写提示词
        <textarea
          rows={12}
          value={settings.prompt}
          onChange={(event) => update("prompt", event.target.value)}
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
          onClick={() => update("prompt", DEFAULT_RICH_POST_AI_PROMPT)}
        >
          恢复默认
        </button>
      </div>
      {importError && <p role="alert">{importError}</p>}
    </section>
  );
}
