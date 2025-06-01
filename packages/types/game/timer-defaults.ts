/**
 * Default timer durations for each game stage (in seconds)
 * Single source of truth for both backend and frontend
 */
export const STAGE_TIMER_DEFAULTS: Record<string, number> = {
  selectTeam: 180, // 3 minutes to select team (allows all players to contribute meaningfully)
  votingForTeam: 45, // 45 seconds to vote and debate approval
  onMission: 30, // 30 seconds for individual mission decisions
  assassinate: 300, // 5 minutes for evil team to discuss and identify Merlin
  checkLoyalty: 30, // 30 seconds to choose who to check
  announceLoyalty: 15, // 15 seconds to announce result
  revealLoyalty: 30, // 30 seconds to reveal (mostly automatic)
  giveExcalibur: 20, // 20 seconds for leader to give Excalibur
  useExcalibur: 30, // 30 seconds to decide whether to use Excalibur
  giveCard: 30, // 30 seconds to give plot card
  witchAbility: 30, // 30 seconds for witch ability decision
};

/**
 * Default enabled stages (high discussion/conversation stages)
 */
export const DEFAULT_ENABLED_STAGES = [
  'assassinate', // Most conversation - evil team discusses who Merlin is
  'selectTeam', // Heavy discussion - players help leader choose team
  'votingForTeam', // Significant discussion - debate team approval
];
