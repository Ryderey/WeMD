# Add emoji picker to editor

## Goal

Let users insert common Emoji characters from the Markdown editor toolbar without relying on the operating-system Emoji picker or remembering shortcodes.

The selected Emoji must be inserted as Unicode so the Markdown source, live preview, and copied WeChat content remain portable and predictable.

## Background

- The editor already parses Emoji shortcodes such as `:rocket:`, but the toolbar has no Emoji selection UI.
- The Markdown editor and its toolbar are shared by desktop, Electron, and mobile-width layouts.
- The existing toolbar already provides anchored dropdowns and writes small user preferences to `localStorage`.

## Requirements

- Add a smile-face Emoji button immediately after the existing image-upload button.
- Open a responsive, theme-aware Emoji picker anchored to the toolbar button.
- Provide roughly 100 high-frequency Emoji grouped into Common, Smileys, Gestures, People, Animals, Food, Activities, Objects, and Symbols.
- Insert the selected Emoji as its Unicode string with no automatic whitespace.
- Replace the current CodeMirror selection when non-empty; otherwise insert at the cursor and leave the cursor after the Emoji.
- Keep the picker open after insertion so multiple Emoji can be inserted consecutively.
- Close the picker when the user clicks outside it, presses Escape, or toggles its toolbar button closed.
- Track up to 16 recently used Emoji in most-recent-first order, without duplicates, in local browser storage.
- Show the Recent group first when it has entries; otherwise default to Common.
- Support desktop and narrow/mobile layouts without overflowing the viewport.
- Use semantic buttons, accessible labels, and keyboard-operable controls.
- Reuse the existing React, CodeMirror, Lucide, CSS-variable, and local-storage patterns; add no dependency.

## Out of Scope

- Full Unicode Emoji coverage.
- Emoji search or keyword indexing.
- Skin-tone variant selection; use only the default yellow or neutral form.
- A keyboard shortcut for opening the picker.
- Account-based or cross-device recent-Emoji synchronization.

## Acceptance Criteria

- [ ] A smile-face button appears directly after Upload Image in the Markdown toolbar on desktop and mobile-width layouts.
- [ ] Activating the button opens a categorized picker containing roughly 100 common Emoji and no skin-tone selector.
- [ ] Choosing an Emoji inserts only its Unicode string at the CodeMirror selection/cursor, updates the document, and supports undo.
- [ ] The picker remains open after insertion and closes via outside click, Escape, or the toolbar toggle.
- [ ] Recent usage is de-duplicated, ordered most-recent-first, capped at 16, and restored from `localStorage` after remount/reload.
- [ ] The picker fits the available viewport width and uses existing light/dark theme variables.
- [ ] Toolbar and insertion tests cover opening/closing, cursor/selection insertion, and recent-history behavior.
- [ ] Web package tests, lint, type-check/build, and relevant existing tests pass without adding a dependency.

## Technical Notes

- `apps/web/src/components/Editor/Toolbar.tsx` owns the editor toolbar UI.
- `apps/web/src/components/Editor/MarkdownEditor.tsx` owns CodeMirror transactions and cursor restoration.
- Existing Markdown shortcode parsing remains unchanged for backward compatibility.
