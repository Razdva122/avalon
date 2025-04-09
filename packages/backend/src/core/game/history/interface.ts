import type { IVote, IPreVote } from '@/core/game/history/vote';
import type { IMissionAction } from '@/core/game/history/mission';
import type { IPlayerInGame, Game } from '@/core/game';
import type {
  TAssassinateResult,
  TMissionResult,
  MissionSettings,
  TVoteOption,
  THistoryVote,
  THistoryMission,
  HistoryAssassinate,
  SwitchResult,
  SwitchLancelots,
  TLoyalty,
  CheckLoyalty,
  RevealLoyalty,
  AnnounceLoyalty,
  TAssassinateType,
  TeamMember,
  TRoles,
  TGiveCardTarget,
  GiveCard,
  PreVote,
  TPlotCardNames,
  LeadToVictory,
  RestoreHonor,
  Ambush,
  KingReturns,
  PlayCard,
} from '@avalon/types';

export type THistoryData = {
  vote: {
    index: number;
    result?: TVoteOption;
    forced: boolean;
    leader: IPlayerInGame;
    team: TeamMember[];
    votes: IVote[];
  };
  mission: {
    index: number;
    result?: TMissionResult;
    settings: MissionSettings;
    leader?: IPlayerInGame;
    actions: IMissionAction[];
    fails?: number;
    hidden?: boolean;
  };
  assassinate: {
    result?: TAssassinateResult;
    assassin: IPlayerInGame;
    assassinateType: TAssassinateType;
    killed?: IPlayerInGame[];
  };
  checkLoyalty: {
    validator: IPlayerInGame;
    inspected: IPlayerInGame;
  };
  revealLoyalty: {
    revealer: IPlayerInGame;
    target: IPlayerInGame;
  };
  announceLoyalty: {
    announcer: IPlayerInGame;
    target: IPlayerInGame;
    announced: TLoyalty | TRoles;
    actual: TLoyalty | TRoles;
  };
  switchResult: {
    switcher: IPlayerInGame;
    target?: IPlayerInGame;
    result?: TMissionResult;
  };
  switchLancelots: {
    lancelotsIDs: {
      evil: string;
      good: string;
    };
    pointer: number;
    result: boolean;
    switches: Array<boolean>;
  };
  giveCard: {
    cardName: TPlotCardNames;
    target: TGiveCardTarget;
    leader: IPlayerInGame;
    owner: IPlayerInGame;
  };
  preVote: {
    votes: IPreVote[];
  };
  leadToVictory: {
    prevLeader: IPlayerInGame;
    owner: IPlayerInGame;
  };
  restoreHonor: {
    prevOwner: IPlayerInGame;
    newOwner: IPlayerInGame;
    cardName: TPlotCardNames;
  };
  ambush: {
    owner: IPlayerInGame;
    target: IPlayerInGame;
    result?: TMissionResult;
  };
  kingReturns: {
    owner: IPlayerInGame;
  };
  playCard: {
    owner: IPlayerInGame;
    cardName: TPlotCardNames;
  };
  hidden: Record<string, never>;
};

export type THistoryDataForManager = {
  vote: THistoryVote;
  mission: THistoryMission;
  assassinate: HistoryAssassinate;
  checkLoyalty: CheckLoyalty;
  revealLoyalty: RevealLoyalty;
  announceLoyalty: AnnounceLoyalty;
  switchResult: SwitchResult;
  switchLancelots: SwitchLancelots;
  giveCard: GiveCard;
  preVote: PreVote;
  leadToVictory: LeadToVictory;
  restoreHonor: RestoreHonor;
  ambush: Ambush;
  kingReturns: KingReturns;
  playCard: PlayCard;
};

export type TDataForManagerOptions = {
  game: Game;
  userID?: string;
};
