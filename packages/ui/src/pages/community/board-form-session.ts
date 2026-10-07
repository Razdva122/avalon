import type { BoardDraft } from '@avalon/types/player-board';
import { editableDraft } from './board-helpers';

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const keyFor = (key: string) => `avalon:board-draft:${key}`;

export function readBoardDraft(key: string, fallback: BoardDraft, cache?: DraftStorage): BoardDraft | null {
  try {
    const raw = (cache ?? sessionStorage).getItem(keyFor(key));
    if (!raw || raw.length > 16384) return null;
    const draft = JSON.parse(raw);
    if (!draft || draft.kind !== fallback.kind) return null;
    for (const [field, value] of Object.entries(fallback)) {
      const saved = draft[field];
      if (Array.isArray(value)) {
        if (!Array.isArray(saved) || saved.length > (field === 'contacts' ? 2 : 10)) return null;
        if (field === 'contacts') {
          if (saved.some((c) => !c || typeof c.type !== 'string' || typeof c.value !== 'string')) return null;
        } else if (saved.some((item) => typeof item !== (field === 'days' ? 'number' : 'string'))) return null;
      } else if (typeof saved !== typeof value && !(field === 'groupSize' && saved === '')) return null;
    }
    // Only draft fields are restored; owner, token and server metadata never enter the form.
    return editableDraft(draft);
  } catch {
    return null;
  }
}
export function writeBoardDraft(key: string, draft: BoardDraft, cache?: DraftStorage): boolean {
  try {
    (cache ?? sessionStorage).setItem(keyFor(key), JSON.stringify(editableDraft(draft)));
    return true;
  } catch {
    return false;
  }
}
export function clearBoardDraft(key: string, cache?: DraftStorage) {
  try {
    (cache ?? sessionStorage).removeItem(keyFor(key));
  } catch {
    // Storage may be disabled; publishing must still work.
  }
}
