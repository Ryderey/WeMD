import type { SectionProps } from "../types";

import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";

export function ParagraphSection({ variables, updateVariable }: SectionProps) {
  return (
    <div className="designer-section">
      <div className="designer-field">
        <label>段落间距</label>
        <SliderInput
          value={variables.paragraphMargin}
          onChange={(val) => updateVariable("paragraphMargin", val)}
          min={8}
          max={32}
          step={2}
        />
      </div>

      <div className="designer-field-row">
        <span>段落首行缩进</span>
        <label className="designer-switch">
          <input
            type="checkbox"
            checked={variables.textIndent}
            onChange={(e) => updateVariable("textIndent", e.target.checked)}
          />
          <span className="switch-slider"></span>
        </label>
      </div>

      <div className="designer-field-row">
        <span>两端对齐</span>
        <label className="designer-switch">
          <input
            type="checkbox"
            checked={variables.textJustify}
            onChange={(e) => updateVariable("textJustify", e.target.checked)}
          />
          <span className="switch-slider"></span>
        </label>
      </div>

      <details className="designer-advanced">
        <summary>段落高级选项</summary>
        <div className="designer-field">
          <label>段前距</label>
          <SliderInput
            value={variables.paragraphMarginTop ?? variables.paragraphMargin}
            onChange={(val) => updateVariable("paragraphMarginTop", val)}
            min={0}
            max={64}
            step={1}
          />
        </div>
        <div className="designer-field">
          <label>段后距</label>
          <SliderInput
            value={variables.paragraphMarginBottom ?? variables.paragraphMargin}
            onChange={(val) => updateVariable("paragraphMarginBottom", val)}
            min={0}
            max={64}
            step={1}
          />
        </div>
        <p className="designer-field-hint">
          不调整时段落仍使用上方「段落间距」的上下等距；调整后上下可分别设定。
        </p>
      </details>

      <div className="designer-group-label mt-4">分割线</div>
      <div className="designer-field">
        <label>样式</label>
        <div className="designer-options col-3">
          {[
            { id: "solid", label: "实线" },
            { id: "dashed", label: "虚线" },
            { id: "dotted", label: "点线" },
            { id: "double", label: "双线" },
            { id: "pill", label: "短线" },
            { id: "gradient", label: "渐变" },
          ].map((style) => (
            <button
              key={style.id}
              className={`option-btn ${variables.hrStyle === style.id ? "active" : ""}`}
              onClick={() =>
                updateVariable("hrStyle", style.id as typeof variables.hrStyle)
              }
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
      <div className="designer-field">
        <label>颜色</label>
        <ColorSelector
          value={variables.hrColor}
          presets={["#eee", "#ddd", "#ccc", variables.primaryColor]}
          onChange={(color) => updateVariable("hrColor", color)}
        />
      </div>
      <div className="designer-field">
        <label>高度</label>
        <SliderInput
          value={variables.hrHeight}
          onChange={(val) => updateVariable("hrHeight", val)}
          min={1}
          max={4}
        />
      </div>
      <div className="designer-field">
        <label>上下边距</label>
        <SliderInput
          value={variables.hrMargin}
          onChange={(val) => updateVariable("hrMargin", val)}
          min={10}
          max={60}
          step={5}
        />
      </div>

      <details className="designer-advanced">
        <summary>分隔线高级选项</summary>
        <div className="designer-field">
          <label>宽度</label>
          <SliderInput
            value={variables.hrWidth ?? 0}
            onChange={(val) => updateVariable("hrWidth", val)}
            min={0}
            max={600}
            step={1}
            unit="px"
          />
        </div>
        <div className="designer-field">
          <label>对齐</label>
          <div className="designer-options mini">
            <button
              className={`option-btn ${variables.hrAlign !== "center" ? "active" : ""}`}
              aria-pressed={variables.hrAlign !== "center"}
              onClick={() => updateVariable("hrAlign", "left")}
            >
              靠左
            </button>
            <button
              className={`option-btn ${variables.hrAlign === "center" ? "active" : ""}`}
              aria-pressed={variables.hrAlign === "center"}
              onClick={() => updateVariable("hrAlign", "center")}
            >
              居中
            </button>
          </div>
        </div>
        <div className="designer-field">
          <label>上边距</label>
          <SliderInput
            value={variables.hrMarginTop ?? variables.hrMargin}
            onChange={(val) => updateVariable("hrMarginTop", val)}
            min={0}
            max={120}
            step={1}
          />
        </div>
        <div className="designer-field">
          <label>下边距</label>
          <SliderInput
            value={variables.hrMarginBottom ?? variables.hrMargin}
            onChange={(val) => updateVariable("hrMarginBottom", val)}
            min={0}
            max={120}
            step={1}
          />
        </div>
        <p className="designer-field-hint">
          宽度设为 0 表示通栏；设为固定长度后可以用「对齐」把它靠左或居中。
        </p>
      </details>
    </div>
  );
}
