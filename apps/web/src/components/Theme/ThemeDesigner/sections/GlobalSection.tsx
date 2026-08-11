import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { GlobalSectionProps } from "../types";
import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";
import {
  fontFamilyOptions,
  fontSizeOptions,
  lineHeightOptions,
  primaryColorOptions,
  primaryGradientOptions,
  boldStyleOptions,
} from "../../../../config/styleOptions";

const defaultGradientColors = ["#4158D0", "#FFCC70"] as const;

function getGradientColors(gradient?: string): [string, string] {
  const colors = gradient?.match(/#[0-9a-f]{6}\b/gi);
  if (!colors || colors.length < 2) return [...defaultGradientColors];
  return [colors[0], colors[colors.length - 1]];
}

export function GlobalSection({
  variables,
  updateVariable,
  handlePrimaryColorChange,
}: GlobalSectionProps) {
  const [gradientStart, setGradientStart] = useState<string>(
    defaultGradientColors[0],
  );
  const [gradientEnd, setGradientEnd] = useState<string>(
    defaultGradientColors[1],
  );
  const [showCustomGradient, setShowCustomGradient] = useState(false);
  const customGradient = `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`;

  useEffect(() => {
    const [start, end] = getGradientColors(variables.primaryGradient);
    setGradientStart(start);
    setGradientEnd(end);
  }, [variables.primaryGradient]);

  const updateCustomGradient = (start: string, end: string) => {
    updateVariable(
      "primaryGradient",
      `linear-gradient(135deg, ${start} 0%, ${end} 100%)`,
    );
  };

  return (
    <div className="designer-section">
      <div className="designer-field">
        <label>字体</label>
        <div className="designer-options">
          {fontFamilyOptions.map((opt) => (
            <button
              key={opt.value}
              className={`option-btn ${variables.fontFamily === opt.value ? "active" : ""}`}
              onClick={() => updateVariable("fontFamily", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="designer-field">
        <label>正文字号</label>
        <div className="designer-options">
          {fontSizeOptions.map((opt) => (
            <button
              key={opt.value}
              className={`option-btn ${variables.fontSize === opt.value ? "active" : ""}`}
              onClick={() => updateVariable("fontSize", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="designer-field">
        <label>行高</label>
        <div className="designer-options">
          {lineHeightOptions.map((opt) => (
            <button
              key={opt.value}
              className={`option-btn ${variables.lineHeight === opt.value ? "active" : ""}`}
              onClick={() => updateVariable("lineHeight", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="designer-field">
        <label>全局字间距</label>
        <SliderInput
          value={variables.baseLetterSpacing || 0}
          onChange={(val) => updateVariable("baseLetterSpacing", val)}
          min={0}
          max={10}
          step={0.1}
          unit="px"
        />
      </div>

      <div className="designer-field">
        <label>段落内部间距</label>
        <SliderInput
          value={variables.paragraphPadding ?? 0}
          onChange={(val) => updateVariable("paragraphPadding", val)}
          min={0}
          max={20}
          step={0.1}
        />
      </div>

      <div className="designer-field">
        <label>页面两侧间距</label>
        <SliderInput
          value={variables.pagePadding || 0}
          onChange={(val) => updateVariable("pagePadding", val)}
          min={0}
          max={48}
          step={0.1}
        />
      </div>

      <div className="designer-field">
        <label>正文颜色</label>
        <ColorSelector
          value={variables.paragraphColor}
          presets={[
            { label: "深灰 (推荐)", value: "#333333" },
            { label: "纯黑", value: "#000000" },
            { label: "灰色", value: "#666666" },
          ]}
          onChange={(color) => updateVariable("paragraphColor", color)}
        />
      </div>

      <div className="designer-field">
        <label>主题色</label>
        <ColorSelector
          value={variables.primaryColor}
          presets={primaryColorOptions}
          onChange={handlePrimaryColorChange}
        />
      </div>

      <div className="designer-field">
        <label>渐变主题色</label>
        <ColorSelector
          value={variables.primaryGradient || ""}
          presets={primaryGradientOptions}
          onChange={(gradient) => updateVariable("primaryGradient", gradient)}
          allowCustomColor={false}
          trailingContent={
            <button
              className="color-btn custom-color-picker"
              title="添加自定义渐变"
              aria-expanded={showCustomGradient}
              onClick={() => setShowCustomGradient((show) => !show)}
            >
              <Plus size={14} className="plus-icon" />
            </button>
          }
        />
        {showCustomGradient && (
          <div className="designer-colors designer-gradient-custom">
            <span
              className="color-btn designer-gradient-preview"
              style={{ backgroundImage: customGradient }}
              title="自定义渐变预览"
            />
            <label
              className="color-btn custom-color-picker"
              style={{ backgroundColor: gradientStart }}
              title="起始色"
            >
              <input
                aria-label="自定义渐变起始色"
                type="color"
                value={gradientStart}
                onChange={(event) => {
                  const start = event.target.value;
                  setGradientStart(start);
                  updateCustomGradient(start, gradientEnd);
                }}
              />
            </label>
            <label
              className="color-btn custom-color-picker"
              style={{ backgroundColor: gradientEnd }}
              title="结束色"
            >
              <input
                aria-label="自定义渐变结束色"
                type="color"
                value={gradientEnd}
                onChange={(event) => {
                  const end = event.target.value;
                  setGradientEnd(end);
                  updateCustomGradient(gradientStart, end);
                }}
              />
            </label>
          </div>
        )}
        <p className="designer-field-hint">
          应用于渐变横线、背景块、渐变高亮、标题胶囊，以及“随主题色”加粗和荧光笔；链接、边框、列表标记等仍使用上方主题色。
        </p>
      </div>

      <div className="designer-field">
        <label>加粗样式</label>
        <div className="designer-options">
          {boldStyleOptions.map((opt) => (
            <button
              key={opt.id}
              className={`option-btn ${variables.strongStyle === opt.id ? "active" : ""}`}
              onClick={() => updateVariable("strongStyle", opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
