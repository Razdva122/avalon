/**
 * Константы для идентификаторов достижений
 */

// Открытые достижения
export const ACHIEVEMENT_LIGHT_WINS = 'light_wins';
export const ACHIEVEMENT_DARK_WINS = 'dark_wins';
export const ACHIEVEMENT_ALL_STANDARD_ROLES = 'all_standard_roles';
export const ACHIEVEMENT_DIFFERENT_PLAYER_COUNT = 'different_player_count';
export const ACHIEVEMENT_ASSASSIN_KILLS = 'assassin_kills';
export const ACHIEVEMENT_TOP_PLAYER = 'top_player';
export const ACHIEVEMENT_SECRET_HUNTER = 'secret_hunter';

export const OPEN_ACHIEVEMENT_IDS = [
  ACHIEVEMENT_LIGHT_WINS,
  ACHIEVEMENT_DARK_WINS,
  ACHIEVEMENT_ALL_STANDARD_ROLES,
  ACHIEVEMENT_DIFFERENT_PLAYER_COUNT,
  ACHIEVEMENT_ASSASSIN_KILLS,
  ACHIEVEMENT_TOP_PLAYER,
  ACHIEVEMENT_SECRET_HUNTER,
];

// Скрытые достижения
export const ACHIEVEMENT_UNDERCOVER_AGENT = 'undercover_agent';
export const ACHIEVEMENT_USELESS_ROLE = 'useless_role';
export const ACHIEVEMENT_STILL_WORTHY = 'still_worthy';
export const ACHIEVEMENT_DETECTIVE = 'detective';
export const ACHIEVEMENT_MISTAKES_HAPPEN = 'mistakes_happen';
export const ACHIEVEMENT_SERIAL_KILLER = 'serial_killer';
export const ACHIEVEMENT_WRONG_CHOICE = 'wrong_choice';
export const ACHIEVEMENT_BODYGUARD = 'bodyguard';
export const ACHIEVEMENT_SEER = 'seer';

// Стандартные роли
export const STANDARD_ROLES = ['merlin', 'percival', 'mordred', 'morgana', 'oberon', 'servant', 'minion'];

// Поддерживаемые размеры игры
export const SUPPORTED_PLAYER_COUNTS = [5, 6, 7, 8, 9, 10];

// Возможные цели для убийства
export const ASSASSIN_TARGETS = ['Merlin', 'Cleric', 'Lovers'];
