import type { ReactElement } from "react";
import {
  RICH_POST_CUSTOM_HEADER_LIMITS,
  type RichPostAiCustomHeader,
  type RichPostCustomHeaderErrors,
} from "../../services/richPostAi";

interface RichPostCustomHeaderEditorProps {
  headers: RichPostAiCustomHeader[];
  errors: RichPostCustomHeaderErrors;
  onChange: (headers: RichPostAiCustomHeader[]) => void;
}

const EMPTY_CUSTOM_HEADER: RichPostAiCustomHeader = {
  name: "",
  value: "",
  valueSource: "literal",
  enabled: true,
  remember: false,
};

const OPEN_CODE_SESSION_HEADER_NAME = "x-opencode-session";

export function RichPostCustomHeaderEditor({
  headers,
  errors,
  onChange,
}: RichPostCustomHeaderEditorProps): ReactElement {
  const rowsFull = headers.length >= RICH_POST_CUSTOM_HEADER_LIMITS.maxRows;
  const hasOpenCodeSessionRow = headers.some(
    (header) =>
      header.name.trim().toLowerCase() === OPEN_CODE_SESSION_HEADER_NAME,
  );

  const updateHeader = (
    index: number,
    patch: Partial<RichPostAiCustomHeader>,
  ): void => {
    onChange(
      headers.map((header, currentIndex) =>
        currentIndex === index ? { ...header, ...patch } : header,
      ),
    );
  };

  const addOpenCodeSessionHeader = (): void => {
    const existingIndex = headers.findIndex(
      (header) =>
        header.name.trim().toLowerCase() === OPEN_CODE_SESSION_HEADER_NAME,
    );
    if (existingIndex >= 0) {
      updateHeader(existingIndex, { valueSource: "session", enabled: true });
      return;
    }
    if (rowsFull) return;
    onChange([
      ...headers,
      {
        ...EMPTY_CUSTOM_HEADER,
        name: OPEN_CODE_SESSION_HEADER_NAME,
        valueSource: "session",
        remember: true,
      },
    ]);
  };

  return (
    <div className="rich-post-ai-settings__custom-headers">
      <div className="rich-post-ai-settings__custom-headers-head">
        <span>自定义请求头</span>
        <div className="rich-post-ai-settings__custom-headers-actions">
          <button
            type="button"
            disabled={rowsFull}
            onClick={() => onChange([...headers, { ...EMPTY_CUSTOM_HEADER }])}
          >
            添加请求头
          </button>
          <button
            type="button"
            disabled={rowsFull && !hasOpenCodeSessionRow}
            onClick={addOpenCodeSessionHeader}
          >
            添加 OpenCode 会话头
          </button>
        </div>
      </div>

      {headers.length === 0 ? (
        <small className="rich-post-ai-settings__custom-headers-note">
          OpenCode Go 端点需要 x-opencode-session 请求头，可点击“添加 OpenCode
          会话头”自动生成稳定的会话标识。
        </small>
      ) : (
        headers.map((header, index) => (
          <div key={index} className="rich-post-ai-settings__custom-header-row">
            <input
              aria-label={`请求头名称 ${index + 1}`}
              value={header.name}
              placeholder="x-opencode-session"
              onChange={(event) =>
                updateHeader(index, { name: event.target.value })
              }
            />
            <select
              aria-label={`请求头值类型 ${index + 1}`}
              value={header.valueSource}
              onChange={(event) =>
                updateHeader(index, {
                  valueSource:
                    event.target.value === "session" ? "session" : "literal",
                })
              }
            >
              <option value="literal">固定文本</option>
              <option value="session">自动会话 ID</option>
            </select>
            <input
              aria-label={`请求头值 ${index + 1}`}
              value={header.valueSource === "session" ? "" : header.value}
              disabled={header.valueSource === "session"}
              placeholder={
                header.valueSource === "session" ? "请求时自动生成" : "值"
              }
              onChange={(event) =>
                updateHeader(index, { value: event.target.value })
              }
            />
            <label className="rich-post-ai-settings__custom-header-toggle">
              <input
                type="checkbox"
                aria-label={`启用第 ${index + 1} 行`}
                checked={header.enabled}
                onChange={(event) =>
                  updateHeader(index, { enabled: event.target.checked })
                }
              />
              启用
            </label>
            <label className="rich-post-ai-settings__custom-header-toggle">
              <input
                type="checkbox"
                aria-label={`记住第 ${index + 1} 行`}
                checked={header.remember}
                onChange={(event) =>
                  updateHeader(index, { remember: event.target.checked })
                }
              />
              本地记住
            </label>
            <button
              type="button"
              aria-label={`删除第 ${index + 1} 行`}
              onClick={() =>
                onChange(
                  headers.filter(
                    (_header, currentIndex) => currentIndex !== index,
                  ),
                )
              }
            >
              删除
            </button>
            {errors.rowErrors[index] && (
              <small
                role="alert"
                className="rich-post-ai-settings__custom-header-error"
              >
                {errors.rowErrors[index]}
              </small>
            )}
          </div>
        ))
      )}

      {errors.error && <p role="alert">{errors.error}</p>}
      <small className="rich-post-ai-settings__custom-headers-note">
        “本地记住”开启后，固定值以明文保存在本机；“自动会话 ID”
        由运行时生成，不会保存。取消记住会清除已保存的配置。
      </small>
    </div>
  );
}
