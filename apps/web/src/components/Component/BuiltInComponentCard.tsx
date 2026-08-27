import type { ReactNode } from "react";
import { Blocks, ChevronDown, Zap } from "lucide-react";
import {
  buildComponentSnippet,
  type BuiltInComponentDefinition,
} from "./builtInComponents";
import { ComponentFields } from "./ComponentFields";
import { ComponentPreview } from "./ComponentPreview";

interface BuiltInComponentCardProps {
  definition: BuiltInComponentDefinition;
  expanded: boolean;
  values: Record<string, string>;
  onToggle: () => void;
  onChange: (values: Record<string, string>) => void;
  onInsertExample: () => void;
  onInsertValues: () => void;
  children?: ReactNode;
}

export function BuiltInComponentCard({
  definition,
  expanded,
  values,
  onToggle,
  onChange,
  onInsertExample,
  onInsertValues,
  children,
}: BuiltInComponentCardProps) {
  return (
    <section className={`component-card${expanded ? " is-expanded" : ""}`}>
      <div
        className="component-card-summary"
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="component-card-icon">
          <Blocks size={18} />
        </div>
        <div className="component-card-info">
          <div>
            <code>{definition.name}</code>
            <small>{definition.props.length} 个属性</small>
          </div>
          <p>{definition.description}</p>
        </div>
        <div
          className="component-card-actions"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="component-insert-button"
            aria-label={`插入 ${definition.name}`}
            onClick={onInsertExample}
          >
            <Zap size={14} />
            插入
          </button>
          <button
            type="button"
            className="component-expand-button"
            aria-label={
              expanded ? `收起 ${definition.name}` : `展开 ${definition.name}`
            }
            aria-expanded={expanded}
            onClick={onToggle}
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="component-card-detail">
          <ComponentFields
            definition={definition}
            values={values}
            onChange={onChange}
          />
          <ComponentPreview definition={definition} values={values} />
          <pre>
            <code>{buildComponentSnippet(definition, values)}</code>
          </pre>
          <button
            type="button"
            className="component-insert-button"
            onClick={onInsertValues}
          >
            <Zap size={14} />
            按当前属性插入
          </button>
          {children}
        </div>
      )}
    </section>
  );
}
