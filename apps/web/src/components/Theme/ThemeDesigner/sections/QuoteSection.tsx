import type { SectionProps } from "../types";
import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";
import { Switch } from "../Switch";
import {
  quoteStylePresets,
  fontFamilyOptions,
} from "../../../../config/styleOptions";

export function QuoteSection({ variables, updateVariable }: SectionProps) {
  return (
    <div className="designer-section">
      <div className="designer-field">
        <label>样式预设</label>
        <div className="designer-options">
          {quoteStylePresets.map((opt) => (
            <button
              key={opt.id}
              className={`option-btn ${variables.quotePreset === opt.id ? "active" : ""}`}
              onClick={() => updateVariable("quotePreset", opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 边框样式 - 除大引号和中心强调外的预设可用 */}
      {!["quotation-marks", "center-accent"].includes(
        variables.quotePreset,
      ) && (
        <div className="designer-field">
          <label>边框样式</label>
          <div className="designer-options">
            {[
              { id: "solid", label: "实线" },
              { id: "dashed", label: "虚线" },
              { id: "dotted", label: "点线" },
              { id: "double", label: "双线" },
            ].map((style) => (
              <button
                key={style.id}
                className={`option-btn ${variables.quoteBorderStyle === style.id ? "active" : ""}`}
                onClick={() =>
                  updateVariable(
                    "quoteBorderStyle",
                    style.id as "solid" | "dashed" | "dotted" | "double",
                  )
                }
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 边框粗细 - 除大引号外的所有预设可用 */}
      {variables.quotePreset !== "quotation-marks" && (
        <div className="designer-field">
          <label>边框粗细</label>
          <SliderInput
            value={variables.quoteBorderWidth}
            onChange={(val) => updateVariable("quoteBorderWidth", val)}
            min={1}
            max={8}
            step={0.1}
          />
        </div>
      )}

      <div className="designer-row">
        <div className="designer-field half">
          <label>引用背景</label>
          <ColorSelector
            value={variables.quoteBackground}
            presets={[
              "transparent",
              "#f5f5f5",
              "#f0f9ff",
              "#f0fdf4",
              "#fef3c7",
              "#fce7f3",
            ]}
            onChange={(color) => updateVariable("quoteBackground", color)}
          />
        </div>

        <div className="designer-field half">
          <label>边框颜色</label>
          <ColorSelector
            value={variables.quoteBorderColor}
            presets={[
              "#ddd",
              "#0ea5e9",
              "#22c55e",
              "#f59e0b",
              "#ec4899",
              variables.primaryColor,
            ]}
            onChange={(color) => updateVariable("quoteBorderColor", color)}
          />
        </div>
      </div>

      <div className="designer-field">
        <label>引用文字颜色</label>
        <ColorSelector
          value={variables.quoteTextColor}
          presets={["#666", "#333", "#000", variables.primaryColor]}
          onChange={(color) => updateVariable("quoteTextColor", color)}
        />
      </div>

      <div className="designer-group-label mt-4">内部间距</div>
      <div className="designer-row">
        <div className="designer-field half">
          <label>水平间距</label>
          <SliderInput
            value={variables.quotePaddingX}
            onChange={(val) => updateVariable("quotePaddingX", val)}
            min={8}
            max={32}
          />
        </div>
        <div className="designer-field half">
          <label>垂直间距</label>
          <SliderInput
            value={variables.quotePaddingY}
            onChange={(val) => updateVariable("quotePaddingY", val)}
            min={8}
            max={32}
          />
        </div>
      </div>

      <div className="designer-group-label mt-4">引用文字</div>
      <div className="designer-field-row">
        <span>内容居中</span>
        <Switch
          checked={variables.quoteTextCentered}
          onChange={(val) => updateVariable("quoteTextCentered", val)}
        />
      </div>

      <div className="designer-field">
        <label>字体大小</label>
        <SliderInput
          value={variables.quoteFontSize}
          onChange={(val) => updateVariable("quoteFontSize", val)}
          min={12}
          max={20}
          step={0.1}
        />
      </div>

      <div className="designer-field">
        <label>行高</label>
        <SliderInput
          value={variables.quoteLineHeight ?? 1.6}
          onChange={(val) => updateVariable("quoteLineHeight", val)}
          min={1.2}
          max={2.5}
          step={0.05}
          unit=""
        />
      </div>

      <details className="designer-advanced">
        <summary>引用高级选项</summary>
        <div className="designer-field">
          <label>横线位置</label>
          <div className="designer-options mini">
            {[
              { id: "left", label: "左竖线" },
              { id: "top-bottom", label: "上下横线" },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${
                  (variables.quoteBorderEdges ?? "left") === opt.id
                    ? "active"
                    : ""
                }`}
                aria-pressed={(variables.quoteBorderEdges ?? "left") === opt.id}
                onClick={() =>
                  updateVariable(
                    "quoteBorderEdges",
                    opt.id as "left" | "top-bottom",
                  )
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="designer-row">
          <div className="designer-field half">
            <label>左侧内距</label>
            <SliderInput
              value={variables.quotePaddingLeft ?? variables.quotePaddingX}
              onChange={(val) => updateVariable("quotePaddingLeft", val)}
              min={0}
              max={60}
            />
          </div>
          <div className="designer-field half">
            <label>右侧内距</label>
            <SliderInput
              value={variables.quotePaddingRight ?? variables.quotePaddingX}
              onChange={(val) => updateVariable("quotePaddingRight", val)}
              min={0}
              max={60}
            />
          </div>
        </div>
        <div className="designer-field">
          <label>悬挂缩进</label>
          <SliderInput
            value={variables.quoteIndent ?? 0}
            onChange={(val) => updateVariable("quoteIndent", val)}
            min={0}
            max={32}
          />
        </div>
        <div className="designer-field">
          <label>引用内段间距</label>
          <SliderInput
            value={variables.quoteParagraphGap ?? 0}
            onChange={(val) => updateVariable("quoteParagraphGap", val)}
            min={0}
            max={32}
          />
        </div>
        <div className="designer-field">
          <label>引用上下外距</label>
          <SliderInput
            value={variables.quoteOuterMargin ?? variables.paragraphMargin}
            onChange={(val) => updateVariable("quoteOuterMargin", val)}
            min={0}
            max={60}
          />
        </div>
        <div className="designer-field">
          <label>引用字体</label>
          <div className="designer-options">
            <button
              className={`option-btn ${!variables.quoteFontFamily ? "active" : ""}`}
              onClick={() => updateVariable("quoteFontFamily", undefined)}
            >
              跟随全局
            </button>
            {fontFamilyOptions.map((opt) => (
              <button
                key={opt.value}
                className={`option-btn ${variables.quoteFontFamily === opt.value ? "active" : ""}`}
                onClick={() => updateVariable("quoteFontFamily", opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="designer-field-hint">
          左右内距可以不同；悬挂缩进与段间距会同时作用到引用容器和引用内的每一段，
          末段不带段后距。
        </p>
      </details>

      <details className="designer-advanced">
        <summary>提示块高级选项</summary>
        <div className="designer-field">
          <label>配色模式</label>
          <div className="designer-options mini">
            {[
              { id: "default", label: "分色" },
              { id: "primary", label: "跟随主题色" },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${(variables.calloutStyle ?? "default") === opt.id ? "active" : ""}`}
                aria-pressed={(variables.calloutStyle ?? "default") === opt.id}
                onClick={() =>
                  updateVariable(
                    "calloutStyle",
                    opt.id as "default" | "primary",
                  )
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="designer-field">
          <label>统一底色</label>
          <ColorSelector
            value={variables.calloutBackground ?? variables.quoteBackground}
            presets={[
              "transparent",
              "#f5f5f5",
              variables.quoteBackground,
              variables.primaryColor,
            ]}
            onChange={(color) => updateVariable("calloutBackground", color)}
          />
        </div>
        <div className="designer-row">
          <div className="designer-field half">
            <label>水平内距</label>
            <SliderInput
              value={variables.calloutPaddingX ?? 16}
              onChange={(val) => updateVariable("calloutPaddingX", val)}
              min={0}
              max={32}
            />
          </div>
          <div className="designer-field half">
            <label>垂直内距</label>
            <SliderInput
              value={variables.calloutPaddingY ?? 12}
              onChange={(val) => updateVariable("calloutPaddingY", val)}
              min={0}
              max={32}
            />
          </div>
        </div>
        <div className="designer-row">
          <div className="designer-field half">
            <label>标题字号</label>
            <SliderInput
              value={variables.calloutTitleFontSize ?? 14}
              onChange={(val) => updateVariable("calloutTitleFontSize", val)}
              min={12}
              max={20}
              step={0.1}
            />
          </div>
          <div className="designer-field half">
            <label>正文字号</label>
            <SliderInput
              value={variables.calloutBodyFontSize ?? 14}
              onChange={(val) => updateVariable("calloutBodyFontSize", val)}
              min={12}
              max={20}
              step={0.1}
            />
          </div>
        </div>
        <div className="designer-row">
          <div className="designer-field half">
            <label>标题颜色</label>
            <ColorSelector
              value={variables.calloutTitleColor ?? variables.primaryColor}
              presets={["#333", "#666", variables.primaryColor]}
              onChange={(color) => updateVariable("calloutTitleColor", color)}
            />
          </div>
          <div className="designer-field half">
            <label>正文颜色</label>
            <ColorSelector
              value={variables.calloutBodyColor ?? variables.paragraphColor}
              presets={["#666", "#333", variables.paragraphColor]}
              onChange={(color) => updateVariable("calloutBodyColor", color)}
            />
          </div>
        </div>
        <p className="designer-field-hint">
          分色模式沿用五种提示块各自的配色；这里设置的细项排在模式之后，永远优先。
        </p>
      </details>
    </div>
  );
}
