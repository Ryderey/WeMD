export const RECENT_EMOJI_STORAGE_KEY = "wemd-recent-emojis";
export const MAX_RECENT_EMOJIS = 16;

export function getNextRecentEmojis(
  current: string[],
  emoji: string,
): string[] {
  return [emoji, ...current.filter((item) => item !== emoji)].slice(
    0,
    MAX_RECENT_EMOJIS,
  );
}
