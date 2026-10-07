import { validBoardContact } from '@avalon/types/board-contact';
import {
  BOARD_CONTACT_TYPES,
  BOARD_KINDS,
  BOARD_LANGUAGES,
  BOARD_REPORT_REASONS,
  BoardDraft,
  BoardKind,
  BoardReportReason,
} from '@avalon/types/player-board';

const fields = [
  'kind',
  'languages',
  'otherLanguage',
  'days',
  'scheduleEnabled',
  'startHour',
  'endHour',
  'timeZone',
  'communication',
  'experience',
  'beginnerFriendly',
  'canTeach',
  'groupSize',
  'groupName',

  'contacts',
];
const languageValues: readonly string[] = BOARD_LANGUAGES.map((language) => language.value);
export function boardKind(value: unknown): BoardKind {
  if (typeof value !== 'string' || !(BOARD_KINDS as readonly string[]).includes(value)) throw Error('invalid_kind');
  return value as BoardKind;
}
function integer(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
export function validateBoardDraft(value: unknown, kind: BoardKind): BoardDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('invalid_draft');
  const draft = value as Record<string, unknown>;
  if (
    Object.keys(draft).some((key) => !fields.includes(key) && key !== 'memberIDs') ||
    fields.some((key) => !(key in draft))
  )
    throw Error('invalid_draft');
  if (
    typeof draft.groupName !== 'string' ||
    (kind === 'group' && !draft.groupName.trim()) ||
    draft.groupName.length > 60 ||
    /[\x00-\x1f\x7f]/.test(draft.groupName)
  )
    throw Error('invalid_group_name');
  if (draft.kind !== kind) throw Error('invalid_kind');
  if (
    !Array.isArray(draft.languages) ||
    !draft.languages.length ||
    draft.languages.length > BOARD_LANGUAGES.length ||
    draft.languages.some((l) => typeof l !== 'string' || !languageValues.includes(l)) ||
    new Set(draft.languages).size !== draft.languages.length
  )
    throw Error('invalid_languages');
  if (
    typeof draft.otherLanguage !== 'string' ||
    draft.otherLanguage.length > 60 ||
    (draft.languages.includes('other') && !/^[\p{L}][\p{L}\p{M} '’(),-]{0,59}$/u.test(draft.otherLanguage.trim()))
  )
    throw Error('invalid_languages');
  if (typeof draft.scheduleEnabled !== 'boolean') throw Error('invalid_draft');
  if (draft.scheduleEnabled) {
    if (
      !Array.isArray(draft.days) ||
      !draft.days.length ||
      draft.days.length > 7 ||
      draft.days.some((d) => !integer(d, 1, 7)) ||
      new Set(draft.days).size !== draft.days.length
    )
      throw Error('invalid_days');
    if (!integer(draft.startHour, 0, 23) || !integer(draft.endHour, 0, 23) || draft.startHour === draft.endHour)
      throw Error('invalid_hours');
    if (
      typeof draft.timeZone !== 'string' ||
      draft.timeZone.length > 80 ||
      !/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)*$/.test(draft.timeZone)
    )
      throw Error('invalid_timezone');
    try {
      new Intl.DateTimeFormat('en', { timeZone: draft.timeZone });
    } catch {
      throw Error('invalid_timezone');
    }
  }
  if (typeof draft.communication !== 'string' || !['voice', 'text', 'either'].includes(draft.communication))
    throw Error('invalid_communication');
  if (typeof draft.experience !== 'string' || !['beginner', 'experienced'].includes(draft.experience))
    throw Error('invalid_experience');
  if (typeof draft.beginnerFriendly !== 'boolean' || typeof draft.canTeach !== 'boolean') throw Error('invalid_draft');
  if (!integer(draft.groupSize, 1, 10)) throw Error('invalid_group_size');
  const memberIDs = draft.memberIDs === undefined ? [] : draft.memberIDs;
  if (
    !Array.isArray(memberIDs) ||
    memberIDs.length > Math.min(10, draft.groupSize) ||
    (kind === 'solo' && memberIDs.length > 0) ||
    new Set(memberIDs).size !== memberIDs.length ||
    memberIDs.some((id) => typeof id !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(id))
  )
    throw Error('invalid_members');
  if (!Array.isArray(draft.contacts) || draft.contacts.length < 1 || draft.contacts.length > 2)
    throw Error('invalid_contacts');
  const contactTypes = new Set<string>();
  for (const contact of draft.contacts) {
    if (
      !contact ||
      typeof contact !== 'object' ||
      Array.isArray(contact) ||
      Object.keys(contact).some((key) => !['type', 'value'].includes(key))
    )
      throw Error('invalid_contacts');
    const { type, value: account } = contact;
    if (
      !(BOARD_CONTACT_TYPES as readonly unknown[]).includes(type) ||
      (type === 'qqGroup' && kind !== 'group') ||
      contactTypes.has(type)
    )
      throw Error('invalid_contacts');
    if (typeof account !== 'string' || !validBoardContact(type, account, kind === 'group'))
      throw Error('invalid_contacts');
    contactTypes.add(type);
  }
  // Explicit projection keeps later schema changes from admitting client-owned metadata.
  return {
    kind,
    languages: [...draft.languages],
    otherLanguage: draft.languages.includes('other') ? draft.otherLanguage.trim() : '',
    scheduleEnabled: draft.scheduleEnabled,
    days: draft.scheduleEnabled ? [...(draft.days as number[])] : [],
    startHour: draft.scheduleEnabled ? (draft.startHour as number) : 0,
    endHour: draft.scheduleEnabled ? (draft.endHour as number) : 0,
    timeZone: draft.scheduleEnabled ? (draft.timeZone as string) : '',
    communication: draft.communication as BoardDraft['communication'],
    experience: draft.experience as BoardDraft['experience'],
    groupName: kind === 'group' ? draft.groupName.trim() : '',
    beginnerFriendly: kind === 'group' && draft.beginnerFriendly,
    canTeach: draft.canTeach,
    groupSize: draft.groupSize,
    memberIDs: [...memberIDs],

    contacts: draft.contacts.map(({ type, value: account }) => ({ type, value: account })),
  };
}
export function boardQuery(query: Record<string, unknown>) {
  const kind = boardKind(query.kind ?? 'solo');
  const language = query.language;
  if (language !== undefined && (typeof language !== 'string' || !languageValues.includes(language)))
    throw Error('invalid_languages');
  const pageValue = query.page ?? '1';
  if (typeof pageValue !== 'string' || !/^[1-9]\d{0,4}$/.test(pageValue)) throw Error('invalid_page');
  const communication = query.communication;
  if (communication !== undefined && communication !== 'voice' && communication !== 'text')
    throw Error('invalid_communication');
  if (query.beginnerFriendly !== undefined && query.beginnerFriendly !== '1') throw Error('invalid_request');
  return {
    kind,
    language: language as string | undefined,
    page: Number(pageValue),
    communication: communication as 'voice' | 'text' | undefined,
    beginnerFriendly: kind === 'group' && query.beginnerFriendly === '1',
  };
}
export function reportReason(value: unknown): BoardReportReason {
  if (!(BOARD_REPORT_REASONS as readonly unknown[]).includes(value)) throw Error('invalid_report');
  return value as BoardReportReason;
}
