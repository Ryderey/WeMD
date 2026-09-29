import type { HeadingSectionProps, HeadingLevel } from "../types";
import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";
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

export function HeadingSection({
  variables,
  activeHeading,
  setActiveHeading,
  updateHeading,
}: HeadingSectionProps) {
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
                  updateHeading(activeHeading, { preset: preset.id })
                }
              >
                {preset.label}
              </button>
            ))}
        </div>
      </div>

      <div className="designer-field">
        <label>字号</label>
        <SliderInput
          value={variables[activeHeading].fontSize}
          onChange={(val) => updateHeading(activeHeading, { fontSize: val })}
          min={headingSizePresets[activeHeading].min}
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
