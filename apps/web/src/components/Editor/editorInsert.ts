import type { EditorView } from "codemirror";

export const EDITOR_INSERT_EVENT = "wemd-editor-insert";

export function insertTextAtSelection(view: EditorView, text: string): void {
  const selection = view.state.selection.main;

  view.dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: text,
    },
    selection: {
      anchor: selection.from + text.length,
    },
  });

  view.focus();
}

export function dispatchEditorInsert(text: string): void {
  window.dispatchEvent(
    new CustomEvent<string>(EDITOR_INSERT_EVENT, { detail: text }),
  );
}

export function getEditorInsertText(event: Event): string | null {
  if (!(event instanceof CustomEvent) || typeof event.detail !== "string") {
    return null;
  }
  return event.detail;
}
