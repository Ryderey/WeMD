import type { HeadingSectionProps, HeadingLevel } from "../types";
import toast from "react-hot-toast";
import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";
import {
  getReadingHeadingPreset,
  getReadingHeadingDefaults,
  getReadingHeadingSnippet,
  resolveReadingHeadingNumbers,
} from "../readingHeadings";
import {
  headingSizePresets,
  marginPresets,
  headingStylePresets,
  fontFamilyOptions,
} from "../../../../config/styleOptions";

const headingTabs: { id: HeadingLevel; label: string }[] = [
  { id: "h1", label: "H1" },
  { id: "h2", label: "H2" },
  { id: "h3", label: "H3" },
  { id: "h4", label: "H4" },
];

const chapterLabelSnippet = '<span class="chapter-label">SECTION 01</span>';

export function HeadingSection({
  variables,
  activeHeading,
  setActiveHeading,
  updateHeading,
}: HeadingSectionProps) {
  const reading = getReadingHeadingPreset(variables[activeHeading].preset);
  const readingSnippet = reading ? getReadingHeadingSnippet(reading) : "";
  const numbers = reading
    ? resolveReadingHeadingNumbers(reading, variables[activeHeading])
    : undefined;
  const copySnippet = async (snippet: string, successMessage: string) => {
    try {
      if (window.electron?.clipboard?.writeText) {
        const result = await window.electron.clipboard.writeText(snippet);
        if (!result.success) throw new Error("复制失败");
      } else {
        await navigator.clipboard.writeText(snippet);
      }
      toast.success(successMessage);
    } catch {
      toast.error("复制失败，请手动复制示例中的 HTML 代码");
    }
  };

  return (
    <div className="designer-section">
      <div className="designer-subtabs">
        {headingTabs.map((tab) => (
          <button
            key={tab.id}
            className={`subtab ${activeHeading === tab.id ? "active" : ""}`}
            onClick={() => setActiveHeading(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="designer-field">
        <div className="designer-field-header">
          <label>样式预设</label>
          <div className="compact-switch">
            <span>居中</span>
            <label className="designer-switch">
              <input
                type="checkbox"
                checked={variables[activeHeading].centered}
                onChange={(e) =>
                  updateHeading(activeHeading, { centered: e.target.checked })
                }
              />
              <span className="switch-slider"></span>
            </label>
          </div>
        </div>
        <div className="designer-options">
          <button
            className={`option-btn ${!variables[activeHeading].preset || variables[activeHeading].preset === "simple" ? "active" : ""}`}
            onClick={() => updateHeading(activeHeading, { preset: "simple" })}
          >
            无样式
          </button>
          {headingStylePresets
            .filter((p) => p.id !== "simple")
            .map((preset) => (
              <button
                key={preset.id}
                className={`option-btn ${variables[activeHeading].preset === preset.id ? "active" : ""}`}
                onClick={() =>
                  updateHeading(
                    activeHeading,
                    getReadingHeadingPreset(preset.id)
                      ? getReadingHeadingDefaults(preset.id)
                      : preset.id === "chapter-label"
                        ? {
                            preset: preset.id,
                            fontSize: 20,
                            color: "#FFA900",
                            lineHeight: 1.5,
                            fontWeight: "750",
                            letterSpacing: 0.2,
                            marginTop: 0,
                            marginBottom: 24,
                            centered: false,
                          }
                        : { preset: preset.id },
                  )
                }
              >
                {preset.label}
              </button>
            ))}
        </div>
        {variables[activeHeading].preset === "chapter-label" && (
          <>
            <p className="designer-field-hint">
              将标签粘贴到正文标题文字前，修改 SECTION 01 编号。例如：
              <br />
              <code>
                {`${"#".repeat(Number(activeHeading.slice(1)))} ${chapterLabelSnippet}建立阅读层级`}
              </code>
              <br />
              标签和编号需手动填写，预设不会自动生成。
            </p>
            <button
              className="option-btn"
              type="button"
              onClick={() =>
                copySnippet(
                  chapterLabelSnippet,
                  "标签已复制，请粘贴到正文标题文字前，并修改编号",
                )
              }
            >
              复制标签代码
            </button>
          </>
        )}
        {reading && numbers && (
          <>
            <p className="designer-field-hint">
              {reading.label}：将 HTML 结构粘贴到 Markdown 标题的 # 后，修改
              {` ${reading.numberText ?? "01"} `}
              和标题文字。编号需手动填写，普通编号标题不会自动转换。
              <code className="designer-heading-snippet">
                {`${"#".repeat(Number(activeHeading.slice(1)))} ${readingSnippet}`}
              </code>
              结构已包含章前线，无需另加 ---；已有分隔线时请删除重复的线。
              换主题不会删除正文中的 HTML 结构。
            </p>
            <button
              className="option-btn"
              type="button"
              onClick={() =>
                copySnippet(
                  readingSnippet,
                  "标题 HTML 已复制，请粘贴到 Markdown 标题的 # 后，并修改编号和标题",
                )
              }
            >
              复制标题 HTML
            </button>
            <div className="designer-field">
              <label>编号字号</label>
              <SliderInput
                value={numbers.fontSize}
                onChange={(numberFontSize) =>
                  updateHeading(activeHeading, { numberFontSize })
                }
                min={8}
                max={48}
              />
            </div>
            <div className="designer-field">
              <label>编号颜色</label>
              <ColorSelector
                value={numbers.color}
                presets={[
                  reading.numberColor,
                  variables.primaryColor,
                  "#333333",
                ]}
                onChange={(numberColor) =>
                  updateHeading(activeHeading, { numberColor })
                }
              />
            </div>
            <div className="designer-field">
              <label>
                {reading.layout === "inline" ? "编号右间距" : "编号下间距"}
              </label>
              <SliderInput
                value={numbers.gap}
                onChange={(numberGap) =>
                  updateHeading(activeHeading, { numberGap })
                }
                min={0}
                max={40}
              />
            </div>
            {numbers.width !== undefined && reading.layout !== "inline" && (
              <div className="designer-field">
                <label>
                  {reading.layout === "hanging" ? "编号栏宽度" : "编号短线长度"}
                </label>
                <SliderInput
                  value={numbers.width}
                  onChange={(numberWidth) =>
                    updateHeading(activeHeading, { numberWidth })
                  }
                  min={12}
                  max={120}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="designer-field">
        <label>字号</label>
        <SliderInput
          value={variables[activeHeading].fontSize}
          onChange={(val) => updateHeading(activeHeading, { fontSize: val })}
          min={Math.min(
            headingSizePresets[activeHeading].min,
            reading?.heading.fontSize ?? headingSizePresets[activeHeading].min,
          )}
          max={headingSizePresets[activeHeading].max}
        />
      </div>

      <div className="designer-field">
        <label>字重</label>
        <div className="designer-options mini">
          <button
            className={`option-btn ${variables[activeHeading].fontWeight !== "normal" ? "active" : ""}`}
            onClick={() => updateHeading(activeHeading, { fontWeight: "bold" })}
          >
            加粗
          </button>
          <button
            className={`option-btn ${variables[activeHeading].fontWeight === "normal" ? "active" : ""}`}
            onClick={() =>
              updateHeading(activeHeading, { fontWeight: "normal" })
            }
          >
            常规
          </button>
        </div>
      </div>

      <div className="designer-field">
        <label>字间距</label>
        <SliderInput
          value={variables[activeHeading].letterSpacing ?? 0}
          onChange={(val) =>
            updateHeading(activeHeading, { letterSpacing: val })
          }
          min={0}
          max={10}
          step={0.5}
        />
      </div>

      <div className="designer-field">
        <label>文字颜色</label>
        <ColorSelector
          value={variables[activeHeading].color}
          presets={["#000", "#333", "#666", variables.primaryColor]}
          onChange={(color) => updateHeading(activeHeading, { color })}
        />
      </div>

      <div className="designer-field">
        <label>上边距</label>
        <SliderInput
          value={variables[activeHeading].marginTop}
          onChange={(val) => updateHeading(activeHeading, { marginTop: val })}
          min={marginPresets.min}
          max={marginPresets.max}
          step={marginPresets.step}
        />
      </div>

      <div className="designer-field">
        <label>下边距</label>
        <SliderInput
          value={variables[activeHeading].marginBottom}
          onChange={(val) =>
            updateHeading(activeHeading, { marginBottom: val })
          }
          min={marginPresets.min}
          max={marginPresets.max}
          step={marginPresets.step}
        />
      </div>

      <details className="designer-advanced">
        <summary>标题高级选项</summary>
        <div className="designer-field">
          <label>行高</label>
          <SliderInput
            value={Number(
              variables[activeHeading].lineHeight ?? variables.lineHeight,
            )}
            onChange={(val) =>
              updateHeading(activeHeading, { lineHeight: val })
            }
            min={0.8}
            max={4}
            step={0.01}
          />
        </div>
        <div className="designer-field">
          <label>字体</label>
          <div className="designer-options">
            <button
              className={`option-btn ${!variables[activeHeading].fontFamily ? "active" : ""}`}
              onClick={() =>
                updateHeading(activeHeading, { fontFamily: undefined })
              }
            >
              跟随全局
            </button>
            {fontFamilyOptions.map((opt) => (
              <button
                key={opt.value}
                className={`option-btn ${variables[activeHeading].fontFamily === opt.value ? "active" : ""}`}
                onClick={() =>
                  updateHeading(activeHeading, { fontFamily: opt.value })
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="designer-field">
          <label>下方细线宽度</label>
          <SliderInput
            value={variables[activeHeading].ruleBelowWidth ?? 0}
            onChange={(val) =>
              updateHeading(activeHeading, { ruleBelowWidth: val })
            }
            min={0}
            max={8}
            step={0.5}
          />
        </div>
        <div className="designer-field">
          <label>细线颜色</label>
          <ColorSelector
            value={
              variables[activeHeading].ruleBelowColor ??
              variables[activeHeading].color
            }
            presets={[
              variables.primaryColor,
              "#DDE7DF",
              "#E6E0D7",
              "#DFE6F1",
              "#EBE1DB",
              "#ddd",
            ]}
            onChange={(color) =>
              updateHeading(activeHeading, { ruleBelowColor: color })
            }
          />
        </div>
        <div className="designer-field">
          <label>细线与文字距离</label>
          <SliderInput
            value={variables[activeHeading].ruleBelowGap ?? 0}
            onChange={(val) =>
              updateHeading(activeHeading, { ruleBelowGap: val })
            }
            min={0}
            max={40}
            step={1}
          />
        </div>
        <p className="designer-field-hint">
          细线宽度设为 0 表示不显示；细线跟随标题文字宽度，不是整行通栏。
        </p>
      </details>
    </div>
  );
}
