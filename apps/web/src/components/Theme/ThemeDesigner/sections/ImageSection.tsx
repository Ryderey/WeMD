import type { SectionProps } from "../types";
import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";

export function ImageSection({ variables, updateVariable }: SectionProps) {
  return (
    <div className="designer-section">
      <div className="designer-field">
        <label>边距</label>
        <SliderInput
          value={variables.imageMargin}
          onChange={(val) => updateVariable("imageMargin", val)}
          min={0}
          max={40}
          step={4}
        />
      </div>

      <div className="designer-field">
        <label>圆角</label>
        <SliderInput
          value={variables.imageBorderRadius}
          onChange={(val) => updateVariable("imageBorderRadius", val)}
          min={0}
          max={16}
        />
      </div>

      <div className="designer-field-row">
        <span>阴影</span>
        <label className="designer-switch">
          <input
            type="checkbox"
            checked={variables.imageShadow}
            onChange={(e) => updateVariable("imageShadow", e.target.checked)}
          />
          <span className="switch-slider" />
        </label>
      </div>

      <div className="designer-group-label mt-4">图片说明</div>
      <details className="designer-advanced">
        <summary>图片高级选项</summary>
        <div className="designer-field">
          <label>形态</label>
          <div className="designer-options mini">
            {[
              { id: "contain", label: "适应宽度" },
              { id: "fill", label: "撑满正文" },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${(variables.imageLayout ?? "contain") === opt.id ? "active" : ""}`}
                aria-pressed={(variables.imageLayout ?? "contain") === opt.id}
                onClick={() =>
                  updateVariable("imageLayout", opt.id as "contain" | "fill")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="designer-field">
          <label>滑动图片</label>
          <div className="designer-options mini">
            {[
              { id: "default", label: "跟随图片" },
              { id: "reading", label: "阅读式" },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${(variables.imageflowLayout ?? "default") === opt.id ? "active" : ""}`}
                aria-pressed={
                  (variables.imageflowLayout ?? "default") === opt.id
                }
                onClick={() =>
                  updateVariable(
                    "imageflowLayout",
                    opt.id as "default" | "reading",
                  )
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="designer-field-hint">
          撑满正文让小图也拉满正文宽度，图注另起一行按行高排布。
          阅读式让滑动图片清掉普通图片与段落带上来的外距、阴影与首行缩进。
        </p>
      </details>

      <div className="designer-field">
        <label>说明文字颜色</label>
        <ColorSelector
          value={variables.imageCaptionColor}
          presets={["#999", "#666", "#333", variables.primaryColor]}
          onChange={(color) => updateVariable("imageCaptionColor", color)}
        />
      </div>

      <div className="designer-field">
        <label>说明文字大小</label>
        <div className="designer-options col-4">
          {[12, 13, 14, 15].map((size) => (
            <button
              key={size}
              className={`option-btn ${variables.imageCaptionFontSize === size ? "active" : ""}`}
              onClick={() => updateVariable("imageCaptionFontSize", size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="designer-field">
        <label>说明文字对齐</label>
        <div className="designer-options col-3">
          {[
            { id: "left", label: "居左" },
            { id: "center", label: "居中" },
            { id: "right", label: "居右" },
          ].map((opt) => (
            <button
              key={opt.id}
              className={`option-btn ${variables.imageCaptionTextAlign === opt.id ? "active" : ""}`}
              onClick={() => updateVariable("imageCaptionTextAlign", opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
