import type { TGoodRoles, TEvilRoles } from '../game/roles';
import type { TPlotCardNames } from '../game/addons';

/**
 * The index of the role that displays its importance relative to the rest
 */
export const evilRolesImportance: { [key in TEvilRoles]: number } = {
  mordred: 1,
  morgana: 2,
  oberon: 3,
  trickster: 4,
  evilLancelot: 10,
  lunatic: 50,
  brute: 51,
  revealer: 52,
  witch: 75,
  wraith: 80,
  minion: 100,
};

/**
 * The index of the role that displays its importance relative to the rest
 */
export const goodRolesImportance: { [key in TGoodRoles]: number } = {
  merlin: 1,
  merlinPure: 2,
  percival: 3,
  guinevere: 4,
  goodLancelot: 5,
  cleric: 6,
  tristan: 10,
  isolde: 11,
  troublemaker: 50,
  servant: 100,
};

export const availablePlotCards: { [key in TPlotCardNames]: true } = {
  leadToVictory: true,
  ambush: true,
  kingReturns: true,
  weFoundYou: true,
  restoreHonor: true,
  showStrength: true,
  showNature: true,
  areYouTheOne: true,
  charge: true,
};
