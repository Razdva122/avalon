// Local Socket.IO room for the production playground check; no real accounts or rooms.
const fs = require('node:fs');
const path = require('node:path');
const { Server } = require('socket.io');
module.exports = function playgroundRoom(app, server, dist) {
  const ids = ['playground-human', 'playground-alice', 'playground-boris', 'playground-victor', 'playground-daria'];
  const names = ['Вы', 'Алиса', 'Борис', 'Виктор', 'Дарья'];
  const roles = ['servant', 'morgana', 'merlin', 'mordred', 'percival'];
  const profiles = Object.fromEntries(
    ids.map((id, i) => [
      id,
      { id, name: names[i], login: id, avatar: roles[i], premium: false, knownAchievements: [], games: 10, win: 5 },
    ]),
  );
  const missions = [2, 3, 2, 3, 3].map((players) => ({ players, failsRequired: 1 }));
  const room = {
    roomID: 'playground-preview',
    stage: 'started',
    leaderID: ids[1],
    createAt: new Date().toISOString(),
    players: ids.map((id, i) => ({ id, isLeader: i === 1 })),
    chat: [],
    options: { roles: ['percival', 'mordred', 'morgana'], addons: [], features: { displayIndex: true } },
    game: {
      uuid: 'playground-preview',
      stage: 'selectTeam',
      vote: 0,
      mission: 0,
      settings: {
        total: 5,
        players: { good: 3, evil: 2 },
        roles: { good: ['merlin', 'percival', 'servant'], evil: ['mordred', 'morgana'] },
        missions,
      },
      players: ids.map((id, i) => ({
        id,
        index: i + 1,
        role: i === 0 ? 'servant' : 'unknown',
        features: { isLeader: i === 1, waitForAction: i === 1 },
      })),
      missionState: missions.map((settings) => ({ ...settings })),
      history: [],
      addonsData: {},
      features: { displayIndex: true },
      timer: { active: false },
    },
  };
  // Route only this test server's browser client to its local Socket.IO fixture.
  app.get('/js/app.*.js', (req, res) => {
    const source = fs.readFileSync(path.join(dist, req.path), 'utf8');
    const origin = `http://127.0.0.1:${server.address().port}`;
    const patched = source.replaceAll('"avalon-game.com"', JSON.stringify(origin));
    if (source === patched) throw Error('Local socket endpoint was not found in the production artifact');
    res.type('js').send(patched);
  });
  const io = new Server(server, { cors: { origin: true, credentials: true } });
  io.on('connection', (socket) =>
    socket.onAny((event, ...args) => {
      const ack = args.at(-1);
      if (typeof ack !== 'function') return;
      if (event === 'joinRoom') return ack(room);
      if (event === 'getMyProfile') return ack(profiles[ids[0]]);
      if (event === 'getUserProfile') return ack(profiles[args[0]] || profiles[ids[0]]);
      if (event === 'getOnlineCounter') return ack(5);
      if (event === 'getVoiceState') return ack({ available: true, canJoin: true, participantCount: 0 });
      if (event === 'getUserAchievements') return ack([]);
      if (event === 'getMyStickers') return ack({ stickers: [], equipped: [] });
      ack({ error: 'forbidden' });
    }),
  );
  return { profile: profiles[ids[0]], io, room };
};
