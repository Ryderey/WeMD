import type { BuiltInComponentDefinition } from "./builtInComponents";

interface ComponentFieldsProps {
  definition: BuiltInComponentDefinition;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function ComponentFields({
  definition,
  values,
  onChange,
}: ComponentFieldsProps) {
  const update = (name: string, value: string) =>
    onChange({ ...values, [name]: value });

  return (
    <div className="component-fields">
      {definition.props.map((prop) => (
        <label key={prop.name}>
          <span>
            {prop.label}
            {prop.required && <em> *</em>}
          </span>
          {prop.options ? (
            <select
              value={values[prop.name] ?? ""}
              onChange={(event) => update(prop.name, event.target.value)}
            >
              {prop.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={values[prop.name] ?? ""}
              onChange={(event) => update(prop.name, event.target.value)}
            />
          )}
        </label>
      ))}
    </div>
  );
}
