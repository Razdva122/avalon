import type { TRoomState, VisualGameState } from '@avalon/types';

type Destination = 'lobby' | 'community' | 'ai';
export type AuthAction = 'account' | 'create_room' | 'join_room' | 'ai_game' | 'publish_listing' | 'chat';
type OnboardingEvent =
  | 'auth_open'
  | 'auth_tab'
  | 'auth_dismiss'
  | 'auth_continue'
  | 'auth_result'
  | 'sign_up_attempt'
  | 'sign_up_error'
  | 'login_attempt'
  | 'login_error'
  | 'login'
  | 'welcome_view'
  | 'welcome_choice'
  | 'welcome_dismiss'
  | 'welcome_result'
  | 'welcome_ai_status';
const onboardingEvents = new Set<OnboardingEvent>([
  'auth_open',
  'auth_tab',
  'auth_dismiss',
  'auth_continue',
  'auth_result',
  'sign_up_attempt',
  'sign_up_error',
  'login_attempt',
  'login_error',
  'login',
  'welcome_view',
  'welcome_choice',
  'welcome_dismiss',
  'welcome_result',
  'welcome_ai_status',
]);
const onboardingFields = {
  page: [
    'lobby',
    'room',
    'profile',
    'rules',
    'roles',
    'wiki',
    'community',
    'community_solo',
    'community_group',
    'guide',
    'passwordRecovery',
  ],
  action: ['account', 'create_room', 'join_room', 'ai_game', 'publish_listing', 'chat'],
  mode: ['auth', 'registration'],
  error: [
    'emailAlreadyExist',
    'loginAlreadyExist',
    'invalidRequest',
    'requestFailed',
    'forbidden',
    'wrongPassword',
    'userNotFound',
    'wrongLoginOrPassword',
  ],
  choice: ['ai', 'community', 'friends'],
  reason: ['signup', 'close', 'later', 'outside', 'navigation', 'password_recovery'],
  result: ['success', 'error', 'continued', 'welcome', 'cancelled', 'stay'],
  availability: ['loading', 'available', 'unavailable', 'error'],
};

/** Only allowlisted categorical values cross the analytics boundary. */
export function trackOnboarding(event: OnboardingEvent, fields: Record<string, unknown> = {}): void {
  if (!onboardingEvents.has(event)) return;
  const safe: Record<string, string> = {};
  for (const [key, allowed] of Object.entries(onboardingFields)) {
    if (!(key in fields)) continue;
    const value = fields[key];
    safe[key] = typeof value === 'string' && allowed.includes(value) ? value : 'other';
  }
  send(event, safe);
}
type AcquisitionRoom = Pick<TRoomState, 'roomID' | 'stage' | 'players' | 'ai' | 'archived'> & {
  game?: Pick<VisualGameState, 'uuid' | 'stage' | 'players' | 'result'>;
};
const guideSlugs = new Set(['social-deduction-games-online', 'games-like-secret-hitler', 'avalon-vs-werewolf']);
const sourceKey = 'avalon:initial-guide';
let source: string | undefined;
let playIntent: Destination | undefined;
const participated = new Set<string>();
const observedGames = new Map<string, string>();
const completed = new Set<string>();

function activeBrowser() {
  return typeof window !== 'undefined' && !('__AVALON_PRERENDER__' in window);
}

function initialSource() {
  if (!activeBrowser()) return undefined;
  if (!source) {
    try {
      const stored = window.sessionStorage.getItem(sourceKey);
      if (stored && guideSlugs.has(stored)) source = stored;
    } catch {
      // Storage can be unavailable; attribution still works in this tab's memory.
    }
  }
  return source;
}

function rememberSource(slug: string) {
  if (initialSource()) return;
  source = slug;
  try {
    window.sessionStorage.setItem(sourceKey, slug);
  } catch {
    // Keep the same initial source in memory when storage is blocked.
  }
}

function send(name: string, fields: Record<string, string> = {}, page = '/') {
  if (!activeBrowser()) return;
  try {
    const analytics = window as Window & {
      gtag?: (command: string, name: string, fields: Record<string, string>) => void;
    };
    const guide = initialSource();
    analytics.gtag?.('event', name, {
      ...(guide ? { guide_slug: guide } : {}),
      ...fields,
      // GA's default document URL/referrer can contain room IDs or arbitrary queries.
      page_location: `https://avalon-game.com${page}`,
      page_referrer: '',
    });
  } catch {
    // Telemetry must never interrupt authentication, navigation or gameplay.
  }
}

function guidePath(slug: string, language: string): string {
  const prefix = ['ru', 'es', 'pt', 'zh-CN', 'zh-TW'].includes(language) ? `/${language.toLowerCase()}` : '';
  return `${prefix}/guides/${slug}/`;
}

export function trackGuideVisit(slug: string, language = 'en'): void {
  if (!activeBrowser() || !guideSlugs.has(slug)) return;
  rememberSource(slug);
  send('guide_visit', {}, guidePath(slug, language));
}

export function trackGuideCta(slug: string, destination: Destination, language = 'en'): void {
  if (!activeBrowser() || !guideSlugs.has(slug) || !['lobby', 'community', 'ai'].includes(destination)) return;
  rememberSource(slug);
  playIntent = destination;
  send('guide_cta', { destination }, guidePath(slug, language));
}

/** Successful auth consumes intent even if the user has moved to another context. */
export function consumePlayIntent(routeID: unknown): boolean {
  const intent = playIntent;
  playIntent = undefined;
  return (
    routeID === 'room' ||
    ((intent === 'lobby' || intent === 'ai') && routeID === 'lobby') ||
    (intent === 'community' && ['community', 'community_solo', 'community_group'].includes(String(routeID)))
  );
}

export function trackSignup(): void {
  send('sign_up');
}

/** Feed backend states, never the history pointer or a successful spectator subscription. */
export function trackRoomAcquisition(state: AcquisitionRoom, userID?: string, liveUpdate = false): void {
  if (!activeBrowser() || !userID || (state.ai && !state.ai.publicBotGame) || state.archived) return;
  const game = state.stage === 'started' ? state.game : undefined;
  const players = game?.players || state.players;
  if (!players.some((player) => player.id === userID)) return;
  if (game?.stage !== 'end' && !participated.has(state.roomID)) {
    participated.add(state.roomID);
    send(state.ai ? 'ai_room_participation' : 'room_participation');
  }
  if (!game) return;
  if (game.stage !== 'end') {
    observedGames.set(game.uuid, userID);
    return;
  }
  const observedParticipant = observedGames.get(game.uuid);
  observedGames.delete(game.uuid);
  if (
    liveUpdate &&
    observedParticipant === userID &&
    game.result?.winner &&
    game.result.reason !== 'manualy' &&
    !completed.has(game.uuid)
  ) {
    completed.add(game.uuid);
    send(state.ai ? 'ai_game_complete' : 'human_game_complete');
  }
}
