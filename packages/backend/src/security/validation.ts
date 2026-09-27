export function validID(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-zA-Z0-9_-]{1,100}$/.test(value) &&
    !['__proto__', 'prototype', 'constructor'].includes(value)
  );
}
export function text(value: unknown, max = 100): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}
export function validName(value: unknown): value is string {
  return (
    text(value, 100) &&
    value.trim().length > 0 &&
    ![...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  );
}
export function validPassword(value: unknown): value is string {
  return text(value, 72) && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72 && !/\s/.test(value);
}
export function validEmail(value: unknown): value is string {
  return text(value, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
export function validLogin(value: unknown): value is string {
  return text(value, 100) && /^[a-zA-Z0-9_.-]+$/.test(value);
}
function record(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
function safeOptions(value: unknown, depth = 0): boolean {
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 && value <= 86400;
  return (
    depth < 4 &&
    record(value) &&
    Object.keys(value).length <= 40 &&
    Object.entries(value).every(
      ([key, item]) =>
        /^[a-zA-Z][a-zA-Z0-9]*$/.test(key) &&
        key !== 'constructor' &&
        key !== 'prototype' &&
        safeOptions(item, depth + 1),
    )
  );
}

// Required ack position is a protocol property, independent of a listener's JS arity.
const acknowledgements: Record<string, number> = {
  getRoomsList: 0,
  getTotalStats: 0,
  getAiRoomsList: 0,
  getRolesWithRatings: 0,
  getAllAchievements: 0,
  getAchievementStats: 0,
  getTrueSkillLeaderboard: 0,
  getUserAvatars: 0,
  getMyProfile: 0,
  getMyStickers: 0,
  getAiBudget: 0,
  getAiRoomAccess: 0,
  createRoom: 0,
  joinRoom: 1,
  getOnlineCounter: 1,
  getPlayerGames: 1,
  getPlayerGameSummaries: 1,
  getPlayerGameSummariesPage: 2,
  getUserProfile: 1,
  registerUser: 1,
  getRoleLeaderboard: 1,
  getUserRatings: 1,
  getPopularRoles: 1,
  getTopPlayersForPopularRoles: 1,
  getUserAchievements: 1,
  getTrueSkillRating: 1,
  getMatchTrueSkillChanges: 1,
  resetTrueSkillRating: 1,
  updateUserAvatar: 1,
  markStickersSeen: 1,
  getAiSpectatorRoles: 1,
  getAiRoomCosts: 1,
  createAiRoom: 1,
  getLoyalty: 1,
  getVoiceState: 1,
  joinVoice: 1,
  leaveVoice: 1,
  login: 2,
  updateUserPassword: 2,
  updateUserEmail: 2,
  updateUserLogin: 2,
  getRatingHistory: 2,
  updateStickerPreferences: 2,
  sendSticker: 2,
  controlAiRoom: 2,
  getLoyaltyWithCard: 2,
  setVoiceEnabled: 2,
};
const nonIDs = new Set([
  'registerUser',
  'login',
  'updateUserPassword',
  'updateUserEmail',
  'updateUserLogin',
  'updateUserName',
  'updateUserAvatar',
  'updateStickerPreferences',
  'markStickersSeen',
  'getAiRoomCosts',
  'createAiRoom',
  'getPopularRoles',
  'getTopPlayersForPopularRoles',
]);
const booleanSecond = new Set([
  'voteInRoom',
  'useWitchAbility',
  'useLeadToVictory',
  'useKingReturns',
  'useWeFoundYou',
  'setVoiceEnabled',
]);
export function validPacket(event: string, args: unknown[]): boolean {
  const ack = acknowledgements[event];
  if (ack !== undefined && (args.length !== ack + 1 || typeof args[ack] !== 'function')) return false;
  const values = ack !== undefined ? args.slice(0, ack) : args;
  if (values.length > 4) return false;
  if (!nonIDs.has(event) && values.length && !validID(values[0])) return false;
  if (event === 'getPlayerGameSummariesPage')
    return (
      values.length === 2 &&
      (values[1] == null || (typeof values[1] === 'string' && /^[a-f0-9]{24}:[a-f0-9]{24}$/.test(values[1])))
    );
  if (event === 'voteForMission' || event === 'preVote')
    return (
      values.length === (event === 'preVote' ? 3 : 2) &&
      (values[1] === 'approve' || values[1] === 'reject') &&
      (event !== 'preVote' || validID(values[2]))
    );
  if (event === 'actionOnMission') return values.length === 2 && (values[1] === 'success' || values[1] === 'fail');
  if (event === 'startCustomTimer' || event === 'addCustomTimerTime')
    return (
      values.length === 2 &&
      typeof values[1] === 'number' &&
      Number.isInteger(values[1]) &&
      values[1] > 0 &&
      values[1] <= 86400
    );
  if (event === 'registerUser') {
    const user = values[0];
    return (
      record(user) &&
      validID(user.id) &&
      validName(user.name) &&
      validEmail(user.email) &&
      validLogin(user.login) &&
      validPassword(user.password)
    );
  }
  if (event === 'updateOptions') {
    const options = values[1];
    return (
      values.length === 2 &&
      record(options) &&
      record(options.roles) &&
      record(options.addons) &&
      record(options.features) &&
      Object.values(options.roles).every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 10) &&
      safeOptions(options)
    );
  }
  if (event === 'getAiRoomCosts' || event === 'markStickersSeen' || event === 'updateStickerPreferences') {
    return (
      Array.isArray(values[0]) &&
      values[0].length <= (event === 'getAiRoomCosts' ? 50 : 12) &&
      values[0].every(validID) &&
      (event !== 'updateStickerPreferences' || typeof values[1] === 'boolean')
    );
  }
  if (event === 'sendMessage')
    return (
      values.length >= 2 &&
      values.length <= 4 &&
      text(values[1], 2000) &&
      (values[2] === undefined || text(values[2], 100)) &&
      (values[3] === undefined || typeof values[3] === 'function')
    );
  if (event === 'updateUserAvatar') return text(values[0], 100) && /^[a-zA-Z0-9_/-]+$/.test(values[0]);
  if (event === 'login') return text(values[0], 254) && text(values[1], 1024);
  if (event === 'updateUserPassword') return text(values[0], 1024) && validPassword(values[1]);
  if (event === 'updateUserEmail') return text(values[0], 1024) && validEmail(values[1]);
  if (event === 'updateUserLogin') return text(values[0], 1024) && validLogin(values[1]);
  if (event === 'updateUserName')
    return (
      values.length >= 1 &&
      values.length <= 2 &&
      validName(values[0]) &&
      (values[1] === undefined || typeof values[1] === 'function')
    );
  if (booleanSecond.has(event) && typeof values[1] !== 'boolean') return false;
  return values.every(
    (v) =>
      v === undefined ||
      text(v, 254) ||
      typeof v === 'boolean' ||
      (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 86400),
  );
}
