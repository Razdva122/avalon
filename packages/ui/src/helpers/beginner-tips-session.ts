import { reactive } from 'vue';
import { saveTipsDisabled, tipsDisabled } from './beginner-tips';

// Shared with the header menu so hidden tips can be enabled again.
export const beginnerTipsSession = reactive({ available: false, enabled: true, roomID: '', userID: '' });
export function startBeginnerTips(roomID: string, userID: string, available: boolean) {
  const changed = roomID !== beginnerTipsSession.roomID || userID !== beginnerTipsSession.userID;
  Object.assign(beginnerTipsSession, { roomID, userID, available });
  if (changed) {
    beginnerTipsSession.enabled = true;
    try {
      beginnerTipsSession.enabled = !tipsDisabled(localStorage, roomID, userID);
    } catch {
      /* Storage can be blocked. */
    }
  }
}
export function setBeginnerTipsEnabled(enabled: boolean) {
  beginnerTipsSession.enabled = enabled;
  try {
    saveTipsDisabled(localStorage, beginnerTipsSession.roomID, beginnerTipsSession.userID, !enabled);
  } catch {
    /* Keep the in-memory preference. */
  }
}
