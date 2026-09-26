// Refuse a deployment that could discard a live game or waiting room.
const endReasons = new Set([
  'manualy',
  'evilTeamMissions',
  'goodTeamMissions',
  'missMerlin',
  'killMerlin',
  'missGuinevere',
  'killGuinevere',
  'missLovers',
  'killLovers',
  'missCleric',
  'killCleric',
  'rejectedVote',
]);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
function checkIdle(rooms) {
  // getRoomsList returns slice(0, 20); a full page cannot establish that the
  // complete inventory is idle. A fuller admin endpoint is needed to proceed.
  if (!Array.isArray(rooms) || rooms.length >= 20) {
    return { exitCode: 2, reason: 'Room inventory is invalid or potentially truncated', activeRooms: [] };
  }
  for (const room of rooms) {
    if (
      !isObject(room) ||
      typeof room.uuid !== 'string' ||
      !room.uuid.trim() ||
      !['created', 'locked', 'started'].includes(room.state) ||
      !Number.isInteger(room.players) ||
      room.players < 0 ||
      (room.result !== undefined &&
        (!isObject(room.result) ||
          room.state !== 'started' ||
          !endReasons.has(room.result.reason) ||
          (room.result.winner !== undefined && !['good', 'evil'].includes(room.result.winner))))
    ) {
      return { exitCode: 2, reason: 'Room inventory contains an invalid entry', activeRooms: [] };
    }
  }
  const activeRooms = rooms
    .filter((room) => room.result === undefined)
    .map((room) => ({ id: room.uuid, state: room.state, players: room.players }));
  return { exitCode: activeRooms.length ? 3 : 0, activeRooms };
}

module.exports = { checkIdle };
if (require.main === module) {
  const { io } = require('socket.io-client');
  const socket = io('https://avalon-game.com', { transports: ['websocket'], reconnection: false });
  const timer = setTimeout(() => {
    socket.close();
    process.exit(2);
  }, 15000);
  socket.on('connect', () =>
    socket.emit('getRoomsList', (rooms) => {
      const decision = checkIdle(rooms);
      console.log(JSON.stringify(decision));
      clearTimeout(timer);
      socket.close();
      process.exitCode = decision.exitCode;
    }),
  );
}
