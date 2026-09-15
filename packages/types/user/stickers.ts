export interface StickerDefinition {
  id: string;
  games?: number;
  achievement?: string;
  hidden?: boolean;
}

export const STICKERS: readonly StickerDefinition[] = [
  { id: 'servant-yes' },
  { id: 'merlin-think' },
  { id: 'morgana-wow' },
  { id: 'oberon-laugh' },
  { id: 'servant-wave', games: 1 },
  { id: 'percival-toast', games: 5 },
  { id: 'percival-shield', achievement: 'bodyguard', hidden: true },
  { id: 'merlin-detective', achievement: 'detective', hidden: true },
  { id: 'percival-worthy', achievement: 'still_worthy', hidden: true },
  { id: 'minion-oops', achievement: 'mistakes_happen', hidden: true },
  { id: 'servant-victory', achievement: 'light_wins' },
  { id: 'oberon-smirk', achievement: 'dark_wins' },
];
export const STICKER_COOLDOWN_MS = 5000;
export const STICKER_DURATION_MS = 4000;
export const STICKER_FAVORITES_LIMIT = 6;
export const DEFAULT_STICKER_FAVORITES = STICKERS.filter((s) => !s.games && !s.achievement).map((s) => s.id);
export interface StickerInfo {
  id: string;
  available: boolean;
  progress: number;
  requirement: number;
  isNew: boolean;
}
export interface StickerCollection {
  stickers: StickerInfo[];
  favorites: string[];
  hideOnBoard: boolean;
}
export type StickerError = {
  error: 'unavailable' | 'notInRoom' | 'cooldown' | 'invalid' | 'failed';
  retryAfter?: number;
};
export type StickerResponse = StickerCollection | StickerError;
export interface StickerMessage {
  id: string;
  roomID: string;
  userID: string;
  timestamp: number;
  stickerID: string;
  showOnBoard: boolean;
}
export function isStickerAvailable(sticker: StickerDefinition, games: number, completed: string[]): boolean {
  return sticker.achievement ? completed.includes(sticker.achievement) : games >= (sticker.games || 0);
}
