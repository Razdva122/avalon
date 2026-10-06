/** Public player-board contacts: account IDs or platform invitations for groups. */
export const BOARD_LANGUAGES = Object.freeze([
  Object.freeze({ value: 'en', title: 'English' }),
  Object.freeze({ value: 'ru', title: 'Русский' }),
  Object.freeze({ value: 'es', title: 'Español' }),
  Object.freeze({ value: 'pt', title: 'Português' }),
  Object.freeze({ value: 'cmn', title: '普通话 / 國語' }),
  Object.freeze({ value: 'yue', title: '粵語 / 粤语' }),
  Object.freeze({ value: 'other', title: '' }),
] as const);
export const BOARD_CONTACT_TYPES = Object.freeze(['wechat', 'qq', 'line', 'discord', 'telegram', 'qqGroup'] as const);
export const BOARD_KINDS = Object.freeze(['solo', 'group'] as const);
export const BOARD_REPORT_REASONS = Object.freeze(['spam', 'abuse', 'contact'] as const);
export type BoardKind = (typeof BOARD_KINDS)[number];
export type BoardContactType = (typeof BOARD_CONTACT_TYPES)[number];
export type BoardReportReason = (typeof BOARD_REPORT_REASONS)[number];
export interface BoardDraft {
  memberIDs?: string[];
  kind: BoardKind;
  groupName: string;
  languages: string[];
  otherLanguage: string;
  scheduleEnabled: boolean;
  days: number[];
  startHour: number;
  endHour: number;
  timeZone: string;
  communication: 'voice' | 'text' | 'either';
  experience: 'beginner' | 'experienced';
  beginnerFriendly: boolean;
  canTeach: boolean;
  groupSize: number;

  contacts: { type: BoardContactType; value: string }[];
}
export interface BoardListing extends BoardDraft {
  members?: BoardMember[];
  id: string;
  userID: string;
  name: string;
  avatar: string;
  createdAt: string;
  bumpedAt: string;
  expiresAt: string;
  active: boolean;
  moderated: boolean;
}
export interface BoardMember {
  userID: string;
  name: string;
  avatar: string;
}
export interface BoardReport {
  id: string;
  listing: BoardListing;
  reasons: string[];
  count: number;
  banned: boolean;
}
export interface BoardPage {
  listings: BoardListing[];
  hasMore: boolean;
}
export interface BoardOwnerState {
  listings: BoardListing[];
  canRecruit: boolean;
  banned: boolean;
  isAdmin: boolean;
}
export type BoardAction = 'bump' | 'hide' | 'reactivate';
