import { useState } from "react";
import {
  EMOJI_CATEGORIES,
  EMOJI_LABELS,
  type EmojiCategoryId,
  type EmojiItem,
} from "./emojiData";
import {
  getNextRecentEmojis,
  MAX_RECENT_EMOJIS,
  RECENT_EMOJI_STORAGE_KEY,
} from "./emojiRecent";
import "./EmojiPicker.css";

type PickerCategoryId = EmojiCategoryId | "recent";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

function readRecentEmojis(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_EMOJI_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is string =>
          typeof item === "string" && EMOJI_LABELS.has(item),
      )
      .slice(0, MAX_RECENT_EMOJIS);
  } catch {
    return [];
  }
}

function saveRecentEmojis(recent: string[]): void {
  try {
    localStorage.setItem(RECENT_EMOJI_STORAGE_KEY, JSON.stringify(recent));
  } catch {
    // Recent history is optional; storage failures must not block insertion.
  }
}

function recentItems(recent: string[]): EmojiItem[] {
  return recent.map((value) => ({
    value,
    label: EMOJI_LABELS.get(value) ?? value,
  }));
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [recent, setRecent] = useState(readRecentEmojis);
  const [activeCategoryId, setActiveCategoryId] = useState<PickerCategoryId>(
    () => (readRecentEmojis().length > 0 ? "recent" : "common"),
  );

  const activeCategory = EMOJI_CATEGORIES.find(
    (category) => category.id === activeCategoryId,
  );
  const activeItems =
    activeCategoryId === "recent"
      ? recentItems(recent)
      : (activeCategory?.items ?? []);
  const activeLabel =
    activeCategoryId === "recent"
      ? "最近使用"
      : (activeCategory?.label ?? "常用");

  const handleSelect = (emoji: string) => {
    const nextRecent = getNextRecentEmojis(recent, emoji);
    setRecent(nextRecent);
    saveRecentEmojis(nextRecent);
    onSelect(emoji);
  };

  return (
    <div className="emoji-picker" role="dialog" aria-label="Emoji 选择器">
      <div
        className="emoji-picker__categories"
        role="tablist"
        aria-label="Emoji 分类"
      >
        {recent.length > 0 && (
          <button
            type="button"
            role="tab"
            className={
              "emoji-picker__category " +
              (activeCategoryId === "recent"
                ? "emoji-picker__category--active"
                : "")
            }
            aria-label="最近使用"
            aria-selected={activeCategoryId === "recent"}
            title="最近使用"
            onClick={() => setActiveCategoryId("recent")}
          >
            🕘
          </button>
        )}
        {EMOJI_CATEGORIES.map((category) => (
          <button
            type="button"
            role="tab"
            key={category.id}
            className={
              "emoji-picker__category " +
              (activeCategoryId === category.id
                ? "emoji-picker__category--active"
                : "")
            }
            aria-label={category.label}
            aria-selected={activeCategoryId === category.id}
            title={category.label}
            onClick={() => setActiveCategoryId(category.id)}
          >
            {category.icon}
          </button>
        ))}
      </div>

      <div className="emoji-picker__title">{activeLabel}</div>
      <div
        className="emoji-picker__grid"
        role="group"
        aria-label={activeLabel + " Emoji"}
      >
        {activeItems.map((item) => (
          <button
            type="button"
            className="emoji-picker__emoji"
            key={item.value}
            aria-label={item.label + " " + item.value}
            title={item.label}
            onClick={() => handleSelect(item.value)}
          >
            <span aria-hidden="true">{item.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
