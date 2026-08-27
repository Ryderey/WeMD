import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ComponentDialog } from "../../components/Component/ComponentDialog";
import {
  buildMpProfileSnippet,
  MP_ACCOUNTS_STORAGE_KEY,
  MP_PROFILE_EXAMPLE,
  readMpAccounts,
  writeMpAccounts,
} from "../../components/Component/mpProfile";
import { EDITOR_INSERT_EVENT } from "../../components/Editor/editorInsert";

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe("MpProfile helpers", () => {
  beforeEach(() => localStorage.clear());

  it("escapes user text while preserving the JSX component contract", () => {
    const snippet = buildMpProfileSnippet({
      ...MP_PROFILE_EXAMPLE,
      nickname: 'Name "&" <tag>',
    });

    expect(snippet).toContain('nickname="Name &quot;&amp;&quot; &lt;tag&gt;"');
    expect(snippet).toContain('serviceType="1"');
    expect(snippet).toContain('verifyStatus="1"');
  });

  it("ignores corrupt saved account data", () => {
    localStorage.setItem(MP_ACCOUNTS_STORAGE_KEY, "not-json");

    expect(readMpAccounts()).toEqual([]);
  });

  it("round-trips valid saved accounts", () => {
    const account = { id: "account-1", ...MP_PROFILE_EXAMPLE };
    writeMpAccounts([account]);

    expect(readMpAccounts()).toEqual([account]);
  });
});

describe("ComponentDialog", () => {
  afterEach(() => localStorage.clear());

  it("quick-inserts the public-account example and closes", () => {
    const onClose = vi.fn();
    const onInsert = vi.fn();
    window.addEventListener(EDITOR_INSERT_EVENT, onInsert);

    render(<ComponentDialog open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "插入" }));

    expect(onInsert).toHaveBeenCalledOnce();
    const event = onInsert.mock.calls[0][0] as CustomEvent<string>;
    expect(event.detail).toContain('<MpProfile mpId="MzIxNjA5ODQ0OQ=="');
    expect(event.detail.startsWith("\n")).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
    window.removeEventListener(EDITOR_INSERT_EVENT, onInsert);
  });
});
