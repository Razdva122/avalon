import { TOptionalRoles } from './roles';

import { prop } from '@typegoose/typegoose';

// Validation type helper
type CheckRoleKeys<T> = keyof T extends TOptionalRoles
  ? TOptionalRoles extends keyof T
    ? T
    : 'Missing properties in class: ' & Exclude<TOptionalRoles, keyof T>
  : 'Extra properties in class: ' & Exclude<keyof T, TOptionalRoles>;

export class GameOptionsRoles implements CheckRoleKeys<GameOptionsRoles> {
  @prop()
  public merlin?: number;

  @prop()
  public percival?: number;

  @prop()
  public merlinPure?: number;

  @prop()
  public tristan?: number;

  @prop()
  public isolde?: number;

  @prop()
  public goodLancelot?: number;

  @prop()
  public guinevere?: number;

  @prop()
  public troublemaker?: number;

  @prop()
  public cleric?: number;

  @prop()
  public morgana?: number;

  @prop()
  public oberon?: number;

  @prop()
  public wraith?: number;

  @prop()
  public mordred?: number;

  @prop()
  public evilLancelot?: number;

  @prop()
  public trickster?: number;

  @prop()
  public lunatic?: number;

  @prop()
  public brute?: number;

  @prop()
  public witch?: number;

  @prop()
  public revealer?: number;
}

export class GameOptionsAddons {
  @prop()
  public ladyOfLake?: boolean;

  @prop()
  public ladyOfSea?: boolean;

  @prop()
  public excalibur?: boolean;

  @prop()
  public plotCards?: boolean;
}

export class GameOptionsFeatures {
  @prop()
  public anonymousVoting?: boolean;

  @prop()
  public hiddenHistory?: boolean;

  @prop()
  public displayIndex?: boolean;

  @prop()
  public lookingForPlayers?: boolean;

  @prop()
  public timerEnabled?: boolean;

  @prop()
  public timerDurations?: {
    selectTeam?: { duration?: number; enabled?: boolean };
    votingForTeam?: { duration?: number; enabled?: boolean };
    onMission?: { duration?: number; enabled?: boolean };
    assassinate?: { duration?: number; enabled?: boolean };
    checkLoyalty?: { duration?: number; enabled?: boolean };
    announceLoyalty?: { duration?: number; enabled?: boolean };
    revealLoyalty?: { duration?: number; enabled?: boolean };
    giveExcalibur?: { duration?: number; enabled?: boolean };
    useExcalibur?: { duration?: number; enabled?: boolean };
    giveCard?: { duration?: number; enabled?: boolean };
    switchLancelots?: { duration?: number; enabled?: boolean };
    witchAbility?: { duration?: number; enabled?: boolean };
  };
}

export class GameOptions {
  @prop({ required: true, type: () => GameOptionsRoles, _id: false })
  public roles!: GameOptionsRoles;

  @prop({ required: true, type: () => GameOptionsAddons, _id: false })
  public addons!: GameOptionsAddons;

  @prop({ required: true, type: () => GameOptionsFeatures, _id: false })
  public features!: GameOptionsFeatures;
}
