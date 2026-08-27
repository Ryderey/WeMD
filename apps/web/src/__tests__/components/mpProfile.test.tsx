import { fireEvent, render, screen } from "@testing-library/react";
import toast from "react-hot-toast";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ComponentDialog } from "../../components/Component/ComponentDialog";
import {
  BUILT_IN_COMPONENTS,
  buildComponentSnippet,
} from "../../components/Component/builtInComponents";
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
    fireEvent.click(screen.getByRole("button", { name: "插入 MpProfile" }));

    expect(onInsert).toHaveBeenCalledOnce();
    const event = onInsert.mock.calls[0][0] as CustomEvent<string>;
    expect(event.detail).toContain('<MpProfile mpId="MzIxNjA5ODQ0OQ=="');
    expect(event.detail.startsWith("\n")).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
    window.removeEventListener(EDITOR_INSERT_EVENT, onInsert);
  });

  it("lists exactly the four requested built-in components", () => {
    render(<ComponentDialog open onClose={vi.fn()} />);

    expect(BUILT_IN_COMPONENTS.map((definition) => definition.name)).toEqual([
      "MpProfile",
      "QRCodeBlock",
      "AuthorBlock",
      "BadgeGroup",
    ]);
    for (const definition of BUILT_IN_COMPONENTS) {
      expect(screen.getByText(definition.name)).toBeInTheDocument();
    }
    expect(screen.queryByText("自定义组件")).not.toBeInTheDocument();
  });

  it.each([
    ["QRCodeBlock", '<QRCodeBlock url="https://md.doocs.org"'],
    ["AuthorBlock", '<AuthorBlock name="yanglbme"'],
    ["BadgeGroup", `<BadgeGroup tags='["Vue 3"`],
  ])("quick-inserts the %s reference example", (name, expected) => {
    const onInsert = vi.fn();
    window.addEventListener(EDITOR_INSERT_EVENT, onInsert);
    render(<ComponentDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: `插入 ${name}` }));

    const event = onInsert.mock.calls[0][0] as CustomEvent<string>;
    expect(event.detail).toContain(expected);
    expect(event.detail.startsWith("\n")).toBe(true);
    expect(event.detail.endsWith("\n")).toBe(true);
    window.removeEventListener(EDITOR_INSERT_EVENT, onInsert);
  });

  it("edits and inserts expanded QRCodeBlock values", () => {
    const onInsert = vi.fn();
    window.addEventListener(EDITOR_INSERT_EVENT, onInsert);
    render(<ComponentDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "展开 QRCodeBlock" }));
    fireEvent.change(screen.getByLabelText("二维码内容（URL） *"), {
      target: { value: "https://example.com/?a=1&b=2" },
    });
    fireEvent.change(screen.getByLabelText("二维码下方提示文字"), {
      target: { value: '扫码 "访问"' },
    });
    fireEvent.click(screen.getByRole("button", { name: "按当前属性插入" }));

    const event = onInsert.mock.calls[0][0] as CustomEvent<string>;
    expect(event.detail).toContain('url="https://example.com/?a=1&amp;b=2"');
    expect(event.detail).toContain('text="扫码 &quot;访问&quot;"');
    window.removeEventListener(EDITOR_INSERT_EVENT, onInsert);
  });

  it("does not insert an expanded component with missing required values", () => {
    const onInsert = vi.fn();
    window.addEventListener(EDITOR_INSERT_EVENT, onInsert);
    render(<ComponentDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "展开 QRCodeBlock" }));
    fireEvent.change(screen.getByLabelText("二维码内容（URL） *"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "按当前属性插入" }));

    expect(onInsert).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("请填写二维码内容（URL）");
    window.removeEventListener(EDITOR_INSERT_EVENT, onInsert);
  });

  it("expands one component at a time and renders AuthorBlock and BadgeGroup previews", () => {
    render(<ComponentDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "展开 AuthorBlock" }));
    expect(screen.getByLabelText("作者信息预览")).toBeInTheDocument();
    expect(screen.getByLabelText("作者名称 *")).toHaveValue("yanglbme");

    fireEvent.click(screen.getByRole("button", { name: "展开 BadgeGroup" }));
    expect(screen.queryByLabelText("作者信息预览")).not.toBeInTheDocument();
    expect(screen.getByLabelText("标签组预览")).toBeInTheDocument();
    expect(screen.getByText("Tailwind CSS")).toBeInTheDocument();
  });

  it("creates a reusable public-account entry from the expanded profile", () => {
    render(<ComponentDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "展开 MpProfile" }));
    fireEvent.click(screen.getByRole("button", { name: "添加" }));
    const idFields = screen.getAllByLabelText("公众号 ID *");
    const nameFields = screen.getAllByLabelText("公众号名称 *");
    fireEvent.change(idFields[idFields.length - 1], {
      target: { value: "saved-id" },
    });
    fireEvent.change(nameFields[nameFields.length - 1], {
      target: { value: "保存的公众号" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(readMpAccounts()).toEqual([
      expect.objectContaining({ mpId: "saved-id", nickname: "保存的公众号" }),
    ]);
    expect(screen.getByText("保存的公众号")).toBeInTheDocument();
  });

  it("builds an escaped BadgeGroup snippet from JSON values", () => {
    const definition = BUILT_IN_COMPONENTS.find(
      (item) => item.name === "BadgeGroup",
    );
    expect(definition).toBeDefined();
    if (!definition) return;

    expect(
      buildComponentSnippet(definition, {
        tags: '["A&B","<C>"]',
        color: "#07c160",
      }),
    ).toContain('tags="[&quot;A&amp;B&quot;,&quot;&lt;C&gt;&quot;]"');
  });
});
