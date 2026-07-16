import { EditorState } from "@codemirror/state";
import { history, undo } from "@codemirror/commands";
import { EditorView } from "codemirror";
import { describe, expect, it } from "vitest";
import { insertTextAtSelection } from "../../components/Editor/editorInsert";

function createEditor(doc: string, anchor: number, head = anchor): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);

  return new EditorView({
    parent,
    state: EditorState.create({
      doc,
      selection: { anchor, head },
      extensions: [history()],
    }),
  });
}

describe("insertTextAtSelection", () => {
  it("replaces the selected text and places the cursor after the Emoji", () => {
    const view = createEditor("hello", 1, 4);

    insertTextAtSelection(view, "😊");

    expect(view.state.doc.toString()).toBe("h😊o");
    expect(view.state.selection.main.anchor).toBe(3);
    expect(view.state.selection.main.empty).toBe(true);
    expect(undo(view)).toBe(true);
    expect(view.state.doc.toString()).toBe("hello");
    view.destroy();
  });

  it("inserts at an empty cursor without adding whitespace", () => {
    const view = createEditor("你好", 1);

    insertTextAtSelection(view, "🚀");

    expect(view.state.doc.toString()).toBe("你🚀好");
    expect(view.state.selection.main.anchor).toBe(3);
    view.destroy();
  });
});
