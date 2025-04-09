// Re-export everything from the split files
export * from './base';
export * from './vote';
export * from './mission';
export * from './loyalty';
export * from './cards';
export * from './special';

// Export the combined type for all history results
import { HiddenHistory } from './base';
import { AnonymousHistoryVote, HistoryVote, PreVote } from './vote';
import { HistoryMission, HistoryMissionHidden, SwitchResult } from './mission';
import { CheckLoyalty, RevealLoyalty, AnnounceLoyalty } from './loyalty';
import { GiveCard, LeadToVictory, RestoreHonor, Ambush, KingReturns, PlayCard, WeFoundYou } from './cards';
import { HistoryAssassinate, SwitchLancelots } from './special';

export type THistoryResults =
  | AnonymousHistoryVote
  | HistoryVote
  | HistoryMission
  | HistoryMissionHidden
  | HistoryAssassinate
  | CheckLoyalty
  | RevealLoyalty
  | AnnounceLoyalty
  | SwitchResult
  | HiddenHistory
  | SwitchLancelots
  | GiveCard
  | PreVote
  | LeadToVictory
  | RestoreHonor
  | Ambush
  | KingReturns
  | PlayCard
  | WeFoundYou;
