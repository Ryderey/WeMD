import type { SectionProps } from "../types";
import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";

export function OtherSection({ variables, updateVariable }: SectionProps) {
  return (
    <div className="designer-section">
      {/* 链接 */}
      <div className="designer-group-label">链接</div>
      <div className="designer-field">
        <label>链接颜色</label>
        <ColorSelector
          value={variables.linkColor || variables.primaryColor}
          presets={[variables.primaryColor, "#0070f3", "#0366d6", "#40a9ff"]}
          onChange={(color) => updateVariable("linkColor", color)}
        />
      </div>
      <div className="designer-field-row">
        <span>显示下划线</span>
        <label className="designer-switch">
          <input
            type="checkbox"
            checked={variables.linkUnderline}
            onChange={(e) => updateVariable("linkUnderline", e.target.checked)}
          />
          <span className="switch-slider"></span>
        </label>
      </div>

      <details className="designer-advanced">
        <summary>链接高级选项</summary>
        <div className="designer-field">
          <label>下划线形态</label>
          <div className="designer-options mini">
            <button
              className={`option-btn ${variables.linkUnderlineMode !== "text" ? "active" : ""}`}
              aria-pressed={variables.linkUnderlineMode !== "text"}
              onClick={() => updateVariable("linkUnderlineMode", "border")}
            >
              边框线
            </button>
            <button
              className={`option-btn ${variables.linkUnderlineMode === "text" ? "active" : ""}`}
              aria-pressed={variables.linkUnderlineMode === "text"}
              onClick={() => updateVariable("linkUnderlineMode", "text")}
            >
              文字下划线
            </button>
          </div>
        </div>
        <div className="designer-field">
          <label>下划线偏移</label>
          <SliderInput
            value={variables.linkUnderlineOffset ?? 2}
            onChange={(val) => updateVariable("linkUnderlineOffset", val)}
            min={0}
            max={10}
            step={0.5}
          />
        </div>
        <p className="designer-field-hint">
          文字下划线随换行逐行绘制；边框线只在末行下方画一条。
        </p>
      </details>

      {/* 文本样式 */}
      <div className="designer-group-label mt-4">文本样式</div>
      <div className="designer-field">
        <label>斜体颜色</label>
        <ColorSelector
          value={variables.italicColor}
          presets={["inherit", variables.primaryColor, "#666", "#999"]}
          onChange={(color) => updateVariable("italicColor", color)}
        />
      </div>
      <div className="designer-field">
        <label>删除线颜色</label>
        <ColorSelector
          value={variables.delColor}
          presets={["#999", "#ccc", "#666", variables.primaryColor]}
          onChange={(color) => updateVariable("delColor", color)}
        />
      </div>
      <div className="designer-field-row">
        <span>同时覆盖删除线文本</span>
        <label className="designer-switch">
          <input
            type="checkbox"
            checked={variables.delCoversStrikethrough === true}
            onChange={(e) =>
              updateVariable("delCoversStrikethrough", e.target.checked)
            }
          />
          <span className="switch-slider"></span>
        </label>
      </div>
      <div className="designer-field">
        <label>下划线样式</label>
        <div className="designer-options col-4">
          {[
            { id: "solid", label: "实线" },
            { id: "wavy", label: "波浪线" },
            { id: "dotted", label: "点线" },
            { id: "dashed", label: "虚线" },
          ].map((style) => (
            <button
              key={style.id}
              className={`option-btn ${variables.underlineStyle === style.id ? "active" : ""}`}
              onClick={() =>
                updateVariable(
                  "underlineStyle",
                  style.id as typeof variables.underlineStyle,
                )
              }
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
      <div className="designer-field">
        <label>下划线颜色</label>
        <ColorSelector
          value={variables.underlineColor}
          presets={[
            {
              label: "跟随文字",
              value: "currentColor",
              displayColor: variables.paragraphColor,
            },
            variables.primaryColor,
            "#333",
            "#666",
          ]}
          onChange={(color) => updateVariable("underlineColor", color)}
        />
      </div>
      <div className="designer-row">
        <div className="designer-field half">
          <label>高亮背景</label>
          <ColorSelector
            value={variables.markBackground}
            presets={["#fff5b1", "#ffe4e1", "#e6f7ff", "#f6ffed"]}
            onChange={(color) => updateVariable("markBackground", color)}
          />
        </div>
        <div className="designer-field half">
          <label>高亮文字</label>
          <ColorSelector
            value={variables.markColor}
            presets={["inherit", "#333", variables.primaryColor]}
            onChange={(color) => updateVariable("markColor", color)}
          />
        </div>
      </div>

      {/* 脚注 */}
      <div className="designer-group-label mt-4">脚注</div>
      <div className="designer-field">
        <label>脚注颜色</label>
        <ColorSelector
          value={variables.footnoteColor || variables.primaryColor}
          presets={[
            {
              label: "跟随主题",
              value: "",
              displayColor: variables.primaryColor,
            },
            { label: "深灰", value: "#333333" },
            { label: "灰", value: "#666666" },
            { label: "细灰", value: "#999999" },
          ]}
          onChange={(color) => updateVariable("footnoteColor", color)}
        />
      </div>
      <div className="designer-field">
        <label>详情字号</label>
        <div className="designer-options col-4">
          {[11, 12, 13, 14].map((size) => (
            <button
              key={size}
              className={`option-btn ${variables.footnoteFontSize === size ? "active" : ""}`}
              onClick={() => updateVariable("footnoteFontSize", size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      <details className="designer-advanced">
        <summary>脚注高级选项</summary>
        <div className="designer-field">
          <label>布局</label>
          <div className="designer-options mini">
            <button
              className={`option-btn ${variables.footnoteLayout !== "hanging" ? "active" : ""}`}
              aria-pressed={variables.footnoteLayout !== "hanging"}
              onClick={() => updateVariable("footnoteLayout", undefined)}
            >
              默认
            </button>
            <button
              className={`option-btn ${variables.footnoteLayout === "hanging" ? "active" : ""}`}
              aria-pressed={variables.footnoteLayout === "hanging"}
              onClick={() => updateVariable("footnoteLayout", "hanging")}
            >
              悬挂缩进
            </button>
          </div>
        </div>
        <div className="designer-field">
          <label>编号宽度</label>
          <SliderInput
            value={variables.footnoteNumberWidth ?? 22}
            onChange={(val) => updateVariable("footnoteNumberWidth", val)}
            min={8}
            max={60}
            step={1}
          />
        </div>
        <div className="designer-field">
          <label>脚注行高</label>
          <SliderInput
            value={Number(variables.footnoteLineHeight ?? 1.8)}
            onChange={(val) => updateVariable("footnoteLineHeight", val)}
            min={1}
            max={3}
            step={0.01}
          />
        </div>
        <p className="designer-field-hint">
          悬挂缩进让编号固定宽度、正文换行后与首行文字对齐。
        </p>
      </details>

      <div className="designer-field">
        <label>栏目标题</label>
        <input
          type="text"
          className="designer-input"
          value={variables.footnoteHeader}
          onChange={(e) => updateVariable("footnoteHeader", e.target.value)}
          placeholder="留空则不显示标题..."
        />
      </div>
      <div className="designer-field">
        <label>标题颜色</label>
        <ColorSelector
          value={variables.footnoteHeaderColor || variables.primaryColor}
          presets={[variables.primaryColor]}
          onChange={(color) => updateVariable("footnoteHeaderColor", color)}
        />
      </div>
      <div className="designer-field">
        <label>标题样式</label>
        <div className="designer-options col-5">
          {[
            { id: "simple", label: "简约" },
            { id: "left-border", label: "竖线" },
            { id: "bottom-border", label: "下划线" },
            { id: "background", label: "背景块" },
            { id: "pill", label: "胶囊" },
          ].map((style) => (
            <button
              key={style.id}
              className={`option-btn ${variables.footnoteHeaderStyle === style.id ? "active" : ""}`}
              onClick={() => updateVariable("footnoteHeaderStyle", style.id)}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <details className="designer-advanced">
        <summary>公式高级选项</summary>
        <div className="designer-field-row">
          <span>公式限制在正文宽度内</span>
          <label className="designer-switch">
            <input
              type="checkbox"
              checked={variables.equationMaxWidth === true}
              onChange={(e) =>
                updateVariable("equationMaxWidth", e.target.checked)
              }
            />
            <span className="switch-slider"></span>
          </label>
        </div>
        <p className="designer-field-hint">
          长公式的 SVG
          会超出正文宽度；开启后块级公式按宽度缩放，行内公式垂直居中。
        </p>
      </details>
    </div>
  );
}
