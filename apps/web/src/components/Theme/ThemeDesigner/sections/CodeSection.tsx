import type { SectionProps, DesignerVariables } from "../types";
import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";
import {
  inlineCodeStyleOptions,
  codeBlockThemeOptions,
} from "../../../../config/styleOptions";

interface CodeSectionProps extends SectionProps {
  setVariables: React.Dispatch<React.SetStateAction<DesignerVariables>>;
}

export function CodeSection({
  variables,
  updateVariable,
  setVariables,
}: CodeSectionProps) {
  return (
    <div className="designer-section">
      <div className="designer-group-label">行内代码</div>
      <div className="designer-field">
        <label>样式预设</label>
        <div className="designer-options col-2">
          {inlineCodeStyleOptions.map((opt) => (
            <button
              key={opt.id}
              className={`option-btn ${variables.inlineCodeStyle === opt.id ? "active" : ""}`}
              onClick={() => {
                const updates: Partial<DesignerVariables> = {
                  inlineCodeStyle: opt.id,
                };
                if (opt.id === "color-text") {
                  updates.inlineCodeColor = variables.primaryColor;
                  updates.inlineCodeBackground = "transparent";
                } else if (opt.id === "simple") {
                  updates.inlineCodeColor = "#c7254e";
                  updates.inlineCodeBackground = "#f9f2f4";
                } else if (opt.id === "github") {
                  updates.inlineCodeColor = "#24292e";
                  updates.inlineCodeBackground = "rgba(27,31,35,0.05)";
                }
                setVariables((prev) => ({ ...prev, ...updates }));
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="designer-row">
        <div className="designer-field half">
          <label>文字颜色</label>
          <ColorSelector
            value={variables.inlineCodeColor}
            presets={["#c7254e", "#333", variables.primaryColor]}
            onChange={(color) => updateVariable("inlineCodeColor", color)}
          />
        </div>
        <div className="designer-field half">
          <label>背景颜色</label>
          <ColorSelector
            value={variables.inlineCodeBackground}
            presets={["#f9f2f4", "rgba(27,31,35,0.05)", "transparent"]}
            onChange={(color) => updateVariable("inlineCodeBackground", color)}
          />
        </div>
      </div>

      <div className="designer-group-label mt-4">代码块</div>
      <div className="designer-field">
        <label>字号</label>
        <SliderInput
          value={variables.codeFontSize}
          onChange={(val) => updateVariable("codeFontSize", val)}
          min={12}
          max={16}
        />
      </div>

      <div className="designer-field-row">
        <span>Mac 风格控制栏</span>
        <label className="designer-switch">
          <input
            type="checkbox"
            checked={variables.showMacBar}
            onChange={(e) => updateVariable("showMacBar", e.target.checked)}
          />
          <span className="switch-slider"></span>
        </label>
      </div>

      <details className="designer-advanced">
        <summary>代码块高级选项</summary>
        <div className="designer-field">
          <label>外框</label>
          <div className="designer-options mini">
            {[
              { id: "none", label: "无边框" },
              { id: "full", label: "全框" },
              { id: "left", label: "仅左线" },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${
                  (variables.codeBlockBorder ?? "none") === opt.id
                    ? "active"
                    : ""
                }`}
                aria-pressed={(variables.codeBlockBorder ?? "none") === opt.id}
                onClick={() =>
                  updateVariable(
                    "codeBlockBorder",
                    opt.id as DesignerVariables["codeBlockBorder"],
                  )
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="designer-field">
          <label>边框颜色</label>
          <ColorSelector
            value={variables.codeBlockBorderColor ?? "#DDE7DF"}
            presets={["#DDE7DF", "#E6E0D7", "#DFE6F1", "#EBE1DB", "#CFCFCB"]}
            onChange={(color) => updateVariable("codeBlockBorderColor", color)}
          />
        </div>
        <div className="designer-field">
          <label>边框宽度</label>
          <SliderInput
            value={variables.codeBlockBorderWidth ?? 1}
            onChange={(val) => updateVariable("codeBlockBorderWidth", val)}
            min={1}
            max={8}
            step={0.5}
          />
        </div>
        <div className="designer-field">
          <label>圆角</label>
          <SliderInput
            value={variables.codeBlockRadius ?? 8}
            onChange={(val) => updateVariable("codeBlockRadius", val)}
            min={0}
            max={24}
            step={1}
          />
        </div>
        <div className="designer-field">
          <label>内距（横向）</label>
          <SliderInput
            value={variables.codeBlockPaddingX ?? 16}
            onChange={(val) => updateVariable("codeBlockPaddingX", val)}
            min={0}
            max={40}
            step={1}
          />
        </div>
        <div className="designer-field">
          <label>内距（纵向）</label>
          <SliderInput
            value={variables.codeBlockPaddingY ?? 14}
            onChange={(val) => updateVariable("codeBlockPaddingY", val)}
            min={0}
            max={40}
            step={1}
          />
        </div>
        <div className="designer-field">
          <label>代码行高</label>
          <SliderInput
            value={Number(variables.codeBlockLineHeight ?? 1.75)}
            onChange={(val) => updateVariable("codeBlockLineHeight", val)}
            min={1}
            max={3}
            step={0.01}
          />
        </div>
        <div className="designer-field-row">
          <span>长行在框内滚动</span>
          <label className="designer-switch">
            <input
              type="checkbox"
              checked={variables.codeBlockContainWidth === true}
              onChange={(e) =>
                updateVariable("codeBlockContainWidth", e.target.checked)
              }
            />
            <span className="switch-slider"></span>
          </label>
        </div>
        <div className="designer-field">
          <label>行内代码字号</label>
          <SliderInput
            value={variables.inlineCodeFontSize ?? 13}
            onChange={(val) => updateVariable("inlineCodeFontSize", val)}
            min={8}
            max={32}
            step={0.5}
          />
        </div>
        <div className="designer-field">
          <label>行内代码边框</label>
          <SliderInput
            value={variables.inlineCodeBorderWidth ?? 1}
            onChange={(val) => updateVariable("inlineCodeBorderWidth", val)}
            min={0}
            max={4}
            step={0.5}
          />
        </div>
        <p className="designer-field-hint">
          开启「长行在框内滚动」后，超长代码行不会把代码块撑破正文宽度。
        </p>
      </details>

      <div className="designer-field">
        <label>高亮主题</label>
        <div className="designer-options col-2">
          {codeBlockThemeOptions.map((opt) => (
            <button
              key={opt.id}
              className={`option-btn ${variables.codeTheme === opt.id ? "active" : ""}`}
              onClick={() => {
                const updates: Partial<DesignerVariables> = {
                  codeTheme: opt.id,
                };
                if (opt.id === "github") updates.codeBackground = "#f8f8f8";
                else if (opt.id === "monokai")
                  updates.codeBackground = "#272822";
                else if (opt.id === "vscode")
                  updates.codeBackground = "#1e1e1e";
                else if (opt.id === "night-owl")
                  updates.codeBackground = "#011627";
                else if (opt.id === "dracula")
                  updates.codeBackground = "#282a36";
                else if (opt.id === "solarized-dark")
                  updates.codeBackground = "#002b36";
                else if (opt.id === "solarized-light")
                  updates.codeBackground = "#fdf6e3";
                else if (opt.id === "xcode") updates.codeBackground = "#f8f8f8";
                else if (opt.id === "atom-one-light")
                  updates.codeBackground = "#fafafa";
                setVariables((prev) => ({ ...prev, ...updates }));
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
