import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getNextRecentEmojis,
  MAX_RECENT_EMOJIS,
  RECENT_EMOJI_STORAGE_KEY,
} from "../../components/Editor/emojiRecent";
import { EMOJI_CATEGORIES } from "../../components/Editor/emojiData";
import { Toolbar } from "../../components/Editor/Toolbar";

describe("Toolbar Emoji picker", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens after image upload, inserts Unicode, stays open, and closes on Escape", () => {
    const onInsertText = vi.fn();
    render(<Toolbar onInsert={vi.fn()} onInsertText={onInsertText} />);

    const imageButton = screen.getByRole("button", { name: "上传图片" });
    const emojiButton = screen.getByRole("button", { name: "插入 Emoji" });
    expect(imageButton.nextElementSibling?.contains(emojiButton)).toBe(true);

    fireEvent.click(emojiButton);
    expect(
      screen.getByRole("dialog", { name: "Emoji 选择器" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "笑脸 😀" }));
    expect(onInsertText).toHaveBeenCalledWith("😀");
    expect(
      screen.getByRole("dialog", { name: "Emoji 选择器" }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(RECENT_EMOJI_STORAGE_KEY) ?? "[]"),
    ).toEqual(["😀"]);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Emoji 选择器" }),
    ).not.toBeInTheDocument();
  });

  it("restores recent Emoji first and closes on outside click", () => {
    localStorage.setItem(
      RECENT_EMOJI_STORAGE_KEY,
      JSON.stringify(["🚀", "😀"]),
    );
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "插入 Emoji" }));
    expect(screen.getByRole("tab", { name: "最近使用" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("group", { name: "最近使用 Emoji" }),
    ).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(
      screen.queryByRole("dialog", { name: "Emoji 选择器" }),
    ).not.toBeInTheDocument();
  });

  it("provides roughly 100 Emoji and caps de-duplicated recent history", () => {
    const emojiCount = EMOJI_CATEGORIES.reduce(
      (total, category) => total + category.items.length,
      0,
    );
    expect(emojiCount).toBeGreaterThanOrEqual(100);
    expect(emojiCount).toBeLessThanOrEqual(120);

    const current = Array.from({ length: 20 }, (_, index) => String(index));
    const recent = getNextRecentEmojis(current, "5");
    expect(recent).toHaveLength(MAX_RECENT_EMOJIS);
    expect(recent[0]).toBe("5");
    expect(recent.filter((item) => item === "5")).toHaveLength(1);
  });
});
