import type { BoardDraft, BoardKind, BoardListing } from '@avalon/types/player-board';

export function listingState(listing: Pick<BoardListing, 'active' | 'moderated' | 'expiresAt'>, now = Date.now()) {
  if (listing.moderated) return 'moderated';
  if (!listing.active) return 'hidden';
  return Date.parse(listing.expiresAt) <= now ? 'expired' : 'active';
}
export function nextBumpAt(listing: Pick<BoardListing, 'bumpedAt'>) {
  return Date.parse(listing.bumpedAt) + 7 * 86400000;
}
export function contactLabel(type: string): string {
  const labels: Record<string, string> = {
    wechat: 'WeChat',
    qq: 'QQ',
    qqGroup: 'QQ',
    line: 'LINE',
    discord: 'Discord',
    telegram: 'Telegram',
  };
  return labels[type] || '';
}
export function boardError(code: unknown): string {
  const errors: Record<string, string> = {
    unauthorized: 'authError',
    forbidden: 'forbiddenError',
    banned: 'banned',
    board_banned: 'banned',
    recruitment_ineligible: 'eligibility',
    board_moderated: 'moderated',
    listing_inactive: 'notFoundError',
    listing_active: 'conflictError',
    cooldown: 'cooldownError',
    game_required: 'eligibility',
    invalid_request: 'invalidError',
    invalid_draft: 'invalidError',
    not_found: 'notFoundError',
    too_many_requests: 'rateError',
    moderated: 'moderated',
    conflict: 'conflictError',
  };
  if (typeof code !== 'string') return 'error';
  if (code.startsWith('invalid_')) return 'invalidError';
  return errors[code] || 'error';
}

export function editableDraft(listing: BoardDraft): BoardDraft {
  const {
    kind,
    languages,
    days,
    startHour,
    endHour,
    timeZone,
    communication,
    experience,
    beginnerFriendly,
    canTeach,
    groupSize,
    contacts,
  } = listing;
  return {
    kind,
    memberIDs: [...(listing.memberIDs ?? [])],
    groupName: listing.groupName,
    otherLanguage: listing.otherLanguage ?? '',
    scheduleEnabled: listing.scheduleEnabled ?? false,
    languages: [...languages],
    days: [...days],
    startHour,
    endHour,
    timeZone,
    communication,
    experience,
    beginnerFriendly,
    canTeach,
    groupSize,
    contacts: contacts.map(({ type, value }) => ({ type, value })),
  };
}
export function publicQuery(kind: BoardKind, language: string, page: number) {
  const query = new URLSearchParams({ kind, page: String(page) });
  if (language) query.set('language', language);
  return `?${query}`;
}

export function boardClientError(error: unknown): string {
  const known = [
    'authError',
    'forbiddenError',
    'banned',
    'cooldownError',
    'eligibility',
    'invalidError',
    'notFoundError',
    'rateError',
    'moderated',
    'conflictError',
    'error',
  ];
  return error instanceof Error && known.includes(error.message) ? error.message : 'error';
}
