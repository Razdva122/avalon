import type { BoardDraft } from './player-board';

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
