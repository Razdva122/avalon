/* Local UI preview. Run: vue-cli-service serve preview/main.ts --port 8080 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApp, ref } from 'vue';
import { socket } from '@/api/socket';
import { store } from '@/store';
import { i18n } from '@/plugins/i18n';
import { vuetify } from '@/plugins/vuetify';
import PreviewControls from './PreviewControls.vue';

const ids = ['preview-you', 'preview-alex', 'preview-mira', 'preview-leon', 'preview-eva'];
const names = ['Вы', 'Алекс', 'Мира', 'Леон', 'Ева'];
const profiles = ids.map((id, index) => ({ id, name: names[index], avatar: 'servant', games: 0 }));
const stage = ref('selectTeam');
const missions = [2, 3, 2, 3, 3].map((players) => ({ players, failsRequired: 1 }));
const room: any = {
  roomID: 'beginner-preview',
  stage: 'started',
  leaderID: ids[0],
  createAt: new Date().toISOString(),
  startAt: new Date().toISOString(),
  options: { roles: { merlin: 1, percival: 1, morgana: 1 }, addons: { assassin: true }, features: {} },
  players: ids.map((id, i) => ({ id, isLeader: i === 0 })),
  chat: [
    {
      userID: ids[1],
      message: 'Предлагаю начать с тебя и Миры. После похода у нас появится первая информация.',
      timestamp: Date.now() - 10000,
    },
  ],
  ai: {
    beginner: true,
    publicBotGame: true,
    humanPlayerID: ids[0],
    humanPlayerIDs: [ids[0]],
    title: 'Первая игра',
    status: 'running',
    language: 'ru',
    playerCount: 5,
    botDifficulty: 'regular',
    fallbacks: 0,
    message: '',
    humanTimeBankMs: 300000,
    waitingForHuman: true,
  },
  game: {
    uuid: 'beginner-preview',
    stage: 'selectTeam',
    vote: 0,
    mission: 0,
    missionState: missions.map((m) => ({ ...m })),
    settings: {
      missions,
      players: { good: 3, evil: 2 },
      total: 5,
      roles: { good: ['merlin', 'percival', 'servant'], evil: ['morgana', 'minion'] },
    },
    history: [],
    addonsData: {},
    features: { displayIndex: true },
    players: ids.map((id, index) => ({
      id,
      index: index + 1,
      role: index === 0 ? 'servant' : 'unknown',
      validMissionsResult: index === 0 ? ['success'] : undefined,
      features: { isLeader: index === 0, isSelected: false, isSent: false, waitForAction: index === 0 },
    })),
  },
};
store.state.profile = { ...profiles[0], token: 'local-preview' } as any;
store.state.settings = { locale: { value: 'ru', isDefault: false }, colorTheme: 'light' };
store.state.connect = true;
store.state.users = Object.fromEntries(profiles.map((profile) => [profile.id, { status: 'ready', profile }])) as any;
// No network connection: all actions stay in this local sample room.
socket.connect = (() => socket) as any;
socket.timeout = (() => socket) as any;
function update() {
  (socket as any).emitEvent(['roomUpdated', structuredClone(room)]);
}
function setStage(next: string) {
  const team = room.game.players.filter((p: any) => p.features.isSelected || p.features.isSent).map((p: any) => p.id);
  stage.value = next;
  room.game.stage = ['discussion', 'fifth'].includes(next) ? 'selectTeam' : next;
  room.game.vote = next === 'fifth' ? 4 : 0;
  room.ai.waitingForDiscussion = next === 'discussion';
  room.ai.discussionPending = next === 'discussion';
  room.ai.waitingForHuman = next !== 'discussion';
  room.ai.humanActionExpiresAt = Date.now() + 90000;
  room.ai.humanActionBaseExpiresAt = room.ai.humanActionExpiresAt;
  room.game.players.forEach((p: any, i: number) => {
    p.features.isSelected = next === 'selectTeam' ? p.features.isSelected : false;
    p.features.isSent = ['votingForTeam', 'onMission'].includes(next) && (team.length ? team.includes(p.id) : i < 2);
    p.features.waitForAction = next === 'votingForTeam' || (i === 0 && next !== 'discussion');
  });
  update();
}
socket.emitWithAck = (async (event: string, ...args: any[]) => {
  if (event === 'joinRoom') return structuredClone(room);
  if (event === 'getOnlineCounter') return 5;
  if (event === 'getUserProfile') return profiles.find((p) => p.id === args[0]) || profiles[0];
  if (event === 'getUserRatings') return [];
  if (event === 'getPlayerGameSummariesPage') return { games: [], nextCursor: null };
  if (event === 'finishAiDiscussion') {
    setStage('selectTeam');
    return true;
  }
  return { error: 'requestFailed' };
}) as any;
socket.emit = ((event: string, ...args: any[]) => {
  if (event === 'selectPlayer') {
    const player = room.game.players.find((p: any) => p.id === args[1]);
    if (
      player &&
      (player.features.isSelected ||
        room.game.players.filter((p: any) => p.features.isSelected).length < missions[room.game.mission].players)
    )
      player.features.isSelected = !player.features.isSelected;
    update();
  }
  if (event === 'sentSelectedPlayers') setStage(room.game.vote === 4 ? 'onMission' : 'votingForTeam');
  if (event === 'voteForMission') setStage(args[1] === 'approve' ? 'onMission' : 'selectTeam');
  if (event === 'actionOnMission') {
    room.game.missionState[0].result = 'success';
    room.game.mission = 1;
    setStage('selectTeam');
  }
  const callback = args.at(-1);
  if (typeof callback === 'function') callback(true);
  return socket;
}) as any;

window.addEventListener(
  'avalon:ready',
  () => {
    const host = document.createElement('div');
    host.id = 'beginner-preview-controls';
    document.body.appendChild(host);
    requestAnimationFrame(() => createApp(PreviewControls, { stage, setStage }).use(i18n).use(vuetify).mount(host));
  },
  { once: true },
);
void import('@/main');
