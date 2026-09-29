import type { SectionProps } from "../types";
import { ColorSelector } from "../../ColorSelector";

export function TableHrSection({ variables, updateVariable }: SectionProps) {
  return (
    <div className="designer-section">
      <div className="designer-group-label">表格</div>
      <div className="designer-row">
        <div className="designer-field half">
          <label>表头背景</label>
          <ColorSelector
            value={variables.tableHeaderBackground}
            presets={[
              "#f8f8f8",
              "#f0f0f0",
              "#e8e8e8",
              variables.primaryColor + "15",
            ]}
            onChange={(color) => updateVariable("tableHeaderBackground", color)}
          />
        </div>
        <div className="designer-field half">
          <label>表头文字</label>
          <ColorSelector
            value={variables.tableHeaderColor}
            presets={["inherit", "#333", "#000", variables.primaryColor]}
            onChange={(color) => updateVariable("tableHeaderColor", color)}
          />
        </div>
      </div>
      <details className="designer-advanced">
        <summary>表格高级选项</summary>
        <div className="designer-field">
          <label>形态</label>
          <div className="designer-options mini">
            {[
              { id: "grid", label: "网格线" },
              { id: "rules", label: "横线式" },
            ].map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${(variables.tableStyle ?? "grid") === opt.id ? "active" : ""}`}
                aria-pressed={(variables.tableStyle ?? "grid") === opt.id}
                onClick={() =>
                  updateVariable("tableStyle", opt.id as "grid" | "rules")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="designer-field-hint">
          横线式只画横向分隔线，表格按固定布局排布并使用等宽数字。
        </p>
      </details>

      <div className="designer-field">
        <label>边框颜色</label>
        <ColorSelector
          value={variables.tableBorderColor}
          presets={[
            "#dfe2e5",
            "#e8e8e8",
            "#ccc",
            variables.primaryColor + "50",
          ]}
          onChange={(color) => updateVariable("tableBorderColor", color)}
        />
      </div>
      <div className="designer-field-row">
        <span>斑马纹</span>
        <label className="designer-switch">
          <input
            type="checkbox"
            checked={variables.tableZebra}
            onChange={(e) => updateVariable("tableZebra", e.target.checked)}
          />
          <span className="switch-slider"></span>
        </label>
      </div>
    </div>
  );
}
