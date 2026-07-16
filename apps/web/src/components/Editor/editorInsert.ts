import type { EditorView } from "codemirror";

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
