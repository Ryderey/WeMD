import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../common";
import { dispatchEditorInsert } from "../Editor/editorInsert";
import {
  BUILT_IN_COMPONENTS,
  buildComponentSnippet,
  missingRequiredProps,
  type BuiltInComponentName,
} from "./builtInComponents";
import { BuiltInComponentCard } from "./BuiltInComponentCard";
import { MpAccountsSection } from "./MpAccountsSection";
import { buildMpProfileSnippet, type MpAccount } from "./mpProfile";
import "./ComponentDialog.css";

interface ComponentDialogProps {
  open: boolean;
  onClose: () => void;
}

function createInitialValues(): Record<
  BuiltInComponentName,
  Record<string, string>
> {
  return Object.fromEntries(
    BUILT_IN_COMPONENTS.map((definition) => [
      definition.name,
      { ...definition.initialValues },
    ]),
  ) as Record<BuiltInComponentName, Record<string, string>>;
}

export function ComponentDialog({ open, onClose }: ComponentDialogProps) {
  const [expanded, setExpanded] = useState<BuiltInComponentName | null>(null);
  const [values, setValues] = useState(createInitialValues);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  const close = () => {
    setExpanded(null);
    onClose();
  };

  const insertSnippet = (snippet: string, label: string) => {
    dispatchEditorInsert(`\n${snippet}\n`);
    toast.success(`已插入组件「${label}」`);
    close();
  };

  const insertValues = (name: BuiltInComponentName) => {
    const definition = BUILT_IN_COMPONENTS.find((item) => item.name === name);
    if (!definition) return;
    const missing = missingRequiredProps(definition, values[name]);
    if (missing.length > 0) {
      toast.error(`请填写${missing.join("、")}`);
      return;
    }
    insertSnippet(buildComponentSnippet(definition, values[name]), name);
  };

  const insertAccount = (account: MpAccount) => {
    insertSnippet(buildMpProfileSnippet(account), account.nickname.trim());
  };

  const toggleComponent = (name: BuiltInComponentName) => {
    if (expanded === name) {
      setExpanded(null);
      return;
    }
    const definition = BUILT_IN_COMPONENTS.find((item) => item.name === name);
    if (definition) {
      setValues((current) => ({
        ...current,
        [name]: { ...definition.initialValues },
      }));
    }
    setExpanded(name);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="组件"
      className="component-dialog-modal"
    >
      <section role="dialog" aria-modal="true" aria-label="组件">
        <p className="component-dialog-intro">
          在 Markdown 中插入 JSX 风格组件，如{" "}
          <code>&lt;QRCodeBlock url="…" /&gt;</code>
        </p>
        <div className="component-list">
          {BUILT_IN_COMPONENTS.map((definition) => (
            <BuiltInComponentCard
              key={definition.name}
              definition={definition}
              expanded={expanded === definition.name}
              values={values[definition.name]}
              onToggle={() => toggleComponent(definition.name)}
              onChange={(next) =>
                setValues((current) => ({
                  ...current,
                  [definition.name]: next,
                }))
              }
              onInsertExample={() =>
                insertSnippet(definition.example, definition.name)
              }
              onInsertValues={() => insertValues(definition.name)}
            >
              {definition.name === "MpProfile" && (
                <MpAccountsSection onInsert={insertAccount} />
              )}
            </BuiltInComponentCard>
          ))}
        </div>
      </section>
    </Modal>
  );
}
